import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/axiosConfig';
import { ChevronRight, Star, User, MessageSquare } from 'lucide-react-native';

export const TeacherReviewsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewsData, setReviewsData] = useState<any>(null);

  const fetchReviews = async () => {
    try {
      const response = await api.get('/teacher/center/reviews');
      if (response.data?.success) {
        setReviewsData(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching teacher reviews:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReviews();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  const reviews = reviewsData?.reviews || [];
  const avgRating = reviewsData?.averageRating || 5.0;
  const count = reviewsData?.ratingsCount || reviews.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronRight size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>نظرات و امتیازات دانش‌آموزان</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
          }
        >
          {/* Average Rating Hero Card */}
          <View style={[styles.ratingHeroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.ratingNumberWrap}>
              <Text style={[styles.ratingBigNumber, { color: colors.text }]}>{avgRating}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={18}
                    color={s <= Math.round(avgRating) ? '#F59E0B' : '#CBD5E1'}
                    fill={s <= Math.round(avgRating) ? '#F59E0B' : 'transparent'}
                  />
                ))}
              </View>
              <Text style={[styles.ratingsCountText, { color: colors.textLight }]}>
                بر اساس {count} نظر ثبت شده توسط دانش‌آموزان
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionHeading, { color: colors.text }]}>دیدگاه‌های اخیر</Text>

          {reviews.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MessageSquare size={40} color={colors.textLight} />
              <Text style={[styles.emptyText, { color: colors.textLight }]}>
                هنوز نظری برای شما ثبت نشده است. پس از پاسخگویی به سوالات و تدریس، دانش‌آموزان برای شما نظر ثبت می‌کنند.
              </Text>
            </View>
          ) : (
            reviews.map((r: any) => (
              <View
                key={r._id}
                style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.reviewTopRow}>
                  <View style={styles.studentInfo}>
                    <View style={[styles.avatarBox, { backgroundColor: colors.primary + '18' }]}>
                      <User size={16} color={colors.primary} />
                    </View>
                    <Text style={[styles.studentName, { color: colors.text }]}>
                      {r.studentId?.fullName || 'دانش‌آموز'}
                    </Text>
                  </View>

                  <View style={styles.starsBadge}>
                    <Text style={styles.starsBadgeText}>⭐ {r.rating}</Text>
                  </View>
                </View>

                {r.comment ? (
                  <Text style={[styles.commentText, { color: colors.text }]}>{r.comment}</Text>
                ) : null}

                <Text style={[styles.reviewDate, { color: colors.textLight }]}>
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString('fa-IR') : ''}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontFamily: 'Estedad-FD-Bold' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  contentContainer: { padding: 16, gap: 14 },
  ratingHeroCard: {
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  ratingNumberWrap: { alignItems: 'center', gap: 6 },
  ratingBigNumber: { fontSize: 40, fontFamily: 'Estedad-FD-Black' },
  starsRow: { flexDirection: 'row-reverse', gap: 4 },
  ratingsCountText: { fontSize: 11, fontFamily: 'Estedad-FD-Regular', marginTop: 4 },
  sectionHeading: { fontSize: 14, fontFamily: 'Estedad-FD-Bold', textAlign: 'right', marginTop: 4 },
  emptyCard: { padding: 36, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 12, fontFamily: 'Estedad-FD-Regular', textAlign: 'center', lineHeight: 20 },
  reviewCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  reviewTopRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  avatarBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentName: { fontSize: 12, fontFamily: 'Estedad-FD-Bold' },
  starsBadge: {
    backgroundColor: '#F59E0B15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  starsBadgeText: { fontSize: 11, fontFamily: 'Estedad-FD-Bold', color: '#D97706' },
  commentText: { fontSize: 12, fontFamily: 'Estedad-FD-Regular', textAlign: 'right', lineHeight: 18 },
  reviewDate: { fontSize: 10, fontFamily: 'Estedad-FD-Regular', textAlign: 'right' },
});

export default TeacherReviewsScreen;
