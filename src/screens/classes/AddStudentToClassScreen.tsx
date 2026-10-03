import React, { useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, UserPlus, User, Phone, Calendar, FileText } from 'lucide-react-native';

const AddStudentToClassScreen = ({ route, navigation }: any) => {
  const { currentClassId, currentClassName } = route.params;
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !fatherName.trim()) {
      Alert.alert('توجه', 'لطفاً نام، نام خانوادگی و نام پدر را وارد کنید.');
      return;
    }

    let phoneToUse = phone.trim();
    if (!phoneToUse) {
      phoneToUse = `0900${Math.floor(1000000 + Math.random() * 9000000)}`;
    } else if (phoneToUse.length !== 11 || !phoneToUse.startsWith('09')) {
      Alert.alert('خطا', 'شماره موبایل نامعتبر است (مثال: 09123456789)');
      return;
    }

    if (parentPhone.trim() && (parentPhone.trim().length !== 11 || !parentPhone.trim().startsWith('09'))) {
      Alert.alert('خطا', 'شماره والدین نامعتبر است (مثال: 09123456789)');
      return;
    }

    setIsSubmitting(true);
    try {
      const studentObj = {
        phone: phoneToUse,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fatherName: fatherName.trim(),
        parentPhone: parentPhone.trim() || undefined,
        birthDate: birthDate.trim() || undefined,
        specialNotes: specialNotes.trim() || undefined
      };

      const response = await api.post(`/teacher/classrooms/${currentClassId}/students`, {
        students: [studentObj] 
      });
      
      if (response.data.success) {
        Alert.alert('موفقیت', 'دانش‌آموز با موفقیت به کلاس اضافه شد.', [
          { 
            text: 'متوجه شدم', 
            onPress: () => navigation.goBack() 
          }
        ]);
      }
    } catch (error: any) {
      Alert.alert('خطا', error.response?.data?.message || 'مشکلی در افزودن دانش‌آموز رخ داد.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronRight size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>افزودن دانش‌آموز جدید</Text>
          <Text style={styles.headerSubtitle}>{currentClassName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <User size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>اطلاعات هویتی</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>نام <Text style={styles.required}>*</Text></Text>
              <TextInput 
                style={styles.input} 
                value={firstName} 
                onChangeText={setFirstName} 
                placeholder="مثال: علی" 
                textAlign="right" 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>نام خانوادگی <Text style={styles.required}>*</Text></Text>
              <TextInput 
                style={styles.input} 
                value={lastName} 
                onChangeText={setLastName} 
                placeholder="مثال: رضایی" 
                textAlign="right" 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>نام پدر <Text style={styles.required}>*</Text></Text>
              <TextInput 
                style={styles.input} 
                value={fatherName} 
                onChangeText={setFatherName} 
                placeholder="مثال: حسین" 
                textAlign="right" 
              />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Phone size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>اطلاعات تماس</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>شماره موبایل دانش‌آموز (اختیاری)</Text>
              <TextInput 
                style={styles.input} 
                value={phone} 
                onChangeText={setPhone} 
                placeholder="مثال: 09123456789" 
                keyboardType="numeric" 
                maxLength={11} 
                textAlign="right" 
              />
              <Text style={styles.helperText}>در صورت خالی گذاشتن، شماره موقت سیستمی اختصاص داده می‌شود.</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>شماره موبایل والدین (اختیاری)</Text>
              <TextInput 
                style={styles.input} 
                value={parentPhone} 
                onChangeText={setParentPhone} 
                placeholder="مثال: 09123456789" 
                keyboardType="numeric" 
                maxLength={11} 
                textAlign="right" 
              />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Calendar size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>سایر مشخصات</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>تاریخ تولد (اختیاری)</Text>
              <TextInput 
                style={styles.input} 
                value={birthDate} 
                onChangeText={setBirthDate} 
                placeholder="مثال: 1388/06/15" 
                textAlign="right" 
              />
              <Text style={styles.helperText}>جهت نمایش در تقویم تولدهای کلاس (فرمت: سال/ماه/روز)</Text>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <FileText size={16} color={COLORS.textLight} />
                <Text style={[styles.inputLabel, { marginBottom: 0, marginRight: 6 }]}>موارد قابل توجه دانش‌آموز (اختیاری)</Text>
              </View>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                value={specialNotes} 
                onChangeText={setSpecialNotes} 
                placeholder="توضیحات خاص آموزشی، انضباطی یا پزشکی دانش‌آموز..." 
                multiline 
                numberOfLines={4}
                textAlign="right" 
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
            onPress={handleSubmit} 
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.surface} size="small" />
            ) : (
              <>
                <UserPlus size={20} color={COLORS.surface} style={{ marginLeft: 8 }} />
                <Text style={styles.submitBtnText}>ثبت و افزودن به کلاس</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: COLORS.surface, 
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  backButton: { padding: 8 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },

  content: { padding: 16 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: 8
  },

  inputGroup: { marginBottom: 16 },
  labelRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 8 },
  inputLabel: { fontSize: 13, color: COLORS.text, marginBottom: 8, textAlign: 'left', fontWeight: '500' },
  required: { color: COLORS.error },
  helperText: { fontSize: 11, color: COLORS.textLight, marginTop: 4, textAlign: 'left' },
  input: { 
    backgroundColor: '#f8fafc', 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: 12, 
    padding: 12, 
    fontSize: 14, 
    textAlign: 'left', 
    color: COLORS.text 
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: 12
  },

  submitBtn: { 
    backgroundColor: COLORS.primary, 
    padding: 16, 
    borderRadius: 14, 
    alignItems: 'center', 
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    marginTop: 8,
    elevation: 2
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: COLORS.surface, fontSize: 16, fontWeight: 'bold' }
});

export default AddStudentToClassScreen;
