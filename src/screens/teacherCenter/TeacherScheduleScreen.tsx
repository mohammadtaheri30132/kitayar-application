import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/axiosConfig';
import {
  ChevronRight,
  ChevronLeft,
  Calendar,
  Clock,
  Check,
  Trash2,
  Plus,
  X,
  ChevronDown,
} from 'lucide-react-native';
import * as jalaali from 'jalaali-js';
import {
  PERSIAN_MONTHS,
  toPersianNumbers,
  getCalendarGrid,
  getTodayJalali,
  formatJalaliStandard,
  getDaysInJalaliMonth,
} from '../../utils/date/jalaliHelper';
import { FONT_FAMILY } from '../../theme/typography';
import { showSuccess, showWarning, showError } from '../../components/feedback';

const PERSIAN_DAY_NAMES = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
];

// Generate hours dropdown from 7:00 AM (۰۷:۰۰) to 1:00 AM (۰۱:۰۰)
const generateTimeOptions = () => {
  const options: { time: string; label: string; simpleHour: string }[] = [];
  for (let h = 7; h <= 23; h++) {
    const hPad = h.toString().padStart(2, '0');
    const simple = h > 12 ? (h - 12).toString() : h.toString();
    const period = h < 12 ? 'صبح' : h === 12 ? 'ظهر' : h < 17 ? 'بعدازظهر' : h < 20 ? 'عصر' : 'شب';
    options.push({
      time: `${hPad}:00`,
      label: `${toPersianNumbers(hPad)}:۰۰ (${toPersianNumbers(simple)} ${period})`,
      simpleHour: simple,
    });
    options.push({
      time: `${hPad}:30`,
      label: `${toPersianNumbers(hPad)}:۳۰ (${toPersianNumbers(simple)} و نیم ${period})`,
      simpleHour: `${simple}:30`,
    });
  }
  options.push({ time: '00:00', label: '۰۰:۰۰ (۱۲ شب / نیمه‌شب)', simpleHour: '12' });
  options.push({ time: '00:30', label: '۰۰:۳۰ (۱۲ و نیم بامداد)', simpleHour: '12:30' });
  options.push({ time: '01:00', label: '۰۱:۰۰ (۱ بامداد)', simpleHour: '1' });
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

export interface DaySchedule {
  date: string; // Jalali YYYY-MM-DD
  slots: string[];
}

export const TeacherScheduleScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const todayJalali = getTodayJalali();
  const [calJy, setCalJy] = useState<number>(todayJalali.jy);
  const [calJm, setCalJm] = useState<number>(todayJalali.jm);
  const [calJd, setCalJd] = useState<number>(todayJalali.jd);

  const [availableSchedule, setAvailableSchedule] = useState<DaySchedule[]>([]);
  const [daySlots, setDaySlots] = useState<string[]>([]);
  const [repeatWeekdays, setRepeatWeekdays] = useState<number[]>([]);
  const [selectedTime, setSelectedTime] = useState<{ time: string; label: string; simpleHour: string }>(
    TIME_OPTIONS.find((t) => t.time === '15:00') || TIME_OPTIONS[16]
  );
  const [isTimeDropdownVisible, setIsTimeDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Helper: compute weekday index (0=شنبه, 1=یکشنبه, ..., 6=جمعه)
  const getDayWeekday = (jy: number, jm: number, jd: number): number => {
    const g = jalaali.toGregorian(jy, jm, jd);
    const d = new Date(g.gy, g.gm - 1, g.gd);
    return (d.getDay() + 1) % 7;
  };

  // Helper: calculate 1.5-hour duration
  const calculateSlotRange = (timeStr: string): string => {
    const [h, m] = timeStr.split(':').map(Number);
    const startMins = (isNaN(h) ? 15 : h) * 60 + (isNaN(m) ? 0 : m);
    const endMins = startMins + 90; // Exactly 1.5 hours

    const toLabel = (totalMins: number) => {
      const hh = Math.floor(totalMins / 60) % 24;
      const mm = totalMins % 60;
      const simpleH = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
      const hP = toPersianNumbers(simpleH);
      if (mm === 30) return `${hP} و نیم`;
      if (mm === 0) return `${hP}`;
      return `${hP}:${toPersianNumbers(mm < 10 ? `0${mm}` : `${mm}`)}`;
    };

    const startLabel = toLabel(startMins);
    const endLabel = toLabel(endMins);
    return `${startLabel} تا ${endLabel}`;
  };

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/center/overview');
      if (res.data?.success && res.data.data?.profileSummary?.availableSchedule) {
        const sched = res.data.data.profileSummary.availableSchedule;
        setAvailableSchedule(sched);
        loadDaySlots(calJy, calJm, calJd, sched);
      }
    } catch (e) {
      console.warn('Error loading schedule:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const loadDaySlots = (jy: number, jm: number, jd: number, scheduleList: DaySchedule[]) => {
    const dateKey = formatJalaliStandard(jy, jm, jd);
    const dayEntry = scheduleList.find((s) => s.date === dateKey);
    setDaySlots(dayEntry ? [...dayEntry.slots] : []);
    setRepeatWeekdays([]);
  };

  const handleSelectDay = (dayNum: number) => {
    setCalJd(dayNum);
    loadDaySlots(calJy, calJm, dayNum, availableSchedule);
  };

  const handlePrevMonth = () => {
    if (calJm === 1) {
      setCalJm(12);
      setCalJy((prev) => prev - 1);
    } else {
      setCalJm((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calJm === 12) {
      setCalJm(1);
      setCalJy((prev) => prev + 1);
    } else {
      setCalJm((prev) => prev + 1);
    }
  };

  const handleAddSlot = () => {
    const range = calculateSlotRange(selectedTime.time);
    if (!range) {
      showWarning('لطفاً ساعت معتبری انتخاب کنید.');
      return;
    }
    if (daySlots.includes(range)) {
      showWarning('این بازه زمانی قبلاً افزوده شده است.');
      return;
    }
    setDaySlots((prev) => [...prev, range]);
    showSuccess(`بازه «${range}» ثبت شد.`);
  };

  const handleRemoveSlot = (idx: number) => {
    setDaySlots((prev) => prev.filter((_, i) => i !== idx));
    showSuccess('بازه زمانی حذف شد.');
  };

  const handleSaveSchedule = async () => {
    try {
      setSavingSchedule(true);
      let updated = [...availableSchedule];

      if (repeatWeekdays.length > 0) {
        // Repeat slots across all matching weekdays of this month
        const daysCount = getDaysInJalaliMonth(calJy, calJm);
        for (let day = 1; day <= daysCount; day++) {
          const wk = getDayWeekday(calJy, calJm, day);
          if (repeatWeekdays.includes(wk)) {
            const dateStr = formatJalaliStandard(calJy, calJm, day);
            const existingIdx = updated.findIndex((s) => s.date === dateStr);
            if (daySlots.length > 0) {
              if (existingIdx >= 0) {
                updated[existingIdx] = { date: dateStr, slots: [...daySlots] };
              } else {
                updated.push({ date: dateStr, slots: [...daySlots] });
              }
            } else {
              if (existingIdx >= 0) {
                updated.splice(existingIdx, 1);
              }
            }
          }
        }
      } else {
        const dateStr = formatJalaliStandard(calJy, calJm, calJd);
        const existingIdx = updated.findIndex((s) => s.date === dateStr);
        if (daySlots.length > 0) {
          if (existingIdx >= 0) {
            updated[existingIdx] = { date: dateStr, slots: [...daySlots] };
          } else {
            updated.push({ date: dateStr, slots: [...daySlots] });
          }
        } else {
          if (existingIdx >= 0) {
            updated.splice(existingIdx, 1);
          }
        }
      }

      await api.put('/teacher/center/workdesk-settings', {
        availableSchedule: updated,
      });

      setAvailableSchedule(updated);
      showSuccess('برنامه کاری شما با موفقیت ذخیره شد.');
      navigation.goBack();
    } catch (err: any) {
      showError(err.response?.data?.message || 'خطا در ذخیره برنامه کاری');
    } finally {
      setSavingSchedule(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronRight size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>تنظیم ساعات و روزهای کاری</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {/* Calendar Month Navigator */}
          <View style={[styles.calendarMonthHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn}>
              <ChevronRight size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.monthNavTitle, { color: colors.text }]}>
                {PERSIAN_MONTHS[calJm - 1]} {toPersianNumbers(calJy)}
              </Text>
              <Text style={[styles.monthNavSub, { color: colors.textLight }]}>
                روز موردنظر را جهت تنظیم ساعت انتخاب کنید
              </Text>
            </View>
            <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn}>
              <ChevronLeft size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Weekday Labels (ش تا ج) */}
          <View style={styles.calendarWeekdaysRow}>
            {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((dayInitial, idx) => (
              <View key={idx} style={styles.calendarWeekdayCell}>
                <Text style={[styles.calendarWeekdayText, { color: idx === 6 ? '#ef4444' : colors.textLight }]}>
                  {dayInitial}
                </Text>
              </View>
            ))}
          </View>

          {/* Monthly Calendar Grid */}
          <View style={styles.calendarGridWrap}>
            {getCalendarGrid(calJy, calJm).map((dayNum, cellIdx) => {
              if (dayNum === null) {
                return <View key={`empty-${cellIdx}`} style={styles.calendarDayCellEmpty} />;
              }
              const isSelected = calJd === dayNum;
              const isToday = todayJalali.jy === calJy && todayJalali.jm === calJm && todayJalali.jd === dayNum;
              const dateKey = formatJalaliStandard(calJy, calJm, dayNum);
              const daySchedule = availableSchedule.find((s) => s.date === dateKey);
              const hasSlots = daySchedule && daySchedule.slots && daySchedule.slots.length > 0;

              return (
                <TouchableOpacity
                  key={`day-${dayNum}`}
                  style={[
                    styles.calendarDayCell,
                    {
                      backgroundColor: hasSlots
                        ? isDark
                          ? '#065f4633'
                          : '#dcfce7'
                        : isDark
                        ? '#1e293b55'
                        : '#ffffff',
                      borderColor: isSelected
                        ? colors.primary
                        : hasSlots
                        ? '#86efac'
                        : '#f97316',
                      borderWidth: isSelected ? 2.5 : 1.2,
                    },
                  ]}
                  onPress={() => handleSelectDay(dayNum)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.calendarDayNum,
                      {
                        color: isSelected
                          ? colors.primary
                          : hasSlots
                          ? '#15803d'
                          : colors.text,
                        fontFamily: isSelected || hasSlots ? FONT_FAMILY.bold : FONT_FAMILY.medium,
                      },
                    ]}
                  >
                    {toPersianNumbers(dayNum)}
                  </Text>
                  {hasSlots ? (
                    <View style={styles.slotDotBadge}>
                      <View style={styles.greenDot} />
                      <Text style={styles.slotCountText}>
                        {toPersianNumbers(daySchedule.slots.length)}
                      </Text>
                    </View>
                  ) : (
                    <View style={{ height: 12 }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Calendar Color Legend */}
          <View style={[styles.calendarLegendCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, { backgroundColor: '#dcfce7', borderColor: '#16a34a' }]} />
              <Text style={[styles.legendText, { color: colors.text }]}>روزهای فعال (سبز)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, { borderColor: '#f97316', borderWidth: 2 }]} />
              <Text style={[styles.legendText, { color: colors.text }]}>روزهای خالی (بوردر نارنجی)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, { borderColor: colors.primary, borderWidth: 2 }]} />
              <Text style={[styles.legendText, { color: colors.text }]}>انتخاب‌شده</Text>
            </View>
          </View>

          {/* DAY CONFIGURATION SECTION */}
          <View style={[styles.dayCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.dayConfigHeader}>
              <Text style={[styles.dayConfigTitle, { color: colors.text }]}>
                برنامه روز {PERSIAN_DAY_NAMES[getDayWeekday(calJy, calJm, calJd)]} {toPersianNumbers(calJd)}{' '}
                {PERSIAN_MONTHS[calJm - 1]}
              </Text>
              <Text style={[styles.dayConfigSub, { color: colors.textLight }]}>
                مدت زمان هر جلسه تدریس و رفع اشکال ۱.۵ ساعت می‌باشد
              </Text>
            </View>

            {/* Existing Slots */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>
                نوبت‌های ثبت‌شده ({toPersianNumbers(daySlots.length)})
              </Text>
              {daySlots.length === 0 ? (
                <View style={[styles.emptySlotsNotice, { borderColor: colors.border }]}>
                  <Text style={[styles.emptySlotsText, { color: colors.textLight }]}>
                    هنوز نوبتی برای این روز ثبت نشده است. ساعت شروع را از دراپ‌داون زیر انتخاب و ثبت کنید.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 8, marginTop: 8 }}>
                  {daySlots.map((slot, sIdx) => (
                    <View
                      key={sIdx}
                      style={[
                        styles.slotItemRow,
                        { backgroundColor: isDark ? '#064e3b25' : '#f0fdf4', borderColor: '#86efac' },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => handleRemoveSlot(sIdx)}
                        style={styles.deleteSlotBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                      <View style={styles.slotItemInfo}>
                        <View style={styles.oneAndHalfBadge}>
                          <Text style={styles.oneAndHalfText}>۱.۵ ساعت</Text>
                        </View>
                        <Text style={[styles.slotItemText, { color: isDark ? '#a7f3d0' : '#14532d' }]}>
                          {slot} ثبت شده
                        </Text>
                        <Clock size={16} color="#16a34a" />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Time Selector Dropdown (7 AM to 1 AM) */}
            <View style={[styles.addSlotCard, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}>
              <Text style={[styles.sectionHeading, { color: colors.text, marginBottom: 4 }]}>
                انتخاب ساعت شروع جلسه (۷ صبح تا ۱ شب)
              </Text>
              <Text style={[styles.addSlotHelper, { color: colors.textLight }]}>
                روی ساعت زیر کلیک کنید تا منوی ساعات باز شود:
              </Text>

              {/* Dropdown Input Trigger */}
              <TouchableOpacity
                style={[
                  styles.timeDropdownTrigger,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={() => setIsTimeDropdownVisible(true)}
                activeOpacity={0.8}
              >
                <ChevronDown size={18} color={colors.textLight} />
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                  <Clock size={18} color={colors.primary} />
                  <Text style={[styles.timeDropdownValue, { color: colors.text }]}>
                    {selectedTime.label}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Calculated preview */}
              <View style={styles.calculatedPreviewRow}>
                <Clock size={14} color="#16a34a" />
                <Text style={styles.calculatedPreviewText}>
                  زمان محاسبه‌شده جلسه: {calculateSlotRange(selectedTime.time)}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.addSlotActionBtn, { backgroundColor: colors.primary, marginTop: 12 }]}
                onPress={handleAddSlot}
                activeOpacity={0.85}
              >
                <Plus size={16} color="#ffffff" />
                <Text style={styles.addSlotActionText}>ثبت این بازه ۱.۵ ساعته</Text>
              </TouchableOpacity>
            </View>

            {/* Weekdays Repeat Section */}
            <View style={[styles.repeatSectionCard, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}>
              <Text style={[styles.sectionHeading, { color: colors.text, marginBottom: 4 }]}>
                تکرار این برنامه در روزهای هفته (اختیاری)
              </Text>
              <Text style={[styles.repeatDesc, { color: colors.textLight }]}>
                روزهایی را که مایلید این ساعات برای تمام هفته‌های این ماه تکرار شوند انتخاب کنید:
              </Text>

              <View style={styles.weekdaysSelectionRow}>
                {PERSIAN_DAY_NAMES.map((wName, wIdx) => {
                  const isSelected = repeatWeekdays.includes(wIdx);
                  return (
                    <TouchableOpacity
                      key={wIdx}
                      style={[
                        styles.weekdayPill,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => {
                        if (isSelected) {
                          setRepeatWeekdays((prev) => prev.filter((i) => i !== wIdx));
                        } else {
                          setRepeatWeekdays((prev) => [...prev, wIdx]);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.weekdayPillText,
                          {
                            color: isSelected ? '#ffffff' : colors.text,
                            fontFamily: isSelected ? FONT_FAMILY.bold : FONT_FAMILY.medium,
                          },
                        ]}
                      >
                        {wName}
                      </Text>
                      {isSelected && (
                        <Check size={12} color="#ffffff" strokeWidth={3} style={{ marginRight: 2 }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveScheduleBtn, { backgroundColor: '#16a34a' }]}
              onPress={handleSaveSchedule}
              disabled={savingSchedule}
              activeOpacity={0.85}
            >
              {savingSchedule ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Check size={18} color="#ffffff" />
                  <Text style={styles.saveScheduleBtnText}>ذخیره و ثبت نهایی برنامه کاری</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* TIME DROPDOWN PICKER MODAL (7 AM to 1 AM) */}
      <Modal
        visible={isTimeDropdownVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsTimeDropdownVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.dropdownModalBox, { backgroundColor: colors.surface }]}>
            <View style={styles.dropdownModalHeader}>
              <TouchableOpacity onPress={() => setIsTimeDropdownVisible(false)}>
                <X size={20} color={colors.textLight} />
              </TouchableOpacity>
              <Text style={[styles.dropdownModalTitle, { color: colors.text }]}>
                انتخاب ساعت شروع (از ۷ صبح تا ۱ شب)
              </Text>
            </View>

            <FlatList
              data={TIME_OPTIONS}
              keyExtractor={(item) => item.time}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isItemSel = selectedTime.time === item.time;
                return (
                  <TouchableOpacity
                    style={[
                      styles.timeOptionRow,
                      isItemSel && { backgroundColor: isDark ? '#1e3a8a30' : '#eff6ff' },
                    ]}
                    onPress={() => {
                      setSelectedTime(item);
                      setIsTimeDropdownVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    {isItemSel && <Check size={16} color={colors.primary} />}
                    <Text
                      style={[
                        styles.timeOptionText,
                        {
                          color: isItemSel ? colors.primary : colors.text,
                          fontFamily: isItemSel ? FONT_FAMILY.bold : FONT_FAMILY.regular,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.bold,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  calendarMonthHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNavTitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.bold,
  },
  monthNavSub: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 2,
  },
  calendarWeekdaysRow: {
    flexDirection: 'row-reverse',
  },
  calendarWeekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  calendarWeekdayText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },
  calendarGridWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  calendarDayCellEmpty: {
    width: `${(100 - 6 * 1) / 7}%`,
    height: 48,
  },
  calendarDayCell: {
    width: `${(100 - 6 * 1) / 7}%`,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  calendarDayNum: {
    fontSize: 13,
  },
  slotDotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  greenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16a34a',
  },
  slotCountText: {
    fontSize: 9.5,
    fontFamily: FONT_FAMILY.bold,
    color: '#15803d',
  },
  calendarLegendCard: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  legendItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  legendIndicator: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10.5,
    fontFamily: FONT_FAMILY.regular,
  },
  dayCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  dayConfigHeader: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    alignItems: 'flex-end',
  },
  dayConfigTitle: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
  },
  dayConfigSub: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 2,
  },
  sectionWrap: {
    gap: 4,
  },
  sectionHeading: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
  },
  emptySlotsNotice: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    alignItems: 'center',
  },
  emptySlotsText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'center',
    lineHeight: 18,
  },
  slotItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  deleteSlotBtn: {
    padding: 6,
  },
  slotItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  oneAndHalfBadge: {
    backgroundColor: '#bbf7d0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  oneAndHalfText: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bold,
    color: '#15803d',
  },
  slotItemText: {
    fontSize: 12.5,
    fontFamily: FONT_FAMILY.bold,
  },
  addSlotCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  addSlotHelper: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'right',
    marginTop: 2,
    marginBottom: 10,
  },
  timeDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  timeDropdownValue: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
  },
  calculatedPreviewRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#dcfce740',
  },
  calculatedPreviewText: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.bold,
    color: '#15803d',
  },
  addSlotActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
  },
  addSlotActionText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontFamily: FONT_FAMILY.bold,
  },
  repeatSectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  repeatDesc: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'right',
    marginTop: 2,
    marginBottom: 10,
    lineHeight: 17,
  },
  weekdaysSelectionRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  weekdayPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  weekdayPillText: {
    fontSize: 11,
  },
  saveScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  saveScheduleBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontFamily: FONT_FAMILY.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dropdownModalBox: {
    maxHeight: '65%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
  },
  dropdownModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 8,
  },
  dropdownModalTitle: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
  },
  timeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  timeOptionText: {
    fontSize: 13,
  },
});

export default TeacherScheduleScreen;
