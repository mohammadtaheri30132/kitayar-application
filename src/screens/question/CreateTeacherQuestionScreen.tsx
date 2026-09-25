import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, UploadCloud, Mic, X } from 'lucide-react-native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';

const QUESTION_TYPES = ['تستی', 'کوتاه-پاسخ', 'گسترده-پاسخ', 'جاخالی', 'صحیح-غلط'];

const CreateTeacherQuestionScreen = ({ navigation }: any) => {
  const [type, setType] = useState('تستی');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim()) {
      Alert.alert('خطا', 'متن سوال نمی‌تواند خالی باشد');
      return;
    }

    if (type === 'تستی' && options.some(opt => !opt.trim())) {
      Alert.alert('خطا', 'لطفاً تمامی گزینه‌ها را پر کنید');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/teacher/questions', {
        type,
        question,
        options: type === 'تستی' ? options : [],
        answer,
        // TODO: Handle media uploads via external storage/S3 and pass URLs here
        audioUrl: '', 
        source_image: ''
      });

      if (res.data.success) {
        Alert.alert('موفقیت', 'سوال شما با موفقیت ثبت شد', [
          { text: 'باشه', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (e: any) {
      console.warn(e);
      Alert.alert('خطا', 'مشکلی در ثبت سوال رخ داد');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateOption = (index: number, val: string) => {
    const newOptions = [...options];
    newOptions[index] = val;
    setOptions(newOptions);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronRight color={COLORS.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ایجاد سوال جدید</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* انتخاب نوع سوال */}
          <Text style={styles.label}>نوع سوال</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelectorRow}>
            {QUESTION_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* متن سوال */}
          <Text style={styles.label}>متن سوال</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="سوال خود را تایپ کنید..."
            placeholderTextColor={COLORS.textLight}
            value={question}
            onChangeText={setQuestion}
          />

          {/* فایل‌های رسانه */}
          <Text style={styles.label}>فایل‌های ضمیمه (اختیاری)</Text>
          <View style={styles.mediaContainer}>
            <TouchableOpacity style={styles.mediaBtn}>
              <UploadCloud size={24} color={COLORS.textLight} />
              <Text style={styles.mediaBtnText}>آپلود تصویر</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaBtn}>
              <Mic size={24} color={COLORS.textLight} />
              <Text style={styles.mediaBtnText}>ضبط صدا</Text>
            </TouchableOpacity>
          </View>

          {/* گزینه‌ها برای سوالات تستی */}
          {type === 'تستی' && (
            <View style={styles.optionsContainer}>
              <Text style={styles.label}>گزینه‌ها</Text>
              {options.map((opt, index) => (
                <TextInput
                  key={index}
                  style={styles.optionInput}
                  placeholder={`گزینه ${index + 1}`}
                  placeholderTextColor={COLORS.textLight}
                  value={opt}
                  onChangeText={(val) => updateOption(index, val)}
                />
              ))}
            </View>
          )}

          {/* پاسخ */}
          <Text style={styles.label}>پاسخ صحیح (اختیاری - برای تصحیح خودکار)</Text>
          <TextInput
            style={styles.input}
            placeholder="پاسخ را اینجا بنویسید..."
            placeholderTextColor={COLORS.textLight}
            value={answer}
            onChangeText={setAnswer}
          />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.surface} />
            ) : (
              <Text style={styles.submitBtnText}>ثبت سوال</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'IRANSansX', color: COLORS.text },
  scrollContent: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: 'bold', fontFamily: 'IRANSansX', color: COLORS.text, marginBottom: 8, textAlign: 'right', marginTop: 16 },
  
  typeSelectorRow: { flexDirection: 'row-reverse', marginBottom: 8 },
  typeBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginLeft: 8 },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeText: { fontFamily: 'IRANSansX', fontSize: 14, color: COLORS.text },
  typeTextActive: { color: COLORS.surface, fontWeight: 'bold' },

  textArea: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 16, fontSize: 15, fontFamily: 'IRANSansX', textAlign: 'right', minHeight: 120, textAlignVertical: 'top' },
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 16, fontSize: 15, fontFamily: 'IRANSansX', textAlign: 'right' },
  
  mediaContainer: { flexDirection: 'row-reverse', gap: 12 },
  mediaBtn: { flex: 1, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', borderRadius: 12, padding: 20, alignItems: 'center', justifyContent: 'center' },
  mediaBtnText: { marginTop: 8, fontFamily: 'IRANSansX', fontSize: 13, color: COLORS.textLight },

  optionsContainer: { marginTop: 8 },
  optionInput: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 15, fontFamily: 'IRANSansX', textAlign: 'right', marginBottom: 12 },

  footer: { padding: 16, backgroundColor: COLORS.surface, borderTopWidth: 1, borderColor: COLORS.border },
  submitBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: COLORS.surface, fontFamily: 'IRANSansX', fontSize: 16, fontWeight: 'bold' },
});

export default CreateTeacherQuestionScreen;
