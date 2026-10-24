import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { showError, showSuccess } from '../../components/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import {
  ChevronRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  Check,
  Edit3,
} from 'lucide-react-native';
import { smartSheetService, LookupSheetResult, OmrRecognizedAnswer } from '../../services/smartSheetService';
import { toPersianNumbers } from '../../utils/date/jalaliHelper';

export const ManualGradingScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const { sheetDetails }: { sheetDetails: LookupSheetResult } = route.params;

  // Initialize answers array for all questions
  const [answers, setAnswers] = useState<OmrRecognizedAnswer[]>(() => {
    if (sheetDetails.existingAnswers && sheetDetails.existingAnswers.length > 0) {
      return sheetDetails.existingAnswers;
    }
    const initial: OmrRecognizedAnswer[] = [];
    for (let q = 1; q <= sheetDetails.totalQuestions; q++) {
      initial.push({
        questionNumber: q,
        selectedOption: 0,
        confidence: 1.0,
        isAmbiguous: false,
        isMultiple: false,
        isBlank: true,
      });
    }
    return initial;
  });

  const [recordInGradebook, setRecordInGradebook] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scoreStats = React.useMemo(() => {
    return smartSheetService.calculateScoreLocally(
      answers,
      sheetDetails.answerKey,
      sheetDetails.totalQuestions,
      sheetDetails.pointsPerQuestion,
      sheetDetails.negativeMarking,
      sheetDetails.negativeFactor,
      sheetDetails.maxScore
    );
  }, [answers, sheetDetails]);

  const handleSelectOption = (qIndex: number, optNum: number) => {
    setAnswers((prev) => {
      const copy = [...prev];
      const current = copy[qIndex];
      // Toggle to 0 (blank) if tapped again
      const newSelected = current.selectedOption === optNum ? 0 : optNum;
      copy[qIndex] = {
        ...current,
        selectedOption: newSelected,
        isBlank: newSelected === 0,
        isMultiple: false,
        isAmbiguous: false,
        confidence: 1.0,
      };
      return copy;
    });
  };

  const handleSaveManualGrade = async () => {
    setIsSubmitting(true);
    try {
      const res = await smartSheetService.gradeSheet({
        sheetCode: sheetDetails.sheetCode,
        answers: scoreStats.evaluated,
        gradingMethod: 'MANUAL',
        recordInGradebook,
        customScore: scoreStats.finalScore,
      });

      if (res.success) {
        showSuccess(`نمره دانش‌آموز ${sheetDetails.studentName} به صورت دستی ثبت شد: ${toPersianNumbers(scoreStats.finalScore)} از ${toPersianNumbers(sheetDetails.maxScore)}`);
        navigation.navigate('SmartSheetHubScreen');
      }
    } catch (e: any) {
      showError(e?.response?.data?.message || e?.message || 'مشکلی رخ داد.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronRight color={colors.text} size={26} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>تصحیح دستی پاسخ‌برگ</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* مشخصات برگه */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.studentName, { color: colors.text }]}>{sheetDetails.studentName}</Text>
          <Text style={[styles.metaText, { color: colors.textLight }]}>
            کلاس: {sheetDetails.className} • آزمون: {sheetDetails.examTitle}
          </Text>
          <Text style={[styles.metaText, { color: colors.textLight, marginTop: 2 }]}>
            کد برگه: {sheetDetails.sheetCode}
          </Text>

          {/* باکس نمره زنده */}
          <View style={styles.scoreLiveBox}>
            <View>
              <Text style={styles.scoreLiveLabel}>نمره کل محاسبه‌شده:</Text>
              <Text style={styles.scoreLiveBigText}>
                {toPersianNumbers(scoreStats.finalScore)} / {toPersianNumbers(sheetDetails.maxScore)}
              </Text>
            </View>
            <View style={styles.statsSummaryRow}>
              <Text style={styles.statPillText}>درست: {toPersianNumbers(scoreStats.correctCount)}</Text>
              <Text style={styles.statPillText}>نادرست: {toPersianNumbers(scoreStats.incorrectCount)}</Text>
              <Text style={styles.statPillText}>سفید: {toPersianNumbers(scoreStats.unansweredCount)}</Text>
            </View>
          </View>
        </View>

        {/* جدول انتخاب گزینه‌ها */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>ورود پاسخ‌های دانش‌آموز:</Text>
          <Text style={[styles.sectionDesc, { color: colors.textLight }]}>
            گزینه انتخاب شده توسط دانش‌آموز را لمس کنید (لمس مجدد = پاک کردن / سفید):
          </Text>

          {scoreStats.evaluated.map((qItem, idx) => {
            const qNum = qItem.questionNumber;
            const correctKey = sheetDetails.answerKey[qNum - 1];
            const isCorrect = qItem.isCorrect;
            const isBlank = qItem.isBlank;
            const isAlphabetic = sheetDetails.optionLabelType === 'ALPHABETIC';
            const OPTION_LETTERS = ['الف', 'ب', 'ج', 'د', 'هـ'];

            return (
              <View key={qNum} style={[styles.qRow, { borderBottomColor: colors.border }]}>
                <View style={{ width: 65 }}>
                  <Text style={[styles.qNum, { color: colors.text }]}>سوال {toPersianNumbers(qNum)}:</Text>
                  {correctKey ? (
                    <Text style={styles.keySub}>
                      کلید: {isAlphabetic ? OPTION_LETTERS[correctKey - 1] || toPersianNumbers(correctKey) : toPersianNumbers(correctKey)}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.bubblesRow}>
                  {Array.from({ length: sheetDetails.optionsPerQuestion }).map((_, optIdx) => {
                    const optNum = optIdx + 1;
                    const isSelected = qItem.selectedOption === optNum;
                    const isKey = correctKey === optNum;
                    const optLabel = isAlphabetic
                      ? OPTION_LETTERS[optIdx] || toPersianNumbers(optNum)
                      : toPersianNumbers(optNum);

                    let bg = '#f8fafc';
                    let border = colors.border;
                    let textCol = colors.text;

                    if (isSelected) {
                      if (isKey) {
                        bg = '#16a34a';
                        border = '#16a34a';
                        textCol = '#fff';
                      } else {
                        bg = '#dc2626';
                        border = '#dc2626';
                        textCol = '#fff';
                      }
                    } else if (isKey) {
                      border = '#16a34a';
                      bg = '#f0fdf4';
                      textCol = '#16a34a';
                    }

                    return (
                      <TouchableOpacity
                        key={optNum}
                        style={[styles.bubbleBtn, { backgroundColor: bg, borderColor: border }]}
                        onPress={() => handleSelectOption(idx, optNum)}
                      >
                        <Text style={[styles.bubbleText, { color: textCol }]}>
                          {optLabel}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={{ width: 36, alignItems: 'center' }}>
                  {isBlank ? (
                    <Text style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'IRANSansX' }}>سفید</Text>
                  ) : isCorrect ? (
                    <CheckCircle2 size={16} color="#16a34a" />
                  ) : (
                    <XCircle size={16} color="#dc2626" />
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* سوئیچ کارنامه */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.switchTitle, { color: colors.text }]}>
                ثبت در کارنامه و پروفایل کلاسی
              </Text>
              <Text style={styles.switchDesc}>نمره این پاسخ‌برگ به عنوان آزمون کلاسی ذخیره خواهد شد.</Text>
            </View>
            <Switch
              value={recordInGradebook}
              onValueChange={setRecordInGradebook}
              trackColor={{ false: '#cbd5e1', true: '#c7d2fe' }}
              thumbColor={recordInGradebook ? '#4f46e5' : '#f1f5f9'}
            />
          </View>
        </View>

        {/* دکمه ذخیره */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSaveManualGrade}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Check size={18} color="#fff" style={{ marginLeft: 6 }} />
              <Text style={styles.saveBtnText}>ذخیره و ثبت نهایی نمره دستی</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', fontFamily: 'IRANSansX' },
  content: { padding: 16, paddingBottom: 60 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  studentName: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    textAlign: 'right',
  },
  metaText: {
    fontSize: 11.5,
    fontFamily: 'IRANSansX',
    textAlign: 'right',
    marginTop: 2,
  },
  scoreLiveBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#059669',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  scoreLiveLabel: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'right',
  },
  scoreLiveBigText: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    color: '#ffffff',
    textAlign: 'right',
  },
  statsSummaryRow: {
    alignItems: 'flex-start',
    gap: 2,
  },
  statPillText: {
    fontSize: 10.5,
    fontFamily: 'IRANSansX',
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    textAlign: 'right',
  },
  sectionDesc: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 8,
  },
  qRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
  },
  qNum: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    textAlign: 'right',
  },
  keySub: {
    fontSize: 9.5,
    fontFamily: 'IRANSansX',
    color: '#059669',
    textAlign: 'right',
  },
  bubblesRow: {
    flex: 1,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: 8,
  },
  bubbleBtn: {
    width: 34,
    height: 24,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    textAlign: 'right',
  },
  switchDesc: {
    fontSize: 10,
    fontFamily: 'IRANSansX',
    color: '#64748b',
    textAlign: 'right',
    marginTop: 2,
  },
  saveBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 14,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 13.5,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default ManualGradingScreen;
