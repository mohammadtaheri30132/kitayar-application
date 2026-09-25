import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Share, TextInput, Switch, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Users, FileText, Settings, Share2, ChevronRight, PenSquare, Edit3, Trash2 } from 'lucide-react-native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';

const ExamDashboardScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { examId, examTitle } = route.params;

  const [participants, setParticipants] = useState<any[]>([]);
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'participants' | 'questions' | 'settings'>('participants');

  // استیت‌های تب تنظیمات
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
        setParticipants(response.data.data.participantsStatus);
        
        const questionsRes = await api.get(`/teacher/exams/${examId}`);
        if (questionsRes.data.success) {
          setExamQuestions(questionsRes.data.data.questions);
          // مقداردهی اولیه تنظیمات
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
      Alert.alert('خطا', 'مشکلی در دریافت اطلاعات داشبورد رخ داد.');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDashboardData(); }, []));

  const getStatusDisplay = (status: string, gradingStatus: string) => {
    if (status === 'تمام کرده') {
      if (gradingStatus === 'graded') return { text: 'تصحیح شده', bg: '#dcfce7', color: '#166534' };
      return { text: 'در انتظار تصحیح', bg: '#eff6ff', color: '#1e40af' };
    }
    if (status === 'در حال آزمون') return { text: 'در حال آزمون', bg: '#fef3c7', color: '#92400e' };
    return { text: 'شروع نکرده', bg: '#f1f5f9', color: '#475569' };
  };

  const renderStudentItem = ({ item, index }: { item: any, index: number }) => {
    const statusDisplay = getStatusDisplay(item.status, item.gradingStatus);
    const isClickable = item.status === 'تمام کرده';
    const fullName = item.firstNameSnapshot || item.lastNameSnapshot || item.fatherNameSnapshot
      ? `${item.firstNameSnapshot || ''} ${item.lastNameSnapshot || ''} ${item.fatherNameSnapshot ? `(فرزند ${item.fatherNameSnapshot})` : ''}`.trim()
      : 'بدون نام';

    return (
      <TouchableOpacity 
        style={[styles.card, !isClickable && styles.cardDisabled]}
        activeOpacity={isClickable ? 0.7 : 1}
        onPress={() => {
          if (isClickable) {
            navigation.navigate('GradeStudentScreen', { examId, sessionId: item.sessionId, studentIdentifier: item.identifier });
          }
        }}
      >
        <View style={styles.cardLeft}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{index + 1}</Text></View>
          <View>
            <Text style={[styles.studentPhone, { fontSize: 14, fontWeight: 'bold', color: COLORS.text }]}>{fullName}</Text>
            <Text style={[styles.studentPhone, { marginTop: 2, fontSize: 12, color: COLORS.textLight }]}>شماره: {item.identifier}</Text>
            {item.gradingStatus === 'graded' && <Text style={styles.scoreText}>نمره: {item.score}</Text>}
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: statusDisplay.bg }]}>
          <Text style={[styles.badgeText, { color: statusDisplay.color }]}>{statusDisplay.text}</Text>
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
        Alert.alert('موفقیت', 'تنظیمات آزمون ذخیره شد');
        fetchDashboardData();
      }
    } catch (error) {
      Alert.alert('خطا', 'ویرایش تنظیمات امکان‌پذیر نیست.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} - ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const handleDeleteExam = () => {
    Alert.alert(
      'حذف آزمون',
      'آیا از حذف این آزمون مطمئن هستید؟ این عملیات غیرقابل بازگشت است.',
      [
        { text: 'انصراف', style: 'cancel' },
        { 
          text: 'حذف', 
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/teacher/exams/${examId}`);
              if (res.data.success) {
                Alert.alert('موفقیت', 'آزمون حذف شد');
                navigation.goBack();
              }
            } catch (err: any) {
              Alert.alert('خطا', err.response?.data?.message || 'مشکلی در حذف آزمون رخ داد');
            }
          }
        }
      ]
    );
  };

  const handleCloseExam = () => {
    Alert.alert(
      'بستن آزمون',
      'آیا مطمئن هستید که می‌خواهید آزمون را هم‌اکنون ببندید؟ دانش‌آموزان دیگر قادر به ادامه یا ارسال پاسخ نخواهند بود.',
      [
        { text: 'انصراف', style: 'cancel' },
        { 
          text: 'بستن آزمون', 
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.patch(`/teacher/exams/${examId}/end`);
              if (res.data.success) {
                Alert.alert('موفقیت', 'آزمون بسته شد.');
                setExamIsActive(false);
                setTimeLeft(null);
                fetchDashboardData();
              }
            } catch (err: any) {
              Alert.alert('خطا', err.response?.data?.message || 'مشکلی رخ داد');
            }
          }
        }
      ]
    );
  };

  // استفاده از آدرس بیس تنظیم شده در کلاینت برای جلوگیری از مشکل لوکال هاست در گوشی
  const baseURL = api.defaults.baseURL || 'http://192.168.1.128:5001/api';
  const WEB_BASE_URL = baseURL.replace('/api', ''); 
  const examLink = `${WEB_BASE_URL}/exam/join/${examId}`;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronRight size={24} color={COLORS.textLight} />
            <Text style={styles.backButtonText}>بازگشت</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{examTitle}</Text>
          </View>
          <TouchableOpacity style={{ width: 60, alignItems: 'flex-start', paddingLeft: 10 }} onPress={handleDeleteExam}>
            <Trash2 size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* نمایش لینک آزمون */}
        <View style={styles.linkContainer}>
          <Text style={styles.linkText} numberOfLines={1}>{examLink}</Text>
          <TouchableOpacity 
            style={styles.shareButton} 
            onPress={() => Share.share({ message: `لینک شرکت در آزمون ${examTitle}:\n${examLink}` })}
          >
            <Share2 size={16} color="#fff" />
            <Text style={styles.shareButtonText}>اشتراک</Text>
          </TouchableOpacity>
        </View>

        {/* وضعیت و دکمه بستن سریع آزمون */}
        <View style={styles.statusContainer}>
          <View style={styles.timerBox}>
            <Text style={styles.timerLabel}>وضعیت:</Text>
            {isUntimed && examIsActive ? (
              <Text style={styles.timerActiveText}>در حال برگزاری (بدون محدودیت)</Text>
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

        <View style={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'participants' && styles.activeTab]} onPress={() => setActiveTab('participants')}>
            <Users size={18} color={activeTab === 'participants' ? COLORS.primary : COLORS.textLight} />
            <Text style={[styles.tabText, activeTab === 'participants' && styles.activeTabText]}>شرکت‌کنندگان</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'questions' && styles.activeTab]} onPress={() => setActiveTab('questions')}>
            <FileText size={18} color={activeTab === 'questions' ? COLORS.primary : COLORS.textLight} />
            <Text style={[styles.tabText, activeTab === 'questions' && styles.activeTabText]}>سوالات</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'settings' && styles.activeTab]} onPress={() => setActiveTab('settings')}>
            <Settings size={18} color={activeTab === 'settings' ? COLORS.primary : COLORS.textLight} />
            <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>تنظیمات</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centerBox}><ActivityIndicator size="large" color={COLORS.primary} /></View>
        ) : activeTab === 'participants' ? (
          <View style={{ flex: 1 }}>
            <FlatList
              data={participants}
              keyExtractor={(item) => item.identifier}
              renderItem={renderStudentItem}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
            <View style={[styles.footerButtons, { bottom: Math.max(insets.bottom, 10) }]}>
              <TouchableOpacity 
                style={styles.finalizeBtn} 
                onPress={() => navigation.navigate('FinalizeGradesScreen', { examId, examTitle })}
              >
                <Text style={styles.finalizeBtnText}>📋 ثبت نهایی در دفتر کلاسی</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : activeTab === 'questions' ? (
          <View style={{ flex: 1 }}>
            <View style={styles.questionsHeader}>
              <Text style={styles.questionsCountText}>تعداد سوالات: {examQuestions.length}</Text>
              <TouchableOpacity 
                style={styles.editQuestionsBtn}
                onPress={() => navigation.navigate('EditExamScreen', { examId, examTitle })}
              >
                <Edit3 size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                <Text style={styles.editQuestionsBtnText}>ویرایش سوالات</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={examQuestions}
              keyExtractor={(item, index) => item._id || index.toString()}
              renderItem={({ item, index }) => (
                <View style={styles.questionCard}>
                  <Text style={styles.questionNumber}>سوال {index + 1}</Text>
                  <Text style={styles.questionText}>{item.question}</Text>
                </View>
              )}
              contentContainerStyle={[styles.listContainer, { paddingTop: 8 }]}
            />
          </View>
        ) : (
          <ScrollView contentContainerStyle={[styles.listContainer, { paddingBottom: Math.max(insets.bottom, 40) }]}>
            <View style={styles.formCard}>
              <Text style={styles.label}>عنوان آزمون</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} textAlign="right" />

              <Text style={styles.label}>نمره کل</Text>
              <TextInput style={styles.input} value={totalScore} onChangeText={setTotalScore} keyboardType="numeric" textAlign="center" />

              <View style={styles.switchRow}>
                <Switch
                  value={isUntimed}
                  onValueChange={setIsUntimed}
                  trackColor={{ false: '#cbd5e1', true: '#bbf7d0' }}
                  thumbColor={isUntimed ? '#16a34a' : '#f8fafc'}
                />
                <Text style={styles.switchLabel}>آزمون آزاد (بدون زمان)</Text>
              </View>

              {!isUntimed && (
                <>
                  <Text style={styles.label}>زمان شروع آزمون</Text>
                  <TouchableOpacity style={styles.datePickerBtn} onPress={() => showDateTimePicker('start')}>
                    <Text style={styles.datePickerText}>{formatDate(startTime)}</Text>
                  </TouchableOpacity>

                  <Text style={styles.label}>زمان پایان آزمون</Text>
                  <TouchableOpacity style={styles.datePickerBtn} onPress={() => showDateTimePicker('end')}>
                    <Text style={styles.datePickerText}>{formatDate(endTime)}</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity 
                style={styles.saveBtn} 
                onPress={handleSaveSettings} 
                disabled={isSavingSettings}
              >
                {isSavingSettings ? <ActivityIndicator color={COLORS.surface} /> : <Text style={styles.saveBtnText}>ذخیره تنظیمات</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 40, paddingBottom: 16, backgroundColor: COLORS.surface, elevation: 2 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
  backButton: { flexDirection: 'row', alignItems: 'center', width: 60 },
  backButtonText: { color: COLORS.textLight, fontSize: 13, marginRight: 4 },
  
  linkContainer: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#eff6ff', margin: 12, marginBottom: 0, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#bfdbfe' 
  },
  linkText: { flex: 1, textAlign: 'left', fontSize: 11, color: '#1e40af', marginRight: 8 },
  shareButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  shareButtonText: { color: '#fff', fontSize: 11, fontWeight: 'bold', marginRight: 4 },
  
  statusContainer: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    marginHorizontal: 12, marginTop: 12, padding: 12, 
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: COLORS.border 
  },
  timerBox: { flexDirection: 'row', alignItems: 'center' },
  timerLabel: { fontSize: 12, color: COLORS.textLight, marginLeft: 6, fontWeight: 'bold' },
  timerActiveText: { fontSize: 13, color: '#059669', fontWeight: 'bold' },
  timerClosedText: { fontSize: 13, color: '#dc2626', fontWeight: 'bold' },
  timerPendingText: { fontSize: 13, color: '#d97706', fontWeight: 'bold' },
  
  closeExamBtn: { backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#fca5a5' },
  closeExamBtnText: { color: '#dc2626', fontSize: 11, fontWeight: 'bold' },

  tabsContainer: { flexDirection: 'row', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginTop: 12 },
  tab: { flex: 1, flexDirection: 'row', paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', gap: 6 },
  activeTab: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.textLight, fontWeight: 'bold' },
  activeTabText: { color: COLORS.primary },
  
  listContainer: { padding: 12, paddingBottom: 80 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  cardDisabled: { backgroundColor: '#fafafa' },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  avatarText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 12 },
  studentPhone: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  scoreText: { fontSize: 11, color: '#166534', fontWeight: 'bold', marginTop: 2, textAlign: 'right' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  finalizeBtn: { backgroundColor: '#16a34a', padding: 14, borderRadius: 10, alignItems: 'center', flex: 1 },
  finalizeBtnText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 13 },
  footerButtons: { position: 'absolute', left: 16, right: 16 },

  questionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  questionsCountText: { fontSize: 13, color: COLORS.textLight, fontWeight: 'bold' },
  editQuestionsBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editQuestionsBtnText: { fontSize: 12, color: COLORS.primary, fontWeight: 'bold' },
  
  questionCard: { backgroundColor: COLORS.surface, padding: 14, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  questionNumber: { fontSize: 13, fontWeight: 'bold', color: COLORS.primary, marginBottom: 6, textAlign: 'right' },
  questionText: { fontSize: 14, color: COLORS.text, textAlign: 'right', lineHeight: 22 },

  formCard: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: 'bold', color: COLORS.text, marginBottom: 6, textAlign: 'right' },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: '#f8fafc', marginBottom: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  switchLabel: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  datePickerBtn: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: COLORS.border, padding: 12, borderRadius: 8, marginBottom: 16, alignItems: 'center' },
  datePickerText: { fontSize: 14, color: COLORS.text, letterSpacing: 1 },
  saveBtn: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 14 },
});

export default ExamDashboardScreen;
