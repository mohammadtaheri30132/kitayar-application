import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  FlatList
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';

const CreateExamStep2Screen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { examId, examTitle } = route.params;

  // استیت‌های داده
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  
  // استیت‌های پیجینیشن (اسکرول بی‌نهایت)
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [origin, setOrigin] = useState<'mine' | 'admin'>('mine');

  // تابع دریافت سوالات با شماره صفحه و منبع
  const fetchQuestions = async (pageNumber = 1, currentOrigin = origin) => {
    if (pageNumber === 1) {
      setIsLoading(true);
    } else {
      setIsFetchingMore(true);
    }

    try {
      const response = await api.get(`/teacher/questions?page=${pageNumber}&limit=10&origin=${currentOrigin}`);
      
      if (response.data.success) {
        const newQuestions = response.data.data;
        const paginationInfo = response.data.pagination;

        if (pageNumber === 1) {
          // اگر صفحه اول است، دیتای قبلی را پاک کن و دیتای جدید بگذار
          setQuestions(newQuestions);
        } else {
          // اگر اسکرول کرده، دیتای جدید را به انتهای لیست قبلی بچسبان
          setQuestions((prev) => [...prev, ...newQuestions]);
        }

        // بروزرسانی وضعیت صفحه‌بندی
        setHasMore(paginationInfo.hasNextPage);
        setPage(pageNumber);
      }
    } catch (error) {
      Alert.alert('خطا', 'مشکلی در دریافت بانک سوالات به وجود آمد.');
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };


  useFocusEffect(
    useCallback(() => {
      fetchQuestions(1, origin);
    }, [origin])
  );

  const loadMoreData = () => {
    if (hasMore && !isFetchingMore && !isLoading) {
      fetchQuestions(page + 1, origin);
    }
  };

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions((prev) => {
      if (prev.includes(questionId)) return prev.filter((id) => id !== questionId);
      return [...prev, questionId];
    });
  };

  const handleDeleteQuestion = (questionId: string) => {
    Alert.alert(
      'حذف سوال',
      'آیا مطمئن هستید که می‌خواهید این سوال را برای همیشه حذف کنید؟',
      [
        { text: 'انصراف', style: 'cancel' },
        { 
          text: 'حذف', 
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/teacher/questions/${questionId}`);
              if (res.data.success) {
                // Remove from state
                setQuestions(prev => prev.filter(q => q._id !== questionId));
                setSelectedQuestions(prev => prev.filter(id => id !== questionId));
              }
            } catch (error) {
              Alert.alert('خطا', 'مشکلی در حذف سوال رخ داد');
            }
          }
        }
      ]
    );
  };

  const handleFinalizeExam = async () => {
    if (selectedQuestions.length === 0) {
      Alert.alert('توجه', 'لطفاً حداقل یک سوال انتخاب کنید.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.post(`/teacher/exams/${examId}/questions`, {
        questionIds: selectedQuestions,
      });
      if (response.data.success) {
        Alert.alert('موفقیت', 'آزمون ساخته شد!', [
          { text: 'بازگشت', onPress: () => navigation.navigate('ExamListScreen') }
        ]);
      }
    } catch (error: any) {
      Alert.alert('خطا', 'خطا در ثبت سوالات');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestionItem = ({ item, index }: { item: any, index: number }) => {
    const isSelected = selectedQuestions.includes(item._id);
    return (
      <TouchableOpacity 
        style={[styles.questionCard, isSelected && styles.questionCardSelected]}
        activeOpacity={0.7}
        onPress={() => toggleQuestionSelection(item._id)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.badgesRow}>
            <Text style={styles.badgeText}>{item.type === 'تشریحی' ? '📝 تشریحی' : '☑️ تستی'}</Text>
            {origin === 'mine' && (
              <>
                <TouchableOpacity 
                  style={[styles.badgeText, { marginLeft: 8, backgroundColor: '#fef3c7' }]}
                  onPress={() => navigation.navigate('CreateCustomQuestionScreen', { 
                    examId, 
                    editQuestion: item 
                  })}
                >
                  <Text style={{ color: '#d97706', fontSize: 12 }}>ویرایش</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.badgeText, { marginLeft: 4, backgroundColor: '#fee2e2' }]}
                  onPress={() => handleDeleteQuestion(item._id)}
                >
                  <Text style={{ color: '#dc2626', fontSize: 12 }}>حذف</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </View>
        <Text style={styles.questionText}>
          <Text style={{ fontWeight: 'bold' }}>{item.question}</Text>
        </Text>
      </TouchableOpacity>
    );
  };

  // کامپوننتی که در انتهای لیست نمایش داده می‌شود (هنگام لود صفحه بعدی)
  const renderFooter = () => {
    if (!isFetchingMore) return <View style={{ height: 20 }} />;
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>🔙 بازگشت</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>انتخاب سوالات</Text>
          <Text style={styles.headerSubtitle}>{examTitle}</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity 
          style={[styles.tabBtn, origin === 'mine' && styles.tabBtnActive]}
          onPress={() => setOrigin('mine')}
        >
          <Text style={[styles.tabText, origin === 'mine' && styles.tabTextActive]}>سوالات من</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, origin === 'admin' && styles.tabBtnActive]}
          onPress={() => setOrigin('admin')}
        >
          <Text style={[styles.tabText, origin === 'admin' && styles.tabTextActive]}>بانک جامع</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.selectionInfoRow}>
        <Text style={styles.selectionInfoText}>
          سوالات انتخاب شده: <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>{selectedQuestions.length}</Text>
        </Text>
        <TouchableOpacity 
          style={styles.addCustomBtn}
          onPress={() => navigation.navigate('CreateCustomQuestionScreen', { examId })}
        >
          <Text style={styles.addCustomBtnText}>+ سوال جدید</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : questions.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>سوالی در بانک یافت نشد.</Text>
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item, index) => item._id + index.toString()} // جلوگیری از کلیدهای تکراری احتمالی
          renderItem={renderQuestionItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          
          // === تنظیمات اسکرول بی‌نهایت ===
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.5} // وقتی اسکرول به ۵۰ درصد از انتهای صفحه رسید، درخواست بعدی را بفرست
          ListFooterComponent={renderFooter}
          
          // قابلیت کشیدن به پایین برای رفرش کردن کل لیست
          refreshing={isLoading}
          onRefresh={() => fetchQuestions(1)}
        />
      )}

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity 
          style={[styles.button, (isSubmitting || selectedQuestions.length === 0) && styles.buttonDisabled]} 
          onPress={handleFinalizeExam}
          disabled={isSubmitting || selectedQuestions.length === 0}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.surface} size="small" />
          ) : (
            <Text style={styles.buttonText}>نهایی‌سازی آزمون ({selectedQuestions.length} سوال)</Text>
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
    padding: 20,
    paddingTop: 40,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
    zIndex: 10,
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.primary, marginTop: 2 },
  backButton: { padding: 8 },
  backButtonText: { color: COLORS.textLight, fontSize: 14 },
  selectionInfoRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#eff6ff', padding: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#bfdbfe' },
  selectionInfoText: { fontSize: 14, color: COLORS.text },
  addCustomBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addCustomBtnText: { color: COLORS.surface, fontSize: 12, fontWeight: 'bold' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: COLORS.textLight, fontSize: 15 },
  listContainer: { padding: 20 },
  questionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  questionCardSelected: { borderColor: COLORS.primary, backgroundColor: '#f8fafc' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badgesRow: { flexDirection: 'row' },
  badgeText: { fontSize: 12, color: COLORS.secondary, backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface },
  checkboxSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark: { color: COLORS.surface, fontSize: 16, fontWeight: 'bold', marginTop: -2 },
  questionText: { fontSize: 15, color: COLORS.text, textAlign: 'right', lineHeight: 24 },
  footer: { padding: 20, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  button: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 14, alignItems: 'center' },
  buttonDisabled: { backgroundColor: COLORS.secondary, opacity: 0.7 },
  buttonText: { color: COLORS.surface, fontSize: 16, fontWeight: 'bold' },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    justifyContent: 'center',
    gap: 12
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#f1f5f9'
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary
  },
  tabText: {
    color: COLORS.textLight,
    fontWeight: 'bold',
    fontSize: 14
  },
  tabTextActive: {
    color: COLORS.surface
  }
});

export default CreateExamStep2Screen;