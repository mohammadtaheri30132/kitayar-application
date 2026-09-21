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
  ScrollView
} from 'react-native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';

const CreateExamStep1Screen = ({ navigation }: any) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);

  // استیت‌های فرم
  const [title, setTitle] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  const [totalScore, setTotalScore] = useState('20');
  
  // استیت‌های ساده برای دریافت زمان (برای جلوگیری از نصب پکیج‌های سنگین در نسخه اولیه)
  const [startDate, setStartDate] = useState('2026-10-01');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // دریافت لیست کلاس‌های معلم برای نمایش در انتخاب‌گر
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.get('/teacher/classrooms');
        if (response.data.success) {
          setClasses(response.data.data);
        }
      } catch (error) {
        Alert.alert('خطا', 'عدم موفقیت در دریافت لیست کلاس‌ها');
      } finally {
        setIsLoadingClasses(false);
      }
    };
    fetchClasses();
  }, []);

  const handleNextStep = async () => {
    if (!title.trim() || !selectedClassroomId) {
      Alert.alert('توجه', 'نام آزمون و کلاس الزامی است.');
      return;
    }

    setIsSubmitting(true);
    try {
      // ترکیب تاریخ و ساعت برای ارسال به بک‌اند
      const startDateTime = new Date(`${startDate}T${startTime}:00`);
      const endDateTime = new Date(`${startDate}T${endTime}:00`);

      const response = await api.post('/teacher/exams', {
        title,
        classroomId: selectedClassroomId,
        totalScore: Number(totalScore),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        randomizeQuestions: true, // پیش‌فرض
      });

      if (response.data.success) {
        // دریافت examId از بک‌اند و هدایت به مرحله دوم (انتخاب سوالات)
        const newExamId = response.data.data.examId;
        navigation.navigate('CreateExamStep2Screen', { 
          examId: newExamId,
          examTitle: title 
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'خطا در ایجاد آزمون';
      Alert.alert('خطا', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // رندر کردن کلاس‌ها به صورت افقی (Chips)
  const renderClassSelector = () => {
    if (isLoadingClasses) return <ActivityIndicator color={COLORS.primary} />;
    if (classes.length === 0) return <Text style={styles.errorText}>ابتدا باید یک کلاس بسازید</Text>;

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipContainer}>
        {classes.map((cls) => {
          const isSelected = cls._id === selectedClassroomId;
          return (
            <TouchableOpacity
              key={cls._id}
              activeOpacity={0.7}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => setSelectedClassroomId(cls._id)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {cls.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>🔙 انصراف</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>ساخت آزمون (مرحله ۱)</Text>
          <Text style={styles.headerSubtitle}>تنظیمات اولیه و کلاس</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.formContainer}>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>کلاسِ هدف</Text>
            {renderClassSelector()}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>عنوان آزمون</Text>
            <TextInput
              style={styles.input}
              placeholder="مثال: آزمون میان‌ترم ریاضی"
              placeholderTextColor={COLORS.textLight}
              value={title}
              onChangeText={setTitle}
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>نمره کل آزمون</Text>
            <TextInput
              style={styles.input}
              placeholder="20"
              placeholderTextColor={COLORS.textLight}
              keyboardType="numeric"
              value={totalScore}
              onChangeText={setTotalScore}
              textAlign="center"
            />
          </View>

          {/* بخش زمان‌بندی (ساده‌شده برای نسخه سبک) */}
          <View style={styles.timeSection}>
            <Text style={styles.sectionLabel}>زمان‌بندی برگزاری</Text>
            
            <View style={styles.timeRow}>
              <View style={styles.halfInput}>
                <Text style={styles.smallLabel}>ساعت پایان</Text>
                <TextInput
                  style={[styles.input, { textAlign: 'center' }]}
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="10:00"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.smallLabel}>ساعت شروع</Text>
                <TextInput
                  style={[styles.input, { textAlign: 'center' }]}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="08:00"
                />
              </View>
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.smallLabel}>تاریخ (میلادی)</Text>
              <TextInput
                style={[styles.input, { textAlign: 'center', letterSpacing: 2 }]}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>

        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, isSubmitting && styles.buttonDisabled]} 
          onPress={handleNextStep}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.surface} size="small" />
          ) : (
            <Text style={styles.buttonText}>ادامه و انتخاب سوالات ➡️</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  headerSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  backButton: { padding: 8 },
  backButtonText: { color: COLORS.textLight, fontSize: 14 },
  
  scrollContainer: { flexGrow: 1, backgroundColor: COLORS.background, padding: 20 },
  formContainer: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, elevation: 2 },
  
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 15, color: COLORS.text, marginBottom: 12, textAlign: 'right', fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: '#f8fafc',
  },
  errorText: { color: COLORS.error, textAlign: 'right', fontSize: 14 },
  
  chipContainer: { flexDirection: 'row-reverse', paddingVertical: 4 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginLeft: 10,
  },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 14, color: COLORS.textLight, fontWeight: '600' },
  chipTextSelected: { color: COLORS.surface },

  timeSection: {
    marginTop: 10,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sectionLabel: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 16, textAlign: 'center' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { flex: 0.48 },
  smallLabel: { fontSize: 12, color: COLORS.textLight, marginBottom: 6, textAlign: 'center' },

  footer: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  button: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 14, alignItems: 'center' },
  buttonDisabled: { backgroundColor: COLORS.secondary, opacity: 0.7 },
  buttonText: { color: COLORS.surface, fontSize: 16, fontWeight: 'bold' },
});

export default CreateExamStep1Screen;