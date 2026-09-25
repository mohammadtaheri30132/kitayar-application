import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, Clock, Plus, Settings, MapPin } from 'lucide-react-native';
import { getTodayJalali, getCalendarGrid, PERSIAN_MONTHS, PERSIAN_WEEKDAYS, toPersianNumbers } from '../../utils/date/jalaliHelper';
import { PlanningService, TeacherEvent } from '../../api/planningService';

const { width } = Dimensions.get('window');

// --- MOCK DATA ---
const mockEvents = [
  { id: 1, type: 'class', title: 'ریاضی', classStr: 'هفتم ۱', time: '08:00', location: 'مدرسه شهید مطهری', date: 18, color: '#3b82f6' },
  { id: 2, type: 'class', title: 'علوم', classStr: 'هفتم ۲', time: '09:30', location: 'مدرسه شهید مطهری', date: 18, color: '#10b981' },
  { id: 3, type: 'event', title: 'جلسه شورای معلمان', time: '14:30', location: 'دفتر', date: 18, color: '#f59e0b' },
  { id: 4, type: 'task', title: 'تصحیح اوراق', time: '16:00', location: '', date: 18, color: '#ec4899' },
  { id: 5, type: 'system', title: 'روز دانش‌آموز', time: '00:00', location: '', date: 13, color: '#6366f1' },
];

const LEGEND = [
  { label: 'ریاضی', color: '#3b82f6' },
  { label: 'علوم', color: '#10b981' },
  { label: 'جلسه', color: '#f59e0b' },
  { label: 'کار', color: '#ec4899' },
  { label: 'مناسبت', color: '#6366f1' },
];

const CalendarScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  
  // Date State
  const { jy: initialJy, jm: initialJm, jd: initialJd } = getTodayJalali();
  const [currentJy, setCurrentJy] = useState(initialJy);
  const [currentJm, setCurrentJm] = useState(initialJm);
  const [selectedDay, setSelectedDay] = useState(initialJd);
  
  // View State
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  
  // Data State
  const [events, setEvents] = useState<any[]>(mockEvents);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const startDate = `${currentJy}-${String(currentJm).padStart(2, '0')}-01`;
        const endDate = `${currentJy}-${String(currentJm).padStart(2, '0')}-31`; // Approx
        
        const [eventsRes, sysEventsRes] = await Promise.all([
          PlanningService.getEvents(startDate, endDate),
          PlanningService.getSystemEvents(startDate, endDate)
        ]);

        let combined: any[] = [];
        
        if (eventsRes.success && eventsRes.data) {
          combined = [...combined, ...eventsRes.data];
        }

        if (sysEventsRes.success && sysEventsRes.data) {
          // Map system events to standard calendar format (assuming date extraction)
          const formattedSysEvents = sysEventsRes.data.map(e => {
            // Extract the day part from "1405-07-25" -> 25
            const dayParts = e.startDate.split('-');
            const dateNum = dayParts.length === 3 ? parseInt(dayParts[2], 10) : 1;
            return {
              id: e._id,
              type: 'system',
              title: e.title,
              time: 'تمام روز',
              location: e.type,
              date: dateNum,
              color: e.color || '#6366f1' // fallback color for system events
            };
          });
          combined = [...combined, ...formattedSysEvents];
        }

        if (combined.length > 0) {
          setEvents(combined);
        }
      } catch (err) {
        // Fallback to mockEvents
      }
    };
    fetchEvents();
  }, [currentJy, currentJm]);

  const handlePrevMonth = () => {
    if (currentJm === 1) {
      setCurrentJm(12);
      setCurrentJy(prev => prev - 1);
    } else {
      setCurrentJm(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentJm === 12) {
      setCurrentJm(1);
      setCurrentJy(prev => prev + 1);
    } else {
      setCurrentJm(prev => prev + 1);
    }
  };

  const calendarGrid = getCalendarGrid(currentJy, currentJm);

  // Filter events for the selected day in Month View
  const selectedDayEvents = events.filter(e => e.date === selectedDay);

  const renderMonthView = () => (
    <>
      <View style={[styles.calendarCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.calendarHeader}>
          <View style={styles.calendarTitleRow}>
            <CalendarIcon color={colors.primary} size={22} />
            <Text style={[styles.calendarTitle, { color: colors.text }]}>
              {PERSIAN_MONTHS[currentJm - 1]} {toPersianNumbers(currentJy)}
            </Text>
          </View>
          <View style={styles.calendarNav}>
            <TouchableOpacity style={styles.navBtn} onPress={handleNextMonth}><ChevronRight color={colors.textLight} size={20} /></TouchableOpacity>
            <TouchableOpacity style={styles.navBtn} onPress={handlePrevMonth}><ChevronLeft color={colors.textLight} size={20} /></TouchableOpacity>
          </View>
        </View>

        <View style={styles.calendarGrid}>
          {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((day, i) => (
            <Text key={i} style={[styles.calendarDayLabel, { color: colors.textLight }]}>{day}</Text>
          ))}
          
          {calendarGrid.map((dayNum, i) => {
            if (dayNum === null) {
              return <View key={i} style={styles.calendarDayCell} />;
            }

            const isSelected = dayNum === selectedDay && currentJm === initialJm && currentJy === initialJy;
            const isToday = dayNum === initialJd && currentJm === initialJm && currentJy === initialJy;
            const dayEvents = events.filter(e => e.date === dayNum);
            
            return (
              <TouchableOpacity 
                key={i} 
                style={styles.calendarDayCell}
                onPress={() => setSelectedDay(dayNum)}
              >
                <View style={[styles.calendarDayNumberBg, isSelected && { backgroundColor: colors.primary }]}>
                  <Text style={[styles.calendarDayNumber, (isSelected || isToday) && { color: isSelected ? '#fff' : colors.primary, fontWeight: isToday ? 'bold' : 'normal' }]}>
                    {toPersianNumbers(dayNum)}
                  </Text>
                </View>
                {/* Dots Container */}
                <View style={styles.dotsRow}>
                  {dayEvents.slice(0, 3).map((ev, idx) => (
                    <View key={idx} style={[styles.eventDot, { backgroundColor: ev.color }, isSelected && { borderColor: colors.surface }]} />
                  ))}
                  {dayEvents.length > 3 && <View style={[styles.eventDot, { backgroundColor: colors.textLight }]} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        {LEGEND.map((l, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: l.color }]} />
            <Text style={[styles.legendText, { color: colors.textLight }]}>{l.label}</Text>
          </View>
        ))}
      </View>

      {/* Selected Day Events List */}
      <View style={styles.eventsSection}>
        <Text style={[styles.eventsSectionTitle, { color: colors.text }]}>
          برنامه {toPersianNumbers(selectedDay)} {PERSIAN_MONTHS[currentJm - 1]}
        </Text>
        
        {selectedDayEvents.length === 0 ? (
          <Text style={[styles.emptyState, { color: colors.textLight }]}>رویدادی برای این روز ثبت نشده است.</Text>
        ) : (
          selectedDayEvents.map(event => (
            <TouchableOpacity key={event.id} style={[styles.eventCard, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.8}>
              <View style={[styles.eventColorLine, { backgroundColor: event.color }]} />
              <View style={styles.eventCardContent}>
                <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title} {event.classStr ? `(${event.classStr})` : ''}</Text>
                <View style={styles.eventDetailsRow}>
                  {event.time ? (
                    <View style={styles.eventTimeRow}>
                      <Clock color={colors.textLight} size={14} />
                      <Text style={[styles.eventTime, { color: colors.textLight }]}>{toPersianNumbers(event.time)}</Text>
                    </View>
                  ) : null}
                  {event.location ? (
                    <View style={[styles.eventTimeRow, { marginLeft: 16 }]}>
                      <MapPin color={colors.textLight} size={14} />
                      <Text style={[styles.eventTime, { color: colors.textLight }]}>{event.location}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </>
  );

  const renderDayView = () => (
    <View style={styles.dayViewContainer}>
      <Text style={[styles.eventsSectionTitle, { color: colors.text, marginBottom: 24 }]}>
        جدول زمانی {toPersianNumbers(selectedDay)} {PERSIAN_MONTHS[currentJm - 1]}
      </Text>
      
      {selectedDayEvents.length === 0 ? (
        <Text style={[styles.emptyState, { color: colors.textLight }]}>برنامه‌ای برای امروز ندارید.</Text>
      ) : (
        <View style={styles.timelineCard}>
          {selectedDayEvents.map((cls, idx) => {
            const isLast = idx === selectedDayEvents.length - 1;
            return (
              <View key={cls.id} style={styles.timelineItem}>
                <View style={styles.timelineTimeCol}>
                  <Text style={[styles.timelineTime, { color: colors.text }]}>{cls.time ? toPersianNumbers(cls.time) : '-'}</Text>
                </View>
                <View style={styles.timelineTrackCol}>
                  <View style={[styles.timelineDotBox, { backgroundColor: cls.color }]} />
                  {!isLast && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
                </View>
                <View style={styles.timelineContentCol}>
                  <View style={[styles.dayEventBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.timelineClassTitle, { color: colors.text }]}>{cls.title} {cls.classStr ? `- ${cls.classStr}` : ''}</Text>
                    {cls.location ? (
                      <View style={styles.timelineDetailRow}>
                        <MapPin color={colors.textLight} size={14} />
                        <Text style={[styles.timelineDetailText, { color: colors.textLight }]}>{cls.location}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );

  const renderWeekView = () => {
    // For mock purposes, just group events by their dates to simulate a week.
    const mockWeekDays = [16, 17, 18, 19, 20];
    
    return (
      <View style={styles.weekViewContainer}>
        {mockWeekDays.map((day) => {
          const dayEvents = events.filter(e => e.date === day);
          if (dayEvents.length === 0) return null;
          
          return (
            <View key={day} style={styles.weekDayGroup}>
              <View style={[styles.weekDayHeader, { backgroundColor: `${colors.primary}10` }]}>
                <Text style={[styles.weekDayTitle, { color: colors.primary }]}>{toPersianNumbers(day)} {PERSIAN_MONTHS[currentJm - 1]}</Text>
              </View>
              <View style={styles.timelineCard}>
                {dayEvents.map((cls, idx) => {
                  const isLast = idx === dayEvents.length - 1;
                  return (
                    <View key={cls.id} style={styles.timelineItem}>
                      <View style={styles.timelineTimeCol}>
                        <Text style={[styles.timelineTime, { color: colors.text }]}>{toPersianNumbers(cls.time)}</Text>
                      </View>
                      <View style={styles.timelineTrackCol}>
                        <View style={[styles.timelineDotBox, { backgroundColor: cls.color }]} />
                        {!isLast && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
                      </View>
                      <View style={styles.timelineContentCol}>
                        <View style={[styles.dayEventBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                          <Text style={[styles.timelineClassTitle, { color: colors.text }]}>{cls.title} {cls.classStr ? `- ${cls.classStr}` : ''}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronRight color={colors.text} size={28} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>تقویم و برنامه‌ها</Text>
        <TouchableOpacity style={styles.backButton}>
          <Settings color={colors.text} size={24} />
        </TouchableOpacity>
      </View>

      {/* View Selector */}
      <View style={styles.viewSelectorWrapper}>
        <View style={[styles.viewSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {[
            { id: 'month', label: 'ماه' },
            { id: 'week', label: 'هفته' },
            { id: 'day', label: 'روز' }
          ].map(v => (
            <TouchableOpacity 
              key={v.id} 
              style={[styles.viewBtn, viewMode === v.id && { backgroundColor: colors.primary }]}
              onPress={() => setViewMode(v.id as any)}
            >
              <Text style={[styles.viewBtnText, { color: viewMode === v.id ? '#fff' : colors.textLight }]}>{v.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'week' && renderWeekView()}
        <View style={{ height: 80 }} />
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    elevation: 2,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'IRANSansX' },
  
  viewSelectorWrapper: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  viewSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
  },
  viewBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },

  content: { padding: 16 },
  
  // Month View Calendar
  calendarCard: {
    borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20
  },
  calendarTitleRow: { flexDirection: 'row', alignItems: 'center' },
  calendarTitle: { fontSize: 16, fontWeight: 'bold', fontFamily: 'IRANSansX', marginLeft: 8 },
  calendarNav: { flexDirection: 'row', alignItems: 'center' },
  navBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 8, marginLeft: 8 },
  
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDayLabel: {
    width: '14.28%', textAlign: 'center', fontSize: 12, fontFamily: 'IRANSansX', marginBottom: 16, fontWeight: 'bold'
  },
  calendarDayCell: {
    width: '14.28%', alignItems: 'center', height: 48, justifyContent: 'flex-start', position: 'relative', marginBottom: 4
  },
  calendarDayNumberBg: {
    width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 2
  },
  calendarDayNumber: { fontSize: 14, fontFamily: 'IRANSansX' },
  
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 2,
  },
  eventDot: {
    width: 4, height: 4, borderRadius: 2,
  },

  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8, height: 8, borderRadius: 4, marginRight: 6
  },
  legendText: {
    fontSize: 11, fontFamily: 'IRANSansX'
  },

  eventsSection: { marginTop: 8 },
  eventsSectionTitle: { fontSize: 16, fontWeight: 'bold', fontFamily: 'IRANSansX', marginBottom: 16 },
  emptyState: { fontSize: 14, fontFamily: 'IRANSansX', fontStyle: 'italic', opacity: 0.7 },
  
  eventCard: {
    flexDirection: 'row', borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1,
  },
  eventColorLine: { width: 6 },
  eventCardContent: { flex: 1, padding: 16 },
  eventTitle: { fontSize: 15, fontFamily: 'IRANSansX', fontWeight: 'bold', marginBottom: 8 },
  eventDetailsRow: { flexDirection: 'row', alignItems: 'center' },
  eventTimeRow: { flexDirection: 'row', alignItems: 'center' },
  eventTime: { fontSize: 13, fontFamily: 'IRANSansX', marginLeft: 6 },

  // Day View
  dayViewContainer: {
    marginTop: 8,
  },
  timelineCard: {
    marginBottom: 32,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineTimeCol: {
    width: 50,
    alignItems: 'center',
    paddingTop: 16,
  },
  timelineTime: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
  },
  timelineTrackCol: {
    width: 24,
    alignItems: 'center',
  },
  timelineDotBox: {
    width: 14,
    height: 14,
    borderRadius: 7,
    zIndex: 2,
    marginTop: 18,
    borderWidth: 2,
    borderColor: '#fff'
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: -4,
    zIndex: 1,
  },
  timelineContentCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 24,
  },
  dayEventBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  timelineClassTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    marginBottom: 8,
  },
  timelineDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineDetailText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    marginLeft: 4,
  },

  // Week View
  weekViewContainer: {
    marginTop: 8,
  },
  weekDayGroup: {
    marginBottom: 8,
  },
  weekDayHeader: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  weekDayTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },

  fab: {
    position: 'absolute', bottom: 24, left: 24, width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', elevation: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5,
  }
});

export default CalendarScreen;
