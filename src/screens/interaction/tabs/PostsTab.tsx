import React, { useState, useEffect, useCallback, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  I18nManager 
} from 'react-native';
import { Plus, Newspaper, MessageSquareDashed } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { getUserIdFromToken } from '../../../utils/storage';
import PostCard from '../components/PostCard';
import { communityService, CommunityPostItem } from '../../../services/community/communityService';

const PostsTab = ({ navigation }: any) => {
  const { colors } = useTheme();

  const [posts, setPosts] = useState<CommunityPostItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    getUserIdFromToken().then(id => setCurrentUserId(id));
  }, []);

  const fetchPosts = useCallback(async (targetPage: number = 1, isRefresh: boolean = false) => {
    try {
      if (targetPage === 1 && !isRefresh) {
        setIsLoading(true);
      }
      setErrorMsg(null);

      const res = await communityService.getPosts({ page: targetPage, limit: 10 });
      
      if (targetPage === 1) {
        setPosts(res.posts);
      } else {
        setPosts(prev => [...prev, ...res.posts]);
      }

      setPage(targetPage);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err: any) {
      setErrorMsg('خطا در دریافت تجربیات و پست‌های معلمان.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  // Refresh on screen focus
  useEffect(() => {
    const unsubscribe = navigation.addListener?.('focus', () => {
      fetchPosts(1, true);
    });
    return unsubscribe;
  }, [navigation, fetchPosts]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchPosts(1, true);
  };

  const onEndReached = () => {
    if (!isLoading && !isLoadingMore && page < totalPages) {
      setIsLoadingMore(true);
      fetchPosts(page + 1);
    }
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      'حذف پست',
      'آیا از حذف این پست اطمینان دارید؟',
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await communityService.deletePost(postId);
              setPosts(prev => prev.filter(p => p._id !== postId));
            } catch (err) {
              Alert.alert('خطا', 'امکان حذف پست وجود ندارد.');
            }
          },
        },
      ]
    );
  };

  const handleReportPost = (postId: string) => {
    Alert.alert(
      'گزارش محتوا',
      'آیا مایل به گزارش این پست به تیم مدیریت هستید؟',
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'ارسال گزارش',
          onPress: async () => {
            try {
              await communityService.reportContent({
                targetType: 'post',
                targetId: postId,
                reason: 'inappropriate',
                description: 'گزارش تخلف توسط کاربر',
              });
              Alert.alert('سپاس', 'گزارش شما ثبت شد و به زودی بررسی خواهد شد.');
            } catch {
              Alert.alert('خطا', 'ثبت گزارش ناموفق بود.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textLight }]}>در حال بارگذاری تجربیات معلمان...</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
          <TouchableOpacity 
            style={[styles.retryBtn, { backgroundColor: colors.primary }]} 
            onPress={() => fetchPosts(1)}
          >
            <Text style={styles.retryBtnText}>تلاش مجدد</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <PostCard 
              post={item} 
              currentUserId={currentUserId || undefined}
              onPress={() => navigation.navigate('PostDetailScreen', { postId: item._id })}
              onDeletePress={() => handleDeletePost(item._id)}
              onReportPress={() => handleReportPost(item._id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MessageSquareDashed size={48} color={colors.textLight} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>پستی یافت نشد</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textLight }]}>
                تجربیات، روش‌های تدریس خلاقانه یا دستاوردهای کلاسی خود را با سایر همکاران به اشتراک بگذارید!
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

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('NewPostScreen')}
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

export default PostsTab;
