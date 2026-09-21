import React, { useState, useEffect } from 'react';
import {
  NativeModules, View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Share2, Trash2, Download, Music, FileAudio, Eye } from 'lucide-react-native';

import { saveToolHistory, getToolHistory, deleteToolHistory } from '../../services/ToolHistoryManager';
import { COLORS } from '../../theme/colors';

const { FileShareModule, FileSaverModule, VideoProcessorModule, VideoPickerModule } = NativeModules;
const TOOL_ID = 'VIDEO_TO_AUDIO';

const VideoToAudioScreen = () => {
  const [history, setHistory] = useState([]);
  const [savedItems, setSavedItems] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { loadHistory(); }, []);
  const loadHistory = async () => { setHistory(await getToolHistory(TOOL_ID)); };

  const handlePickAndConvert = async () => {
    try {
      // استفاده از پیکر نیتیو کاتلین
      const videoUri = await VideoPickerModule.pickVideo();
      if (!videoUri) return;

      setIsLoading(true);
      
      const resultPath = await VideoProcessorModule.extractAudio(videoUri);
      
      const stat = await ReactNativeBlobUtil.fs.stat(resultPath);
      const sizeStr = (stat.size / (1024 * 1024)).toFixed(2) + " MB";
      const fileName = `audio_${Date.now()}.m4a`;
      
      await saveToolHistory(TOOL_ID, fileName, resultPath, sizeStr, 'M4A');
      loadHistory();
      Alert.alert("عملیات موفق", "صوت ویدیو با موفقیت استخراج شد.");
    } catch (err) {
      if (err !== 'CANCELLED' && err.code !== 'CANCELLED') {
        Alert.alert("خطا", err.message || "خطا در استخراج صوت");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => { setHistory(await deleteToolHistory(TOOL_ID, id)); };
  const handleShare = async (path) => {
    try { await FileShareModule.shareFile(path, 'audio/mp4'); } catch (err) {}
  };
  const handleSaveToDevice = async (item) => {
    try {
      await FileSaverModule.saveFile(item.resultPath, false);
      setSavedItems(prev => ({ ...prev, [item.id]: true }));
      setTimeout(() => setSavedItems(prev => ({ ...prev, [item.id]: false })), 3000);
    } catch (err) { Alert.alert("خطا", "ذخیره فایل با مشکل مواجه شد."); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.actionBox}>
        <View style={styles.actionHeader}>
          <Music color={COLORS.primary} size={35} />
          <Text style={styles.actionTitle}>استخراج صوت از ویدیو</Text>
        </View>
        <Text style={styles.actionDesc}>یک ویدیو انتخاب کنید تا صدای آن به صورت یک فایل صوتی جداگانه استخراج و ذخیره شود.</Text>
        <TouchableOpacity style={styles.convertButton} onPress={handlePickAndConvert} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.convertButtonText}>انتخاب ویدیو و استخراج</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>تاریخچه خروجی‌ها</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.historyCard}>
            <TouchableOpacity style={styles.absoluteDeleteBtn} onPress={() => handleDelete(item.id)}>
              <Trash2 color="#e74c3c" size={18} />
            </TouchableOpacity>
            <View style={styles.historyContent}>
              <View style={styles.iconWrapper}><FileAudio color="#8e44ad" size={30} /></View>
              <View style={[styles.infoBox, { paddingRight: 40 }]}>
                <Text style={styles.historyTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.metaDataRow}>
                  <Text style={styles.metaText}>{item.size}</Text>
                  <Text style={styles.metaDivider}>|</Text>
                  <Text style={styles.metaText}>{item.format}</Text> 
                </View>
              </View>
            </View>
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={() => handleSaveToDevice(item)}>
                <Download color="#27ae60" size={16} />
                <View style={styles.actionTextCol}>
                  <Text style={[styles.actionText, {color: '#27ae60'}]}>ذخیره فایل</Text>
                  {savedItems[item.id] && <Text style={styles.savedSuccessText}>✓ ذخیره شد</Text>}
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.shareBtn]} onPress={() => handleShare(item.resultPath)}>
                <Share2 color="#3498db" size={16} /><Text style={[styles.actionText, {color: '#3498db'}]}>اشتراک</Text>
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
  actionDesc: { fontSize: 13, color: '#7f8c8d', textAlign: 'center', marginBottom: 20 },
  convertButton: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, alignItems: 'center' },
  convertButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'right', color: '#333' },
  historyCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, elevation: 2, overflow: 'hidden', position: 'relative' },
  absoluteDeleteBtn: { position: 'absolute', top: 10, right: 10, zIndex: 10, padding: 6, backgroundColor: 'rgba(253, 237, 236, 0.9)', borderRadius: 8 },
  historyContent: { flexDirection: 'row-reverse', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f2f6', alignItems: 'center' },
  iconWrapper: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#f4ecf7', justifyContent: 'center', alignItems: 'center', marginLeft: 15 },
  infoBox: { flex: 1, alignItems: 'flex-end', justifyContent: 'center' },
  historyTitle: { fontWeight: 'bold', fontSize: 14, color: '#2c3e50', marginBottom: 6, textAlign: 'right', direction: 'ltr' },
  metaDataRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  metaText: { fontSize: 11, color: '#7f8c8d', fontWeight: 'bold' },
  metaDivider: { marginHorizontal: 6, color: '#bdc3c7', fontSize: 10 },
  actionButtonsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', padding: 10, gap: 8, backgroundColor: '#fafbfc' },
  actionBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 5 },
  saveBtn: { flex: 1.2, backgroundColor: '#e9f7ef' },
  shareBtn: { flex: 1, backgroundColor: '#ebf5fb' },
  actionTextCol: { alignItems: 'center' },
  actionText: { fontSize: 12, fontWeight: 'bold' },
  savedSuccessText: { color: '#27ae60', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
});

export default VideoToAudioScreen;