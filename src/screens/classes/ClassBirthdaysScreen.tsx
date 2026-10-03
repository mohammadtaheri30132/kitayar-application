import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView,
  Alert
} from 'react-native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Gift } from 'lucide-react-native';
import { getTodayJalali } from '../../utils/date/jalaliHelper';

const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 
  'تیر', 'مرداد', 'شهریور', 
  'مهر', 'آبان', 'آذر', 
  'دی', 'بهمن', 'اسفند'
];

const ClassBirthdaysScreen = ({ route, navigation }: any) => {
  const { currentClassId, currentClassName } = route.params;
  const insets = useSafeAreaInsets();

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const today = getTodayJalali();

  useEffect(() => {
    fetchStudents();
  }, [currentClassId]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/teacher/classrooms/${currentClassId}/students/list`);
      if (response.data.success) {
        setStudents(response.data.data);
      }
    } catch (error) {
      console.warn(error);
      Alert.alert('خطا', 'مشکلی در دریافت اطلاعات دانش‌آموزان رخ داد.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to parse birthdate like "1385/06/15" or "1385-06-15"
  const parseBirthdate = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.replace(/-/g, '/').split('/');
    if (parts.length === 3) {
      return {
        year: parseInt(parts[0], 10),
        month: parseInt(parts[1], 10), // 1 to 12
        day: parseInt(parts[2], 10)
      };
    }
    return null;
  };

  const studentsWithBirthdays = students.map(s => {
    const parsedDate = parseBirthdate(s.birthDate);
    return { ...s, parsedDate };
  }).filter(s => s.parsedDate !== null);

  // Calculate upcoming birthdays
  const getUpcomingBirthdays = () => {
    const currentMonth = today.jm;
    const currentDay = today.jd;

    // Filter students whose birthday is today or later in the year
    let upcoming = studentsWithBirthdays.filter(s => {
      if (!s.parsedDate) return false;
      if (s.parsedDate.month > currentMonth) return true;
      if (s.parsedDate.month === currentMonth && s.parsedDate.day >= currentDay) return true;
      return false;
    });

    // If less than 3, wrap around to next year's early months
    if (upcoming.length < 3) {
      const remainingNeeded = 3 - upcoming.length;
      const wrappedAround = studentsWithBirthdays.filter(s => {
        if (!s.parsedDate) return false;
        if (s.parsedDate.month < currentMonth) return true;
        if (s.parsedDate.month === currentMonth && s.parsedDate.day < currentDay) return true;
        return false;
      });
      
      // Sort wrapped around
      wrappedAround.sort((a, b) => {
        if (a.parsedDate.month !== b.parsedDate.month) return a.parsedDate.month - b.parsedDate.month;
        return a.parsedDate.day - b.parsedDate.day;
      });

      upcoming = [...upcoming, ...wrappedAround.slice(0, remainingNeeded)];
    }

    // Sort upcoming properly
    upcoming.sort((a, b) => {
      // Logic for sorting from current date onwards
      const aMonthDiff = a.parsedDate.month < currentMonth ? a.parsedDate.month + 12 : a.parsedDate.month;
      const bMonthDiff = b.parsedDate.month < currentMonth ? b.parsedDate.month + 12 : b.parsedDate.month;
      
      if (aMonthDiff !== bMonthDiff) return aMonthDiff - bMonthDiff;
      return a.parsedDate.day - b.parsedDate.day;
    });

    return upcoming.slice(0, 3);
  };

  const upcomingBirthdays = getUpcomingBirthdays();

  // Group by month
  const getGroupedByMonth = () => {
    const grouped = Array.from({ length: 12 }, () => [] as any[]);
    studentsWithBirthdays.forEach(s => {
      if (s.parsedDate && s.parsedDate.month >= 1 && s.parsedDate.month <= 12) {
        grouped[s.parsedDate.month - 1].push(s);
      }
    });

    // Sort each month's array by day
    grouped.forEach(monthArray => {
      monthArray.sort((a, b) => a.parsedDate.day - b.parsedDate.day);
    });

    return grouped;
  };

  const groupedBirthdays = getGroupedByMonth();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronRight size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>تولد دانش‌آموزان</Text>
          <Text style={styles.headerSubtitle}>{currentClassName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
            
            {/* Upcoming Birthdays Box */}
            {upcomingBirthdays.length > 0 && (
              <View style={styles.upcomingBox}>
                <View style={styles.upcomingHeader}>
                  <Gift size={20} color={COLORS.surface} />
                  <Text style={styles.upcomingTitle}>تولدهای پیش رو</Text>
                </View>
                {upcomingBirthdays.map((student, idx) => (
                  <View key={idx} style={styles.upcomingRow}>
                    <Text style={styles.upcomingName}>{student.firstName} {student.lastName}</Text>
                    <Text style={styles.upcomingDate}>{student.parsedDate?.day} {PERSIAN_MONTHS[student.parsedDate!.month - 1]}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Monthly List */}
            {PERSIAN_MONTHS.map((monthName, monthIndex) => {
              const monthStudents = groupedBirthdays[monthIndex];
              if (monthStudents.length === 0) return null; // Skip empty months

              return (
                <View key={monthIndex} style={styles.monthContainer}>
                  <Text style={styles.monthTitle}>{monthName}</Text>
                  <View style={styles.monthBox}>
                    {monthStudents.map((student, idx) => (
                      <View key={idx} style={[styles.studentRow, idx < monthStudents.length - 1 && styles.borderBottom]}>
                        <Text style={styles.studentName}>{student.firstName} {student.lastName}</Text>
                        <View style={styles.dayBadge}>
                          <Text style={styles.dayText}>{student.parsedDate?.day}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}

            {studentsWithBirthdays.length === 0 && (
              <Text style={styles.emptyText}>هیچ تاریخ تولدی برای دانش‌آموزان ثبت نشده است.</Text>
            )}
            
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: COLORS.surface, elevation: 2 },
  backButton: { padding: 8 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  
  content: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 100 },

  upcomingBox: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    elevation: 3,
  },
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  upcomingTitle: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  upcomingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  upcomingName: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: 'bold',
  },
  upcomingDate: {
    color: COLORS.surface,
    fontSize: 14,
  },

  monthContainer: {
    marginBottom: 20,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'left',
    paddingRight: 8,
  },
  monthBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  studentName: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  dayBadge: {
    backgroundColor: '#f1f5f9',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 14,
  },

  emptyText: { color: COLORS.textLight, fontSize: 15, textAlign: 'center', marginTop: 20 },
});

export default ClassBirthdaysScreen;
