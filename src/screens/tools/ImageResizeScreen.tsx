import React, { useState, useEffect } from 'react';
import {
  NativeModules, View, Text, TouchableOpacity, FlatList, StyleSheet, Alert,
  ActivityIndicator, Image, TextInput, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Share2, Eye, Trash2, Download, Maximize } from 'lucide-react-native';

import FilePickerModule from '../../native/FilePicker';
import { saveToolHistory, getToolHistory, deleteToolHistory } from '../../services/ToolHistoryManager';
import { COLORS } from '../../theme/colors';

const { FileShareModule, FileSaverModule, ImageResizeModule } = NativeModules;
const TOOL_ID = 'IMAGE_RESIZER';

const ImageResizeScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [savedItems, setSavedItems] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [originalDim, setOriginalDim] = useState({ w: 0, h: 0 });
  const [newWidth, setNewWidth] = useState('');
  const [newHeight, setNewHeight] = useState('');
  const [keepRatio, setKeepRatio] = useState(true);

  useEffect(() => { loadHistory(); }, []);
  const loadHistory = async () => { setHistory(await getToolHistory(TOOL_ID)); };

  const handlePickImage = async () => {
    try {
      const urisArray = await FilePickerModule.pickImage();
      const uri = Array.isArray(urisArray) ? urisArray[0] : urisArray;
      if (!uri) return;

      setIsLoading(true);
      const dim = await ImageResizeModule.getImageDimensions(uri);
      setSelectedImage(uri);
      setOriginalDim({ w: dim.width, h: dim.height });
      setNewWidth(dim.width.toString());
      setNewHeight(dim.height.toString());
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      if (err.code !== 'CANCELLED') Alert.alert("خطا", err.message);
    }
  };

  const handleWidthChange = (val) => {
    setNewWidth(val);
    if (keepRatio && val && !isNaN(val)) {
      const w = parseInt(val);
      const h = Math.round((w * originalDim.h) / originalDim.w);
      setNewHeight(h.toString());
    }
  };

  const handleHeightChange = (val) => {
    setNewHeight(val);
    if (keepRatio && val && !isNaN(val)) {
      const h = parseInt(val);
      const w = Math.round((h * originalDim.w) / originalDim.h);
      setNewWidth(w.toString());
    }
  };

  const handleResize = async () => {
    if (!selectedImage) return;
    const w = parseInt(newWidth);
    const h = parseInt(newHeight);
    
    if (!w || !h || w <= 0 || h <= 0) {
      Alert.alert("خطا", "ابعاد وارد شده نامعتبر است.");
      return;
    }

    setIsLoading(true);
    try {
      const resultPath = await ImageResizeModule.resizeImage(selectedImage, w, h);
      const stat = await ReactNativeBlobUtil.fs.stat(resultPath);
      const sizeStr = (stat.size / 1024).toFixed(0) + " KB";
      const fileName = `resized_${Date.now()}.jpg`;
      
      await saveToolHistory(TOOL_ID, fileName, resultPath, sizeStr, `${w}x${h}`);
      loadHistory();
      setSelectedImage(null);
    } catch (err) {
      Alert.alert("خطا در تغییر ابعاد", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => { setHistory(await deleteToolHistory(TOOL_ID, id)); };
  const handleShare = async (path) => {
    try { await FileShareModule.shareFile(path, 'image/jpeg'); } catch (err) {}
  };
  const handleSaveToDevice = async (item) => {
    try {
      await FileSaverModule.saveFile(item.resultPath, true);
      setSavedItems(prev => ({ ...prev, [item.id]: true }));
      setTimeout(() => setSavedItems(prev => ({ ...prev, [item.id]: false })), 3000);
    } catch (err) { Alert.alert("خطا", "ذخیره فایل با مشکل مواجه شد."); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.actionBox}>
        <View style={styles.actionHeader}>
          <Maximize color={COLORS.primary} size={35} />
          <Text style={styles.actionTitle}>تغییر ابعاد عکس</Text>
        </View>

        {!selectedImage ? (
          <TouchableOpacity style={styles.convertButton} onPress={handlePickImage} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.convertButtonText}>انتخاب عکس</Text>}
          </TouchableOpacity>
        ) : (
          <View style={styles.editorBox}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <Text style={styles.dimText}>ابعاد اصلی: {originalDim.w} در {originalDim.h}</Text>
            
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>عرض (Width)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={newWidth} onChangeText={handleWidthChange} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ارتفاع (Height)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={newHeight} onChangeText={handleHeightChange} />
              </View>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>حفظ نسبت تصویر (Aspect Ratio)</Text>
              <Switch value={keepRatio} onValueChange={setKeepRatio} trackColor={{ true: COLORS.primary }} />
            </View>

            <View style={{flexDirection: 'row-reverse', gap: 10, marginTop: 15}}>
              <TouchableOpacity style={[styles.convertButton, {flex: 1, backgroundColor: '#95a5a6'}]} onPress={() => setSelectedImage(null)}>
                <Text style={styles.convertButtonText}>لغو</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.convertButton, {flex: 2}]} onPress={handleResize} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.convertButtonText}>اعمال تغییرات</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
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
              <Image source={{ uri: `file://${item.resultPath}` }} style={styles.thumbnail} />
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
                  <Text style={[styles.actionText, {color: '#27ae60'}]}>ذخیره گالری</Text>
                  {savedItems[item.id] && <Text style={styles.savedSuccessText}>✓ ذخیره شد</Text>}
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.shareBtn]} onPress={() => handleShare(item.resultPath)}>
                <Share2 color="#3498db" size={16} /><Text style={[styles.actionText, {color: '#3498db'}]}>اشتراک</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.viewBtn]} onPress={() => navigation.navigate('ImageViewerScreen', { path: `file://${item.resultPath}` })}>
                <Eye color="#2ecc71" size={16} /><Text style={[styles.actionText, {color: '#2ecc71'}]}>مشاهده</Text>
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
  actionHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', marginBottom: 20, gap: 10 },
  actionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
  convertButton: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, alignItems: 'center' },
  convertButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  editorBox: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e1e8ed' },
  previewImage: { width: '100%', height: 150, resizeMode: 'contain', marginBottom: 10 },
  dimText: { textAlign: 'center', color: '#7f8c8d', marginBottom: 15, fontSize: 12 },
  inputRow: { flexDirection: 'row-reverse', gap: 15, marginBottom: 15 },
  inputGroup: { flex: 1 },
  inputLabel: { fontSize: 12, color: '#34495e', textAlign: 'right', marginBottom: 5, fontWeight: 'bold' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dcdde1', borderRadius: 8, height: 45, textAlign: 'center', fontSize: 16 },
  switchRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#dcdde1' },
  switchLabel: { fontSize: 13, color: '#2c3e50', fontWeight: 'bold' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'right', color: '#333' },
  historyCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, elevation: 2, overflow: 'hidden', position: 'relative' },
  absoluteDeleteBtn: { position: 'absolute', top: 10, right: 10, zIndex: 10, padding: 6, backgroundColor: 'rgba(253, 237, 236, 0.9)', borderRadius: 8 },
  historyContent: { flexDirection: 'row-reverse', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f2f6', alignItems: 'center' },
  thumbnail: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#f5f6fa', resizeMode: 'cover', marginLeft: 15 },
  infoBox: { flex: 1, alignItems: 'flex-end', justifyContent: 'center' },
  historyTitle: { fontWeight: 'bold', fontSize: 14, color: '#2c3e50', marginBottom: 6, textAlign: 'right' },
  metaDataRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  metaText: { fontSize: 11, color: '#7f8c8d', fontWeight: 'bold' },
  metaDivider: { marginHorizontal: 6, color: '#bdc3c7', fontSize: 10 },
  
  actionButtonsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', padding: 10, gap: 8, backgroundColor: '#fafbfc' },
  actionBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 5 },
  saveBtn: { flex: 1.2, backgroundColor: '#e9f7ef' },
  shareBtn: { flex: 1, backgroundColor: '#ebf5fb' },
  viewBtn: { flex: 1, backgroundColor: '#f4f6f7' }, 
  actionTextCol: { alignItems: 'center' },
  actionText: { fontSize: 12, fontWeight: 'bold' },
  savedSuccessText: { color: '#27ae60', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
});

export default ImageResizeScreen;