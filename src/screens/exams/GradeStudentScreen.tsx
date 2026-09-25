import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image
} from 'react-native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';
import { Play, Pause } from 'lucide-react-native';

const GradeStudentScreen = ({ route, navigation }: any) => {
  // این پارامترها باید از صفحه‌ی «لیست شرکت‌کنندگان آزمون» به این صفحه پاس داده شوند
  const { examId, sessionId, studentIdentifier } = route.params;

  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [finalScore, setFinalScore] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // دریافت پاسخ‌برگ دانش‌آموز از سرور
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await api.get(`/teacher/exams/${examId}/sessions/${sessionId}`);
        if (response.data.success) {
          setSessionData(response.data.data);
          // اگر قبلاً نمره‌ای ثبت شده بود، آن را در کادر قرار می‌دهیم
          if (response.data.data.gradingStatus === 'graded') {
            setFinalScore(String(response.data.data.totalEarnedScore));
          }
        }
      } catch (error: any) {
        Alert.alert('خطا', 'مشکلی در دریافت پاسخ‌برگ دانش‌آموز رخ داد.');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };
    fetchSession();
  }, []);

  // ثبت نمره نهایی
  const handleSubmitGrade = async () => {
    if (!finalScore.trim()) {
      Alert.alert('توجه', 'لطفاً نمره نهایی را وارد کنید.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post(`/teacher/exams/${examId}/sessions/${sessionId}/grade`, {
        finalScore: Number(finalScore)
      });

      if (response.data.success) {
        Alert.alert('موفقیت', 'نمره دانش‌آموز با موفقیت ثبت شد!', [
          { text: 'بازگشت', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'خطا در ثبت نمره';
      Alert.alert('خطا', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // رندر کردن هر پاسخ
  const renderAnswerItem = (ans: any, index: number) => {
    const question = ans.question;
    const isEssay = !['تستی', 'صحیح-غلط'].includes(question.type);

    let answerText = ans.submittedAnswer;
    let answerMedia = null;
    let answerMediaType = null;

    if (ans.submittedAnswer && typeof ans.submittedAnswer === 'object') {
      answerText = ans.submittedAnswer.text;
      answerMedia = ans.submittedAnswer.media;
      answerMediaType = ans.submittedAnswer.mediaType;
    }

    return (
      <View key={question._id} style={styles.answerCard}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumber}>{index + 1}</Text>
          <Text style={styles.questionText}>{question.question}</Text>
        </View>

        <View style={styles.responseContainer}>
          <Text style={styles.responseLabel}>پاسخ دانش‌آموز:</Text>
          <Text style={[styles.responseText, !answerText && styles.emptyResponse]}>
            {answerText || '(بدون پاسخ متنی)'}
          </Text>
          
          {answerMedia && answerMediaType === 'image' && (
            <Image source={{ uri: answerMedia }} style={{ width: '100%', height: 200, borderRadius: 8, marginTop: 10, resizeMode: 'cover' }} />
          )}
          {answerMedia && answerMediaType === 'audio' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0f2fe', padding: 10, borderRadius: 8, marginTop: 10 }}>
              <Play color={COLORS.primary} size={20} />
              <Text style={{ color: COLORS.primary, marginLeft: 8, fontWeight: 'bold' }}>پاسخ صوتی (در وب/اپلیکیشن دیگر)</Text>
            </View>
          )}
        </View>

        {/* برای سوالات تستی، پاسخ صحیح سیستم را هم نشان می‌دهیم */}
        {!isEssay && question.answer && (
          <View style={styles.correctAnswerContainer}>
            <Text style={styles.correctLabel}>پاسخ صحیح:</Text>
            <Text style={styles.correctText}>{question.answer}</Text>
          </View>
        )}

        {isEssay && (
          <View style={styles.essayBadge}>
            <Text style={styles.essayBadgeText}>📝 نیازمند بررسی تشریحی</Text>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>در حال دریافت پاسخ‌برگ...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      
      {/* هدر صفحه */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>🔙 بازگشت</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>تصحیح اوراق</Text>
          <Text style={styles.headerSubtitle}>{studentIdentifier}</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* لیست پاسخ‌ها */}
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {sessionData?.answers?.map((ans: any, index: number) => renderAnswerItem(ans, index))}
      </ScrollView>

      {/* فوتر چسبیده به پایین برای ثبت نمره */}
      <View style={styles.footer}>
        <View style={styles.scoreInputContainer}>
          <Text style={styles.scoreLabel}>نمره نهایی:</Text>
          <TextInput
            style={styles.scoreInput}
            placeholder="مثال: 18.5"
            placeholderTextColor={COLORS.textLight}
            keyboardType="numeric"
            value={finalScore}
            onChangeText={setFinalScore}
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.button, isSubmitting && styles.buttonDisabled]} 
          onPress={handleSubmitGrade}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.surface} size="small" />
          ) : (
            <Text style={styles.buttonText}>ثبت نمره</Text>
          )}
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, color: COLORS.textLight, fontSize: 14 },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
    zIndex: 10,
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  headerSubtitle: { fontSize: 14, color: COLORS.text, marginTop: 2, fontWeight: 'bold', letterSpacing: 1 },
  backButton: { padding: 8 },
  backButtonText: { color: COLORS.textLight, fontSize: 14 },

  scrollContainer: { padding: 20, paddingBottom: 40 },
  
  answerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  questionHeader: { flexDirection: 'row', marginBottom: 12 },
  questionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    color: COLORS.surface,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 12,
  },
  questionText: { flex: 1, fontSize: 15, color: COLORS.text, textAlign: 'right', fontWeight: 'bold', lineHeight: 24 },
  
  responseContainer: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 8 },
  responseLabel: { fontSize: 12, color: COLORS.textLight, marginBottom: 4, textAlign: 'right' },
  responseText: { fontSize: 15, color: COLORS.text, textAlign: 'right', fontWeight: '500' },
  emptyResponse: { color: COLORS.error, fontStyle: 'italic' },
  
  correctAnswerContainer: { backgroundColor: '#f0fdf4', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0' },
  correctLabel: { fontSize: 12, color: '#166534', marginBottom: 4, textAlign: 'right' },
  correctText: { fontSize: 15, color: '#15803d', textAlign: 'right', fontWeight: 'bold' },

  essayBadge: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  essayBadgeText: { fontSize: 12, color: COLORS.secondary, fontWeight: 'bold' },

  footer: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    elevation: 10, // سایه بالای فوتر
  },
  scoreInputContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  scoreLabel: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  scoreInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    width: 120,
    fontSize: 18,
    textAlign: 'center',
    backgroundColor: '#f8fafc',
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  button: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { backgroundColor: COLORS.secondary, opacity: 0.7 },
  buttonText: { color: COLORS.surface, fontSize: 16, fontWeight: 'bold' },
});

export default GradeStudentScreen;