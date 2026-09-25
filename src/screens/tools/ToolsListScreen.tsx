import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowUpDown, Crop, Droplet, FileArchive, FileMinus, FileOutput, 
  FileSpreadsheet, FileText, Grid, Image as ImageIcon, Layers, 
  Lock, Maximize, Mic, Minimize, Minimize2, Music, Presentation, 
  RotateCw, Scissors, ChevronLeft 
} from 'lucide-react-native';
import { COLORS } from '../../theme/colors';

// دسته‌بندی و ترتیب‌بندی ابزارها
const TOOLS_CATEGORIES = [
  {
    title: 'ابزارهای پرکاربرد تصویر',
    data: [
      { route: 'ImageResizeScreen', title: 'تغییر ابعاد عکس', Icon: Maximize, color: '#3498db' },
      { route: 'ImageCompressorScreen', title: 'کاهش حجم تصویر', Icon: Minimize, color: '#9b59b6' },
      { route: 'ImageCropScreen', title: 'برش تصویر (Crop)', Icon: Crop, color: '#e74c3c' },
      { route: 'CollageScreen', title: 'ترکیب عکس‌ها باهم', Icon: Grid, color: COLORS.primary },
      { route: 'ImageConverterScreen', title: 'تبدیل فرمت تصویر', Icon: ImageIcon, color: '#f39c12' },
    ]
  },
  {
    title: 'تبدیل اسناد و PDF',
    data: [
      { route: 'ConverterScreen', params: { toolType: 'IMAGE_TO_PDF', title: 'تبدیل عکس به PDF' }, title: 'تبدیل عکس به PDF', Icon: FileText, color: '#2ecc71' },
      { route: 'ConverterScreen', params: { toolType: 'PDF_TO_IMAGE', title: 'تبدیل PDF به عکس' }, title: 'تبدیل PDF به عکس', Icon: ImageIcon, color: '#e67e22' },
      { route: 'DocumentToPdfScreen', params: { type: 'WORD' }, title: 'تبدیل ورد به PDF', Icon: FileArchive, color: '#2980b9' },
      { route: 'DocumentToPdfScreen', params: { type: 'TEXT' }, title: 'تبدیل متن به PDF', Icon: FileText, color: '#34495E' },
      { route: 'DocumentToPdfScreen', params: { type: 'EXCEL' }, title: 'تبدیل اکسل به PDF', Icon: FileSpreadsheet, color: '#27ae60' },
      { route: 'DocumentToPdfScreen', params: { type: 'POWERPOINT' }, title: 'تبدیل پاورپوینت به PDF', Icon: Presentation, color: '#d35400' },
    ]
  },
  {
    title: 'مدیریت و ویرایش حرفه‌ای PDF',
    data: [
      { route: 'AdvancedPdfScreen', params: { toolId: 'MERGE_PDF' }, title: 'ترکیب فایل‌های PDF', Icon: Layers, color: '#3498db' },
      { route: 'AdvancedPdfScreen', params: { toolId: 'COMPRESS_PDF' }, title: 'فشرده‌سازی PDF', Icon: Minimize2, color: '#2ecc71' },
      { route: 'AdvancedPdfScreen', params: { toolId: 'SPLIT_PDF' }, title: 'تقسیم‌بندی فایل PDF', Icon: Scissors, color: '#e74c3c' },
      { route: 'AdvancedPdfScreen', params: { toolId: 'EXTRACT_PAGES' }, title: 'جداسازی صفحات PDF', Icon: FileOutput, color: '#9b59b6' },
      { route: 'AdvancedPdfScreen', params: { toolId: 'DELETE_PAGES' }, title: 'حذف صفحات PDF', Icon: FileMinus, color: '#e67e22' },
      { route: 'AdvancedPdfScreen', params: { toolId: 'REORDER_PAGES' }, title: 'جابه‌جایی صفحات PDF', Icon: ArrowUpDown, color: '#1abc9c' },
      { route: 'AdvancedPdfScreen', params: { toolId: 'ROTATE_PAGES' }, title: 'چرخش صفحات PDF', Icon: RotateCw, color: '#f1c40f' },
      { route: 'AdvancedPdfScreen', params: { toolId: 'WATERMARK_PDF' }, title: 'افزودن واترمارک به PDF', Icon: Droplet, color: '#34495e' },
      { route: 'AdvancedPdfScreen', params: { toolId: 'ENCRYPT_PDF' }, title: 'رمزگذاری PDF', Icon: Lock, color: '#c0392b' },
    ]
  },
  {
    title: 'ابزارهای ویدیو و صدا',
    data: [
      { route: 'VideoTrimScreen', title: 'برش حرفه‌ای ویدیو', Icon: Scissors, color: '#e74c3c' },
      { route: 'VideoToAudioScreen', title: 'تبدیل ویدیو به صوت', Icon: Music, color: '#9b59b6' },
      { route: 'AudioToTextScreen', title: 'تایپ صوتی (صوت به متن)', Icon: Mic, color: '#f39c12' },
    ]
  }
];

const ToolsListScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ابزارهای کیتایار</Text>
        <Text style={styles.headerSubtitle}>مجموعه امکانات و ابزارهای کاربردی</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {TOOLS_CATEGORIES.map((category, catIndex) => (
          <View key={catIndex} style={styles.categoryContainer}>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            
            <View style={styles.listWrapper}>
              {category.data.map((item, index) => {
                const isEven = index % 2 === 0;
                const backgroundColor = isEven ? '#FFFFFF' : '#F9FAFB';
                const isFirst = index === 0;
                const isLast = index === category.data.length - 1;

                return (
                  <TouchableOpacity 
                    key={index} 
                    style={[
                      styles.card, 
                      { backgroundColor },
                      isFirst && styles.firstCard,
                      isLast && styles.lastCard,
                    ]} 
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate(item.route, item.params)}
                  >
                    <View style={styles.cardContent}>
                      <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                        <item.Icon color={item.color} size={24} />
                      </View>
                      <Text style={styles.cardText}>{item.title}</Text>
                    </View>
                    <ChevronLeft color="#BDC3C7" size={20} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F3F4F6' 
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 25,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#1F2937',
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280'
  },
  scrollContent: { 
    padding: 16,
    paddingBottom: 40 
  },
  categoryContainer: {
    marginBottom: 25
  },
  categoryTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#4B5563', 
    textAlign: 'right', 
    marginBottom: 10,
    marginRight: 5
  },
  listWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 14, 
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  firstCard: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  lastCard: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: { 
    marginLeft: 15, 
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12 
  },
  cardText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#374151' 
  }
});

export default ToolsListScreen;