import React, { useState, useEffect } from 'react';
import {
  NativeModules, View, Text, TouchableOpacity, FlatList, StyleSheet, Alert,
  ActivityIndicator, Image, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Share2, Repeat, Eye, Trash2, X, Download } from 'lucide-react-native';

import FilePickerModule from '../../native/FilePicker';
import ImageConverter, { SUPPORTED_TARGET_FORMATS } from '../../native/ImageConverter';
import { saveToolHistory, getToolHistory, deleteToolHistory } from '../../services/ToolHistoryManager';
import { COLORS } from '../../theme/colors';

const { FileShareModule, FileSaverModule } = NativeModules;

const ImageConverterScreen = ({ route, navigation }) => {
  const headerTitle = route?.params?.title || "تبدیل فرمت عکس";
  const toolType = 'IMAGE_CONVERTER';

  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedItems, setSavedItems] = useState({});

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [detectedFormat, setDetectedFormat] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getToolHistory(toolType);
    setHistory(data);
  };

  const handlePickImage = async () => {
    try {
      const urisArray = await FilePickerModule.pickImage();
      const uri = Array.isArray(urisArray) ? urisArray[0] : urisArray;
      if (!uri) return;

      setIsLoading(true);
      const detection = await ImageConverter.detectFormat(uri);
      
      if (!detection.supported) {
        Alert.alert('فرمت ناشناخته', 'فرمت این تصویر پشتیبانی نمی‌شود.');
        setIsLoading(false);
        return;
      }

      setSelectedImageUri(uri);
      setDetectedFormat(detection);
      setIsModalVisible(true);
    } catch (err) {
      if (err.code !== 'CANCELLED') Alert.alert("خطا", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvert = async (targetFormat) => {
    if (!selectedImageUri) return;
    
    setIsModalVisible(false);
    setIsLoading(true);

    try {
      const result = await ImageConverter.convert(selectedImageUri, targetFormat, 90);
      
      const fileName = `Convert_${Date.now()}.${targetFormat.toLowerCase()}`;
      const stat = await ReactNativeBlobUtil.fs.stat(result.path);
      const sizeStr = (stat.size / 1024).toFixed(0) + " KB";
      
      await saveToolHistory(toolType, fileName, result.path, sizeStr, targetFormat);
      loadHistory();
      
      setSelectedImageUri(null);
      setDetectedFormat(null);
    } catch (err) {
      Alert.alert('خطا در تبدیل', err.message || JSON.stringify(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const updatedList = await deleteToolHistory(toolType, id);
    setHistory(updatedList);
  };

  const handleShare = async (path, format) => {
    try {
      let mimeType = 'image/jpeg';
      if (format === 'PNG') mimeType = 'image/png';
      if (format === 'WEBP') mimeType = 'image/webp';
      
      await FileShareModule.shareFile(path, mimeType);
    } catch (err) {
      Alert.alert("خطا", "امکان اشتراک‌گذاری این فایل وجود ندارد.");
    }
  };

  const handleSaveToDevice = async (item) => {
    try {
      await FileSaverModule.saveFile(item.resultPath, true);
      
      setSavedItems(prev => ({ ...prev, [item.id]: true }));
      setTimeout(() => {
        setSavedItems(prev => ({ ...prev, [item.id]: false }));
      }, 3000);
    } catch (err) {
      console.log('Error saving file:', err);
      Alert.alert("خطا", "ذخیره فایل با مشکل مواجه شد.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.actionBox}>
        <View style={styles.actionHeader}>
          <Repeat color={COLORS.primary} size={35} />
          <Text style={styles.actionTitle}>{headerTitle}</Text>
        </View>
        <TouchableOpacity style={styles.convertButton} onPress={handlePickImage} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.convertButtonText}>انتخاب عکس و تبدیل</Text>}
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
              <View style={styles.previewBox}>
                <Image source={{ uri: `file://${item.resultPath}` }} style={styles.thumbnail} />
              </View>
              <View style={[styles.infoBox, { paddingRight: 40 }]}>
                <Text style={styles.historyTitle} numberOfLines={1}>{item.title}</Text>
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
              <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={() => handleSaveToDevice(item)}>
                <Download color="#27ae60" size={16} />
                <View style={styles.actionTextCol}>
                  <Text style={[styles.actionText, {color: '#27ae60'}]}>ذخیره گالری</Text>
                  {savedItems[item.id] && <Text style={styles.savedSuccessText}>✓ ذخیره شد</Text>}
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, styles.shareBtn]} onPress={() => handleShare(item.resultPath, item.format)}>
                <Share2 color="#3498db" size={16} /><Text style={[styles.actionText, {color: '#3498db'}]}>اشتراک</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.actionBtn, styles.viewBtn]} onPress={() => navigation.navigate('ImageViewerScreen', { path: `file://${item.resultPath}` })}>
                <Eye color="#2ecc71" size={16} /><Text style={[styles.actionText, {color: '#2ecc71'}]}>مشاهده</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <View style={styles.fullModalOverlay}>
          <View style={styles.fullModalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <X color="#7f8c8d" size={24} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>تبدیل به چه فرمتی؟</Text>
            </View>

            {selectedImageUri && (
              <View style={styles.modalPreviewCard}>
                <Image source={{ uri: selectedImageUri }} style={styles.modalThumbnail} />
                <View>
                  <Text style={styles.modalFormatText}>فرمت فعلی:</Text>
                  <Text style={styles.modalFormatBadge}>{detectedFormat?.format || 'نامشخص'}</Text>
                </View>
              </View>
            )}
            
            <View style={styles.formatsGrid}>
              {SUPPORTED_TARGET_FORMATS
                .filter((f) => f !== detectedFormat?.format)
                .map((format) => (
                  <TouchableOpacity key={format} style={styles.formatBtn} onPress={() => handleConvert(format)}>
                    <Text style={styles.formatBtnText}>{format}</Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  actionBox: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 3, marginBottom: 25 },
  actionHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', marginBottom: 20, gap: 10 },
  actionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
  convertButton: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, alignItems: 'center' },
  convertButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'right', color: '#333' },
  historyCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, elevation: 2, overflow: 'hidden', position: 'relative' },
  
  absoluteDeleteBtn: { position: 'absolute', top: 10, right: 10, zIndex: 10, padding: 6, backgroundColor: 'rgba(253, 237, 236, 0.9)', borderRadius: 8 },
  
  historyContent: { flexDirection: 'row-reverse', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f2f6' },
  previewBox: { marginLeft: 15, justifyContent: 'center' },
  thumbnail: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#f5f6fa', resizeMode: 'cover' },
  infoBox: { flex: 1, alignItems: 'flex-end', justifyContent: 'center' },
  historyTitle: { fontWeight: 'bold', fontSize: 14, color: '#2c3e50', marginBottom: 6, textAlign: 'right' },
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
  
  fullModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  fullModalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  
  modalPreviewCard: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#e1e8ed', gap: 15 },
  modalThumbnail: { width: 50, height: 50, borderRadius: 8, resizeMode: 'cover' },
  modalFormatText: { fontSize: 12, color: '#7f8c8d', textAlign: 'right', marginBottom: 4 },
  modalFormatBadge: { backgroundColor: '#eaf4fc', color: '#2980b9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, fontWeight: 'bold', fontSize: 13, overflow: 'hidden' },

  formatsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  formatBtn: { backgroundColor: COLORS.primary, paddingVertical: 15, paddingHorizontal: 25, borderRadius: 10, elevation: 2, minWidth: '30%', alignItems: 'center' },
  formatBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});

export default ImageConverterScreen;