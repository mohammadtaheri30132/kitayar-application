import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
import { Plus, HelpCircle, AlertCircle, Clock, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import QuestionCard from '../components/QuestionCard';
import NativeQuestionCard from '../../../components/native/NativeQuestionCard';
import {
  communityService,
  CommunityQuestionItem,
} from '../../../services/community/communityService';
import { toPersianDigits } from '../../../utils/communityHelpers';

interface Props {
  navigation: any;
}

const MyQuestionsTab = ({ navigation }: Props) => {
  const { colors } = useTheme();

  const [questions, setQuestions] = useState<CommunityQuestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchMyQuestions = useCallback(async (targetPage = 1, isRefresh = false) => {
    try {
      if (targetPage === 1 && !isRefresh) {
        setIsLoading(true);
      }
      setErrorMsg(null);

      const res = await communityService.getMyQuestions({ page: targetPage, limit: 15 });
      if (targetPage === 1) {
        setQuestions(res.questions);
      } else {
        setQuestions((prev) => [...prev, ...res.questions]);
      }

      setPage(targetPage);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err: any) {
      setErrorMsg('خطا در دریافت پرسش‌های شما. لطفاً اتصال اینترنت را بررسی کنید.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyQuestions(1);
  }, [fetchMyQuestions]);

  // Refresh on screen focus
  useEffect(() => {
    const unsubscribe = navigation.addListener?.('focus', () => {
      fetchMyQuestions(1, true);
    });
    return unsubscribe;
  }, [navigation, fetchMyQuestions]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMyQuestions(1, true);
  };

  const handlePressQuestion = (q: CommunityQuestionItem) => {
    navigation.navigate('QuestionDetailScreen', { questionId: q._id });
  };

  const renderHeader = () => {
    if (questions.length === 0) return null;
    return (
      <View style={[styles.headerBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.headerBannerRow}>
          <HelpCircle size={20} color={colors.primary} />
          <Text style={[styles.headerBannerTitle, { color: colors.text }]}>
            مجموع پرسش‌های ثبت شده توسط شما
          </Text>
        </View>
        <Text style={[styles.headerBannerCount, { color: colors.primary }]}>
          {toPersianDigits(questions.length)} سوال
        </Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconCircle, { backgroundColor: colors.surface }]}>
          <HelpCircle size={48} color={colors.textLight} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          هنوز پرسشی ثبت نکرده‌اید!
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textLight }]}>
          سوالات و ابهامات آموزشی، اداری و درسی خود را با جامعه معلمان در میان بگذارید.
        </Text>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('NewQuestionScreen')}
          activeOpacity={0.8}
        >
          <Plus size={18} color="#fff" />
          <Text style={styles.createBtnText}>ثبت اولین پرسش</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textLight }]}>
            در حال بارگذاری پرسش‌های شما...
          </Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={40} color="#ef4444" />
          <Text style={[styles.errorText, { color: colors.text }]}>{errorMsg}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => fetchMyQuestions(1)}
          >
            <Text style={styles.retryBtnText}>تلاش مجدد</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <NativeQuestionCard
              question={item}
              onPress={() => handlePressQuestion(item)}
              isDarkMode={false}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('NewQuestionScreen')}
        activeOpacity={0.85}
      >
        <Plus color="#ffffff" size={26} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  headerBanner: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  headerBannerRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  headerBannerTitle: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
    fontWeight: 'bold',
  },
  headerBannerCount: {
    fontFamily: 'IRANSansX',
    fontSize: 15,
    fontWeight: '900',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontFamily: 'IRANSansX',
    fontSize: 14,
  },
  errorText: {
    marginTop: 12,
    fontFamily: 'IRANSansX',
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#ffffff',
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'IRANSansX',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  createBtn: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  createBtnText: {
    color: '#ffffff',
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: I18nManager.isRTL ? 24 : undefined,
    right: I18nManager.isRTL ? undefined : 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
});

export default MyQuestionsTab;
