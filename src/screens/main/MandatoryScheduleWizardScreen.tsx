import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { 
  BookOpen, 
  School as SchoolIcon, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Plus, 
  Check, 
  Edit3,
  Layers,
  Repeat
} from 'lucide-react-native';
import { api } from '../../api/axiosConfig';
import { showSuccess, showError, showWarning } from '../../components/feedback';
import { toPersianNumbers } from '../../utils/date/jalaliHelper';
import { FONT_FAMILY } from '../../theme/typography';

// ترتیب روزهای هفته به صورت راست‌چین از شنبه تا پنج‌شنبه
// مطابق با getDay() جاوااسکریپت:
// 6 = شنبه, 0 = یکشنبه, 1 = دوشنبه, 2 = سه‌شنبه, 3 = چهارشنبه, 4 = پنج‌شنبه
const ORDERED_WEEKDAYS = [
  { id: 6, label: 'شنبه' },
  { id: 0, label: 'یکشنبه' },
  { id: 1, label: 'دوشنبه' },
  { id: 2, label: 'سه‌شنبه' },
  { id: 3, label: 'چهارشنبه' },
  { id: 4, label: 'پنج‌شنبه' },
];

// لیست ۸ زنگ بدون ساعت
const PERIOD_LIST = [1, 2, 3, 4, 5, 6, 7, 8];

const PRESET_SUBJECTS = [
  'ریاضی',
  'ادبیات فارسی',
  'علوم تجربی',
  'زبان انگلیسی',
  'عربی',
  'مطالعات اجتماعی',
  'فیزیک',
  'شیمی',
  'زیست‌شناسی',
  'دین و زندگی',
  'کار و فناوری',
  'هنر',
];

const PRESET_COLORS = [
  '#2563eb', // آبی
  '#10b981', // سبز زمردی
  '#8b5cf6', // بنفش
  '#f59e0b', // کهربایی
  '#ec4899', // سرخابی
  '#06b6d4', // فیروزه‌ای
];

interface LessonSession {
  dayOfWeek: number;
  period: number;
}

interface LessonItem {
  id: string;
  schoolName: string;
  schoolId?: string;
  subject: string;
  className: string;
  sessions: LessonSession[];
  color: string;
}

const MandatoryScheduleWizardScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const { setNeedsScheduleSetup } = React.useContext(AuthContext);

  // مرحله جاری: 1 = درس اول, 2 = درس دوم, 3 = مرور و ثبت
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [createdLessons, setCreatedLessons] = useState<LessonItem[]>([]);
  const [dbSchools, setDbSchools] = useState<any[]>([]);

  // فیلدهای فرم جاری
  const [schoolName, setSchoolName] = useState('');
  const [isCustomSchool, setIsCustomSchool] = useState(false);
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [className, setClassName] = useState('');
  
  // انتخاب روزها (امکان تکرار درس در هفته و برگزاری چند جلسه)
  const [selectedDays, setSelectedDays] = useState<number[]>([6]); // پیش‌فرض: شنبه
  // زنگ اختصاص‌یافته به هر روز: { [dayId]: periodNumber }
  const [dayPeriods, setDayPeriods] = useState<{ [dayId: number]: number }>({ 6: 1 });
  const [activeDayForPeriod, setActiveDayForPeriod] = useState<number>(6);

  const [color, setColor] = useState(PRESET_COLORS[0]);

  // انیمیشن سوئیچ مرحله
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // جلوگیری از بازگشت فیزیکی در اندروید (چون بخش اجباری است)
  useEffect(() => {
    const onBackPress = () => {
      if (currentStep > 1) {
        goToStep(currentStep - 1);
        return true;
      }
      showWarning('برای فعال‌سازی و شروع به کار با کیتایار، تعریف حداقل ۲ درس الزامی است.');
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [currentStep]);

  // دریافت لیست مدارس موجود از سرور در صورت وجود
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/teacher/schools');
        if (res.data?.success && Array.isArray(res.data.data)) {
          setDbSchools(res.data.data);
          if (res.data.data.length > 0 && !schoolName) {
            setSchoolName(res.data.data[0].name);
          }
        }
      } catch (err) {
        console.warn('Error fetching schools:', err);
      }
    })();
  }, []);

  // انیمیشن نرم تغییر مرحله
  const animateTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 25,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(-25);
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const goToStep = (step: number) => {
    animateTransition(() => {
      setCurrentStep(step);
      if (step === 1 && createdLessons.length > 0) {
        const l1 = createdLessons[0];
        setSchoolName(l1.schoolName);
        setSubject(l1.subject);
        setClassName(l1.className);
        setColor(l1.color);
        const days = l1.sessions.map(s => s.dayOfWeek);
        setSelectedDays(days);
        const pMap: { [dayId: number]: number } = {};
        l1.sessions.forEach(s => { pMap[s.dayOfWeek] = s.period; });
        setDayPeriods(pMap);
        setActiveDayForPeriod(days[0] || 6);
      } else if (step === 2) {
        if (createdLessons.length > 1) {
          const l2 = createdLessons[1];
          setSchoolName(l2.schoolName);
          setSubject(l2.subject);
          setClassName(l2.className);
          setColor(l2.color);
          const days = l2.sessions.map(s => s.dayOfWeek);
          setSelectedDays(days);
          const pMap: { [dayId: number]: number } = {};
          l2.sessions.forEach(s => { pMap[s.dayOfWeek] = s.period; });
          setDayPeriods(pMap);
          setActiveDayForPeriod(days[0] || 0);
        } else {
          // استفاده داینامیک از مدرسه درس اول به عنوان پیش‌فرض!
          const prevSchool = createdLessons[0]?.schoolName || schoolName;
          setSchoolName(prevSchool);
          setIsCustomSchool(false);
          setSubject('');
          setClassName('');
          // پیشنهاد یکشنبه زنگ ۲
          setSelectedDays([0]);
          setDayPeriods({ 0: 2 });
          setActiveDayForPeriod(0);
          setColor(PRESET_COLORS[1]);
        }
      }
    });
  };

  // تاگل انتخاب روز (امکان تکرار و انتخاب چند روز برای یک درس)
  const handleToggleDay = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length === 1) {
        showWarning('حداقل یک روز باید انتخاب باشد.');
        return;
      }
      const updated = selectedDays.filter(d => d !== dayId);
      setSelectedDays(updated);
      const newPeriods = { ...dayPeriods };
      delete newPeriods[dayId];
      setDayPeriods(newPeriods);
      if (activeDayForPeriod === dayId) {
        setActiveDayForPeriod(updated[0]);
      }
    } else {
      const updated = [...selectedDays, dayId].sort(
        (a, b) => ORDERED_WEEKDAYS.findIndex(w => w.id === a) - ORDERED_WEEKDAYS.findIndex(w => w.id === b)
      );
      setSelectedDays(updated);
      // تخصیص زنگ پیش‌فرض (همان زنگ فعال جاری)
      const currentPeriod = dayPeriods[activeDayForPeriod] || 1;
      setDayPeriods(prev => ({
        ...prev,
        [dayId]: currentPeriod,
      }));
      setActiveDayForPeriod(dayId);
    }
  };

  // انتخاب زنگ برای روز فعال
  const handleSelectPeriod = (periodNum: number) => {
    setDayPeriods(prev => ({
      ...prev,
      [activeDayForPeriod]: periodNum,
    }));
  };

  // اعمال زنگ انتخابی به تمام روزهای این درس
  const handleApplyPeriodToAllDays = (periodNum: number) => {
    const updated: { [dayId: number]: number } = {};
    selectedDays.forEach(d => {
      updated[d] = periodNum;
    });
    setDayPeriods(updated);
  };

  // انتخاب درس و تولید خودکار نام کلاس
  const handleSelectSubject = (selectedSub: string) => {
    setSubject(selectedSub);
    setIsCustomSubject(false);
    if (!className || className.startsWith('کلاس ')) {
      setClassName(`کلاس ${selectedSub}`);
    }
  };

  // اعتبارسنجی و تایید درس اول
  const handleNextFromStep1 = () => {
    const finalSchool = schoolName.trim();
    const finalSubject = (isCustomSubject ? customSubject : subject).trim();
    const finalClass = className.trim();

    if (!finalSchool) {
      showWarning('لطفاً نام مدرسه را مشخص کنید.');
      return;
    }
    if (!finalSubject) {
      showWarning('لطفاً نام درس اول را مشخص کنید.');
      return;
    }
    if (!finalClass) {
      showWarning('لطفاً نام کلاس اول را وارد کنید.');
      return;
    }
    if (selectedDays.length === 0) {
      showWarning('حداقل یک روز باید انتخاب شود.');
      return;
    }

    const sessions: LessonSession[] = selectedDays.map(d => ({
      dayOfWeek: d,
      period: dayPeriods[d] || 1,
    }));

    const lesson1: LessonItem = {
      id: 'lesson-1',
      schoolName: finalSchool,
      subject: finalSubject,
      className: finalClass,
      sessions,
      color: color || PRESET_COLORS[0],
    };

    setCreatedLessons([lesson1]);

    // انتقال به مرحله ۲ همراه با پیش‌فرض قرار دادن مدرسه درس اول
    animateTransition(() => {
      setCurrentStep(2);
      setSchoolName(finalSchool);
      setIsCustomSchool(false);
      setSubject('');
      setCustomSubject('');
      setIsCustomSubject(false);
      setClassName('');
      setSelectedDays([0]); // یکشنبه
      setDayPeriods({ 0: 2 });
      setActiveDayForPeriod(0);
      setColor(PRESET_COLORS[1]);
    });
  };

  // اعتبارسنجی و تایید درس دوم
  const handleNextFromStep2 = () => {
    const finalSchool = schoolName.trim();
    const finalSubject = (isCustomSubject ? customSubject : subject).trim();
    const finalClass = className.trim();

    if (!finalSchool) {
      showWarning('لطفاً نام مدرسه را مشخص کنید.');
      return;
    }
    if (!finalSubject) {
      showWarning('لطفاً نام درس دوم را مشخص کنید.');
      return;
    }
    if (!finalClass) {
      showWarning('لطفاً نام کلاس دوم را وارد کنید.');
      return;
    }
    if (selectedDays.length === 0) {
      showWarning('حداقل یک روز باید انتخاب شود.');
      return;
    }

    const sessions: LessonSession[] = selectedDays.map(d => ({
      dayOfWeek: d,
      period: dayPeriods[d] || 1,
    }));

    const lesson2: LessonItem = {
      id: 'lesson-2',
      schoolName: finalSchool,
      subject: finalSubject,
      className: finalClass,
      sessions,
      color: color || PRESET_COLORS[1],
    };

    setCreatedLessons([createdLessons[0], lesson2]);

    animateTransition(() => {
      setCurrentStep(3);
    });
  };

  // ثبت نهایی تمام درس‌ها، کلاس‌ها و جلسات هفتگی در سرور
  const handleFinalSubmit = async () => {
    if (createdLessons.length < 2) {
      showWarning('حداقل ۲ درس باید ثبت شده باشد.');
      return;
    }

    setIsSubmitting(true);
    try {
      const schoolCache: { [name: string]: string } = {};
      dbSchools.forEach(s => {
        if (s.name) schoolCache[s.name.trim()] = s._id;
      });

      for (const lesson of createdLessons) {
        const sName = lesson.schoolName.trim();
        let targetSchoolId = schoolCache[sName];

        // ۱. ایجاد یا دریافت مدرسه
        if (!targetSchoolId) {
          try {
            const scRes = await api.post('/teacher/schools', { name: sName });
            if (scRes.data?.success && scRes.data.data?._id) {
              targetSchoolId = scRes.data.data._id;
              schoolCache[sName] = targetSchoolId;
            }
          } catch (e: any) {
            const refSchools = await api.get('/teacher/schools');
            const found = refSchools.data?.data?.find((s: any) => s.name?.trim() === sName);
            if (found) targetSchoolId = found._id;
          }
        }

        // ۲. ساخت یک کلاس مشترک برای این درس در سیستم
        let createdClassId: string | undefined = undefined;
        try {
          const classRes = await api.post('/teacher/classrooms', {
            name: lesson.className,
            subjectName: lesson.subject,
            schoolId: targetSchoolId || undefined,
          });
          if (classRes.data?.success && classRes.data.data?._id) {
            createdClassId = classRes.data.data._id;
          }
        } catch (e) {
          console.warn('Classroom creation warning:', e);
        }

        // ۳. ساخت آیتم‌های برنامه هفتگی برای تمام جلسات این درس (امکان تکرار در هفته)
        for (const session of lesson.sessions) {
          await api.post('/teacher/schedule', {
            schoolId: targetSchoolId || undefined,
            schoolName: sName,
            classId: createdClassId,
            className: lesson.className,
            subject: lesson.subject,
            dayOfWeek: session.dayOfWeek,
            startTime: `زنگ ${toPersianNumbers(session.period)}`,
            endTime: '',
            color: lesson.color,
          });
        }
      }

      showSuccess('برنامه هفتگی و کلاس‌های شما با موفقیت ذخیره شدند!');
      setNeedsScheduleSetup(false);
      navigation.replace('MainTabNavigator');
    } catch (error: any) {
      console.error('Final schedule setup error:', error);
      showError(error.response?.data?.message || 'خطا در ثبت برنامه هفتگی. دوباره تلاش کنید.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const firstLessonSchool = createdLessons[0]?.schoolName || '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* هدر کاملاً راست‌چین با نوار پیشرفت */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleRow}>
          <View style={[styles.badgeIcon, { backgroundColor: colors.iconBackground }]}>
            <Sparkles size={20} color={colors.primary} />
          </View>
          <View style={styles.headerTextGroup}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>راه‌اندازی برنامه هفتگی و کلاس‌ها</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textLight }]}>
              {currentStep === 1 && 'گام ۱ از ۲: تعریف درس اول'}
              {currentStep === 2 && 'گام ۲ از ۲: تعریف درس دوم'}
              {currentStep === 3 && 'مرور و تایید نهایی'}
            </Text>
          </View>
        </View>

        {/* نوار پیشرفت نرم به سبک RTL */}
        <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }]}>
          <View
            style={[
              styles.progressBar,
              {
                backgroundColor: currentStep === 3 ? colors.success : colors.primary,
                width: currentStep === 1 ? '35%' : currentStep === 2 ? '70%' : '100%',
              },
            ]}
          />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            }}
          >
            {/* پیام راهنما */}
            <View style={[styles.infoBanner, { backgroundColor: isDark ? 'rgba(37,99,235,0.12)' : '#eff6ff', borderColor: colors.primary }]}>
              <Text style={[styles.infoBannerText, { color: colors.primary }]}>
                {currentStep === 1 && '📌 جهت شروع استفاده از اپلیکیشن کیتایار، تعریف حداقل ۲ درس هفتگی الزامی است.'}
                {currentStep === 2 && '✨ یک درس دیگر وارد کنید تا برنامه هفتگی و کلاس‌های شما فعال شوند.'}
                {currentStep === 3 && '🎉 حداقل ۲ درس الزامی تکمیل شد! اطلاعات را بررسی و تایید نمایید.'}
              </Text>
            </View>

            {/* فرم مرحله ۱ و ۲ */}
            {(currentStep === 1 || currentStep === 2) && (
              <View>
                {/* ۱. بخش مدرسه (با پیش‌فرض داینامیک در مرحله ۲) */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.cardHeaderRow}>
                    <SchoolIcon size={20} color={colors.primary} />
                    <Text style={[styles.cardTitle, { color: colors.text }]}>نام مدرسه</Text>
                  </View>

                  {currentStep === 2 && !isCustomSchool && firstLessonSchool ? (
                    <View style={[styles.dynamicSchoolBanner, { backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : '#ecfdf5', borderColor: colors.success }]}>
                      <View style={styles.dynamicSchoolContent}>
                        <View style={styles.dynamicSchoolTextGroup}>
                          <Text style={[styles.dynamicSchoolLabel, { color: colors.success }]}>
                            مدرسه پیش‌فرض (انتخاب شده از درس اول):
                          </Text>
                          <Text style={[styles.dynamicSchoolName, { color: colors.text }]}>
                            {firstLessonSchool}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.changeSchoolBtn, { borderColor: colors.border }]}
                          onPress={() => setIsCustomSchool(true)}
                          activeOpacity={0.7}
                        >
                          <Edit3 size={14} color={colors.primary} />
                          <Text style={[styles.changeSchoolBtnText, { color: colors.primary }]}>تغییر مدرسه</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View>
                      {dbSchools.length > 0 && (
                        <View style={styles.chipsWrapRtl}>
                          {dbSchools.map(s => {
                            const isSelected = schoolName === s.name;
                            return (
                              <TouchableOpacity
                                key={s._id}
                                style={[
                                  styles.chip,
                                  {
                                    backgroundColor: isSelected ? colors.primary : (isDark ? '#334155' : '#f1f5f9'),
                                    borderColor: isSelected ? colors.primary : colors.border,
                                  },
                                ]}
                                onPress={() => setSchoolName(s.name)}
                                activeOpacity={0.7}
                              >
                                <Text style={[styles.chipText, { color: isSelected ? '#ffffff' : colors.text }]}>
                                  {s.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}

                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                            borderColor: colors.border,
                            color: colors.text,
                          },
                        ]}
                        placeholder="نام مدرسه (مثال: دبیرستان البرز، دبستان شاهد...)"
                        placeholderTextColor={colors.textLight}
                        value={schoolName}
                        onChangeText={setSchoolName}
                        textAlign="right"
                      />
                    </View>
                  )}
                </View>

                {/* ۲. بخش نام درس */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderTitleGroup}>
                      <BookOpen size={20} color={colors.primary} />
                      <Text style={[styles.cardTitle, { color: colors.text }]}>نام درس</Text>
                    </View>
                    {isCustomSubject && (
                      <TouchableOpacity onPress={() => setIsCustomSubject(false)} style={styles.switchModeBtn}>
                        <Text style={[styles.switchModeText, { color: colors.primary }]}>← لیست دروس آماده</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {!isCustomSubject ? (
                    <View>
                      <View style={styles.chipsWrapRtl}>
                        {PRESET_SUBJECTS.map(subItem => {
                          const isUsedInLesson1 = currentStep === 2 && createdLessons[0]?.subject === subItem;
                          const isSelected = subject === subItem;

                          return (
                            <TouchableOpacity
                              key={subItem}
                              style={[
                                styles.chip,
                                {
                                  backgroundColor: isSelected ? colors.primary : (isDark ? '#334155' : '#f1f5f9'),
                                  borderColor: isSelected ? colors.primary : colors.border,
                                  opacity: isUsedInLesson1 ? 0.6 : 1,
                                },
                              ]}
                              onPress={() => handleSelectSubject(subItem)}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.chipText,
                                  { color: isSelected ? '#ffffff' : colors.text },
                                ]}
                              >
                                {subItem} {isUsedInLesson1 ? '(درس ۱)' : ''}
                              </Text>
                              {isSelected && <Check size={14} color="#ffffff" style={{ marginRight: 4 }} />}
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <TouchableOpacity
                        style={styles.customSubjectToggle}
                        onPress={() => {
                          setIsCustomSubject(true);
                          setSubject('');
                        }}
                      >
                        <Plus size={16} color={colors.primary} />
                        <Text style={[styles.customSubjectToggleText, { color: colors.primary }]}>
                          سایر دروس (تایپ دستی نام درس)
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                          borderColor: colors.border,
                          color: colors.text,
                        },
                      ]}
                      placeholder="نام درس را بنویسید (مثال: حسابان، تاریخ، تفکر...)"
                      placeholderTextColor={colors.textLight}
                      value={customSubject}
                      onChangeText={(t) => {
                        setCustomSubject(t);
                        setSubject(t);
                        if (!className || className.startsWith('کلاس ')) {
                          setClassName(`کلاس ${t}`);
                        }
                      }}
                      textAlign="right"
                      autoFocus
                    />
                  )}
                </View>

                {/* ۳. بخش نام کلاس (ساخت خودکار) */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderTitleGroup}>
                      <Layers size={20} color={colors.primary} />
                      <Text style={[styles.cardTitle, { color: colors.text }]}>نام کلاس</Text>
                    </View>
                    <View style={[styles.autoBadge, { backgroundColor: isDark ? 'rgba(37,99,235,0.18)' : '#eff6ff' }]}>
                      <Text style={[styles.autoBadgeText, { color: colors.primary }]}>ساخت خودکار</Text>
                    </View>
                  </View>

                  <Text style={[styles.fieldHint, { color: colors.textLight }]}>
                    برای این درس، به‌طور خودکار یک کلاس با همین نام در پنل شما ایجاد خواهد شد.
                  </Text>

                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="نام کلاس (مثال: کلاس ریاضی - پایه هفتم)"
                    placeholderTextColor={colors.textLight}
                    value={className}
                    onChangeText={setClassName}
                    textAlign="right"
                  />

                  {/* پیشنهادات سریع پسوند کلاس به صورت راست‌چین */}
                  <View style={styles.classSuffixRow}>
                    <Text style={[styles.suffixLabel, { color: colors.textLight }]}>پیشنهادات سریع:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suffixScrollRtl}>
                      {['پایه هفتم', 'پایه هشتم', 'پایه نهم', 'کلاس الف', 'کلاس ب', 'کلاس ۱۰۱'].map(suffix => (
                        <TouchableOpacity
                          key={suffix}
                          style={[styles.suffixChip, { backgroundColor: isDark ? '#334155' : '#f1f5f9', borderColor: colors.border }]}
                          onPress={() => {
                            const baseSub = (isCustomSubject ? customSubject : subject).trim() || 'کلاس';
                            setClassName(`${baseSub.startsWith('کلاس') ? baseSub : `کلاس ${baseSub}`} - ${suffix}`);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.suffixChipText, { color: colors.textLight }]}>+ {suffix}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {/* ۴. روزهای هفته و قابلیت تکرار جلسات در هفته */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderTitleGroup}>
                      <Calendar size={20} color={colors.primary} />
                      <Text style={[styles.cardTitle, { color: colors.text }]}>روزهای برگزاری در هفته</Text>
                    </View>
                    <View style={[styles.repeatBadge, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5' }]}>
                      <Repeat size={12} color={colors.success} style={{ marginLeft: 4 }} />
                      <Text style={[styles.repeatBadgeText, { color: colors.success }]}>
                        {selectedDays.length > 1 ? `${toPersianNumbers(selectedDays.length)} جلسه در هفته` : 'امکان تکرار'}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.fieldHint, { color: colors.textLight }]}>
                    اگر این درس بیش از یک جلسه در هفته تشکیل می‌شود، می‌توانید چندین روز را انتخاب کنید:
                  </Text>

                  {/* چیپ‌های روزهای هفته از راست به چپ: شنبه تا پنج‌شنبه */}
                  <View style={styles.weekdaysRowRtl}>
                    {ORDERED_WEEKDAYS.map(w => {
                      const isSelected = selectedDays.includes(w.id);
                      return (
                        <TouchableOpacity
                          key={w.id}
                          style={[
                            styles.weekdayChip,
                            {
                              backgroundColor: isSelected ? colors.primary : (isDark ? '#334155' : '#f1f5f9'),
                              borderColor: isSelected ? colors.primary : colors.border,
                            },
                          ]}
                          onPress={() => handleToggleDay(w.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.weekdayChipText, { color: isSelected ? '#ffffff' : colors.text }]}>
                            {w.label}
                          </Text>
                          {isSelected && <Check size={13} color="#ffffff" style={{ marginRight: 4 }} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  {/* ۵. انتخاب ۸ زنگ کلاسی (بدون ساعت) */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderTitleGroup}>
                      <Clock size={18} color={colors.primary} />
                      <Text style={[styles.subCardTitle, { color: colors.text }]}>انتخاب زنگ کلاسی (۸ زنگ)</Text>
                    </View>
                  </View>

                  {/* اگر چند روز انتخاب شده، انتخاب روز فعال برای زنگ */}
                  {selectedDays.length > 1 && (
                    <View style={styles.multiDayTabsRow}>
                      <Text style={[styles.multiDayTabsLabel, { color: colors.textLight }]}>تنظیم زنگ برای:</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.multiDayTabsScroll}>
                        {selectedDays.map(dId => {
                          const wLabel = ORDERED_WEEKDAYS.find(w => w.id === dId)?.label || '';
                          const isActive = activeDayForPeriod === dId;
                          const assignedPeriod = dayPeriods[dId] || 1;
                          return (
                            <TouchableOpacity
                              key={dId}
                              style={[
                                styles.dayTabChip,
                                {
                                  backgroundColor: isActive ? colors.primary : (isDark ? '#1e293b' : '#f8fafc'),
                                  borderColor: isActive ? colors.primary : colors.border,
                                },
                              ]}
                              onPress={() => setActiveDayForPeriod(dId)}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.dayTabChipText, { color: isActive ? '#ffffff' : colors.text }]}>
                                {wLabel} (زنگ {toPersianNumbers(assignedPeriod)})
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}

                  {/* گرید ۸ تایی زنگ‌ها - از راست به چپ: زنگ ۱ تا زنگ ۸ */}
                  <View style={styles.periodsGridRtl}>
                    {PERIOD_LIST.map(pNum => {
                      const isCurrentSelected = (dayPeriods[activeDayForPeriod] || 1) === pNum;
                      return (
                        <TouchableOpacity
                          key={pNum}
                          style={[
                            styles.periodButton,
                            {
                              backgroundColor: isCurrentSelected ? colors.primary : (isDark ? '#1e293b' : '#f8fafc'),
                              borderColor: isCurrentSelected ? colors.primary : colors.border,
                            },
                          ]}
                          onPress={() => handleSelectPeriod(pNum)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.periodButtonText,
                              { color: isCurrentSelected ? '#ffffff' : colors.text },
                            ]}
                          >
                            زنگ {toPersianNumbers(pNum)}
                          </Text>
                          {isCurrentSelected && <Check size={13} color="#ffffff" style={{ marginRight: 4 }} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* دکمه اعمال یکسان به همه روزها در صورت انتخاب چند روز */}
                  {selectedDays.length > 1 && (
                    <TouchableOpacity
                      style={styles.applyAllBtn}
                      onPress={() => handleApplyPeriodToAllDays(dayPeriods[activeDayForPeriod] || 1)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.applyAllBtnText, { color: colors.primary }]}>
                        اعمال زنگ {toPersianNumbers(dayPeriods[activeDayForPeriod] || 1)} برای تمام روزهای این درس
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* انتخاب رنگ کارت کلاس */}
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <Text style={[styles.subCardTitle, { color: colors.text, marginBottom: 10 }]}>رنگ نمایشی کارت درس</Text>
                  <View style={styles.colorsRowRtl}>
                    {PRESET_COLORS.map(c => {
                      const isSelected = color === c;
                      return (
                        <TouchableOpacity
                          key={c}
                          style={[
                            styles.colorCircle,
                            { backgroundColor: c },
                            isSelected && styles.colorCircleSelected,
                          ]}
                          onPress={() => setColor(c)}
                          activeOpacity={0.8}
                        >
                          {isSelected && <Check size={16} color="#ffffff" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {/* مرحله ۳: مرور نهایی و ثبت */}
            {currentStep === 3 && (
              <View>
                <View style={styles.summaryHeader}>
                  <CheckCircle2 size={44} color={colors.success} />
                  <Text style={[styles.summaryTitle, { color: colors.text }]}>برنامه هفتگی شما آماده ثبت است</Text>
                  <Text style={[styles.summarySubtitle, { color: colors.textLight }]}>
                    کلاس‌ها و جلسات هفتگی زیر در حساب شما ثبت خواهند شد:
                  </Text>
                </View>

                {createdLessons.map((l, index) => {
                  return (
                    <View
                      key={l.id}
                      style={[
                        styles.lessonSummaryCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          borderRightColor: l.color,
                        },
                      ]}
                    >
                      <View style={styles.lessonSummaryHeader}>
                        <View style={[styles.lessonBadge, { backgroundColor: l.color + '22' }]}>
                          <Text style={[styles.lessonBadgeText, { color: l.color }]}>
                            درس {toPersianNumbers(index + 1)}
                          </Text>
                        </View>
                        <Text style={[styles.lessonSummaryTitle, { color: colors.text }]}>{l.subject}</Text>
                      </View>

                      <View style={styles.lessonMetaRowRtl}>
                        <View style={styles.lessonMetaItem}>
                          <SchoolIcon size={14} color={colors.textLight} />
                          <Text style={[styles.lessonMetaText, { color: colors.textLight }]}>{l.schoolName}</Text>
                        </View>
                        <View style={styles.lessonMetaItem}>
                          <Layers size={14} color={colors.textLight} />
                          <Text style={[styles.lessonMetaText, { color: colors.textLight }]}>{l.className}</Text>
                        </View>
                      </View>

                      {/* نمایش جلسات در هفته */}
                      <View style={styles.sessionsBox}>
                        <Text style={[styles.sessionsBoxTitle, { color: colors.textLight }]}>جلسات هفتگی:</Text>
                        <View style={styles.sessionsChipsRow}>
                          {l.sessions.map((ses, sIdx) => {
                            const dName = ORDERED_WEEKDAYS.find(w => w.id === ses.dayOfWeek)?.label || '';
                            return (
                              <View key={sIdx} style={[styles.sessionBadge, { backgroundColor: isDark ? '#334155' : '#f1f5f9', borderColor: colors.border }]}>
                                <Text style={[styles.sessionBadgeText, { color: colors.text }]}>
                                  {dName} (زنگ {toPersianNumbers(ses.period)})
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  );
                })}

                <View style={[styles.featuresNote, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                  <Text style={[styles.featuresNoteTitle, { color: colors.text }]}>دستاوردهای این مرحله:</Text>
                  <Text style={[styles.featuresNoteText, { color: colors.textLight }]}>
                    • کلاس‌های شما در بخش مدیریت کلاس ایجاد می‌شوند.{'\n'}
                    • برنامه هفتگی جلسات در تقویم و صفحه اصلی فعال می‌گردد.{'\n'}
                    • امکان ثبت نمرات و حضور و غیاب برای هر درس فعال خواهد شد.
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* نوار دکمه‌های پایین صفحه (دقیقاً بالای کیبورد) */}
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          {currentStep === 1 && (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={handleNextFromStep1}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>تایید و رفتن به درس دوم</Text>
              <ChevronLeft size={20} color="#ffffff" />
            </TouchableOpacity>
          )}

          {currentStep === 2 && (
            <View style={styles.bottomBtnGroupRtl}>
              <TouchableOpacity
                style={[styles.primaryBtnFlex, { backgroundColor: colors.primary }]}
                onPress={handleNextFromStep2}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>تایید و مرور نهایی (۲ درس)</Text>
                <ChevronLeft size={20} color="#ffffff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
                onPress={() => goToStep(1)}
                activeOpacity={0.7}
              >
                <ChevronRight size={18} color={colors.text} />
                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>ویرایش درس ۱</Text>
              </TouchableOpacity>
            </View>
          )}

          {currentStep === 3 && (
            <View style={styles.bottomBtnGroupRtl}>
              <TouchableOpacity
                style={[styles.primaryBtnFlex, { backgroundColor: colors.success }]}
                onPress={handleFinalSubmit}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Sparkles size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                    <Text style={styles.primaryBtnText}>ثبت نهایی و ورود به کیتایار</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
                onPress={() => goToStep(2)}
                activeOpacity={0.7}
                disabled={isSubmitting}
              >
                <ChevronRight size={18} color={colors.text} />
                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>بازگشت</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
    alignSelf: 'flex-end',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  infoBanner: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  infoBannerText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.medium,
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderTitleGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subCardTitle: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  autoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  autoBadgeText: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.medium,
  },
  repeatBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  repeatBadgeText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bold,
  },
  fieldHint: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.regular,
    marginBottom: 10,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 18,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 13,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  dynamicSchoolBanner: {
    borderWidth: 1.2,
    borderRadius: 12,
    padding: 12,
  },
  dynamicSchoolContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dynamicSchoolTextGroup: {
    flex: 1,
    marginLeft: 8,
  },
  dynamicSchoolLabel: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    marginBottom: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  dynamicSchoolName: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  changeSchoolBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#ffffff',
  },
  changeSchoolBtnText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.medium,
  },
  chipsWrapRtl: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.medium,
    textAlign: 'right',
  },
  switchModeBtn: {
    paddingVertical: 2,
  },
  switchModeText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.medium,
  },
  customSubjectToggle: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  customSubjectToggleText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.medium,
    textAlign: 'right',
  },
  classSuffixRow: {
    marginTop: 10,
  },
  suffixLabel: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    marginBottom: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  suffixScrollRtl: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  suffixChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  suffixChipText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
  },
  weekdaysRowRtl: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  weekdayChip: {
    width: '31%',
    flexDirection: 'row-reverse',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  weekdayChipText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  multiDayTabsRow: {
    marginBottom: 12,
  },
  multiDayTabsLabel: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.medium,
    marginBottom: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  multiDayTabsScroll: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  dayTabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  dayTabChipText: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.medium,
  },
  periodsGridRtl: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  periodButton: {
    width: '23%',
    flexDirection: 'row-reverse',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },
  applyAllBtn: {
    marginTop: 10,
    paddingVertical: 6,
    alignItems: 'flex-end',
  },
  applyAllBtnText: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.medium,
    textAlign: 'right',
  },
  colorsRowRtl: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#ffffff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  summaryHeader: {
    alignItems: 'center',
    marginVertical: 14,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.bold,
    marginTop: 10,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  summarySubtitle: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 4,
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 18,
  },
  lessonSummaryCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderRightWidth: 5,
    marginBottom: 12,
  },
  lessonSummaryHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
  },
  lessonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  lessonBadgeText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bold,
  },
  lessonSummaryTitle: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  lessonMetaRowRtl: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 16,
    marginTop: 6,
  },
  lessonMetaItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  lessonMetaText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sessionsBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f033',
  },
  sessionsBoxTitle: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.medium,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  sessionsChipsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  sessionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  sessionBadgeText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
  },
  featuresNote: {
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  featuresNoteTitle: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
    marginBottom: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  featuresNoteText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  primaryBtn: {
    height: 50,
    borderRadius: 14,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnFlex: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'center',
  },
  bottomBtnGroupRtl: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  secondaryBtn: {
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 14,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.medium,
    textAlign: 'center',
  },
});

export default MandatoryScheduleWizardScreen;
