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
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';

const ClassManagementScreen = ({ navigation }: any) => {
  // استیت‌های داده
  const [classes, setClasses] = useState<any[]>([]);
  
  // استیت‌های پیجینیشن
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // تابع دریافت کلاس‌ها با سیستم صفحه‌بندی
  const fetchClasses = async (pageNumber = 1) => {
    if (pageNumber === 1) setIsLoading(true);
    else setIsFetchingMore(true);

    try {
      const response = await api.get(`/teacher/classrooms?page=${pageNumber}&limit=10`);
      
      if (response.data.success) {
        const newClasses = response.data.data;
        const paginationInfo = response.data.pagination;

        if (pageNumber === 1) {
          setClasses(newClasses);
        } else {
          setClasses((prev) => [...prev, ...newClasses]);
        }

        // بروزرسانی وضعیت اسکرول
        setHasMore(paginationInfo?.hasNextPage ?? false);
        setPage(pageNumber);
      }
    } catch (error: any) {
      Alert.alert('خطا', 'مشکلی در دریافت لیست کلاس‌ها رخ داد.');
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  // رفرش شدن لیست (از صفحه اول) وقتی کاربر به این صفحه برمی‌گردد
  useFocusEffect(
    useCallback(() => {
      fetchClasses(1);
    }, [])
  );

  // هندل کردن رسیدن به انتهای لیست
  const loadMoreData = () => {
    if (hasMore && !isFetchingMore && !isLoading) {
      fetchClasses(page + 1);
    }
  };

  // رندر کارت کلاس
  const renderClassItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.classCard}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ClassDetailsScreen', { classroom: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.className}>{item.name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.students?.length || 0} دانش‌آموز</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.infoText}>دوره: {item.course?.name || 'نامشخص'}</Text>
        <Text style={styles.infoText}>پایه: {item.grade?.name || 'نامشخص'}</Text>
      </View>
    </TouchableOpacity>
  );

  // لودینگ انتهای لیست
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
        <Text style={styles.headerTitle}>کلاس‌های من</Text>
        <Text style={styles.headerSubtitle}>مدیریت لیست کلاس‌ها و دانش‌آموزان</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : classes.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyIcon}>🏫</Text>
          <Text style={styles.emptyTitle}>کلاسی یافت نشد</Text>
          <Text style={styles.emptyText}>اولین کلاس خود را برای برگزاری آزمون ایجاد کنید.</Text>
        </View>
      ) : (
        <FlatList
          data={classes}
          keyExtractor={(item, index) => item._id + index.toString()}
          renderItem={renderClassItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          
          // تنظیمات اسکرول بی‌نهایت
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          
          refreshing={isLoading}
          onRefresh={() => fetchClasses(1)}
        />
      )}

      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => navigation.navigate('CreateClassScreen')}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

// ... کدهای StyleSheet دقیقاً مشابه قبل است (بدون تغییر) ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 24, paddingTop: 40, backgroundColor: COLORS.surface, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 3, zIndex: 10 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, textAlign: 'right' },
  headerSubtitle: { fontSize: 14, color: COLORS.textLight, textAlign: 'right', marginTop: 4 },
  listContainer: { padding: 20, paddingBottom: 100 },
  classCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  className: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  badge: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: COLORS.secondary, fontSize: 12, fontWeight: 'bold' },
  cardBody: { alignItems: 'flex-end' },
  infoText: { fontSize: 14, color: COLORS.textLight, marginBottom: 4 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', lineHeight: 22 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  fabIcon: { fontSize: 32, color: COLORS.surface, fontWeight: '300', marginTop: -4 },
});

export default ClassManagementScreen;