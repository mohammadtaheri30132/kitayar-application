import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, 
  Alert, KeyboardAvoidingView, Platform, ScrollView, Switch, Clipboard 
} from 'react-native';
import { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';

const ExamSettingsScreen = ({ route, navigation }: any) => {
  const { examId } = route.params;

  const [title, setTitle] = useState('');
  const [totalScore, setTotalScore] = useState('');
  const [isUntimed, setIsUntimed] = useState(false);
  
  // استیت‌های مربوط به زمان
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 💡 آدرس لوکال (آدرس پروژه‌ی وب/HTML شما که روی سیستم ران شده است)
  // اگر در شبکه محلی تست می‌کنید به جای localhost آی‌پی کامپیوتر را بگذارید مثلاً 192.168.1.x
  const WEB_BASE_URL = 'http://localhost:5001'; 
  const examLink = `${WEB_BASE_URL}/exam/join/${examId}`;

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await api.get(`/teacher/exams/${examId}`);
        if (response.data.success) {
          const examData = response.data.data;
          setTitle(examData.title);
          setTotalScore(String(examData.totalScore || 20));
          setIsUntimed(examData.isUntimed || false);
          if (examData.startTime) setStartTime(new Date(examData.startTime));
          if (examData.endTime) setEndTime(new Date(examData.endTime));
        }
      } catch (error) {
        Alert.alert('خطا', 'مشکلی در دریافت اطلاعات رخ داد');
      } finally {
        setIsLoading(false);
      }
    };
    fetchExam();
  }, [examId]);

  const handleCopyLink = () => {
    Clipboard.setString(examLink);
    Alert.alert('کپی شد', 'لینک لوکال آزمون در حافظه کپی شد.');
  };
  const showDateTimePicker = (target: 'start' | 'end') => {
    const currentValue = target === 'start' ? startTime : endTime;

    // ۱. باز کردن تقویم (تاریخ)
    DateTimePickerAndroid.open({
      value: currentValue,
      mode: 'date',
      onChange: (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (event.type === 'dismissed' || !selectedDate) return;

        // ۲. به محض تایید تاریخ، ساعت را باز کن
        DateTimePickerAndroid.open({
          value: selectedDate, // تاریخی که در مرحله قبل انتخاب شد
          mode: 'time',
          is24Hour: true,
          onChange: (timeEvent: DateTimePickerEvent, finalDate?: Date) => {
            if (timeEvent.type === 'dismissed' || !finalDate) return;

            // ۳. ذخیره نهایی ترکیب تاریخ و ساعت
            if (target === 'start') {
              setStartTime(finalDate);
            } else {
              setEndTime(finalDate);
            }
          },
        });
      },
    });
  };
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await api.put(`/teacher/exams/${examId}`, {
        title,
        totalScore: Number(totalScore),
        isUntimed,
        startTime: isUntimed ? null : startTime.toISOString(),
        endTime: isUntimed ? null : endTime.toISOString(),
      });
      if (response.data.success) {
        Alert.alert('موفقیت', 'تنظیمات آزمون ذخیره شد', [{ text: 'باشه', onPress: () => navigation.goBack() }]);
      }
    } catch (error) {
      Alert.alert('خطا', 'ویرایش تنظیمات امکان‌پذیر نیست.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} - ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (isLoading) return <View style={styles.centerBox}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>🔙 بازگشت</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تنظیمات آزمون</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* باکس کپی لینک */}
        <View style={styles.linkCard}>
          <Text style={styles.linkTitle}>🔗 لینک ورود (محیط تست)</Text>
          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={1}>{examLink}</Text>
          </View>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopyLink}>
            <Text style={styles.copyBtnText}>کپی کردن لینک</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>عنوان آزمون</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} textAlign="right" />

          <Text style={styles.label}>نمره کل</Text>
          <TextInput style={styles.input} value={totalScore} onChangeText={setTotalScore} keyboardType="numeric" textAlign="center" />

          {/* سوییچ آزمون آزاد */}
          <View style={styles.switchRow}>
            <Switch
              value={isUntimed}
              onValueChange={setIsUntimed}
              trackColor={{ false: '#cbd5e1', true: '#bbf7d0' }}
              thumbColor={isUntimed ? '#16a34a' : '#f8fafc'}
            />
            <Text style={styles.switchLabel}>آزمون بدون محدودیت زمانی (آزاد)</Text>
          </View>

          {/* اگر آزمون زمان‌دار باشد، این بخش نمایش داده می‌شود */}
  {!isUntimed && (
            <View style={styles.dateTimeContainer}>
              <Text style={styles.label}>زمان شروع آزمون:</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => showDateTimePicker('start')}>
                <Text style={styles.dateBtnText}>{formatDate(startTime)} 📅</Text>
              </TouchableOpacity>

              <Text style={styles.label}>زمان پایان آزمون:</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => showDateTimePicker('end')}>
                <Text style={styles.dateBtnText}>{formatDate(endTime)} 📅</Text>
              </TouchableOpacity>
            </View>
          )}

 

          <TouchableOpacity style={[styles.saveButton, isSaving && styles.disabledBtn]} onPress={handleSaveSettings} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color={COLORS.surface} /> : <Text style={styles.saveButtonText}>💾 ذخیره تغییرات</Text>}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ... استایل‌های قبلی را اینجا قرار دهید و این موارد را اضافه کنید:
const styles = StyleSheet.create({
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40, backgroundColor: COLORS.surface, elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  backButton: { padding: 8 },
  backButtonText: { color: COLORS.textLight, fontSize: 14 },
  scrollContainer: { padding: 20 },
  
  linkCard: { backgroundColor: '#eff6ff', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe', marginBottom: 20 },
  linkTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e40af', marginBottom: 12, textAlign: 'right' },
  linkBox: { backgroundColor: COLORS.surface, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#bfdbfe', marginBottom: 12 },
  linkText: { fontSize: 14, color: COLORS.text, textAlign: 'left' },
  copyBtn: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, alignItems: 'center' },
  copyBtnText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 14 },

  formCard: { backgroundColor: COLORS.surface, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 8, textAlign: 'right' },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, marginBottom: 16, backgroundColor: '#f8fafc', color: COLORS.text, fontSize: 16 },
  
  switchRow: { flexDirection: 'row-reverse', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  switchLabel: { fontSize: 15, color: COLORS.text, fontWeight: 'bold', marginRight: 12 },
  
  dateTimeContainer: { marginBottom: 24, backgroundColor: '#f8fafc', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  dateBtn: { backgroundColor: COLORS.surface, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16, alignItems: 'center' },
  dateBtnText: { fontSize: 15, color: COLORS.primary, fontWeight: 'bold' },

  saveButton: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 10, alignItems: 'center' },
  saveButtonText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 16 },
  disabledBtn: { opacity: 0.7 },
});

export default ExamSettingsScreen;