import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { showWarning, showError } from '../../components/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Award,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  TrendingUp,
  GraduationCap,
  Percent,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import {
  FIELDS,
  REGIONS,
  FieldDefinition,
  LessonDefinition,
  RankEstimateResult,
  toPersianDigits,
  normalizeNumberInput,
  formatRange,
} from '../../data/rankEstimateConfig';
import { rankEstimateService } from '../../services/rankEstimateService';

type FieldKey = 'tajrobi' | 'riazi' | 'ensani';

interface LessonInputItem {
  id: string; // lesson_id
  title: string;
  percent: string;
}

const RankEstimateScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const scrollViewRef = useRef<any>(null);

  // Form State
  const [selectedField, setSelectedField] = useState<FieldKey>('tajrobi');
  const [selectedRegion, setSelectedRegion] = useState<string>('first_region');
  const [selectedYear, setSelectedYear] = useState<string>('1404');
  const [gpa, setGpa] = useState<string>('');

  // Lessons list & values
  const [lessons, setLessons] = useState<LessonInputItem[]>([]);
  const [gradeId, setGradeId] = useState<string>(FIELDS.tajrobi.gradeId);
  const [availableYears, setAvailableYears] = useState<string[]>(
    Object.keys(FIELDS.tajrobi.exams)
  );

  // Result & Loading states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<RankEstimateResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize and reload lessons when Field or Year changes
  useEffect(() => {
    loadLessonsAndYears(selectedField, selectedYear);
  }, [selectedField, selectedYear]);

  const loadLessonsAndYears = async (fieldKey: FieldKey, year: string) => {
    const fieldDef: FieldDefinition = FIELDS[fieldKey];
    const years = Object.keys(fieldDef.exams);
    setAvailableYears(years);

    // If current year is not supported in the new field, select the first available year
    let effectiveYear = year;
    if (!fieldDef.exams[year]) {
      effectiveYear = years[0];
      setSelectedYear(effectiveYear);
    }

    const entranceExamId = fieldDef.exams[effectiveYear];

    // Clear previous scores and results as required by doc
    setGpa('');
    setResult(null);
    setErrorMessage(null);

    // Try dynamic fetching, fallback to static config
    try {
      const data = await rankEstimateService.getGradeLessons(entranceExamId, fieldKey);
      if (data?.entrance_exam_lessons && data.entrance_exam_lessons.length > 0) {
        setLessons(
          data.entrance_exam_lessons.map((l: any) => ({
            id: l.id || l.lesson_id,
            title: l.lesson_title || l.title,
            percent: '',
          }))
        );

        if (data?.entrance_exam_grades?.[0]?.id) {
          setGradeId(data.entrance_exam_grades[0].id);
        } else {
          setGradeId(fieldDef.gradeId);
        }
        return;
      }
    } catch (e) {
      // Fallback below
    }

    // Static fallback
    setLessons(
      fieldDef.lessons.map((l: LessonDefinition) => ({
        id: l.id,
        title: l.title,
        percent: '',
      }))
    );
    setGradeId(fieldDef.gradeId);
  };

  const handleFieldChange = (newField: FieldKey) => {
    if (newField === selectedField) return;
    setSelectedField(newField);
  };

  const handleGpaChange = (text: string) => {
    const normalized = normalizeNumberInput(text);
    // Allow numbers and single decimal point
    if (/^\d*\.?\d*$/.test(normalized)) {
      setGpa(normalized);
    }
  };

  const handleLessonPercentChange = (lessonId: string, text: string) => {
    const normalized = normalizeNumberInput(text);
    // Support numbers, decimal points, and negative values (down to -33.33)
    if (/^-?\d*\.?\d*$/.test(normalized)) {
      setLessons((prev) =>
        prev.map((l) => (l.id === lessonId ? { ...l, percent: normalized } : l))
      );
    }
  };

  const handleValidation = (): string | null => {
    if (!selectedField) return 'لطفاً رشته تحصیلی را انتخاب کنید.';
    if (!selectedRegion) return 'لطفاً سهمیه خود را انتخاب کنید.';
    if (!selectedYear) return 'لطفاً سال کنکور را انتخاب کنید.';

    if (!gpa || gpa.trim() === '') {
      return 'لطفاً معدل امتحانات نهایی را وارد کنید.';
    }

    const gpaNum = parseFloat(gpa);
    if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 20) {
      return 'معدل باید عددی بین ۰ تا ۲۰ باشد.';
    }

    for (const lesson of lessons) {
      if (lesson.percent === '' || lesson.percent.trim() === '') {
        return `لطفاً درصد درس «${lesson.title}» را وارد کنید.`;
      }
      const p = parseFloat(lesson.percent);
      if (isNaN(p) || p < -33.33 || p > 100) {
        return `درصد درس «${lesson.title}» باید بین ۰ تا ۱۰۰ باشد.`;
      }
    }

    return null;
  };

  const handleCalculate = async () => {
    const validationError = handleValidation();
    if (validationError) {
      setErrorMessage(validationError);
      showWarning(validationError);
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const fieldDef = FIELDS[selectedField];
      const entranceExamId = fieldDef.exams[selectedYear];

      const payload = {
        region: selectedRegion,
        field_id: fieldDef.fieldId,
        entrance_exam_id: entranceExamId,
        lesson_percents: lessons.map((l) => ({
          lesson_id: l.id,
          percent: parseFloat(l.percent),
        })),
        grade_scores: [
          {
            grade_id: gradeId,
            score: parseFloat(gpa),
          },
        ],
      };

      const res = await rankEstimateService.calculateRank(payload);
      setResult(res);

      // Scroll to bottom smoothly to view results
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 250);
    } catch (err: any) {
      const msg =
        err?.message ||
        'ارتباط با سرور برقرار نشد، لطفاً اینترنت خود را بررسی و دوباره تلاش کنید.';
      setErrorMessage(msg);
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setGpa('');
    setLessons((prev) => prev.map((l) => ({ ...l, percent: '' })));
    setResult(null);
    setErrorMessage(null);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ChevronLeft color={colors.text} size={26} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            تخمین رتبه کنکور
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textLight }]}>
            محاسبه رتبه و تراز بر اساس کنکور و معدل
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleReset}
          style={styles.resetHeaderButton}
          activeOpacity={0.7}
        >
          <RefreshCw color={colors.textLight} size={20} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card 1: Parameters (Field, Quota, Year) */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.cardIconBox,
                  { backgroundColor: `${colors.primary}15` },
                ]}
              >
                <GraduationCap size={20} color={colors.primary} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                ۱. مشخصات داوطلب
              </Text>
            </View>

            {/* 1. رشته */}
            <View style={styles.sectionItem}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                رشته تحصیلی:
              </Text>
              <View style={styles.pillsRow}>
                {(['tajrobi', 'riazi', 'ensani'] as FieldKey[]).map((key) => {
                  const isSelected = selectedField === key;
                  const f = FIELDS[key];
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.pillButton,
                        { borderColor: isSelected ? colors.primary : colors.border },
                        isSelected && {
                          backgroundColor: `${colors.primary}15`,
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => handleFieldChange(key)}
                      activeOpacity={0.7}
                    >
                      {isSelected && (
                        <CheckCircle2
                          size={16}
                          color={colors.primary}
                          style={styles.pillIcon}
                        />
                      )}
                      <Text
                        style={[
                          styles.pillText,
                          {
                            color: isSelected ? colors.primary : colors.textLight,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {f.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. سهمیه */}
            <View style={styles.sectionItem}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                سهمیه منطقه:
              </Text>
              <View style={styles.pillsRow}>
                {Object.entries(REGIONS).map(([value, title]) => {
                  const isSelected = selectedRegion === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.pillButton,
                        { borderColor: isSelected ? colors.primary : colors.border },
                        isSelected && {
                          backgroundColor: `${colors.primary}15`,
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => setSelectedRegion(value)}
                      activeOpacity={0.7}
                    >
                      {isSelected && (
                        <CheckCircle2
                          size={16}
                          color={colors.primary}
                          style={styles.pillIcon}
                        />
                      )}
                      <Text
                        style={[
                          styles.pillText,
                          {
                            color: isSelected ? colors.primary : colors.textLight,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. سال کنکور */}
            <View style={styles.sectionItem}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                سال کنکور جهت تطبیق:
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.yearsScroll}
              >
                {availableYears.map((year) => {
                  const isSelected = selectedYear === year;
                  return (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.yearPill,
                        { borderColor: isSelected ? colors.primary : colors.border },
                        isSelected && {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => setSelectedYear(year)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.yearPillText,
                          {
                            color: isSelected ? '#ffffff' : colors.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {`کنکور ${toPersianDigits(year)}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Card 2: معدل امتحانات نهایی */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.cardIconBox,
                  { backgroundColor: `${colors.success}15` },
                ]}
              >
                <Award size={20} color={colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  ۲. معدل امتحانات نهایی (سوابق تحصیلی)
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.textLight }]}>
                  نمره نهایی دیپلم را بین ۰ تا ۲۰ با حداکثر دو رقم اعشار وارد کنید
                </Text>
              </View>
            </View>

            <View style={styles.gpaInputWrapper}>
              <View
                style={[
                  styles.inputBox,
                  {
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    borderColor: colors.border,
                  },
                ]}
              >
                <TextInput
                  style={[styles.numericInput, { color: colors.text }]}
                  value={toPersianDigits(gpa)}
                  onChangeText={handleGpaChange}
                  keyboardType="numeric"
                  placeholder="مثال: ۱۹.۷۵"
                  placeholderTextColor={colors.textLight}
                  maxLength={5}
                />
                <Text style={[styles.unitText, { color: colors.textLight }]}>
                  از ۲۰
                </Text>
              </View>
            </View>
          </View>

          {/* Card 3: درصد دروس اختصاصی */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.cardIconBox,
                  { backgroundColor: `${colors.primary}15` },
                ]}
              >
                <Percent size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  ۳. درصد دروس اختصاصی ({FIELDS[selectedField].title})
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.textLight }]}>
                  درصد تخمینی هر درس را بین ۰ تا ۱۰۰ درصد وارد نمایید
                </Text>
              </View>
            </View>

            <View style={styles.lessonsContainer}>
              {lessons.map((lesson, index) => (
                <View
                  key={lesson.id}
                  style={[
                    styles.lessonRow,
                    index !== lessons.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.lessonNameContainer}>
                    <View style={styles.lessonBadge}>
                      <Text style={styles.lessonBadgeText}>
                        {toPersianDigits(index + 1)}
                      </Text>
                    </View>
                    <Text style={[styles.lessonTitle, { color: colors.text }]}>
                      {lesson.title}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.percentInputBox,
                      {
                        backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.percentInput, { color: colors.text }]}
                      value={toPersianDigits(lesson.percent)}
                      onChangeText={(t) => handleLessonPercentChange(lesson.id, t)}
                      keyboardType="numeric"
                      placeholder="۰"
                      placeholderTextColor={colors.textLight}
                      maxLength={6}
                    />
                    <Text
                      style={[styles.percentSign, { color: colors.textLight }]}
                    >
                      ٪
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Error Banner */}
          {errorMessage ? (
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: `${colors.error}15`, borderColor: colors.error },
              ]}
            >
              <AlertCircle size={20} color={colors.error} />
              <Text style={[styles.errorBannerText, { color: colors.error }]}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* Calculate Button */}
          <TouchableOpacity
            style={[
              styles.calculateButton,
              { backgroundColor: colors.primary },
              isLoading && { opacity: 0.7 },
            ]}
            onPress={handleCalculate}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Sparkles size={20} color="#ffffff" style={{ marginLeft: 8 }} />
                <Text style={styles.calculateButtonText}>تخمین رتبه</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Results Card */}
          {result && (
            <View
              style={[
                styles.resultCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.primary,
                },
              ]}
            >
              {/* Result Header Badge */}
              <View
                style={[
                  styles.resultHeaderBadge,
                  { backgroundColor: `${colors.primary}15` },
                ]}
              >
                <Award size={22} color={colors.primary} />
                <Text
                  style={[styles.resultHeaderTitle, { color: colors.primary }]}
                >
                  نتیجه تخمین رتبه و تراز
                </Text>
              </View>

              {/* Total Level Banner */}
              <View
                style={[
                  styles.totalLevelBanner,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.totalLevelLabel}>تراز کل تخمینی</Text>
                <Text style={styles.totalLevelValue}>
                  {formatRange(
                    result.total_level_from,
                    result.total_level_to
                  )}
                </Text>
              </View>

              {/* Details Metrics */}
              <View style={styles.metricsGrid}>
                {/* 1. رتبه در کشور */}
                <View
                  style={[
                    styles.metricBox,
                    {
                      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.metricHeader}>
                    <TrendingUp size={16} color="#3b82f6" />
                    <Text
                      style={[styles.metricLabel, { color: colors.textLight }]}
                    >
                      رتبه‌ی تخمینی در کشور
                    </Text>
                  </View>
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    {formatRange(
                      result.country_rank_from,
                      result.country_rank_to
                    )}
                  </Text>
                </View>

                {/* 2. رتبه در سهمیه */}
                <View
                  style={[
                    styles.metricBox,
                    {
                      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.metricHeader}>
                    <Award size={16} color="#8b5cf6" />
                    <Text
                      style={[styles.metricLabel, { color: colors.textLight }]}
                    >
                      رتبه‌ی تخمینی در سهمیه ({REGIONS[selectedRegion]})
                    </Text>
                  </View>
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    {formatRange(
                      result.region_rank_from,
                      result.region_rank_to
                    )}
                  </Text>
                </View>

                {/* 3. تراز کنکور */}
                <View
                  style={[
                    styles.metricBox,
                    {
                      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.metricHeader}>
                    <BookOpen size={16} color="#10b981" />
                    <Text
                      style={[styles.metricLabel, { color: colors.textLight }]}
                    >
                      تراز آزمون اختصاصی (کنکور)
                    </Text>
                  </View>
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    {formatRange(
                      result.entrance_exam_level_from,
                      result.entrance_exam_level_to
                    )}
                  </Text>
                </View>

                {/* 4. تراز سوابق تحصیلی */}
                <View
                  style={[
                    styles.metricBox,
                    {
                      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.metricHeader}>
                    <GraduationCap size={16} color="#f59e0b" />
                    <Text
                      style={[styles.metricLabel, { color: colors.textLight }]}
                    >
                      تراز سوابق تحصیلی (معدل)
                    </Text>
                  </View>
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    {formatRange(
                      result.academic_record_level_from,
                      result.academic_record_level_to
                    )}
                  </Text>
                </View>
              </View>

              {/* Disclaimer */}
              <View style={styles.disclaimerContainer}>
                <HelpCircle size={16} color={colors.textLight} />
                <Text
                  style={[styles.disclaimerText, { color: colors.textLight }]}
                >
                  این نتایج تخمینی است و ممکن است با رتبه‌ی واقعی تفاوت داشته
                  باشد.
                </Text>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  resetHeaderButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 50,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionItem: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'left',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  pillIcon: {
    marginLeft: 6,
  },
  pillText: {
    fontSize: 14,
  },
  yearsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  yearPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  yearPillText: {
    fontSize: 13,
  },
  gpaInputWrapper: {
    marginTop: 4,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
  },
  numericInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  lessonsContainer: {
    marginTop: 6,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  lessonNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lessonBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  lessonBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  percentInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    width: 90,
    height: 44,
  },
  percentInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  percentSign: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    marginRight: 8,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'left',
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  calculateButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  resultCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  resultHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 16,
  },
  resultHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginRight: 8,
  },
  totalLevelBanner: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLevelLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  totalLevelValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
  },
  metricsGrid: {
    gap: 10,
  },
  metricBox: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'left',
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  disclaimerText: {
    fontSize: 11,
    marginRight: 6,
    textAlign: 'center',
  },
});

export default RankEstimateScreen;
