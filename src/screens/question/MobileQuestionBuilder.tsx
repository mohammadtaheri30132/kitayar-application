import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, TouchableOpacity, FlatList, ScrollView, StyleSheet, 
  Modal, ActivityIndicator, TextInput, Alert 
} from 'react-native';
import { X, ChevronDown, Settings2, Check } from 'lucide-react-native'; // 👈 Check اضافه شد
import { api } from '../../api/axiosConfig';
import { SafeAreaView } from 'react-native-safe-area-context';

const PREDEFINED_HEADERS = [
  { id: 'none', label: 'بدون سربرگ (حذف)' },
  { 
    id: 'header-std-1', 
    label: 'قالب استاندارد ۱', 
    layout: 'standard-1',
    standard1: { bismillah: 'بسمه تعالی', studentName: 'نام و نام خانوادگی:', centerText: 'اداره آموزش و پرورش\nآزمون هماهنگ', examDate: 'تاریخ:', stampText: 'محل مهر', schoolName: 'آموزشگاه:', examStartTime: 'ساعت شروع:', pageCount: 'تعداد صفحه:', examDuration: 'مدت آزمون:', pageNumber: 'صفحه:', questionCount: 'تعداد سوال:', scoreNumeric: 'نمره عدد:', examSubject: 'درس:', scoreWritten: 'نمره حروف:' }
  },
  { 
    id: 'header-std-4', 
    label: 'قالب مینیمال', 
    layout: 'standard-4',
    standard4: { rightLabel1: 'نام و نام خانوادگی:', centerLine1: 'بسمه تعالی', centerLine2: 'آزمون پایان ترم', centerLine3: '', leftLabel1: 'تاریخ:', rightLabel2: 'پایه و کلاس:', leftLabel2: 'زمان:', rightLabel3: 'شماره داوطلب:', leftLabel3: 'نمره:', rightLabel4: 'نام درس:', questionCountLabel: 'تعداد سوال:', pageCountLabel: 'تعداد صفحه:', bottomSignLabel: 'امضای مصحح:', bottomScoreNumeric: 'نمره به عدد:', bottomScoreWritten: 'نمره به حروف:' }
  }
];

