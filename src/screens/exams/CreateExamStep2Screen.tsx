import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../api/axiosConfig';
import { useTheme } from '../../context/ThemeContext';
import { showError, showWarning, showSuccess, showConfirm } from '../../components/feedback';
import { NativeQuestionList, NativeQuestionItem } from '../../native/NativeQuestionList';
import { 
  ArrowRight, 
  Plus, 
  CheckCircle, 
  BookOpen, 
  Trash2,
  Sparkles,
  HelpCircle
} from 'lucide-react-native';

const CreateExamStep2Screen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [currentExamId, setCurrentExamId] = useState<string>(route.params?.examId || '');
  const [currentExamTitle, setCurrentExamTitle] = useState<string>(route.params?.examTitle || '');

  // Keep examId & title updated if route params change
  useEffect(() => {
    if (route.params?.examId) {
      setCurrentExamId(route.params.examId);
    }
    if (route.params?.examTitle) {
      setCurrentExamTitle(route.params.examTitle);
    }
  }, [route.params?.examId, route.params?.examTitle]);

  // Selected questions list
  const [selectedQuestions, setSelectedQuestions] = useState<NativeQuestionItem[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch initial exam questions if already existing
  useEffect(() => {
    let isMounted = true;
    const fetchExamDetails = async () => {
      const activeId = currentExamId || route.params?.examId;
      if (!activeId) {
        setIsLoadingDetails(false);
        return;
      }
      try {
        const response = await api.get(`/teacher/exams/${activeId}`);
        if (response.data.success && isMounted) {
          const rawQuestions = response.data.data?.questions || [];
          const normalized: NativeQuestionItem[] = rawQuestions
            .map((q: any) => {
              if (typeof q === 'object' && q !== null) {
                const id = q._id || q.id;
                return { ...q, _id: id };
              }
              return null;
            })
            .filter(Boolean);
          setSelectedQuestions(normalized);
        }
      } catch (error) {
        // If draft has no questions yet, keep empty
      } finally {
        if (isMounted) setIsLoadingDetails(false);
      }
    };

    fetchExamDetails();
    return () => { isMounted = false; };
  }, [currentExamId, route.params?.examId]);

  // Handle questions returned from QuestionBankPickerScreen
  useEffect(() => {
    if (route.params?.addedQuestions) {
      const incoming: NativeQuestionItem[] = route.params.addedQuestions;
      setSelectedQuestions(incoming);
    }
  }, [route.params?.addedQuestions, route.params?.updateTimestamp]);

  // Navigate to Question Bank Picker screen
  const handleOpenQuestionBank = () => {
    navigation.navigate('QuestionBankPickerScreen', {
      examId: currentExamId || route.params?.examId,
      examTitle: currentExamTitle || route.params?.examTitle,
      initialSelectedQuestions: selectedQuestions,
    });
  };

  // Remove a question from the current selection
  const handleRemoveQuestion = (event: any) => {
    const { questionId } = event.nativeEvent;
    showConfirm({
      title: 'حذف سوال از آزمون',
      message: 'آیا می‌خواهید این سوال از این آزمون حذف شود؟',
      confirmText: 'حذف از آزمون',
      cancelText: 'انصراف',
      isDestructive: true,
      icon: 'delete',
      onConfirm: () => {
        setSelectedQuestions((prev) => prev.filter((q) => q._id !== questionId));
        showSuccess('سوال از آزمون حذف شد.');
      },
    });
  };

  // Finalize exam with the selected questions
  const handleFinalizeExam = async () => {
    if (selectedQuestions.length === 0) {
      showWarning('لطفاً حداقل یک سوال برای آزمون انتخاب کنید.');
      return;
    }

    const examIdToUse = currentExamId || route.params?.examId;
    if (!examIdToUse) {
      console.log('[ERROR] examId is missing in CreateExamStep2Screen');
      showError('شناسه آزمون یافت نشد. لطفاً مراحل را دوباره انجام دهید.');
      return;
    }

    setIsSubmitting(true);
    try {
      const questionIds = selectedQuestions.map((q) => q._id).filter(Boolean);
      console.log('[DEBUG] Finalizing exam:', { examId: examIdToUse, count: questionIds.length, questionIds });

      const response = await api.post(`/teacher/exams/${examIdToUse}/questions`, {
        questionIds,
      });

      console.log('[DEBUG] Finalize response:', response.data);

      if (response.data.success) {
        showSuccess('آزمون با موفقیت ساخته شد و سوالات ثبت گردید!');
        navigation.navigate('ExamListScreen');
      } else {
        showError(response.data.message || 'خطا در ثبت سوالات');
      }
    } catch (error: any) {
      console.log('[ERROR] Error finalizing exam:', error.response?.status, error.response?.data || error.message);
      const serverMessage = error.response?.data?.message || error.message || 'خطا در ثبت سوالات آزمون.';
      showError(serverMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedIds = selectedQuestions.map((q) => q._id);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[
        styles.header, 
        { 
          backgroundColor: colors.surface, 
          borderBottomColor: colors.border,
          paddingTop: Math.max(insets.top, 12) + 8
        }
      ]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowRight size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>سوالات آزمون</Text>
          {examTitle ? (
            <Text style={[styles.headerSubtitle, { color: colors.primary }]}>{examTitle}</Text>
          ) : null}
        </View>

        {/* Add Question Button in Header */}
        <TouchableOpacity 
          style={[styles.addQuestionHeaderBtn, { backgroundColor: colors.primary }]}
          onPress={handleOpenQuestionBank}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#ffffff" />
          <Text style={styles.addQuestionHeaderBtnText}>افزودن سوال</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Questions Status Bar */}
      <View style={[
        styles.infoBar, 
        { 
          backgroundColor: isDark ? '#1e293b' : '#eff6ff', 
          borderBottomColor: isDark ? '#334155' : '#bfdbfe' 
        }
      ]}>
        <View style={styles.infoLeft}>
          <CheckCircle size={17} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            تعداد سوالات انتخاب‌شده: <Text style={{ fontWeight: 'bold', color: colors.primary }}>{selectedQuestions.length}</Text>
          </Text>
        </View>

        {selectedQuestions.length > 0 && (
          <TouchableOpacity 
            style={[styles.moreQuestionsBtn, { borderColor: colors.primary }]}
            onPress={handleOpenQuestionBank}
            activeOpacity={0.8}
          >
            <Plus size={13} color={colors.primary} />
            <Text style={[styles.moreQuestionsBtnText, { color: colors.primary }]}>افزودن بیشتر</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Content Area */}
      {isLoadingDetails ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textLight }]}>در حال آماده‌سازی سوالات آزمون...</Text>
        </View>
      ) : selectedQuestions.length === 0 ? (
        /* Empty State: Dashed border clickable card */
        <View style={styles.emptyContainer}>
          <TouchableOpacity 
            style={[
              styles.dashedCard, 
              { 
                borderColor: isDark ? '#4f46e5' : '#6366f1',
                backgroundColor: isDark ? '#1e1b4b22' : '#eef2ff66'
              }
            ]}
            onPress={handleOpenQuestionBank}
            activeOpacity={0.75}
          >
            <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
              <Plus size={32} color="#ffffff" strokeWidth={2.5} />
            </View>

            <Text style={[styles.dashedTitle, { color: colors.text }]}>
              اولین سوالتو اضافه کن
            </Text>

            <Text style={[styles.dashedSubtitle, { color: colors.textLight }]}>
              برای انتخاب سوال از بانک جامع یا افزودن سوالات شخصی کلیک کنید
            </Text>

            <View style={[styles.dashedActionPill, { backgroundColor: colors.primary }]}>
              <Sparkles size={14} color="#ffffff" style={{ marginLeft: 6 }} />
              <Text style={styles.dashedActionText}>ورود به بانک سوالات</Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        /* Native Kotlin RecyclerView Question List */
        <View style={{ flex: 1 }}>
          <NativeQuestionList
            questions={selectedQuestions}
            selectedIds={selectedIds}
            isDarkMode={isDark}
            isBankMode={false}
            canDelete={true}
            onRemove={handleRemoveQuestion}
            style={styles.nativeList}
          />
        </View>
      )}

      {/* Sticky Bottom Action Bar */}
      <View style={[
        styles.footer, 
        { 
          backgroundColor: colors.surface, 
          borderTopColor: colors.border, 
          paddingBottom: Math.max(insets.bottom, 16) 
        }
      ]}>
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            { backgroundColor: colors.primary },
            (isSubmitting || selectedQuestions.length === 0) && { 
              backgroundColor: isDark ? '#334155' : '#94a3b8', 
              opacity: 0.8 
            }
          ]} 
          onPress={handleFinalizeExam}
          disabled={isSubmitting || selectedQuestions.length === 0}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <CheckCircle size={18} color="#ffffff" style={{ marginLeft: 6 }} />
              <Text style={styles.submitButtonText}>
                {selectedQuestions.length === 0 
                  ? 'لطفاً ابتدا سوال اضافه کنید' 
                  : `ثبت و نهایی‌سازی آزمون (${selectedQuestions.length} سوال)`}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  addQuestionHeaderBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addQuestionHeaderBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: 'bold',
    marginRight: 4,
  },
  infoBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    marginRight: 8,
  },
  moreQuestionsBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  moreQuestionsBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 3,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashedCard: {
    width: '100%',
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  dashedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  dashedSubtitle: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    maxWidth: 280,
  },
  dashedActionPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
  },
  dashedActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  nativeList: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  submitButton: {
    flexDirection: 'row-reverse',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default CreateExamStep2Screen;