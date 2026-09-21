import React, { useState, useEffect } from 'react';
import {
  NativeModules, View, Text, TouchableOpacity, FlatList, StyleSheet, Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Share2, Eye, Trash2, Download, LayoutTemplate } from 'lucide-react-native';

import { saveToolHistory, getToolHistory, deleteToolHistory } from '../../services/ToolHistoryManager';
import { COLORS } from '../../theme/colors';

const { CollageModule, FileShareModule, FileSaverModule } = NativeModules;

const TOOL_ID = 'COLLAGE_MAKER';

const CollageScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [savedItems, setSavedItems] = useState({});

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getToolHistory(TOOL_ID);
    setHistory(data);
  };

  const handleCreateCollage = async () => {
    try {
      // فراخوانی اکتیویتی نیتیو کاتلین برای ساخت کلاژ
      const resultPath = await CollageModule.openCollageMaker();
      
      if (resultPath) {
        const stat = await ReactNativeBlobUtil.fs.stat(resultPath);
        const sizeStr = (stat.size / 1024).toFixed(0) + " KB";
        const fileName = resultPath.split('/').pop() || `collage_${Date.now()}.jpg`;
        
        // ذخیره در تاریخچه کیتایار
        await saveToolHistory(TOOL_ID, fileName, resultPath, sizeStr, 'JPEG');
        loadHistory();
      }
    } catch (err) {
      if (err !== 'CANCEL' && err !== 'CANCELLED' && err?.message !== 'کاربر لغو کرد') {
        Alert.alert("خطا", err.message || JSON.stringify(err));
      }
    }
  };

  const handleDelete = async (id) => {
    const updatedList = await deleteToolHistory(TOOL_ID, id);
    setHistory(updatedList);
  };

  const handleShare = async (path) => {
    try {
      await FileShareModule.shareFile(path, 'image/jpeg');
    } catch (err) {
      Alert.alert("خطا", "امکان اشتراک‌گذاری این فایل وجود ندارد.");
    }
  };

  const handleSaveToDevice = async (item) => {
    try {
      // استفاده از ماژول فایل سیور برای ذخیره پایدار در گالری
      await FileSaverModule.saveFile(item.resultPath, true);
      
      setSavedItems(prev => ({ ...prev, [item.id]: true }));
      setTimeout(() => {
        setSavedItems(prev => ({ ...prev, [item.id]: false }));
      }, 3000);
    } catch (err) {
      console.log('Error saving file:', err);
      Alert.alert("خطا", "ذخیره فایل با مشکل مواجه شد. لطفاً دسترسی‌ها را بررسی کنید.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.actionBox}>
        <View style={styles.actionHeader}>
          <LayoutTemplate color={COLORS.primary} size={35} />
          <Text style={styles.actionTitle}>ترکیب عکس (کلاژ)</Text>
        </View>
        <Text style={styles.actionDesc}>
          چند عکس انتخاب کنید، قالب دلخواه را برگزینید و آن‌ها را با هم ترکیب کنید.
        </Text>
        <TouchableOpacity style={styles.convertButton} onPress={handleCreateCollage}>
          <Text style={styles.convertButtonText}>ساخت کلاژ جدید</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>تاریخچه کلاژهای ساخته شده</Text>
      
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>هنوز کلاژی نساخته‌اید.</Text>}
        renderItem={({ item }) => (
          <View style={styles.historyCard}>
            
            {/* دکمه حذف به صورت شناور (بالا سمت راست) */}
            <TouchableOpacity style={styles.absoluteDeleteBtn} onPress={() => handleDelete(item.id)}>
              <Trash2 color="#e74c3c" size={18} />
            </TouchableOpacity>

            <View style={styles.historyContent}>
              <View style={styles.previewBox}>
                <Image source={{ uri: `file://${item.resultPath}` }} style={styles.thumbnail} />
              </View>
              <View style={[styles.infoBox, { paddingRight: 40 }]}>
                <Text style={styles.historyTitle} numberOfLines={1} ellipsizeMode="middle">
                  {item.title}
                </Text>
                <View style={styles.metaDataRow}>
                  <Text style={styles.metaText}>{item.size}</Text>
                  <Text style={styles.metaDivider}>|</Text>
                  <Text style={styles.metaText}>{item.format}</Text>
                </View>
                <Text style={styles.historyDate}>
                  {new Date(item.date).toLocaleDateString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>

            <View style={styles.actionButtonsRow}>
              {/* دکمه ذخیره در گالری */}
              <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={() => handleSaveToDevice(item)}>
                <Download color="#27ae60" size={16} />
                <View style={styles.actionTextCol}>
                  <Text style={[styles.actionText, {color: '#27ae60'}]}>ذخیره گالری</Text>
                  {savedItems[item.id] && <Text style={styles.savedSuccessText}>✓ ذخیره شد</Text>}
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, styles.shareBtn]} onPress={() => handleShare(item.resultPath)}>
                <Share2 color="#3498db" size={16} />
                <Text style={[styles.actionText, {color: '#3498db'}]}>اشتراک</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.actionBtn, styles.viewBtn]} onPress={() => navigation.navigate('ImageViewerScreen', { path: `file://${item.resultPath}` })}>
                <Eye color="#2ecc71" size={16} />
                <Text style={[styles.actionText, {color: '#2ecc71'}]}>مشاهده</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  
  actionBox: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 3, marginBottom: 25 },
  actionHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', marginBottom: 10, gap: 10 },
  actionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
  actionDesc: { fontSize: 13, color: '#7f8c8d', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  convertButton: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, alignItems: 'center' },
  convertButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'right', color: '#333' },
  emptyText: { textAlign: 'center', color: '#95a5a6', marginTop: 20 },
  
  historyCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, elevation: 2, overflow: 'hidden', position: 'relative' },
  
  // دکمه حذف به بالا سمت راست منتقل شد
  absoluteDeleteBtn: { position: 'absolute', top: 10, right: 10, zIndex: 10, padding: 6, backgroundColor: 'rgba(253, 237, 236, 0.9)', borderRadius: 8 },
  
  historyContent: { flexDirection: 'row-reverse', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f2f6' },
  previewBox: { marginLeft: 15, justifyContent: 'center' },
  thumbnail: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#f5f6fa', resizeMode: 'cover' },
  infoBox: { flex: 1, alignItems: 'flex-end', justifyContent: 'center' },
  historyTitle: { fontWeight: 'bold', fontSize: 14, color: '#2c3e50', marginBottom: 6, textAlign: 'right', direction: 'ltr' },
  
  metaDataRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 4 },
  metaText: { fontSize: 11, color: '#7f8c8d', fontWeight: 'bold' },
  metaDivider: { marginHorizontal: 6, color: '#bdc3c7', fontSize: 10 },
  historyDate: { fontSize: 11, color: '#bdc3c7' },
  
  actionButtonsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', padding: 10, gap: 8, backgroundColor: '#fafbfc' },
  actionBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 5 },
  saveBtn: { flex: 1.2, backgroundColor: '#e9f7ef' },
  shareBtn: { flex: 1, backgroundColor: '#ebf5fb' },
  viewBtn: { flex: 1, backgroundColor: '#f4f6f7' }, 
  
  actionTextCol: { alignItems: 'center' },
  actionText: { fontSize: 12, fontWeight: 'bold' },
  savedSuccessText: { color: '#27ae60', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
});

export default CollageScreen;