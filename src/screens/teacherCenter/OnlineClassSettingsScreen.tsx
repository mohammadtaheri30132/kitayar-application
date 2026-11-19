import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/axiosConfig';
import { showSuccess, showError, showWarning } from '../../components/feedback';
import { FONT_FAMILY } from '../../theme/typography';
import { radius, spacing } from '../../theme/tokens';
import {
  ChevronRight,
  Clock,
  Calendar,
  BookOpen,
  GraduationCap,
  CheckCircle,
  Plus,
  X,
  Search,
  Save,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react-native';
import { DEFAULT_TEACHING_SUBJECTS } from '../profile/ProfileScreen';
import {
  WeeklyScheduleManager,
  WeeklyScheduleMap,
  WEEKDAYS_META,
  createEmptyWeeklySchedule,
  toEnglishDigits,
} from '../../components/WeeklyScheduleManager';

const PRESETS = [200000, 300000, 400000, 500000, 700000, 1000000];

// Mirrors OnlineClassService.DURATION_RATIOS: shorter classes have higher per-minute cost
const DURATION_OPTIONS = [
  { minutes: 90, ratio: 1.0, badge: 'به‌صرفه‌ترین (نرخ پایه)' },
  { minutes: 75, ratio: 0.88, badge: '+۶٪ گران‌تر در دقیقه' },
  { minutes: 60, ratio: 0.74, badge: '+۱۱٪ گران‌تر در دقیقه' },
  { minutes: 45, ratio: 0.58, badge: '+۱۶٪ گران‌تر در دقیقه' },
  { minutes: 30, ratio: 0.42, badge: '+۲۶٪ گران‌تر در دقیقه' },
  { minutes: 15, ratio: 0.24, badge: '+۴۴٪ گران‌تر در دقیقه' },
];

type SettingsTabKey = 'schedule' | 'subjects' | 'pricing';

function normSubjectKey(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u200c\s]+/g, ' ')
    .trim();
}

interface AdminBookSubjectGroup {
  levelId: string;
  levelName: string;
  subjects: string[];
}

