import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Share, 
  TextInput, 
  Switch, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from 'react-native';
import { showError, showSuccess, showConfirm } from '../../components/feedback';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { 
  Users, 
  FileText, 
  Settings, 
  Share2, 
  ArrowRight, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Copy,
  ExternalLink,
  GraduationCap,
  Calendar,
  Lock,
  Sparkles
} from 'lucide-react-native';
import { api } from '../../api/axiosConfig';
import { useTheme } from '../../context/ThemeContext';
import * as jalaali from 'jalaali-js';

const formatJalaliDateTime = (date: Date): string => {
  try {
    const { jy, jm, jd } = jalaali.toJalaali(date);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')} · ${hours}:${minutes}`;
  } catch {
    return 'نامشخص';
  }
};

const ExamDashboardScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { examId, examTitle } = route.params;

  const [participants, setParticipants] = useState<any[]>([]);
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'participants' | 'questions' | 'settings'>('participants');

  // Settings tab states
  const [title, setTitle] = useState(examTitle || '');
  const [totalScore, setTotalScore] = useState('');
  const [isUntimed, setIsUntimed] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [examIsActive, setExamIsActive] = useState(true);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    let interval: any;
    if (!isUntimed && endTime && examIsActive) {
      interval = setInterval(() => {
        const now = new Date().getTime();
        const end = new Date(endTime).getTime();
        const start = new Date(startTime).getTime();
        
        if (now >= start && now < end) {
          setTimeLeft(Math.floor((end - now) / 1000));
        } else {
          setTimeLeft(null);
        }
      }, 1000);
    } else {
      setTimeLeft(null);
    }
    return () => clearInterval(interval);
  }, [endTime, startTime, isUntimed, examIsActive]);

  const formatTimeLeft = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const fetchDashboardData = async () => {
    try {
      const response = await api.get(`/teacher/exams/${examId}/dashboard`);
      if (response.data.success) {
        setParticipants(response.data.data.participantsStatus || []);
        
        const questionsRes = await api.get(`/teacher/exams/${examId}`);
        if (questionsRes.data.success) {
          setExamQuestions(questionsRes.data.data.questions || []);
          const examData = questionsRes.data.data;
          setTitle(examData.title || examTitle);
          setTotalScore(String(examData.totalScore || 20));
          setIsUntimed(examData.isUntimed || false);
          setExamIsActive(examData.isActive !== false);
          if (examData.startTime) setStartTime(new Date(examData.startTime));
          if (examData.endTime) setEndTime(new Date(examData.endTime));
        }
      }
    } catch (error: any) {
      showError('مشکلی در دریافت اطلاعات داشبورد رخ داد.');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDashboardData(); }, []));

  const getStatusDisplay = (status: string, gradingStatus: string) => {
    if (status === 'تمام کرده') {
      if (gradingStatus === 'graded') return { text: 'تصحیح شده', bg: isDark ? '#064e3b33' : '#dcfce7', color: '#166534' };
      return { text: 'در انتظار تصحیح', bg: isDark ? '#1e3a8a33' : '#eff6ff', color: '#1e40af' };
    }
    if (status === 'در حال آزمون') return { text: 'در حال آزمون', bg: isDark ? '#78350f33' : '#fef3c7', color: '#b45309' };
    return { text: 'شروع نکرده', bg: isDark ? '#33415533' : '#f1f5f9', color: colors.textLight };
  };

  const renderStudentItem = ({ item, index }: { item: any, index: number }) => {
    const statusDisplay = getStatusDisplay(item.status, item.gradingStatus);
    const isClickable = item.status === 'تمام کرده';
    const fullName = item.firstNameSnapshot || item.lastNameSnapshot || item.fatherNameSnapshot
      ? `${item.firstNameSnapshot || ''} ${item.lastNameSnapshot || ''} ${item.fatherNameSnapshot ? `(فرزند ${item.fatherNameSnapshot})` : ''}`.trim()
      : 'بدون نام';

    return (
      <TouchableOpacity 
        style={[
          styles.studentCard, 
          { backgroundColor: colors.surface, borderColor: colors.border },
          !isClickable && { opacity: 0.85 }
        ]}
        activeOpacity={isClickable ? 0.7 : 1}
        onPress={() => {
          if (isClickable) {
            navigation.navigate('GradeStudentScreen', { examId, sessionId: item.sessionId, studentIdentifier: item.identifier });
          }
        }}
      >
        <View style={styles.studentCardRight}>
          <View style={[styles.avatar, { backgroundColor: isDark ? '#1e293b' : '#eff6ff' }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{index + 1}</Text>
          </View>
          <View style={{ marginRight: 10, flex: 1 }}>
            <Text style={[styles.studentName, { color: colors.text }]} numberOfLines={1}>{fullName}</Text>
            <Text style={[styles.studentMeta, { color: colors.textLight }]}>شماره دانش‌آموز: {item.identifier}</Text>
            {item.gradingStatus === 'graded' && (
              <Text style={styles.scoreText}>نمره کسب‌شده: {item.score}</Text>
            )}
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusDisplay.bg }]}>
          <Text style={[styles.statusBadgeText, { color: statusDisplay.color }]}>{statusDisplay.text}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const showDateTimePicker = (target: 'start' | 'end') => {
    const currentValue = target === 'start' ? startTime : endTime;
    DateTimePickerAndroid.open({
      value: currentValue,
      mode: 'date',
      onChange: (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (event.type === 'dismissed' || !selectedDate) return;
        DateTimePickerAndroid.open({
          value: selectedDate,
          mode: 'time',
          is24Hour: true,
          onChange: (timeEvent: DateTimePickerEvent, finalDate?: Date) => {
            if (timeEvent.type === 'dismissed' || !finalDate) return;
            if (target === 'start') setStartTime(finalDate);
            else setEndTime(finalDate);
          },
        });
      },
    });
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const response = await api.put(`/teacher/exams/${examId}`, {
        title,
        totalScore: Number(totalScore),
        isUntimed,
        startTime: isUntimed ? null : startTime.toISOString(),
        endTime: isUntimed ? null : endTime.toISOString(),
      });
      if (response.data.success) {
        showSuccess('تنظیمات آزمون ذخیره شد');
        fetchDashboardData();
      }
    } catch (error) {
      showError('ویرایش تنظیمات امکان‌پذیر نیست.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDeleteExam = () => {
    showConfirm({
      title: 'حذف آزمون',
      message: 'آیا از حذف این آزمون مطمئن هستید؟ این عملیات غیرقابل بازگشت است.',
      confirmText: 'حذف',
      cancelText: 'انصراف',
      isDestructive: true,
      icon: 'delete',
      onConfirm: async () => {
        try {
          const res = await api.delete(`/teacher/exams/${examId}`);
          if (res.data.success) {
            showSuccess('آزمون با موفقیت حذف شد');
            navigation.goBack();
          }
        } catch (err: any) {
          showError(err.response?.data?.message || 'مشکلی در حذف آزمون رخ داد');
        }
      },
    });
  };

  const handleCloseExam = () => {
    showConfirm({
      title: 'بستن آزمون',
      message: 'آیا مطمئن هستید که می‌خواهید آزمون را هم‌اکنون ببندید؟ دانش‌آموزان دیگر قادر به ادامه یا ارسال پاسخ نخواهند بود.',
      confirmText: 'بستن آزمون',
      cancelText: 'انصراف',
      isDestructive: true,
      icon: 'warning',
      onConfirm: async () => {
        try {
          const res = await api.patch(`/teacher/exams/${examId}/end`);
          if (res.data.success) {
            showSuccess('آزمون بسته شد.');
            setExamIsActive(false);
            setTimeLeft(null);
            fetchDashboardData();
          }
        } catch (err: any) {
          showError(err.response?.data?.message || 'مشکلی رخ داد');
        }
      },
    });
  };

  const baseURL = api.defaults.baseURL || 'http://192.168.1.128:5001/api';
  const WEB_BASE_URL = baseURL.replace('/api', ''); 
  const examLink = `${WEB_BASE_URL}/exam/join/${examId}`;

  const handleShareLink = () => {
    Share.share({
      title: examTitle,
      message: `📚 لینک ورود به آزمون آنلاین: ${examTitle}\n\nجهت شرکت در آزمون، روی لینک زیر بزنید:\n${examLink}\n\n(بدون نیاز به نصب برنامه - قابل اجرا در مرورگر موبایل و رایانه)`
    });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header with Safe Area Insets */}
        <View style={[
          styles.header, 
          { 
            backgroundColor: colors.surface, 
            borderBottomColor: colors.border,
            paddingTop: Math.max(insets.top, 12) + 8
          }
        ]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowRight size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{examTitle}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.primary }]}>مدیریت و وضعیت آزمون</Text>
          </View>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteExam}>
            <Trash2 size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Prominent Hero Share Card */}
        <View style={[
          styles.shareCard, 
          { 
            backgroundColor: isDark ? '#1e293b' : '#eff6ff', 
            borderColor: isDark ? '#3b82f644' : '#bfdbfe' 
          }
        ]}>
          <View style={styles.shareCardHeader}>
            <View style={styles.shareCardTitleRow}>
              <View style={[styles.shareIconCircle, { backgroundColor: colors.primary }]}>
                <Share2 size={16} color="#ffffff" />
              </View>
              <View style={{ marginRight: 8, flex: 1 }}>
                <Text style={[styles.shareCardTitle, { color: colors.text }]}>لینک اختصاصی شرکت در آزمون</Text>
                <Text style={[styles.shareCardSubtitle, { color: colors.textLight }]}>
                  اشتراک مستقیم با دانش‌آموزان کلاس در شاد، ایتا و بله
                </Text>
              </View>
            </View>
          </View>

          <Text style={[styles.shareCardDescription, { color: isDark ? '#94a3b8' : '#475569' }]}>
            دانش‌آموزان با لمس این پیوند در مرورگر گوشی یا کامپیوتر بدون نیاز به نصب هیچ برنامه‌ای وارد جلسه آزمون می‌شوند.
          </Text>

          {/* Link Container with Copy/Share button */}
          <View style={[styles.linkBox, { backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: colors.border }]}>
            <Text style={[styles.linkUrlText, { color: colors.primary }]} numberOfLines={1} selectable>
              {examLink}
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.mainShareButton, { backgroundColor: colors.primary }]}
            onPress={handleShareLink}
            activeOpacity={0.8}
          >
            <Share2 size={16} color="#ffffff" />
            <Text style={styles.mainShareButtonText}>ارسال لینک به دانش‌آموزان</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Status Bar & Close Exam Action */}
        <View style={[styles.statusContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.timerBox}>
            <Text style={[styles.timerLabel, { color: colors.textLight }]}>وضعیت برگزاری:</Text>
            {isUntimed && examIsActive ? (
              <Text style={styles.timerActiveText}>در حال برگزاری (بدون محدودیت زمان)</Text>
            ) : timeLeft !== null ? (
              <Text style={styles.timerActiveText}>{formatTimeLeft(timeLeft)} مانده</Text>
            ) : !examIsActive ? (
              <Text style={styles.timerClosedText}>پایان یافته</Text>
            ) : (
              <Text style={styles.timerPendingText}>شروع نشده</Text>
            )}
          </View>
          
          {(timeLeft !== null || (isUntimed && examIsActive) || examIsActive) && (
            <TouchableOpacity 
              style={styles.closeExamBtn} 
              onPress={handleCloseExam}
            >
              <Text style={styles.closeExamBtnText}>بستن آزمون</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontal Scrollable Tabs - Never Truncates Text */}
        <View style={[styles.tabsWrapper, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
          >
            <TouchableOpacity 
              style={[
                styles.tabItem, 
                activeTab === 'participants' && [styles.activeTabItem, { borderBottomColor: colors.primary }]
              ]} 
              onPress={() => setActiveTab('participants')}
            >
              <Users size={16} color={activeTab === 'participants' ? colors.primary : colors.textLight} />
              <Text style={[
                styles.tabText, 
                { color: activeTab === 'participants' ? colors.primary : colors.textLight },
                activeTab === 'participants' && styles.activeTabText
              ]}>
                شرکت‌کنندگان ({participants.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.tabItem, 
                activeTab === 'questions' && [styles.activeTabItem, { borderBottomColor: colors.primary }]
              ]} 
              onPress={() => setActiveTab('questions')}
            >
              <FileText size={16} color={activeTab === 'questions' ? colors.primary : colors.textLight} />
              <Text style={[
                styles.tabText, 
                { color: activeTab === 'questions' ? colors.primary : colors.textLight },
                activeTab === 'questions' && styles.activeTabText
              ]}>
                سوالات ({examQuestions.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.tabItem, 
                activeTab === 'settings' && [styles.activeTabItem, { borderBottomColor: colors.primary }]
              ]} 
              onPress={() => setActiveTab('settings')}
            >
              <Settings size={16} color={activeTab === 'settings' ? colors.primary : colors.textLight} />
              <Text style={[
                styles.tabText, 
                { color: activeTab === 'settings' ? colors.primary : colors.textLight },
                activeTab === 'settings' && styles.activeTabText
              ]}>
                تنظیمات آزمون
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Tab Content */}
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textLight }]}>در حال بارگذاری اطلاعات آزمون...</Text>
          </View>
        ) : activeTab === 'participants' ? (
          <View style={{ flex: 1 }}>
            {participants.length === 0 ? (
              <View style={styles.centerBox}>
                <Users size={48} color={colors.textLight} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>هنوز دانش‌آموزی در آزمون شرکت نکرده است.</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textLight }]}>
                  لینک آزمون را برای دانش‌آموزان کلاس ارسال کنید.
                </Text>
              </View>
            ) : (
              <FlatList
                data={participants}
                keyExtractor={(item) => item.identifier}
                renderItem={renderStudentItem}
                contentContainerStyle={[styles.listContainer, { paddingBottom: 85 }]}
                showsVerticalScrollIndicator={false}
              />
            )}
            
            {participants.length > 0 && (
              <View style={[styles.footerButtons, { bottom: Math.max(insets.bottom, 12) }]}>
                <TouchableOpacity 
                  style={[styles.finalizeBtn, { backgroundColor: '#16a34a' }]} 
                  onPress={() => navigation.navigate('FinalizeGradesScreen', { examId, examTitle })}
                >
                  <Text style={styles.finalizeBtnText}>📋 ثبت نهایی نمرات در دفتر کلاسی</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : activeTab === 'questions' ? (
          <View style={{ flex: 1 }}>
            <View style={[styles.questionsHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.questionsCountText, { color: colors.text }]}>
                تعداد کل سوالات: <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{examQuestions.length}</Text>
              </Text>
              <TouchableOpacity 
                style={[styles.editQuestionsBtn, { backgroundColor: isDark ? '#1e293b' : '#eff6ff' }]}
                onPress={() => navigation.navigate('EditExamScreen', { examId, examTitle })}
              >
                <Edit3 size={14} color={colors.primary} style={{ marginLeft: 4 }} />
                <Text style={[styles.editQuestionsBtnText, { color: colors.primary }]}>ویرایش سوالات</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={examQuestions}
              keyExtractor={(item, index) => item._id || index.toString()}
              renderItem={({ item, index }) => (
                <View style={[styles.questionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.questionCardHeader}>
                    <Text style={[styles.questionNumber, { color: colors.primary }]}>سوال {index + 1}</Text>
                    {item.type && (
                      <View style={[styles.typeBadge, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                        <Text style={[styles.typeBadgeText, { color: colors.textLight }]}>{item.type}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.questionText, { color: colors.text }]}>
                    {item.question ? item.question.replace(/<[^>]+>/g, '').trim() : ''}
                  </Text>
                </View>
              )}
              contentContainerStyle={[styles.listContainer, { paddingTop: 10, paddingBottom: 40 }]}
            />
          </View>
        ) : (
          <ScrollView contentContainerStyle={[styles.listContainer, { paddingBottom: Math.max(insets.bottom, 40) }]}>
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.label, { color: colors.text }]}>عنوان آزمون</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', color: colors.text, borderColor: colors.border }]} 
                value={title} 
                onChangeText={setTitle} 
                textAlign="right" 
              />

              <Text style={[styles.label, { color: colors.text }]}>نمره کل آزمون</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', color: colors.text, borderColor: colors.border }]} 
                value={totalScore} 
                onChangeText={setTotalScore} 
                keyboardType="numeric" 
                textAlign="right" 
              />

              <View style={[styles.switchRow, { borderBottomColor: colors.border }]}>
                <Switch
                  value={isUntimed}
                  onValueChange={setIsUntimed}
                  trackColor={{ false: '#cbd5e1', true: '#bbf7d0' }}
                  thumbColor={isUntimed ? '#16a34a' : '#f8fafc'}
                />
                <Text style={[styles.switchLabel, { color: colors.text }]}>آزمون آزاد (بدون محدودیت زمانی)</Text>
              </View>

              {!isUntimed && (
                <>
                  <Text style={[styles.label, { color: colors.text }]}>زمان شروع آزمون</Text>
                  <TouchableOpacity 
                    style={[styles.datePickerBtn, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]} 
                    onPress={() => showDateTimePicker('start')}
                  >
                    <Calendar size={15} color={colors.primary} style={{ marginLeft: 6 }} />
                    <Text style={[styles.datePickerText, { color: colors.text }]}>{formatJalaliDateTime(startTime)}</Text>
                  </TouchableOpacity>

                  <Text style={[styles.label, { color: colors.text }]}>زمان پایان آزمون</Text>
                  <TouchableOpacity 
                    style={[styles.datePickerBtn, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]} 
                    onPress={() => showDateTimePicker('end')}
                  >
                    <Clock size={15} color={colors.primary} style={{ marginLeft: 6 }} />
                    <Text style={[styles.datePickerText, { color: colors.text }]}>{formatJalaliDateTime(endTime)}</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: colors.primary }]} 
                onPress={handleSaveSettings} 
                disabled={isSavingSettings}
              >
                {isSavingSettings ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>ذخیره تغییرات آزمون</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: { 
    flexDirection: 'row-reverse', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingBottom: 14, 
    borderBottomWidth: 1, 
    elevation: 2, 
    zIndex: 10 
  },
  headerCenter: { 
    flex: 1, 
    alignItems: 'center' 
  },
  headerTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  headerSubtitle: { 
    fontSize: 12, 
    marginTop: 2, 
    textAlign: 'center' 
  },
  backButton: { 
    padding: 8 
  },
  deleteButton: { 
    padding: 8 
  },

  shareCard: {
    margin: 14,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  shareCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareCardTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  shareIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  shareCardSubtitle: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'right',
  },
  shareCardDescription: {
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'right',
    marginBottom: 10,
  },
  linkBox: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  linkUrlText: {
    fontSize: 12,
    textAlign: 'left',
    fontWeight: '600',
  },
  mainShareButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 10,
  },
  mainShareButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },

  statusContainer: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginHorizontal: 14, 
    marginBottom: 8, 
    padding: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
  },
  timerBox: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center',
    gap: 6,
  },
  timerLabel: { 
    fontSize: 12, 
    fontWeight: 'bold',
    textAlign: 'right' 
  },
  timerActiveText: { 
    fontSize: 12, 
    color: '#059669', 
    fontWeight: 'bold' 
  },
  timerClosedText: { 
    fontSize: 12, 
    color: '#dc2626', 
    fontWeight: 'bold' 
  },
  timerPendingText: { 
    fontSize: 12, 
    color: '#d97706', 
    fontWeight: 'bold' 
  },
  closeExamBtn: { 
    backgroundColor: '#fee2e2', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#fca5a5' 
  },
  closeExamBtnText: { 
    color: '#dc2626', 
    fontSize: 11, 
    fontWeight: 'bold' 
  },

  tabsWrapper: {
    borderBottomWidth: 1,
  },
  tabsScrollContent: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 12,
  },
  tabItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {},
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    fontWeight: 'bold',
  },

  listContainer: { 
    padding: 14 
  },
  studentCard: { 
    flexDirection: 'row-reverse', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 10, 
    borderWidth: 1, 
  },
  studentCardRight: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center',
    flex: 1, 
  },
  avatar: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  avatarText: { 
    fontWeight: 'bold', 
    fontSize: 12 
  },
  studentName: { 
    fontSize: 13, 
    fontWeight: 'bold',
    textAlign: 'right' 
  },
  studentMeta: { 
    fontSize: 11, 
    marginTop: 2,
    textAlign: 'right' 
  },
  scoreText: { 
    fontSize: 11, 
    color: '#166534', 
    fontWeight: 'bold', 
    marginTop: 3, 
    textAlign: 'right' 
  },
  statusBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  statusBadgeText: { 
    fontSize: 11, 
    fontWeight: 'bold' 
  },

  centerBox: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 30 
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 12,
    textAlign: 'center',
  },

  finalizeBtn: { 
    paddingVertical: 14, 
    borderRadius: 12, 
    alignItems: 'center', 
    flex: 1 
  },
  finalizeBtnText: { 
    color: '#ffffff', 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  footerButtons: { 
    position: 'absolute', 
    left: 16, 
    right: 16 
  },

  questionsHeader: { 
    flexDirection: 'row-reverse', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingTop: 12, 
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  questionsCountText: { 
    fontSize: 13, 
    textAlign: 'right' 
  },
  editQuestionsBtn: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8 
  },
  editQuestionsBtnText: { 
    fontSize: 12, 
    fontWeight: 'bold' 
  },

  questionCard: { 
    padding: 14, 
    borderRadius: 12, 
    marginBottom: 10, 
    borderWidth: 1, 
  },
  questionCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionNumber: { 
    fontSize: 13, 
    fontWeight: 'bold', 
    textAlign: 'right' 
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  questionText: { 
    fontSize: 13, 
    textAlign: 'right', 
    lineHeight: 22 
  },

  formCard: { 
    padding: 16, 
    borderRadius: 14, 
    borderWidth: 1, 
    marginBottom: 20 
  },
  label: { 
    fontSize: 13, 
    fontWeight: 'bold', 
    marginBottom: 6, 
    textAlign: 'right' 
  },
  input: { 
    borderWidth: 1, 
    borderRadius: 10, 
    padding: 12, 
    fontSize: 14, 
    marginBottom: 16 
  },
  switchRow: { 
    flexDirection: 'row-reverse', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16, 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
  },
  switchLabel: { 
    fontSize: 13, 
    fontWeight: '600',
    textAlign: 'right' 
  },
  datePickerBtn: { 
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1, 
    padding: 12, 
    borderRadius: 10, 
    marginBottom: 16, 
    justifyContent: 'flex-start',
  },
  datePickerText: { 
    fontSize: 13, 
    fontWeight: '600' 
  },
  saveBtn: { 
    padding: 14, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 8 
  },
  saveBtnText: { 
    color: '#ffffff', 
    fontWeight: 'bold', 
    fontSize: 14 
  },
});

export default ExamDashboardScreen;
