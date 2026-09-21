import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowUpDown, Columns, Crop, Droplet, FileArchive, FileMinus, FileOutput, FileSpreadsheet, FileText, Grid, Image as ImageIcon, Layers, ListOrdered, Lock, Maximize, Maximize2, Mic, Minimize, Minimize2, Music, Presentation, RotateCw, ScanText, Scissors, Wrench } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';

const ToolsListScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>ابزارهای کیتایار</Text>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* گزینه اول */}
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('CollageScreen')}>
          <View style={styles.iconBox}><FileText color={COLORS.primary} size={30} /></View>
          <Text style={styles.cardText}>ترکیب عکس ها باهم</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ImageResizeScreen')}>
  <View style={styles.iconBox}><Maximize color="#3498db" size={30} /></View>
  <Text style={styles.cardText}>تغییر ابعاد عکس</Text>
</TouchableOpacity>

<TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ImageCropScreen')}>
  <View style={styles.iconBox}><Crop color="#e74c3c" size={30} /></View>
  <Text style={styles.cardText}>برش تصویر (Crop)</Text>
</TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ConverterScreen', { toolType: 'IMAGE_TO_PDF', title: 'تبدیل عکس به PDF' })}>
          <View style={styles.iconBox}><FileText color={COLORS.primary} size={30} /></View>
          <Text style={styles.cardText}>تبدیل عکس به PDF</Text>
        </TouchableOpacity>

        {/* گزینه دوم */}
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ConverterScreen', { toolType: 'PDF_TO_IMAGE', title: 'تبدیل PDF به عکس' })}>
          <View style={styles.iconBox}><ImageIcon color="#e67e22" size={30} /></View>
          <Text style={styles.cardText}>تبدیل PDF به عکس</Text>
        </TouchableOpacity>

        {/* گزینه سوم (جدید) */}
{/* در فایل ToolsListScreen.js: جایگزین کردن دکمه کاهش حجم با کد زیر */}
<TouchableOpacity 
  style={styles.card} 
  onPress={() => navigation.navigate('ImageCompressorScreen')}> {/* 👈 تغییر مهم */}
  <View style={styles.iconBox}><Minimize color="#9b59b6" size={30} /></View>
  <Text style={styles.cardText}>کاهش حجم تصویر</Text>
</TouchableOpacity>
<TouchableOpacity 
  style={styles.card} 
  onPress={() => navigation.navigate('ImageConverterScreen')}> {/* 👈 تغییر مهم */}
  <View style={styles.iconBox}><Minimize color="#9b59b6" size={30} /></View>
  <Text style={styles.cardText}>تبدیل  تصویر</Text>
</TouchableOpacity>

<TouchableOpacity 
  style={styles.card} 
  onPress={() => navigation.navigate('ImageConverterScreen')}> {/* 👈 تغییر مهم */}
  <View style={styles.iconBox}><Minimize color="#9b59b6" size={30} /></View>
  <Text style={styles.cardText}>تبدیل  تصویر</Text>
</TouchableOpacity>
<TouchableOpacity 
  style={styles.card} 
  onPress={() => navigation.navigate('VideoToAudioScreen')}> {/* 👈 تغییر مهم */}
  <View style={styles.iconBox}><Minimize color="#9b59b6" size={30} /></View>
  <Text style={styles.cardText}>ویدیو به صورت</Text>
</TouchableOpacity>
<TouchableOpacity 
  style={styles.card} 
  onPress={() => navigation.navigate('VideoTrimScreen')}> {/* 👈 تغییر مهم */}
  <View style={styles.iconBox}><Minimize color="#9b59b6" size={30} /></View>
  <Text style={styles.cardText}>برش ویدیو</Text>
