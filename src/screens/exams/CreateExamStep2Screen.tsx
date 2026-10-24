import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  FlatList,
  TextInput,
  Image,
  Platform
} from 'react-native';
import { showError, showWarning, showSuccess, showConfirm } from '../../components/feedback';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/axiosConfig';
import { useTheme } from '../../context/ThemeContext';
import { CustomDropdown } from '../../components/common/CustomDropdown';
import { 
  Check, 
  CheckCircle, 
  Search, 
  X, 
  Edit3, 
  Trash2, 
  Plus, 
  ArrowRight,
  BookOpen,
  HelpCircle
} from 'lucide-react-native';

// Helper to thoroughly clean and strip HTML tags & entities
const cleanHtml = (text?: string): string => {
  if (!text) return '';
  return text
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<[^>]+>/g, '') // remove all HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&zwnj;/g, '\u200C') // Persian zero-width non-joiner
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n/g, '\n')
    .trim();
};

// Check if an option is the marked correct answer
const checkIsOptionCorrect = (optText: string, optIndex: number, answerText?: string): boolean => {
  if (!answerText) return false;
  const cleanAns = cleanHtml(answerText).trim();
  const cleanOpt = cleanHtml(optText).trim();

  if (cleanAns.length > 0 && cleanOpt.length > 0 && cleanAns === cleanOpt) return true;
  if (cleanAns === (optIndex + 1).toString()) return true;
  if (cleanAns.includes(`گزینه ${optIndex + 1}`)) return true;

  const persianDigits = ['۱', '۲', '۳', '۴'];
  if (cleanAns === persianDigits[optIndex]) return true;
  if (cleanAns.includes(`گزینه ${persianDigits[optIndex]}`)) return true;

  const persianLetters = ['الف', 'ب', 'ج', 'د'];
  if (cleanAns === persianLetters[optIndex]) return true;
  if (cleanAns.includes(`گزینه ${persianLetters[optIndex]}`)) return true;

  return false;
};

const QUESTION_TYPES = [
  { id: 'all', label: 'همه نوع‌ها', value: 'all' },
  { id: 'تستی', label: 'تستی (۴ گزینه‌ای)', value: 'تستی' },
  { id: 'تشریحی', label: 'تشریحی', value: 'تشریحی' },
  { id: 'صحیح-غلط', label: 'صحیح / غلط', value: 'صحیح-غلط' },
  { id: 'جاخالی', label: 'جای خالی', value: 'جاخالی' },
];

const DIFFICULTY_LEVELS = [
  { id: 'all', label: 'همه سطوح', value: 'all' },
  { id: 'ساده', label: 'ساده', value: 'ساده' },
  { id: 'متوسط', label: 'متوسط', value: 'متوسط' },
  { id: 'دشوار', label: 'دشوار', value: 'دشوار' },
];

