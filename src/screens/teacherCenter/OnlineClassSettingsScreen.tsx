import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/axiosConfig';
import { showSuccess, showError, showWarning } from '../../components/feedback';
import { FONT_FAMILY } from '../../theme/typography';
import {
  ChevronRight,
  ChevronLeft,
  Clock,
  Calendar,
  BookOpen,
  GraduationCap,
  CheckCircle,
  Plus,
  X,
  Search,
  Save,
  Sparkles,
  ShieldCheck,
  Percent,
} from 'lucide-react-native';
import { DEFAULT_TEACHING_SUBJECTS } from '../profile/ProfileScreen';

const DURATION_RATIOS: { minutes: number; ratio: number; label: string }[] = [
  { minutes: 90, ratio: 1.0, label: '۹۰ دقیقه (جلسه کامل)' },
  { minutes: 75, ratio: 0.84, label: '۷۵ دقیقه' },
  { minutes: 60, ratio: 0.7, label: '۶۰ دقیقه (۱ ساعت)' },
  { minutes: 45, ratio: 0.56, label: '۴۵ دقیقه' },
  { minutes: 30, ratio: 0.4, label: '۳۰ دقیقه (نیم ساعت)' },
  { minutes: 15, ratio: 0.2, label: '۱۵ دقیقه (رفع اشکال کوتاه)' },
];

const PRESETS = [300000, 400000, 500000, 700000, 1000000];

