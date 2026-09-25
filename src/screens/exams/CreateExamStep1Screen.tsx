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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';
import * as jalaali from 'jalaali-js';
import { PERSIAN_MONTHS } from '../../utils/date/jalaliHelper';
import { CustomDropdown } from '../../components/common/CustomDropdown';

const CreateExamStep1Screen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);

  // استیت‌های فرم
  const [title, setTitle] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  const [totalScore, setTotalScore] = useState('20');
  
  const currentJalali = jalaali.toJalaali(new Date());
  const [startDay, setStartDay] = useState<number>(currentJalali.jd);
  const [startMonth, setStartMonth] = useState<number>(currentJalali.jm);

  const now = new Date();
  const defaultDuration = 45;
  const defaultEndTime = new Date(now.getTime() + defaultDuration * 60000);

  const [startHour, setStartHour] = useState(now.getHours().toString().padStart(2, '0'));
  const [startMinute, setStartMinute] = useState(now.getMinutes().toString().padStart(2, '0'));
  
  const [examDuration, setExamDuration] = useState<number | 'custom'>(defaultDuration);

  const [endHour, setEndHour] = useState(defaultEndTime.getHours().toString().padStart(2, '0'));
  const [endMinute, setEndMinute] = useState(defaultEndTime.getMinutes().toString().padStart(2, '0'));

  const daysList = Array.from({ length: 31 }, (_, i) => ({ id: `d${i + 1}`, label: `${i + 1}`, value: i + 1 }));
  const monthsList = PERSIAN_MONTHS.map((m, i) => ({ id: `m${i + 1}`, label: m, value: i + 1 }));
  const hoursList = Array.from({ length: 24 }, (_, i) => ({ id: `h${i}`, label: i.toString().padStart(2, '0'), value: i.toString().padStart(2, '0') }));
  const minutesList = Array.from({ length: 60 }, (_, i) => ({ id: `min${i}`, label: i.toString().padStart(2, '0'), value: i.toString().padStart(2, '0') }));

  useEffect(() => {
    if (examDuration !== 'custom') {
      const gDate = jalaali.toGregorian(currentJalali.jy, startMonth, startDay);
      const sTime = new Date(gDate.gy, gDate.gm - 1, gDate.gd, parseInt(startHour), parseInt(startMinute));
      const eTime = new Date(sTime.getTime() + examDuration * 60000);
      setEndHour(eTime.getHours().toString().padStart(2, '0'));
      setEndMinute(eTime.getMinutes().toString().padStart(2, '0'));
    }
  }, [examDuration, startHour, startMinute, startDay, startMonth]);

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
      const gregorianDate = jalaali.toGregorian(currentJalali.jy, startMonth, startDay);
      
      const startDateTime = new Date(gregorianDate.gy, gregorianDate.gm - 1, gregorianDate.gd, parseInt(startHour), parseInt(startMinute));
      const endDateTime = new Date(gregorianDate.gy, gregorianDate.gm - 1, gregorianDate.gd, parseInt(endHour), parseInt(endMinute));

      if (startDateTime < new Date()) {
        Alert.alert('توجه', 'تاریخ و ساعت شروع آزمون نمی‌تواند در گذشته باشد.');
        setIsSubmitting(false);
        return;
      }

      const response = await api.post('/teacher/exams', {
        title,
        description: '',
        classroomId: selectedClassroomId,
        totalScore: Number(totalScore),
        questions: [],
        allowedParticipants: [],
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        randomizeQuestions: true, // پیش‌فرض
        isUntimed: false
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
      console.log('Error creating exam:', error.response?.data || error.message);
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
            <Text style={styles.sectionLabel}>تاریخ و زمان برگزاری</Text>
            
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.smallLabel}>تاریخ آزمون</Text>
              <View style={[styles.timeRow, { marginTop: 4 }]}>
                <View style={styles.halfInput}>
                  <CustomDropdown
                    items={monthsList}
                    selectedValue={startMonth}
                    onSelect={(item) => setStartMonth(item.value)}
                    placeholder="ماه"
                  />
                </View>
                <View style={styles.halfInput}>
                  <CustomDropdown
                    items={daysList}
                    selectedValue={startDay}
                    onSelect={(item) => setStartDay(item.value)}
                    placeholder="روز"
                  />
                </View>
              </View>
            </View>

            <View style={styles.timeRow}>
              <View style={styles.halfInput}>
                <Text style={styles.smallLabel}>ساعت شروع</Text>
                <View style={[styles.timeRow, { marginTop: 4 }]}>
                  <View style={{ flex: 0.48 }}>
                    <CustomDropdown
                      items={minutesList}
                      selectedValue={startMinute}
                      onSelect={(item) => setStartMinute(item.value)}
                      placeholder="دقیقه"
                    />
                  </View>
                  <Text style={{ alignSelf: 'center' }}>:</Text>
                  <View style={{ flex: 0.48 }}>
                    <CustomDropdown
                      items={hoursList}
                      selectedValue={startHour}
                      onSelect={(item) => setStartHour(item.value)}
                      placeholder="ساعت"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.smallLabel}>مدت زمان آزمون</Text>
                <View style={{ marginTop: 4 }}>
                  <CustomDropdown
                    items={[
                      { id: '15m', label: '۱۵ دقیقه', value: 15 },
                      { id: '30m', label: '۳۰ دقیقه', value: 30 },
                      { id: '45m', label: '۴۵ دقیقه', value: 45 },
                      { id: '90m', label: '۹۰ دقیقه', value: 90 },
                      { id: 'custom', label: 'سایر (انتخاب دستی)', value: 'custom' },
                    ]}
                    selectedValue={examDuration}
                    onSelect={(item) => setExamDuration(item.value)}
                    placeholder="انتخاب زمان"
                  />
                </View>
              </View>
            </View>

            {examDuration === 'custom' && (
              <View style={[styles.timeRow, { marginTop: 16 }]}>
                <View style={styles.halfInput}>
                  <Text style={styles.smallLabel}>ساعت پایان</Text>
                  <View style={[styles.timeRow, { marginTop: 4 }]}>
                    <View style={{ flex: 0.48 }}>
                      <CustomDropdown
                        items={minutesList}
                        selectedValue={endMinute}
                        onSelect={(item) => setEndMinute(item.value)}
                        placeholder="دقیقه"
                      />
                    </View>
                    <Text style={{ alignSelf: 'center' }}>:</Text>
                    <View style={{ flex: 0.48 }}>
                      <CustomDropdown
                        items={hoursList}
                        selectedValue={endHour}
                        onSelect={(item) => setEndHour(item.value)}
                        placeholder="ساعت"
                      />
                    </View>
                  </View>
                </View>
                <View style={styles.halfInput} />
              </View>
            )}

          </View>

        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
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
    flexDirection: 'row',
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
  
  chipContainer: { flexDirection: 'row', paddingVertical: 4 },
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