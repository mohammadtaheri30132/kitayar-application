import React, { useState, useEffect } from 'react';
import {
  NativeModules, View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, 
  TextInput, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Share2, Trash2, Mic, FileText, Download, Check } from 'lucide-react-native';

import { saveToolHistory, getToolHistory, deleteToolHistory } from '../../services/ToolHistoryManager';
import { COLORS } from '../../theme/colors';

const { FileShareModule, FileSaverModule, AudioToTextModule } = NativeModules;
const TOOL_ID = 'AUDIO_TO_TEXT';

const AudioToTextScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [savedItems, setSavedItems] = useState({});
  
  const [recognizedText, setRecognizedText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => { loadHistory(); }, []);
  const loadHistory = async () => { setHistory(await getToolHistory(TOOL_ID)); };

  // شروع ضبط و تبدیل به متن
  const handleStartListening = async () => {
    try {
      // استفاده از کد زبان فارسی
      const text = await AudioToTextModule.startListening('fa-IR');
      if (text) {
        // اگر متنی قبلاً بود، متن جدید به آن اضافه می‌شود
        setRecognizedText(prev => prev ? prev + ' ' + text : text);
        setIsEditing(true);
      }
    } catch (err) {
      if (err !== 'CANCELLED' && err?.code !== 'CANCELLED') {
        Alert.alert("خطا", err.message || "خطا در تشخیص صدا");
      }
    }
  };

  // ذخیره متن به صورت فایل .txt
  const handleSaveTextFile = async () => {
    if (!recognizedText.trim()) {
      Alert.alert("خطا", "متنی برای ذخیره وجود ندارد.");
      return;
    }

    try {
      const fileName = `Note_${Date.now()}.txt`;
      const filePath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${fileName}`;
      
      // ساخت فایل متنی با اینکدینگ utf8
      await ReactNativeBlobUtil.fs.writeFile(filePath, recognizedText, 'utf8');
      
      const stat = await ReactNativeBlobUtil.fs.stat(filePath);
      const sizeStr = (stat.size / 1024).toFixed(1) + " KB";
      
      await saveToolHistory(TOOL_ID, fileName, filePath, sizeStr, 'TXT');
      loadHistory();
      
      setRecognizedText('');
      setIsEditing(false);
      Alert.alert("عملیات موفق", "متن شما به عنوان فایل ذخیره شد.");
      
    } catch (err) {
      Alert.alert("خطا در ذخیره سازی", err.message);
    }
  };

  const handleDelete = async (id) => { setHistory(await deleteToolHistory(TOOL_ID, id)); };
  
  const handleShare = async (path) => {
    try { await FileShareModule.shareFile(path, 'text/plain'); } catch (err) {}
  };

  const handleSaveToDevice = async (item) => {
    try {
      // فایل TXT در اندروید در پوشه Downloads یا Documents ذخیره می‌شود
      await FileSaverModule.saveFile(item.resultPath, false);
      setSavedItems(prev => ({ ...prev, [item.id]: true }));
      setTimeout(() => setSavedItems(prev => ({ ...prev, [item.id]: false })), 3000);
    } catch (err) { Alert.alert("خطا", "ذخیره فایل با مشکل مواجه شد."); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.actionBox}>
          <View style={styles.actionHeader}>
            <Mic color={COLORS.primary} size={35} />
            <Text style={styles.actionTitle}>تایپ صوتی (تبدیل گفتار به متن)</Text>
          </View>
          
          <Text style={styles.actionDesc}>
            روی میکروفون بزنید و صحبت کنید. متن شما به صورت خودکار تایپ می‌شود.
          </Text>

          {!isEditing && !recognizedText ? (
            <TouchableOpacity style={styles.micButtonWrapper} onPress={handleStartListening}>
              <View style={styles.micButton}>
                <Mic color="#fff" size={40} />
              </View>
              <Text style={styles.micText}>شروع صحبت</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editorContainer}>
              <TextInput
                style={styles.textInput}
                multiline
                placeholder="متن تشخیص داده شده اینجا ظاهر می‌شود..."
                value={recognizedText}
                onChangeText={setRecognizedText}
                textAlignVertical="top"
              />
              
              <View style={styles.editorActionsRow}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f39c12', flex: 1, marginRight: 10 }]} onPress={handleStartListening}>
                  <Mic color="#fff" size={18} />
                  <Text style={styles.actionBtnTextWhite}>ادامه صحبت</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#27ae60', flex: 1.5 }]} onPress={handleSaveTextFile}>
                  <Check color="#fff" size={18} />
                  <Text style={styles.actionBtnTextWhite}>ذخیره به عنوان فایل</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={styles.cancelTextBtn} onPress={() => { setRecognizedText(''); setIsEditing(false); }}>
                <Text style={styles.cancelTextBtnLabel}>پاک کردن و انصراف</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>یادداشت‌های ذخیره شده</Text>
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
                <View style={styles.iconWrapper}><FileText color="#34495E" size={30} /></View>
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
                    <Text style={[styles.actionText, {color: '#27ae60'}]}>ذخیره در گوشی</Text>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  actionBox: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 3, marginBottom: 25 },
  actionHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', marginBottom: 10, gap: 10 },
  actionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  actionDesc: { fontSize: 13, color: '#7f8c8d', textAlign: 'center', marginBottom: 20 },
  
  micButtonWrapper: { alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  micButton: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  micText: { marginTop: 15, fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  
  editorContainer: { width: '100%' },
  textInput: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#dcdde1', borderRadius: 10, minHeight: 120, padding: 15, textAlign: 'right', fontSize: 15, color: '#2c3e50', marginBottom: 15 },
  editorActionsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  actionBtnTextWhite: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginRight: 8 },
  cancelTextBtn: { marginTop: 15, alignItems: 'center', padding: 10 },
  cancelTextBtnLabel: { color: '#e74c3c', fontSize: 14, fontWeight: 'bold' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'right', color: '#333' },
  historyCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, elevation: 2, overflow: 'hidden', position: 'relative' },
  absoluteDeleteBtn: { position: 'absolute', top: 10, right: 10, zIndex: 10, padding: 6, backgroundColor: 'rgba(253, 237, 236, 0.9)', borderRadius: 8 },
  historyContent: { flexDirection: 'row-reverse', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f2f6', alignItems: 'center' },
  iconWrapper: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#eaeded', justifyContent: 'center', alignItems: 'center', marginLeft: 15 },
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

export default AudioToTextScreen;