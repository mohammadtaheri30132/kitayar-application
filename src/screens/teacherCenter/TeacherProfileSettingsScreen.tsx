import React, { useState, useEffect } from 'react';
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
import {
  ChevronRight,
  GraduationCap,
  BookOpen,
  User,
  Search,
  CheckCircle2,
  Save,
  Check,
  Plus,
} from 'lucide-react-native';
import { FONT_FAMILY } from '../../theme/typography';
import { showSuccess, showError, showWarning } from '../../components/feedback';

const DEFAULT_SUBJECTS = [
  'ریاضی',
  'فیزیک',
  'شیمی',
  'زیست‌شناسی',
  'عربی',
  'زبان انگلیسی',
  'ادبیات فارسی',
  'هندسه',
  'حسابان',
  'علوم تجربی',
  'دینی و معارف',
  'جامعه‌شناسی',
  'فلسفه و منطق',
  'اقتصاد',
  'تاریخ و جغرافیا',
  'روان‌شناسی',
  'کامپیوتر و برنامه‌نویسی',
];

export const TeacherProfileSettingsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Teaching setup
  const [educationLevel, setEducationLevel] = useState<'elementary' | 'secondary' | 'both'>('secondary');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['ریاضی']);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');
  const [customSubjectInput, setCustomSubjectInput] = useState('');

  // Profile & Resume
  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('5');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/center/overview');
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        if (d.profileSummary) {
          setFullName(d.profileSummary.fullName || '');
          setHeadline(d.profileSummary.headline || '');
          if (Array.isArray(d.profileSummary.teachingSubjects) && d.profileSummary.teachingSubjects.length > 0) {
            setSelectedSubjects(d.profileSummary.teachingSubjects);
          }
          if (d.profileSummary.educationLevel) {
            setEducationLevel(d.profileSummary.educationLevel);
          }
        }
      }
    } catch (e) {
      console.warn('Error fetching profile settings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const toggleSubject = (sub: string) => {
    if (selectedSubjects.includes(sub)) {
      if (selectedSubjects.length === 1) {
        showWarning('حداقل یک درس باید انتخاب شده باشد.');
        return;
      }
      setSelectedSubjects((prev) => prev.filter((s) => s !== sub));
    } else {
      setSelectedSubjects((prev) => [...prev, sub]);
    }
  };

  const handleAddCustomSubject = () => {
    const trimmed = customSubjectInput.trim();
    if (!trimmed) return;
    if (selectedSubjects.includes(trimmed)) {
      showWarning('این درس قبلاً اضافه شده است.');
      return;
    }
    setSelectedSubjects((prev) => [...prev, trimmed]);
    setCustomSubjectInput('');
    showSuccess(`درس «${trimmed}» افزوده شد.`);
  };

  const handleSave = async () => {
    if (educationLevel !== 'elementary' && selectedSubjects.length === 0) {
      showWarning('لطفاً حداقل یک درس تخصصی انتخاب کنید.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        educationLevel,
        teachingSubjects: educationLevel === 'elementary' ? ['آموزگار ابتدایی (تمام دروس)'] : selectedSubjects,
        headline: headline.trim(),
        bio: bio.trim(),
      };

      const res = await api.put('/teacher/center/workdesk-settings', payload);
      if (res.data?.success) {
        showSuccess('تنظیمات مقاطع، دروس و پروفایل با موفقیت ذخیره شد.');
        navigation.goBack();
      } else {
        showError(res.data?.message || 'خطا در ذخیره‌سازی اطلاعات');
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'خطا در برقراری ارتباط با سرور');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronRight size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>ویرایش دروس و پروفایل تدریس</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {/* Section 1: Education Level */}
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <GraduationCap size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>مقطع تحصیلی تدریس</Text>
            </View>
            <Text style={[styles.sectionDesc, { color: colors.textLight }]}>
              مقطع یا دوره‌ای که توانایی حل مسئله و برگزاری کلاس‌های آنلاین برای آن را دارید انتخاب کنید:
            </Text>

            <View style={styles.levelSelectorRow}>
              <TouchableOpacity
                style={[
                  styles.levelPill,
                  educationLevel === 'elementary' && styles.levelPillActive,
                  { borderColor: colors.border },
                ]}
                onPress={() => setEducationLevel('elementary')}
                activeOpacity={0.75}
              >
                <Text style={[styles.levelPillText, educationLevel === 'elementary' && styles.levelPillTextActive]}>
                  ابتدایی (پایه‌های ۱ تا ۶)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.levelPill,
                  educationLevel === 'secondary' && styles.levelPillActive,
                  { borderColor: colors.border },
                ]}
                onPress={() => setEducationLevel('secondary')}
                activeOpacity={0.75}
              >
                <Text style={[styles.levelPillText, educationLevel === 'secondary' && styles.levelPillTextActive]}>
                  متوسطه تخصصی
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.levelPill,
                  educationLevel === 'both' && styles.levelPillActive,
                  { borderColor: colors.border },
                ]}
                onPress={() => setEducationLevel('both')}
                activeOpacity={0.75}
              >
                <Text style={[styles.levelPillText, educationLevel === 'both' && styles.levelPillTextActive]}>
                  هر دو مقطع
                </Text>
              </TouchableOpacity>
            </View>

            {educationLevel === 'elementary' && (
              <View style={styles.noticeBox}>
                <Text style={styles.noticeText}>
                  به‌عنوان آموزگار دوره ابتدایی، درخواست‌ها و سوالات تمامی پایه‌های اول تا ششم برای شما ارسال خواهد شد.
                </Text>
              </View>
            )}
          </View>

          {/* Section 2: Specialized Teaching Subjects */}
          {(educationLevel === 'secondary' || educationLevel === 'both') && (
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <BookOpen size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>دروس تخصصی تدریس</Text>
              </View>
              <Text style={[styles.sectionDesc, { color: colors.textLight }]}>
                شما می‌توانید چندین درس را همزمان انتخاب نمایید (مثلاً ریاضی و زبان):
              </Text>

              {/* Search Box */}
              <View style={[styles.searchRow, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border }]}>
                <Search size={16} color={colors.textLight} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="جستجوی درس..."
                  placeholderTextColor={colors.textLight}
                  value={subjectSearchQuery}
                  onChangeText={setSubjectSearchQuery}
                  textAlign="right"
                />
              </View>

              {/* Subject Chips */}
              <View style={styles.chipsWrap}>
                {DEFAULT_SUBJECTS.filter((s) => !subjectSearchQuery || s.includes(subjectSearchQuery)).map((subj) => {
                  const isSelected = selectedSubjects.includes(subj);
                  return (
                    <TouchableOpacity
                      key={subj}
                      style={[
                        styles.chip,
                        isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                        { borderColor: colors.border },
                      ]}
                      onPress={() => toggleSubject(subj)}
                      activeOpacity={0.7}
                    >
                      {isSelected && <CheckCircle2 size={13} color="#ffffff" style={{ marginLeft: 4 }} />}
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: isSelected ? '#ffffff' : colors.text,
                            fontFamily: isSelected ? FONT_FAMILY.bold : FONT_FAMILY.regular,
                          },
                        ]}
                      >
                        {subj}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Add Custom Subject */}
              <View style={styles.customSubjectRow}>
                <TouchableOpacity
                  style={[styles.addCustomBtn, { backgroundColor: colors.primary }]}
                  onPress={handleAddCustomSubject}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color="#ffffff" />
                  <Text style={styles.addCustomBtnText}>افزودن</Text>
                </TouchableOpacity>
                <TextInput
                  style={[styles.customSubjectInput, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', color: colors.text, borderColor: colors.border }]}
                  placeholder="افزودن درس دیگر (مثال: منطق دوازدهم)"
                  placeholderTextColor={colors.textLight}
                  value={customSubjectInput}
                  onChangeText={setCustomSubjectInput}
                  textAlign="right"
                />
              </View>
            </View>
          )}

          {/* Section 3: Profile & Headline & Bio */}
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <User size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>اطلاعات و بیوگرافی استاد</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>نام و نام خانوادگی:</Text>
              <TextInput
                style={[styles.textInputDisabled, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: colors.textLight, borderColor: colors.border }]}
                value={fullName}
                editable={false}
                textAlign="right"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>عنوان شغلی / سرفصل رزومه:</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', color: colors.text, borderColor: colors.border }]}
                placeholder="مثال: دبیر رسمی آموزش و پرورش، مدرس رتبه‌های برتر"
                placeholderTextColor={colors.textLight}
                value={headline}
                onChangeText={setHeadline}
                textAlign="right"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>معرفی و سوابق آموزشی (بیوگرافی):</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', color: colors.text, borderColor: colors.border }]}
                placeholder="توضیح مختصری درباره تجربه تدریس، روش آموزش و افتخارات..."
                placeholderTextColor={colors.textLight}
                value={bio}
                onChangeText={setBio}
                multiline={true}
                numberOfLines={4}
                textAlign="right"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Check size={18} color="#ffffff" />
                <Text style={styles.saveBtnText}>ذخیره تغییرات مشخصات و دروس</Text>
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
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontFamily: FONT_FAMILY.bold,
  },
  sectionDesc: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'right',
    lineHeight: 18,
  },
  levelSelectorRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 4,
  },
  levelPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelPillActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  levelPillText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bold,
    color: '#64748b',
    textAlign: 'center',
  },
  levelPillTextActive: {
    color: '#ffffff',
  },
  noticeBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    padding: 10,
  },
  noticeText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    color: '#1e40af',
    textAlign: 'right',
    lineHeight: 18,
  },
  searchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
  },
  chipsWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11.5,
  },
  customSubjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  customSubjectInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
  },
  addCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 4,
  },
  addCustomBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    fontSize: 12.5,
    fontFamily: FONT_FAMILY.regular,
  },
  textInputDisabled: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    fontSize: 12.5,
    fontFamily: FONT_FAMILY.regular,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 12.5,
    fontFamily: FONT_FAMILY.regular,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 6,
    marginTop: 6,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontFamily: FONT_FAMILY.bold,
  },
});

export default TeacherProfileSettingsScreen;
