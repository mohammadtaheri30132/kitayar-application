import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, 
  ActivityIndicator, Image, TextInput 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Share2, Eye, Trash2, Plus, Minimize, Settings, X, ArrowLeftRight, CheckSquare, Square, FileArchive, Download } from 'lucide-react-native';

import FilePickerModule from '../../native/FilePicker';
import ImageCompressorModule from '../../native/ImageCompressor';
import { NativeModules } from 'react-native';

const { FileShareModule, FileSaverModule } = NativeModules;

import { saveToolHistory, getToolHistory, deleteToolHistory } from '../../services/ToolHistoryManager';
import { COLORS } from '../../theme/colors';

const TOOL_ID = 'IMAGE_COMPRESSOR';

const CustomSlider = ({ value, onValueChange, min = 1, max = 100, leftLabel, rightLabel, hint, disabled = false }) => {
  const [width, setWidth] = useState(1);
  const updateValue = (x) => {
    if (disabled) return;
    let percent = x / width;
    if (percent < 0) percent = 0;
    if (percent > 1) percent = 1;
    onValueChange(Math.round(percent * (max - min) + min));
  };
  return (
    <View style={{ marginBottom: 20, opacity: disabled ? 0.5 : 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontSize: 11, color: '#7f8c8d', fontWeight: 'bold' }}>{leftLabel}</Text>
        <Text style={{ fontSize: 11, color: '#e74c3c', fontWeight: 'bold' }}>{rightLabel}</Text>
      </View>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} onStartShouldSetResponder={() => true} onResponderGrant={(e) => updateValue(e.nativeEvent.locationX)} onResponderMove={(e) => updateValue(e.nativeEvent.locationX)} style={{ height: 40, justifyContent: 'center', marginHorizontal: 10 }}>
        <View pointerEvents="none" style={{ height: 6, backgroundColor: '#e1e8ed', borderRadius: 3, flexDirection: 'row' }}>
          <View style={{ width: `${((value - min) / (max - min)) * 100}%`, height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 }} />
        </View>
        <View pointerEvents="none" style={{ position: 'absolute', left: `${((value - min) / (max - min)) * 100}%`, width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', marginLeft: -12, borderWidth: 4, borderColor: COLORS.primary, elevation: 3 }} />
      </View>
      <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 }}>
        <Text style={{ fontSize: 11, color: '#95a5a6' }}>{hint}</Text>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.primary }}>{value}٪</Text>
      </View>
    </View>
  );
};

const ImageCompressorScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [compressMode, setCompressMode] = useState('SMART'); 
  const [advancedQuality, setAdvancedQuality] = useState(80);
  const [advancedScale, setAdvancedScale] = useState(100);
  const [isLosslessAdvanced, setIsLosslessAdvanced] = useState(false);
  const [firstImageDim, setFirstImageDim] = useState({ width: 0, height: 0 });
  const [savedItems, setSavedItems] = useState({});

  useEffect(() => { loadHistory(); }, []);
  const loadHistory = async () => { setHistory(await getToolHistory(TOOL_ID)); };

  const formatSizeFa = (bytes) => {
    const kb = bytes / 1024;
    if (kb > 1024) {
      const mb = kb / 1024;
      return `${mb.toFixed(2).replace('.', '/')} مگابایت`;
    }
    return `${Math.round(kb)} کیلوبایت`;
  };

  const updatePreviewDimensions = (uri) => {
    if (uri) Image.getSize(uri, (width, height) => setFirstImageDim({ width, height }), () => setFirstImageDim({ width: 0, height: 0 }));
    else setFirstImageDim({ width: 0, height: 0 });
  };

  const handlePickImages = async () => {
    try {
      const uris = await FilePickerModule.pickMultipleImages();
      const combined = [...selectedImages, ...uris];
      let finalSelection = combined.length > 10 ? combined.slice(0, 10) : combined;
      if (combined.length > 10) Alert.alert("محدودیت انتخاب", "شما حداکثر می‌توانید ۱۰ تصویر را همزمان انتخاب کنید.");
      setSelectedImages(finalSelection);
      if (finalSelection.length > 0) updatePreviewDimensions(finalSelection[0]);
    } catch (err) { if (err.code !== 'CANCELLED') Alert.alert("خطا", err.message); }
  };

  const removeSelectedImage = (index) => {
    const newList = [...selectedImages];
    newList.splice(index, 1);
    setSelectedImages(newList);
    updatePreviewDimensions(newList.length > 0 ? newList[0] : null);
  };

  const handleCompress = async () => {
    if (selectedImages.length === 0) return;
    setIsLoading(true);
    
    try {
      let targetQuality = 80;
      let targetScale = 1.0;
      let targetFormat = 'JPG';
      
      if (compressMode === 'LOSSLESS') { targetQuality = 100; targetScale = 1.0; }
      else if (compressMode === 'SMART') { targetQuality = 75; targetScale = 1.0; }
      else if (compressMode === 'MAX') { targetQuality = 35; targetScale = 0.7; }
      else if (compressMode === 'WEBP') { targetQuality = 80; targetScale = 1.0; targetFormat = 'WEBP'; }
      else {
        targetQuality = isLosslessAdvanced ? 100 : advancedQuality;
        targetScale = advancedScale / 100;
      }

      let successCount = 0;

      for (let i = 0; i < selectedImages.length; i++) {
        const uri = selectedImages[i];
        const originalFileName = uri.split('/').pop();
        const baseName = originalFileName.lastIndexOf('.') !== -1 ? originalFileName.substring(0, originalFileName.lastIndexOf('.')) : originalFileName;
        const finalName = `${baseName}_kitayar.ir`;

        const oldStat = await ReactNativeBlobUtil.fs.stat(uri.replace('file://', ''));
        
        const resultPath = await ImageCompressorModule.compressImage(uri, finalName, targetQuality, targetScale, targetFormat);
        const newStat = await ReactNativeBlobUtil.fs.stat(resultPath);
        
        const reductionPercent = Math.round(((oldStat.size - newStat.size) / oldStat.size) * 100);
        const reductionBadge = reductionPercent > 0 ? ` (٪${reductionPercent} کاهش)` : ' (بدون تغییر)';
        
        const sizeComparison = `از ${formatSizeFa(oldStat.size)} به ${formatSizeFa(newStat.size)}${reductionBadge}`;
        
        const methodNameFa = { SMART: 'هوشمند', LOSSLESS: 'بدون افت', MAX: 'بیشترین کاهش', ADVANCED: 'پیشرفته', WEBP: 'تبدیل به WebP' }[compressMode];
        const formatWithMethod = `${targetFormat} | روش: ${methodNameFa}`;

        await saveToolHistory(TOOL_ID, `${finalName}.${targetFormat.toLowerCase()}`, resultPath, sizeComparison, formatWithMethod);
        successCount++;
      }

      loadHistory();
      setSelectedImages([]);
      setFirstImageDim({width: 0, height: 0});
      Alert.alert("عملیات موفق", `${successCount} تصویر با موفقیت فشرده شد.`);
    } catch (err) { Alert.alert("خطا در فشرده‌سازی", err.message); } finally { setIsLoading(false); }
  };

  const handleShare = async (path, formatMethod) => {
    try { 
      const mimeType = formatMethod.includes('WEBP') ? 'image/webp' : 'image/jpeg';
      await FileShareModule.shareFile(path, mimeType); 
    } catch (err) {}
  };

  const handleDelete = async (id) => { setHistory(await deleteToolHistory(TOOL_ID, id)); };

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

  const renderHeader = () => {
    const scaleFactor = advancedScale / 100;
    const newWidth = Math.round(firstImageDim.width * scaleFactor);
    const newHeight = Math.round(firstImageDim.height * scaleFactor);

    return (
      <View style={styles.headerSection}>
        <View style={styles.titleRow}>
          <Minimize color={COLORS.primary} size={30} />
          <Text style={styles.mainTitle}>کاهش حجم تصویر</Text>
        </View>

        <View style={styles.selectionBox}>
          {selectedImages.length === 0 ? (
            <TouchableOpacity style={styles.emptyPickBtn} onPress={handlePickImages}>
              <Plus color={COLORS.primary} size={35} />
              <Text style={styles.emptyPickText}>انتخاب تصاویر (تا ۱۰ عدد)</Text>
            </TouchableOpacity>
          ) : (
            <View>
              <View style={styles.previewHeader}>
                <Text style={styles.previewTitle}>تصاویر انتخاب شده ({selectedImages.length}/10)</Text>
                {selectedImages.length < 10 && (
                  <TouchableOpacity onPress={handlePickImages} style={styles.addMoreBtn}>
                    <Plus color="#fff" size={16} /><Text style={{color: '#fff', fontSize: 12}}>افزودن</Text>
                  </TouchableOpacity>
                )}
              </View>
              <FlatList
                horizontal inverted data={selectedImages} showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <View style={styles.previewThumbContainer}>
                    <Image source={{ uri: item }} style={styles.previewThumb} />
                    <TouchableOpacity style={styles.removeThumbBtn} onPress={() => removeSelectedImage(index)}>
                      <X color="#fff" size={14} />
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          )}
        </View>

        {selectedImages.length > 0 && (
          <View style={styles.settingsBox}>
            <Text style={styles.settingsTitle}>حالت فشرده‌سازی را انتخاب کنید:</Text>
            
            <TouchableOpacity style={[styles.compressOpt, compressMode === 'SMART' && styles.compressOptActive]} onPress={() => setCompressMode('SMART')}>
              <Text style={[styles.compressOptTitle, compressMode === 'SMART' && {color: COLORS.primary}]}>کاهش حجم هوشمند (پیشنهادی)</Text>
              <Text style={styles.compressOptDesc}>بهترین تعادل بین کیفیت بالا و حجم کم</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.compressOpt, compressMode === 'WEBP' && styles.compressOptActive]} onPress={() => setCompressMode('WEBP')}>
              <Text style={[styles.compressOptTitle, compressMode === 'WEBP' && {color: COLORS.primary}]}>کاهش حجم با تبدیل به WebP</Text>
              <Text style={styles.compressOptDesc}>فرمت مدرن با فشرده‌سازی بسیار بالا</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.compressOpt, compressMode === 'LOSSLESS' && styles.compressOptActive]} onPress={() => setCompressMode('LOSSLESS')}>
              <Text style={[styles.compressOptTitle, compressMode === 'LOSSLESS' && {color: COLORS.primary}]}>بدون افت کیفیت</Text>
              <Text style={styles.compressOptDesc}>فقط داده‌های اضافه (EXIF) پاک می‌شود</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.compressOpt, compressMode === 'MAX' && styles.compressOptActive]} onPress={() => setCompressMode('MAX')}>
              <Text style={[styles.compressOptTitle, compressMode === 'MAX' && {color: COLORS.primary}]}>بیشترین کاهش حجم</Text>
              <Text style={styles.compressOptDesc}>کاهش شدید حجم و کوچک شدن ابعاد تصویر</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.compressOpt, compressMode === 'ADVANCED' && styles.compressOptActive]} onPress={() => setCompressMode('ADVANCED')}>
              <View style={{flexDirection: 'row-reverse', alignItems: 'center', gap: 5}}>
                <Settings size={18} color={compressMode === 'ADVANCED' ? COLORS.primary : "#7f8c8d"} />
                <Text style={[styles.compressOptTitle, compressMode === 'ADVANCED' && {color: COLORS.primary}]}>تنظیمات پیشرفته</Text>
              </View>
              
              {compressMode === 'ADVANCED' && (
                <View style={styles.advancedContainer}>
                  <TouchableOpacity style={styles.losslessCheckboxRow} onPress={() => setIsLosslessAdvanced(!isLosslessAdvanced)}>
                    {isLosslessAdvanced ? <CheckSquare color={COLORS.primary} size={22} /> : <Square color="#bdc3c7" size={22} />}
                    <Text style={styles.losslessCheckboxText}>حفظ کیفیت کامل (بدون افت فریم و رزولوشن)</Text>
                  </TouchableOpacity>

                  <CustomSlider 
                    value={isLosslessAdvanced ? 100 : advancedQuality}
                    onValueChange={setAdvancedQuality}
                    leftLabel="کیفیت پایین‌تر، حجم پایین‌تر"
                    rightLabel="کیفیت بالاتر، حجم بالاتر"
                    hint={isLosslessAdvanced ? "در این حالت کیفیت ثابت می‌ماند" : "پیشنهادی: بین ۷۰ تا ۹۰ تنظیم کنید"}
                    disabled={isLosslessAdvanced}
                  />

                  <View style={styles.divider} />

                  <CustomSlider 
                    value={advancedScale}
                    onValueChange={setAdvancedScale}
                    leftLabel="ابعاد کوچک‌تر"
                    rightLabel="ابعاد اصلی (۱۰۰٪)"
                    hint="تغییر Scale (طول و عرض تصویر)"
                  />

                  {firstImageDim.width > 0 && (
                    <View style={styles.dimensionPreviewBox}>
                      <Text style={styles.dimensionLabel}>پیش‌نمایش ابعاد (عکس اول):</Text>
                      <View style={styles.dimensionRow}>
                        <Text style={styles.dimensionTextOld}>{firstImageDim.width}x{firstImageDim.height}</Text>
                        <ArrowLeftRight color="#bdc3c7" size={16} style={{marginHorizontal: 10}} />
                        <Text style={styles.dimensionTextNew}>{newWidth}x{newHeight}</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.startBtn} onPress={handleCompress} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.startBtnText}>شروع فشرده‌سازی</Text>}
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>تاریخچه فایل‌های فشرده</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>هنوز فایلی فشرده نشده است.</Text>}
        renderItem={({ item }) => (
          <View style={styles.historyCard}>
            
            <TouchableOpacity style={styles.absoluteDeleteBtn} onPress={() => handleDelete(item.id)}>
              <Trash2 color="#e74c3c" size={18} />
            </TouchableOpacity>

            <View style={styles.historyContent}>
              <View style={styles.previewBox}>
                <Image source={{ uri: `file://${item.resultPath}` }} style={styles.historyThumb} />
              </View>
              <View style={[styles.infoBox, { paddingRight: 40 }]}>
                <Text style={styles.historyTitle} numberOfLines={1} ellipsizeMode="middle">{item.title}</Text>
                <View style={styles.metaDataRow}>
                  <Text style={styles.metaSizeText}>{item.size}</Text>
                </View>
                <View style={styles.metaDataRow}>
                  <FileArchive color="#95a5a6" size={12} style={{marginLeft: 4}} />
                  <Text style={styles.metaFormatText}>{item.format}</Text>
                </View>
                <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16 },
  headerSection: { paddingTop: 10, paddingBottom: 15 },
  titleRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', marginBottom: 20, gap: 10 },
  mainTitle: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50' },
  
  selectionBox: { backgroundColor: '#fff', borderRadius: 15, padding: 15, elevation: 2, marginBottom: 20 },
  emptyPickBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30, borderStyle: 'dashed', borderWidth: 2, borderColor: '#bdc3c7', borderRadius: 12 },
  emptyPickText: { marginTop: 10, color: '#7f8c8d', fontSize: 16, fontWeight: 'bold' },
  previewHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  previewTitle: { fontSize: 16, fontWeight: 'bold', color: '#34495e' },
  addMoreBtn: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 4 },
  previewThumbContainer: { marginLeft: 10, position: 'relative' },
  previewThumb: { width: 70, height: 70, borderRadius: 10, resizeMode: 'cover' },
  removeThumbBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: '#e74c3c', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  
  settingsBox: { backgroundColor: '#fff', borderRadius: 15, padding: 15, elevation: 2, marginBottom: 25 },
  settingsTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', textAlign: 'right', marginBottom: 15 },
  compressOpt: { backgroundColor: '#f8f9fa', borderWidth: 2, borderColor: '#f1f2f6', padding: 15, borderRadius: 12, alignItems: 'flex-end', marginBottom: 10 },
  compressOptActive: { borderColor: COLORS.primary, backgroundColor: '#f0f8ff' },
  compressOptTitle: { fontSize: 15, fontWeight: 'bold', color: '#34495e', marginBottom: 4 },
  compressOptDesc: { fontSize: 12, color: '#7f8c8d' },
  
  advancedContainer: { marginTop: 15, width: '100%', borderTopWidth: 1, borderTopColor: '#dcdde1', paddingTop: 20 },
  losslessCheckboxRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 25, backgroundColor: '#fdfefe', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e1e8ed' },
  losslessCheckboxText: { fontSize: 13, color: '#2c3e50', fontWeight: 'bold', marginRight: 10 },
  divider: { height: 1, backgroundColor: '#e1e8ed', marginVertical: 15 },
  
  dimensionPreviewBox: { backgroundColor: '#fdfefe', borderWidth: 1, borderColor: '#e1e8ed', borderRadius: 8, padding: 12, marginTop: 15, alignItems: 'center' },
  dimensionLabel: { fontSize: 12, color: '#95a5a6', marginBottom: 8 },
  dimensionRow: { flexDirection: 'row-reverse', alignItems: 'center', width: '100%', justifyContent: 'center' },
  dimensionTextOld: { fontSize: 14, color: '#7f8c8d', textDecorationLine: 'line-through' },
  dimensionTextNew: { fontSize: 16, fontWeight: 'bold', color: '#27ae60' },

  startBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'right', color: '#333' },
  
  historyCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, elevation: 2, overflow: 'hidden', position: 'relative' },
  
  absoluteDeleteBtn: { position: 'absolute', top: 10, right: 10, zIndex: 10, padding: 6, backgroundColor: 'rgba(253, 237, 236, 0.9)', borderRadius: 8 },
  
  historyContent: { flexDirection: 'row-reverse', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f2f6' },
  previewBox: { marginLeft: 15, justifyContent: 'center' },
  historyThumb: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#f5f6fa', resizeMode: 'cover' },
  infoBox: { flex: 1, alignItems: 'flex-end', justifyContent: 'center' },
  historyTitle: { fontWeight: 'bold', fontSize: 13, color: '#2c3e50', marginBottom: 8, textAlign: 'right', direction: 'ltr' },
  metaDataRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 6 },
  metaSizeText: { fontSize: 12, color: '#16a085', fontWeight: 'bold', textAlign: 'right' },
  metaFormatText: { fontSize: 11, color: '#95a5a6', fontWeight: 'bold', textAlign: 'right' },
  historyDate: { fontSize: 11, color: '#bdc3c7', marginTop: 4 },
  
  actionButtonsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', padding: 10, gap: 8, backgroundColor: '#fafbfc' },
  actionBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 5 },
  saveBtn: { flex: 1.2, backgroundColor: '#e9f7ef' },
  shareBtn: { flex: 1, backgroundColor: '#ebf5fb' },
  viewBtn: { flex: 1, backgroundColor: '#f4f6f7' }, 
  actionTextCol: { alignItems: 'center' },
  actionText: { fontSize: 12, fontWeight: 'bold' },
  savedSuccessText: { color: '#27ae60', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#95a5a6', marginTop: 20 }
});

export default ImageCompressorScreen;