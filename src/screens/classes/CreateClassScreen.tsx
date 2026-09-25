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

// داده‌های تستی برای دوره‌ها و پایه‌ها (در آینده می‌توانید این‌ها را از بک‌اند دریافت کنید)
const MOCK_COURSES = [
  { _id: '64f1a2b3c4d5e6f7a8b9c001', name: 'ریاضیات' },
  { _id: '64f1a2b3c4d5e6f7a8b9c002', name: 'علوم تجربی' },
  { _id: '64f1a2b3c4d5e6f7a8b9c003', name: 'ادبیات فارسی' },
  { _id: '64f1a2b3c4d5e6f7a8b9c004', name: 'زبان انگلیسی' },
];

const MOCK_GRADES = [
  { _id: '64f1a2b3c4d5e6f7a8b9c011', name: 'هفتم' },
  { _id: '64f1a2b3c4d5e6f7a8b9c012', name: 'هشتم' },
  { _id: '64f1a2b3c4d5e6f7a8b9c013', name: 'نهم' },
  { _id: '64f1a2b3c4d5e6f7a8b9c014', name: 'دهم' },
];

const CreateClassScreen = ({ navigation }: any) => {
  const [className, setClassName] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateClass = async () => {
    if (!className.trim()) {
      Alert.alert('توجه', 'لطفاً نام کلاس را وارد کنید.');
      return;
    }
    if (!selectedCourse || !selectedGrade) {
      Alert.alert('توجه', 'لطفاً دوره و پایه تحصیلی را انتخاب کنید.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/teacher/classrooms', {
        name: className,
        course: selectedCourse,
        grade: selectedGrade,
      });

      if (response.data.success) {
        Alert.alert('موفقیت', 'کلاس جدید با موفقیت ایجاد شد!', [
          { 
            text: 'باشه', 
            // بازگشت به صفحه قبل پس از تایید
            onPress: () => navigation.goBack() 
          }
        ]);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'خطا در ساخت کلاس';
      Alert.alert('خطا', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // کامپوننت داخلی برای رندر کردن لیست‌های افقی (Chips)
  const renderSelector = (items: any[], selectedId: string | null, onSelect: (id: string) => void) => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      contentContainerStyle={styles.chipContainer}
    >
      {items.map((item) => {
        const isSelected = item._id === selectedId;
        return (
          <TouchableOpacity
            key={item._id}
            activeOpacity={0.7}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onSelect(item._id)}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>🔙 بازگشت</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ایجاد کلاس جدید</Text>
        <View style={{ width: 60 }} /> {/* برای بالانس کردن هدر */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.formContainer}>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>نام کلاس</Text>
            <TextInput
              style={styles.input}
              placeholder="مثال: کلاس الف - تیزهوشان"
              placeholderTextColor={COLORS.textLight}
              value={className}
              onChangeText={setClassName}
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>پایه تحصیلی</Text>
            {renderSelector(MOCK_GRADES, selectedGrade, setSelectedGrade)}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>درس / دوره</Text>
            {renderSelector(MOCK_COURSES, selectedCourse, setSelectedCourse)}
          </View>

        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, isSubmitting && styles.buttonDisabled]} 
          onPress={handleCreateClass}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.surface} size="small" />
          ) : (
            <Text style={styles.buttonText}>ثبت و ایجاد کلاس</Text>
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
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
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: '#f8fafc',
  },
  
  chipContainer: {
    flexDirection: 'row', // راست‌چین شدن آیتم‌های اسکرول افقی
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginLeft: 10, // فاصله از چپ برای چینش راست‌به‌چپ
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: { fontSize: 14, color: COLORS.textLight, fontWeight: '600' },
  chipTextSelected: { color: COLORS.surface },

  footer: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: COLORS.secondary, opacity: 0.7 },
  buttonText: { color: COLORS.surface, fontSize: 16, fontWeight: 'bold' },
});

export default CreateClassScreen;