import React, { useState, useEffect } from 'react';
import {
  NativeModules, View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, 
  ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { 
  Share2, Trash2, Download, Eye, FileText, 
  Layers, FileMinus, Droplet, RotateCw, Lock, Scissors
} from 'lucide-react-native';

import FilePickerModule from '../../native/FilePicker';
import { saveToolHistory, getToolHistory, deleteToolHistory } from '../../services/ToolHistoryManager';
import { COLORS } from '../../theme/colors';

const { FileShareModule, FileSaverModule, AdvancedPdfModule } = NativeModules;

const ADVANCED_TOOLS_CONFIG = {
  'MERGE_PDF': { title: 'ترکیب فایل‌های PDF', desc: 'چند فایل PDF انتخاب کنید تا با هم ادغام شوند.', Icon: Layers, color: '#3498db', requiresParam: false },
  'SPLIT_PDF': { title: 'استخراج صفحه', desc: 'شماره صفحه‌ای که می‌خواهید جدا شود را وارد کنید.', Icon: Scissors, color: '#e74c3c', requiresParam: true, paramPlaceholder: 'مثال: 1' },
  'DELETE_PAGES': { title: 'حذف صفحات PDF', desc: 'شماره صفحاتی که نمی‌خواهید را وارد کنید.', Icon: FileMinus, color: '#e67e22', requiresParam: true, paramPlaceholder: 'مثال: 1,3,5' },
  'ROTATE_PAGES': { title: 'چرخش صفحات PDF', desc: 'زاویه چرخش را وارد کنید.', Icon: RotateCw, color: '#f1c40f', requiresParam: true, paramPlaceholder: 'مثال: 90 یا 180' },
  'WATERMARK_PDF': { title: 'افزودن واترمارک', desc: 'متن واترمارک خود را بنویسید (فقط انگلیسی).', Icon: Droplet, color: '#34495e', requiresParam: true, paramPlaceholder: 'مثال: KITAYAR' },
  'ENCRYPT_PDF': { title: 'رمزگذاری PDF', desc: 'رمز عبوری که می‌خواهید روی فایل بگذارید را بنویسید.', Icon: Lock, color: '#c0392b', requiresParam: true, paramPlaceholder: 'رمز عبور' },
};

const AdvancedPdfScreen = ({ route, navigation }) => {
  const toolId = route.params?.toolId || 'MERGE_PDF';
  const config = ADVANCED_TOOLS_CONFIG[toolId];

  const [history, setHistory] = useState([]);
  const [savedItems, setSavedItems] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [toolParam, setToolParam] = useState('');

  // استیت‌های مربوط به پاپ‌آپ رمز عبور
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [pdfPassword, setPdfPassword] = useState('');

  useEffect(() => { loadHistory(); }, [toolId]);
  const loadHistory = async () => { setHistory(await getToolHistory(toolId)); };

  const handleProcessPdf = async () => {
    if (config.requiresParam && !toolParam.trim()) {
      Alert.alert("خطا", `لطفاً ${config.paramPlaceholder} را وارد کنید.`);
      return;
    }

    try {
      const isMerge = toolId === 'MERGE_PDF';
      const urisArray = isMerge ? await FilePickerModule.pickPdf() : await FilePickerModule.pickPdf(); 
      
      let mainUri = '';
      let extraUris = [];

      if (Array.isArray(urisArray)) {
        mainUri = urisArray[0];
        extraUris = urisArray.slice(1);
      } else {
        mainUri = urisArray;
      }

      if (!mainUri) return;
      if (isMerge && extraUris.length === 0) {
        Alert.alert("توجه", "برای ترکیب، لطفاً حداقل دو فایل PDF انتخاب کنید.");
        return;
      }

      setIsLoading(true);

      const resultPath = await AdvancedPdfModule.executeTool(
        toolId, 
        mainUri, 
        extraUris.length > 0 ? extraUris : null, 
        toolParam.trim()
      );

      const stat = await ReactNativeBlobUtil.fs.stat(resultPath);
      const sizeStr = (stat.size / 1024).toFixed(1) + " KB";
      const outputFileName = `Kitayar_${toolId}_${Date.now()}.pdf`;
      
      await saveToolHistory(toolId, outputFileName, resultPath, sizeStr, 'PDF');
      loadHistory();
      
      Alert.alert("عملیات موفق", "پردازش فایل با موفقیت انجام شد.");
      
      // اگر ابزار رمزگذاری بود، رمز را پاک نمی‌کنیم تا برای مشاهده کپی بگیریم یا در ذهن کاربر بماند
      if (toolId !== 'ENCRYPT_PDF') setToolParam('');

    } catch (err) {
      if (err !== 'CANCELLED' && err?.code !== 'CANCELLED') {
        Alert.alert("خطا", err.message || "خطا در پردازش فایل PDF");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // هندل کردن باز شدن نمایشگر PDF
// هندل کردن باز شدن نمایشگر PDF
  const handleViewPdf = (item) => {
    if (toolId === 'ENCRYPT_PDF') {
      setSelectedHistoryItem(item);
      setPdfPassword(''); // خالی کردن فیلد
      setPasswordModalVisible(true);
    } else {
      // هدایت به پی‌دی‌اف‌خوان نیتیو و جدید کیتایار
      navigation.navigate('PdfReaderScreen', { path: `file://${item.resultPath}` });
    }
  };

  const confirmViewPdf = () => {
    if (!pdfPassword.trim()) {
      Alert.alert("توجه", "لطفاً رمز عبور را وارد کنید.");
      return;
    }
    setPasswordModalVisible(false);
    // هدایت به پی‌دی‌اف‌خوان نیتیو همراه با پسورد
    navigation.navigate('PdfReaderScreen', { 
      path: `file://${selectedHistoryItem.resultPath}`,
      password: pdfPassword 
    });
  };



  const handleDelete = async (id) => { setHistory(await deleteToolHistory(toolId, id)); };
  const handleShare = async (path) => {
    try { await FileShareModule.shareFile(path, 'application/pdf'); } catch (err) {}
  };
  const handleSaveToDevice = async (item) => {
    try {
      await FileSaverModule.saveFile(item.resultPath, false);
      setSavedItems(prev => ({ ...prev, [item.id]: true }));
      setTimeout(() => setSavedItems(prev => ({ ...prev, [item.id]: false })), 3000);
    } catch (err) { Alert.alert("خطا", "ذخیره فایل با مشکل مواجه شد."); }
  };

  const IconComponent = config.Icon;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.actionBox}>
          <View style={styles.actionHeader}>
            <IconComponent color={config.color} size={35} />
            <Text style={styles.actionTitle}>{config.title}</Text>
          </View>
          <Text style={styles.actionDesc}>{config.desc}</Text>
          
          {config.requiresParam && (
            <TextInput
              style={styles.paramInput}
              placeholder={config.paramPlaceholder}
              value={toolParam}
              onChangeText={setToolParam}
              textAlign="center"
              keyboardType={toolId === 'SPLIT_PDF' || toolId === 'ROTATE_PAGES' ? 'numeric' : 'default'}
              secureTextEntry={toolId === 'ENCRYPT_PDF'}
            />
          )}

          <TouchableOpacity 
            style={[styles.convertButton, { backgroundColor: config.color }]} 
            onPress={handleProcessPdf} 
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.convertButtonText}>انتخاب فایل و پردازش</Text>}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>تاریخچه خروجی‌ها</Text>
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>فایلی موجود نیست.</Text>}
          renderItem={({ item }) => (
            <View style={styles.historyCard}>
              <TouchableOpacity style={styles.absoluteDeleteBtn} onPress={() => handleDelete(item.id)}>
                <Trash2 color="#e74c3c" size={18} />
              </TouchableOpacity>
              
              <View style={styles.historyContent}>
                <View style={[styles.iconWrapper, { backgroundColor: config.color + '15' }]}>
                  <FileText color={config.color} size={30} />
                </View>
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
                
                {/* 👈 فراخوانی متد جدید برای باز کردن PDF */}
                <TouchableOpacity style={[styles.actionBtn, styles.viewBtn]} onPress={() => handleViewPdf(item)}>
                  <Eye color="#2ecc71" size={16} /><Text style={[styles.actionText, {color: '#2ecc71'}]}>مشاهده</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />

        {/* 👈 پاپ‌آپ گرفتن رمز عبور */}
        <Modal visible={passwordModalVisible} transparent animationType="fade" onRequestClose={() => setPasswordModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Lock color="#c0392b" size={28} />
                <Text style={styles.modalTitle}>فایل رمزگذاری شده است</Text>
              </View>
              <Text style={styles.modalSubtitle}>برای باز کردن این فایل باید رمز عبور آن را وارد کنید:</Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="رمز عبور..."
                secureTextEntry
                value={pdfPassword}
                onChangeText={setPdfPassword}
                textAlign="center"
              />
              
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#95a5a6' }]} onPress={() => setPasswordModalVisible(false)}>
                  <Text style={styles.modalBtnText}>لغو</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#2ecc71' }]} onPress={confirmViewPdf}>
                  <Text style={styles.modalBtnText}>باز کردن فایل</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  actionBox: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 3, marginBottom: 25 },
  actionHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', marginBottom: 10, gap: 10 },
  actionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
  actionDesc: { fontSize: 13, color: '#7f8c8d', textAlign: 'center', marginBottom: 15, lineHeight: 22 },
  paramInput: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#dcdde1', borderRadius: 10, height: 50, marginBottom: 15, fontSize: 15, color: '#2c3e50' },
  convertButton: { padding: 15, borderRadius: 10, alignItems: 'center' },
  convertButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'right', color: '#333' },
  emptyText: { textAlign: 'center', color: '#95a5a6', marginTop: 20 },
  
  historyCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, elevation: 2, overflow: 'hidden', position: 'relative' },
  absoluteDeleteBtn: { position: 'absolute', top: 10, right: 10, zIndex: 10, padding: 6, backgroundColor: 'rgba(253, 237, 236, 0.9)', borderRadius: 8 },
  historyContent: { flexDirection: 'row-reverse', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f2f6', alignItems: 'center' },
  iconWrapper: { width: 60, height: 60, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginLeft: 15 },
  infoBox: { flex: 1, alignItems: 'flex-end', justifyContent: 'center' },
  historyTitle: { fontWeight: 'bold', fontSize: 14, color: '#2c3e50', marginBottom: 6, textAlign: 'right', direction: 'ltr' },
  metaDataRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  metaText: { fontSize: 11, color: '#7f8c8d', fontWeight: 'bold' },
  metaDivider: { marginHorizontal: 6, color: '#bdc3c7', fontSize: 10 },
  
  actionButtonsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', padding: 10, gap: 8, backgroundColor: '#fafbfc' },
  actionBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 5 },
  saveBtn: { flex: 1.2, backgroundColor: '#e9f7ef' },
  shareBtn: { flex: 1, backgroundColor: '#ebf5fb' },
  viewBtn: { flex: 1, backgroundColor: '#fdfefe', borderWidth: 1, borderColor: '#e1e8ed' },
  actionTextCol: { alignItems: 'center' },
  actionText: { fontSize: 12, fontWeight: 'bold' },
  savedSuccessText: { color: '#27ae60', fontSize: 10, fontWeight: 'bold', marginTop: 2 },

  // استایل‌های پاپ‌آپ (Modal) رمز عبور
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', padding: 25, borderRadius: 15, elevation: 5 },
  modalHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', marginBottom: 10, gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#c0392b' },
  modalSubtitle: { fontSize: 13, color: '#7f8c8d', textAlign: 'center', marginBottom: 20 },
  modalInput: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#bdc3c7', borderRadius: 8, height: 50, fontSize: 16, marginBottom: 20, color: '#2c3e50' },
  modalActions: { flexDirection: 'row-reverse', gap: 10 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});

export default AdvancedPdfScreen;