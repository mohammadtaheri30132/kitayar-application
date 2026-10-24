import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView,
  RefreshControl
} from 'react-native';
import { showError } from '../../components/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';
import GlobalHeader from '../../components/common/GlobalHeader';
import { School, Plus, Users, BookOpen, ChevronLeft, GraduationCap } from 'lucide-react-native';

interface SchoolGroup {
  schoolId: string;
  schoolName: string;
  schoolColor: string;
  classes: any[];
}

const ClassManagementScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // دریافت لیست کلاس‌ها
  const fetchClasses = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const response = await api.get('/teacher/classrooms');
      if (response.data.success) {
        setClasses(response.data.data || []);
      }
    } catch (error: any) {
      showError('مشکلی در دریافت لیست کلاس‌ها رخ داد.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // رفرش لیست هنگام برگشت به صفحه
  useFocusEffect(
    useCallback(() => {
      fetchClasses(classes.length === 0);
    }, [])
  );

  // گروه بندی کلاس‌ها بر اساس مدرسه
  const groupedClasses = useMemo(() => {
    const map = new Map<string, SchoolGroup>();

    classes.forEach((cls) => {
      const schoolId = cls.school?._id || 'no-school';
      const schoolName = cls.school?.name || 'سایر کلاس‌ها';
      const schoolColor = cls.school?.color || colors.primary;

      if (!map.has(schoolId)) {
        map.set(schoolId, {
          schoolId,
          schoolName,
          schoolColor,
          classes: []
        });
      }
      map.get(schoolId)!.classes.push(cls);
    });

    return Array.from(map.values());
  }, [classes, colors.primary]);

  // رندر کارت کلاس
  const toPersianDigits = (str: string | number) => {
    if (!str) return '';
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return str.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
  };

  const renderClassCard = (item: any, schoolColor: string) => {
    const studentCount = item.students?.length || 0;

    return (
      <TouchableOpacity 
        key={item._id}
        style={[
          styles.classCard,
          { 
            backgroundColor: colors.surface, 
            borderColor: colors.border,
            borderRightWidth: 5, 
            borderRightColor: schoolColor 
          }
        ]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ClassDetailsScreen', { 
          classroom: item, 
          classId: item._id, 
          className: item.name 
        })}
      >
        <View style={[styles.classCardHeader, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }]}>
          <Text style={[styles.className, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
            {item.name}
          </Text>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {item.code ? (
              <View style={{ 
                backgroundColor: isDark ? '#1e3a5f' : '#eff6ff', 
                paddingHorizontal: 7, 
                paddingVertical: 2, 
                borderRadius: 6, 
                borderWidth: 1, 
                borderColor: isDark ? '#2563eb' : '#bfdbfe' 
              }}>
                <Text style={{ fontSize: 11, color: isDark ? '#93c5fd' : '#1d4ed8', fontFamily: 'IRANSansX', fontWeight: 'bold' }}>
                  کد: {toPersianDigits(item.code)}
                </Text>
              </View>
            ) : null}
            <View style={[styles.studentBadge, { backgroundColor: schoolColor + (isDark ? '25' : '15') }]}>
              <Users size={14} color={schoolColor} style={{ marginLeft: 4 }} />
              <Text style={[styles.studentBadgeText, { color: schoolColor }]}>
                {studentCount} دانش‌آموز
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.classCardBody}>
          <View style={styles.classInfoCol}>
            <View style={styles.infoRow}>
              <BookOpen size={14} color={colors.textLight} />
              <Text style={[styles.infoText, { color: colors.textLight }]} numberOfLines={1} ellipsizeMode="tail">
                {item.course?.name || item.subjectName || 'دوره نامشخص'}
                {item.grade?.name ? ` · پایه ${item.grade.name}` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.enterClassAction}>
            <Text style={[styles.enterClassText, { color: schoolColor }]}>مدیریت کلاس</Text>
            <ChevronLeft size={16} color={schoolColor} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <GlobalHeader title="مدیریت کلاس" subtitle="لیست مدارس، کلاس‌ها و دانش‌آموزان" />

      {/* هدر بالایی: لیست مدارس و دکمه ایجاد کلاس روبه‌روی آن */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.topBarTitleWrapper}>
          <School size={22} color={colors.primary} style={{ marginLeft: 8 }} />
          <Text style={[styles.topBarTitle, { color: colors.text }]}>لیست مدارس</Text>
          {classes.length > 0 && (
            <View style={[styles.schoolCountBadge, { backgroundColor: isDark ? '#1e3a5f' : '#eff6ff' }]}>
              <Text style={[styles.schoolCountBadgeText, { color: isDark ? '#93c5fd' : colors.primary }]}>
                {groupedClasses.length} مدرسه
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.createClassBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('CreateClassScreen')}
        >
          <Plus size={18} color="#ffffff" style={{ marginLeft: 6 }} />
          <Text style={styles.createClassBtnText}>ایجاد کلاس</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : classes.length === 0 ? (
        /* کادر حالت خالی بودن کلاس‌ها */
        <ScrollView 
          contentContainerStyle={styles.emptyScroll}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchClasses(false)} />
          }
        >
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: isDark ? '#334155' : '#cbd5e1' }]}>
            <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? '#1e293b' : '#eff6ff' }]}>
              <GraduationCap size={44} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>کلاسی وجود ندارد</Text>
            <Text style={[styles.emptyText, { color: colors.textLight }]}>
              اولین کلاس خودتو ایجاد کن و کلاس خودتو مدیریت کن
            </Text>
            <TouchableOpacity 
              style={[styles.emptyActionBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('CreateClassScreen')}
            >
              <Plus size={18} color="#ffffff" style={{ marginLeft: 6 }} />
              <Text style={styles.emptyActionBtnText}>ایجاد کلاس جدید</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* لیست کلاس‌ها گروه‌بندی شده بر اساس مدرسه */
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchClasses(false)} />
          }
        >
          {groupedClasses.map((group) => (
            <View key={group.schoolId} style={styles.schoolSection}>
              {/* هدر مشخصات مدرسه */}
              <View style={styles.schoolHeader}>
                <View style={styles.schoolHeaderRight}>
                  <View style={[styles.schoolColorDot, { backgroundColor: group.schoolColor }]} />
                  <School size={18} color={group.schoolColor} style={{ marginLeft: 6 }} />
                  <Text style={[styles.schoolName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                    {group.schoolName}
                  </Text>
                </View>
                <View style={[styles.schoolBadge, { backgroundColor: group.schoolColor + '18', flexShrink: 0 }]}>
                  <Text style={[styles.schoolBadgeText, { color: group.schoolColor }]}>
                    {group.classes.length} کلاس
                  </Text>
                </View>
              </View>

              {/* کلاس‌های متعلق به این مدرسه */}
              <View style={styles.schoolClassesList}>
                {group.classes.map((cls) => renderClassCard(cls, group.schoolColor))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* دکمه شناور ایجاد کلاس برای دسترسی سریع */}
      {classes.length > 0 && (
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]} 
          activeOpacity={0.8} 
          onPress={() => navigation.navigate('CreateClassScreen')}
        >
          <Plus size={26} color="#ffffff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },

  // نوار بالایی: عنوان لیست مدارس و دکمه ایجاد کلاس
  topBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 1,
  },
  topBarTitleWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  schoolCountBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 8,
  },
  schoolCountBadgeText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  createClassBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  createClassBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // محتوای اسکرول
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },

  // بخش هر مدرسه
  schoolSection: {
    marginBottom: 24,
  },
  schoolHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  schoolHeaderRight: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginRight: 8,
  },
  schoolColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  schoolName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'right',
  },
  schoolBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  schoolBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  schoolClassesList: {
    marginTop: 2,
  },

  // کارت کلاس
  classCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  classCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    gap: 8,
  },
  className: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'right',
    marginRight: 8,
  },
  studentBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  studentBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  classCardBody: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textLight,
    marginRight: 6,
    textAlign: 'right',
    flexShrink: 1,
  },
  enterClassAction: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flexShrink: 0,
    paddingLeft: 4,
  },
  enterClassText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },

  // استایل‌های حالت خالی بودن کلاس‌ها
  emptyScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    elevation: 1,
  },
  emptyIconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 22,
  },
  emptyActionBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
  },
  emptyActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // دکمه شناور
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});

export default ClassManagementScreen;