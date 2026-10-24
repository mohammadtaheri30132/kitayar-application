import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import {
  ChevronRight,
  Plus,
  ScanLine,
  FileText,
  KeyRound,
  CheckCircle2,
  Clock,
  BookOpen,
  Users,
  Award,
  Share2,
  ArrowRight,
  FileCheck2,
} from 'lucide-react-native';
import { api } from '../../api/axiosConfig';
import { smartSheetService } from '../../services/smartSheetService';
import { toPersianNumbers } from '../../utils/date/jalaliHelper';

export const SmartSheetHubScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const passedClassId = route?.params?.classId || route?.params?.currentClassId;
  const passedClassName = route?.params?.className || route?.params?.currentClassName;
  const passedSchoolName = route?.params?.schoolName || route?.params?.classroom?.school?.name || route?.params?.classroom?.schoolName || '';

  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(passedClassId || '');
  const [sheetsSummary, setSheetsSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHubData = async () => {
    try {
      const classRes = await api.get('/teacher/classrooms');
      if (classRes.data?.success) {
        const clsList = classRes.data.data || [];
        setClassrooms(clsList);
        if (!selectedClassId && clsList.length > 0) {
          setSelectedClassId(clsList[0]._id);
        }
      }

      // Fetch sheets for the selected class or all
      const sheetsRes = await smartSheetService.getExamSheets('all', selectedClassId || undefined);
      if (sheetsRes && sheetsRes.sheets) {
        setSheetsSummary(sheetsRes.sheets);
      }
    } catch (e) {
      console.warn('Error fetching hub data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHubData();
    }, [selectedClassId])
  );

  // Group sheets by examTitle or examId
  const groupedExams = React.useMemo(() => {
    const map = new Map<string, any>();
    sheetsSummary.forEach((s) => {
      const key = s.examTitle || 'آزمون تستی';
      if (!map.has(key)) {
        map.set(key, {
          title: key,
          subject: s.subject,
          examDate: s.examDate,
          totalQuestions: s.totalQuestions,
          optionsPerQuestion: s.optionsPerQuestion,
          maxScore: s.maxScore,
          examId: s.exam,
          classId: s.classroom,
          sheets: [],
        });
      }
      map.get(key).sheets.push(s);
    });
    return Array.from(map.values());
  }, [sheetsSummary]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronRight color={colors.text} size={26} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>پاسخ‌برگ هوشمند تستی</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textLight }]}>
            تولید PDF اختصاصی و تصحیح خودکار با دوربین
          </Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchHubData();
            }}
            colors={[colors.primary]}
          />
        }
      >
        {/* بنر ۳ اقدام سریع اصلی */}
        <View style={styles.quickActionsContainer}>
          {/* دکمه ۱: تولید پاسخ‌برگ جدید */}
          <TouchableOpacity
            style={[styles.primaryActionCard, { backgroundColor: '#4f46e5' }]}
            onPress={() => {
              const currentCls = classrooms.find((c) => c._id === selectedClassId);
              navigation.navigate('CreateSmartExamScreen', {
                classId: selectedClassId,
                className: currentCls?.name || passedClassName,
                schoolName: currentCls?.school?.name || currentCls?.schoolName || passedSchoolName || '',
                classroom: currentCls || route?.params?.classroom,
              });
            }}
            activeOpacity={0.85}
          >
            <View style={styles.actionIconCircle}>
              <Plus size={22} color="#fff" />
            </View>
            <Text style={styles.primaryActionTitle}>تولید پاسخ‌برگ جدید</Text>
            <Text style={styles.primaryActionDesc}>
              انتخاب کلاس و دانش‌آموزان و تولید فایل PDF چاپی با بارکد اختصاصی
            </Text>
          </TouchableOpacity>

          <View style={styles.secondaryActionsRow}>
            {/* دکمه ۲: اسکن با دوربین */}
            <TouchableOpacity
              style={[styles.secondaryActionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate('SmartSheetScannerScreen')}
              activeOpacity={0.8}
            >
              <View style={[styles.secondaryIconCircle, { backgroundColor: '#ecfdf5' }]}>
                <ScanLine size={20} color="#059669" />
              </View>
              <Text style={[styles.secondaryActionTitle, { color: colors.text }]}>اسکن و تصحیح هوشمند</Text>
              <Text style={[styles.secondaryActionDesc, { color: colors.textLight }]}>
                تصحیح خودکار با دوربین یا عکس گالری
              </Text>
            </TouchableOpacity>

            {/* دکمه ۳: ورود دستی کد */}
            <TouchableOpacity
              style={[styles.secondaryActionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate('SmartSheetScannerScreen', { autoOpenManualModal: true })}
              activeOpacity={0.8}
            >
              <View style={[styles.secondaryIconCircle, { backgroundColor: '#fef3c7' }]}>
                <KeyRound size={20} color="#d97706" />
              </View>
              <Text style={[styles.secondaryActionTitle, { color: colors.text }]}>ورود دستی کد برگه</Text>
              <Text style={[styles.secondaryActionDesc, { color: colors.textLight }]}>
                در صورت مخدوش بودن QR کد
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* فیلتر کلاس‌ها */}
        {classrooms.length > 0 && (
          <View style={styles.classFilterWrapper}>
            <Text style={[styles.filterLabel, { color: colors.textLight }]}>فیلتر بر اساس کلاس:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classChipsRow}>
              {classrooms.map((cls) => {
                const isSelected = selectedClassId === cls._id;
                return (
                  <TouchableOpacity
                    key={cls._id}
                    style={[
                      styles.classChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedClassId(cls._id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.classChipText,
                        { color: isSelected ? '#ffffff' : colors.text, fontWeight: isSelected ? 'bold' : 'normal' },
                      ]}
                    >
                      {cls.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* بخش آزمون‌های اخیر با آمار پاسخ‌برگ‌ها */}
        <View style={styles.sectionHeaderRow}>
          <FileCheck2 size={18} color={colors.primary} style={{ marginLeft: 6 }} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>آزمون‌های تستی و برگه‌های صادر شده</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
        ) : groupedExams.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <FileText size={36} color="#94a3b8" style={{ marginBottom: 10 }} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>هنوز پاسخ‌برگی تولید نشده است</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textLight }]}>
              برای شروع، روی دکمه «تولید پاسخ‌برگ جدید» در بالای صفحه ضربه بزنید.
            </Text>
          </View>
        ) : (
          groupedExams.map((exam, idx) => {
            const total = exam.sheets.length;
            const graded = exam.sheets.filter((s: any) => s.status === 'GRADED').length;
            const percent = total > 0 ? Math.round((graded / total) * 100) : 0;

            const scores = exam.sheets
              .filter((s: any) => s.status === 'GRADED' && s.finalScore !== undefined)
              .map((s: any) => s.finalScore);
            const avg = scores.length > 0 ? (scores.reduce((a: any, b: any) => a + b, 0) / scores.length).toFixed(1) : '-';

            return (
              <View
                key={idx}
                style={[styles.examCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.examCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.examCardTitle, { color: colors.text }]}>{exam.title}</Text>
                    <Text style={[styles.examCardMeta, { color: colors.textLight }]}>
                      {exam.subject ? `درس: ${exam.subject} • ` : ''}
                      {toPersianNumbers(exam.totalQuestions)} سوال تستی ({toPersianNumbers(exam.optionsPerQuestion)} گزینه‌ای)
                    </Text>
                  </View>
                  <View style={[styles.badgePill, { backgroundColor: percent === 100 ? '#dcfce7' : '#ede9fe' }]}>
                    <Text style={[styles.badgePillText, { color: percent === 100 ? '#15803d' : '#6d28d9' }]}>
                      {percent === 100 ? 'تصحیح کامل' : `${toPersianNumbers(percent)}٪ تصحیح شده`}
                    </Text>
                  </View>
                </View>

                {/* آمار خلاصه کارت */}
                <View style={styles.examStatsRow}>
                  <View style={styles.statItem}>
                    <Users size={13} color="#64748b" style={{ marginLeft: 4 }} />
                    <Text style={styles.statItemText}>
                      کل برگه‌ها: {toPersianNumbers(total)}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <CheckCircle2 size={13} color="#16a34a" style={{ marginLeft: 4 }} />
                    <Text style={styles.statItemText}>
                      تصحیح شده: {toPersianNumbers(graded)}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Clock size={13} color="#d97706" style={{ marginLeft: 4 }} />
                    <Text style={styles.statItemText}>
                      در انتظار: {toPersianNumbers(total - graded)}
                    </Text>
                  </View>
                  {scores.length > 0 && (
                    <View style={styles.statItem}>
                      <Award size={13} color="#4f46e5" style={{ marginLeft: 4 }} />
                      <Text style={[styles.statItemText, { color: '#4f46e5', fontWeight: 'bold' }]}>
                        میانگین: {toPersianNumbers(avg)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* دکمه‌های اقدام روی آزمون */}
                <View style={styles.examCardActionsRow}>
                  <TouchableOpacity
                    style={[styles.examActionBtn, { backgroundColor: '#f1f5f9' }]}
                    onPress={() =>
                      navigation.navigate('ExamSheetsResultsScreen', {
                        examTitle: exam.title,
                        examId: exam.examId,
                        classId: exam.classId,
                        sheets: exam.sheets,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.examActionBtnText, { color: '#334155' }]}>مشاهده کارنامه و نتایج</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.examActionBtn, { backgroundColor: '#4f46e5' }]}
                    onPress={() =>
                      navigation.navigate('SmartSheetScannerScreen', {
                        expectedExamId: exam.examId,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <ScanLine size={14} color="#fff" style={{ marginLeft: 4 }} />
                    <Text style={[styles.examActionBtnText, { color: '#ffffff' }]}>ادامه اسکن برگه‌ها</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
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
  headerSubtitle: { fontSize: 11, fontFamily: 'IRANSansX', marginTop: 2 },
  content: { padding: 16, paddingBottom: 60 },
  quickActionsContainer: { marginBottom: 16 },
  primaryActionCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#4f46e5',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  actionIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  primaryActionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    color: '#ffffff',
    textAlign: 'right',
    marginBottom: 4,
  },
  primaryActionDesc: {
    fontSize: 11.5,
    fontFamily: 'IRANSansX',
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
    textAlign: 'right',
  },
  secondaryActionsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  secondaryActionCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  secondaryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  secondaryActionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: 'IRANSansX',
    textAlign: 'right',
    marginBottom: 3,
  },
  secondaryActionDesc: {
    fontSize: 10,
    fontFamily: 'IRANSansX',
    lineHeight: 14,
    textAlign: 'right',
  },
  classFilterWrapper: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 11.5,
    fontFamily: 'IRANSansX',
    textAlign: 'right',
    marginBottom: 6,
  },
  classChipsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  classChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  classChipText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
  },
  sectionHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },
  emptyBox: {
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    textAlign: 'center',
    lineHeight: 18,
  },
  examCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  examCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  examCardTitle: {
    fontSize: 14.5,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    textAlign: 'right',
    marginBottom: 3,
  },
  examCardMeta: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    textAlign: 'right',
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePillText: {
    fontSize: 10.5,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
  },
  examStatsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  statItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  statItemText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    color: '#334155',
  },
  examCardActionsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  examActionBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  examActionBtnText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
  },
});

export default SmartSheetHubScreen;
