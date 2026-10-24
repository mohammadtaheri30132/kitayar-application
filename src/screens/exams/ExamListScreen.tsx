import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { showError } from '../../components/feedback';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../api/axiosConfig';
import { useTheme } from '../../context/ThemeContext';
import * as jalaali from 'jalaali-js';
import { 
  ArrowRight, 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  FileText, 
  GraduationCap, 
  ChevronLeft,
  CheckCircle2,
  Clock3,
  Archive
} from 'lucide-react-native';

const formatJalaliDateTime = (dateString?: string): string => {
  if (!dateString) return 'نامشخص';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'نامشخص';
    const { jy, jm, jd } = jalaali.toJalaali(d);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')} · ${hours}:${minutes}`;
  } catch {
    return 'نامشخص';
  }
};

const ExamListScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // State
  const [exams, setExams] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  // Fetch exams with pagination
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
          // Auto switch to past tab if no active exams exist but past exams do
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
      showError('مشکلی در دریافت تاریخچه آزمون‌ها رخ داد.');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'در حال برگزاری':
        return {
          bg: isDark ? '#064e3b33' : '#dcfce7',
          text: '#15803d',
          icon: <CheckCircle2 size={13} color="#15803d" />
        };
      case 'در آینده':
        return {
          bg: isDark ? '#1e3a8a33' : '#eff6ff',
          text: '#2563eb',
          icon: <Clock3 size={13} color="#2563eb" />
        };
      case 'پایان‌یافته':
        return {
          bg: isDark ? '#33415544' : '#f1f5f9',
          text: isDark ? '#94a3b8' : '#64748b',
          icon: <Archive size={13} color={isDark ? '#94a3b8' : '#64748b'} />
        };
      default:
        return {
          bg: isDark ? '#78350f33' : '#fef3c7',
          text: '#b45309',
          icon: <Clock size={13} color="#b45309" />
        };
    }
  };

  const renderExamItem = ({ item }: { item: any }) => {
    const statusConfig = getStatusBadge(item.status);
    const className = item.className || item.classroom?.name;
    const questionsCount = item.questionsCount ?? (item.questions?.length || 0);
    const participantsCount = item.participantsCount ?? (item.allowedParticipants?.length || 0);

    return (
      <TouchableOpacity 
        style={[
          styles.card,
          { 
            backgroundColor: colors.surface, 
            borderColor: colors.border 
          }
        ]}
        activeOpacity={0.8}
        onPress={() => {
          navigation.navigate('ExamDashboardScreen', {
            examId: item._id || item.id,
            examTitle: item.title
          });
        }}
      >
        {/* Card Header: Title & Status Badge */}
        <View style={styles.cardHeader}>
          <Text style={[styles.examTitle, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>

          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            {statusConfig.icon}
            <Text style={[styles.statusBadgeText, { color: statusConfig.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Class Badge if available */}
        {className ? (
          <View style={[styles.classBadge, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}>
            <GraduationCap size={13} color={colors.primary} />
            <Text style={[styles.classBadgeText, { color: colors.text }]}>
              کلاس: {className}
            </Text>
          </View>
        ) : null}

        {/* Schedule Info */}
        <View style={[styles.scheduleBox, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleRowRight}>
              <Calendar size={13} color={colors.textLight} />
              <Text style={[styles.scheduleLabel, { color: colors.textLight }]}>شروع:</Text>
            </View>
            <Text style={[styles.scheduleValue, { color: colors.text }]}>
              {formatJalaliDateTime(item.startTime)}
            </Text>
          </View>

          <View style={[styles.scheduleRow, { marginTop: 6 }]}>
            <View style={styles.scheduleRowRight}>
              <Clock size={13} color={colors.textLight} />
              <Text style={[styles.scheduleLabel, { color: colors.textLight }]}>پایان:</Text>
            </View>
            <Text style={[styles.scheduleValue, { color: colors.text }]}>
              {formatJalaliDateTime(item.endTime)}
            </Text>
          </View>
        </View>

        {/* Card Footer: Metadata and Tap Arrow */}
        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <View style={styles.metaRow}>
            <View style={[styles.metaPill, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
              <Users size={12} color={colors.primary} />
              <Text style={[styles.metaPillText, { color: colors.text }]}>
                {participantsCount} دانش‌آموز
              </Text>
            </View>

            <View style={[styles.metaPill, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
              <FileText size={12} color={colors.primary} />
              <Text style={[styles.metaPillText, { color: colors.text }]}>
                {questionsCount} سوال
              </Text>
            </View>
          </View>

          <View style={styles.actionArrow}>
            <Text style={[styles.actionArrowText, { color: colors.primary }]}>مشاهده</Text>
            <ChevronLeft size={16} color={colors.primary} />
          </View>
        </View>
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

  const filteredExams = exams.filter(e => {
    if (activeTab === 'active') return e.status !== 'پایان‌یافته' && e.status !== 'از دست رفته';
    return e.status === 'پایان‌یافته' || e.status === 'از دست رفته';
  });

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>مدیریت آزمون‌ها</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textLight }]}>فهرست، وضعیت و نتایج آزمون‌های کلاسی</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs Row */}
      <View style={[styles.tabsRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[
            styles.tabBtn, 
            activeTab === 'active' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[
            styles.tabText, 
            { color: activeTab === 'active' ? '#ffffff' : colors.textLight }
          ]}>
            آزمون‌های جاری و فعال
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tabBtn, 
            activeTab === 'past' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[
            styles.tabText, 
            { color: activeTab === 'past' ? '#ffffff' : colors.textLight }
          ]}>
            آزمون‌های پایان‌یافته
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading && page === 1 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textLight }]}>در حال بارگذاری آزمون‌ها...</Text>
        </View>
      ) : filteredExams.length === 0 ? (
        <View style={styles.centerBox}>
          <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#1e293b' : '#eff6ff' }]}>
            <FileText size={42} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>آزمونی یافت نشد</Text>
          <Text style={[styles.emptyText, { color: colors.textLight }]}>
            {activeTab === 'active' 
              ? 'در حال حاضر هیچ آزمون فعالی تعریف نشده است.' 
              : 'تاریخچه آزمون‌های پایان‌یافته خالی است.'}
          </Text>
          {activeTab === 'active' && (
            <TouchableOpacity 
              style={[styles.createFirstBtn, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('CreateExamStep1Screen')}
            >
              <Plus size={16} color="#ffffff" />
              <Text style={styles.createFirstBtnText}>ساخت اولین آزمون</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredExams}
          keyExtractor={(item, index) => (item._id || item.id) + index.toString()}
          renderItem={renderExamItem}
          contentContainerStyle={[styles.listContainer, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshing={isLoading}
          onRefresh={() => fetchExams(1)}
        />
      )}

      {/* Fixed Bottom Action Button - Safe bottom padding prevents navigation bar overlap */}
      <View style={[
        styles.bottomBar, 
        { 
          backgroundColor: colors.surface, 
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 16)
        }
      ]}>
        <TouchableOpacity 
          style={[styles.fixedAddButton, { backgroundColor: colors.primary }]} 
          activeOpacity={0.8} 
          onPress={() => navigation.navigate('CreateExamStep1Screen')}
        >
          <Plus size={18} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.fixedAddButtonText}>ایجاد آزمون جدید</Text>
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
    zIndex: 10 
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
    fontSize: 12, 
    marginTop: 2, 
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
    gap: 12
  },
  tabBtn: { 
    flex: 1, 
    paddingVertical: 9, 
    alignItems: 'center', 
    borderRadius: 12,
    backgroundColor: '#f1f5f9'
  },
  tabText: { 
    fontSize: 13, 
    fontWeight: 'bold' 
  },
  
  centerBox: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 30 
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { 
    fontSize: 17, 
    fontWeight: 'bold', 
    marginBottom: 6,
    textAlign: 'center'
  },
  emptyText: { 
    fontSize: 13, 
    textAlign: 'center',
    lineHeight: 20
  },
  createFirstBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
  },
  createFirstBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },

  listContainer: { 
    padding: 16 
  },
  card: { 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 14, 
    borderWidth: 1, 
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
  examTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    flex: 1, 
    textAlign: 'right', 
    marginLeft: 10 
  },
  statusBadge: { 
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  statusBadgeText: { 
    fontSize: 11, 
    fontWeight: 'bold' 
  },

  classBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    alignSelf: 'flex-end',
  },
  classBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },

  scheduleBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
  scheduleRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleRowRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  scheduleLabel: {
    fontSize: 12,
    textAlign: 'right',
  },
  scheduleValue: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'left',
  },

  cardFooter: { 
    flexDirection: 'row-reverse', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  metaPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionArrow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 2,
  },
  actionArrowText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  bottomBar: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    paddingHorizontal: 16, 
    paddingTop: 12, 
    borderTopWidth: 1, 
    elevation: 8 
  },
  fixedAddButton: { 
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14, 
    borderRadius: 14, 
  },
  fixedAddButtonText: { 
    color: '#ffffff', 
    fontSize: 15, 
    fontWeight: 'bold' 
  }
});

export default ExamListScreen;