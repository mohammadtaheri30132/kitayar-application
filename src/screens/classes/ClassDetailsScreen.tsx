import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';

const ClassDetailsScreen = ({ route, navigation }: any) => {
  // دریافت اطلاعات کلاس از صفحه قبل
  const { classroom } = route.params;

  // استیت‌ها
  const [students, setStudents] = useState<string[]>(classroom?.students || []);
  const [newPhone, setNewPhone] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null); // برای نمایش لودینگ روی دکمه حذف خاص

  // تابع افزودن دانش‌آموز
  const handleAddStudent = async () => {
    Keyboard.dismiss();
    
    if (!newPhone || newPhone.length !== 11 || !newPhone.startsWith('09')) {
      Alert.alert('خطا', 'لطفاً شماره موبایل معتبر وارد کنید (مثال: 09123456789)');
      return;
    }

    if (students.includes(newPhone)) {
      Alert.alert('توجه', 'این دانش‌آموز قبلاً در کلاس ثبت شده است.');
      return;
    }

    setIsAdding(true);
    try {
      // در بک‌اند، API آرایه‌ای از شماره‌ها را دریافت می‌کند
      const response = await api.post(`/teacher/classrooms/${classroom._id}/students`, {
        students: [newPhone] 
      });

      if (response.data.success) {
        setStudents(response.data.data.students); // آپدیت لیست با دیتای جدیدِ سرور
        setNewPhone(''); // خالی کردن فیلد ورودی
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'خطا در افزودن دانش‌آموز';
      Alert.alert('خطا', errorMessage);
    } finally {
      setIsAdding(false);
    }
  };

  // تابع حذف دانش‌آموز
  const handleRemoveStudent = (phone: string) => {
    Alert.alert(
      'حذف دانش‌آموز',
      `آیا از حذف شماره ${phone} از این کلاس مطمئن هستید؟`,
      [
        { text: 'انصراف', style: 'cancel' },
        { 
          text: 'حذف', 
          style: 'destructive',
          onPress: async () => {
            setIsRemoving(phone);
            try {
              const response = await api.delete(`/teacher/classrooms/${classroom._id}/students/${phone}`);
              if (response.data.success) {
                setStudents(response.data.data.students);
              }
            } catch (error: any) {
              Alert.alert('خطا', 'مشکلی در حذف دانش‌آموز رخ داد.');
            } finally {
              setIsRemoving(null);
            }
          }
        }
      ]
    );
  };

  // رندر کردن هر ردیف از لیست دانش‌آموزان
  const renderStudentItem = ({ item, index }: { item: string, index: number }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{index + 1}</Text>
        </View>
        <Text style={styles.studentPhone}>{item}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleRemoveStudent(item)}
        disabled={isRemoving === item}
      >
        {isRemoving === item ? (
          <ActivityIndicator size="small" color={COLORS.error} />
        ) : (
          <Text style={styles.deleteIcon}>🗑️</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        
        {/* هدر صفحه */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>🔙 بازگشت</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{classroom.name}</Text>
            <Text style={styles.headerSubtitle}>{students.length} دانش‌آموز</Text>
          </View>
          <View style={{ width: 60 }} />
        </View>

        {/* بخش افزودن دانش‌آموز */}
        <View style={styles.addSection}>
          <Text style={styles.sectionLabel}>افزودن دانش‌آموز جدید</Text>
          <View style={styles.inputRow}>
            <TouchableOpacity 
              style={[styles.addButton, isAdding && styles.addButtonDisabled]}
              onPress={handleAddStudent}
              disabled={isAdding}
            >
              {isAdding ? <ActivityIndicator color={COLORS.surface} /> : <Text style={styles.addButtonText}>افزودن</Text>}
            </TouchableOpacity>
            
            <TextInput
              style={styles.input}
              placeholder="0912..."
              placeholderTextColor={COLORS.textLight}
              keyboardType="numeric"
              maxLength={11}
              value={newPhone}
              onChangeText={setNewPhone}
            />
          </View>
        </View>

        {/* لیست دانش‌آموزان */}
        <View style={styles.listSection}>
          <Text style={styles.sectionLabel}>لیست دانش‌آموزان کلاس</Text>
          {students.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>هنوز هیچ دانش‌آموزی به این کلاس اضافه نشده است.</Text>
            </View>
          ) : (
            <FlatList
              data={students}
              keyExtractor={(item) => item}
              renderItem={renderStudentItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>

      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row-reverse',
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
  headerSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  backButton: { padding: 8 },
  backButtonText: { color: COLORS.textLight, fontSize: 14 },

  addSection: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionLabel: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 12, textAlign: 'right' },
  inputRow: {
    flexDirection: 'row', // برای چسبیدن دکمه و اینپوت به هم
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderRightWidth: 1,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: '#f8fafc',
    textAlign: 'center',
    letterSpacing: 1,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: { backgroundColor: COLORS.secondary, opacity: 0.7 },
  addButtonText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 16 },

  listSection: { flex: 1, padding: 20 },
  listContent: { paddingBottom: 40 },
  studentCard: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  studentInfo: { flexDirection: 'row-reverse', alignItems: 'center' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  avatarText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 },
  studentPhone: { fontSize: 16, fontWeight: '600', color: COLORS.text, letterSpacing: 1 },
  deleteButton: { padding: 8 },
  deleteIcon: { fontSize: 18 },
  
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  emptyText: { color: COLORS.textLight, fontSize: 15, textAlign: 'center' },
});

export default ClassDetailsScreen;