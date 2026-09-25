import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { PERSIAN_MONTHS, PERSIAN_WEEKDAYS, toPersianNumbers, getCalendarGrid, getTodayJalali } from '../../utils/date/jalaliHelper';

interface MiniCalendarProps {
  events: any[]; // Expecting an array of event objects that have a `date` property (the day number) and a `color` property.
  selectedDate: { jy: number; jm: number; jd: number };
  onSelectDate: (date: { jy: number; jm: number; jd: number }) => void;
}

export default function MiniCalendar({ events, selectedDate, onSelectDate }: MiniCalendarProps) {
  const { colors } = useTheme();
  
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month');
  const [currentJy, setCurrentJy] = useState(selectedDate.jy);
  const [currentJm, setCurrentJm] = useState(selectedDate.jm);

  const handlePrev = () => {
    if (viewMode === 'month') {
      if (currentJm === 1) {
        setCurrentJm(12);
        setCurrentJy(prev => prev - 1);
      } else {
        setCurrentJm(prev => prev - 1);
      }
    } else {
      // In week view, simplified approach: just move selected date by 7 days.
      // A more robust implementation would recalculate Jy/Jm but for now we fallback to month switch.
      const newJd = selectedDate.jd - 7;
      if (newJd > 0) {
        onSelectDate({ ...selectedDate, jd: newJd });
      } else {
        const prevMonth = currentJm === 1 ? 12 : currentJm - 1;
        const prevYear = currentJm === 1 ? currentJy - 1 : currentJy;
        setCurrentJm(prevMonth);
        setCurrentJy(prevYear);
        onSelectDate({ jy: prevYear, jm: prevMonth, jd: 25 }); // approx
      }
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      if (currentJm === 12) {
        setCurrentJm(1);
        setCurrentJy(prev => prev + 1);
      } else {
        setCurrentJm(prev => prev + 1);
      }
    } else {
      const newJd = selectedDate.jd + 7;
      if (newJd <= 30) {
        onSelectDate({ ...selectedDate, jd: newJd });
      } else {
        const nextMonth = currentJm === 12 ? 1 : currentJm + 1;
        const nextYear = currentJm === 12 ? currentJy + 1 : currentJy;
        setCurrentJm(nextMonth);
        setCurrentJy(nextYear);
        onSelectDate({ jy: nextYear, jm: nextMonth, jd: 1 });
      }
    }
  };

  const flatGrid = getCalendarGrid(currentJy, currentJm);
  
  // Chunk flatGrid into weeks (rows of 7)
  const grid: (number | null)[][] = [];
  for (let i = 0; i < flatGrid.length; i += 7) {
    grid.push(flatGrid.slice(i, i + 7));
  }
  
  // If week view, find the row that contains the selectedDate.jd
  let displayGrid = grid;
  if (viewMode === 'week') {
    const weekRow = grid.find(row => row.includes(selectedDate.jd));
    displayGrid = weekRow ? [weekRow] : [grid[0]]; // fallback
  }

  return (
    <View style={[styles.calendarCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.calendarHeader}>
        <View style={styles.calendarTitleRow}>
          <CalendarIcon color={colors.primary} size={20} />
          <Text style={[styles.calendarTitle, { color: colors.text }]}>
            {PERSIAN_MONTHS[currentJm - 1]} {toPersianNumbers(currentJy)}
          </Text>
        </View>
        <View style={styles.toggleRow}>
          <TouchableOpacity 
            style={[styles.toggleBtn, viewMode === 'week' && { backgroundColor: colors.primary }]}
            onPress={() => setViewMode('week')}
          >
            <Text style={[styles.toggleText, { color: viewMode === 'week' ? '#fff' : colors.textLight }]}>هفته</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, viewMode === 'month' && { backgroundColor: colors.primary }]}
            onPress={() => setViewMode('month')}
          >
            <Text style={[styles.toggleText, { color: viewMode === 'month' ? '#fff' : colors.textLight }]}>ماه</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.calendarNav}>
          <TouchableOpacity style={styles.navBtn} onPress={handleNext}><ChevronRight color={colors.textLight} size={20} /></TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={handlePrev}><ChevronLeft color={colors.textLight} size={20} /></TouchableOpacity>
        </View>
      </View>

      <View style={styles.calendarGrid}>
        {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((day, i) => (
          <Text key={i} style={[styles.calendarDayLabel, { color: colors.textLight }]}>{day}</Text>
        ))}
        {displayGrid.flat().map((day, i) => {
          if (!day) return <View key={i} style={styles.calendarCell} />;
          
          const isSelected = day === selectedDate.jd && currentJm === selectedDate.jm && currentJy === selectedDate.jy;
          
          // Get events for this day
          // Get events for this day
          const dayEvents = events.filter(e => {
            if (e.dateInt !== undefined) return e.dateInt === day;
            if (e.date && typeof e.date === 'string') return parseInt(e.date.split('-')[2]) === day;
            if (e.dueDate && typeof e.dueDate === 'string') return parseInt(e.dueDate.split('-')[2]) === day;
            return false;
          });
          
          return (
            <TouchableOpacity 
              key={i} 
              style={[
                styles.calendarCell, 
                isSelected && { backgroundColor: colors.primary }
              ]}
              onPress={() => onSelectDate({ jy: currentJy, jm: currentJm, jd: day })}
            >
              <Text style={[
                styles.calendarDayText, 
                { color: isSelected ? '#fff' : colors.text }
              ]}>
                {toPersianNumbers(day)}
              </Text>
              
              {/* Event Dots */}
              {dayEvents.length > 0 && (
                <View style={styles.dotsContainer}>
                  {dayEvents.slice(0, 3).map((ev, idx) => (
                    <View key={idx} style={[styles.eventDot, { backgroundColor: ev.color || '#3b82f6' }]} />
                  ))}
                  {dayEvents.length > 3 && <View style={[styles.eventDot, { backgroundColor: colors.textLight }]} />}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarCard: {
    padding: 0,
    marginBottom: 0,
    marginTop: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  calendarHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  calendarTitle: {
    fontFamily: 'IRANSansMobile',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
  toggleRow: {
    flexDirection: 'row-reverse',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleText: {
    fontFamily: 'IRANSansMobile',
    fontSize: 12,
  },
  calendarNav: {
    flexDirection: 'row-reverse',
  },
  navBtn: {
    padding: 4,
  },
  calendarGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
  },
  calendarDayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontFamily: 'IRANSansMobile',
    fontSize: 12,
    marginBottom: 8,
  },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },
  calendarDayText: {
    fontFamily: 'IRANSansMobile',
    fontSize: 14,
  },
  dotsContainer: {
    flexDirection: 'row-reverse',
    marginTop: 2,
    gap: 2,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  }
});
