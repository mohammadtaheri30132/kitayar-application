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

const EditExamScreen = ({ route, navigation }: any) => {
  const { examId, examTitle } = route.params;

  // استیت‌های داده
  const [initialQuestions, setInitialQuestions] = useState<any[]>([]); // آبجکت سوالاتی که از قبل در آزمون بودند
  const [bankQuestions, setBankQuestions] = useState<any[]>([]); // سوالات دریافتی از بانک (صفحه‌بندی شده)
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      await fetchExamDetails();
      await fetchQuestionsBank(1);
    };
    init();
  }, []);

  const fetchExamDetails = async () => {
    try {
      const response = await api.get(`/teacher/exams/${examId}`);
      if (response.data.success) {
        const existingQuestions = response.data.data.questions || [];
        // ذخیره آبجکت سوالات برای نمایش در بالای لیست
        setInitialQuestions(existingQuestions);
        // ذخیره آیدی‌ها برای مدیریت تیک خوردن
        setSelectedQuestions(existingQuestions.map((q: any) => typeof q === 'object' ? q._id : q));
      }
    } catch (error) {
      console.log('خطا در دریافت جزئیات آزمون');
    }
  };

  const fetchQuestionsBank = async (pageNumber = 1) => {
    if (pageNumber === 1) setIsLoading(true);
    else setIsFetchingMore(true);

    try {
      const response = await api.get(`/teacher/questions?page=${pageNumber}&limit=10`);
      
      if (response.data.success) {
        const newQuestions = response.data.data;
        const paginationInfo = response.data.pagination;

        if (pageNumber === 1) setBankQuestions(newQuestions);
        else setBankQuestions((prev) => [...prev, ...newQuestions]);

        setHasMore(paginationInfo?.hasNextPage ?? false);
        setPage(pageNumber);
      }
    } catch (error) {
      Alert.alert('خطا', 'مشکلی در دریافت بانک سوالات رخ داد.');
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  const loadMoreData = () => {
    if (hasMore && !isFetchingMore && !isLoading) fetchQuestionsBank(page + 1);
  };

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions((prev) => {
      if (prev.includes(questionId)) return prev.filter((id) => id !== questionId);
      return [...prev, questionId];
    });
  };

  const handleSaveChanges = async () => {
    if (selectedQuestions.length === 0) {
      Alert.alert('توجه', 'آزمون نمی‌تواند بدون سوال باشد.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.put(`/teacher/exams/${examId}/questions`, { questionIds: selectedQuestions });
      if (response.data.success) {
        Alert.alert('موفقیت', 'تغییرات با موفقیت ذخیره شد!', [{ text: 'باشه', onPress: () => navigation.goBack() }]);
      }
    } catch (error: any) {
      Alert.alert('خطا', 'خطا در ذخیره تغییرات.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestionItem = ({ item }: { item: any }) => {
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
        <Text style={styles.questionText}><Text style={{ fontWeight: 'bold' }}>{item.question}</Text></Text>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isFetchingMore) return <View style={{ height: 20 }} />;
    return <View style={{ paddingVertical: 20 }}><ActivityIndicator size="small" color={COLORS.primary} /></View>;
  };

  // 💡 ادغام و فیلتر لیست نهایی: سوالات اولیه در بالا + سوالات بانک (بدون تکرار)
  const initialQuestionIds = initialQuestions.map(q => q._id);
  const filteredBank = bankQuestions.filter(q => !initialQuestionIds.includes(q._id));
  const displayList = [...initialQuestions, ...filteredBank];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>🔙 انصراف</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>ویرایش سوالات</Text>
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
        <View style={styles.centerBox}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={(item, index) => item._id + index.toString()}
          renderItem={renderQuestionItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, isSubmitting && styles.buttonDisabled]} 
          onPress={handleSaveChanges}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.surface} size="small" />
          ) : (
            <Text style={styles.buttonText}>💾 ذخیره تغییرات آزمون</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, elevation: 2, zIndex: 10 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.primary, marginTop: 2 },
  backButton: { padding: 8 },
  backButtonText: { color: COLORS.textLight, fontSize: 14 },
  selectionInfoRow: { backgroundColor: '#eff6ff', padding: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#bfdbfe' },
  selectionInfoText: { fontSize: 14, color: COLORS.text },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 20 },
  questionCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: COLORS.border },
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

export default EditExamScreen;