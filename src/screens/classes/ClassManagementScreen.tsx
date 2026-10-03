import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  ScrollView,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';
import GlobalHeader from '../../components/common/GlobalHeader';
import { School, Plus, Users, BookOpen, ChevronLeft, GraduationCap } from 'lucide-react-native';

interface SchoolGroup {
  schoolId: string;
  schoolName: string;
  schoolColor: string;
  classes: any[];
}

const ClassManagementScreen = ({ navigation }: any) => {
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
      Alert.alert('خطا', 'مشکلی در دریافت لیست کلاس‌ها رخ داد.');
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
      const schoolColor = cls.school?.color || COLORS.primary;

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
  }, [classes]);

  // رندر کارت کلاس
  const renderClassCard = (item: any, schoolColor: string) => {
    const studentCount = item.students?.length || 0;

    return (
      <TouchableOpacity 
        key={item._id}
        style={[styles.classCard, { borderRightWidth: 5, borderRightColor: schoolColor }]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ClassDetailsScreen', { 
          classroom: item, 
          classId: item._id, 
          className: item.name 
        })}
      >
        <View style={styles.classCardHeader}>
          <Text style={styles.className}>{item.name}</Text>
          <View style={[styles.studentBadge, { backgroundColor: schoolColor + '15' }]}>
            <Users size={14} color={schoolColor} style={{ marginLeft: 4 }} />
            <Text style={[styles.studentBadgeText, { color: schoolColor }]}>
              {studentCount} دانش‌آموز
            </Text>
          </View>
        </View>

        <View style={styles.classCardBody}>
          <View style={styles.classInfoCol}>
            <View style={styles.infoRow}>
              <BookOpen size={14} color={COLORS.textLight} />
              <Text style={styles.infoText}>
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <GlobalHeader 
        onProfilePress={() => navigation.navigate('ProfileScreen')} 
      />

      {/* هدر بالایی: لیست مدارس و دکمه ایجاد کلاس روبه‌روی آن */}
      <View style={styles.topBar}>
        <View style={styles.topBarTitleWrapper}>
          <School size={22} color={COLORS.primary} style={{ marginLeft: 8 }} />
          <Text style={styles.topBarTitle}>لیست مدارس</Text>
          {classes.length > 0 && (
            <View style={styles.schoolCountBadge}>
              <Text style={styles.schoolCountBadgeText}>{groupedClasses.length} مدرسه</Text>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.createClassBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('CreateClassScreen')}
        >
          <Plus size={18} color="#ffffff" style={{ marginLeft: 6 }} />
          <Text style={styles.createClassBtnText}>ایجاد کلاس</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : classes.length === 0 ? (
        /* کادر حالت خالی بودن کلاس‌ها */
        <ScrollView 
          contentContainerStyle={styles.emptyScroll}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchClasses(false)} />
          }
        >
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <GraduationCap size={44} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>کلاسی وجود ندارد</Text>
            <Text style={styles.emptyText}>
              اولین کلاس خودتو ایجاد کن و کلاس خودتو مدیریت کن
            </Text>
            <TouchableOpacity 
              style={styles.emptyActionBtn}
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
                  <Text style={styles.schoolName}>{group.schoolName}</Text>
                </View>
                <View style={[styles.schoolBadge, { backgroundColor: group.schoolColor + '18' }]}>
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
          style={styles.fab} 
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  schoolColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
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
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  className: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
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
  },
  infoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textLight,
    marginRight: 6,
  },
  enterClassAction: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
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