const CreateExamStep2Screen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { examId, examTitle } = route.params;

  // Question data
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  
  // Pagination & infinite scroll
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [origin, setOrigin] = useState<'mine' | 'admin'>('mine');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // Fetch questions from API
  const fetchQuestions = async (
    pageNumber = 1, 
    currentOrigin = origin,
    qType = selectedType,
    qDiff = selectedDifficulty,
    qSearch = appliedSearch
  ) => {
    if (pageNumber === 1) {
      setIsLoading(true);
    } else {
      setIsFetchingMore(true);
    }

    try {
      let url = `/teacher/questions?page=${pageNumber}&limit=10&origin=${currentOrigin}`;
      if (qType && qType !== 'all') url += `&type=${encodeURIComponent(qType)}`;
      if (qDiff && qDiff !== 'all') url += `&difficulty=${encodeURIComponent(qDiff)}`;
      if (qSearch && qSearch.trim()) url += `&search=${encodeURIComponent(qSearch.trim())}`;

      const response = await api.get(url);
      
      if (response.data.success) {
        const newQuestions = response.data.data;
        const paginationInfo = response.data.pagination;

        if (pageNumber === 1) {
          setQuestions(newQuestions);
        } else {
          setQuestions((prev) => [...prev, ...newQuestions]);
        }

        setHasMore(paginationInfo?.hasNextPage ?? false);
        setPage(pageNumber);
      }
    } catch (error) {
      showError('مشکلی در دریافت بانک سوالات به وجود آمد.');
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchQuestions(1, origin, selectedType, selectedDifficulty, appliedSearch);
    }, [origin, selectedType, selectedDifficulty, appliedSearch])
  );

  const loadMoreData = () => {
    if (hasMore && !isFetchingMore && !isLoading) {
      fetchQuestions(page + 1, origin, selectedType, selectedDifficulty, appliedSearch);
    }
  };

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions((prev) => {
      if (prev.includes(questionId)) return prev.filter((id) => id !== questionId);
      return [...prev, questionId];
    });
  };

  const handleSearchSubmit = () => {
    setAppliedSearch(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setAppliedSearch('');
  };

  const handleDeleteQuestion = (questionId: string) => {
    showConfirm({
      title: 'حذف سوال',
      message: 'آیا مطمئن هستید که می‌خواهید این سوال را برای همیشه حذف کنید؟',
      confirmText: 'حذف سوال',
      cancelText: 'انصراف',
      isDestructive: true,
      icon: 'delete',
      onConfirm: async () => {
        try {
          const res = await api.delete(`/teacher/questions/${questionId}`);
          if (res.data.success) {
            setQuestions(prev => prev.filter(q => q._id !== questionId));
            setSelectedQuestions(prev => prev.filter(id => id !== questionId));
            showSuccess('سوال با موفقیت حذف شد.');
          }
        } catch (error) {
          showError('مشکلی در حذف سوال رخ داد');
        }
      },
    });
  };

  const handleFinalizeExam = async () => {
    if (selectedQuestions.length === 0) {
      showWarning('لطفاً حداقل یک سوال انتخاب کنید.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.post(`/teacher/exams/${examId}/questions`, {
        questionIds: selectedQuestions,
      });
      if (response.data.success) {
        showSuccess('آزمون با موفقیت ساخته شد!');
        navigation.navigate('ExamListScreen');
      }
    } catch (error: any) {
      showError('خطا در ثبت سوالات');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render a single question card
  const renderQuestionItem = ({ item }: { item: any }) => {
    const isSelected = selectedQuestions.includes(item._id);
    const cleanedQuestionText = cleanHtml(item.question);
    const cleanedMainQuestion = cleanHtml(item.mainQuestion);
    const cleanedAnswer = cleanHtml(item.answer);
    
    // Only consider options that are non-empty after cleaning
    const rawOptions = Array.isArray(item.options) ? item.options : [];
    const validOptions = rawOptions
      .map((opt: string) => cleanHtml(opt).trim())
      .filter((opt: string) => opt.length > 0);
    const hasOptions = validOptions.length > 0;

    // Check if any option is highlighted as the correct answer
    let anyOptionHighlighted = false;
    if (hasOptions && cleanedAnswer.length > 0) {
      anyOptionHighlighted = validOptions.some((optText: string, idx: number) => 
        checkIsOptionCorrect(optText, idx, item.answer)
      );
    }

    // Determine whether to display the answer box:
    // For non-test questions, always show answer if available.
    // For test questions: if an option is already highlighted and answer is just short (e.g. "2" or "گزینه ۲"),
    // omit the redundant answer box to avoid empty space. Show only if explanatory (> 25 chars) or no option matched.
    const showAnswerBox = cleanedAnswer.length > 0 && (
      item.type !== 'تستی' || 
      !anyOptionHighlighted || 
      cleanedAnswer.length > 25
    );

    // Difficulty badge color
    const getDifficultyColor = (diff: string) => {
      switch (diff) {
        case 'ساده': return { bg: isDark ? '#064e3b33' : '#dcfce7', text: '#15803d' };
        case 'دشوار': return { bg: isDark ? '#7f1d1d33' : '#fee2e2', text: '#b91c1c' };
        default: return { bg: isDark ? '#78350f33' : '#fef3c7', text: '#b45309' }; // متوسط
      }
    };
    const diffColor = getDifficultyColor(item.difficulty || 'متوسط');
    const persianOptionLabels = ['۱', '۲', '۳', '۴', '۵', '۶'];

    return (
      <TouchableOpacity 
        style={[
          styles.questionCard,
          { 
            backgroundColor: colors.surface, 
            borderColor: isSelected ? colors.primary : colors.border,
            borderWidth: isSelected ? 2 : 1
          },
          isSelected && { backgroundColor: isDark ? '#1e293b' : '#f0fdf4' }
        ]}
        activeOpacity={0.8}
        onPress={() => toggleQuestionSelection(item._id)}
      >
        {/* Card Header: Badges & Checkbox */}
        <View style={styles.cardHeader}>
          {/* Checkbox */}
          <View style={[
            styles.checkbox,
            { borderColor: isSelected ? colors.primary : colors.border },
            isSelected && { backgroundColor: colors.primary }
          ]}>
            {isSelected && <Check size={14} color="#ffffff" strokeWidth={3} />}
          </View>

          {/* Badges & Actions */}
          <View style={styles.badgesRow}>
            {item.difficulty && (
              <View style={[styles.badgePill, { backgroundColor: diffColor.bg }]}>
                <Text style={[styles.badgePillText, { color: diffColor.text }]}>
                  {item.difficulty}
                </Text>
              </View>
            )}

            <View style={[styles.badgePill, { backgroundColor: isDark ? '#1e293b' : '#eff6ff' }]}>
              <Text style={[styles.badgePillText, { color: colors.primary }]}>
                {item.type === 'تستی' ? '☑️ تستی' : item.type === 'صحیح-غلط' ? '❓ صحیح / غلط' : '📝 تشریحی'}
              </Text>
            </View>

            {origin === 'mine' && (
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: isDark ? '#78350f33' : '#fef3c7' }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    navigation.navigate('CreateCustomQuestionScreen', { 
                      examId, 
                      editQuestion: item 
                    });
                  }}
                >
                  <Edit3 size={12} color="#d97706" />
                  <Text style={{ color: '#d97706', fontSize: 11, fontWeight: 'bold', marginRight: 3 }}>ویرایش</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: isDark ? '#7f1d1d33' : '#fee2e2' }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteQuestion(item._id);
                  }}
                >
                  <Trash2 size={12} color="#dc2626" />
                  <Text style={{ color: '#dc2626', fontSize: 11, fontWeight: 'bold', marginRight: 3 }}>حذف</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Context / Main Question (Passage) if exists */}
        {cleanedMainQuestion.length > 0 && (
          <View style={[styles.mainQuestionBox, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}>
            <View style={styles.mainQuestionHeader}>
              <BookOpen size={13} color={colors.primary} />
              <Text style={[styles.mainQuestionLabel, { color: colors.primary }]}>زمینه و متن سوال:</Text>
            </View>
            <Text style={[styles.mainQuestionText, { color: colors.textLight }]}>
              {cleanedMainQuestion}
            </Text>
          </View>
        )}

        {/* Question Text (Only if body exists) */}
        {cleanedQuestionText.length > 0 && (
          <Text style={[
            styles.questionText, 
            { color: colors.text },
            (hasOptions || showAnswerBox || item.source_image) ? { marginBottom: 10 } : { marginBottom: 0 }
          ]}>
            {cleanedQuestionText}
          </Text>
        )}

        {/* Question Image if present */}
        {item.source_image && item.source_image.trim().length > 0 ? (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: item.source_image }} 
              style={styles.questionImage} 
              resizeMode="contain" 
            />
          </View>
        ) : null}

        {/* Options for Multiple-Choice Questions (Only if valid options exist) */}
        {hasOptions && (
          <View style={[styles.optionsContainer, showAnswerBox && { marginBottom: 10 }]}>
            {validOptions.map((cleanedOpt: string, optIndex: number) => {
              const isCorrect = checkIsOptionCorrect(cleanedOpt, optIndex, item.answer);

              return (
                <View 
                  key={optIndex} 
                  style={[
                    styles.optionRow,
                    { 
                      backgroundColor: isCorrect 
                        ? (isDark ? '#064e3b33' : '#f0fdf4') 
                        : (isDark ? '#1e293b' : '#f8fafc'),
                      borderColor: isCorrect 
                        ? '#16a34a' 
                        : colors.border,
                      borderWidth: isCorrect ? 1.5 : 1
                    }
                  ]}
                >
                  <View style={styles.optionContent}>
                    <View style={[
                      styles.optionBadge,
                      { 
                        backgroundColor: isCorrect 
                          ? '#16a34a' 
                          : (isDark ? '#334155' : '#e2e8f0') 
                      }
                    ]}>
                      <Text style={[
                        styles.optionBadgeText,
                        { color: isCorrect ? '#ffffff' : colors.text }
                      ]}>
                        {persianOptionLabels[optIndex] || (optIndex + 1)}
                      </Text>
                    </View>

                    <Text style={[
                      styles.optionText,
                      { color: isCorrect ? (isDark ? '#86efac' : '#15803d') : colors.text }
                    ]}>
                      {cleanedOpt}
                    </Text>
                  </View>

                  {isCorrect && (
                    <View style={styles.correctIndicator}>
                      <CheckCircle size={13} color="#16a34a" />
                      <Text style={styles.correctIndicatorText}>پاسخ صحیح</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Answer Box (Only shown if necessary, preventing redundant space) */}
        {showAnswerBox && (
          <View style={[
            styles.answerBox, 
            { 
              backgroundColor: isDark ? '#064e3b22' : '#f0fdf4',
              borderColor: isDark ? '#166534' : '#bbf7d0'
            }
          ]}>
            <View style={styles.answerHeaderRow}>
              <CheckCircle size={14} color="#16a34a" />
              <Text style={styles.answerHeaderTitle}>پاسخ سوال / کلید آزمون:</Text>
            </View>
            <Text style={[styles.answerText, { color: isDark ? '#86efac' : '#166534' }]}>
              {cleanedAnswer}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isFetchingMore) return <View style={{ height: 20 }} />;
    return (
      <View style={{ paddingVertical: 16 }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header - Safe top padding prevents status bar overlap */}
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>انتخاب سوالات آزمون</Text>
          <Text style={[styles.headerSubtitle, { color: colors.primary }]}>{examTitle}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Origin Tabs: My Questions vs Question Bank */}
      <View style={[styles.tabsRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[
            styles.tabBtn, 
            origin === 'mine' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setOrigin('mine')}
        >
          <Text style={[
            styles.tabText, 
            { color: origin === 'mine' ? '#ffffff' : colors.textLight }
          ]}>
            سوالات من
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tabBtn, 
            origin === 'admin' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setOrigin('admin')}
        >
          <Text style={[
            styles.tabText, 
            { color: origin === 'admin' ? '#ffffff' : colors.textLight }
          ]}>
            بانک جامع سوالات
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar & Side-by-Side Filter Dropdowns */}
      <View style={[styles.filterSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {/* Search Input */}
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: colors.border }]}>
          <Search size={18} color={colors.textLight} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="جستجو در متن سوالات..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            textAlign="right"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearBtn}>
              <X size={16} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {/* Dropdowns Row: Question Type & Difficulty Side by Side */}
        <View style={styles.dropdownsRow}>
          <View style={{ flex: 1 }}>
            <CustomDropdown
              items={QUESTION_TYPES}
              selectedValue={selectedType}
              onSelect={(item) => setSelectedType(item.value)}
              placeholder="نوع سوال"
            />
          </View>
          <View style={{ width: 10 }} />
          <View style={{ flex: 1 }}>
            <CustomDropdown
              items={DIFFICULTY_LEVELS}
              selectedValue={selectedDifficulty}
              onSelect={(item) => setSelectedDifficulty(item.value)}
              placeholder="سطح دشواری"
            />
          </View>
        </View>
      </View>

      {/* Selected Questions Counter & New Question Button */}
      <View style={[styles.selectionInfoRow, { backgroundColor: isDark ? '#1e293b' : '#eff6ff', borderBottomColor: isDark ? '#334155' : '#bfdbfe' }]}>
        <View style={styles.selectionCounter}>
          <CheckCircle size={16} color={colors.primary} />
          <Text style={[styles.selectionInfoText, { color: colors.text }]}>
            تعداد انتخاب‌شده: <Text style={{ fontWeight: 'bold', color: colors.primary }}>{selectedQuestions.length}</Text>
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.addCustomBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('CreateCustomQuestionScreen', { examId })}
        >
          <Plus size={15} color="#ffffff" />
          <Text style={styles.addCustomBtnText}>سوال جدید</Text>
        </TouchableOpacity>
      </View>

      {/* Main List */}
      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textLight }]}>در حال بارگذاری سوالات...</Text>
        </View>
      ) : questions.length === 0 ? (
        <View style={styles.centerBox}>
          <HelpCircle size={44} color={colors.textLight} />
          <Text style={[styles.emptyText, { color: colors.textLight }]}>سوالی با این مشخصات یافت نشد.</Text>
          <TouchableOpacity 
            style={[styles.clearFilterBtn, { borderColor: colors.primary }]}
            onPress={() => {
              setSelectedType('all');
              setSelectedDifficulty('all');
              handleClearSearch();
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: 'bold' }}>پاک کردن فیلترها</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderQuestionItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshing={isLoading}
          onRefresh={() => fetchQuestions(1)}
        />
      )}

      {/* Bottom Sticky Action Bar - Safe bottom padding prevents navigation bar overlap */}
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
            styles.button, 
            { backgroundColor: colors.primary },
            (isSubmitting || selectedQuestions.length === 0) && { backgroundColor: isDark ? '#334155' : '#94a3b8', opacity: 0.8 }
          ]} 
          onPress={handleFinalizeExam}
          disabled={isSubmitting || selectedQuestions.length === 0}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <View style={styles.buttonContent}>
              <Check size={18} color="#ffffff" strokeWidth={3} />
              <Text style={styles.buttonText}>
                افزودن و نهایی‌سازی آزمون ({selectedQuestions.length} سوال)
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    elevation: 2,
    zIndex: 10,
  },
  headerCenter: { 
    alignItems: 'center' 
  },
  headerTitle: { 
    fontSize: 17, 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  headerSubtitle: { 
    fontSize: 13, 
    marginTop: 2, 
    fontWeight: '600', 
    textAlign: 'center' 
  },
  backButton: { 
    padding: 8 
  },

  tabsRow: {
    flexDirection: 'row-reverse',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    justifyContent: 'center',
    gap: 12
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f1f5f9'
  },
  tabText: {
    fontWeight: 'bold',
    fontSize: 14
  },

  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginRight: 8,
    paddingVertical: 0,
    textAlign: 'right',
  },
  clearBtn: {
    padding: 4,
  },
  dropdownsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },

  selectionInfoRow: { 
    flexDirection: 'row-reverse', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    alignItems: 'center', 
    borderBottomWidth: 1 
  },
  selectionCounter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  selectionInfoText: { 
    fontSize: 13, 
    textAlign: 'right' 
  },
  addCustomBtn: { 
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12, 
    paddingVertical: 7, 
    borderRadius: 10,
    gap: 4
  },
  addCustomBtnText: { 
    color: '#ffffff', 
    fontSize: 12, 
    fontWeight: 'bold' 
  },

  centerBox: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20 
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyText: { 
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center'
  },
  clearFilterBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },

  listContainer: { 
    padding: 16 
  },

  questionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeader: { 
    flexDirection: 'row-reverse', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  badgesRow: { 
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6 
  },
  badgePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  actionButtonsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  checkbox: { 
    width: 26, 
    height: 26, 
    borderRadius: 8, 
    borderWidth: 2, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'transparent' 
  },

  mainQuestionBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  mainQuestionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  mainQuestionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  mainQuestionText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },

  questionText: { 
    fontSize: 15, 
    fontWeight: '700',
    textAlign: 'right', 
    lineHeight: 25,
  },

  imageContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  questionImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
  },

  optionsContainer: {
    gap: 7,
  },
  optionRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  optionContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  optionBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  optionText: {
    fontSize: 14,
    textAlign: 'right',
    flex: 1,
    lineHeight: 22,
    fontWeight: '500',
  },
  correctIndicator: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#dcfce7',
  },
  correctIndicatorText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#15803d',
  },

  answerBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  answerHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  answerHeaderTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#15803d',
    textAlign: 'right',
  },
  answerText: {
    fontSize: 13,
    textAlign: 'right',
    lineHeight: 21,
    fontWeight: '600',
  },

  footer: { 
    paddingHorizontal: 16, 
    paddingTop: 12,
    borderTopWidth: 1, 
    elevation: 4 
  },
  button: { 
    paddingVertical: 14, 
    borderRadius: 14, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: { 
    color: '#ffffff', 
    fontSize: 15, 
    fontWeight: 'bold' 
  },
});

export default CreateExamStep2Screen;