import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { 
  Megaphone, ChevronLeft, MapPin, CheckSquare, Plus, FileText, Calendar as CalendarIcon, Clock, X, Filter, BookOpen
} from 'lucide-react-native';
import GlobalHeader from '../../components/common/GlobalHeader';
import { getTodayJalali, formatJalaliDate, formatJalaliStandard, toPersianNumbers, PERSIAN_MONTHS } from '../../utils/date/jalaliHelper';
import { PlanningService, TeacherEvent, DailyNote, TeacherTask, Announcement } from '../../api/planningService';
import MiniCalendar from '../../components/planning/MiniCalendar';
import AddTaskModal from '../../components/planning/AddTaskModal';
import FilterBottomSheet from '../../components/planning/FilterBottomSheet';
import AddBottomSheet from '../../components/planning/AddBottomSheet';
import * as jalaali from 'jalaali-js';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  
  // Data State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tasks, setTasks] = useState<TeacherTask[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const { jy, jm, jd } = getTodayJalali();
  const [selectedDate, setSelectedDate] = useState({ jy, jm, jd });
  const [dateRange, setDateRange] = useState<'today' | 'tomorrow' | 'week' | 'month'>('today');
  const [activeFilters, setActiveFilters] = useState({ classes: true, tasks: true, events: true, notes: true });
  
  // Independent Calendar State
  const [selectedTag, setSelectedTag] = useState('همه');
  const [calendarTab, setCalendarTab] = useState('روزانه');
  
  // Modals
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isAddVisible, setIsAddVisible] = useState(false);
  const [isAddTaskVisible, setIsAddTaskVisible] = useState(false);

  const dateStr = formatJalaliDate(jy, jm, jd, true);
  const persianDateStr = toPersianNumbers(dateStr);
  const standardDateStr = formatJalaliStandard(jy, jm, jd);

  // Helper functions for date math
  const getJalaliDateString = (offsetDays: number) => {
    const gDate = jalaali.toGregorian(jy, jm, jd);
    const jsDate = new Date(gDate.gy, gDate.gm - 1, gDate.gd);
    jsDate.setDate(jsDate.getDate() + offsetDays);
    const j = jalaali.toJalaali(jsDate.getFullYear(), jsDate.getMonth() + 1, jsDate.getDate());
    return formatJalaliStandard(j.jy, j.jm, j.jd);
  };
  
  const todayDateStr = getJalaliDateString(0);
  const tomorrowDateStr = getJalaliDateString(1);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const monthStartStr = formatJalaliStandard(selectedDate.jy, selectedDate.jm, 1);
      const daysInMonth = selectedDate.jm <= 6 ? 31 : (selectedDate.jm === 12 ? 29 : 30);
      const monthEndStr = formatJalaliStandard(selectedDate.jy, selectedDate.jm, daysInMonth);

      // 1. Announcements
      const annRes = await PlanningService.getAnnouncements(standardDateStr);
      if (annRes.success && annRes.data) setAnnouncements(annRes.data);

      // 2. Events & System Events
      let allEvents: any[] = [];
      const eventsRes = await PlanningService.getEvents(monthStartStr, monthEndStr);
      if (eventsRes.success && eventsRes.data) {
        allEvents = [...eventsRes.data.map(e => ({
          ...e,
          tagLabel: e.type,
          color: e.color || '#3b82f6',
          dateInt: parseInt(e.date.split('-')[2])
        }))];
      }
      const sysEventsRes = await PlanningService.getSystemEvents(monthStartStr, monthEndStr);
      if (sysEventsRes.success && sysEventsRes.data) {
        const sysEvs = sysEventsRes.data.map((e: any) => ({
          ...e,
          date: e.startDate,
          dateInt: parseInt(e.startDate.split('-')[2]),
          color: '#ef4444',
          tagLabel: 'مناسبت تقویم',
          time: 'تمام روز'
        }));
        allEvents = [...allEvents, ...sysEvs];
      }
      setEvents(allEvents);

      // 3. Schedule
      const scheduleRes = await PlanningService.getSchedule();
      if (scheduleRes.success && scheduleRes.data) {
        const scheduleData = scheduleRes.data;
        
        let mappedClasses: any[] = [];
        for (let d = 0; d < 31; d++) { // fetch for a month window around today
          const dStr = getJalaliDateString(d - 15);
          const parts = dStr.split('-');
          const cJ = { jy: parseInt(parts[0]), jm: parseInt(parts[1]), jd: parseInt(parts[2]) };
          const gDate = jalaali.toGregorian(cJ.jy, cJ.jm, cJ.jd);
          const jsD = new Date(gDate.gy, gDate.gm - 1, gDate.gd);
          const dIdx = jsD.getDay();
          
          const dayClasses = scheduleData.filter((c: any) => c.dayOfWeek === dIdx);
          dayClasses.forEach((c: any) => {
            mappedClasses.push({
              id: `class-${c._id}-${dStr}`,
              title: c.subject || 'کلاس',
              classStr: c.className || '',
              time: `${c.startTime} - ${c.endTime}`,
              startTime: c.startTime,
              school: c.schoolName || '',
              room: c.room || '',
              color: c.color || '#3b82f6',
              date: dStr
            });
          });
        }
        setClasses(mappedClasses);
      }

      // 4. Tasks
      const tasksRes = await PlanningService.getTasks();
      if (tasksRes.success && tasksRes.data) {
        setTasks(tasksRes.data);
      }

      // 5. Notes
      const notesRes = await PlanningService.getNotes(); // Assuming it returns all recent notes
      if (notesRes.success && notesRes.data) {
        setNotes(notesRes.data);
      }
    } catch (err) {
      console.warn('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateStr]);

  const toggleTask = async (task: any) => {
    const isDone = task.status === 'completed';
    const newStatus = isDone ? 'pending' : 'completed';
    setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
    try {
      if (task._id) {
        await PlanningService.updateTask(task._id, { status: newStatus });
      }
    } catch(e) {}
  };

  const handleSaveEvent = async (eventData: any) => {
    const formattedDate = formatJalaliStandard(selectedDate.jy, selectedDate.jm, selectedDate.jd);
    await PlanningService.createEvent({ ...eventData, date: formattedDate });
    fetchData();
  };

  const handleSaveTask = async (taskData: any) => {
    await PlanningService.createTask(taskData);
    fetchData();
  };

  const handleDismissAnnouncement = async (id: string | number) => {
    setAnnouncements(prev => prev.filter(a => a._id !== id));
    try {
      if (typeof id === 'string') await PlanningService.dismissAnnouncement(id);
    } catch (e) {}
  };

  const getDatesInRange = () => {
    const dates = [];
    if (dateRange === 'today') {
      dates.push(todayDateStr);
    } else if (dateRange === 'tomorrow') {
      dates.push(tomorrowDateStr);
    } else if (dateRange === 'week') {
      // Just next 7 days for simplicity
      for (let i = 0; i < 7; i++) dates.push(getJalaliDateString(i));
    } else if (dateRange === 'month') {
      // Current month
      for (let i = 1; i <= 31; i++) {
        const dStr = formatJalaliStandard(jy, jm, i);
        if(i <= (jm <= 6 ? 31 : (jm === 12 ? 29 : 30))) dates.push(dStr);
      }
    }
    return dates;
  };

  const timelineDates = getDatesInRange();

  const getDateLabel = (dStr: string) => {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const mName = PERSIAN_MONTHS[parseInt(parts[1]) - 1];
      const dNum = parseInt(parts[2]);
      const formatted = toPersianNumbers(`${dNum} ${mName}`);
      if (dStr === todayDateStr) return `امروز ${formatted}`;
      if (dStr === tomorrowDateStr) return `فردا ${formatted}`;
      return formatted;
    }
    if (dStr === todayDateStr) return 'امروز';
    if (dStr === tomorrowDateStr) return 'فردا';
    return toPersianNumbers(dStr);
  };

  // Calendar combined events (for MiniCalendar dots)
  const calendarEvents = [
    ...events.map(e => ({ ...e, tagLabel: e.type || 'رویداد', isEvent: true })),
    ...tasks.filter(t => t.dueDate).map(t => ({ id: t._id, dateInt: parseInt(t.dueDate!.split('-')[2]), color: '#10b981', tagLabel: t.category || 'تسک', title: t.title, isTask: true })),
    ...classes.map(c => ({ id: c.id, dateInt: parseInt(c.date.split('-')[2]), color: '#3b82f6', tagLabel: 'کلاس', title: c.title })),
    ...notes.map(n => ({ id: n._id, dateInt: parseInt(n.date.split('-')[2]), color: n.color || '#fef08a', tagLabel: 'یادداشت', title: n.title || 'یادداشت' }))
  ];

  const taskTags = Array.from(new Set(calendarEvents.filter(e => e.isTask).map(e => e.tagLabel)));
  const eventTags = Array.from(new Set(calendarEvents.filter(e => e.isEvent).map(e => e.tagLabel)));
  const otherTags = Array.from(new Set(calendarEvents.filter(e => !e.isTask && !e.isEvent).map(e => e.tagLabel)));
  const allTags = ['همه', ...taskTags, ...eventTags, ...otherTags];
  
  const getTagColor = (tag: string) => {
    if (tag === 'همه') return colors.primary;
    const ev = calendarEvents.find(e => e.tagLabel === tag);
    return ev?.color || colors.primary;
  };
  
  const filteredCalendarEvents = calendarEvents.filter((ev) => {
    if (selectedTag !== 'همه' && ev.tagLabel !== selectedTag) return false;
    if (calendarTab === 'روزانه') {
      const evDate = (ev as any).date || (ev as any).dueDate || (ev as any).dateStr; // approximation for tasks/classes
      // if it has dateInt we can use that to match jd
      return ev.dateInt === selectedDate.jd;
    }
    // Simplification for weekly/monthly in this context
    return true; 
  });

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#f8fafc' }]} edges={['top']}>
      <GlobalHeader 
        fullName="معلم عزیز"
        dateInfo={persianDateStr} 
        onProfilePress={() => navigation.navigate('ProfileScreen')}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* ADMIN ANNOUNCEMENTS */}
        {announcements.length > 0 && announcements.map(ann => (
          <View key={ann._id} style={[styles.announcementCard, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}>
            <View style={styles.announcementHeader}>
              <View style={styles.announcementTitleRow}>
                <Megaphone color="#dc2626" size={20} />
                <Text style={[styles.announcementTitle, { color: '#991b1b' }]}>⚠ {ann.title}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDismissAnnouncement(ann._id)}>
                <X color="#991b1b" size={20} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.announcementBody, { color: '#7f1d1d' }]}>{ann.shortMessage}</Text>
          </View>
        ))}

        {/* UNIFIED TIMELINE WIDGET */}
        <View style={styles.widgetCard}>
          <View style={styles.widgetHeader}>
             <Text style={[styles.widgetTitle, { color: colors.text }]}>برنامه‌های من</Text>
             <View style={{ flexDirection: 'row', gap: 8 }}>
               <TouchableOpacity style={[styles.filterBtnCompact, { borderColor: colors.border }]} onPress={() => setIsAddVisible(true)}>
                 <Plus color={colors.text} size={16} />
               </TouchableOpacity>
               <TouchableOpacity style={[styles.filterBtnCompact, { borderColor: colors.border }]} onPress={() => setIsFilterVisible(true)}>
                 <Filter color={colors.text} size={16} />
               </TouchableOpacity>
             </View>
          </View>

          <View style={styles.topBar}>
            <View style={styles.dateFilterContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {[
                  { id: 'today', label: 'امروز' },
                  { id: 'tomorrow', label: 'فردا' },
                  { id: 'week', label: 'هفته' },
                ].map(tab => (
                  <TouchableOpacity 
                    key={tab.id}
                    style={[styles.dateFilterChip, dateRange === tab.id ? { backgroundColor: colors.primary, borderColor: colors.primary } : { borderColor: colors.border }]}
                    onPress={() => setDateRange(tab.id as any)}
                  >
                    <Text style={[styles.dateFilterText, { color: dateRange === tab.id ? '#fff' : colors.textLight }]}>{tab.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        {timelineDates.map(dateStr => {
          const dayClasses = activeFilters.classes ? classes.filter(c => c.date === dateStr).sort((a,b) => a.startTime.localeCompare(b.startTime)) : [];
          const dayTasks = activeFilters.tasks ? tasks.filter(t => t.dueDate === dateStr) : [];
          const dayEvents = activeFilters.events ? events.filter(e => e.date === dateStr) : [];
          const dayNotes = activeFilters.notes ? notes.filter(n => n.date === dateStr) : [];

          const hasAnyItems = dayClasses.length > 0 || dayTasks.length > 0 || dayEvents.length > 0 || dayNotes.length > 0;

          if (!hasAnyItems) return null;

          return (
            <View key={dateStr} style={styles.dateGroup}>
              <Text style={[styles.dateGroupTitle, { color: colors.primary }]}>{getDateLabel(dateStr)}</Text>

              {/* CLASSES */}
              {dayClasses.length > 0 && (
                <View style={styles.categorySection}>
                  <Text style={[styles.categoryTitle, { color: colors.textLight }]}>برنامه کلاسی</Text>
                  <View style={styles.timelineCard}>
                    {dayClasses.map((cls, idx) => (
                      <View key={cls.id} style={styles.timelineItem}>
                        <View style={styles.timelineTimeCol}>
                          <Text style={[styles.timelineTime, { color: colors.text }]}>{toPersianNumbers(cls.startTime)}</Text>
                        </View>
                        <View style={styles.timelineTrackCol}>
                          <View style={[styles.timelineDot, { backgroundColor: cls.color }]} />
                          {idx !== dayClasses.length - 1 && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
                        </View>
                        <View style={styles.timelineContentCol}>
                          <Text style={[styles.timelineClassTitle, { color: colors.text }]}>
                            {cls.title}{cls.classStr ? ` - ${cls.classStr}` : ''}
                          </Text>
                          <View style={styles.timelineDetailRow}>
                            <MapPin color={colors.textLight} size={14} />
                            <Text style={[styles.timelineDetailText, { color: colors.textLight }]}>
                              {[cls.school, cls.room ? `کلاس ${toPersianNumbers(cls.room)}` : ''].filter(Boolean).join(' · ') || 'بدون مکان'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* TASKS */}
              {dayTasks.length > 0 && (
                <View style={styles.categorySection}>
                  <Text style={[styles.categoryTitle, { color: colors.textLight }]}>کارهایی که ثبت کرده‌اید (تسک‌ها)</Text>
                  <View style={[styles.tasksCard, { backgroundColor: colors.surface }]}>
                    {dayTasks.map((task) => {
                      const isDone = task.status === 'completed';
                      return (
                      <TouchableOpacity key={task._id} style={styles.taskItem} onPress={() => toggleTask(task)} activeOpacity={0.7}>
                        <View style={[styles.checkbox, isDone && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                          {isDone && <CheckSquare color="#fff" size={12} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.taskText, { color: isDone ? colors.textLight : colors.text }, isDone && { textDecorationLine: 'line-through' }]}>
                            {task.title}
                          </Text>
                          {task.description && (
                            <Text style={[styles.taskDesc, { color: colors.textLight }]}>{task.description}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    )})}
                  </View>
                </View>
              )}

              {/* EVENTS */}
              {dayEvents.length > 0 && (
                <View style={styles.categorySection}>
                  <Text style={[styles.categoryTitle, { color: colors.textLight }]}>رویدادها</Text>
                  <View style={{ paddingHorizontal: 4 }}>
                    {dayEvents.map((ev, idx) => (
                      <View key={ev.id || ev._id || idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <View style={[styles.eventSimpleDot, { backgroundColor: ev.color || colors.primary, width: 6, height: 6, marginRight: 6 }]} />
                        <Text style={{ fontFamily: 'IRANSansX', fontSize: 13, color: colors.text, lineHeight: 22 }}>
                          <Text style={{ color: ev.color || colors.primary, fontWeight: 'bold' }}>({ev.type || ev.tagLabel || 'رویداد'})</Text> - {ev.title}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* NOTES */}
              {dayNotes.length > 0 && (
                <View style={styles.categorySection}>
                  <Text style={[styles.categoryTitle, { color: colors.textLight }]}>یادداشت‌ها</Text>
                  <View style={styles.notesContainer}>
                    {dayNotes.map((note) => (
                      <View key={note._id} style={[styles.noteCard, { backgroundColor: note.color || '#fef08a', borderColor: '#cbd5e1' }]}>
                        <FileText color="#333" size={16} style={{ marginRight: 8, marginTop: 2 }} />
                        <Text style={[styles.noteText, { color: '#1e293b' }]}>{note.title ? `${note.title}: ` : ''}{note.content}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {/* EMPTY STATE */}
        {!timelineDates.some(dateStr => 
          (activeFilters.classes && classes.some(c => c.date === dateStr)) ||
          (activeFilters.tasks && tasks.some(t => t.dueDate === dateStr)) ||
          (activeFilters.events && events.some(e => e.date === dateStr)) ||
          (activeFilters.notes && notes.some(n => n.date === dateStr))
        ) && (
          <View style={[styles.emptyStateBox, { backgroundColor: '#f1f5f9', borderColor: colors.border, marginTop: 16 }]}>
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>برنامه‌ای برای نمایش وجود ندارد 📅</Text>
            <Text style={[styles.emptyStateSub, { color: colors.textLight }]}>از دکمه + برای افزودن برنامه جدید استفاده کنید.</Text>
          </View>
        )}
        </View>

        {/* MINI CALENDAR (Always visible at bottom) */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>تقویم شمای کلی</Text>
        </View>
        <View style={[styles.tasksCard, { backgroundColor: colors.surface, marginBottom: 80 }]}>
          <MiniCalendar 
            events={calendarEvents}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          
          {/* Tags Row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsContainer}>
            <TouchableOpacity
              style={[styles.tagPill, { borderColor: colors.primary, borderWidth: 1 }, selectedTag === 'همه' ? { backgroundColor: colors.primary } : { backgroundColor: 'transparent' }]}
              onPress={() => setSelectedTag('همه')}
            >
              <Text style={[styles.tagText, selectedTag === 'همه' ? { color: '#fff' } : { color: colors.primary }]}>همه</Text>
            </TouchableOpacity>
            
            {eventTags.length > 0 && <View style={styles.tagDivider} />}
            {eventTags.map(tag => {
              const tagColor = getTagColor(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagPill, { borderColor: tagColor, borderWidth: 1 }, selectedTag === tag ? { backgroundColor: tagColor } : { backgroundColor: 'transparent' }]}
                  onPress={() => setSelectedTag(tag)}
                >
                  <Text style={[styles.tagText, selectedTag === tag ? { color: '#fff' } : { color: tagColor }]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
            
            {taskTags.length > 0 && <View style={styles.tagDivider} />}
            {taskTags.map(tag => {
              const tagColor = getTagColor(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagPill, { borderColor: tagColor, borderWidth: 1, borderStyle: 'dashed' }, selectedTag === tag ? { backgroundColor: tagColor, borderStyle: 'solid' } : { backgroundColor: 'transparent' }]}
                  onPress={() => setSelectedTag(tag)}
                >
                  <Text style={[styles.tagText, selectedTag === tag ? { color: '#fff' } : { color: tagColor }]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
            
            {otherTags.length > 0 && <View style={styles.tagDivider} />}
            {otherTags.map(tag => {
              const tagColor = getTagColor(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagPill, { borderColor: tagColor, borderWidth: 1 }, selectedTag === tag ? { backgroundColor: tagColor } : { backgroundColor: 'transparent' }]}
                  onPress={() => setSelectedTag(tag)}
                >
                  <Text style={[styles.tagText, selectedTag === tag ? { color: '#fff' } : { color: tagColor }]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Event Tabs (Daily/Weekly/Monthly) */}
          <View style={styles.eventTabsContainer}>
            {['روزانه', 'هفتگی', 'ماهانه'].map(tab => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.eventTab,
                  calendarTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
                ]}
                onPress={() => setCalendarTab(tab)}
              >
                <Text style={[
                  styles.eventTabText,
                  calendarTab === tab ? { color: colors.primary } : { color: colors.textLight }
                ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Events List for independent calendar */}
          <View style={styles.eventsList}>
            {filteredCalendarEvents.length === 0 ? (
              <Text style={{ fontFamily: 'IRANSansX', color: colors.textLight, textAlign: 'center', marginVertical: 12 }}>
                هیچ موردی برای این تاریخ وجود ندارد
              </Text>
            ) : (
              filteredCalendarEvents.map((ev, idx) => (
                <View key={ev.id || ev._id || idx} style={styles.eventItemSimple}>
                  <View style={[styles.eventSimpleDot, { backgroundColor: ev.color || '#f59e0b' }]} />
                  <View style={styles.eventItemInfo}>
                    <Text style={[styles.eventItemTitle, { color: colors.text }]}>{ev.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <MapPin color={colors.textLight} size={12} />
                      <Text style={[styles.timelineDetailText, { color: colors.textLight }]}>
                        {ev.location || ev.school || ev.forWhere || 'بدون مکان'}
                      </Text>
                    </View>
                  </View>
                  {(ev.time || ev.startTime) ? (
                    <View style={styles.eventItemTimeBox}>
                      <Clock color={colors.primary} size={14} />
                      <Text style={[styles.eventItemTimeText, { color: colors.primary }]}>
                        {toPersianNumbers(ev.time || ev.startTime)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </View>
        </View>

        {/* LATEST NOTES WIDGET */}
        {notes.length > 0 && (
          <View style={styles.latestNotesContainer}>
            <View style={styles.latestNotesHeader}>
              <Text style={[styles.widgetTitle, { color: colors.text }]}>یادداشت‌های اخیر</Text>
              <TouchableOpacity onPress={() => navigation.navigate('DailyNotesScreen')}>
                <Text style={{ fontFamily: 'IRANSansX', fontSize: 12, color: colors.primary }}>مشاهده همه</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {notes.slice(0, 5).map(note => (
                <TouchableOpacity 
                  key={note._id} 
                  style={[styles.latestNoteCard, { backgroundColor: note.color || '#fef08a' }]}
                  onPress={() => navigation.navigate('DailyNotesScreen')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.latestNoteDate}>{note.date}</Text>
                  {note.title && <Text style={styles.latestNoteTitle} numberOfLines={1}>{note.title}</Text>}
                  <Text style={styles.latestNoteContent} numberOfLines={2}>{note.content}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* MANAGEMENT WIDGET */}
        <View style={styles.managementContainer}>
          <Text style={[styles.widgetTitle, { color: colors.text, marginBottom: 16 }]}>مدیریت</Text>
          <View style={styles.managementGrid}>
            <TouchableOpacity 
              style={[styles.managementCard, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('DailyNotesScreen')}
            >
              <View style={[styles.managementIconWrapper, { backgroundColor: '#e0e7ff' }]}>
                <FileText color="#4338ca" size={24} />
              </View>
              <Text style={[styles.managementCardText, { color: colors.text }]}>مدیریت نوشته‌ها</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.managementCard, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('ClassManagementScreen')}
            >
              <View style={[styles.managementIconWrapper, { backgroundColor: '#dcfce7' }]}>
                <BookOpen color="#15803d" size={24} />
              </View>
              <Text style={[styles.managementCardText, { color: colors.text }]}>مدیریت کلاس‌ها</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.managementCard, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('TasksScreen')}
            >
              <View style={[styles.managementIconWrapper, { backgroundColor: '#fef3c7' }]}>
                <CheckSquare color="#b45309" size={24} />
              </View>
              <Text style={[styles.managementCardText, { color: colors.text }]}>مدیریت کارها</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.managementCard, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('WeeklyScheduleScreen')}
            >
              <View style={[styles.managementIconWrapper, { backgroundColor: '#f3e8ff' }]}>
                <CalendarIcon color="#7e22ce" size={24} />
              </View>
              <Text style={[styles.managementCardText, { color: colors.text }]}>برنامه کلاسی</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* FAB ADD */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]} 
        activeOpacity={0.8}
        onPress={() => setIsAddVisible(true)}
      >
        <Plus color="#fff" size={28} />
      </TouchableOpacity>

      {/* BOTTOM SHEETS & MODALS */}
      <FilterBottomSheet 
        visible={isFilterVisible} 
        onClose={() => setIsFilterVisible(false)} 
        activeFilters={activeFilters}
        onSave={setActiveFilters}
      />

      <AddBottomSheet 
        visible={isAddVisible}
        onClose={() => setIsAddVisible(false)}
        onAddClass={() => navigation.navigate('WeeklyScheduleBuilderScreen')}
        onAddTask={() => setIsAddTaskVisible(true)}
        onAddNote={() => navigation.navigate('DailyNotesScreen')}
      />

      <AddTaskModal 
        visible={isAddTaskVisible} 
        onClose={() => setIsAddTaskVisible(false)} 
        onSave={handleSaveTask}
        initialDate={standardDateStr}
      />

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  latestNotesContainer: {
    marginBottom: 24,
  },
  latestNotesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  latestNoteCard: {
    width: 200,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  latestNoteDate: {
    fontSize: 10,
    fontFamily: 'IRANSansX',
    color: '#475569',
    marginBottom: 4,
  },
  latestNoteTitle: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  latestNoteContent: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    color: '#1e293b',
    lineHeight: 18,
  },

  widgetCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },
  filterBtnCompact: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateFilterContainer: {
    flex: 1,
  },
  dateFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  dateFilterText: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: { padding: 16, paddingBottom: 40 },
  
  announcementCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  announcementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    marginLeft: 8,
  },
  announcementBody: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    lineHeight: 22,
  },

  dateGroup: {
    marginBottom: 24,
  },
  dateGroupTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 4,
  },
  categorySection: {
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 8,
  },

  timelineCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineTimeCol: {
    width: 45,
    alignItems: 'center',
    paddingTop: 2,
  },
  timelineTime: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
  },
  timelineTrackCol: {
    width: 20,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 2,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: -4,
    zIndex: 1,
  },
  timelineContentCol: {
    flex: 1,
    paddingLeft: 8,
    paddingBottom: 16,
  },
  timelineClassTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    marginBottom: 4,
  },
  timelineDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineDetailText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    marginLeft: 4,
  },

  tasksCard: {
    borderRadius: 12,
    padding: 12,
  },
  taskItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  taskText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    marginBottom: 2,
  },
  taskDesc: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    lineHeight: 18,
  },

  eventsList: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
  },
  eventItemSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  eventSimpleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  eventItemInfo: {
    flex: 1,
  },
  eventItemTitle: {
    fontFamily: 'IRANSansX',
    fontSize: 15,
    fontWeight: 'bold',
  },
  eventItemTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eventItemTimeText: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  
  tagsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 8,
  },
  tagDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 8,
    alignSelf: 'center'
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  tagText: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
  },
  eventTabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 12,
  },
  eventTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  eventTabText: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
    fontWeight: 'bold',
  },

  notesContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
  },
  noteCard: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'IRANSansX',
    lineHeight: 20,
  },

  emptyStateBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
    borderStyle: 'dashed',
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyStateSub: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    textAlign: 'center',
    lineHeight: 20,
  },

  sectionHeader: {
    marginTop: 8,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },

  managementContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  managementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  managementCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: 8,
  },
  managementIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  managementCardText: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});

export default DashboardScreen;