export const OnlineClassSettingsScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

  const [activeTab, setActiveTab] = useState<SettingsTabKey>('schedule');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Tab 1: Weekly Schedule
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleMap>(createEmptyWeeklySchedule);

  // Tab 2: Level & Specialized Subjects (Synced with Admin Educational Content Management)
  const [educationLevel, setEducationLevel] = useState<'elementary' | 'secondary' | 'both'>('both');
  const [teachingSubjects, setTeachingSubjects] = useState<string[]>(['ریاضی']);
  const [subjectGroups, setSubjectGroups] = useState<AdminBookSubjectGroup[]>([]);
  const [selectedSubjectLevelTab, setSelectedSubjectLevelTab] = useState<string>('all');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [customSubjectInput, setCustomSubjectInput] = useState('');

  // Tab 3: Base 90-min Price & Enabled Durations
  const [sessionPrice, setSessionPrice] = useState<number>(500000);
  const [inputSessionPrice, setInputSessionPrice] = useState<string>('500000');
  const [enabledDurations, setEnabledDurations] = useState<Record<string, boolean>>({
    '15': true,
    '30': true,
    '45': true,
    '60': true,
    '75': true,
    '90': true,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [classRes, profRes, eduLevelsRes, eduBooksRes] = await Promise.allSettled([
        api.get('/teacher/center/online-class-settings'),
        api.get('/teacher/profile'),
        api.get('/public/edu-content/levels'),
        api.get('/public/edu-content/books'),
      ]);

      if (classRes.status === 'fulfilled' && classRes.value.data?.success && classRes.value.data.data) {
        const {
          basePrice90Min,
          onlineClassBasePrice,
          weeklySchedule: serverWeekly,
          durations,
        } = classRes.value.data.data;
        const validPrice = basePrice90Min || onlineClassBasePrice || 500000;
        setSessionPrice(validPrice);
        setInputSessionPrice(validPrice.toString());
        if (serverWeekly && typeof serverWeekly === 'object') {
          setWeeklySchedule({ ...createEmptyWeeklySchedule(), ...serverWeekly });
        }
        if (Array.isArray(durations)) {
          const map: Record<string, boolean> = {};
          for (const d of durations) {
            if (d?.minutes) map[String(d.minutes)] = d.enabled !== false;
          }
          if (Object.keys(map).length > 0) {
            setEnabledDurations((prev) => ({ ...prev, ...map }));
          }
        }
      }

      if (profRes.status === 'fulfilled' && profRes.value.data?.success && profRes.value.data.data) {
        const pd = profRes.value.data.data;
        if (pd.educationLevel) setEducationLevel(pd.educationLevel);
        if (Array.isArray(pd.teachingSubjects) && pd.teachingSubjects.length > 0) {
          setTeachingSubjects(pd.teachingSubjects);
        }
        if (pd.onlineClassBasePrice) {
          setSessionPrice(pd.onlineClassBasePrice);
          setInputSessionPrice(pd.onlineClassBasePrice.toString());
        }
        if (pd.weeklySchedule && typeof pd.weeklySchedule === 'object') {
          setWeeklySchedule((prev) => ({ ...createEmptyWeeklySchedule(), ...prev, ...pd.weeklySchedule }));
        }
      }

      // Build dynamic categorized subject catalog from Admin Panel's Educational Content Management
      const levelsRaw =
        eduLevelsRes.status === 'fulfilled' && eduLevelsRes.value.data?.success
          ? eduLevelsRes.value.data.data || []
          : [];
      const booksRaw =
        eduBooksRes.status === 'fulfilled' && eduBooksRes.value.data?.success
          ? eduBooksRes.value.data.data || []
          : [];

      if (booksRaw.length > 0) {
        const byLevel = new Map<string, { levelName: string; set: Set<string> }>();
        for (const lvl of levelsRaw) {
          byLevel.set(String(lvl._id), { levelName: lvl.name, set: new Set<string>() });
        }
        for (const b of booksRaw) {
          const lvlObj = b.levelId && typeof b.levelId === 'object' ? b.levelId : null;
          const lid = lvlObj ? String(lvlObj._id) : String(b.levelId || 'other');
          const lname = lvlObj?.name || 'سایر دروس';
          if (!byLevel.has(lid)) {
            byLevel.set(lid, { levelName: lname, set: new Set<string>() });
          }
          const cleanTitle = String(b.title || '').trim();
          if (cleanTitle) byLevel.get(lid)!.set.add(cleanTitle);
        }
        const built: AdminBookSubjectGroup[] = [];
        for (const [levelId, entry] of byLevel.entries()) {
          if (entry.set.size > 0) {
            built.push({
              levelId,
              levelName: entry.levelName,
              subjects: Array.from(entry.set),
            });
          }
        }
        setSubjectGroups(built);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const enabledDaysCount = useMemo(
    () => WEEKDAYS_META.filter((d) => (weeklySchedule[d.key] || []).length > 0).length,
    [weeklySchedule]
  );
  const totalSlotsCount = useMemo(
    () => WEEKDAYS_META.reduce((acc, d) => acc + (weeklySchedule[d.key] || []).length, 0),
    [weeklySchedule]
  );

  // Merge Admin EduContent subjects with fallback defaults + custom teacher entries (deduplicated)
  const displayedSubjects = useMemo(() => {
    const query = normSubjectKey(subjectSearch);
    const byKey = new Map<string, string>();
    const addClean = (raw: string) => {
      const display = String(raw || '').replace(/ي/g, 'ی').replace(/ك/g, 'ک').trim();
      const key = normSubjectKey(display);
      if (key && !byKey.has(key)) byKey.set(key, display);
    };

    if (subjectGroups.length > 0) {
      for (const grp of subjectGroups) {
        if (selectedSubjectLevelTab === 'all' || selectedSubjectLevelTab === grp.levelId) {
          for (const s of grp.subjects) addClean(s);
        }
      }
    }

    if (selectedSubjectLevelTab === 'all') {
      for (const s of DEFAULT_TEACHING_SUBJECTS) addClean(s);
      for (const s of teachingSubjects) addClean(s);
    }

    return Array.from(byKey.values()).filter((s) => !query || normSubjectKey(s).includes(query));
  }, [subjectGroups, selectedSubjectLevelTab, subjectSearch, teachingSubjects]);

  // Live Duration Price Breakdown computed from 90-minute base price
  const durationBreakdown = useMemo(() => {
    const validBase = Math.max(10000, sessionPrice || 500000);
    return DURATION_OPTIONS.map((opt) => {
      const price = Math.round((validBase * opt.ratio) / 1000) * 1000;
      const perMinute = Math.round(price / opt.minutes);
      return {
        ...opt,
        price,
        perMinute,
        enabled: enabledDurations[String(opt.minutes)] !== false,
      };
    });
  }, [sessionPrice, enabledDurations]);

  const handlePriceChange = (val: string) => {
    const normalized = toEnglishDigits(val);
    const cleanNum = normalized.replace(/[^0-9]/g, '');
    setInputSessionPrice(cleanNum);
    const num = Number(cleanNum);
    if (!isNaN(num) && num > 0) {
      setSessionPrice(num);
    }
  };

  const handleSelectPreset = (amount: number) => {
    setSessionPrice(amount);
    setInputSessionPrice(amount.toString());
  };

  const handleToggleDuration = (minutes: number) => {
    const key = String(minutes);
    const currentlyEnabled = enabledDurations[key] !== false;
    const enabledCount = DURATION_OPTIONS.filter((o) => enabledDurations[String(o.minutes)] !== false).length;
    if (currentlyEnabled && enabledCount <= 1) {
      showWarning('حداقل یک تایم برگزاری کلاس باید فعال باقی بماند.');
      return;
    }
    setEnabledDurations((prev) => ({ ...prev, [key]: !currentlyEnabled }));
  };

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
    const numPrice = Number(inputSessionPrice);
    if (isNaN(numPrice) || numPrice < 10000) {
      showWarning('نرخ پایه ۹۰ دقیقه باید حداقل ۱۰,۰۰۰ تومان باشد.');
      setActiveTab('pricing');
      return;
    }

    if (teachingSubjects.length === 0) {
      showWarning('لطفاً حداقل یک درس تخصصی را برای تدریس انتخاب کنید.');
      setActiveTab('subjects');
      return;
    }

    try {
      setSaving(true);
      console.log('[KitayarSettings] saving online class settings:', {
        basePrice90Min: numPrice,
        educationLevel,
        teachingSubjects,
        enabledDurations,
        enabledDaysCount,
      });
      await Promise.all([
        api.post('/teacher/center/online-class-settings', {
          basePrice90Min: numPrice,
          onlineClassBasePrice: numPrice,
          durations: enabledDurations,
          weeklySchedule,
        }),
        api.put('/teacher/profile', {
          educationLevel,
          teachingSubjects,
          onlineClassBasePrice: numPrice,
        }),
        api.put('/teacher/center/workdesk-settings', {
          educationLevel,
          teachingSubjects,
          onlineClassBasePrice: numPrice,
          weeklySchedule,
        }),
      ]);

      showSuccess('تنظیمات تدریس، برنامه هفتگی و تعرفه با موفقیت ذخیره شد.');
      navigation.goBack();
    } catch (err: any) {
      showError(err.response?.data?.message || 'خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronRight size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>تنظیمات تدریس و کلاس آنلاین</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Clean 3-Section Top Tab Switcher */}
      <View style={[styles.tabBarWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {[
          { key: 'schedule' as SettingsTabKey, label: 'برنامه هفتگی', Icon: Calendar },
          { key: 'subjects' as SettingsTabKey, label: 'مقطع و دروس', Icon: BookOpen },
          { key: 'pricing' as SettingsTabKey, label: 'قیمت و تایم‌بندی', Icon: TrendingUp },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          const IconComp = tab.Icon;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: isActive ? colors.primary : colors.surfaceVariant,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
            >
              <IconComp size={15} color={isActive ? colors.textOnPrimary : colors.textLight} />
              <Text
                style={[
                  styles.tabBtnText,
                  {
                    color: isActive ? colors.textOnPrimary : colors.text,
                    fontFamily: isActive ? FONT_FAMILY.bold : FONT_FAMILY.medium,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textLight }]}>
            در حال بارگذاری تنظیمات تدریس...
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* TAB 1: WEEKLY SCHEDULE */}
            {activeTab === 'schedule' && (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>برنامه زمانی هفتگی تدریس</Text>
                  <Calendar size={18} color={colors.primary} />
                </View>
                <Text style={[styles.cardSub, { color: colors.textLight }]}>
                  برای هر روز هفته می‌توانید یک یا چند بازه زمانی مستقل تعریف کنید. دانش‌آموزان فقط در این بازه‌ها شما را پیدا می‌کنند.
                </Text>

                <View
                  style={[
                    styles.scheduleStatusBox,
                    {
                      backgroundColor: enabledDaysCount > 0 ? colors.successBackground : colors.warningBackground,
                      borderColor: enabledDaysCount > 0 ? colors.success : colors.warning,
                    },
                  ]}
                >
                  <View style={styles.scheduleStatusRight}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: enabledDaysCount > 0 ? colors.success : colors.warning },
                      ]}
                    />
                    <Text
                      style={[
                        styles.scheduleStatusText,
                        styles.tabularText,
                        { color: enabledDaysCount > 0 ? colors.success : colors.warning },
                      ]}
                    >
                      {enabledDaysCount > 0
                        ? `برنامه هفتگی شما در ${enabledDaysCount.toLocaleString('fa-IR')} روز هفته (${totalSlotsCount.toLocaleString('fa-IR')} بازه زمانی) فعال است.`
                        : 'هنوز هیچ بازه زمانی در هفته تعریف نکرده‌اید؛ بدون تعریف ساعت کاری، در جستجوی دانش‌آموزان نمایش داده نمی‌شوید.'}
                    </Text>
                  </View>
                </View>

                <WeeklyScheduleManager value={weeklySchedule} onChange={setWeeklySchedule} />
              </View>
            )}

            {/* TAB 2: EDUCATION LEVEL & DYNAMIC ADMIN EDU-CONTENT SUBJECTS */}
            {activeTab === 'subjects' && (
              <>
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>مقطع تحصیلی تدریس</Text>
                    <GraduationCap size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.cardSub, { color: colors.textLight }]}>
                    دانش‌آموزان کدام مقاطع می‌توانند با شما کلاس رزرو کنند؟
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
                              backgroundColor: isSelected ? colors.infoBackground : colors.surfaceVariant,
                              borderColor: isSelected ? colors.primary : colors.border,
                            },
                          ]}
                          onPress={() => setEducationLevel(lvl.key as any)}
                          activeOpacity={0.8}
                        >
                          <View
                            style={[styles.radioOuter, { borderColor: isSelected ? colors.primary : colors.border }]}
                          >
                            {isSelected && (
                              <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                            )}
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

                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      دروس تخصصی (بروز از محتوای آموزشی)
                    </Text>
                    <BookOpen size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.cardSub, { color: colors.textLight }]}>
                    فقط دروسی که اینجا انتخاب می‌کنید در جستجوی دانش‌آموزان با پروفایل شما تطبیق داده می‌شوند.
                  </Text>

                  {/* Selected Subjects Tag Cloud */}
                  <View style={styles.selectedSubjectsWrap}>
                    {teachingSubjects.map((sub, idx) => (
                      <View
                        key={`${sub}-${idx}`}
                        style={[
                          styles.selectedSubjectTag,
                          { backgroundColor: colors.infoBackground, borderColor: colors.primary },
                        ]}
                      >
                        <TouchableOpacity
                          onPress={() => handleToggleSubject(sub)}
                          hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                        >
                          <X size={14} color={colors.primary} />
                        </TouchableOpacity>
                        <Text style={[styles.selectedSubjectTagText, { color: colors.primary }]}>{sub}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Level Filter Tabs for Admin Books */}
                  {subjectGroups.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.levelFilterScroll}
                    >
                      <TouchableOpacity
                        style={[
                          styles.levelFilterPill,
                          {
                            backgroundColor:
                              selectedSubjectLevelTab === 'all' ? colors.primary : colors.surfaceVariant,
                            borderColor:
                              selectedSubjectLevelTab === 'all' ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => setSelectedSubjectLevelTab('all')}
                      >
                        <Text
                          style={[
                            styles.levelFilterPillText,
                            { color: selectedSubjectLevelTab === 'all' ? colors.textOnPrimary : colors.text },
                          ]}
                        >
                          همه مقاطع
                        </Text>
                      </TouchableOpacity>
                      {subjectGroups.map((grp) => {
                        const active = selectedSubjectLevelTab === grp.levelId;
                        return (
                          <TouchableOpacity
                            key={grp.levelId}
                            style={[
                              styles.levelFilterPill,
                              {
                                backgroundColor: active ? colors.primary : colors.surfaceVariant,
                                borderColor: active ? colors.primary : colors.border,
                              },
                            ]}
                            onPress={() => setSelectedSubjectLevelTab(grp.levelId)}
                          >
                            <Text
                              style={[
                                styles.levelFilterPillText,
                                { color: active ? colors.textOnPrimary : colors.text },
                              ]}
                            >
                              {grp.levelName}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}

                  {/* Search Input */}
                  <View
                    style={[
                      styles.searchBox,
                      { borderColor: colors.border, backgroundColor: colors.surfaceVariant },
                    ]}
                  >
                    <Search size={16} color={colors.textLight} />
                    <TextInput
                      style={[styles.searchInput, { color: colors.text }]}
                      value={subjectSearch}
                      onChangeText={setSubjectSearch}
                      placeholder="جستجوی درس یا نام کتاب..."
                      placeholderTextColor={colors.textLight}
                    />
                  </View>

                  {/* Add Custom Subject */}
                  <View style={styles.addCustomRow}>
                    <TextInput
                      style={[
                        styles.customSubjectInput,
                        { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceVariant },
                      ]}
                      value={customSubjectInput}
                      onChangeText={setCustomSubjectInput}
                      placeholder="افزودن نام درس دلخواه..."
                      placeholderTextColor={colors.textLight}
                      onSubmitEditing={handleAddCustomSubject}
                    />
                    <TouchableOpacity
                      style={[styles.addCustomBtn, { backgroundColor: colors.primary }]}
                      onPress={handleAddCustomSubject}
                      activeOpacity={0.8}
                    >
                      <Plus size={16} color={colors.textOnPrimary} />
                      <Text style={[styles.addCustomBtnText, { color: colors.textOnPrimary }]}>افزودن</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Subject Selection Grid */}
                  <Text style={[styles.suggestionsLabel, { color: colors.textLight }]}>
                    لیست دروس و کتاب‌های ثبت‌شده در سیستم:
                  </Text>
                  <View style={styles.subjectsGrid}>
                    {displayedSubjects.map((sub, idx) => {
                      const isSelected = teachingSubjects.includes(sub);
                      return (
                        <TouchableOpacity
                          key={`${sub}-${idx}`}
                          style={[
                            styles.subjectChip,
                            {
                              backgroundColor: isSelected ? colors.success : colors.surfaceVariant,
                              borderColor: isSelected ? colors.success : colors.border,
                            },
                          ]}
                          onPress={() => handleToggleSubject(sub)}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.subjectChipText,
                              { color: isSelected ? colors.textOnPrimary : colors.text },
                            ]}
                          >
                            {isSelected ? '✓ ' : '+ '}
                            {sub}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </>
            )}

            {/* TAB 3: 90-MIN BASE PRICE + LIVE TIERED DURATION PRICING TABLE */}
            {activeTab === 'pricing' && (
              <>
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      قیمت پایه کلاس (۱ ساعت و نیم / ۹۰ دقیقه)
                    </Text>
                    <Clock size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.cardSub, { color: colors.textLight }]}>
                    قیمت اصلی را برای ۹۰ دقیقه مشخص کنید؛ تایم‌های کوتاه‌تر به‌صورت خودکار با نرخ دقیقه‌ای بالاتر محاسبه می‌شوند تا رزرو زمان طولانی‌تر به‌صرفه‌تر باشد.
                  </Text>

                  <View
                    style={[
                      styles.inputRow,
                      { borderColor: colors.primary, backgroundColor: colors.surfaceVariant },
                    ]}
                  >
                    <Text style={[styles.inputUnit, { color: colors.textLight }]}>تومان</Text>
                    <TextInput
                      style={[styles.priceInput, styles.tabularText, { color: colors.text }]}
                      keyboardType="numeric"
                      value={Number(inputSessionPrice || 0).toLocaleString('fa-IR')}
                      onChangeText={handlePriceChange}
                      placeholder="۵۰۰,۰۰۰"
                      placeholderTextColor={colors.textLight}
                    />
                  </View>

                  <Text style={[styles.presetsLabel, { color: colors.textLight }]}>انتخاب سریع مبالغ پایه:</Text>
                  <View style={styles.presetsRow}>
                    {PRESETS.map((amt) => {
                      const isSelected = sessionPrice === amt;
                      return (
                        <TouchableOpacity
                          key={amt}
                          style={[
                            styles.presetChip,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                              borderColor: isSelected ? colors.primary : colors.border,
                            },
                          ]}
                          onPress={() => handleSelectPreset(amt)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.presetChipText,
                              styles.tabularText,
                              { color: isSelected ? colors.textOnPrimary : colors.text },
                            ]}
                          >
                            {(amt / 1000).toLocaleString('fa-IR')} هزار
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Live Tiered Duration Breakdown Card */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      جدول قیمت در تایم‌بندی‌های مختلف
                    </Text>
                    <TrendingUp size={18} color={colors.success} />
                  </View>
                  <Text style={[styles.cardSub, { color: colors.textLight }]}>
                    با ضربه روی هر تایم می‌توانید آن را برای دانش‌آموزان فعال یا غیرفعال کنید:
                  </Text>

                  <View style={styles.durationRowsWrap}>
                    {durationBreakdown.map((item) => {
                      const isBase = item.minutes === 90;
                      return (
                        <TouchableOpacity
                          key={item.minutes}
                          activeOpacity={0.8}
                          onPress={() => handleToggleDuration(item.minutes)}
                          style={[
                            styles.durationRowCard,
                            {
                              backgroundColor: item.enabled
                                ? isBase
                                  ? colors.successBackground
                                  : colors.surfaceVariant
                                : colors.background,
                              borderColor: item.enabled
                                ? isBase
                                  ? colors.success
                                  : colors.border
                                : colors.borderSubtle,
                              opacity: item.enabled ? 1 : 0.55,
                            },
                          ]}
                        >
                          <View style={styles.durationPriceCol}>
                            <Text style={[styles.durationPriceText, styles.tabularText, { color: colors.text }]}>
                              {item.price.toLocaleString('fa-IR')} تومان
                            </Text>
                            <Text style={[styles.durationPerMinText, styles.tabularText, { color: colors.textLight }]}>
                              هر دقیقه: {item.perMinute.toLocaleString('fa-IR')} ت
                            </Text>
                          </View>

                          <View style={styles.durationMetaCol}>
                            <View style={styles.durationTitleRow}>
                              <View
                                style={[
                                  styles.durationBadgePill,
                                  {
                                    backgroundColor: isBase ? colors.success : colors.infoBackground,
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.durationBadgeText,
                                    { color: isBase ? colors.textOnPrimary : colors.info },
                                  ]}
                                >
                                  {item.badge}
                                </Text>
                              </View>
                              <Text style={[styles.durationMinutesTitle, styles.tabularText, { color: colors.text }]}>
                                {item.minutes.toLocaleString('fa-IR')} دقیقه
                              </Text>
                            </View>
                            <Text style={[styles.durationToggleHint, { color: item.enabled ? colors.success : colors.error }]}>
                              {item.enabled ? '✓ فعال برای رزرو دانش‌آموز' : '✕ غیرفعال شده'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Revenue & Settlement Info Card */}
                <View
                  style={[
                    styles.infoCard,
                    { backgroundColor: colors.successBackground, borderColor: colors.success },
                  ]}
                >
                  <View style={styles.infoCardHeader}>
                    <ShieldCheck size={20} color={colors.success} />
                    <Text style={[styles.infoCardTitle, { color: colors.success }]}>
                      قوانین تسویه حساب و کارمزد
                    </Text>
                  </View>
                  <View style={styles.infoItemRow}>
                    <CheckCircle size={14} color={colors.success} style={styles.infoCheckIcon} />
                    <Text style={[styles.infoItemText, { color: colors.text }]}>
                      سهم معلم از شهریه هر جلسه کلاس ۹۰٪ و کارمزد پلتفرم ۱۰٪ است.
                    </Text>
                  </View>
                  <View style={styles.infoItemRow}>
                    <CheckCircle size={14} color={colors.success} style={styles.infoCheckIcon} />
                    <Text style={[styles.infoItemText, { color: colors.text }]}>
                      تسویه حساب پس از اتمام جلسه کلاس به موجودی قابل برداشت کیف پول واریز می‌گردد.
                    </Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          {/* Persistent Bottom Save Bar */}
          <View style={[styles.bottomSaveBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }, saving && styles.savingDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.textOnPrimary} />
              ) : (
                <>
                  <Save size={18} color={colors.textOnPrimary} style={styles.saveIcon} />
                  <Text style={[styles.saveBtnText, { color: colors.textOnPrimary }]}>
                    ذخیره تمام تنظیمات تدریس
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabularText: {
    fontVariant: ['tabular-nums'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
    borderRadius: radius.sm,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.bold,
  },
  headerSpacer: {
    width: 36,
  },
  tabBarWrap: {
    flexDirection: 'row-reverse',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 6,
  },
  tabBtnText: {
    fontSize: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 13,
    fontFamily: FONT_FAMILY.regular,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
    gap: spacing.base,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.base,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
  },
  cardSub: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  scheduleStatusBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  scheduleStatusRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scheduleStatusText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
    flex: 1,
  },
  levelRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  levelChip: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: radius.md,
    borderWidth: 1,
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
  selectedSubjectsWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  selectedSubjectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    gap: 6,
  },
  selectedSubjectTagText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },
  levelFilterScroll: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  levelFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  levelFilterPillText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bold,
  },
  searchBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'right',
  },
  addCustomRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 14,
  },
  customSubjectInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'right',
  },
  addCustomBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: radius.md,
    gap: 4,
  },
  addCustomBtnText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },
  suggestionsLabel: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.medium,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  subjectsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  subjectChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  subjectChipText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.medium,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.base,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: spacing.md,
  },
  inputUnit: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.medium,
    marginEnd: 10,
  },
  priceInput: {
    flex: 1,
    fontSize: 19,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
  },
  presetsLabel: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.medium,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  presetsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.medium,
  },
  durationRowsWrap: {
    gap: 10,
  },
  durationRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 10,
  },
  durationPriceCol: {
    alignItems: 'flex-start',
    gap: 2,
  },
  durationPriceText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
  },
  durationPerMinText: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.regular,
  },
  durationMetaCol: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  durationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationMinutesTitle: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
  },
  durationBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  durationBadgeText: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bold,
  },
  durationToggleHint: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.medium,
  },
  infoCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.base,
    gap: 10,
  },
  infoCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  infoCardTitle: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
  },
  infoItemRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
  },
  infoCheckIcon: {
    marginStart: 6,
    marginTop: 3,
  },
  infoItemText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    lineHeight: 20,
    textAlign: 'right',
  },
  bottomSaveBar: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  saveBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: radius.base,
  },
  savingDisabled: {
    opacity: 0.7,
  },
  saveIcon: {
    marginStart: 8,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
  },
});

export default OnlineClassSettingsScreen;
