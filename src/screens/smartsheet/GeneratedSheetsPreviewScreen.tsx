import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { showError } from '../../components/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import {
  ChevronRight,
  Printer,
  Share2,
  ScanLine,
  CheckCircle2,
  FileText,
  QrCode,
  Users,
  Sparkles,
} from 'lucide-react-native';
import { smartSheetService } from '../../services/smartSheetService';
import { toPersianNumbers } from '../../utils/date/jalaliHelper';

export const GeneratedSheetsPreviewScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const { pdfUri, fileName, pageCount, examTitle, subject, className, schoolName, classId, examId, sheets } =
    route.params;

  const handleShare = async () => {
    try {
      await smartSheetService.sharePdf(pdfUri);
    } catch (e: any) {
      showError(e?.message || 'مشکلی در باز کردن پنجره اشتراک رخ داد');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate('SmartSheetHubScreen')}
          activeOpacity={0.7}
        >
          <ChevronRight color={colors.text} size={26} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>پاسخ‌برگ‌های تولید شده</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* بنر موفقیت تولید PDF */}
        <View style={[styles.successBanner, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
          <CheckCircle2 size={32} color="#059669" style={{ marginBottom: 8 }} />
          <Text style={styles.successTitle}>فایل PDF پاسخ‌برگ‌ها با موفقیت ایجاد شد!</Text>
          <Text style={styles.successDesc}>
            فایل PDF شامل {toPersianNumbers(pageCount)} برگه با بارکد QR اختصاصی و مشخصات شخصی هر دانش‌آموز آماده چاپ
            می‌باشد.
          </Text>
        </View>

        {/* کارت اطلاعات فایل */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textLight }]}>عنوان آزمون:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{examTitle}</Text>
          </View>
          {schoolName ? (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textLight }]}>مدرسه:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{schoolName}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textLight }]}>کلاس و درس:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {className} {subject ? `• ${subject}` : ''}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textLight }]}>تعداد صفحات PDF:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {toPersianNumbers(pageCount)} صفحه (یک برگه برای هر دانش‌آموز)
            </Text>
          </View>
        </View>

        {/* دکمه‌های اقدام اصلی */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
            <Printer size={18} color="#fff" style={{ marginLeft: 8 }} />
            <Text style={styles.shareBtnText}>اشتراک‌گذاری، دانلود و چاپ PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.startScanBtn, { backgroundColor: colors.surface, borderColor: '#4f46e5' }]}
            onPress={() =>
              navigation.navigate('SmartSheetScannerScreen', {
                expectedExamId: examId,
              })
            }
            activeOpacity={0.8}
          >
            <ScanLine size={18} color="#4f46e5" style={{ marginLeft: 8 }} />
            <Text style={styles.startScanBtnText}>شروع اسکن و تصحیح پاسخ‌برگ‌ها</Text>
          </TouchableOpacity>
        </View>

        {/* لیست پاسخ‌برگ‌های صادرشده دانش‌آموزان با کدهای یکتا */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 14 }]}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 10 }}>
            <Users size={16} color="#4f46e5" style={{ marginLeft: 6 }} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              لیست دانش‌آموزان و کدهای پاسخ‌برگ اختصاصی
            </Text>
          </View>

          {(sheets || []).map((sh: any, idx: number) => (
            <View key={sh.sheetCode || idx} style={[styles.sheetItemRow, { borderBottomColor: colors.border }]}>
              <View style={styles.sheetStudentInfo}>
                <Text style={[styles.sheetStudentIndex, { color: colors.textLight }]}>
                  {toPersianNumbers(idx + 1)}.
                </Text>
                <Text style={[styles.sheetStudentName, { color: colors.text }]}>{sh.studentName}</Text>
              </View>

              <View style={styles.sheetCodeBadge}>
                <QrCode size={11} color="#6d28d9" style={{ marginLeft: 4 }} />
                <Text style={styles.sheetCodeText}>{sh.sheetCode}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16.5, fontWeight: 'bold', fontFamily: 'IRANSansX' },
  content: { padding: 16, paddingBottom: 60 },
  successBanner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    color: '#065f46',
    textAlign: 'center',
    marginBottom: 6,
  },
  successDesc: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    color: '#047857',
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
  },
  infoValue: {
    fontSize: 12.5,
    fontFamily: 'IRANSansX',
    fontWeight: '600',
  },
  actionsContainer: {
    gap: 10,
    marginTop: 6,
  },
  shareBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    elevation: 3,
  },
  shareBtnText: {
    fontSize: 13.5,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  startScanBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 13,
  },
  startScanBtnText: {
    fontSize: 13.5,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  sheetItemRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  sheetStudentInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  sheetStudentIndex: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    marginLeft: 6,
  },
  sheetStudentName: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    fontWeight: '600',
  },
  sheetCodeBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sheetCodeText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    color: '#6d28d9',
    letterSpacing: 0.5,
  },
});

export default GeneratedSheetsPreviewScreen;
