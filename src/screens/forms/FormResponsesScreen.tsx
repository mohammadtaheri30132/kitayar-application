import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  Share,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  BarChart2,
  Users,
  Download,
  Share2,
  Search,
  CheckCircle,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
  FileText,
  Mic,
  Image as ImageIcon,
  Edit,
  Save,
  FileSpreadsheet,
} from 'lucide-react-native';
import {
  formService,
  FormAnalyticsResult,
  FormDataModel,
} from '../../services/forms/formService';
import { COLORS } from '../../theme/colors';

interface FormResponsesScreenProps {
  route: any;
  navigation: any;
}

export const FormResponsesScreen: React.FC<FormResponsesScreenProps> = ({ route, navigation }) => {
  const { formId, formTitle } = route.params;

  const [activeTab, setActiveTab] = useState<'analytics' | 'individual'>('analytics');
  const [analytics, setAnalytics] = useState<FormAnalyticsResult | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [form, setForm] = useState<FormDataModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected response for inspection & grading modal
  const [selectedResponse, setSelectedResponse] = useState<any | null>(null);
  const [gradingModalVisible, setGradingModalVisible] = useState<boolean>(false);
  const [manualGrades, setManualGrades] = useState<{ [qId: string]: { points: number; feedback: string } }>({});
  const [teacherNotes, setTeacherNotes] = useState<string>('');
  const [savingGrades, setSavingGrades] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [formData, analyticsData, responsesData] = await Promise.all([
        formService.getFormById(formId),
        formService.getAnalytics(formId),
        formService.getResponses(formId, { search: searchQuery }),
      ]);
      setForm(formData);
      setAnalytics(analyticsData);
      setResponses(responsesData?.data || []);
    } catch (err: any) {
      Alert.alert('خطا', 'خطا در دریافت نتایج و آمار فرم');
    } finally {
      setLoading(false);
    }
  }, [formId, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportCSV = async () => {
    try {
      const baseURL = formService.getPublicFormUrl('').replace('/forms/', '');
      const downloadUrl = `${baseURL}/api/teacher/forms/${formId}/export/csv`;
      Alert.alert(
        'خروجی اکسل (CSV)',
        'فایل اکسل با پشتیبانی کامل از حروف فارسی آماده است.',
        [
          { text: 'انصراف', style: 'cancel' },
          { text: 'دانلود در مرورگر', onPress: () => Linking.openURL(downloadUrl) },
          {
            text: 'اشتراک‌گذاری گزارش متنی',
            onPress: async () => {
              const summary = `گزارش فرم «${form?.title}»:\nتعداد کل پاسخ‌ها: ${analytics?.totalSubmissions || 0}\nدرصد تکمیل: ${analytics?.completionRate || 0}%\nمیانگین نمره: ${analytics?.averageQuizScore || 0}`;
              Share.share({ title: form?.title, message: summary });
            },
          },
        ]
      );
    } catch (err) {}
  };

  const openGradingModal = (responseItem: any) => {
    setSelectedResponse(responseItem);
    const initialGrades: any = {};
    if (responseItem.answers) {
      responseItem.answers.forEach((ans: any) => {
        initialGrades[ans.questionId] = {
          points: ans.pointsEarned || 0,
          feedback: ans.feedback || '',
        };
      });
    }
    setManualGrades(initialGrades);
    setTeacherNotes(responseItem.teacherNotes || '');
    setGradingModalVisible(true);
  };

  const handleSaveGrades = async () => {
    if (!selectedResponse) return;
    try {
      setSavingGrades(true);
      const gradesArray = Object.keys(manualGrades).map((qId) => ({
        questionId: qId,
        pointsEarned: manualGrades[qId].points,
        feedback: manualGrades[qId].feedback,
      }));

      await formService.gradeResponse(formId, selectedResponse._id, gradesArray, teacherNotes);
      setSavingGrades(false);
      setGradingModalVisible(false);
      Alert.alert('موفق', 'نمرات و بازخورد معلم با موفقیت ذخیره شد');
      fetchData();
    } catch (err) {
      setSavingGrades(false);
      Alert.alert('خطا', 'ثبت نمره ناموفق بود');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>در حال دریافت و تحلیل پاسخ‌ها...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowRight size={22} color="#1e293b" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            نتایج: {formTitle || form?.title}
          </Text>
          <Text style={styles.headerSubtitle}>
            {analytics?.totalSubmissions || 0} پاسخ ثبت شده
          </Text>
        </View>

        <TouchableOpacity style={styles.exportHeaderBtn} onPress={handleExportCSV} activeOpacity={0.7}>
          <Download size={20} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'analytics' && styles.tabItemActive]}
          onPress={() => setActiveTab('analytics')}
        >
          <BarChart2 size={16} color={activeTab === 'analytics' ? COLORS.primary : '#64748b'} style={{ marginLeft: 6 }} />
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.tabTextActive]}>
            آمار و تحلیل کلی
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'individual' && styles.tabItemActive]}
          onPress={() => setActiveTab('individual')}
        >
          <Users size={16} color={activeTab === 'individual' ? COLORS.primary : '#64748b'} style={{ marginLeft: 6 }} />
          <Text style={[styles.tabText, activeTab === 'individual' && styles.tabTextActive]}>
            پاسخ‌های انفرادی ({responses.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ================= TAB 1: ANALYTICS OVERVIEW ================= */}
      {activeTab === 'analytics' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top Metric Cards */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{analytics?.totalSubmissions || 0}</Text>
              <Text style={styles.metricLabel}>کل پاسخ‌ها</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: '#10b981' }]}>
                {analytics?.completionRate || 0}%
              </Text>
              <Text style={styles.metricLabel}>درصد تکمیل</Text>
            </View>

            {form?.settings?.isQuiz ? (
              <View style={styles.metricCard}>
                <Text style={[styles.metricValue, { color: '#8b5cf6' }]}>
                  {analytics?.averageQuizScore || 0}
                </Text>
                <Text style={styles.metricLabel}>میانگین نمره</Text>
              </View>
            ) : (
              <View style={styles.metricCard}>
                <Text style={[styles.metricValue, { color: '#0ea5e9' }]}>
                  {analytics?.avgDurationSeconds ? `${analytics.avgDurationSeconds}s` : '-'}
                </Text>
                <Text style={styles.metricLabel}>میانگین زمان</Text>
              </View>
            )}
          </View>

          {/* Question by question analytics */}
          <Text style={styles.sectionHeaderTitle}>تحلیل سوال به سوال</Text>

          {analytics?.questionAnalytics?.map((q, idx) => (
            <View key={q.questionId} style={styles.qAnalyticsCard}>
              <View style={styles.qAnalyticsTop}>
                <Text style={styles.qAnalyticsNumber}>سوال {idx + 1}</Text>
                <Text style={styles.qAnalyticsAnswered}>{q.answeredCount} پاسخ</Text>
              </View>

              <Text style={styles.qAnalyticsTitle}>{q.title}</Text>

              {/* Option Breakdown Bars */}
              {q.optionBreakdown && q.optionBreakdown.length > 0 && (
                <View style={styles.optionsBreakdownList}>
                  {q.optionBreakdown.map((opt, oIdx) => (
                    <View key={oIdx} style={styles.breakdownRow}>
                      <View style={styles.breakdownLabelRow}>
                        <Text style={styles.breakdownLabelText}>{opt.label}</Text>
                        <Text style={styles.breakdownPercentText}>
                          {opt.count} ({opt.percentage}%)
                        </Text>
                      </View>
                      <View style={styles.barBg}>
                        <View style={[styles.barFill, { width: `${opt.percentage}%` }]} />
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Numeric Stats */}
              {q.numericStats && q.numericStats.avg > 0 && (
                <View style={styles.numericStatsBox}>
                  <Text style={styles.numericStatsText}>
                    میانگین امتیاز: <Text style={{ fontWeight: 'bold' }}>{q.numericStats.avg}</Text> • کمترین: {q.numericStats.min} • بیشترین: {q.numericStats.max}
                  </Text>
                </View>
              )}

              {/* Text Samples List */}
              {q.textSamples && q.textSamples.length > 0 && (
                <View style={styles.textSamplesBox}>
                  <Text style={styles.textSamplesTitle}>نمونه پاسخ‌های متنی:</Text>
                  {q.textSamples.map((txt, tIdx) => (
                    <View key={tIdx} style={styles.textSampleChip}>
                      <Text style={styles.textSampleContent}>«{txt}»</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}

          {(!analytics?.questionAnalytics || analytics.questionAnalytics.length === 0) && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>هنوز پاسخی برای تحلیل وجود ندارد.</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* ================= TAB 2: INDIVIDUAL RESPONSES ================= */}
      {activeTab === 'individual' && (
        <View style={{ flex: 1 }}>
          {/* Search Box */}
          <View style={styles.searchSection}>
            <View style={styles.searchBox}>
              <Search size={18} color="#94a3b8" style={{ marginLeft: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="جستجوی نام یا شماره دانش‌آموز..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          <FlatList
            data={responses}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles.responseCard}
                onPress={() => openGradingModal(item)}
                activeOpacity={0.8}
              >
                <View style={styles.respCardHeader}>
                  <View style={styles.respNameBox}>
                    <Text style={styles.respName}>
                      {item.respondentName || `شرکت‌کننده ${index + 1}`}
                    </Text>
                    {item.respondentPhone ? (
                      <Text style={styles.respPhone}>{item.respondentPhone}</Text>
                    ) : null}
                  </View>

                  {form?.settings?.isQuiz && (
                    <View style={styles.scorePill}>
                      <Award size={14} color="#15803d" style={{ marginLeft: 4 }} />
                      <Text style={styles.scorePillText}>
                        {item.totalScore} از {item.maxPossibleScore}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.respCardFooter}>
                  <Text style={styles.respDate}>
                    {new Date(item.submittedAt).toLocaleString('fa-IR')}
                  </Text>
                  <Text style={styles.viewDetailsText}>مشاهده و ثبت نمره معلم 👈</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Users size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>هیچ پاسخی ثبت نشده است.</Text>
              </View>
            }
          />
        </View>
      )}

      {/* Response Details & Teacher Grading Modal */}
      <Modal
        visible={gradingModalVisible}
        animationType="slide"
        onRequestClose={() => setGradingModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setGradingModalVisible(false)} style={styles.backButton}>
              <ArrowRight size={22} color="#1e293b" />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.modalHeaderTitle}>بررسی پاسخ و نمره‌دهی</Text>
              <Text style={styles.modalHeaderSubtitle}>{selectedResponse?.respondentName || 'پاسخ دانش‌آموز'}</Text>
            </View>
            <TouchableOpacity style={styles.saveGradeBtn} onPress={handleSaveGrades} disabled={savingGrades}>
              {savingGrades ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Save size={16} color="#ffffff" style={{ marginLeft: 4 }} />
                  <Text style={styles.saveGradeBtnText}>ذخیره</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 16 }}>
            {selectedResponse?.answers?.map((ans: any, aIdx: number) => (
              <View key={ans.questionId} style={styles.answerCard}>
                <Text style={styles.answerCardNumber}>سوال {aIdx + 1}</Text>
                <Text style={styles.answerCardTitle}>{ans.questionTitle}</Text>

                <View style={styles.answerValueBox}>
                  <Text style={styles.answerValueLabel}>پاسخ ثبت شده:</Text>
                  <Text style={styles.answerValueText}>
                    {Array.isArray(ans.selectedOptionLabels) && ans.selectedOptionLabels.length > 0
                      ? ans.selectedOptionLabels.join(' ، ')
                      : ans.textValue || String(ans.value || 'بدون پاسخ')}
                  </Text>
                </View>

                {/* Audio Recording Link */}
                {ans.audioRecordingUrl && (
                  <TouchableOpacity
                    style={styles.attachmentBtn}
                    onPress={() => Linking.openURL(formService.getPublicFormUrl('').replace('/forms/', '') + ans.audioRecordingUrl)}
                  >
                    <Mic size={18} color="#9333ea" style={{ marginLeft: 8 }} />
                    <Text style={styles.attachmentBtnText}>شنیدن فایل صوتی ضبط‌شده 🎵</Text>
                  </TouchableOpacity>
                )}

                {/* Uploaded Files Link */}
                {ans.files && ans.files.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    {ans.files.map((f: any, fIdx: number) => (
                      <TouchableOpacity
                        key={fIdx}
                        style={styles.attachmentBtn}
                        onPress={() => Linking.openURL(formService.getPublicFormUrl('').replace('/forms/', '') + f.url)}
                      >
                        <ImageIcon size={18} color="#2563eb" style={{ marginLeft: 8 }} />
                        <Text style={styles.attachmentBtnText}>دانلود پیوست: {f.originalName}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Teacher Grading Inputs */}
                {form?.settings?.isQuiz && (
                  <View style={styles.gradingRow}>
                    <Text style={styles.gradingLabel}>نمره این سوال:</Text>
                    <TextInput
                      style={styles.gradeInput}
                      keyboardType="numeric"
                      value={String(manualGrades[ans.questionId]?.points ?? 0)}
                      onChangeText={(val) =>
                        setManualGrades({
                          ...manualGrades,
                          [ans.questionId]: {
                            ...manualGrades[ans.questionId],
                            points: Number(val) || 0,
                          },
                        })
                      }
                    />
                  </View>
                )}
              </View>
            ))}

            <View style={styles.teacherNotesCard}>
              <Text style={styles.teacherNotesTitle}>یادداشت و بازخورد کلی معلم:</Text>
              <TextInput
                style={styles.teacherNotesInput}
                value={teacherNotes}
                onChangeText={setTeacherNotes}
                placeholder="توضیحات و بازخورد معلم برای این دانش‌آموز..."
                multiline
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleBox: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  exportHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'left',
  },
  qAnalyticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qAnalyticsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  qAnalyticsNumber: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  qAnalyticsAnswered: {
    fontSize: 11,
    color: '#64748B',
  },
  qAnalyticsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 14,
    lineHeight: 20,
    textAlign: 'left',
  },
  optionsBreakdownList: {
    gap: 10,
  },
  breakdownRow: {
    marginBottom: 6,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  breakdownLabelText: {
    fontSize: 12,
    color: '#334155',
  },
  breakdownPercentText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: 'bold',
  },
  barBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  numericStatsBox: {
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  numericStatsText: {
    fontSize: 12,
    color: '#1E40AF',
  },
  textSamplesBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  textSamplesTitle: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
    textAlign: 'left',
  },
  textSampleChip: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textSampleContent: {
    fontSize: 12,
    color: '#334155',
    textAlign: 'left',
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
    textAlign: 'right',
  },
  listContent: {
    padding: 16,
  },
  responseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  respCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  respNameBox: {
    flex: 1,
  },
  respName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'left',
  },
  respPhone: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'left',
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  scorePillText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#15803D',
  },
  respCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  respDate: {
    fontSize: 10,
    color: '#94A3B8',
  },
  viewDetailsText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalHeaderTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  modalHeaderSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  saveGradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  saveGradeBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  answerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  answerCardNumber: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  answerCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'left',
  },
  answerValueBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  answerValueLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 4,
    textAlign: 'left',
  },
  answerValueText: {
    fontSize: 13,
    color: '#1E293B',
    textAlign: 'left',
  },
  attachmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  attachmentBtnText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  gradingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  gradingLabel: {
    fontSize: 12,
    color: '#475569',
    marginLeft: 8,
  },
  gradeInput: {
    width: 50,
    height: 32,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  teacherNotesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  teacherNotesTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'left',
  },
  teacherNotesInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 12,
    color: '#0F172A',
    textAlign: 'right',
  },
});

export default FormResponsesScreen;