</TouchableOpacity>
{/* --- بخش ویدیو و صدا --- */}
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('VideoTrimScreen')}>
          <View style={styles.iconBox}><Scissors color="#e74c3c" size={30} /></View>
          <Text style={styles.cardText}>برش حرفه‌ای ویدیو</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('VideoToAudioScreen')}>
          <View style={styles.iconBox}><Music color="#9b59b6" size={30} /></View>
          <Text style={styles.cardText}>تبدیل ویدیو به صوت</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AudioToTextScreen')}>
          <View style={styles.iconBox}><Mic color="#f39c12" size={30} /></View>
          <Text style={styles.cardText}>تایپ صوتی (صوت به متن)</Text>
        </TouchableOpacity>

        {/* --- بخش تبدیل اسناد به PDF --- */}
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('DocumentToPdfScreen', { type: 'TEXT' })}>
          <View style={styles.iconBox}><FileText color="#34495E" size={30} /></View>
          <Text style={styles.cardText}>تبدیل متن به PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('DocumentToPdfScreen', { type: 'WORD' })}>
          <View style={styles.iconBox}><FileArchive color="#2980b9" size={30} /></View>
          <Text style={styles.cardText}>تبدیل ورد به PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('DocumentToPdfScreen', { type: 'EXCEL' })}>
          <View style={styles.iconBox}><FileSpreadsheet color="#27ae60" size={30} /></View>
          <Text style={styles.cardText}>تبدیل اکسل به PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('DocumentToPdfScreen', { type: 'POWERPOINT' })}>
          <View style={styles.iconBox}><Presentation color="#d35400" size={30} /></View>
          <Text style={styles.cardText}>تبدیل پاورپوینت به PDF</Text>
        </TouchableOpacity>
        <View style={{ marginTop: 20, marginBottom: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2c3e50', textAlign: 'right', marginBottom: 15 }}>
            مدیریت و ویرایش حرفه‌ای PDF
          </Text>
        </View>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AdvancedPdfScreen', { toolId: 'MERGE_PDF' })}>
          <View style={styles.iconBox}><Layers color="#3498db" size={30} /></View>
          <Text style={styles.cardText}>ترکیب فایل‌های PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AdvancedPdfScreen', { toolId: 'SPLIT_PDF' })}>
          <View style={styles.iconBox}><Scissors color="#e74c3c" size={30} /></View>
          <Text style={styles.cardText}>تقسیم‌بندی فایل PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AdvancedPdfScreen', { toolId: 'COMPRESS_PDF' })}>
          <View style={styles.iconBox}><Minimize2 color="#2ecc71" size={30} /></View>
          <Text style={styles.cardText}>فشرده‌سازی PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AdvancedPdfScreen', { toolId: 'DELETE_PAGES' })}>
          <View style={styles.iconBox}><FileMinus color="#e67e22" size={30} /></View>
          <Text style={styles.cardText}>حذف صفحات PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AdvancedPdfScreen', { toolId: 'EXTRACT_PAGES' })}>
          <View style={styles.iconBox}><FileOutput color="#9b59b6" size={30} /></View>
          <Text style={styles.cardText}>جداسازی صفحات PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AdvancedPdfScreen', { toolId: 'REORDER_PAGES' })}>
          <View style={styles.iconBox}><ArrowUpDown color="#1abc9c" size={30} /></View>
          <Text style={styles.cardText}>جابه‌جایی صفحات PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AdvancedPdfScreen', { toolId: 'ROTATE_PAGES' })}>
          <View style={styles.iconBox}><RotateCw color="#f1c40f" size={30} /></View>
          <Text style={styles.cardText}>چرخش صفحات PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AdvancedPdfScreen', { toolId: 'WATERMARK_PDF' })}>
          <View style={styles.iconBox}><Droplet color="#34495e" size={30} /></View>
          <Text style={styles.cardText}>افزودن واترمارک به PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AdvancedPdfScreen', { toolId: 'ENCRYPT_PDF' })}>
          <View style={styles.iconBox}><Lock color="#c0392b" size={30} /></View>
          <Text style={styles.cardText}>رمزگذاری PDF</Text>
        </TouchableOpacity>


      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  card: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 15, elevation: 2 },
  iconBox: { marginLeft: 15, padding: 10, backgroundColor: '#f5f6fa', borderRadius: 10 },
  cardText: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' }
});

export default ToolsListScreen;