const MobileQuestionBuilder = ({ navigation }: any) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);

  const [selectedHeader, setSelectedHeader] = useState<any>(PREDEFINED_HEADERS[1]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedField, setSelectedField] = useState<any>(null);
  const [selectedGrade, setSelectedGrade] = useState<any>(null);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  
  // 👈 استیت فصل‌ها به آرایه تبدیل شد
  const [selectedLessons, setSelectedLessons] = useState<any[]>(['all']);
  
  const [questionCount, setQuestionCount] = useState<string>('10');
  const [loading, setLoading] = useState(false);
  const [activeBottomSheet, setActiveBottomSheet] = useState<'header' | 'course' | 'field' | 'grade' | 'book' | 'lesson' | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/teacher/builder/courses');
        if (res.data.success) {
          setCourses(res.data.data);
        } else {
          Alert.alert('خطا', 'سرور لیستی ارسال نکرد.');
        }
      } catch (e: any) {
        // 👈 این الرت به ما میگه مشکل دقیقاً چیه
        Alert.alert(
          'خطای ارتباط با سرور', 
          e?.response?.status === 401 
            ? 'نشست شما منقضی شده، لطفا دوباره لاگین کنید.' 
            : e.message || 'ارتباط با سرور برقرار نشد.'
        );
        console.log('Fetch Courses Error:', e);
      }
    };

    // 👈 مهم‌ترین رفع ایراد سرعت ورود به صفحه:
    // InteractionManager از هسته React Native حذف شده، پس به‌جاش از
    // requestIdleCallback استفاده می‌کنیم (کار سنگین رو به زمانی موکول می‌کنه
    // که ترد جاوااسکریپت بیکاره، یعنی بعد از اتمام انیمیشن ورود صفحه).
    // چون requestIdleCallback روی همه‌ی نسخه‌های Hermes/RN تضمین‌شده نیست،
    // یک fallback با setTimeout(0) هم در نظر گرفته شده.
    const ric: (cb: () => void) => number =
      (global as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 0) as unknown as number);
    const cic: (handle: number) => void =
      (global as any).cancelIdleCallback || ((handle: number) => clearTimeout(handle as unknown as ReturnType<typeof setTimeout>));

    const handle = ric(() => {
      fetchCourses();
    });

    return () => cic(handle);
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    const fetchFieldsAndGrades = async () => {
      try {
        const res = await api.get(`/teacher/builder/courses/${selectedCourse._id}/fields-grades`);
        if (res.data.success) {
          setFields(res.data.data.fields);
          setGrades(res.data.data.grades);
          setSelectedField(null); setSelectedGrade(null); setSelectedBook(null); setSelectedLessons(['all']);
        }
      } catch (e) { console.log(e); }
    };
    fetchFieldsAndGrades();
  }, [selectedCourse]);

  useEffect(() => {
    if (!selectedGrade) return;
    const fetchBooks = async () => {
      try {
        const res = await api.get(`/teacher/builder/grades/${selectedGrade._id}/books`);
        if (res.data.success) {
          setBooks(res.data.data);
          setSelectedBook(null); setSelectedLessons(['all']);
        }
      } catch (e) { console.log(e); }
    };
    fetchBooks();
  }, [selectedGrade]);

  useEffect(() => {
    if (!selectedBook) return;
    const fetchLessons = async () => {
      try {
        const res = await api.get(`/teacher/builder/books/${selectedBook._id}/lessons`);
        if (res.data.success) {
          setLessons([{ label: 'همه فصل‌ها', value: 'all' }, ...res.data.data.map((l:any) => ({ label: `فصل ${l}`, value: l }))]);
          setSelectedLessons(['all']);
        }
      } catch (e) { console.log(e); }
    };
    fetchLessons();
  }, [selectedBook]);

  // 👈 تابع جابجایی تیک فصل‌ها
  const toggleLesson = useCallback((value: any) => {
    if (value === 'all') {
      setSelectedLessons(['all']);
    } else {
      setSelectedLessons(prev => {
        let newLessons = prev.filter(l => l !== 'all');
        if (newLessons.includes(value)) {
          newLessons = newLessons.filter(l => l !== value);
          if (newLessons.length === 0) newLessons = ['all'];
        } else {
          newLessons = [...newLessons, value];
        }
        return newLessons;
      });
    }
  }, []);

  const handleGenerate = async () => {
    if (!selectedBook) {
      Alert.alert('خطا', 'لطفا ابتدا یک درس را انتخاب کنید.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/teacher/builder/generate', {
        bookId: selectedBook._id,
        lessonId: selectedLessons, // 👈 آرایه فصل‌ها ارسال می‌شود
        count: questionCount
      });
      if (res.data.success) {
        navigation.navigate('PreviewExamScreen', {
          questions: res.data.data,
          header: selectedHeader
        });
      }
    } catch (e) {
      Alert.alert('خطا', 'مشکلی در دریافت سوالات پیش آمد.');
    } finally {
      setLoading(false);
    }
  };

  const renderBottomSheet = () => {
    let data: any[] = [];
    let title = '';
    let onSelect = (item: any) => {};

    switch (activeBottomSheet) {
      case 'header':
        data = PREDEFINED_HEADERS; title = 'انتخاب سربرگ آزمون';
        onSelect = (item) => { setSelectedHeader(item); setActiveBottomSheet(null); }; break;
      case 'course':
        data = courses; title = 'انتخاب دوره';
        onSelect = (item) => { setSelectedCourse(item); setActiveBottomSheet(null); }; break;
      case 'field':
        data = fields; title = 'انتخاب رشته';
        onSelect = (item) => { setSelectedField(item); setActiveBottomSheet(null); }; break;
      case 'grade':
        data = grades; title = 'انتخاب پایه';
        onSelect = (item) => { setSelectedGrade(item); setActiveBottomSheet(null); }; break;
      case 'book':
        data = books; title = 'انتخاب درس';
        onSelect = (item) => { setSelectedBook(item); setActiveBottomSheet(null); }; break;
      case 'lesson':
        data = lessons; title = 'انتخاب فصل‌ها';
        // در حالت فصل‌ها، با کلیک باتم‌شیت بسته نمی‌شود
        onSelect = (item) => { toggleLesson(item.value); }; break;
      default: return null;
    }

    const isLessonSheet = activeBottomSheet === 'lesson';

    return (
      <Modal visible={!!activeBottomSheet} transparent animationType="slide" onRequestClose={() => setActiveBottomSheet(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setActiveBottomSheet(null)}>
          <View style={styles.bottomSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{title}</Text>
              <TouchableOpacity onPress={() => setActiveBottomSheet(null)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={data}
              keyExtractor={(item, index) => item._id || item.id || index.toString()}
              renderItem={({ item }) => {
                const isSelected = isLessonSheet ? selectedLessons.includes(item.value) : false;
                return (
                  <TouchableOpacity 
                    style={styles.sheetItem} 
                    onPress={() => onSelect(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sheetItemText}>{item.name || item.label}</Text>
                    
                    {/* 👈 چک‌باکس برای فصل‌ها */}
                    {isLessonSheet && (
                      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && <Check size={14} color="#fff" />}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
            {/* دکمه تایید فقط برای باتم شیت انتخاب فصل‌ها */}
            {isLessonSheet && (
              <TouchableOpacity style={styles.confirmBtn} onPress={() => setActiveBottomSheet(null)}>
                <Text style={styles.confirmBtnText}>تایید انتخاب</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const isHighSchool = selectedCourse?.name?.includes('متوسطه دوم');
  
  // 👈 متن نمایشی تمیز برای فصل‌های انتخاب شده
  const lessonDisplayValue = selectedLessons.includes('all') 
    ? 'همه فصل‌ها' 
    : `فصل‌های: ${selectedLessons.sort((a,b) => a-b).join('، ')}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <X size={24} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.title}>آزمون‌ساز جادویی</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 👈 قبلا یک FlatList با یک آیتم ساختگی بود که فقط اورهد virtualization
          اضافه می‌کرد و باعث کند شدن mount صفحه می‌شد. حالا ScrollView ساده. */}
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              <Settings2 size={16} color="#3b82f6"/> پارامترهای آزمون
            </Text>
            
            <View style={styles.formCol}>
              <TouchableOpacity style={styles.selector} onPress={() => setActiveBottomSheet('header')}>
                <Text style={styles.selectorLabel}>سربرگ آزمون</Text>
                <View style={styles.selectorValueBox}>
                  <Text style={styles.selectorValue}>{selectedHeader?.label}</Text>
                  <ChevronDown size={16} color="#94a3b8" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.selector} onPress={() => setActiveBottomSheet('course')}>
                <Text style={styles.selectorLabel}>دوره</Text>
                <View style={styles.selectorValueBox}>
                  <Text style={styles.selectorValue}>{selectedCourse?.name || 'انتخاب کنید'}</Text>
                  <ChevronDown size={16} color="#94a3b8" />
                </View>
              </TouchableOpacity>

              {isHighSchool && (
                <TouchableOpacity style={[styles.selector, !selectedCourse && styles.disabledSelector]} disabled={!selectedCourse} onPress={() => setActiveBottomSheet('field')}>
                  <Text style={styles.selectorLabel}>رشته</Text>
                  <View style={styles.selectorValueBox}>
                    <Text style={styles.selectorValue}>{selectedField?.name || 'انتخاب کنید'}</Text>
                    <ChevronDown size={16} color="#94a3b8" />
                  </View>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={[styles.selector, !selectedCourse && styles.disabledSelector]} disabled={!selectedCourse} onPress={() => setActiveBottomSheet('grade')}>
                <Text style={styles.selectorLabel}>پایه تحصیلی</Text>
                <View style={styles.selectorValueBox}>
                  <Text style={styles.selectorValue}>{selectedGrade?.name || 'انتخاب کنید'}</Text>
                  <ChevronDown size={16} color="#94a3b8" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.selector, !selectedGrade && styles.disabledSelector]} disabled={!selectedGrade} onPress={() => setActiveBottomSheet('book')}>
                <Text style={styles.selectorLabel}>درس</Text>
                <View style={styles.selectorValueBox}>
                  <Text style={styles.selectorValue}>{selectedBook?.name || 'انتخاب کنید'}</Text>
                  <ChevronDown size={16} color="#94a3b8" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.selector, !selectedBook && styles.disabledSelector]} disabled={!selectedBook} onPress={() => setActiveBottomSheet('lesson')}>
                <Text style={styles.selectorLabel}>محدوده فصل‌ها</Text>
                <View style={styles.selectorValueBox}>
                  <Text style={styles.selectorValue} numberOfLines={1}>{lessonDisplayValue}</Text>
                  <ChevronDown size={16} color="#94a3b8" />
                </View>
              </TouchableOpacity>

              <View style={styles.selector}>
                <Text style={styles.selectorLabel}>تعداد سوال</Text>
                <View style={styles.selectorValueBox}>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    value={questionCount} 
                    onChangeText={setQuestionCount} 
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.fixedBottomContainer}>
        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateBtnText}>تولید و مشاهده برگه</Text>
          )}
        </TouchableOpacity>
      </View>

      {renderBottomSheet()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  content: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#334155', marginBottom: 16, textAlign: 'right', flexDirection: 'row-reverse', alignItems: 'center' },
  formCol: { flexDirection: 'column' },
  selector: { width: '100%', marginBottom: 16 },
  disabledSelector: { opacity: 0.5 },
  selectorLabel: { fontSize: 13, color: '#64748b', marginBottom: 8, textAlign: 'right' },
  selectorValueBox: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, height: 48 },
  selectorValue: { fontSize: 14, color: '#0f172a', fontWeight: '500', flex: 1, textAlign: 'right', marginRight: 8 },
  input: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  fixedBottomContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16,
    borderTopWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 5,
  },
  generateBtn: { backgroundColor: '#2563eb', borderRadius: 12, height: 52, justifyContent: 'center', alignItems: 'center' },
  generateBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  // 👈 پس زمینه کاملا شیشه‌ای و بدون رنگ مشکی
  modalOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' }, 
  
  // 👈 اضافه شدن سایه به خودِ باتم‌شیت برای اینکه روی صفحه بهتر دیده بشه
  bottomSheet: { 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    maxHeight: '70%', 
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 20,
    borderTopWidth: 1,
    borderColor: '#e2e8f0'
  },
  sheetHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderColor: '#f1f5f9', marginBottom: 8 },
  sheetTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  sheetItem: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderColor: '#f8fafc' },
  sheetItemText: { fontSize: 14, color: '#334155', textAlign: 'right' },
  
  // استایل‌های جدید مربوط به چک باکس
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  confirmBtn: { backgroundColor: '#10b981', borderRadius: 12, height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' }
});

export default MobileQuestionBuilder;