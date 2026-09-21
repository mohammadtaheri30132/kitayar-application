import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  FlatList
} from 'react-native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';

const CreateExamStep2Screen = ({ route, navigation }: any) => {
  const { examId, examTitle } = route.params;

  // استیت‌های داده
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  
  // استیت‌های پیجینیشن (اسکرول بی‌نهایت)
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true); // لودینگ اولیه
  const [isFetchingMore, setIsFetchingMore] = useState(false); // لودینگ اسکرول به پایین
  const [isSubmitting, setIsSubmitting] = useState(false); // لودینگ دکمه نهایی‌سازی

  // تابع دریافت سوالات با شماره صفحه
  const fetchQuestions = async (pageNumber = 1) => {
    if (pageNumber === 1) {
      setIsLoading(true);
    } else {
      setIsFetchingMore(true);
    }

    try {
      // ارسال page و limit به بک‌اند
      const response = await api.get(`/teacher/questions?page=${pageNumber}&limit=10`);
      
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

  // لود شدن صفحه اول در ابتدای ورود
  useEffect(() => {
    fetchQuestions(1);
  }, []);

  // هندل کردن رسیدن به انتهای لیست (اسکرول)
  const loadMoreData = () => {
    // اگر دیتای بیشتری هست و در حال حاضر مشغول لود کردن نیست، صفحه بعد را بگیر
    if (hasMore && !isFetchingMore && !isLoading) {
      fetchQuestions(page + 1);
    }
  };

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions((prev) => {
      if (prev.includes(questionId)) return prev.filter((id) => id !== questionId);
      return [...prev, questionId];
    });
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
          { text: 'بازگشت', onPress: () => navigation.navigate('DashboardScreen') }
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

      <View style={styles.selectionInfoRow}>
        <Text style={styles.selectionInfoText}>
          سوالات انتخاب شده: <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>{selectedQuestions.length}</Text>
        </Text>
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

      <View style={styles.footer}>
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.primary, marginTop: 2 },
  backButton: { padding: 8 },
  backButtonText: { color: COLORS.textLight, fontSize: 14 },
  selectionInfoRow: { backgroundColor: '#eff6ff', padding: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#bfdbfe' },
  selectionInfoText: { fontSize: 14, color: COLORS.text },
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
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badgesRow: { flexDirection: 'row-reverse' },
  badgeText: { fontSize: 12, color: COLORS.secondary, backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface },
  checkboxSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark: { color: COLORS.surface, fontSize: 16, fontWeight: 'bold', marginTop: -2 },
  questionText: { fontSize: 15, color: COLORS.text, textAlign: 'right', lineHeight: 24 },
  footer: { padding: 20, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  button: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 14, alignItems: 'center' },
  buttonDisabled: { backgroundColor: COLORS.secondary, opacity: 0.7 },
  buttonText: { color: COLORS.surface, fontSize: 16, fontWeight: 'bold' },
});

export default CreateExamStep2Screen;