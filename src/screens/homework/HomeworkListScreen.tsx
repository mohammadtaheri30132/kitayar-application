import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { showError, showSuccess, showConfirm } from '../../components/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import {
  ChevronRight,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  BookOpen,
  Users,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
} from 'lucide-react-native';
import { PlanningService, Homework } from '../../api/planningService';
import { getHomeworkRemainingDays } from '../../utils/date/homeworkSessionHelper';
import { toPersianNumbers } from '../../utils/date/jalaliHelper';

const HomeworkListScreen = ({ route, navigation }: any) => {
  const { colors, isDark } = useTheme();

  const filterClassId = route.params?.classId;
  const filterClassName = route.params?.className;

  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHomeworks = async () => {
    try {
      const res = await PlanningService.getHomeworks(
        filterClassId ? { classId: filterClassId } : undefined
      );
      if (res.success && res.data) {
        // Sort by closest due date (ascending)
        const sorted = [...res.data].sort((a, b) => {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
        setHomeworks(sorted);
      }
    } catch (e) {
      console.warn('Error loading homeworks:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHomeworks();
    }, [filterClassId])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHomeworks();
  };

  const handleDelete = (hw: Homework) => {
    showConfirm({
      title: 'حذف تکلیف',
      message: `آیا از حذف تکلیف «${hw.title}» اطمینان دارید؟`,
      confirmText: 'حذف',
      cancelText: 'انصراف',
      isDestructive: true,
      icon: Trash2,
      onConfirm: async () => {
        try {
          await PlanningService.deleteHomework(hw._id);
          showSuccess('تکلیف با موفقیت حذف شد');
          fetchHomeworks();
        } catch (e) {
          showError('حذف تکلیف با خطا مواجه شد');
        }
      },
    });
  };

  const filteredHomeworks = homeworks.filter(hw => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      hw.title.toLowerCase().includes(q) ||
      hw.subject.toLowerCase().includes(q) ||
      hw.classId?.name?.toLowerCase().includes(q)
    );
  });

  const renderHomeworkCard = ({ item }: { item: Homework }) => {
    const remaining = getHomeworkRemainingDays(item.dueDate);
    const submissions = item.studentSubmissions || [];
    const doneCount = submissions.filter(s => s.status === 'DONE').length;
    const notDoneCount = submissions.filter(s => s.status === 'NOT_DONE').length;
    const pendingCount = submissions.filter(s => s.status === 'PENDING').length;

    const visibleItems = (item.items || []).slice(0, 3);
    const extraItemsCount = Math.max(0, (item.items || []).length - 3);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: remaining.isToday ? '#ef4444' : colors.border,
            borderWidth: remaining.isToday ? 1.5 : 1,
          },
        ]}
        onPress={() => navigation.navigate('HomeworkDetailsScreen', { homeworkId: item._id })}
        activeOpacity={0.8}
      >
        {/* سربرگ کارت: درس و موعد تحویل */}
        <View style={styles.cardHeader}>
          {/* نشانگر روزهای باقیمانده */}
          <View style={[styles.remainingBadge, { backgroundColor: remaining.badgeBg }]}>
            {remaining.isToday ? (
              <AlertTriangle size={13} color={remaining.badgeColor} style={{ marginLeft: 4 }} />
            ) : (
              <Clock size={13} color={remaining.badgeColor} style={{ marginLeft: 4 }} />
            )}
            <Text style={[styles.remainingText, { color: remaining.badgeColor }]}>
              {remaining.badgeText}
            </Text>
          </View>

          {/* نام درس و کلاس */}
          <View style={styles.subjectBadge}>
            <BookOpen size={13} color={colors.primary} style={{ marginLeft: 4 }} />
            <Text style={[styles.subjectText, { color: colors.primary }]}>
              {item.subject} • {item.classId?.name || 'کلاس'}
            </Text>
          </View>
        </View>

        {/* عنوان تکلیف */}
        <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>

        {/* مخاطب تکلیف */}
        <View style={styles.targetRow}>
          <Users size={13} color={colors.textLight} style={{ marginLeft: 4 }} />
          <Text style={[styles.targetText, { color: colors.textLight }]}>
            مخاطب: {item.isForAllStudents ? 'همه دانش‌آموزان' : `${toPersianNumbers(item.targetStudentPhones?.length || 0)} دانش‌آموز انتخابی`}
          </Text>
          <Text style={[styles.dotDivider, { color: colors.textLight }]}>•</Text>
          <Calendar size={13} color={colors.textLight} style={{ marginLeft: 4 }} />
          <Text style={[styles.targetText, { color: colors.textLight }]}>
            موعد: {toPersianNumbers(item.dueDateJalali || item.dueDate)}
          </Text>
        </View>

        {/* ۳ آیتم اول تکلیف */}
        {visibleItems.length > 0 && (
          <View style={[styles.itemsBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' }]}>
            {visibleItems.map((it, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={[styles.itemDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
                  {it.title}
                </Text>
              </View>
            ))}

            {extraItemsCount > 0 && (
              <View style={styles.extraBadge}>
                <Text style={styles.extraBadgeText}>
                  +{toPersianNumbers(extraItemsCount)} مورد دیگر
                </Text>
              </View>
            )}
          </View>
        )}

        {/* آمار تحویل دانش‌آموزان */}
        <View style={styles.statsRow}>
          <View style={[styles.statPill, { backgroundColor: '#dcfce7' }]}>
            <Text style={[styles.statText, { color: '#166534' }]}>
              {toPersianNumbers(doneCount)} انجام شده
            </Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: '#fee2e2' }]}>
            <Text style={[styles.statText, { color: '#991b1b' }]}>
              {toPersianNumbers(notDoneCount)} انجام نشده
            </Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: '#fef3c7' }]}>
            <Text style={[styles.statText, { color: '#92400e' }]}>
              {toPersianNumbers(pendingCount)} در انتظار
            </Text>
          </View>

          {/* اکشن‌های ویرایش و حذف */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate('CreateHomeworkScreen', { homework: item })}
              style={styles.actionBtn}
            >
              <Edit2 size={16} color={colors.textLight} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronRight color={colors.text} size={26} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {filterClassName ? `تکالیف ${filterClassName}` : 'مدیریت تکالیف'}
        </Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('CreateHomeworkScreen', { classId: filterClassId, className: filterClassName })}
          activeOpacity={0.7}
        >
          <Plus size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* جستجو */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search size={16} color={colors.textLight} style={{ marginLeft: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="جستجوی تکلیف بر اساس عنوان یا درس..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* لیست تکالیف */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredHomeworks.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: colors.textLight }]}>
            {searchQuery ? 'هیچ تکلیفی با این مشخصات یافت نشد.' : 'هنوز تکلیفی ثبت نشده است.'}
          </Text>
          <TouchableOpacity
            style={[styles.createFirstBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('CreateHomeworkScreen', { classId: filterClassId, className: filterClassName })}
          >
            <Plus size={16} color="#fff" style={{ marginLeft: 6 }} />
            <Text style={styles.createFirstBtnText}>ثبت اولین تکلیف</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredHomeworks}
          keyExtractor={item => item._id}
          renderItem={renderHomeworkCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: 'bold', fontFamily: 'IRANSansX' },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'IRANSansX',
    fontSize: 13,
    textAlign: 'right',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  subjectBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  subjectText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
  },
  remainingBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  remainingText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    textAlign: 'right',
    marginBottom: 6,
  },
  targetRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 10,
  },
  targetText: {
    fontSize: 11.5,
    fontFamily: 'IRANSansX',
  },
  dotDivider: {
    marginHorizontal: 6,
  },
  itemsBox: {
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginLeft: 6,
  },
  itemTitle: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    flex: 1,
    textAlign: 'right',
  },
  extraBadge: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  extraBadgeText: {
    fontSize: 10.5,
    fontFamily: 'IRANSansX',
    color: '#64748b',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 6,
  },
  statText: {
    fontSize: 10.5,
    fontFamily: 'IRANSansX',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'IRANSansX',
    marginBottom: 16,
  },
  createFirstBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  createFirstBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },
});

export default HomeworkListScreen;
