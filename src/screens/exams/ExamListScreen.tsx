import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';

const ExamListScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  // استیت‌های داده
  const [exams, setExams] = useState<any[]>([]);
  
  // استیت‌های پیجینیشن و تب‌ها
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  // تابع دریافت آزمون‌ها با سیستم صفحه‌بندی
  const fetchExams = async (pageNumber = 1) => {
    if (pageNumber === 1) setIsLoading(true);
    else setIsFetchingMore(true);

    try {
      const response = await api.get(`/teacher/exams?page=${pageNumber}&limit=10`);
      
      if (response.data.success) {
        const newExams = response.data.data;
        const paginationInfo = response.data.pagination;

        if (pageNumber === 1) {
          setExams(newExams);
          // Set default tab based on data
          const hasActive = newExams.some((e: any) => e.status !== 'پایان‌یافته' && e.status !== 'از دست رفته');
          if (!hasActive && newExams.length > 0) {
            setActiveTab('past');
          } else {
            setActiveTab('active');
          }
        } else {
          setExams((prev) => [...prev, ...newExams]);
        }

        setHasMore(paginationInfo?.hasNextPage ?? false);
        setPage(pageNumber);
      }
    } catch (error: any) {
      Alert.alert('خطا', 'مشکلی در دریافت تاریخچه آزمون‌ها رخ داد.');
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchExams(1);
    }, [])
  );

  const loadMoreData = () => {
    if (hasMore && !isFetchingMore && !isLoading) {
      fetchExams(page + 1);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'در حال برگزاری': return { bg: '#dcfce7', text: '#166534' };
      case 'در آینده': return { bg: '#eff6ff', text: '#1e40af' };
      case 'پایان‌یافته': return { bg: '#f1f5f9', text: '#475569' };
      default: return { bg: '#fef3c7', text: '#92400e' };
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'نامشخص';
    const date = new Date(dateString);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} - ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };
const renderExamItem = ({ item }: { item: any }) => {
    const statusStyle = getStatusStyle(item.status);
    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => {
          navigation.navigate('ExamDashboardScreen', {
            examId: item._id || item.id,
            examTitle: item.title
          });
        }}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.examTitle}>{item.title}</Text>
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>{item.status}</Text>
          </View>
        </View>
        
        {item.className && (
          <View style={styles.classBadgeContainer}>
            <Text style={styles.classBadgeText}>کلاس: {item.className}</Text>
          </View>
        )}

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>شروع:</Text>
            <Text style={styles.infoValue}>{formatDate(item.startTime)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>پایان:</Text>
            <Text style={styles.infoValue}>{formatDate(item.endTime)}</Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>👥 {item.participantsCount ?? (item.allowedParticipants?.length || 0)} مجاز</Text>
          <Text style={styles.footerText}>📝 {item.questionsCount ?? (item.questions?.length || 0)} سوال</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isFetchingMore) return <View style={{ height: 20 }} />;
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  const filteredExams = exams.filter(e => {
    if (activeTab === 'active') return e.status !== 'پایان‌یافته' && e.status !== 'از دست رفته';
    return e.status === 'پایان‌یافته' || e.status === 'از دست رفته';
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>🔙 داشبورد</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>لیست آزمون‌ها</Text>
          <Text style={styles.headerSubtitle}>تاریخچه برگزاری و وضعیت‌ها</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'active' && styles.activeTab]} 
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>آزمون‌های فعال</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'past' && styles.activeTab]} 
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>آزمون‌های گذشته</Text>
        </TouchableOpacity>
      </View>

      {isLoading && page === 1 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : filteredExams.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>آزمونی یافت نشد</Text>
          <Text style={styles.emptyText}>شما در این دسته‌بندی آزمونی ندارید.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredExams}
          keyExtractor={(item, index) => (item._id || item.id) + index.toString()}
          renderItem={renderExamItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}

          refreshing={isLoading}
          onRefresh={() => fetchExams(1)}
        />
      )}

      <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity 
          style={styles.fixedAddButton} 
          activeOpacity={0.8} 
          onPress={() => navigation.navigate('CreateExamStep1Screen')}
        >
          <Text style={styles.fixedAddButtonText}>➕ ایجاد آزمون جدید</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ... کدهای StyleSheet دقیقاً مشابه قبل است (بدون تغییر) ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, elevation: 2, zIndex: 10 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  backButton: { padding: 8 },
  backButtonText: { color: COLORS.textLight, fontSize: 14 },
  
  tabsContainer: { flexDirection: 'row', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, elevation: 1 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 15, color: COLORS.textLight, fontWeight: 'bold' },
  activeTabText: { color: COLORS.primary },
  
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.textLight, textAlign: 'center' },
  listContainer: { padding: 20, paddingBottom: 100 },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 12 },
  examTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.primary, flex: 1, textAlign: 'right', marginLeft: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  classBadgeContainer: { backgroundColor: '#f1f5f9', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, marginBottom: 12, alignSelf: 'flex-start' },
  classBadgeText: { fontSize: 12, color: COLORS.textLight, fontWeight: 'bold' },
  cardBody: { marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  infoLabel: { fontSize: 14, color: COLORS.textLight },
  infoValue: { fontSize: 14, color: COLORS.text, fontWeight: '500', letterSpacing: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-start', gap: 16, backgroundColor: '#f8fafc', padding: 10, borderRadius: 10 },
  footerText: { fontSize: 13, color: COLORS.textLight, fontWeight: '600' },
  
  bottomContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surface, paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border, elevation: 10 },
  fixedAddButton: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  fixedAddButtonText: { color: COLORS.surface, fontSize: 16, fontWeight: 'bold' }
});

export default ExamListScreen;