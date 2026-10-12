import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Settings, Users, BookOpen, BarChart2, Gift, Calendar, CheckSquare, Plus, FileText, StickyNote } from 'lucide-react-native';
import GradebookTable from '../../components/classes/GradebookTable';
import { PlanningService } from '../../api/planningService';
import { api } from '../../api/axiosConfig';
import { useFocusEffect } from '@react-navigation/native';

const ClassDetailsScreen = ({ route, navigation }: any) => {
  const { classroom, classId, className } = route.params;
  const currentClassId = classId || classroom?._id;
  const currentClassName = className || classroom?.name;
  const insets = useSafeAreaInsets();

  const [notes, setNotes] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);

  const fetchData = async () => {
    try {
      const [notesRes, scheduleRes] = await Promise.all([
        PlanningService.getNotes(undefined, currentClassId),
        api.get('/teacher/schedule', { params: { classId: currentClassId } })
      ]);
      if (notesRes.success && notesRes.data) {
        setNotes(notesRes.data);
      }
      if (scheduleRes.data.success) {
        console.log(`[ClassDetailsScreen] fetched schedule for class ${currentClassId}:`, scheduleRes.data.data.length, 'items');
        setSchedule(scheduleRes.data.data || []);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [currentClassId])
  );

  const groupedSchedule = React.useMemo(() => {
    console.log(`[ClassDetailsScreen] grouping schedule items... count: ${schedule.length}`);
    const daysMap = {
      6: { id: 6, name: 'شنبه', items: [] as any[] },
      0: { id: 0, name: 'یکشنبه', items: [] as any[] },
      1: { id: 1, name: 'دوشنبه', items: [] as any[] },
      2: { id: 2, name: 'سه‌شنبه', items: [] as any[] },
      3: { id: 3, name: 'چهارشنبه', items: [] as any[] },
      4: { id: 4, name: 'پنج‌شنبه', items: [] as any[] },
      5: { id: 5, name: 'جمعه', items: [] as any[] },
    };

    schedule.forEach((item) => {
      const dayIndex = item.dayOfWeek as keyof typeof daysMap;
      if (daysMap[dayIndex]) {
        daysMap[dayIndex].items.push(item);
      }
    });

    // Order from Saturday to Friday
    const orderedKeys: (keyof typeof daysMap)[] = [6, 0, 1, 2, 3, 4, 5];
    
    return orderedKeys
      .map(key => daysMap[key])
      .filter(d => d.items.length > 0);
  }, [schedule, currentClassId]);

  const handleSaveNote = async (noteData: any) => {
    const res = await PlanningService.createNote({ ...noteData, classId: currentClassId });
    if (res.success) {
      fetchData();
    }
  };

  const menuItems = [
    {
      id: 'STUDENTS',
      title: 'دانش‌آموزان',
      icon: <Users size={32} color={COLORS.primary} />,
      route: 'ClassStudentsScreen'
    },
    {
      id: 'EXAMS',
      title: 'آزمون‌ها',
      icon: <BookOpen size={32} color={COLORS.primary} />,
      route: 'ClassExamsScreen'
    },
    {
      id: 'REPORTS',
      title: 'گزارشات',
      icon: <BarChart2 size={32} color={COLORS.primary} />,
      route: 'ClassReportsScreen'
    },
    {
      id: 'BIRTHDAYS',
      title: 'تولدها',
      icon: <Gift size={32} color={COLORS.primary} />,
      route: 'ClassBirthdaysScreen'
    },
    {
      id: 'SCHEDULE',
      title: 'برنامه هفتگی',
      icon: <Calendar size={32} color={COLORS.primary} />,
      route: 'WeeklyScheduleBuilderScreen'
    },
    {
      id: 'ATTENDANCE',
      title: 'حضور و غیاب',
      icon: <CheckSquare size={32} color={COLORS.primary} />,
      route: 'ClassAttendanceScreen'
    }
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronRight size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{currentClassName}</Text>
          <Text style={styles.headerSubtitle}>داشبورد کلاس</Text>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => navigation.navigate('ClassSettingsScreen', { classroom, classId: currentClassId, className: currentClassName })}
        >
          <Settings size={24} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.gridContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.gridItem}
              onPress={() => {
                if (item.route === 'WeeklyScheduleBuilderScreen') {
                  navigation.navigate(item.route, { 
                    classId: currentClassId, 
                    className: currentClassName,
                    schoolName: classroom?.school?.name || ''
                  });
                } else {
                  navigation.navigate(item.route, { classroom, currentClassId, currentClassName });
                }
              }}
            >
              <View style={styles.iconContainer}>
                {item.icon}
              </View>
              <Text style={styles.gridItemTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weekly Schedule Section */}
        <View style={styles.scheduleSection}>
          <View style={styles.scheduleHeader}>
            <Text style={styles.scheduleTitle}>برنامه کلاسی</Text>
            <TouchableOpacity onPress={() => navigation.navigate('WeeklyScheduleBuilderScreen', { 
              classId: currentClassId, 
              className: currentClassName,
              schoolName: classroom?.school?.name || ''
            })}>
              <Text style={styles.editScheduleBtn}>ویرایش برنامه کلاسی</Text>
            </TouchableOpacity>
          </View>
          
          {groupedSchedule.length > 0 ? (
            groupedSchedule.map((day) => (
              <View key={day.id} style={styles.scheduleDayRow}>
                <Text style={styles.scheduleDayName}>{day.name}</Text>
                <View style={styles.scheduleItemsCol}>
                  {day.items.map((item: any, idx: number) => {
                    let durationText = '';
                    if (item.startTime && item.endTime) {
                      try {
                        const [sh, sm] = item.startTime.split(':').map(Number);
                        const [eh, em] = item.endTime.split(':').map(Number);
                        const diff = (eh * 60 + em) - (sh * 60 + sm);
                        if (diff > 0) {
                          if (diff === 60) durationText = '۱ ساعت';
                          else if (diff === 90) durationText = '۱ ساعت و نیم';
                          else durationText = `${diff} دقیقه`;
                        }
                      } catch (e) {}
                    }
                    
                    const timeStr = (item.startTime && item.endTime) ? `${item.startTime} الی ${item.endTime}` : 'بدون زمان';

                    return (
                      <View key={idx} style={styles.scheduleItemCard}>
                        <View style={styles.scheduleItemHeader}>
                          <Text style={styles.scheduleItemSubject}>{item.subject || item.className}</Text>
                          <View style={styles.schedulePeriodBadge}>
                            <Text style={styles.schedulePeriodText}>زنگ {idx + 1}</Text>
                          </View>
                        </View>
                        <View style={styles.scheduleItemFooter}>
                          <View style={styles.scheduleTimeWrapper}>
                            <Calendar size={12} color="#64748b" style={{ marginLeft: 4 }} />
                            <Text style={styles.scheduleTimeText}>{timeStr}</Text>
                          </View>
                          {durationText ? (
                            <View style={styles.scheduleDurationWrapper}>
                              <Text style={styles.scheduleDurationText}>{durationText}</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyScheduleText}>برنامه کلاسی ثبت نشده است.</Text>
          )}
        </View>

        <View style={styles.notesSection}>
          <View style={styles.notesHeader}>
            <TouchableOpacity onPress={() => navigation.navigate('AddNoteScreen', { classId: currentClassId })} style={styles.addNoteBtn}>
              <Plus size={16} color={COLORS.primary} />
              <Text style={styles.addNoteText}>یادداشت جدید</Text>
            </TouchableOpacity>
            <Text style={styles.notesTitle}>یادداشت‌های کلاس</Text>
          </View>
          
          {notes.length === 0 ? (
            <Text style={styles.emptyNotesText}>یادداشتی ثبت نشده است.</Text>
          ) : (
            <ScrollView horizontal inverted showsHorizontalScrollIndicator={false} contentContainerStyle={styles.notesList}>
              {notes.map((note) => (
                <TouchableOpacity 
                  key={note._id} 
                  style={[styles.noteCard, { backgroundColor: note.color || '#fef08a' }]}
                  onPress={() => navigation.navigate('AddNoteScreen', { note })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.noteDate}>{note.date}</Text>
                  {note.title && <Text style={styles.noteCardTitle}>{note.title}</Text>}
                  <Text style={styles.noteContent} numberOfLines={3}>{note.content}</Text>
                  {note.tasks && note.tasks.length > 0 && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.5)', fontFamily: 'IRANSansX' }}>{note.tasks.length} تسک</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <GradebookTable classId={currentClassId} classroom={classroom} />
      </ScrollView>
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
  settingsButton: { padding: 8 },
  
  content: { flexGrow: 1, padding: 20 },
  gridContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  // Weekly Schedule styles
  scheduleSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  scheduleHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  scheduleTitle: {
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    fontSize: 16,
    color: COLORS.text,
  },
  editScheduleBtn: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scheduleDayRow: {
    flexDirection: 'row-reverse',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  scheduleDayName: {
    width: 70,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'right',
    backgroundColor: '#f8fafc',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  scheduleItemsCol: {
    flex: 1,
    paddingRight: 10,
    borderRightWidth: 3,
    borderRightColor: '#bae6fd',
  },
  scheduleItemCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scheduleItemHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleItemSubject: {
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    fontSize: 15,
    color: '#0f172a',
  },
  schedulePeriodBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  schedulePeriodText: {
    fontFamily: 'IRANSansX',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1d4ed8',
  },
  scheduleItemFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleTimeWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  scheduleTimeText: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
    color: '#64748b',
  },
  scheduleDurationWrapper: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scheduleDurationText: {
    fontFamily: 'IRANSansX',
    fontSize: 11,
    color: '#475569',
  },
  emptyScheduleText: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 12,
  },

  notesSection: { marginBottom: 24 },
  notesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  notesTitle: { fontSize: 16, fontFamily: 'IRANSansX', fontWeight: 'bold', color: COLORS.text },
  addNoteBtn: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addNoteText: { fontSize: 13, fontFamily: 'IRANSansX', color: COLORS.primary, marginRight: 4, fontWeight: 'bold' },
  emptyNotesText: { textAlign: 'center', color: COLORS.textLight, fontFamily: 'IRANSansX', marginTop: 12, fontSize: 13 },
  notesList: { gap: 12 },
  noteCard: { width: 220, padding: 16, borderRadius: 16, elevation: 1, marginLeft: 12 },
  noteDate: { fontSize: 11, fontFamily: 'IRANSansX', color: '#475569', fontWeight: 'bold', marginBottom: 6 },
  noteCardTitle: { fontSize: 14, fontFamily: 'IRANSansX', color: '#0f172a', fontWeight: 'bold', marginBottom: 4 },
  noteContent: { fontSize: 13, fontFamily: 'IRANSansX', color: '#1e293b', lineHeight: 22 },
  gridItem: {
    width: '31%', // 3 columns
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridItemTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  }
});

export default ClassDetailsScreen;
