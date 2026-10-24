import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  TextInput,
  Modal,
  ActivityIndicator
} from 'react-native';
import { 
  ChevronRight, ChevronLeft, Calendar as CalendarIcon, 
  FileText, Users, CheckSquare, MessageCircle, 
  X, User, Plus, BadgeCheck
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../theme/colors';
import { api } from '../../api/axiosConfig';
import { PlanningService } from '../../api/planningService';
import { toJalaali, toGregorian } from 'jalaali-js';

const { width, height } = Dimensions.get('window');

// --- Mock Data & Dynamic Days ---
const MONTHS = ['مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی'];
const WEEKS = [
  { id: 1, title: 'هفته اول' },
  { id: 2, title: 'هفته دوم' },
  { id: 3, title: 'هفته سوم' },
  { id: 4, title: 'هفته چهارم' },
  { id: 5, title: 'هفته پنجم' },
];
const FILTERS = [
  { id: 'attendance', title: 'حضورغیاب', icon: User },
  { id: 'exam', title: 'آزمون', icon: FileText },
  { id: 'activity', title: 'فعالیت کلاس', icon: Users },
  { id: 'homework', title: 'بررسی تکالیف', icon: CheckSquare },
  { id: 'question', title: 'پرسش کلاسی', icon: MessageCircle },
];

const getWeekDays = (monthName: string, weekId: number) => {
  const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  const dayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']; 
  
  const today = new Date();
  const todayJ = toJalaali(today);
  const currentYear = todayJ.jy;
  
  const jm = monthNames.indexOf(monthName) + 1;
  if (jm === 0) return [];

  const firstDayG = toGregorian(currentYear, jm, 1);
  const firstDayDate = new Date(firstDayG.gy, firstDayG.gm - 1, firstDayG.gd);
  const firstDayOfWeek = firstDayDate.getDay(); 
  
  const diffToSaturday = (firstDayOfWeek + 1) % 7;
  
  const firstSaturday = new Date(firstDayDate);
  firstSaturday.setDate(firstSaturday.getDate() - diffToSaturday);
  
  const targetSaturday = new Date(firstSaturday);
  targetSaturday.setDate(targetSaturday.getDate() + (weekId - 1) * 7);
  
  const weekDays = [];
  const todayStr = `${todayJ.jy}/${todayJ.jm.toString().padStart(2, '0')}/${todayJ.jd.toString().padStart(2, '0')}`;

  for (let i = 0; i < 7; i++) {
    const d = new Date(targetSaturday);
    d.setDate(d.getDate() + i);
    const jDate = toJalaali(d);
    const fullDate = `${jDate.jy}/${jDate.jm.toString().padStart(2, '0')}/${jDate.jd.toString().padStart(2, '0')}`;
    const dow = d.getDay();
    const gregorianDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    weekDays.push({
      id: `day_${jDate.jm}_${jDate.jd}`,
      name: dayNames[dow],
      date: `${jDate.jd} ${monthNames[jDate.jm - 1]}`,
      fullDate,
      isToday: fullDate === todayStr,
      gregorianDate,
      dowJalali: dow
    });
  }
  return weekDays;
};

// --- Helpers ---
const getEventStyles = (type: string, isDark = false) => {
  if (isDark) {
    switch(type) {
      case 'good': return { bg: '#064e3b', text: '#6ee7b7', border: '#047857' }; 
      case 'warning': return { bg: '#713f12', text: '#fde047', border: '#a16207' }; 
      case 'danger': return { bg: '#7f1d1d', text: '#fca5a5', border: '#b91c1c' }; 
      case 'note': return { bg: '#312e81', text: '#c7d2fe', border: '#4338ca' }; 
      default: return { bg: '#1e293b', text: '#cbd5e1', border: '#334155' }; 
    }
  }
  switch(type) {
    case 'good': return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' }; 
    case 'warning': return { bg: '#fef9c3', text: '#854d0e', border: '#fef08a' }; 
    case 'danger': return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' }; 
    case 'note': return { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' }; 
    default: return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' }; 
  }
};

const renderEventChip = (event: any, isDetailed = false, isDark = false) => {
  const chipStyle = getEventStyles(event.color || event.type, isDark);
  return (
    <View key={event._id || event.id} style={[chipStyles.container, { backgroundColor: chipStyle.bg, borderColor: chipStyle.border, padding: isDetailed ? 8 : 6 }]}>
      <Text 
        style={[chipStyles.text, { color: chipStyle.text, fontSize: isDetailed ? 12 : 10 }]} 
        numberOfLines={isDetailed ? undefined : 3}
      >
        {event.title}
      </Text>
    </View>
  );
};

const GradebookTable = ({ classId, classroom }: any) => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();

  const tableScrollRef = useRef<any>(null);
  const filterScrollRef = useRef<any>(null);
  const weekScrollRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const todayInit = new Date();
  const todayInitJ = toJalaali(todayInit);
  const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  const currentMonthName = monthNames[todayInitJ.jm - 1];

  const firstDayG = toGregorian(todayInitJ.jy, todayInitJ.jm, 1);
  const firstDayDate = new Date(firstDayG.gy, firstDayG.gm - 1, firstDayG.gd);
  const diffToSaturday = (firstDayDate.getDay() + 1) % 7;
  const firstSaturday = new Date(firstDayDate);
  firstSaturday.setDate(firstSaturday.getDate() - diffToSaturday);
  const daysDiff = Math.floor((todayInit.getTime() - firstSaturday.getTime()) / (1000 * 60 * 60 * 24));
  const currentWeekIndex = Math.floor(daysDiff / 7) + 1;

  const [activeMonth, setActiveMonth] = useState(currentMonthName);
  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [activeWeek, setActiveWeek] = useState(currentWeekIndex >= 1 && currentWeekIndex <= 5 ? currentWeekIndex : 1);
  const [activeFilter, setActiveFilter] = useState('attendance');

  const DAYS = React.useMemo(() => getWeekDays(activeMonth, activeWeek), [activeMonth, activeWeek]);

  useEffect(() => {
    tableScrollRef.current?.scrollToEnd({ animated: false });
  }, [activeWeek, activeMonth]);
  
  const [students, setStudents] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<any[]>([]);
  const [classSessions, setClassSessions] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [classHomeworks, setClassHomeworks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});

  // Bottom Sheet Details State
  const [selectedDay, setSelectedDay] = useState<{ student: any; day: any } | null>(null);
  const [selectedAttendance, setSelectedAttendance] = useState<{ student: any; day: any; subjects: any[] } | null>(null);
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
  const [selectedHomeworkModal, setSelectedHomeworkModal] = useState<{ homework: any; student: any; day: any; currentStatus?: string } | null>(null);
  const [isUpdatingHw, setIsUpdatingHw] = useState(false);

  // Form states for adding new description
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState('good');
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!classId) return;
    setIsLoading(true);
    try {
      console.log(`[GradebookTable] Fetching data for class ${classId}, filter: ${activeFilter}`);
      const res = await api.get(`/teacher/classrooms/${classId}/gradebook`, {
        params: { filterType: activeFilter }
      });
      console.log('[GradebookTable] Response success:', res.data?.success, 'students count:', res.data?.data?.students?.length);
      
      let fetchedStudents = res.data?.data?.students || [];

      // If no students returned from gradebook endpoint, fallback to classroom students endpoint
      if (fetchedStudents.length === 0) {
        try {
          const studsRes = await api.get(`/teacher/classrooms/${classId}/students`);
          if (studsRes.data?.success && Array.isArray(studsRes.data?.data) && studsRes.data.data.length > 0) {
            fetchedStudents = studsRes.data.data.map((m: any) => {
              let name = m.studentPhone;
              if (m.studentId?.user?.fullName) {
                name = m.studentId.user.fullName;
              } else if (m.firstName || m.lastName) {
                name = `${m.firstName || ''} ${m.lastName || ''}`.trim();
              }
              return {
                _id: m.studentPhone || m._id,
                name: name || 'دانش‌آموز',
                phone: m.studentPhone,
                isVerified: !!m.isVerified
              };
            });
          }
        } catch (e) {
          console.log('[GradebookTable] Fallback students error:', e);
        }
      }

      // If still empty, check classroom prop
      if (fetchedStudents.length === 0 && classroom?.students && classroom.students.length > 0) {
        fetchedStudents = classroom.students.map((s: any) => ({
          _id: s.phone || s.studentPhone || s._id,
          name: s.name || (s.user ? s.user.fullName : `${s.firstName || ''} ${s.lastName || ''}`.trim()) || s.phone || 'دانش‌آموز',
          phone: s.phone || s.studentPhone,
          isVerified: !!s.isVerified
        }));
      }

      setStudents(fetchedStudents);
      setRecords(res.data?.data?.records || []);
      setWeeklySchedule(res.data?.data?.weeklySchedule || []);
      setClassSessions(res.data?.data?.classSessions || []);
      setAttendanceRecords(res.data?.data?.attendanceRecords || []);

      if (activeFilter === 'homework') {
        const hwRes = await PlanningService.getHomeworks({ classId });
        if (hwRes.success && hwRes.data) {
          setClassHomeworks(hwRes.data);
        }
      }
    } catch (err) {
      console.log('Error fetching gradebook data:', err);
      // Double fallback if request completely fails
      if (classroom?.students && classroom.students.length > 0) {
        setStudents(classroom.students.map((s: any) => ({
          _id: s.phone || s.studentPhone || s._id,
          name: s.name || (s.user ? s.user.fullName : `${s.firstName || ''} ${s.lastName || ''}`.trim()) || s.phone || 'دانش‌آموز',
          phone: s.phone || s.studentPhone,
          isVerified: !!s.isVerified
        })));
      }
    } finally {
      setIsLoading(false);
    }
  }, [classId, activeFilter, classroom]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRowLayout = (studentId: string, h: number) => {
    setRowHeights(prev => {
      if (!prev[studentId] || Math.abs(prev[studentId] - h) > 1) {
        return { ...prev, [studentId]: Math.max(h, 60) };
      }
      return prev;
    });
  };

  const getEventsForStudentAndDay = (studentId: string, fullDate: string) => {
    return records.filter(r => {
      const sId = r.student || r.studentId?._id || r.studentId || r.studentPhone;
      const rDate = r.date || r.dateJalali;
      return (sId === studentId || sId === studentId?.toString()) && (rDate === fullDate);
    });
  };

  const handleCellPress = (student: any, day: any, isEmpty: boolean) => {
    setSelectedDay({ student, day });
    setIsAddingNew(isEmpty);
    setNewDesc('');
    setNewColor('good');
  };

  const handleCloseSheet = () => {
    setSelectedDay(null);
    setIsAddingNew(false);
  };

  const handleSaveAttendance = async (subject: string, status: string) => {
    if (!selectedAttendance) return;
    const { student, day } = selectedAttendance;
    try {
      const res = await api.post(`/teacher/classrooms/${classId}/gradebook/attendance`, {
        studentPhone: student.phone || student._id,
        date: day.gregorianDate,
        subject,
        status
      });
      if (res.data?.success) {
        setAttendanceModalVisible(false);
        fetchData();
      }
    } catch (e) {
      console.warn('Error saving attendance from gradebook:', e);
    }
  };

  const handleUpdateGradebookHomeworkStatus = async (status: 'DONE' | 'NOT_DONE' | 'PENDING') => {
    if (!selectedHomeworkModal) return;
    setIsUpdatingHw(true);
    try {
      const { homework, student } = selectedHomeworkModal;
      const sPhone = student.phone || student._id;
      const res = await PlanningService.reviewStudentHomework(homework._id, sPhone, {
        status: status as any,
        teacherFeedback: `بررسی‌شده از دفتر نمره (${status === 'DONE' ? 'انجام داده' : status === 'NOT_DONE' ? 'انجام نداده' : 'در انتظار'})`
      });
      if (res.success) {
        setSelectedHomeworkModal(null);
        fetchData();
      }
    } catch (e) {
      console.warn('Error updating hw from gradebook:', e);
    } finally {
      setIsUpdatingHw(false);
    }
  };

  const handleSaveNewDesc = async () => {
    if (!newDesc.trim() || !selectedDay) return;
    setIsSaving(true);
    try {
      const res = await api.post(`/teacher/classrooms/${classId}/gradebook`, {
        studentId: selectedDay.student._id || selectedDay.student.phone,
        date: selectedDay.day.fullDate,
        title: newDesc.trim(),
        type: activeFilter,
        color: newColor
      });
      if (res.data?.success) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsAddingNew(false);
        setNewDesc('');
        fetchData();
      }
    } catch (err) {
      console.log('Error saving record:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.surface, 
      marginHorizontal: -20, 
      marginTop: 24, 
      borderTopWidth: 1, 
      borderBottomWidth: 1, 
      borderColor: colors.border 
    }]}>
      {/* --- Top Controls --- */}
      <View style={[styles.topControls, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleContainer}>
           <Text style={[styles.headerTitle, { color: colors.text }]}>دفتر نمره کلاس</Text>
        </View>

        <View style={[styles.compactSelectorRow, { flexDirection: 'row-reverse' }]}>
           <TouchableOpacity 
             style={[styles.compactMonthBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: colors.border }]} 
             onPress={() => setMonthModalVisible(true)}
             activeOpacity={0.7}
           >
             <ChevronRight size={18} color={colors.textLight} />
             <Text style={[styles.compactMonthText, { color: colors.text }]}>{activeMonth}</Text>
             <ChevronLeft size={18} color={colors.textLight} />
           </TouchableOpacity>
           
           <ScrollView 
             ref={weekScrollRef}
             horizontal 
             showsHorizontalScrollIndicator={false} 
             style={{ flex: 1 }} 
             contentContainerStyle={{ flexDirection: 'row-reverse' }}
             onContentSizeChange={() => {
               weekScrollRef.current?.scrollToEnd({ animated: false });
             }}
           >
             <View style={{ flexDirection: 'row-reverse', paddingLeft: 8 }}>
               {WEEKS.map(w => (
                 <TouchableOpacity 
                   key={w.id} 
                   style={[
                     styles.compactWeekBtn, 
                     { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: colors.border },
                     activeWeek === w.id && { backgroundColor: colors.primary, borderColor: colors.primary }
                   ]}
                   onPress={() => setActiveWeek(w.id)}
                   activeOpacity={0.7}
                 >
                   <Text style={[
                     styles.compactWeekText, 
                     { color: colors.textLight },
                     activeWeek === w.id && { color: '#fff' }
                   ]}>{w.title}</Text>
                 </TouchableOpacity>
               ))}
             </View>
           </ScrollView>
        </View>

        <ScrollView 
          ref={filterScrollRef}
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={[styles.filterScroll, { flexDirection: 'row-reverse' }]}
          onContentSizeChange={() => {
            filterScrollRef.current?.scrollToEnd({ animated: false });
          }}
        >
          {FILTERS.map(f => {
            const Icon = f.icon;
            const isActive = activeFilter === f.id;
            return (
              <TouchableOpacity 
                key={f.id} 
                style={[
                  styles.filterPill, 
                  { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: colors.border },
                  isActive && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => setActiveFilter(f.id)} 
                activeOpacity={0.7}
              >
                <Icon size={16} color={isActive ? '#fff' : colors.textLight} style={{marginLeft: 6}} />
                <Text style={[styles.filterText, { color: colors.textLight }, isActive && { color: '#fff' }]}>{f.title}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* --- Main Table Area (Right-to-Left RTL Alignment) --- */}
      {isLoading ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : students.length === 0 ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <Text style={{ fontFamily: 'IRANSansX', color: colors.textLight }}>هیچ دانش‌آموزی در این کلاس یافت نشد.</Text>
        </View>
      ) : (
        <View style={{ backgroundColor: colors.surface, flexDirection: 'row-reverse' }}>
          
          {/* 1. Fixed Student Name Column on the RIGHT */}
          <View style={{ width: 110, zIndex: 10, elevation: 10, backgroundColor: colors.surface, borderLeftWidth: 1, borderLeftColor: colors.border }}>
             <View style={[styles.tableHeaderCell, { width: 110, borderLeftWidth: 0, backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderBottomColor: colors.border }]}>
                <Text style={[styles.tableHeaderText, { color: colors.text }]}>نام و نام خانوادگی</Text>
             </View>
             
             <View>
                {students.map((student, index) => (
                   <TouchableOpacity 
                     key={student._id || index} 
                     style={[
                       styles.studentCell, 
                       { height: rowHeights[student._id] || 60, width: 110, borderLeftWidth: 0, justifyContent: 'center', backgroundColor: colors.surface, borderBottomColor: colors.border }
                     ]}
                     onPress={() => navigation.navigate('StudentProfileViewScreen', {
                        studentPhone: student.phone || student._id,
                        classId: classId,
                        className: classroom?.name || 'کلاس'
                     })}
                     activeOpacity={0.7}
                   >
                      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'flex-start', paddingHorizontal: 6 }}>
                        <Text style={[styles.studentName, { flex: 1, textAlign: 'right', color: colors.text }]} numberOfLines={2}>
                          {index + 1}- {student.name}
                        </Text>
                        {student.isVerified ? (
                          <BadgeCheck size={13} color="#0284c7" fill="#0284c7" style={{ marginRight: 3 }} />
                        ) : null}
                      </View>
                   </TouchableOpacity>
                ))}
             </View>
          </View>

          {/* 2. Scrollable Days Table to its LEFT (progressing from right to left) */}
          <ScrollView 
            ref={tableScrollRef}
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={{ flex: 1 }} 
            bounces={false} 
            contentContainerStyle={{ flexDirection: 'row-reverse' }}
            onContentSizeChange={() => {
              tableScrollRef.current?.scrollToEnd({ animated: false });
            }}
          >
             <View>
                <View style={[styles.daysHeaderRow, { flexDirection: 'row-reverse', borderBottomColor: colors.border }]}>
                   {DAYS.map(day => (
                      <View key={day.id} style={[
                        styles.dayHeaderCell, 
                        { backgroundColor: colors.surface, borderLeftColor: colors.border, borderLeftWidth: 1 },
                        day.isToday && { backgroundColor: isDark ? '#1e3a5f' : '#eff6ff' }
                      ]}>
                        {day.isToday && <View style={[styles.todayBadge, { backgroundColor: colors.primary }]}><Text style={styles.todayBadgeText}>امروز</Text></View>}
                        <Text style={[styles.dayName, { color: colors.text }, day.isToday && { color: isDark ? '#60a5fa' : colors.primary }]}>{day.name}</Text>
                        <Text style={[styles.dayDate, { color: colors.textLight }]}>{day.date}</Text>
                      </View>
                   ))}
                </View>

                <View>
                   {students.map((student: any) => (
                      <View 
                         key={student._id}
                         style={[styles.dataRow, { flexDirection: 'row-reverse', borderBottomColor: colors.border }]} 
                         onLayout={(e) => handleRowLayout(student._id, e.nativeEvent.layout.height)}
                      >
                         {DAYS.map(day => {
                            if (activeFilter === 'attendance') {
                               const isFuture = new Date(`${day.gregorianDate}T00:00:00`).getTime() > new Date().setHours(0,0,0,0);
                               if (isFuture) {
                                  return (
                                     <View key={day.id} style={[styles.dataCell, { backgroundColor: colors.surface, borderLeftColor: colors.border, borderLeftWidth: 1 }, day.isToday && { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                                        <Text style={{ fontSize: 10, color: colors.textLight, textAlign: 'center', fontFamily: 'IRANSansX' }}>برگزار نشده</Text>
                                     </View>
                                  )
                               }
                               const subjects = weeklySchedule.filter((s: any) => s.dayOfWeek === day.dowJalali);
                               if (subjects.length === 0) {
                                  return <View key={day.id} style={[styles.dataCell, { backgroundColor: colors.surface, borderLeftColor: colors.border, borderLeftWidth: 1 }, day.isToday && { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]} />
                               }
                               
                               return (
                                  <TouchableOpacity 
                                     key={day.id}
                                     style={[styles.dataCell, { backgroundColor: colors.surface, borderLeftColor: colors.border, borderLeftWidth: 1, paddingVertical: 4 }, day.isToday && { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                                     onPress={() => {
                                        setSelectedAttendance({ student, day, subjects });
                                        setAttendanceModalVisible(true);
                                     }}
                                     activeOpacity={0.7}
                                  >
                                     {subjects.map((subj: any) => {
                                        const session = classSessions.find((s: any) => s.date === day.gregorianDate && s.subject === subj.subject);
                                        const record = session ? attendanceRecords.find((a: any) => a.studentPhone === (student.phone || student._id) && a.sessionId === session._id) : null;
                                        const status = record ? record.status : 'PRESENT';
                                        const statusText = status === 'PRESENT' ? 'حاضر' : status === 'LATE' ? 'تاخیر' : status === 'ABSENT_EXCUSED' ? 'غ موجه' : 'غ غیرموجه';
                                        const statusColor = isDark
                                          ? (status === 'PRESENT' ? '#6ee7b7' : status === 'LATE' ? '#fde047' : status === 'ABSENT_EXCUSED' ? '#facc15' : '#fca5a5')
                                          : (status === 'PRESENT' ? '#166534' : status === 'LATE' ? '#854d0e' : status === 'ABSENT_EXCUSED' ? '#ca8a04' : '#991b1b');
                                        const bg = isDark
                                          ? (status === 'PRESENT' ? '#064e3b' : status === 'LATE' ? '#713f12' : status === 'ABSENT_EXCUSED' ? '#713f12' : '#7f1d1d')
                                          : (status === 'PRESENT' ? '#dcfce7' : status === 'LATE' ? '#fef9c3' : status === 'ABSENT_EXCUSED' ? '#fef08a' : '#fee2e2');
                                        
                                        return (
                                           <View key={subj._id} style={{ backgroundColor: bg, padding: 4, borderRadius: 4, marginBottom: 4 }}>
                                              <Text style={{ fontSize: 9, color: statusColor, textAlign: 'center', fontWeight: 'bold', fontFamily: 'IRANSansX' }}>{subj.subject} - {statusText}</Text>
                                           </View>
                                        )
                                     })}
                                  </TouchableOpacity>
                               )
                            }
                            
                            if (activeFilter === 'homework') {
                               const sPhone = student.phone || student._id;
                               const matchedHws = classHomeworks.filter((hw: any) => {
                                 const isTarget = hw.isForAllStudents || (hw.targetStudentPhones && hw.targetStudentPhones.includes(sPhone));
                                 if (!isTarget) return false;
                                 return (
                                   hw.dueDate === day.gregorianDate ||
                                   hw.dueDateJalali === day.fullDate ||
                                   hw.dueDate === day.fullDate
                                 );
                               });

                               if (matchedHws.length === 0) {
                                  return (
                                     <View key={day.id} style={[styles.dataCell, { backgroundColor: colors.surface, borderLeftColor: colors.border, borderLeftWidth: 1 }, day.isToday && { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                                        <Text style={{ fontSize: 9.5, color: colors.textLight, textAlign: 'center', fontFamily: 'IRANSansX' }}>—</Text>
                                     </View>
                                  );
                               }

                               return (
                                  <View key={day.id} style={[styles.dataCell, { backgroundColor: colors.surface, borderLeftColor: colors.border, borderLeftWidth: 1, paddingVertical: 4 }, day.isToday && { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                                     {matchedHws.map((hw: any) => {
                                        const subRecord = hw.submissions?.find(
                                          (sub: any) => sub.studentPhone === sPhone || sub.studentId === student._id
                                        );
                                        const status = subRecord?.status || 'PENDING';
                                        const label = status === 'DONE' ? 'انجام داده' : status === 'NOT_DONE' ? 'انجام نداده' : 'بررسی نشده';
                                        const statusColor = isDark
                                          ? (status === 'DONE' ? '#6ee7b7' : status === 'NOT_DONE' ? '#fca5a5' : '#fde047')
                                          : (status === 'DONE' ? '#166534' : status === 'NOT_DONE' ? '#991b1b' : '#854d0e');
                                        const bg = isDark
                                          ? (status === 'DONE' ? '#064e3b' : status === 'NOT_DONE' ? '#7f1d1d' : '#713f12')
                                          : (status === 'DONE' ? '#dcfce7' : status === 'NOT_DONE' ? '#fee2e2' : '#fef9c3');

                                        return (
                                           <TouchableOpacity
                                              key={hw._id}
                                              style={{ backgroundColor: bg, padding: 4, borderRadius: 4, marginBottom: 4 }}
                                              onPress={() => setSelectedHomeworkModal({ homework: hw, student, day, currentStatus: status })}
                                              activeOpacity={0.7}
                                           >
                                              <Text style={{ fontSize: 8.5, color: statusColor, textAlign: 'center', fontWeight: 'bold', fontFamily: 'IRANSansX' }} numberOfLines={1}>
                                                 {hw.title}
                                              </Text>
                                              <Text style={{ fontSize: 8, color: statusColor, textAlign: 'center', fontFamily: 'IRANSansX', marginTop: 1 }}>
                                                 {label}
                                              </Text>
                                           </TouchableOpacity>
                                        );
                                     })}
                                  </View>
                               );
                            }

                            // Other Filters (exam, activity, question)
                            const events = getEventsForStudentAndDay(student._id, day.fullDate);
                            const isEmpty = events.length === 0;

                            return (
                               <TouchableOpacity 
                                  key={day.id}
                                  style={[styles.dataCell, { backgroundColor: colors.surface, borderLeftColor: colors.border, borderLeftWidth: 1 }, day.isToday && { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                                  onPress={() => handleCellPress(student, day, isEmpty)}
                                  activeOpacity={0.7}
                               >
                                  {isEmpty ? (
                                    <View style={[styles.emptyCellBtn, { borderColor: isDark ? '#334155' : '#bfdbfe' }]}>
                                       <Plus size={14} color={isDark ? '#60a5fa' : colors.primary} />
                                       <Text style={[styles.emptyCellText, { color: isDark ? '#60a5fa' : colors.primary }]}>افزودن فعالیت</Text>
                                    </View>
                                  ) : (
                                    events.map((ev: any) => renderEventChip(ev, false, isDark))
                                  )}
                               </TouchableOpacity>
                            )
                         })}
                      </View>
                   ))}
                </View>
             </View>
          </ScrollView>
        </View>
      )}

      {/* --- Bottom Detail View (Sheet) --- */}
      <Modal visible={!!selectedDay} transparent animationType="slide" onRequestClose={handleCloseSheet}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleCloseSheet} />
          {selectedDay && (
            <View style={[styles.bottomSheet, { position: 'relative', paddingBottom: 24, borderTopWidth: 0, elevation: 0, backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
               <TouchableOpacity onPress={handleCloseSheet}>
                  <X size={20} color={colors.textLight} />
               </TouchableOpacity>
               <View style={styles.sheetHeaderRight}>
                  <CalendarIcon size={16} color={colors.textLight} style={{marginLeft: 6}} />
                  <Text style={[styles.sheetDateText, { color: colors.text }]}>جزئیات روز: {selectedDay.day.name} {selectedDay.day.date}</Text>
               </View>
            </View>
            <View style={styles.sheetBody}>
               <View style={[styles.sheetStudentInfo, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                  <View style={[styles.sheetAvatar, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}><User size={20} color={colors.textLight}/></View>
                  <Text style={[styles.sheetStudentName, { color: colors.text }]}>{selectedDay.student.name}</Text>
               </View>
               
               {!isAddingNew && (
                 <View style={styles.sheetEventsList}>
                    {getEventsForStudentAndDay(selectedDay.student._id, selectedDay.day.fullDate).map((ev: any) => (
                       <View key={'det-'+ev._id} style={{width: 120, marginLeft: 10}}>
                         {renderEventChip(ev, true, isDark)}
                       </View>
                    ))}
                    {getEventsForStudentAndDay(selectedDay.student._id, selectedDay.day.fullDate).length === 0 && (
                      <Text style={[styles.sheetEmpty, { color: colors.textLight }]}>موردی ثبت نشده است.</Text>
                    )}
                 </View>
               )}
            </View>

            {/* Add New Description Section */}
            {isAddingNew ? (
              <View style={[styles.addNewContainer, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}>
                 <Text style={[styles.addNewTitle, { color: colors.text }]}>افزودن توصیف جدید</Text>
                 <TextInput 
                   style={[styles.addInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                   placeholder="متن توصیف یا نمره را بنویسید..."
                   placeholderTextColor={colors.textLight}
                   multiline
                   value={newDesc}
                   onChangeText={setNewDesc}
                 />
                 <View style={[styles.colorPicker, { flexDirection: 'row-reverse' }]}>
                    {['good', 'warning', 'danger', 'note'].map(color => (
                      <TouchableOpacity 
                        key={color} 
                        style={[
                          styles.colorCircle, 
                          { backgroundColor: getEventStyles(color, isDark).bg, borderColor: newColor === color ? getEventStyles(color, isDark).text : 'transparent' }
                        ]}
                        onPress={() => setNewColor(color)}
                      />
                    ))}
                 </View>
                 <View style={[styles.addActions, { flexDirection: 'row-reverse' }]}>
                    <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSaveNewDesc} disabled={isSaving}>
                      {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>ثبت توصیف</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAddingNew(false)}>
                      <Text style={[styles.cancelBtnText, { color: colors.textLight }]}>انصراف</Text>
                    </TouchableOpacity>
                 </View>
              </View>
            ) : (
              <TouchableOpacity style={[styles.addNewBtn, { backgroundColor: isDark ? '#1e3a5f' : '#eff6ff', borderColor: isDark ? '#2563eb' : '#bfdbfe' }]} onPress={() => {
                 LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                 setIsAddingNew(true);
              }}>
                 <Plus size={16} color={isDark ? '#93c5fd' : colors.primary} style={{marginLeft: 6}} />
                 <Text style={[styles.addNewBtnText, { color: isDark ? '#93c5fd' : colors.primary }]}>افزودن توصیف</Text>
              </TouchableOpacity>
            )}
            </View>
          )}
        </View>
      </Modal>

      {/* Month Selection Modal */}
      <Modal visible={monthModalVisible} transparent animationType="fade">
         <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMonthModalVisible(false)}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
               <Text style={[styles.modalTitle, { color: colors.text }]}>انتخاب ماه</Text>
               <View style={[styles.modalMonthsGrid, { flexDirection: 'row-reverse' }]}>
                  {MONTHS.map(m => (
                    <TouchableOpacity 
                      key={m} 
                      style={[
                        styles.modalMonthBtn, 
                        { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }, 
                        activeMonth === m && { backgroundColor: colors.primary }
                      ]}
                      onPress={() => {
                        setActiveMonth(m);
                        setMonthModalVisible(false);
                      }}
                    >
                      <Text style={[
                        styles.modalMonthText, 
                        { color: colors.text }, 
                        activeMonth === m && { color: '#fff', fontWeight: 'bold' }
                      ]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
               </View>
            </View>
         </TouchableOpacity>
      </Modal>

      {/* --- Attendance Bottom Sheet --- */}
      <Modal visible={attendanceModalVisible} transparent animationType="slide" onRequestClose={() => setAttendanceModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setAttendanceModalVisible(false)} />
          {selectedAttendance && (
            <View style={[styles.bottomSheet, { position: 'relative', paddingBottom: 24, borderTopWidth: 0, elevation: 0, backgroundColor: colors.surface, borderColor: colors.border }]}>
               <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
                  <TouchableOpacity onPress={() => setAttendanceModalVisible(false)}>
                     <X size={20} color={colors.textLight} />
                  </TouchableOpacity>
                  <View style={styles.sheetHeaderRight}>
                     <CalendarIcon size={16} color={colors.textLight} style={{marginLeft: 6}} />
                     <Text style={[styles.sheetDateText, { color: colors.text }]}>حضور غیاب: {selectedAttendance.day.name} {selectedAttendance.day.date}</Text>
                  </View>
               </View>
               <View style={styles.sheetBody}>
                  <View style={[styles.sheetStudentInfo, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                     <View style={[styles.sheetAvatar, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}><User size={20} color={colors.textLight}/></View>
                     <Text style={[styles.sheetStudentName, { color: colors.text }]}>{selectedAttendance.student.name}</Text>
                  </View>

                  <ScrollView style={{ marginTop: 16, maxHeight: height * 0.6 }}>
                     {selectedAttendance.subjects.map((subj: any) => {
                         const session = classSessions.find((s: any) => s.date === selectedAttendance.day.gregorianDate && s.subject === subj.subject);
                         const record = session ? attendanceRecords.find((a: any) => a.studentPhone === (selectedAttendance.student.phone || selectedAttendance.student._id) && a.sessionId === session._id) : null;
                         const currentStatus = record ? record.status : 'PRESENT';

                         return (
                            <View key={subj._id} style={{ marginBottom: 16, backgroundColor: isDark ? '#1e293b' : '#f8fafc', padding: 12, borderRadius: 12 }}>
                               <Text style={{ fontFamily: 'IRANSansX', fontWeight: 'bold', fontSize: 14, color: colors.text, marginBottom: 12, textAlign: 'right' }}>
                                  درس {subj.subject}
                               </Text>
                                
                               <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                                  {[
                                     { id: 'PRESENT', label: 'حاضر', color: isDark ? '#6ee7b7' : '#166534', bg: isDark ? '#064e3b' : '#dcfce7' },
                                     { id: 'LATE', label: 'تاخیر', color: isDark ? '#fde047' : '#854d0e', bg: isDark ? '#713f12' : '#fef9c3' },
                                     { id: 'ABSENT_EXCUSED', label: 'غ موجه', color: isDark ? '#facc15' : '#ca8a04', bg: isDark ? '#713f12' : '#fef08a' },
                                     { id: 'ABSENT_UNEXCUSED', label: 'غ غیرموجه', color: isDark ? '#fca5a5' : '#991b1b', bg: isDark ? '#7f1d1d' : '#fee2e2' },
                                  ].map(statusOpt => (
                                     <TouchableOpacity 
                                        key={statusOpt.id}
                                        style={{
                                           paddingVertical: 8,
                                           paddingHorizontal: 12,
                                           borderRadius: 8,
                                           backgroundColor: currentStatus === statusOpt.id ? statusOpt.bg : (isDark ? '#0f172a' : '#fff'),
                                           borderWidth: 1,
                                           borderColor: currentStatus === statusOpt.id ? statusOpt.color : colors.border,
                                           marginBottom: 8,
                                           minWidth: '48%',
                                           alignItems: 'center'
                                        }}
                                        onPress={() => handleSaveAttendance(subj.subject, statusOpt.id)}
                                        activeOpacity={0.7}
                                     >
                                        <Text style={{ fontFamily: 'IRANSansX', fontSize: 12, color: currentStatus === statusOpt.id ? statusOpt.color : colors.textLight, fontWeight: currentStatus === statusOpt.id ? 'bold' : 'normal' }}>
                                           {statusOpt.label}
                                        </Text>
                                     </TouchableOpacity>
                                  ))}
                               </View>
                            </View>
                         )
                     })}
                  </ScrollView>
               </View>
            </View>
          )}
        </View>
      </Modal>

      {/* --- Homework Status Bottom Sheet --- */}
      <Modal visible={!!selectedHomeworkModal} transparent animationType="slide" onRequestClose={() => setSelectedHomeworkModal(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setSelectedHomeworkModal(null)} />
          {selectedHomeworkModal && (
            <View style={[styles.bottomSheet, { position: 'relative', paddingBottom: 28, borderTopWidth: 0, elevation: 0, backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => setSelectedHomeworkModal(null)}>
                  <X size={20} color={colors.textLight} />
                </TouchableOpacity>
                <View style={styles.sheetHeaderRight}>
                  <CheckSquare size={16} color={colors.primary} style={{ marginLeft: 6 }} />
                  <Text style={[styles.sheetDateText, { color: colors.text }]}>
                    بررسی تکلیف: {selectedHomeworkModal.homework.title}
                  </Text>
                </View>
              </View>

              <View style={styles.sheetBody}>
                <View style={[styles.sheetStudentInfo, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                  <View style={[styles.sheetAvatar, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}><User size={20} color={colors.textLight} /></View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={[styles.sheetStudentName, { color: colors.text }]}>{selectedHomeworkModal.student.name}</Text>
                    <Text style={{ fontSize: 11, color: colors.textLight, fontFamily: 'IRANSansX', marginTop: 2 }}>
                      تاریخ موعد: {selectedHomeworkModal.day.name} {selectedHomeworkModal.day.date}
                    </Text>
                  </View>
                </View>

                <Text style={{ fontFamily: 'IRANSansX', fontWeight: 'bold', fontSize: 13, color: colors.text, marginTop: 16, marginBottom: 10, textAlign: 'right' }}>
                  انتخاب وضعیت تکلیف:
                </Text>

                {isUpdatingHw ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ padding: 20 }} />
                ) : (
                  <View style={{ gap: 8 }}>
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row-reverse',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 12,
                        borderRadius: 10,
                        backgroundColor: isDark ? '#064e3b' : '#dcfce7',
                        borderWidth: 1,
                        borderColor: isDark ? '#047857' : '#86efac',
                      }}
                      onPress={() => handleUpdateGradebookHomeworkStatus('DONE')}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontFamily: 'IRANSansX', fontWeight: 'bold', fontSize: 13, color: isDark ? '#6ee7b7' : '#166534' }}>
                        ✓ انجام شده است
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        flexDirection: 'row-reverse',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 12,
                        borderRadius: 10,
                        backgroundColor: isDark ? '#7f1d1d' : '#fee2e2',
                        borderWidth: 1,
                        borderColor: isDark ? '#b91c1c' : '#fca5a5',
                      }}
                      onPress={() => handleUpdateGradebookHomeworkStatus('NOT_DONE')}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontFamily: 'IRANSansX', fontWeight: 'bold', fontSize: 13, color: isDark ? '#fca5a5' : '#991b1b' }}>
                        ✕ انجام نشده
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        flexDirection: 'row-reverse',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 12,
                        borderRadius: 10,
                        backgroundColor: isDark ? '#713f12' : '#fef3c7',
                        borderWidth: 1,
                        borderColor: isDark ? '#a16207' : '#fde68a',
                      }}
                      onPress={() => handleUpdateGradebookHomeworkStatus('PENDING')}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontFamily: 'IRANSansX', fontWeight: 'bold', fontSize: 13, color: isDark ? '#fde047' : '#92400e' }}>
                        ⏳ در انتظار بررسی
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const chipStyles = StyleSheet.create({
  container: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  text: {
    fontFamily: 'IRANSansX',
    textAlign: 'center',
    lineHeight: 16,
  }
});

const styles = StyleSheet.create({
  container: { 
    backgroundColor: '#f8fafc' 
  },
  topControls: { 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border, 
    paddingTop: 16 
  },
  headerTitleContainer: { 
    alignItems: 'flex-end', 
    paddingHorizontal: 20, 
    marginBottom: 16 
  },
  headerTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: COLORS.text, 
    textAlign: 'right', 
    width: '100%',
    fontFamily: 'IRANSansX'
  },
  
  compactSelectorRow: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginBottom: 16 
  },
  compactMonthBtn: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    backgroundColor: '#f1f5f9', 
    paddingHorizontal: 8, 
    paddingVertical: 8, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  compactMonthText: { 
    marginHorizontal: 8, 
    fontSize: 13, 
    fontWeight: 'bold', 
    color: COLORS.text,
    fontFamily: 'IRANSansX'
  },
  compactWeekBtn: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: 10, 
    marginLeft: 8 
  },
  compactWeekBtnActive: { 
    backgroundColor: COLORS.primary, 
    borderColor: COLORS.primary 
  },
  compactWeekText: { 
    fontSize: 13, 
    color: COLORS.textLight, 
    fontWeight: 'bold',
    fontFamily: 'IRANSansX'
  },
  compactWeekTextActive: { 
    color: '#fff' 
  },

  filterScroll: { 
    flexDirection: 'row-reverse', 
    paddingHorizontal: 20, 
    marginBottom: 16 
  },
  filterPill: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: 20, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    marginLeft: 8 
  },
  filterPillActive: { 
    backgroundColor: COLORS.primary, 
    borderColor: COLORS.primary 
  },
  filterText: { 
    fontSize: 13, 
    color: COLORS.textLight, 
    fontWeight: '600',
    fontFamily: 'IRANSansX'
  },
  filterTextActive: { 
    color: '#fff' 
  },
  
  // Table 
  daysHeaderRow: { 
    flexDirection: 'row-reverse', 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border 
  },
  tableHeaderCell: { 
    height: 70, 
    justifyContent: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border, 
    backgroundColor: '#f8fafc' 
  },
  tableHeaderText: { 
    fontSize: 11.5, 
    fontWeight: 'bold', 
    color: COLORS.text, 
    textAlign: 'center',
    fontFamily: 'IRANSansX'
  },
  
  dayHeaderCell: { 
    width: 100, 
    height: 70, 
    paddingVertical: 6, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderLeftWidth: 1, 
    borderLeftColor: COLORS.border, 
    backgroundColor: '#fff' 
  },
  dayHeaderCellToday: { 
    backgroundColor: '#eff6ff' 
  },
  todayBadge: { 
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 8, 
    marginBottom: 4 
  },
  todayBadgeText: { 
    fontSize: 9, 
    color: '#fff', 
    fontWeight: 'bold',
    fontFamily: 'IRANSansX'
  },
  dayName: { 
    fontSize: 13, 
    fontWeight: 'bold', 
    color: COLORS.text, 
    marginBottom: 2,
    fontFamily: 'IRANSansX'
  },
  dayNameToday: { 
    color: COLORS.primary 
  },
  dayDate: { 
    fontSize: 11, 
    color: COLORS.textLight,
    fontFamily: 'IRANSansX'
  },
  
  dataRow: { 
    flexDirection: 'row-reverse', 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border, 
    minHeight: 60 
  },
  studentCell: { 
    justifyContent: 'center', 
    borderLeftWidth: 1, 
    borderLeftColor: COLORS.border, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border, 
    paddingHorizontal: 6, 
    backgroundColor: '#fff', 
    minHeight: 60 
  },
  studentName: { 
    fontSize: 11.5, 
    fontWeight: 'bold', 
    color: COLORS.text, 
    textAlign: 'right', 
    writingDirection: 'rtl', 
    lineHeight: 18,
    fontFamily: 'IRANSansX'
  },
  
  dataCell: { 
    width: 100, 
    minHeight: 60, 
    padding: 6, 
    borderLeftWidth: 1, 
    borderLeftColor: COLORS.border, 
    backgroundColor: '#fff', 
    justifyContent: 'center' 
  },
  dataCellToday: { 
    backgroundColor: '#f8fafc' 
  },
  emptyCellBtn: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#bfdbfe', 
    borderStyle: 'dashed', 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 4, 
    minHeight: 40 
  },
  emptyCellText: { 
    color: COLORS.primary, 
    fontSize: 9, 
    marginTop: 2, 
    fontWeight: 'bold', 
    textAlign: 'center',
    fontFamily: 'IRANSansX'
  },

  // Bottom Sheet
  bottomSheet: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    padding: 16, 
    zIndex: 100, 
    elevation: 100, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: -4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 10, 
    borderTopWidth: 1, 
    borderColor: COLORS.border 
  },
  sheetHeader: { 
    flexDirection: 'row-reverse', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border, 
    paddingBottom: 12 
  },
  sheetHeaderRight: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center' 
  },
  sheetDateText: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: COLORS.text,
    fontFamily: 'IRANSansX'
  },
  sheetBody: { 
    flexDirection: 'column', 
    alignItems: 'flex-start', 
    marginBottom: 10 
  },
  sheetStudentInfo: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    marginBottom: 16, 
    width: '100%', 
    backgroundColor: '#f8fafc', 
    padding: 8, 
    borderRadius: 10 
  },
  sheetAvatar: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#e2e8f0', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: 10 
  },
  sheetStudentName: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: COLORS.text,
    fontFamily: 'IRANSansX'
  },
  sheetEventsList: { 
    flexDirection: 'row-reverse', 
    flexWrap: 'wrap', 
    width: '100%' 
  },
  sheetEmpty: { 
    fontSize: 13, 
    color: COLORS.textLight, 
    marginTop: 4, 
    marginRight: 4,
    fontFamily: 'IRANSansX'
  },
  
  // Add New
  addNewBtn: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#eff6ff', 
    paddingVertical: 12, 
    borderRadius: 12, 
    marginTop: 10, 
    borderWidth: 1, 
    borderColor: '#bfdbfe', 
    borderStyle: 'dashed' 
  },
  addNewBtnText: { 
    color: COLORS.primary, 
    fontWeight: 'bold', 
    fontSize: 14,
    fontFamily: 'IRANSansX'
  },
  addNewContainer: { 
    backgroundColor: '#f8fafc', 
    padding: 12, 
    borderRadius: 12, 
    marginTop: 10, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  addNewTitle: { 
    fontSize: 13, 
    fontWeight: 'bold', 
    color: COLORS.text, 
    marginBottom: 8,
    fontFamily: 'IRANSansX',
    textAlign: 'right'
  },
  addInput: { 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: 8, 
    padding: 10, 
    fontFamily: 'IRANSansX', 
    fontSize: 13, 
    minHeight: 60, 
    textAlignVertical: 'top', 
    textAlign: 'right' 
  },
  colorPicker: { 
    flexDirection: 'row-reverse', 
    marginTop: 10, 
    marginBottom: 16 
  },
  colorCircle: { 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    marginLeft: 8, 
    borderWidth: 2 
  },
  addActions: { 
    flexDirection: 'row-reverse', 
    justifyContent: 'flex-start',
    gap: 8
  },
  cancelBtn: { 
    paddingHorizontal: 16, 
    paddingVertical: 8 
  },
  cancelBtnText: { 
    color: COLORS.textLight, 
    fontSize: 13, 
    fontFamily: 'IRANSansX' 
  },
  saveBtn: { 
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 20, 
    paddingVertical: 8, 
    borderRadius: 8 
  },
  saveBtnText: { 
    color: '#fff', 
    fontSize: 13, 
    fontWeight: 'bold', 
    fontFamily: 'IRANSansX' 
  },
  
  // Modal
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalContent: { 
    width: '80%', 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 20, 
    elevation: 10 
  },
  modalTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: COLORS.text, 
    textAlign: 'center', 
    marginBottom: 16,
    fontFamily: 'IRANSansX'
  },
  modalMonthsGrid: { 
    flexDirection: 'row-reverse', 
    flexWrap: 'wrap', 
    justifyContent: 'center' 
  },
  modalMonthBtn: { 
    width: '30%', 
    paddingVertical: 12, 
    margin: '1.5%', 
    alignItems: 'center', 
    backgroundColor: '#f1f5f9', 
    borderRadius: 10 
  },
  modalMonthBtnActive: { 
    backgroundColor: COLORS.primary 
  },
  modalMonthText: { 
    fontSize: 13, 
    color: COLORS.text,
    fontFamily: 'IRANSansX'
  },
  modalMonthTextActive: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontFamily: 'IRANSansX'
  }
});

export default GradebookTable;
