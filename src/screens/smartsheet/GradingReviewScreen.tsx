import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { showError, showConfirm } from '../../components/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import {
  ChevronRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Award,
  Eye,
  Check,
  ScanLine,
  X,
  FileCheck2,
  Sparkles,
} from 'lucide-react-native';
import { smartSheetService, LookupSheetResult, OmrScanResult, OmrRecognizedAnswer } from '../../services/smartSheetService';
import { toPersianNumbers } from '../../utils/date/jalaliHelper';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const GradingReviewScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const { sheetDetails, omrResult, imageUri }: { sheetDetails: LookupSheetResult; omrResult: OmrScanResult; imageUri: string } =
    route.params;

  const [answers, setAnswers] = useState<OmrRecognizedAnswer[]>(omrResult.answers || []);
  const [recordInGradebook, setRecordInGradebook] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);

  // Live calculated score based on current answers
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

  const handleOptionChange = (qIndex: number, newOption: number) => {
    setAnswers((prev) => {
      const copy = [...prev];
      const target = copy[qIndex];
      // If tapping same option, toggle to blank (0)
      const selected = target.selectedOption === newOption ? 0 : newOption;
      copy[qIndex] = {
        ...target,
        selectedOption: selected,
        isBlank: selected === 0,
        isMultiple: false,
        isAmbiguous: false,
        confidence: 1.0,
      };
      return copy;
    });
  };

  const handleSaveGrade = async (continueScanningNext = false) => {
    setIsSubmitting(true);
    try {
      const res = await smartSheetService.gradeSheet({
        sheetCode: sheetDetails.sheetCode,
        answers: scoreStats.evaluated,
        gradingMethod: 'AUTOMATIC',
        recordInGradebook,
        customScore: scoreStats.finalScore,
      });

      if (res.success) {
        showConfirm({
          title: 'موفقیت',
          message: `نمره دانش‌آموز ${sheetDetails.studentName} با موفقیت ثبت گردید: ${toPersianNumbers(scoreStats.finalScore)} از ${toPersianNumbers(sheetDetails.maxScore)}`,
          confirmText: continueScanningNext ? 'اسکن برگه بعدی' : 'مشاهده نتایج آزمون',
          cancelText: 'متوجه شدم',
          isDestructive: false,
          type: 'success',
          onConfirm: () => {
            if (continueScanningNext) {
              navigation.replace('SmartSheetScannerScreen', {
                expectedExamId: sheetDetails.examId,
              });
            } else {
              navigation.navigate('SmartSheetHubScreen');
            }
          },
          onCancel: () => {
            navigation.navigate('SmartSheetHubScreen');
          },
        });
      }
    } catch (e: any) {
      showError(e?.response?.data?.message || e?.message || 'مشکلی در ارتباط با سرور رخ داد.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const percentScore = Math.round((scoreStats.finalScore / sheetDetails.maxScore) * 100);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronRight color={colors.text} size={26} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>ارزیابی و بازبینی تصحیح برگه</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ۱. کارت مشخصات دانش‌آموز و آزمون */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.studentCardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.studentNameText, { color: colors.text }]}>{sheetDetails.studentName}</Text>
              <Text style={[styles.studentSubText, { color: colors.textLight }]}>
                کلاس: {sheetDetails.className} • آزمون: {sheetDetails.examTitle}
              </Text>
            </View>
            <View style={styles.sheetCodeBadge}>
              <Text style={styles.sheetCodeBadgeText}>{sheetDetails.sheetCode}</Text>
            </View>
          </View>

          {/* کارت بزرگ نمره نهایی */}
          <View style={styles.scoreHeroBox}>
            <View style={styles.scoreNumberCol}>
              <Text style={styles.scoreHeroLabel}>نمره محاسبه‌شده:</Text>
              <View style={styles.scoreHeroNumbersRow}>
                <Text style={styles.scoreHeroBigText}>{toPersianNumbers(scoreStats.finalScore)}</Text>
                <Text style={styles.scoreHeroMaxText}>/ {toPersianNumbers(sheetDetails.maxScore)}</Text>
              </View>
            </View>

            <View style={styles.scorePercentBadge}>
              <Award size={18} color="#fff" style={{ marginBottom: 2 }} />
              <Text style={styles.scorePercentText}>{toPersianNumbers(percentScore)}٪</Text>
            </View>
          </View>

          {/* آمار تفکیکی پاسخ‌ها */}
          <View style={styles.statsSummaryRow}>
            <View style={[styles.statPill, { backgroundColor: '#dcfce7' }]}>
              <CheckCircle2 size={13} color="#166534" style={{ marginLeft: 4 }} />
              <Text style={[styles.statPillText, { color: '#166534' }]}>
                {toPersianNumbers(scoreStats.correctCount)} درست
              </Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: '#fee2e2' }]}>
              <XCircle size={13} color="#991b1b" style={{ marginLeft: 4 }} />
              <Text style={[styles.statPillText, { color: '#991b1b' }]}>
                {toPersianNumbers(scoreStats.incorrectCount)} نادرست
              </Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: '#f1f5f9' }]}>
              <HelpCircle size={13} color="#475569" style={{ marginLeft: 4 }} />
              <Text style={[styles.statPillText, { color: '#475569' }]}>
                {toPersianNumbers(scoreStats.unansweredCount)} سفید
              </Text>
            </View>
            {scoreStats.ambiguousCount > 0 && (
              <View style={[styles.statPill, { backgroundColor: '#fef3c7' }]}>
                <AlertTriangle size={13} color="#b45309" style={{ marginLeft: 4 }} />
                <Text style={[styles.statPillText, { color: '#b45309' }]}>
                  {toPersianNumbers(scoreStats.ambiguousCount)} نیازمند بررسی
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ۲. پیش‌نمایش تصویر تراز شده و نشانه‌گذاری شده با OpenCV */}
        {omrResult.annotatedImageUri ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.imagePreviewHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>پیش‌نمایش تصویر اسکن‌شده برگه</Text>
              <TouchableOpacity
                style={styles.zoomButton}
                onPress={() => setShowImageZoom(true)}
                activeOpacity={0.7}
              >
                <Eye size={14} color="#4f46e5" style={{ marginLeft: 4 }} />
                <Text style={styles.zoomButtonText}>مشاهده بزرگ</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setShowImageZoom(true)} activeOpacity={0.9}>
              <Image source={{ uri: omrResult.annotatedImageUri }} style={styles.annotatedThumbnail} />
              <Text style={styles.imageHintText}>
                گزینه‌های سبز: علامت شناسایی‌شده | قرمز: چندگزینه‌ای | نارنجی: خط‌خوردگی/مشکوک
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ۳. جدول بازبینی و تصحیح دستی سوالات */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            بازبینی پاسخ‌های شناسایی‌شده (امکان ویرایش دستی)
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textLight }]}>
            در صورت نیاز می‌توانید گزینه صحیح یا علامت زده شده دانش‌آموز را با لمس دایره‌ها تغییر دهید:
          </Text>

          <View style={styles.questionsGrid}>
            {scoreStats.evaluated.map((qItem, idx) => {
              const qNum = qItem.questionNumber;
              const correctKey = sheetDetails.answerKey[qNum - 1];
              const isCorrect = qItem.isCorrect;
              const isBlank = qItem.isBlank;
              const isAlphabetic = (sheetDetails.optionLabelType || omrResult.optionLabelType) === 'ALPHABETIC';
              const OPTION_LETTERS = ['الف', 'ب', 'ج', 'د', 'هـ'];

              return (
                <View
                  key={qNum}
                  style={[
                    styles.questionRow,
                    {
                      borderBottomColor: colors.border,
                      backgroundColor: qItem.isAmbiguous ? '#fffbeb' : 'transparent',
                    },
                  ]}
                >
                  <View style={styles.questionNumCol}>
                    <Text style={[styles.qNumText, { color: colors.text }]}>
                      سوال {toPersianNumbers(qNum)}:
                    </Text>
                    {correctKey ? (
                      <Text style={styles.keySubText}>
                        کلید: {isAlphabetic ? OPTION_LETTERS[correctKey - 1] || toPersianNumbers(correctKey) : toPersianNumbers(correctKey)}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.optionsRow}>
                    {Array.from({ length: sheetDetails.optionsPerQuestion }).map((_, optIdx) => {
                      const optNum = optIdx + 1;
                      const isMarked = qItem.selectedOption === optNum;
                      const isThisKey = correctKey === optNum;
                      const optLabel = isAlphabetic
                        ? OPTION_LETTERS[optIdx] || toPersianNumbers(optNum)
                        : toPersianNumbers(optNum);

                      let bubbleBg = '#f8fafc';
                      let bubbleBorder = colors.border;
                      let textColor = colors.text;

                      if (isMarked) {
                        if (isThisKey) {
                          bubbleBg = '#16a34a';
                          bubbleBorder = '#16a34a';
                          textColor = '#fff';
                        } else {
                          bubbleBg = '#dc2626';
                          bubbleBorder = '#dc2626';
                          textColor = '#fff';
                        }
                      } else if (isThisKey) {
                        bubbleBorder = '#16a34a';
                        bubbleBg = '#f0fdf4';
                        textColor = '#16a34a';
                      }

                      return (
                        <TouchableOpacity
                          key={optNum}
                          style={[
                            styles.reviewBubbleBtn,
                            { backgroundColor: bubbleBg, borderColor: bubbleBorder },
                          ]}
                          onPress={() => handleOptionChange(idx, optNum)}
                        >
                          <Text style={[styles.reviewBubbleText, { color: textColor }]}>
                            {optLabel}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.statusCol}>
                    {isBlank ? (
                      <Text style={styles.statusBlankText}>سفید</Text>
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
        </View>

        {/* ۴. کلید ثبت در کارنامه کلاسی */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.gradebookSwitchRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={[styles.switchTitle, { color: colors.text }]}>
                ثبت در کارنامه و پروفایل کلاسی دانش‌آموز
              </Text>
              <Text style={styles.switchDesc}>
                نمره این آزمون در کارنامه مستمر و پرونده این دانش‌آموز در کیتایار ثبت خواهد شد.
              </Text>
            </View>
            <Switch
              value={recordInGradebook}
              onValueChange={setRecordInGradebook}
              trackColor={{ false: '#cbd5e1', true: '#c7d2fe' }}
              thumbColor={recordInGradebook ? '#4f46e5' : '#f1f5f9'}
            />
          </View>
        </View>

        {/* دکمه‌های اقدام نهایی */}
        <View style={styles.submitActionsContainer}>
          {isSubmitting ? (
            <ActivityIndicator size="large" color="#4f46e5" style={{ padding: 16 }} />
          ) : (
            <>
              {/* تایید و ثبت نهایی */}
              <TouchableOpacity
                style={styles.confirmSubmitBtn}
                onPress={() => handleSaveGrade(false)}
                activeOpacity={0.85}
              >
                <Check size={18} color="#fff" style={{ marginLeft: 6 }} />
                <Text style={styles.confirmSubmitBtnText}>تایید و ذخیره نمره در سامانه</Text>
              </TouchableOpacity>

              {/* ذخیره و اسکن برگه بعدی */}
              <TouchableOpacity
                style={styles.saveAndNextBtn}
                onPress={() => handleSaveGrade(true)}
                activeOpacity={0.85}
              >
                <ScanLine size={18} color="#4f46e5" style={{ marginLeft: 6 }} />
                <Text style={styles.saveAndNextBtnText}>ذخیره و اسکن برگه بعدی</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* مودال بزرگ‌نمایی تصویر تراز شده */}
      <Modal visible={showImageZoom} transparent animationType="fade" onRequestClose={() => setShowImageZoom(false)}>
        <View style={styles.zoomBackdrop}>
          <TouchableOpacity style={styles.closeZoomBtn} onPress={() => setShowImageZoom(false)}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
          {omrResult.annotatedImageUri && (
            <Image
              source={{ uri: omrResult.annotatedImageUri }}
              style={styles.fullZoomImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
  cardTitle: {
    fontSize: 13.5,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    textAlign: 'right',
  },
  cardSubtitle: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 16,
  },
  studentCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  studentNameText: {
    fontSize: 15.5,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    textAlign: 'right',
  },
  studentSubText: {
    fontSize: 11.5,
    fontFamily: 'IRANSansX',
    textAlign: 'right',
    marginTop: 2,
  },
  sheetCodeBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sheetCodeBadgeText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    color: '#6d28d9',
  },
  scoreHeroBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  scoreNumberCol: {
    flex: 1,
  },
  scoreHeroLabel: {
    fontSize: 11.5,
    fontFamily: 'IRANSansX',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'right',
  },
  scoreHeroNumbersRow: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    marginTop: 2,
  },
  scoreHeroBigText: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    color: '#ffffff',
  },
  scoreHeroMaxText: {
    fontSize: 14,
    fontFamily: 'IRANSansX',
    color: 'rgba(255, 255, 255, 0.75)',
    marginRight: 6,
  },
  scorePercentBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  scorePercentText: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    color: '#ffffff',
  },
  statsSummaryRow: {
    flexDirection: 'row-reverse',
    gap: 6,
    flexWrap: 'wrap',
  },
  statPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statPillText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    fontWeight: '600',
  },
  imagePreviewHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  zoomButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  zoomButtonText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    color: '#4f46e5',
    fontWeight: 'bold',
  },
  annotatedThumbnail: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  imageHintText: {
    fontSize: 10,
    fontFamily: 'IRANSansX',
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
  },
  questionsGrid: {
    marginTop: 4,
  },
  questionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    paddingHorizontal: 4,
  },
  questionNumCol: {
    width: 65,
  },
  qNumText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  keySubText: {
    fontSize: 9.5,
    fontFamily: 'IRANSansX',
    color: '#059669',
    textAlign: 'right',
  },
  optionsRow: {
    flex: 1,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: 8,
  },
  reviewBubbleBtn: {
    width: 34,
    height: 24,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBubbleText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
  },
  statusCol: {
    width: 40,
    alignItems: 'center',
  },
  statusBlankText: {
    fontSize: 10.5,
    fontFamily: 'IRANSansX',
    color: '#94a3b8',
  },
  gradebookSwitchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTitle: {
    fontSize: 12.5,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  switchDesc: {
    fontSize: 10.5,
    fontFamily: 'IRANSansX',
    color: '#64748b',
    textAlign: 'right',
    marginTop: 2,
    lineHeight: 15,
  },
  submitActionsContainer: {
    gap: 10,
    marginTop: 6,
  },
  confirmSubmitBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 13,
    elevation: 3,
  },
  confirmSubmitBtnText: {
    fontSize: 13.5,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  saveAndNextBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 12,
  },
  saveAndNextBtnText: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  zoomBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeZoomBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  fullZoomImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.85,
  },
});

export default GradingReviewScreen;
