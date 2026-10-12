import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity, 
  ActivityIndicator, 
  I18nManager 
} from 'react-native';
import { Plus, MessageSquareDashed } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import InteractionSearch from '../components/InteractionSearch';
import CategoryChips, { CategoryChipItem } from '../components/CategoryChips';
import NativeQuestionCard from '../../../components/native/NativeQuestionCard';
import { 
  communityService, 
  CommunityQuestionItem, 
  CommunityCategoryItem, 
  QuestionFilterParams 
} from '../../../services/community/communityService';

const SORT_OPTIONS: { id: 'latest' | 'most_answered'; label: string }[] = [
  { id: 'latest', label: 'جدیدترین‌ها' },
  { id: 'most_answered', label: 'پربحث‌ترین‌ها' },
];

const DEFAULT_POPULAR_CATEGORIES: CategoryChipItem[] = [
  { id: 'all', name: 'همه' },
  { id: 'administrative', name: 'اداری' },
  { id: 'news', name: 'اخبار' },
  { id: 'math', name: 'ریاضی' },
  { id: 'science', name: 'علوم تجربی' },
  { id: 'persian', name: 'فارسی و ادبیات' },
  { id: 'english', name: 'زبان انگلیسی' },
  { id: 'social-studies', name: 'مطالعات اجتماعی' },
  { id: 'quran', name: 'دینی و قرآن' },
  { id: 'arabic', name: 'عربی' },
  { id: 'physics-chemistry', name: 'فیزیک و شیمی' },
  { id: 'classroom-management', name: 'کلاس‌داری و مشاوره' },
];

const QuestionsTab = ({ navigation }: any) => {
  const { colors } = useTheme();
  
  const [categories, setCategories] = useState<CategoryChipItem[]>(DEFAULT_POPULAR_CATEGORIES);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<'latest' | 'most_answered'>('latest');
  const [search, setSearch] = useState('');
  
  const [questions, setQuestions] = useState<CommunityQuestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const searchTimerRef = useRef<any>(null);

  // Load categories from backend
  const loadCategories = async () => {
    try {
      const cats = await communityService.getCategories();
      if (cats && cats.length > 0) {
        const mapped: CategoryChipItem[] = [
          { id: 'all', name: 'همه' },
          ...cats.map((c: CommunityCategoryItem) => ({
            id: c._id,
            name: c.name,
            color: c.color,
          })),
        ];
        setCategories(mapped);
      }
    } catch (err) {
      // Keep DEFAULT_POPULAR_CATEGORIES
    }
  };

  // Fetch questions from backend
  const fetchQuestions = useCallback(async (
    targetPage: number = 1, 
    isRefresh: boolean = false
  ) => {
    try {
      if (targetPage === 1 && !isRefresh) {
        setIsLoading(true);
      }
      setErrorMsg(null);

      const params: QuestionFilterParams = {
        page: targetPage,
        limit: 15,
        sort: selectedSort,
      };

      if (selectedCategoryId !== 'all') {
        params.category = selectedCategoryId;
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      const res = await communityService.getQuestions(params);
      
      if (targetPage === 1) {
        setQuestions(res.questions);
      } else {
        setQuestions(prev => [...prev, ...res.questions]);
      }

      setPage(targetPage);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err: any) {
      setErrorMsg('خطا در دریافت لیست سوالات. لطفاً اینترنت خود را بررسی کنید.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [selectedCategoryId, selectedSort, search]);

  useEffect(() => {
    loadCategories();
  }, []);

  // Listen to focus to refresh list if user created a question
  useEffect(() => {
    const unsubscribe = navigation.addListener?.('focus', () => {
      fetchQuestions(1, true);
    });
    return unsubscribe;
  }, [navigation, fetchQuestions]);

  // Refetch when category or sort changes
  useEffect(() => {
    fetchQuestions(1);
  }, [selectedCategoryId, selectedSort]);

  // Debounced search
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchQuestions(1);
    }, 450);
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchQuestions(1, true);
  };

  const onEndReached = () => {
    if (!isLoading && !isLoadingMore && page < totalPages) {
      setIsLoadingMore(true);
      fetchQuestions(page + 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <InteractionSearch 
        value={search} 
        onChangeText={handleSearchChange} 
        placeholder="جستجو در پرسش‌ها و پاسخ‌ها..." 
      />
      
      {/* Category Chips */}
      <View style={styles.chipsWrapper}>
        <CategoryChips 
          categories={categories} 
          selectedCategoryId={selectedCategoryId} 
          onSelect={setSelectedCategoryId} 
        />
      </View>

      {/* Sort / Status Pills */}
      <View style={[styles.sortRow, { borderBottomColor: colors.border }]}>
        {SORT_OPTIONS.map((opt) => {
          const isSelected = selectedSort === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.sortPill,
                isSelected && { backgroundColor: colors.primary + '18', borderColor: colors.primary }
              ]}
              onPress={() => setSelectedSort(opt.id)}
            >
              <Text 
                style={[
                  styles.sortText, 
                  { color: isSelected ? colors.primary : colors.textLight, fontWeight: isSelected ? 'bold' : 'normal' }
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Loading Skeleton */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textLight }]}>در حال بارگذاری سوالات...</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
          <TouchableOpacity 
            style={[styles.retryBtn, { backgroundColor: colors.primary }]} 
            onPress={() => fetchQuestions(1)}
          >
            <Text style={styles.retryBtnText}>تلاش مجدد</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <NativeQuestionCard 
              question={item} 
              onPress={() => navigation.navigate('QuestionDetailScreen', { questionId: item._id })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MessageSquareDashed size={48} color={colors.textLight} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>سوالی یافت نشد</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textLight }]}>
                {search.trim() ? 'با این عبارت جستجو نتیجه‌ای پیدا نشد.' : 'اولین نفری باشید که در این دسته سوال می‌پرسد!'}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : undefined
          }
        />
      )}

      {/* Floating Create Question Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('NewQuestionScreen')}
        activeOpacity={0.85}
      >
        <Plus color="#fff" size={28} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chipsWrapper: {
    marginBottom: 4,
  },
  sortRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    gap: 8,
  },
  sortPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sortText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
  },
  listContent: {
    padding: 16,
    paddingBottom: 85,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: 'IRANSansX',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'IRANSansX',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#fff',
    fontFamily: 'IRANSansX',
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    marginTop: 14,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLoader: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  }
});

export default QuestionsTab;
