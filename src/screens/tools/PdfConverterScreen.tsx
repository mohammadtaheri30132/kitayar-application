import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // 👈 حل مشکل استاتوس بار
import PdfConverterModule from '../../native/PdfConverter';
import { saveToolHistory, getToolHistory } from '../../services/ToolHistoryManager';
import { COLORS } from '../../theme/colors';
import FilePickerModule from '../../native/FilePicker';
const PdfConverterScreen = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getToolHistory();
    setHistory(data);
  };

const convertImageToPdf = async () => {
  try {
    setIsLoading(true);
    // باز کردن فایل منیجر اختصاصی خودمان
    const imageUri = await FilePickerModule.pickImage();
    
    const outputName = `kitayar_pdf_${Date.now()}`;
    const resultPath = await PdfConverterModule.imageToPdf(imageUri, outputName);
    
    await saveToolHistory('تبدیل عکس به PDF', resultPath);
    loadHistory();
    Alert.alert("عملیات موفق", `فایل شما ذخیره شد:\n${resultPath}`);
  } catch (err) {
    if (err.code !== 'CANCELLED') {
      Alert.alert("خطا", err.message || "خطا در پردازش تصویر");
    }
  } finally {
    setIsLoading(false);
  }
};
const convertPdfToImage = async () => {
  try {
    setIsLoading(true);
    // انتخاب PDF
    const pdfUri = await FilePickerModule.pickPdf();
    
    const outputName = `kitayar_img_${Date.now()}`;
    const resultPath = await PdfConverterModule.pdfToImage(pdfUri, outputName, 0);
    
    await saveToolHistory('تبدیل PDF به عکس', resultPath);
    loadHistory();
    Alert.alert("عملیات موفق", `فایل شما ذخیره شد:\n${resultPath}`);
  } catch (err) {
    if (err.code !== 'CANCELLED') {
      Alert.alert("خطا", err.message || "خطا در پردازش PDF");
    }
  } finally {
    setIsLoading(false);
  }
};

  const renderHistory = ({ item }) => (
    <View style={styles.historyCard}>
      <Text style={styles.historyTitle}>{item.toolName}</Text>
      <Text style={styles.historyDate}>
        {new Date(item.date).toLocaleDateString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
      </Text>
      <Text style={styles.historyPath} numberOfLines={1} ellipsizeMode="middle">
        مسیر: {item.resultPath}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={convertImageToPdf} disabled={isLoading}>
          <Text style={styles.buttonText}>تبدیل عکس به PDF</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, { backgroundColor: '#e67e22' }]} onPress={convertPdfToImage} disabled={isLoading}>
          <Text style={styles.buttonText}>تبدیل PDF به عکس</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>در حال پردازش...</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>تاریخچه تبدیل‌ها</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderHistory}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16, paddingTop: 10 },
  buttonsContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  button: { flex: 1, backgroundColor: COLORS.primary, padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  loadingContainer: { alignItems: 'center', marginBottom: 15 },
  loadingText: { marginTop: 5, color: '#333' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'right', color: '#2c3e50' },
  historyCard: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10, borderRightWidth: 4, borderRightColor: COLORS.primary, elevation: 1 },
  historyTitle: { fontWeight: 'bold', textAlign: 'right', fontSize: 15, color: '#333' },
  historyDate: { fontSize: 12, color: '#7f8c8d', textAlign: 'right', marginVertical: 6 },
  historyPath: { fontSize: 11, color: '#bdc3c7', textAlign: 'left', direction: 'ltr' }
});

export default PdfConverterScreen;