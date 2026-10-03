import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Trash2, Save, AlertTriangle } from 'lucide-react-native';

const ClassSettingsScreen = ({ route, navigation }: any) => {
  const { classroom, classId, className } = route.params;
  const currentClassId = classId || classroom?._id;
  const currentClassName = className || classroom?.name;
  
  const insets = useSafeAreaInsets();

  const [dbCourses, setDbCourses] = useState<any[]>([]);
  const [dbFields, setDbFields] = useState<any[]>([]);
  const [dbGrades, setDbGrades] = useState<any[]>([]);

  const [editClassName, setEditClassName] = useState(currentClassName);
  const [editCourse, setEditCourse] = useState<string | null>(classroom?.course?._id || classroom?.course || null);
  const [editField, setEditField] = useState<string | null>(classroom?.field || null);
  const [editGrade, setEditGrade] = useState<string | null>(classroom?.grade?._id || classroom?.grade || null);
  const [editNote, setEditNote] = useState(classroom?.note || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (editCourse) {
      fetchFieldsAndGrades(editCourse);
    } else {
      setDbFields([]);
      setDbGrades([]);
      setEditField(null);
      setEditGrade(null);
    }
  }, [editCourse]);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/teacher/builder/courses');
      if (res.data.success) {
        setDbCourses(res.data.data);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const fetchFieldsAndGrades = async (courseId: string) => {
    try {
      const res = await api.get(`/teacher/builder/courses/${courseId}/fields-grades`);
      if (res.data.success) {
        const { fields, grades } = res.data.data;
        setDbFields(fields);
        setDbGrades(grades);
        
        if (fields.length > 0 && !fields.find((f: any) => f._id === editField)) {
          setEditField(null);
        }
        
        if (grades.length > 0 && editGrade && !grades.find((g: any) => g._id === editGrade)) {
          setEditGrade(null);
        }
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleUpdateClass = async () => {
    if (!editClassName.trim()) {
      Alert.alert('خطا', 'نام کلاس نمی‌تواند خالی باشد.');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await api.put(`/teacher/classrooms/${currentClassId}`, {
        name: editClassName,
        courseId: editCourse,
        gradeId: editGrade,
        note: editNote
      });
      if (response.data.success) {
        Alert.alert('موفقیت', 'تنظیمات کلاس با موفقیت بروزرسانی شد.', [
          { text: 'باشه', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error: any) {
      Alert.alert('خطا', error.response?.data?.message || 'خطا در بروزرسانی کلاس');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClass = () => {
    Alert.alert(
      'حذف کلاس',
      `آیا از حذف کامل کلاس «${currentClassName}» و تمام داده‌های آن مطمئن هستید؟ این عملیات قابل بازگشت نیست.`,
      [
        { text: 'انصراف', style: 'cancel' },
        { 
          text: 'بله، حذف کن', 
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const res = await api.delete(`/teacher/classrooms/${currentClassId}`);
              if (res.data.success) {
                Alert.alert('موفقیت', 'کلاس با موفقیت حذف شد.', [
                  { 
                    text: 'متوجه شدم', 
                    onPress: () => {
                      navigation.popToTop();
                    } 
                  }
                ]);
              }
            } catch (error: any) {
              Alert.alert('خطا', error.response?.data?.message || 'خطا در حذف کلاس');
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronRight size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>تنظیمات کلاس</Text>
          <Text style={styles.headerSubtitle}>{currentClassName}</Text>
        </View>
        <TouchableOpacity 
          onPress={handleDeleteClass} 
          style={styles.deleteBtn}
          disabled={isDeleting}
        >
          {isDeleting ? <ActivityIndicator size="small" color="#ef4444" /> : <Trash2 size={24} color="#ef4444" />}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>نام کلاس</Text>
            <TextInput style={styles.input} value={editClassName} onChangeText={setEditClassName} textAlign="right" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>دوره تحصیلی</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipContainer}>
              {dbCourses.map(course => (
                <TouchableOpacity 
                  key={course._id} 
                  style={[styles.chip, editCourse === course._id && styles.chipSelected]} 
                  onPress={() => setEditCourse(course._id)}
                >
                  <Text style={[styles.chipText, editCourse === course._id && styles.chipTextSelected]}>{course.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {dbFields.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>رشته تحصیلی</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipContainer}>
                {dbFields.map(field => (
                  <TouchableOpacity 
                    key={field._id} 
                    style={[styles.chip, editField === field._id && styles.chipSelected]} 
                    onPress={() => {
                      setEditField(field._id);
                      setEditGrade(null);
                    }}
                  >
                    <Text style={[styles.chipText, editField === field._id && styles.chipTextSelected]}>{field.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>پایه تحصیلی</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipContainer}>
              {dbGrades.filter(g => !editField || g.field === editField).map(grade => (
                <TouchableOpacity 
                  key={grade._id} 
                  style={[styles.chip, editGrade === grade._id && styles.chipSelected]} 
                  onPress={() => setEditGrade(grade._id)}
                >
                  <Text style={[styles.chipText, editGrade === grade._id && styles.chipTextSelected]}>{grade.name}</Text>
                </TouchableOpacity>
              ))}
              {dbGrades.filter(g => !editField || g.field === editField).length === 0 && (
                <Text style={styles.emptyText}>بدون پایه (لطفا دوره و رشته را انتخاب کنید)</Text>
              )}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>یادداشت کلاس</Text>
            <TextInput 
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
              value={editNote} 
              onChangeText={setEditNote} 
              multiline 
              placeholder="نکته‌ای درباره این کلاس بنویسید..." 
              textAlign="right" 
            />
          </View>

          {/* ناحیه حساس حذف کلاس */}
          <View style={styles.dangerZone}>
            <View style={styles.dangerHeader}>
              <AlertTriangle size={18} color="#ef4444" />
              <Text style={styles.dangerTitle}>حذف کلاس</Text>
            </View>
            <Text style={styles.dangerDesc}>
              با حذف این کلاس، تمام سوابق حضور و غیاب، برنامه هفتگی و دانش‌آموزان مرتبط با آن به طور دائم حذف خواهند شد.
            </Text>
            <TouchableOpacity 
              style={styles.dangerBtn} 
              onPress={handleDeleteClass}
              disabled={isDeleting}
              activeOpacity={0.8}
            >
              {isDeleting ? (
                <ActivityIndicator color="#ef4444" size="small" />
              ) : (
                <>
                  <Trash2 size={18} color="#ef4444" style={{ marginLeft: 8 }} />
                  <Text style={styles.dangerBtnText}>حذف دائمی کلاس</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.submitBtn} onPress={handleUpdateClass} disabled={isUpdating}>
          {isUpdating ? <ActivityIndicator color="#fff" /> : (
            <>
              <Save size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>ذخیره تغییرات</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  deleteBtn: { padding: 8 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  
  content: { padding: 20, paddingBottom: 40 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 10, textAlign: 'left' },
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 14, textAlign: 'left', color: COLORS.text },
  chipContainer: { flexDirection: 'row-reverse', paddingVertical: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f1f5f9', marginLeft: 8 },
  chipSelected: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.text },
  chipTextSelected: { color: COLORS.surface, fontWeight: 'bold' },
  emptyText: { color: COLORS.textLight, fontSize: 13, textAlign: 'left' },

  dangerZone: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  dangerHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
  },
  dangerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#dc2626',
    marginRight: 6,
  },
  dangerDesc: {
    fontSize: 12,
    color: '#991b1b',
    lineHeight: 18,
    textAlign: 'left',
    marginBottom: 14,
  },
  dangerBtn: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerBtnText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 14,
  },

  footer: { padding: 16, backgroundColor: COLORS.surface, borderTopWidth: 1, borderColor: COLORS.border },
  submitBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  submitBtnText: { color: COLORS.surface, fontSize: 16, fontWeight: 'bold' }
});

export default ClassSettingsScreen;
