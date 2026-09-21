import React, { useState, useEffect } from 'react';
import { 
    NativeModules,
  View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, 
  ActivityIndicator, Image, Modal, TextInput 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Share2, FileText, Image as ImageIcon, Eye, Trash2, Plus, ArrowUp, ArrowDown, Download } from 'lucide-react-native';
import FilePickerModule from '../../native/FilePicker';
import PdfConverterModule from '../../native/PdfConverter';
import { saveToolHistory, getToolHistory, deleteToolHistory } from '../../services/ToolHistoryManager';
import { COLORS } from '../../theme/colors';

const { FileShareModule, FileSaverModule } = NativeModules;

const ConverterScreen = ({ route, navigation }) => {
  const { toolType, title: headerTitle } = route.params;
  const isImageToPdf = toolType === 'IMAGE_TO_PDF';
  
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isImagesModalVisible, setIsImagesModalVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [outputFileName, setOutputFileName] = useState('');
  
  const [savedItems, setSavedItems] = useState({});

  useEffect(() => {
    loadHistory();
  }, [toolType]);

  const loadHistory = async () => {
    const data = await getToolHistory(toolType);
    setHistory(data);
  };

  const handlePickImages = async () => {
    try {
      const uris = await FilePickerModule.pickMultipleImages();
      setSelectedImages([...selectedImages, ...uris]);
      setOutputFileName(`Sanad_${Date.now()}`);
      setIsImagesModalVisible(true);
    } catch (err) {
      if (err.code !== 'CANCELLED') Alert.alert("خطا", err.message);
    }
  };

  const moveImage = (index, direction) => {
    const newImages = [...selectedImages];
    if (direction === 'up' && index > 0) {
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    } else if (direction === 'down' && index < newImages.length - 1) {
      [newImages[index + 1], newImages[index]] = [newImages[index], newImages[index + 1]];
    }
    setSelectedImages(newImages);
  };

  const removeImage = (index) => {
    const newImages = [...selectedImages];
    newImages.splice(index, 1);
    setSelectedImages(newImages);
  };

  const handleConfirmImagesToPdf = async () => {
    if (selectedImages.length === 0) return Alert.alert("خطا", "عکسی انتخاب نشده است.");
    setIsImagesModalVisible(false);
    setIsLoading(true);
    
    try {
      const finalName = (outputFileName.trim() || `kitayar_${Date.now()}`).replace(/[^a-zA-Z0-9_\-آ-ی ]/g, '');
      const resultPath = await PdfConverterModule.imagesToPdf(selectedImages, finalName);
      
      const stat = await ReactNativeBlobUtil.fs.stat(resultPath);
      const sizeStr = (stat.size / (1024 * 1024)).toFixed(2) + " MB";
      
      await saveToolHistory(toolType, `${finalName}.pdf`, resultPath, sizeStr, 'PDF');
      loadHistory();
      setSelectedImages([]);
    } catch (err) {
      Alert.alert("خطا در ساخت PDF", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickPdfForExtraction = async () => {
    try {
      const urisArray = await FilePickerModule.pickPdf();
      const uri = Array.isArray(urisArray) ? urisArray[0] : urisArray;
      
      let safeName = uri.split('/').pop().split('.')[0].replace(/[^a-zA-Z0-9_\-آ-ی]/g, '_');
      if (!safeName || safeName.length < 2) safeName = `Extract_${Date.now()}`;
      
      setIsLoading(true);
      const resultPaths = await PdfConverterModule.selectAndExtractPdfPages(uri, safeName);
      
      if (resultPaths && resultPaths.length > 0) {
        for (const path of resultPaths) {
          const fileName = path.split('/').pop();
          const stat = await ReactNativeBlobUtil.fs.stat(path);
          const sizeStr = (stat.size / 1024).toFixed(0) + " KB";
          await saveToolHistory(toolType, fileName, path, sizeStr, 'PNG');
        }
        loadHistory();
        Alert.alert("عملیات موفق", `${resultPaths.length} عکس استخراج شد.`);
      }
    } catch (err) {
      if (err !== 'CANCELLED' && err?.message !== 'عملیات لغو شد') {
        Alert.alert("خطا", err.message || JSON.stringify(err));
      }
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
      const mimeType = format === 'PDF' ? 'application/pdf' : 'image/png';
      await FileShareModule.shareFile(path, mimeType);
    } catch (err) {
      Alert.alert("خطا", "امکان اشتراک‌گذاری این فایل وجود ندارد.");
    }
  };

  const handleSaveToDevice = async (item) => {
    try {
      const isImage = item.format !== 'PDF';
      // فراخوانی ماژول کاتلین برای ذخیره مستقیم و پایدار در MediaStore
      await FileSaverModule.saveFile(item.resultPath, isImage);
      
      setSavedItems(prev => ({ ...prev, [item.id]: true }));
      setTimeout(() => {
        setSavedItems(prev => ({ ...prev, [item.id]: false }));
      }, 3000);
      
    } catch (err) {
      console.log('Error saving file:', err);
      Alert.alert("خطا", "ذخیره فایل با مشکل مواجه شد. لطفاً دسترسی حافظه را بررسی کنید.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.actionBox}>
        <View style={styles.actionHeader}>
          {isImageToPdf ? <FileText color={COLORS.primary} size={35} /> : <ImageIcon color="#e67e22" size={35} />}
          <Text style={styles.actionTitle}>{headerTitle}</Text>
        </View>
        <TouchableOpacity style={styles.convertButton} onPress={isImageToPdf ? handlePickImages : handlePickPdfForExtraction} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.convertButtonText}>انتخاب فایل و شروع</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>تاریخچه خروجی‌ها</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.historyCard}>
            
            {/* دکمه حذف تغییر یافته به بالا سمت راست */}
            <TouchableOpacity style={styles.absoluteDeleteBtn} onPress={() => handleDelete(item.id)}>
              <Trash2 color="#e74c3c" size={18} />
            </TouchableOpacity>

            <View style={styles.historyContent}>
              <View style={styles.previewBox}>
                {item.format === 'PNG' ? (
                  <Image source={{ uri: `file://${item.resultPath}` }} style={styles.thumbnail} />
                ) : (
                  <View style={styles.pdfIconWrapper}><FileText color="#e74c3c" size={28} /></View>
                )}
              </View>
              <View style={[styles.infoBox, { paddingRight: 40 }]}>
                <Text style={styles.historyTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.metaDataRow}>
                  <Text style={styles.metaText}>{item.size}</Text>
                  <Text style={styles.metaDivider}>|</Text>
                  <Text style={styles.metaText}>{item.format}</Text>
                </View>
                <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            </View>

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={() => handleSaveToDevice(item)}>
                <Download color="#27ae60" size={16} />
                <View style={styles.actionTextCol}>
                  <Text style={[styles.actionText, {color: '#27ae60'}]}>
                    {item.format === 'PDF' ? 'ذخیره گوشی' : 'ذخیره گالری'}
                  </Text>
                  {savedItems[item.id] && <Text style={styles.savedSuccessText}>✓ ذخیره شد</Text>}
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, styles.shareBtn]} onPress={() => handleShare(item.resultPath, item.format)}>
                <Share2 color="#3498db" size={16} /><Text style={[styles.actionText, {color: '#3498db'}]}>اشتراک</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, styles.viewBtn]} onPress={() => navigation.navigate(isImageToPdf ? 'PdfViewerScreen' : 'ImageViewerScreen', { path: `file://${item.resultPath}` })}>
                <Eye color="#2ecc71" size={16} /><Text style={[styles.actionText, {color: '#2ecc71'}]}>مشاهده</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={isImagesModalVisible} transparent={true} animationType="slide">
        <View style={styles.fullModalOverlay}>
          <View style={styles.fullModalContainer}>
            <Text style={styles.modalTitle}>ترتیب صفحات و ذخیره</Text>
            <TextInput style={styles.nameInput} placeholder="نام فایل خروجی" value={outputFileName} onChangeText={setOutputFileName} />
            
            <FlatList
              data={selectedImages}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: '60%' }}
              ListHeaderComponent={
                <TouchableOpacity style={styles.addMoreBtn} onPress={handlePickImages}>
                  <Plus color="#fff" size={20} />
                  <Text style={styles.addMoreText}>افزودن عکس جدید</Text>
                </TouchableOpacity>
              }
              renderItem={({ item, index }) => (
                <View style={styles.verticalImageCard}>
                  <View style={styles.verticalImageRight}>
                    <Text style={styles.verticalIndexBadge}>{index + 1}</Text>
                    <Image source={{ uri: item }} style={styles.verticalThumbnail} />
                  </View>
                  <View style={styles.verticalControls}>
                    <TouchableOpacity style={styles.ctrlBtn} onPress={() => moveImage(index, 'up')}><ArrowUp color="#7f8c8d" size={24} /></TouchableOpacity>
                    <TouchableOpacity style={styles.ctrlBtn} onPress={() => removeImage(index)}><Trash2 color="#e74c3c" size={22} /></TouchableOpacity>
                    <TouchableOpacity style={styles.ctrlBtn} onPress={() => moveImage(index, 'down')}><ArrowDown color="#7f8c8d" size={24} /></TouchableOpacity>
                  </View>
                </View>
              )}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setIsImagesModalVisible(false)}><Text style={styles.modalBtnCancelText}>انصراف</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={handleConfirmImagesToPdf}><Text style={styles.modalBtnConfirmText}>ساخت PDF</Text></TouchableOpacity>
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
  
  // دکمه حذف به بالا سمت راست منتقل شد
  absoluteDeleteBtn: { position: 'absolute', top: 10, right: 10, zIndex: 10, padding: 6, backgroundColor: 'rgba(253, 237, 236, 0.9)', borderRadius: 8 },
  
  historyContent: { flexDirection: 'row-reverse', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f2f6' },
  previewBox: { marginLeft: 15, justifyContent: 'center' },
  thumbnail: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#f5f6fa', resizeMode: 'cover' },
  pdfIconWrapper: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#fdedec', justifyContent: 'center', alignItems: 'center' },
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
  fullModalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', textAlign: 'right' },
  nameInput: { backgroundColor: '#f5f6fa', borderWidth: 1, borderColor: '#dcdde1', borderRadius: 8, paddingHorizontal: 15, height: 50, textAlign: 'right', marginVertical: 15 },
  modalButtons: { flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 10, marginTop: 15 },
  modalBtnCancel: { flex: 1, backgroundColor: '#f1f2f6', padding: 14, borderRadius: 8, alignItems: 'center' },
  modalBtnConfirm: { flex: 2, backgroundColor: COLORS.primary, padding: 14, borderRadius: 8, alignItems: 'center' },
  modalBtnCancelText: { color: '#7f8c8d', fontWeight: 'bold', fontSize: 15 },
  modalBtnConfirmText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  addMoreBtn: { flexDirection: 'row-reverse', backgroundColor: '#34495e', padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  addMoreText: { color: '#fff', fontWeight: 'bold', marginRight: 8, fontSize: 15 },
  verticalImageCard: { flexDirection: 'row-reverse', backgroundColor: '#f8f9fa', borderRadius: 10, marginBottom: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e1e8ed', justifyContent: 'space-between' },
  verticalImageRight: { flexDirection: 'row-reverse', alignItems: 'center' },
  verticalIndexBadge: { backgroundColor: COLORS.primary, color: '#fff', width: 26, height: 26, borderRadius: 13, textAlign: 'center', lineHeight: 26, marginLeft: 15, fontWeight: 'bold', overflow: 'hidden' },
  verticalThumbnail: { width: 60, height: 80, borderRadius: 6, resizeMode: 'cover' },
  verticalControls: { flexDirection: 'row-reverse', gap: 15, alignItems: 'center', paddingRight: 10 },
  ctrlBtn: { padding: 5 }
});

export default ConverterScreen;