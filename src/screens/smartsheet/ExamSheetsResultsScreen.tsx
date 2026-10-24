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
  CheckCircle2,
  Clock,
  Award,
  Users,
  ScanLine,
  Edit2,
  Check,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react-native';
import { smartSheetService } from '../../services/smartSheetService';
import { toPersianNumbers } from '../../utils/date/jalaliHelper';

export const ExamSheetsResultsScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const { examTitle, examId, classId, sheets: initialSheets } = route.params;

  const [sheets, setSheets] = useState<any[]>(initialSheets || []);
  const [loading, setLoading] = useState(!initialSheets);
  const [refreshing, setRefreshing] = useState(false);

  const fetchResults = async () => {
    try {
      const res = await smartSheetService.getExamSheets(examId || 'all', classId);
      if (res && res.sheets) {
        // filter by examTitle if examId wasn't set
        const filtered = examId
          ? res.sheets.filter((s: any) => s.exam === examId)
          : res.sheets.filter((s: any) => s.examTitle === examTitle);
        setSheets(filtered.length > 0 ? filtered : res.sheets);
      }
    } catch (e) {
      console.warn('Error fetching results:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchResults();
    }, [examId, classId])
  );

  const total = sheets.length;
  const graded = sheets.filter((s) => s.status === 'GRADED');
  const pending = sheets.filter((s) => s.status === 'PENDING');
  const gradedCount = graded.length;
  const pendingCount = pending.length;

  const scores = graded.map((s) => s.finalScore || 0);
  const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : '۰';
  const maxPossible = sheets[0]?.maxScore || 20;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronRight color={colors.text} size={26} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{examTitle}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textLight }]}>کارنامه و نتایج کلی دانش‌آموزان</Text>
        </View>
        <TouchableOpacity
          style={styles.scanHeaderBtn}
          onPress={() => navigation.navigate('SmartSheetScannerScreen', { expectedExamId: examId })}
          activeOpacity={0.7}
        >
          <ScanLine size={18} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchResults();
            }}
            colors={[colors.primary]}
          />
        }
      >
        {/* کارت آمار عملکرد کلی کلاس */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.heroRow}>
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatValue, { color: colors.text }]}>{toPersianNumbers(total)}</Text>
              <Text style={styles.heroStatLabel}>کل دانش‌آموزان</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatValue, { color: '#16a34a' }]}>{toPersianNumbers(gradedCount)}</Text>
              <Text style={styles.heroStatLabel}>تصحیح شده</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatValue, { color: '#d97706' }]}>{toPersianNumbers(pendingCount)}</Text>
              <Text style={styles.heroStatLabel}>در انتظار اسکن</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatValue, { color: '#4f46e5' }]}>
                {toPersianNumbers(avgScore)}
              </Text>
              <Text style={styles.heroStatLabel}>میانگین نمرات</Text>
            </View>
          </View>
        </View>

        {/* دکمه اسکن برگه جدید */}
        <TouchableOpacity
          style={styles.scanNextBtn}
          onPress={() => navigation.navigate('SmartSheetScannerScreen', { expectedExamId: examId })}
          activeOpacity={0.85}
        >
          <ScanLine size={18} color="#fff" style={{ marginLeft: 6 }} />
          <Text style={styles.scanNextBtnText}>اسکن و تصحیح برگه دانش‌آموزان</Text>
        </TouchableOpacity>

        {/* لیست نتایج دانش‌آموزان */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <Users size={16} color="#4f46e5" style={{ marginLeft: 6 }} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>ریز نمرات دانش‌آموزان</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#4f46e5" style={{ marginVertical: 18 }} />
          ) : (
            sheets.map((sh, idx) => {
              const isGraded = sh.status === 'GRADED';
              return (
                <View key={sh.sheetCode || idx} style={[styles.studentResultRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.studentInfoCol}>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                      <Text style={[styles.studentIndex, { color: colors.textLight }]}>
                        {toPersianNumbers(idx + 1)}.
                      </Text>
                      <Text style={[styles.studentName, { color: colors.text }]}>{sh.studentName}</Text>
                    </View>
                    <Text style={styles.sheetCodeText}>کد: {sh.sheetCode}</Text>
                  </View>

                  <View style={styles.scoreActionCol}>
                    {isGraded ? (
                      <View style={styles.gradedScoreBadge}>
                        <Award size={13} color="#166534" style={{ marginLeft: 4 }} />
                        <Text style={styles.gradedScoreText}>
                          {toPersianNumbers(sh.finalScore)} از {toPersianNumbers(maxPossible)}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.pendingBadge}>
                        <Clock size={12} color="#d97706" style={{ marginLeft: 4 }} />
                        <Text style={styles.pendingBadgeText}>تصحیح نشده</Text>
                      </View>
                    )}

                    {/* دکمه بازبینی یا تصحیح دستی */}
                    <TouchableOpacity
                      style={styles.editResultBtn}
                      onPress={async () => {
                        const details = await smartSheetService.lookupSheetByCode(sh.sheetCode);
                        navigation.navigate('ManualGradingScreen', { sheetDetails: details });
                      }}
                      activeOpacity={0.7}
                    >
                      <Edit2 size={13} color="#6366f1" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
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
  scanHeaderBtn: { padding: 6, borderRadius: 8, backgroundColor: '#ede9fe' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', fontFamily: 'IRANSansX' },
  headerSubtitle: { fontSize: 11, fontFamily: 'IRANSansX', marginTop: 2 },
  content: { padding: 16, paddingBottom: 60 },
  heroCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  heroRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  heroStatItem: {
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },
  heroStatLabel: {
    fontSize: 10,
    fontFamily: 'IRANSansX',
    color: '#64748b',
    marginTop: 2,
  },
  heroDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#e2e8f0',
  },
  scanNextBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 13,
    marginBottom: 14,
    elevation: 3,
  },
  scanNextBtnText: {
    fontSize: 13.5,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },
  studentResultRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  studentInfoCol: {
    flex: 1,
  },
  studentIndex: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    marginLeft: 6,
  },
  studentName: {
    fontSize: 13.5,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
  },
  sheetCodeText: {
    fontSize: 10,
    fontFamily: 'IRANSansX',
    color: '#64748b',
    marginTop: 2,
  },
  scoreActionCol: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  gradedScoreBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gradedScoreText: {
    fontSize: 11.5,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    color: '#166534',
  },
  pendingBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 10.5,
    fontFamily: 'IRANSansX',
    fontWeight: '600',
    color: '#92400e',
  },
  editResultBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
});

export default ExamSheetsResultsScreen;
