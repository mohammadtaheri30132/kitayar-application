import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, TextInput, Modal 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Search, CheckCircle2, PlusCircle, ChevronDown, Eye, EyeOff } from 'lucide-react-native';
import { api } from '../../api/axiosConfig';

const QUESTION_TYPES = ['همه', 'تستی', 'جاخالی', 'صحیح-غلط', 'کوتاه-پاسخ', 'گسترده-پاسخ'];

const SwapQuestionScreen = ({ route, navigation }: any) => {
  const { swapIndex, mode, currentQuestions, bookId: initialBookId } = route.params;

  const [questions, setQuestions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('همه');
  const [showAnswerFor, setShowAnswerFor] = useState<string | null>(null); // برای نمایش پاسخ هر سوال

  // ---------- استیت‌های فیلتر پیشرفته ----------
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [activeSelectMenu, setActiveSelectMenu] = useState<'course' | 'grade' | 'book' | 'lesson' | null>(null);
  
  const [courses, setCourses] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);

  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedGrade, setSelectedGrade] = useState<any>(null);
  const [selectedBook, setSelectedBook] = useState<any>({ _id: initialBookId, name: 'انتخاب شده از قبل' });
  const [selectedLesson, setSelectedLesson] = useState<any>('all');

  // واکشی دوره‌ها
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await api.get('/teacher/builder/courses');
        if (res.data.success) setCourses(res.data.data);
      } catch (e) {}
    };
    fetchInitialData();
  }, []);

  // واکشی پایه‌ها
  useEffect(() => {
    if (!selectedCourse) return;
    const fetchGrades = async () => {
      try {
        const res = await api.get(`/teacher/builder/courses/${selectedCourse._id}/fields-grades`);
        if (res.data.success) setGrades(res.data.data.grades);
      } catch (e) {}
    };
    fetchGrades();
  }, [selectedCourse]);

  // واکشی درس‌ها
  useEffect(() => {
    if (!selectedGrade) return;
    const fetchBooks = async () => {
      try {
        const res = await api.get(`/teacher/builder/grades/${selectedGrade._id}/books`);
        if (res.data.success) setBooks(res.data.data);
      } catch (e) {}
    };
    fetchBooks();
  }, [selectedGrade]);

  // واکشی فصل‌ها (Lessons)
  useEffect(() => {
    if (!selectedBook || !selectedBook._id) return;
    const fetchLessons = async () => {
      try {
        const res = await api.get(`/teacher/builder/books/${selectedBook._id}/lessons`);
        if (res.data.success) {
          setLessons([{ label: 'همه فصل‌ها', value: 'all' }, ...res.data.data.map((l:any) => ({ label: `فصل ${l}`, value: l }))]);
          setSelectedLesson('all');
        }
      } catch (e) {}
    };
    fetchLessons();
  }, [selectedBook]);
  // ------------------------------------------

  // واکشی سوالات (محدودیت ۱۰ تایی اعمال شد)
  const fetchQuestions = async (pageNum = 1, shouldReset = false) => {
    if (loading || (!hasMore && !shouldReset)) return;
    setLoading(true);

    try {
      const res = await api.get(`/teacher/questions`, {
        params: {
          page: pageNum,
          limit: 10, // 👈 لود سوالات 10 تا 10 تا
          search: search || undefined,
          type: selectedType !== 'همه' ? selectedType : undefined,
          bookId: selectedBook?._id || undefined,
          lesson_id: selectedLesson !== 'all' ? selectedLesson : undefined
        }
      });

      if (res.data.success) {
        const newQuestions = res.data.data;
        setQuestions(prev => shouldReset ? newQuestions : [...prev, ...newQuestions]);
        const totalPages = res.data.pagination?.totalPages || 1;
        setHasMore(newQuestions.length > 0 && pageNum < totalPages);
        setPage(pageNum + 1);
      }
    } catch (error) {
      console.log('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  // با تغییر دسته‌بندی، پایه، کتاب یا فصل، لیست ریفرش می‌شود
  useEffect(() => {
    fetchQuestions(1, true);
  }, [selectedType, selectedBook, selectedLesson]);

  // اجرای سرچ به صورت دستی (جلوگیری از باگ در تایپ)
  const handleSearchSubmit = () => {
    fetchQuestions(1, true);
  };

  const handleSelectQuestion = (question: any) => {
    let newArray = [...currentQuestions];
    if (mode === 'swap') {
      newArray[swapIndex] = question; 
    } else {
      newArray.push(question); 
    }
    
    navigation.navigate({
      name: 'ManageQuestionsScreen',
      params: { updatedQuestions: newArray }, 
      merge: true,
    });
  };

  const renderQuestionItem = ({ item }: { item: any }) => {
    const isShowingAnswer = showAnswerFor === item._id;

    return (
      <View style={styles.qCard}>
        <View style={styles.qHeader}>
          <Text style={styles.qType}>{item.type}</Text>
          <Text style={styles.qDifficulty}>فصل {item.lesson_id}</Text>
        </View>
        
        {/* نمایش کامل صورت سوال */}
        <Text style={styles.qText}>{item.question.replace(/<[^>]*>?/gm, '')}</Text>
        
        {/* گزینه‌ها */}
        {item.options && item.options.length > 0 && (
          <View style={styles.optionsContainer}>
            {item.options.map((opt: string, idx: number) => (
              <Text key={idx} style={[styles.optionText, isShowingAnswer && item.correct_option === idx + 1 && styles.correctOptionText]}>
                {idx + 1}- {opt.replace(/<[^>]*>?/gm, '')}
              </Text>
            ))}
          </View>
        )}

        {/* بخش نمایش پاسخ */}
        {isShowingAnswer && (
          <View style={styles.answerBox}>
            <Text style={styles.answerLabel}>پاسخ صحیح:</Text>
            {item.answer ? (
              <Text style={styles.answerText}>{item.answer.replace(/<[^>]*>?/gm, '')}</Text>
            ) : (
              <Text style={styles.answerText}>پاسخ تشریحی وارد نشده است.</Text>
            )}
            
            {item.correct_option && (
               <View style={styles.correctOptionBadge}>
                 <Text style={styles.correctOptionBadgeText}>گزینه صحیح: {item.correct_option}</Text>
               </View>
            )}
          </View>
        )}
        
        {/* دکمه‌های اکشن */}
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.showAnswerBtn} 
            onPress={() => setShowAnswerFor(isShowingAnswer ? null : item._id)}
          >
            {isShowingAnswer ? <EyeOff size={16} color="#475569" /> : <Eye size={16} color="#475569" />}
            <Text style={styles.showAnswerBtnText}>مشاهده پاسخ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.selectBtn} onPress={() => handleSelectQuestion(item)}>
            {mode === 'add' ? <PlusCircle size={16} color="#fff" /> : <CheckCircle2 size={16} color="#fff" />}
            <Text style={styles.selectBtnText}>
              {mode === 'add' ? 'افزودن به برگه' : 'جایگزینی در برگه'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSelectionList = () => {
    let data = [];
    let title = '';
    let onSelect = (val: any) => {};

    if (activeSelectMenu === 'course') { data = courses; title = 'دوره'; onSelect = c => { setSelectedCourse(c); setActiveSelectMenu(null); }; }
    if (activeSelectMenu === 'grade') { data = grades; title = 'پایه'; onSelect = g => { setSelectedGrade(g); setActiveSelectMenu(null); }; }
    if (activeSelectMenu === 'book') { data = books; title = 'درس'; onSelect = b => { setSelectedBook(b); setActiveSelectMenu(null); }; }
    if (activeSelectMenu === 'lesson') { data = lessons; title = 'فصل'; onSelect = l => { setSelectedLesson(l.value); setActiveSelectMenu(null); }; }

    if (!activeSelectMenu) return null;

    return (
      <View style={styles.innerModal}>
        <View style={styles.innerModalHeader}>
          <Text style={styles.innerModalTitle}>انتخاب {title}</Text>
          <TouchableOpacity onPress={() => setActiveSelectMenu(null)}><X size={20} color="#64748b" /></TouchableOpacity>
        </View>
        <FlatList
          data={data}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.innerModalItem} onPress={() => onSelect(item)}>
              <Text style={styles.innerModalItemText}>{item.name || item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}><X size={24} color="#334155" /></TouchableOpacity>
        <Text style={styles.title}>{mode === 'add' ? 'افزودن سوال جدید' : 'جایگزینی سوال'}</Text>
        
        {/* 👈 تغییر آیکون به دکمه متنی */}
        <TouchableOpacity onPress={() => setShowFilterSheet(true)} style={styles.filterMenuBtn}>
          <Text style={styles.filterMenuBtnText}>فیلتر و منبع</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.searchBox}>
          <TouchableOpacity onPress={handleSearchSubmit} style={styles.searchIconBtn}>
            <Search size={20} color="#fff" />
          </TouchableOpacity>
          <TextInput 
            style={styles.searchInput} 
            placeholder="جستجوی کلمه در سوالات..." 
            value={search} 
            onChangeText={setSearch} 
            onSubmitEditing={handleSearchSubmit} 
            returnKeyType="search"
          />
        </View>

        <FlatList
          horizontal showsHorizontalScrollIndicator={false} inverted
          data={QUESTION_TYPES}
          keyExtractor={(i) => i}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.filterChip, selectedType === item && styles.filterChipActive]} onPress={() => setSelectedType(item)}>
              <Text style={[styles.filterChipText, selectedType === item && styles.filterChipTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={questions}
        keyExtractor={(item, idx) => item._id + idx}
        renderItem={renderQuestionItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        onEndReached={() => fetchQuestions(page)}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading ? <ActivityIndicator color="#3b82f6" style={{ padding: 20 }} /> : null}
      />

      <Modal visible={showFilterSheet} transparent animationType="slide" onRequestClose={() => setShowFilterSheet(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>تنظیمات جستجوی بانک</Text>
              <TouchableOpacity onPress={() => setShowFilterSheet(false)}><X size={20} color="#64748b" /></TouchableOpacity>
            </View>

            {activeSelectMenu ? (
              renderSelectionList()
            ) : (
              <View>
                <TouchableOpacity style={styles.selector} onPress={() => setActiveSelectMenu('course')}>
                  <Text style={styles.selectorLabel}>دوره</Text>
                  <View style={styles.selectorValueBox}>
                    <Text style={styles.selectorValue}>{selectedCourse?.name || 'انتخاب کنید'}</Text>
                    <ChevronDown size={16} color="#94a3b8" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.selector, !selectedCourse && { opacity: 0.5 }]} disabled={!selectedCourse} onPress={() => setActiveSelectMenu('grade')}>
                  <Text style={styles.selectorLabel}>پایه</Text>
                  <View style={styles.selectorValueBox}>
                    <Text style={styles.selectorValue}>{selectedGrade?.name || 'انتخاب کنید'}</Text>
                    <ChevronDown size={16} color="#94a3b8" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.selector, !selectedGrade && { opacity: 0.5 }]} disabled={!selectedGrade} onPress={() => setActiveSelectMenu('book')}>
                  <Text style={styles.selectorLabel}>درس (منبع سوالات)</Text>
                  <View style={styles.selectorValueBox}>
                    <Text style={styles.selectorValue}>{selectedBook?.name || 'انتخاب کنید'}</Text>
                    <ChevronDown size={16} color="#94a3b8" />
                  </View>
                </TouchableOpacity>
                
                {/* 👈 فیلد جدید فصل اضافه شد */}
                <TouchableOpacity style={[styles.selector, !selectedBook && { opacity: 0.5 }]} disabled={!selectedBook} onPress={() => setActiveSelectMenu('lesson')}>
                  <Text style={styles.selectorLabel}>فصل</Text>
                  <View style={styles.selectorValueBox}>
                    <Text style={styles.selectorValue}>{selectedLesson === 'all' ? 'همه فصل‌ها' : `فصل ${selectedLesson}`}</Text>
                    <ChevronDown size={16} color="#94a3b8" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.applyFilterBtn} onPress={() => { setShowFilterSheet(false); handleSearchSubmit(); }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>اعمال و جستجو</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  
  filterMenuBtn: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  filterMenuBtnText: { color: '#2563eb', fontWeight: 'bold', fontSize: 13 },
  
  filtersContainer: { backgroundColor: '#fff', padding: 12, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  
  searchBox: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 10, height: 48, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  searchInput: { flex: 1, textAlign: 'right', paddingHorizontal: 12, fontFamily: 'System', fontSize: 14 },
  searchIconBtn: { backgroundColor: '#3b82f6', height: '100%', paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
  
  filterChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f5f9', marginLeft: 8 },
  filterChipActive: { backgroundColor: '#dbeafe' },
  filterChipText: { fontSize: 13, color: '#64748b' },
  filterChipTextActive: { color: '#2563eb', fontWeight: 'bold' },
  
  qCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  qHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 12 },
  qType: { fontSize: 11, backgroundColor: '#eff6ff', color: '#2563eb', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontWeight: 'bold' },
  qDifficulty: { fontSize: 11, color: '#64748b', backgroundColor: '#f8fafc', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  qText: { fontSize: 15, color: '#1e293b', textAlign: 'right', lineHeight: 28, marginBottom: 16 },
  
  optionsContainer: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  optionText: { fontSize: 13, color: '#475569', textAlign: 'right', marginBottom: 8, lineHeight: 22 },
  correctOptionText: { color: '#059669', fontWeight: 'bold' },
  
  answerBox: { backgroundColor: '#f0fdf4', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#d1fae5' },
  answerLabel: { fontSize: 12, fontWeight: 'bold', color: '#059669', marginBottom: 6, textAlign: 'right' },
  answerText: { fontSize: 14, color: '#065f46', textAlign: 'right', lineHeight: 24 },
  correctOptionBadge: { alignSelf: 'flex-end', backgroundColor: '#d1fae5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginTop: 10 },
  correctOptionBadgeText: { color: '#065f46', fontSize: 12, fontWeight: 'bold' },

  cardActions: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderColor: '#f1f5f9' },
  showAnswerBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  showAnswerBtnText: { color: '#475569', fontSize: 13, fontWeight: 'bold' },
  selectBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 6 },
  selectBtnText: { fontWeight: 'bold', fontSize: 13, color: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  sheetHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderColor: '#f1f5f9', marginBottom: 16 },
  sheetTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  
  selector: { width: '100%', marginBottom: 16 },
  selectorLabel: { fontSize: 13, color: '#64748b', marginBottom: 8, textAlign: 'right' },
  selectorValueBox: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, height: 48 },
  selectorValue: { fontSize: 14, color: '#0f172a', fontWeight: '500' },
  applyFilterBtn: { backgroundColor: '#10b981', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },

  innerModal: { height: 350 },
  innerModalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  innerModalTitle: { fontSize: 14, fontWeight: 'bold', color: '#3b82f6' },
  innerModalItem: { paddingVertical: 14, borderBottomWidth: 1, borderColor: '#f8fafc' },
  innerModalItemText: { fontSize: 14, textAlign: 'right', color: '#334155' }
});

export default SwapQuestionScreen;