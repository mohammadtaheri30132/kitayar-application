import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  TextInput,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/axiosConfig';
import { useTheme } from '../../context/ThemeContext';
import { showError, showSuccess } from '../../components/feedback';
import { CustomDropdown } from '../../components/common/CustomDropdown';
import { NativeQuestionList, NativeQuestionItem } from '../../native/NativeQuestionList';
import { 
  ArrowRight, 
  Search, 
  X, 
  Plus, 
  CheckCircle2, 
  HelpCircle,
  Sparkles,
  Layers
} from 'lucide-react-native';

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

export const QuestionBankPickerScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { examId, examTitle, initialSelectedQuestions = [] } = route.params || {};

  // Tabs: 'admin' (Comprehensive Bank - Default on Left) or 'mine' (Personal Questions - Right)
  const [origin, setOrigin] = useState<'mine' | 'admin'>('admin');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  // Data & Pagination
  const [questions, setQuestions] = useState<NativeQuestionItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Selected questions map: questionId -> Question Object
  const [selectedMap, setSelectedMap] = useState<Map<string, NativeQuestionItem>>(() => {
    const map = new Map<string, NativeQuestionItem>();
    if (Array.isArray(initialSelectedQuestions)) {
      initialSelectedQuestions.forEach((q: any) => {
        const id = q._id || q.id;
        if (id) {
          map.set(id, { ...q, _id: id });
        }
      });
    }
    return map;
  });

  // Selected IDs array derived for native RecyclerView adapter
  const selectedIds = Array.from(selectedMap.keys());

  // Keep a questions dictionary to easily lookup objects by ID when toggling
  const questionsDict = useRef<Map<string, NativeQuestionItem>>(new Map());

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
      let url = `/teacher/questions?page=${pageNumber}&limit=12&origin=${currentOrigin}`;
      if (qType && qType !== 'all') url += `&type=${encodeURIComponent(qType)}`;
      if (qDiff && qDiff !== 'all') url += `&difficulty=${encodeURIComponent(qDiff)}`;
      if (qSearch && qSearch.trim()) url += `&search=${encodeURIComponent(qSearch.trim())}`;

      const response = await api.get(url);

      if (response.data.success) {
        const newQuestions: NativeQuestionItem[] = response.data.data || [];
        const paginationInfo = response.data.pagination;

        // Populate questions dictionary for fast lookup
        newQuestions.forEach(q => {
          const id = q._id || q.id;
          if (id) {
            questionsDict.current.set(id, { ...q, _id: id, origin: currentOrigin });
          }
        });

        if (pageNumber === 1) {
          setQuestions(newQuestions);
        } else {
          setQuestions((prev) => [...prev, ...newQuestions]);
        }

        setHasMore(paginationInfo?.hasNextPage ?? false);
        setPage(pageNumber);
      }
    } catch (error) {
      showError('مشکلی در دریافت بانک سوالات رخ داد.');
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

  const handleLoadMore = () => {
    if (hasMore && !isFetchingMore && !isLoading) {
      fetchQuestions(page + 1, origin, selectedType, selectedDifficulty, appliedSearch);
    }
  };

  const handleToggleSelect = (event: any) => {
    const { questionId, isSelected } = event.nativeEvent;
    setSelectedMap((prev) => {
      const next = new Map(prev);
      if (isSelected) {
        const fullQ = questionsDict.current.get(questionId) || 
                      questions.find(q => q._id === questionId) || 
                      { _id: questionId, question: '' } as NativeQuestionItem;
        next.set(questionId, fullQ);
      } else {
        next.delete(questionId);
      }
      return next;
    });
  };

  const handleEditQuestion = (event: any) => {
    const { questionId } = event.nativeEvent;
    const questionToEdit = questionsDict.current.get(questionId) || questions.find(q => q._id === questionId);
    if (questionToEdit) {
      navigation.navigate('CreateCustomQuestionScreen', {
        examId,
        editQuestion: questionToEdit,
      });
    }
  };

  const handleSearchSubmit = () => {
    setAppliedSearch(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setAppliedSearch('');
  };

  const handleDone = () => {
    const selectedList = Array.from(selectedMap.values());
    navigation.navigate('CreateExamStep2Screen', {
      examId,
      examTitle,
      addedQuestions: selectedList,
      updateTimestamp: Date.now(),
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>بانک جامع و سوالات من</Text>
          {examTitle ? (
            <Text style={[styles.headerSubtitle, { color: colors.primary }]}>{examTitle}</Text>
          ) : null}
        </View>

        {/* Create New Custom Question Shortcut in Header */}
        <TouchableOpacity 
          style={[styles.headerActionBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('CreateCustomQuestionScreen', { examId })}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#ffffff" />
          <Text style={styles.headerActionText}>سوال جدید</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs Row: Comprehensive Bank on the LEFT and My Questions on the RIGHT */}
      <View style={[styles.tabsRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[
            styles.tabBtn, 
            origin === 'admin' && [styles.tabBtnActive, { backgroundColor: colors.primary }]
          ]}
          onPress={() => setOrigin('admin')}
          activeOpacity={0.8}
        >
          <Layers size={16} color={origin === 'admin' ? '#ffffff' : colors.textLight} style={{ marginLeft: 6 }} />
          <Text style={[
            styles.tabText, 
            { color: origin === 'admin' ? '#ffffff' : colors.textLight }
          ]}>
            بانک جامع سوالات
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.tabBtn, 
            origin === 'mine' && [styles.tabBtnActive, { backgroundColor: colors.primary }]
          ]}
          onPress={() => setOrigin('mine')}
          activeOpacity={0.8}
        >
          <Sparkles size={16} color={origin === 'mine' ? '#ffffff' : colors.textLight} style={{ marginLeft: 6 }} />
          <Text style={[
            styles.tabText, 
            { color: origin === 'mine' ? '#ffffff' : colors.textLight }
          ]}>
            سوالات شخصی شما
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar & Dropdown Filters */}
      <View style={[styles.filterSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {/* Search Input */}
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: colors.border }]}>
          <Search size={18} color={colors.textLight} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="جستجو در متن سوال..."
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

        {/* Dropdowns: Type & Difficulty */}
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

      {/* Selection Status Banner */}
      <View style={[styles.selectionBar, { backgroundColor: isDark ? '#1e293b' : '#eff6ff', borderBottomColor: isDark ? '#334155' : '#bfdbfe' }]}>
        <View style={styles.selectionCounter}>
          <CheckCircle2 size={16} color={colors.primary} />
          <Text style={[styles.selectionBarText, { color: colors.text }]}>
            تعداد انتخاب‌شده: <Text style={{ fontWeight: 'bold', color: colors.primary }}>{selectedMap.size}</Text> سوال
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.createQuestionPill, { borderColor: colors.primary }]}
          onPress={() => navigation.navigate('CreateCustomQuestionScreen', { examId })}
        >
          <Plus size={14} color={colors.primary} />
          <Text style={[styles.createQuestionPillText, { color: colors.primary }]}>ساخت سوال جدید</Text>
        </TouchableOpacity>
      </View>

      {/* Content Area: Native Kotlin RecyclerView */}
      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textLight }]}>در حال بارگذاری سوالات...</Text>
        </View>
      ) : questions.length === 0 ? (
        <View style={styles.centerBox}>
          <HelpCircle size={48} color={colors.textLight} />
          <Text style={[styles.emptyText, { color: colors.text }]}>سوالی با این مشخصات یافت نشد.</Text>
          <Text style={[styles.emptySubText, { color: colors.textLight }]}>
            {origin === 'mine' 
              ? 'هنوز سوال شخصی نساخته‌اید یا فیلترها نتیجه‌ای نداشتند.' 
              : 'می‌توانید فیلترها را ریست کنید یا سوال جدید بسازید.'}
          </Text>

          <View style={{ flexDirection: 'row-reverse', marginTop: 16 }}>
            <TouchableOpacity 
              style={[styles.actionBtnOutline, { borderColor: colors.primary, marginLeft: 10 }]}
              onPress={() => {
                setSelectedType('all');
                setSelectedDifficulty('all');
                handleClearSearch();
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: 'bold' }}>پاک کردن فیلترها</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtnFilled, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('CreateCustomQuestionScreen', { examId })}
            >
              <Plus size={14} color="#ffffff" style={{ marginLeft: 4 }} />
              <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: 'bold' }}>ساخت سوال شخصی</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <NativeQuestionList
            questions={questions}
            selectedIds={selectedIds}
            isDarkMode={isDark}
            isBankMode={true}
            canDelete={origin === 'mine'}
            onToggleSelect={handleToggleSelect}
            onLoadMore={handleLoadMore}
            onEdit={handleEditQuestion}
            style={styles.nativeList}
          />

          {isFetchingMore && (
            <View style={styles.moreLoadingOverlay}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
        </View>
      )}

      {/* Bottom Sticky Action Bar: Confirm and return */}
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
            { backgroundColor: colors.primary }
          ]} 
          onPress={handleDone}
          activeOpacity={0.8}
        >
          <CheckCircle2 size={18} color="#ffffff" style={{ marginLeft: 6 }} />
          <Text style={styles.submitButtonText}>
            افزودن به آزمون ({selectedMap.size} سوال انتخاب شد)
          </Text>
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
  headerActionBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  headerActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 4,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  tabBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginRight: 8,
    fontSize: 13,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  dropdownsRow: {
    flexDirection: 'row-reverse',
  },
  selectionBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  selectionCounter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  selectionBarText: {
    fontSize: 13,
    marginRight: 8,
  },
  createQuestionPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  createQuestionPillText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 4,
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
  emptyText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionBtnOutline: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  actionBtnFilled: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  nativeList: {
    flex: 1,
  },
  moreLoadingOverlay: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 8,
    elevation: 3,
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

export default QuestionBankPickerScreen;