export const OnlineClassSettingsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Teaching Grade Level & Subjects
  const [educationLevel, setEducationLevel] = useState<'elementary' | 'secondary' | 'both'>('elementary');
  const [teachingSubjects, setTeachingSubjects] = useState<string[]>(['ریاضی']);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [customSubjectInput, setCustomSubjectInput] = useState('');

  // Weekly Schedule Status
  const [scheduleDaysCount, setScheduleDaysCount] = useState<number>(0);

  // Online Class Pricing & Durations
  const [basePrice90Min, setBasePrice90Min] = useState<number>(500000);
  const [inputBasePrice, setInputBasePrice] = useState<string>('500000');
  const [durationToggles, setDurationToggles] = useState<Record<string, boolean>>({
    '90': true,
    '75': true,
    '60': true,
    '45': true,
    '30': true,
    '15': true,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classRes, profRes, schedRes] = await Promise.allSettled([
        api.get('/teacher/center/online-class-settings'),
        api.get('/teacher/profile'),
        api.get('/teacher/schedule'),
      ]);

      // Online Class Settings
      if (classRes.status === 'fulfilled' && classRes.value.data?.success && classRes.value.data.data) {
        const { basePrice90Min: fetchedPrice, durations } = classRes.value.data.data;
        const validPrice = fetchedPrice || 500000;
        setBasePrice90Min(validPrice);
        setInputBasePrice(validPrice.toString());

        if (durations && Array.isArray(durations)) {
          const toggles: Record<string, boolean> = {};
          durations.forEach((d: any) => {
            toggles[d.minutes.toString()] = d.isEnabled !== false;
          });
          setDurationToggles((prev) => ({ ...prev, ...toggles }));
        }
      }

      // Profile settings (educationLevel & teachingSubjects)
      if (profRes.status === 'fulfilled' && profRes.value.data?.success && profRes.value.data.data) {
        const pd = profRes.value.data.data;
        if (pd.educationLevel) {
          setEducationLevel(pd.educationLevel);
        }
        if (Array.isArray(pd.teachingSubjects) && pd.teachingSubjects.length > 0) {
          setTeachingSubjects(pd.teachingSubjects);
        }
      }

      // Schedule status
      if (schedRes.status === 'fulfilled' && schedRes.value.data?.success && Array.isArray(schedRes.value.data.data)) {
        setScheduleDaysCount(schedRes.value.data.data.length);
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Refresh schedule status when returning from schedule screen
      api.get('/teacher/schedule').then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setScheduleDaysCount(res.data.data.length);
        }
      }).catch(() => {});
    }, [])
  );

  const handlePriceChange = (val: string) => {
    const cleanNum = val.replace(/[^0-9]/g, '');
    setInputBasePrice(cleanNum);
    const num = Number(cleanNum);
    if (!isNaN(num) && num > 0) {
      setBasePrice90Min(num);
    }
  };

  const handleSelectPreset = (amount: number) => {
    setBasePrice90Min(amount);
    setInputBasePrice(amount.toString());
  };

  const handleToggleDuration = (minutes: number) => {
    const key = minutes.toString();
    setDurationToggles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const calculateDurationPrice = (ratio: number) => {
    return Math.round((basePrice90Min * ratio) / 1000) * 1000;
  };

  // Subjects handling
  const handleToggleSubject = (sub: string) => {
    if (teachingSubjects.includes(sub)) {
      if (teachingSubjects.length === 1) {
        showWarning('حداقل باید یک درس را برای تدریس انتخاب کنید.');
        return;
      }
      setTeachingSubjects(teachingSubjects.filter((s) => s !== sub));
    } else {
      setTeachingSubjects([...teachingSubjects, sub]);
    }
  };

  const handleAddCustomSubject = () => {
    const trimmed = customSubjectInput.trim();
    if (!trimmed) return;
    if (teachingSubjects.includes(trimmed)) {
      showWarning('این درس قبلاً اضافه شده است.');
      return;
    }
    setTeachingSubjects([...teachingSubjects, trimmed]);
    setCustomSubjectInput('');
  };

  const handleSave = async () => {
    const numPrice = Number(inputBasePrice);
    if (isNaN(numPrice) || numPrice < 10000) {
      showWarning('قیمت پایه ۹۰ دقیقه باید حداقل ۱۰,۰۰۰ تومان باشد.');
      return;
    }

    const anyEnabled = Object.values(durationToggles).some((v) => v);
    if (!anyEnabled) {
      showWarning('لطفاً حداقل یک مدت زمان را برای برگزاری کلاس فعال بگذارید.');
      return;
    }

    if (teachingSubjects.length === 0) {
      showWarning('لطفاً حداقل یک درس تخصصی را برای تدریس انتخاب کنید.');
      return;
    }

    try {
      setSaving(true);
      await Promise.all([
        // 1. Save pricing & durations
        api.post('/teacher/center/online-class-settings', {
          basePrice90Min: numPrice,
          durations: durationToggles,
        }),
        // 2. Save education level & subjects to profile
        api.put('/teacher/profile', {
          educationLevel,
          teachingSubjects,
        }),
        // 3. Sync to workdesk settings
        api.put('/teacher/center/workdesk-settings', {
          educationLevel,
          teachingSubjects,
          onlineClassBasePrice: numPrice,
        }),
      ]);

      showSuccess('تمامی تنظیمات تدریس و کلاس آنلاین با موفقیت ذخیره شد.');
      navigation.goBack();
    } catch (err: any) {
      showError(err.response?.data?.message || 'خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  const filteredSubjects = DEFAULT_TEACHING_SUBJECTS.concat(
    teachingSubjects.filter((s) => !DEFAULT_TEACHING_SUBJECTS.includes(s))
  ).filter((s) => !subjectSearch.trim() || s.includes(subjectSearch.trim()));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronRight size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>تنظیمات تدریس و کلاس آنلاین</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textLight }]}>در حال بارگذاری تنظیمات تدریس...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Banner */}
          <View style={[styles.heroCard, { backgroundColor: isDark ? '#1e293b' : '#eff6ff', borderColor: isDark ? '#334155' : '#bfdbfe' }]}>
            <View style={styles.heroIconCircle}>
              <Sparkles size={24} color="#2563eb" />
            </View>
            <View style={styles.heroTextCol}>
              <Text style={[styles.heroTitle, { color: isDark ? '#93c5fd' : '#1e3a8a' }]}>
                تنظیمات هوشمند تدریس و مقاطع تحصیلی
              </Text>
              <Text style={[styles.heroDesc, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                مقطع و دروس تدریس خود را مشخص نمایید، برنامه زمانی هفتگی‌تان را تعیین کنید و نرخ کلاس‌های آنلاین را با فرمول خودکار هوشمند مدیریت نمایید.
              </Text>
            </View>
          </View>

          {/* Section 1: Weekly Schedule Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>برنامه زمانی و ساعات تدریس</Text>
              <Calendar size={18} color={colors.primary} />
            </View>
            <Text style={[styles.cardSub, { color: colors.textLight }]}>
              روزهای هفته و ساعاتی که دانش‌آموزان می‌توانند برای کلاس آنلاین رزرو ثبت کنند.
            </Text>

            <View style={[styles.scheduleStatusBox, { backgroundColor: scheduleDaysCount > 0 ? (isDark ? '#064e3b20' : '#f0fdf4') : (isDark ? '#451a0320' : '#fffbeb'), borderColor: scheduleDaysCount > 0 ? '#bbf7d0' : '#fde68a' }]}>
              <View style={styles.scheduleStatusRight}>
                <View style={[styles.statusDot, { backgroundColor: scheduleDaysCount > 0 ? '#16a34a' : '#f59e0b' }]} />
                <Text style={[styles.scheduleStatusText, { color: scheduleDaysCount > 0 ? '#15803d' : '#b45309' }]}>
                  {scheduleDaysCount > 0
                    ? `برنامه هفتگی شما در ${scheduleDaysCount.toLocaleString('fa-IR')} روز هفته فعال است.`
                    : 'هنوز روز و ساعتی برای تدریس تنظیم نکرده‌اید.'}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.manageScheduleBtn, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('TeacherScheduleScreen')}
                activeOpacity={0.85}
              >
                <ChevronLeft size={16} color="#ffffff" />
                <Text style={styles.manageScheduleBtnText}>تنظیم ساعت و روزهای هفته</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section 2: Education Level Selection */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>مقطع تحصیلی تدریس</Text>
              <GraduationCap size={18} color={colors.primary} />
            </View>
            <Text style={[styles.cardSub, { color: colors.textLight }]}>
              دانش‌آموزان کدام مقاطع می‌توانند از شما سوال بپرسند یا کلاس رزرو کنند؟
            </Text>

            <View style={styles.levelRow}>
              {[
                { key: 'elementary', label: 'ابتدایی (دبستان)' },
                { key: 'secondary', label: 'متوسطه (دبیرستان)' },
                { key: 'both', label: 'هر دو مقطع' },
              ].map((lvl) => {
                const isSelected = educationLevel === lvl.key;
                return (
                  <TouchableOpacity
                    key={lvl.key}
                    style={[
                      styles.levelChip,
                      {
                        backgroundColor: isSelected ? (isDark ? '#1e3a8a30' : '#eff6ff') : (isDark ? '#1e293b' : '#f8fafc'),
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setEducationLevel(lvl.key as any)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.radioOuter, { borderColor: isSelected ? colors.primary : colors.border }]}>
                      {isSelected && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                    </View>
                    <Text
                      style={[
                        styles.levelChipText,
                        {
                          color: isSelected ? colors.primary : colors.text,
                          fontFamily: isSelected ? FONT_FAMILY.bold : FONT_FAMILY.medium,
                        },
                      ]}
                    >
                      {lvl.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section 3: Specialized Subjects */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>دروس تخصصی تدریس و حل مسئله</Text>
              <BookOpen size={18} color={colors.primary} />
            </View>
            <Text style={[styles.cardSub, { color: colors.textLight }]}>
              دروسی که تسلط کامل بر تدریس و پاسخ‌دهی به سوالات آن‌ها را دارید انتخاب کنید (چند انتخابی).
            </Text>

            {/* Selected Subjects Tag Cloud */}
            <View style={styles.selectedSubjectsWrap}>
              {teachingSubjects.map((sub, idx) => (
                <View key={idx} style={[styles.selectedSubjectTag, { backgroundColor: isDark ? '#1e3a8a30' : '#eff6ff', borderColor: colors.primary }]}>
                  <TouchableOpacity onPress={() => handleToggleSubject(sub)} hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
                    <X size={14} color="#2563eb" style={{ marginRight: 4 }} />
                  </TouchableOpacity>
                  <Text style={styles.selectedSubjectTagText}>{sub}</Text>
                </View>
              ))}
            </View>

            {/* Search Input */}
            <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
              <Search size={16} color={colors.textLight} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                value={subjectSearch}
                onChangeText={setSubjectSearch}
                placeholder="جستجوی درس..."
                placeholderTextColor={colors.textLight}
              />
            </View>

            {/* Add Custom Subject */}
            <View style={styles.addCustomRow}>
              <TextInput
                style={[styles.customSubjectInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                value={customSubjectInput}
                onChangeText={setCustomSubjectInput}
                placeholder="افزودن نام درس دیگر..."
                placeholderTextColor={colors.textLight}
                onSubmitEditing={handleAddCustomSubject}
              />
              <TouchableOpacity
                style={[styles.addCustomBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddCustomSubject}
                activeOpacity={0.8}
              >
                <Plus size={16} color="#ffffff" style={{ marginLeft: 4 }} />
                <Text style={styles.addCustomBtnText}>افزودن</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Suggestions Chips */}
            <Text style={[styles.suggestionsLabel, { color: colors.textLight }]}>لیست دروس پیشنهادی:</Text>
            <View style={styles.subjectsGrid}>
              {filteredSubjects.map((sub, idx) => {
                const isSelected = teachingSubjects.includes(sub);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.subjectChip,
                      {
                        backgroundColor: isSelected ? '#16a34a' : isDark ? '#1e293b' : '#f8fafc',
                        borderColor: isSelected ? '#16a34a' : colors.border,
                      },
                    ]}
                    onPress={() => handleToggleSubject(sub)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.subjectChipText, { color: isSelected ? '#ffffff' : colors.text }]}>
                      {isSelected ? '✓ ' : '+ '} {sub}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section 4: Base Price Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>نرخ پایه کلاس ۹۰ دقیقه‌ای</Text>
              <Clock size={18} color={colors.primary} />
            </View>
            <Text style={[styles.cardSub, { color: colors.textLight }]}>
              مبنای محاسبه نرخ تمام جلسات بر اساس قیمت ۹۰ دقیقه است.
            </Text>

            <View style={[styles.inputRow, { borderColor: colors.primary, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
              <Text style={[styles.inputUnit, { color: colors.textLight }]}>تومان</Text>
              <TextInput
                style={[styles.priceInput, { color: colors.text }]}
                keyboardType="numeric"
                value={Number(inputBasePrice || 0).toLocaleString('fa-IR')}
                onChangeText={handlePriceChange}
                placeholder="۵۰۰,۰۰۰"
                placeholderTextColor={colors.textLight}
              />
            </View>

            {/* Quick Presets */}
            <Text style={[styles.presetsLabel, { color: colors.textLight }]}>انتخاب سریع مبالغ پیشنهادی:</Text>
            <View style={styles.presetsRow}>
              {PRESETS.map((amt) => {
                const isSelected = basePrice90Min === amt;
                return (
                  <TouchableOpacity
                    key={amt}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isSelected ? colors.primary : isDark ? '#1e293b' : '#f1f5f9',
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleSelectPreset(amt)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        { color: isSelected ? '#ffffff' : colors.text },
                      ]}
                    >
                      {(amt / 1000).toLocaleString('fa-IR')} هزار
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section 5: Duration Prices Table */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>جدول نرخ و فعال‌سازی مدت جلسات</Text>
              <Percent size={18} color={colors.primary} />
            </View>
            <Text style={[styles.cardSub, { color: colors.textLight }]}>
              هر مدتی را که غیرفعال کنید، دانش‌آموزان امکان انتخاب آن را در درخواست رزرو نخواهند داشت.
            </Text>

            <View style={styles.table}>
              {DURATION_RATIOS.map((item) => {
                const isEnabled = durationToggles[item.minutes.toString()] !== false;
                const calculated = calculateDurationPrice(item.ratio);
                const percentStr = `(${Math.round(item.ratio * 100).toLocaleString('fa-IR')}٪)`;

                return (
                  <View
                    key={item.minutes}
                    style={[
                      styles.tableRow,
                      {
                        borderBottomColor: colors.border,
                        opacity: isEnabled ? 1 : 0.45,
                        backgroundColor: isEnabled ? 'transparent' : isDark ? '#1e293b40' : '#f8fafc',
                      },
                    ]}
                  >
                    <Switch
                      value={isEnabled}
                      onValueChange={() => handleToggleDuration(item.minutes)}
                      trackColor={{ false: '#cbd5e1', true: colors.primary }}
                      thumbColor="#ffffff"
                    />

                    <View style={styles.tablePriceCol}>
                      <Text style={[styles.tablePriceText, { color: isEnabled ? colors.primary : colors.textLight }]}>
                        {calculated.toLocaleString('fa-IR')} <Text style={styles.tablePriceUnit}>تومان</Text>
                      </Text>
                      <Text style={[styles.tablePercentText, { color: colors.textLight }]}>
                        {percentStr}
                      </Text>
                    </View>

                    <View style={styles.tableDurationCol}>
                      <Text style={[styles.tableDurationTitle, { color: colors.text }]}>
                        {item.label}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Section 6: Revenue & Settlement Info Card */}
          <View style={[styles.infoCard, { backgroundColor: isDark ? '#064e3b18' : '#f0fdf4', borderColor: isDark ? '#047857' : '#bbf7d0' }]}>
            <View style={styles.infoCardHeader}>
              <ShieldCheck size={20} color="#16a34a" />
              <Text style={[styles.infoCardTitle, { color: isDark ? '#86efac' : '#15803d' }]}>
                قوانین تسویه حساب و کارمزد
              </Text>
            </View>
            <View style={styles.infoItemRow}>
              <CheckCircle size={14} color="#16a34a" style={{ marginLeft: 6, marginTop: 2 }} />
              <Text style={[styles.infoItemText, { color: isDark ? '#a7f3d0' : '#166534' }]}>
                سهم معلم از شهریه پایه کلاس ۹۰٪ و کارمزد پلتفرم ۱۰٪ است.
              </Text>
            </View>
            <View style={styles.infoItemRow}>
              <CheckCircle size={14} color="#16a34a" style={{ marginLeft: 6, marginTop: 2 }} />
              <Text style={[styles.infoItemText, { color: isDark ? '#a7f3d0' : '#166534' }]}>
                در کلاس‌های گروهی، به ازای هر دانش‌آموز اضافه مبلغ ۵۰,۰۰۰ تومان به مبلغ کل افزوده می‌شود که ۸۰٪ آن مستقیماً متعلق به دبیر محترم است.
              </Text>
            </View>
            <View style={styles.infoItemRow}>
              <CheckCircle size={14} color="#16a34a" style={{ marginLeft: 6, marginTop: 2 }} />
              <Text style={[styles.infoItemText, { color: isDark ? '#a7f3d0' : '#166534' }]}>
                تسویه حساب بلافاصله پس از اعلام اتمام کلاس توسط شما به کیف پول واریز می‌گردد.
              </Text>
            </View>
          </View>

          {/* Section 7: Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Save size={18} color="#ffffff" style={{ marginLeft: 8 }} />
                <Text style={styles.saveBtnText}>ذخیره تغییرات تنظیمات تدریس</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
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
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.bold,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: FONT_FAMILY.regular,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  heroCard: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  heroIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTextCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  heroTitle: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
    marginBottom: 4,
    textAlign: 'right',
  },
  heroDesc: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    lineHeight: 18,
    textAlign: 'right',
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
  },
  cardSub: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'right',
    marginBottom: 14,
  },

  // Weekly Schedule Box
  scheduleStatusBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    flexWrap: 'wrap',
  },
  scheduleStatusRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scheduleStatusText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.medium,
    flex: 1,
    textAlign: 'right',
  },
  manageScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  manageScheduleBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.bold,
  },

  // Education Level Row
  levelRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  levelChip: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  levelChipText: {
    fontSize: 11,
  },

  // Teaching Subjects
  selectedSubjectsWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  selectedSubjectTag: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  selectedSubjectTagText: {
    color: '#2563eb',
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },
  searchBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'right',
    padding: 0,
  },
  addCustomRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 14,
  },
  customSubjectInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12.5,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'right',
  },
  addCustomBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  addCustomBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },
  suggestionsLabel: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.medium,
    textAlign: 'right',
    marginBottom: 8,
  },
  subjectsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  subjectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  subjectChipText: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.medium,
  },

  // Price Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 14,
  },
  priceInput: {
    flex: 1,
    fontSize: 20,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
    padding: 0,
  },
  inputUnit: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.medium,
    marginLeft: 8,
  },
  presetsLabel: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'right',
    marginBottom: 8,
  },
  presetsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.medium,
  },
  table: {
    marginTop: 4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderRadius: 10,
  },
  tableDurationCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  tableDurationTitle: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
  },
  tablePriceCol: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  tablePriceText: {
    fontSize: 13.5,
    fontFamily: FONT_FAMILY.bold,
  },
  tablePriceUnit: {
    fontSize: 10.5,
    fontFamily: FONT_FAMILY.regular,
  },
  tablePercentText: {
    fontSize: 10.5,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 2,
  },
  infoCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  infoCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  infoCardTitle: {
    fontSize: 13.5,
    fontFamily: FONT_FAMILY.bold,
  },
  infoItemRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
  },
  infoItemText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.regular,
    lineHeight: 18,
    textAlign: 'right',
  },
  saveBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
  },
});

export default OnlineClassSettingsScreen;

