import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { showError, showWarning, showSuccess } from '../../components/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { ChevronRight, Save, Plus, Check, Clock, Calendar, ArrowRight } from 'lucide-react-native';
import { api } from '../../api/axiosConfig';
import { PERSIAN_WEEKDAYS, toPersianNumbers } from '../../utils/date/jalaliHelper';

const ORDERED_DAY_INDICES = [6, 0, 1, 2, 3, 4, 5];

interface DayConfig {
  shift: 'morning' | 'afternoon';
  period: number; // 0 = بدون زمان, 1 to 6
  duration: 45 | 90;
}

const WeeklyScheduleBuilderScreen = ({ route, navigation }: any) => {
  const { colors, isDark } = useTheme();

  const initialDay = route.params?.initialDay ?? 6;
  const initialClassId = route.params?.classId;
  const initialClassName = route.params?.className || '';
  const initialSchoolName = route.params?.schoolName || '';
  const initialSubject = route.params?.subject || route.params?.initialSubject || '';

  // Subject State
  const [subject, setSubject] = useState(initialSubject);
  const [existingSubjects, setExistingSubjects] = useState<string[]>([]);
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);

  // Common Class Fields
  const [className, setClassName] = useState(initialClassName);
  const [schoolName, setSchoolName] = useState(initialSchoolName);
  const [schools, setSchools] = useState<any[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Multi-day Selection State
  const [selectedDays, setSelectedDays] = useState<number[]>([initialDay]);

  // Per-Day Configuration (Shift, Period, Duration)
  const [dayConfigs, setDayConfigs] = useState<{ [dayIdx: number]: DayConfig }>({
    [initialDay]: { shift: 'morning', period: 0, duration: 90 },
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    // 1. Fetch schools
    try {
      const schoolRes = await api.get('/teacher/schools');
      if (schoolRes.data?.success) {
        setSchools(schoolRes.data.data || []);
      }
    } catch (e) {
      console.warn('Error fetching schools:', e);
    } finally {
      setIsLoadingSchools(false);
    }

    // 2. Fetch existing subjects from teacher's schedule & classrooms
    try {
      const [schedRes, classRes] = await Promise.allSettled([
        api.get('/teacher/schedule'),
        api.get('/teacher/classrooms'),
      ]);

      const found = new Set<string>();

      if (schedRes.status === 'fulfilled' && schedRes.value.data?.success) {
        const scheduleList = schedRes.value.data.data || [];
        scheduleList.forEach((item: any) => {
          if (item.subject && typeof item.subject === 'string' && item.subject.trim()) {
            found.add(item.subject.trim());
          }
        });
      }

      if (classRes.status === 'fulfilled' && classRes.value.data?.success) {
        const classroomsList = classRes.value.data.data || [];
        classroomsList.forEach((item: any) => {
          if (item.subjectName && typeof item.subjectName === 'string' && item.subjectName.trim()) {
            found.add(item.subjectName.trim());
          }
        });
      }

      const list = Array.from(found);
      setExistingSubjects(list);

      if (list.length > 0) {
        if (initialSubject && list.includes(initialSubject)) {
          setSubject(initialSubject);
          setIsCustomSubject(false);
        } else if (initialSubject) {
          setSubject(initialSubject);
          setIsCustomSubject(true);
        } else {
          setSubject(list[0]);
          setIsCustomSubject(false);
        }
      } else {
        // No previously registered subjects -> keep standard big input
        setIsCustomSubject(true);
      }
    } catch (e) {
      console.warn('Error fetching existing subjects:', e);
      setIsCustomSubject(true);
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  // Toggle day selection
  const handleToggleDay = (dayIdx: number) => {
    if (selectedDays.includes(dayIdx)) {
      if (selectedDays.length === 1) {
        showWarning('حداقل یک روز باید انتخاب باشد');
        return;
      }
      setSelectedDays(prev => prev.filter(d => d !== dayIdx));
    } else {
      const newDays = [...selectedDays, dayIdx].sort(
        (a, b) => ORDERED_DAY_INDICES.indexOf(a) - ORDERED_DAY_INDICES.indexOf(b)
      );
      setSelectedDays(newDays);

      // Initialize config for new day if not set
      if (!dayConfigs[dayIdx]) {
        const baseConfig = dayConfigs[selectedDays[0]] || { shift: 'morning', period: 0, duration: 90 };
        setDayConfigs(prev => ({
          ...prev,
          [dayIdx]: { ...baseConfig },
        }));
      }
    }
  };

  const updateDayConfig = (dayIdx: number, patch: Partial<DayConfig>) => {
    setDayConfigs(prev => {
      const current = prev[dayIdx] || { shift: 'morning', period: 0, duration: 90 };
      return {
        ...prev,
        [dayIdx]: { ...current, ...patch },
      };
    });
  };

  const computeTime = (s: 'morning' | 'afternoon', p: number, d: 45 | 90) => {
    if (p === 0) return { startTime: '', endTime: '' };

    let startHour = s === 'morning' ? 8 : 13;
    let startMinute = 0;

    const totalBreakMinutes = (p - 1) * 15;
    const totalClassMinutes = (p - 1) * d;
    const totalPassedMinutes = totalBreakMinutes + totalClassMinutes;

    startHour += Math.floor((startMinute + totalPassedMinutes) / 60);
    startMinute = (startMinute + totalPassedMinutes) % 60;

    const endTotalMinutes = startMinute + d;
    let endHour = startHour + Math.floor(endTotalMinutes / 60);
    let endMinute = endTotalMinutes % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    return {
      startTime: `${pad(startHour)}:${pad(startMinute)}`,
      endTime: `${pad(endHour)}:${pad(endMinute)}`,
    };
  };

  const handleSave = async () => {
    const finalSubject = subject.trim();
    if (!finalSubject) {
      showWarning('نام درس را وارد یا انتخاب کنید');
      return;
    }
    if (!schoolName.trim()) {
      showWarning('نام مدرسه را وارد یا انتخاب کنید');
      return;
    }
    if (selectedDays.length === 0) {
      showWarning('حداقل یک روز باید انتخاب شده باشد');
      return;
    }

    setIsSaving(true);
    try {
      let finalSchoolId = null;
      const existingSchool = schools.find(s => s.name?.trim() === schoolName.trim());

      if (existingSchool) {
        finalSchoolId = existingSchool._id;
      } else {
        const schoolRes = await api.post('/teacher/schools', { name: schoolName.trim() });
        if (schoolRes.data?.success) {
          finalSchoolId = schoolRes.data.data?._id;
        }
      }

      // Save schedule item for each selected day
      for (const dayIdx of selectedDays) {
        const cfg = dayConfigs[dayIdx] || { shift: 'morning', period: 0, duration: 90 };
        const { startTime, endTime } = computeTime(cfg.shift, cfg.period, cfg.duration);

        const data: any = {
          subject: finalSubject,
          className: className.trim(),
          dayOfWeek: dayIdx,
          startTime,
          endTime,
          schoolId: finalSchoolId,
          schoolName: schoolName.trim(),
        };

        if (initialClassId) {
          data.classId = initialClassId;
        }

        await api.post('/teacher/schedule', data);
      }

      const msg =
        selectedDays.length > 1
          ? `برنامه برای ${toPersianNumbers(selectedDays.length)} روز با موفقیت ذخیره شد`
          : 'برنامه با موفقیت ذخیره شد';

      showSuccess(msg);
      navigation.goBack();
    } catch (e: any) {
      console.warn('Error saving schedule:', e);
      showError(e.response?.data?.message || 'خطا در ذخیره برنامه هفتگی');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header - RTL */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronRight color={colors.text} size={26} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>ثبت کلاس جدید</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ۱. فیلد یا لیست نام درس */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.label, { color: colors.text }]}>نام درس</Text>
          {existingSubjects.length > 0 && isCustomSubject && (
            <TouchableOpacity onPress={() => setIsCustomSubject(false)} style={styles.switchModeBtn}>
              <Text style={[styles.switchModeText, { color: colors.primary }]}>← انتخاب از درس‌های قبلی</Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoadingSubjects ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
        ) : existingSubjects.length > 0 && !isCustomSubject ? (
          /* اگر درس قبلی وجود داشت: لیست چیپ‌های درس‌ها + گزینه افزودن درس جدید */
          <View style={styles.wrapContainer}>
            {existingSubjects.map(s => {
              const isSelected = subject === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.subjectChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSubject(s)}
                  activeOpacity={0.7}
                >
                  {isSelected && <Check size={14} color="#fff" style={{ marginLeft: 4 }} />}
                  <Text style={[styles.subjectChipText, { color: isSelected ? '#fff' : colors.text }]}>{s}</Text>
                </TouchableOpacity>
              );
            })}

            {/* دکمه + افزودن درس جدید */}
            <TouchableOpacity
              style={[
                styles.subjectChip,
                styles.addSubjectChip,
                { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(13, 148, 136, 0.1)' : '#F0FDFA' },
              ]}
              onPress={() => {
                setIsCustomSubject(true);
                setSubject('');
              }}
              activeOpacity={0.7}
            >
              <Plus size={15} color={colors.primary} style={{ marginLeft: 4 }} />
              <Text style={[styles.subjectChipText, { color: colors.primary, fontWeight: '700' }]}>
                افزودن درس جدید
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* در صورت نبود درس از قبل یا انتخاب افزودن درس جدید: ورودی متنی بزرگ */
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="مثلاً ریاضی، علوم یا فیزیک..."
            placeholderTextColor={colors.textLight}
            value={subject}
            onChangeText={setSubject}
          />
        )}

        {/* ۲. پایه / کلاس */}
        <Text style={[styles.label, { color: colors.text }]}>پایه / کلاس</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          placeholder="مثلاً پایه هفتم یا کلاس ۳۰۱"
          placeholderTextColor={colors.textLight}
          value={className}
          onChangeText={setClassName}
        />

        {/* ۳. انتخاب روزهای هفته (امکان انتخاب ۲ یا چند روز) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.label, { color: colors.text }]}>روزهای هفته</Text>
          <Text style={[styles.hintText, { color: colors.textLight }]}>
            {selectedDays.length > 1
              ? `${toPersianNumbers(selectedDays.length)} روز انتخاب شده`
              : 'امکان انتخاب چند روز'}
          </Text>
        </View>

        <View style={styles.wrapContainer}>
          {ORDERED_DAY_INDICES.map(dayIdx => {
            const isSelected = selectedDays.includes(dayIdx);
            return (
              <TouchableOpacity
                key={dayIdx}
                style={[
                  styles.dayChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleToggleDay(dayIdx)}
                activeOpacity={0.7}
              >
                {isSelected && <Check size={14} color="#fff" style={{ marginLeft: 4 }} />}
                <Text style={[styles.dayChipText, { color: isSelected ? '#fff' : colors.text }]}>
                  {PERSIAN_WEEKDAYS[dayIdx]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ۴. تفکیک شیفت، زنگ و زمان برای هر یک از روزهای انتخاب‌شده */}
        <View style={styles.timingSection}>
          <Text style={[styles.label, { color: colors.text, marginTop: 18, marginBottom: 8 }]}>
            {selectedDays.length > 1
              ? 'تنظیمات زمان، شیفت و زنگ کلاس‌ها به تفکیک روز'
              : 'تنظیمات زمان و زنگ کلاس'}
          </Text>

          {selectedDays.map(dayIdx => {
            const cfg = dayConfigs[dayIdx] || { shift: 'morning', period: 0, duration: 90 };
            const timeInfo = computeTime(cfg.shift, cfg.period, cfg.duration);
            const dayName = PERSIAN_WEEKDAYS[dayIdx];

            return (
              <View
                key={dayIdx}
                style={[
                  styles.dayCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                {/* سربرگ کارت روز */}
                <View style={styles.dayCardHeader}>
                  <View style={styles.dayCardTitleRow}>
                    <Calendar size={16} color={colors.primary} style={{ marginLeft: 6 }} />
                    <Text style={[styles.dayCardTitle, { color: colors.text }]}>
                      کلاس روز {dayName}
                    </Text>
                  </View>

                  {/* پیش‌نمایش زمان محاسبه‌شده */}
                  <View
                    style={[
                      styles.timeBadge,
                      {
                        backgroundColor: cfg.period > 0 ? (isDark ? '#064e3b' : '#ecfdf5') : '#f1f5f9',
                      },
                    ]}
                  >
                    <Clock size={12} color={cfg.period > 0 ? '#059669' : '#64748b'} style={{ marginLeft: 4 }} />
                    <Text
                      style={[
                        styles.timeBadgeText,
                        { color: cfg.period > 0 ? '#059669' : '#64748b' },
                      ]}
                    >
                      {cfg.period > 0
                        ? `${toPersianNumbers(timeInfo.startTime)} تا ${toPersianNumbers(timeInfo.endTime)}`
                        : 'بدون زمان مشخص'}
                    </Text>
                  </View>
                </View>

                {/* شیفت کلاس برای این روز */}
                <Text style={[styles.subLabel, { color: colors.textLight }]}>
                  شیفت برای روز {dayName}:
                </Text>
                <View style={styles.segmentedRow}>
                  <TouchableOpacity
                    style={[
                      styles.segmentedBtn,
                      cfg.shift === 'morning' && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => updateDayConfig(dayIdx, { shift: 'morning' })}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.segmentedText,
                        { color: cfg.shift === 'morning' ? '#fff' : colors.text },
                      ]}
                    >
                      صبح
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.segmentedBtn,
                      cfg.shift === 'afternoon' && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => updateDayConfig(dayIdx, { shift: 'afternoon' })}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.segmentedText,
                        { color: cfg.shift === 'afternoon' ? '#fff' : colors.text },
                      ]}
                    >
                      عصر
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* زنگ کلاس برای این روز */}
                <Text style={[styles.subLabel, { color: colors.textLight }]}>
                  زنگ کلاس برای روز {dayName}:
                </Text>
                <View style={styles.wrapContainer}>
                  {[0, 1, 2, 3, 4, 5, 6].map(p => {
                    const isPSelected = cfg.period === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.periodChip,
                          {
                            backgroundColor: isPSelected ? colors.primary : colors.background,
                            borderColor: isPSelected ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => updateDayConfig(dayIdx, { period: p })}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.periodChipText,
                            { color: isPSelected ? '#fff' : colors.text },
                          ]}
                        >
                          {p === 0 ? 'بدون زمان' : `زنگ ${toPersianNumbers(p)}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* زمان کلاس برای این روز */}
                <Text style={[styles.subLabel, { color: colors.textLight }]}>
                  زمان کلاس برای روز {dayName}:
                </Text>
                <View style={styles.segmentedRow}>
                  <TouchableOpacity
                    style={[
                      styles.segmentedBtn,
                      cfg.duration === 45 && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => updateDayConfig(dayIdx, { duration: 45 })}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.segmentedText,
                        { color: cfg.duration === 45 ? '#fff' : colors.text },
                      ]}
                    >
                      ۴۵ دقیقه
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.segmentedBtn,
                      cfg.duration === 90 && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => updateDayConfig(dayIdx, { duration: 90 })}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.segmentedText,
                        { color: cfg.duration === 90 ? '#fff' : colors.text },
                      ]}
                    >
                      ۱ ساعت و نیم (۹۰ دقیقه)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* ۵. مدرسه (ثابت برای تمام روزهای انتخاب‌شده) */}
        <Text style={[styles.label, { color: colors.text, marginTop: 18 }]}>مدرسه</Text>
        {isLoadingSchools ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
        ) : schools.length > 0 ? (
          <View style={styles.wrapContainer}>
            {schools.map(sch => {
              const isSelected = schoolName === sch.name;
              return (
                <TouchableOpacity
                  key={sch._id}
                  style={[
                    styles.schoolChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSchoolName(sch.name)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.schoolChipText,
                      { color: isSelected ? '#fff' : colors.text },
                    ]}
                  >
                    {sch.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          placeholder="اگر مدرسه در لیست بالا نیست، اینجا تایپ کنید"
          placeholderTextColor={colors.textLight}
          value={schoolName}
          onChangeText={setSchoolName}
        />

        {/* ۶. دکمه ذخیره */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Save color="#fff" size={20} style={{ marginLeft: 8 }} />
              <Text style={styles.saveBtnText}>
                {selectedDays.length > 1
                  ? `ذخیره برای ${toPersianNumbers(selectedDays.length)} روز`
                  : 'ذخیره کلاس'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  sectionHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 14,
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 12.5,
    fontFamily: 'IRANSansX',
    textAlign: 'right',
    marginTop: 10,
    marginBottom: 6,
  },
  hintText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
  },
  switchModeBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  switchModeText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: 'IRANSansX',
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 4,
  },
  wrapContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
    justifyContent: 'flex-start',
  },
  subjectChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  addSubjectChip: {
    borderStyle: 'dashed',
  },
  subjectChipText: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
  },
  dayChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  dayChipText: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
    fontWeight: '600',
  },
  timingSection: {
    marginTop: 6,
  },
  dayCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  dayCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 6,
  },
  dayCardTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  dayCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },
  timeBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeBadgeText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    fontWeight: '600',
  },
  segmentedRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 4,
  },
  segmentedBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  segmentedText: {
    fontFamily: 'IRANSansX',
    fontSize: 12.5,
    fontWeight: '600',
  },
  periodChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  periodChipText: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
    fontWeight: '600',
  },
  schoolChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  schoolChipText: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
  },
  loader: {
    alignSelf: 'flex-end',
    marginVertical: 8,
  },
  saveBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    marginTop: 28,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },
});

export default WeeklyScheduleBuilderScreen;
