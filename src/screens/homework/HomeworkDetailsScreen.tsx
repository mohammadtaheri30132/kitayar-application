import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Modal,
  Image,
  Switch,
  NativeModules,
  Platform,
  Dimensions,
} from 'react-native';
import { showError, showSuccess, showWarning } from '../../components/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import {
  ChevronRight,
  Edit2,
  Calendar,
  Clock,
  BookOpen,
  Users,
  CheckCircle2,
  XCircle,
  HelpCircle,
  CheckSquare,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Mic,
  Play,
  Pause,
  Award,
  MessageSquare,
  X,
  Eye,
  Check,
  Send,
  Sparkles,
} from 'lucide-react-native';
import { PlanningService, Homework, StudentSubmission } from '../../api/planningService';
import { getHomeworkRemainingDays } from '../../utils/date/homeworkSessionHelper';
import { toPersianNumbers, formatIsoToJalali } from '../../utils/date/jalaliHelper';
import { api } from '../../api/axiosConfig';

const { AudioRecorderModule } = NativeModules;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HomeworkDetailsScreen = ({ route, navigation }: any) => {
  const { colors, isDark } = useTheme();
  const { homeworkId } = route.params;

  const [homework, setHomework] = useState<Homework | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingPhone, setUpdatingPhone] = useState<string | null>(null);
  const [searchStudent, setSearchStudent] = useState('');

  // Review Modal State
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewScore, setReviewScore] = useState('');
  const [recordInGradebook, setRecordInGradebook] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Audio Playback in Review Modal
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voicePosition, setVoicePosition] = useState(0);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const voiceIntervalRef = useRef<any>(null);

  // Zoom image preview modal
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);

  const serverBaseUrl = (api.defaults.baseURL || 'http://192.168.1.128:5001/api').replace(/\/api\/?$/, '');

  const fetchHomework = async () => {
    try {
      const res = await PlanningService.getHomeworkById(homeworkId);
      if (res.success && res.data) {
        setHomework(res.data);
      }
    } catch (e) {
      console.warn('Error fetching homework details:', e);
      showError('دریافت اطلاعات تکلیف با خطا مواجه شد');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHomework();
      return () => {
        stopVoicePlayback();
      };
    }, [homeworkId])
  );

  useEffect(() => {
    return () => {
      stopVoicePlayback();
    };
  }, []);

  const handleStatusChange = async (
    studentPhone: string,
    newStatus: 'DONE' | 'NOT_DONE' | 'PENDING' | 'APPROVED'
  ) => {
    setUpdatingPhone(studentPhone);
    try {
      const res = await PlanningService.updateStudentHomeworkStatus(homeworkId, studentPhone, newStatus);
      if (res.success && res.data) {
        setHomework(res.data);
      }
    } catch (e) {
      showError('ثبت وضعیت با خطا مواجه شد');
    } finally {
      setUpdatingPhone(null);
    }
  };

  // Open the review modal for a specific student submission
  const openReviewModal = (sub: StudentSubmission) => {
    stopVoicePlayback();
    setSelectedSubmission(sub);
    setReviewFeedback(sub.teacherFeedback || sub.note || '');
    setReviewScore(sub.score !== undefined && sub.score !== null ? String(sub.score) : '');
    setRecordInGradebook(sub.recordInGradebook ?? true);
    setVoiceDuration(sub.voiceDuration || 0);
    setVoicePosition(0);
  };

  const closeReviewModal = () => {
    stopVoicePlayback();
    setSelectedSubmission(null);
  };

  // Audio Playback Handlers
  const handleTogglePlayVoice = async (rawUrl: string) => {
    if (!AudioRecorderModule) {
      showWarning('ماژول صوتی در دستگاه شما پشتیبانی نمی‌شود.');
      return;
    }

    if (isPlayingVoice) {
      stopVoicePlayback();
      return;
    }

    try {
      const fullUrl = rawUrl.startsWith('http') ? rawUrl : `${serverBaseUrl}${rawUrl}`;
      await AudioRecorderModule.play(fullUrl);
      setIsPlayingVoice(true);
      setVoicePosition(0);

      voiceIntervalRef.current = setInterval(async () => {
        try {
          const pos = await AudioRecorderModule.getPlaybackPosition();
          const dur = await AudioRecorderModule.getPlaybackDuration();
          if (dur > 0) {
            setVoicePosition(Math.floor(pos / 1000));
            setVoiceDuration(Math.floor(dur / 1000));
          }
          if (pos >= dur && dur > 0) {
            stopVoicePlayback();
          }
        } catch (e) {
          stopVoicePlayback();
        }
      }, 500);
    } catch (err: any) {
      showError(err?.message || 'امکان پخش این پیام صوتی وجود ندارد.');
      stopVoicePlayback();
    }
  };

  const stopVoicePlayback = () => {
    if (voiceIntervalRef.current) {
      clearInterval(voiceIntervalRef.current);
      voiceIntervalRef.current = null;
    }
    if (AudioRecorderModule) {
      AudioRecorderModule.stopPlaying().catch(() => {});
    }
    setIsPlayingVoice(false);
    setVoicePosition(0);
  };

  // Submit Teacher's Review
  const handleReviewSubmit = async (
    targetStatus: 'APPROVED' | 'GRADED' | 'REJECTED'
  ) => {
    if (!selectedSubmission) return;

    let parsedScore: number | undefined = undefined;
    if (targetStatus === 'GRADED') {
      if (reviewScore.trim()) {
        const num = parseFloat(reviewScore.trim().replace(/,/g, '.'));
        if (isNaN(num)) {
          showWarning('لطفاً نمره را به صورت یک عدد معتبر وارد کنید.');
          return;
        }
        parsedScore = num;
      }
    }

    setSubmittingReview(true);
    try {
      const res = await PlanningService.reviewStudentHomework(
        homeworkId,
        selectedSubmission.studentPhone,
        {
          status: targetStatus,
          teacherFeedback: reviewFeedback.trim() || undefined,
          score: parsedScore,
          recordInGradebook: targetStatus === 'GRADED' && parsedScore !== undefined ? recordInGradebook : false,
        }
      );

      if (res.success && res.data) {
        setHomework(res.data);
        closeReviewModal();
        showSuccess(res.message || 'بررسی و نظر شما با موفقیت ثبت و به دانش‌آموز اعلام شد.');
      }
    } catch (error: any) {
      showError(error?.response?.data?.message || 'مشکلی در برقراری ارتباط با سرور رخ داد.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadgeInfo = (status: string, score?: number) => {
    switch (status) {
      case 'SUBMITTED':
        return {
          label: 'پاسخ ارسال شده (جدید)',
          bg: '#ede9fe',
          color: '#6d28d9',
          border: '#c4b5fd',
        };
      case 'GRADED':
        return {
          label: score !== undefined ? `نمره: ${toPersianNumbers(score)}` : 'نمره‌دهی شده',
          bg: '#ecfdf5',
          color: '#047857',
          border: '#a7f3d0',
        };
      case 'APPROVED':
        return {
          label: 'تایید شده (عادی)',
          bg: '#dcfce7',
          color: '#15803d',
          border: '#86efac',
        };
      case 'REJECTED':
        return {
          label: 'نیاز به اصلاح',
          bg: '#fee2e2',
          color: '#b91c1c',
          border: '#fca5a5',
        };
      case 'DONE':
        return {
          label: 'انجام شده',
          bg: '#dcfce7',
          color: '#166534',
          border: '#86efac',
        };
      case 'NOT_DONE':
        return {
          label: 'انجام نشده',
          bg: '#fee2e2',
          color: '#991b1b',
          border: '#fca5a5',
        };
      default:
        return {
          label: 'در انتظار بررسی',
          bg: '#fef3c7',
          color: '#92400e',
          border: '#fde68a',
        };
    }
  };

  if (loading || !homework) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const remaining = getHomeworkRemainingDays(homework.dueDate);
  const submissions = homework.studentSubmissions || [];

  const filteredSubmissions = submissions.filter((s) => {
    if (!searchStudent.trim()) return true;
    const q = searchStudent.toLowerCase();
    return (
      (s.studentName && s.studentName.toLowerCase().includes(q)) ||
      s.studentPhone.includes(q)
    );
  });

  const submittedCount = submissions.filter((s) => s.status === 'SUBMITTED').length;
  const approvedCount = submissions.filter(
    (s) => s.status === 'APPROVED' || s.status === 'GRADED' || s.status === 'DONE'
  ).length;
  const notDoneCount = submissions.filter(
    (s) => s.status === 'NOT_DONE' || s.status === 'REJECTED'
  ).length;
  const pendingCount = submissions.filter((s) => s.status === 'PENDING').length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronRight color={colors.text} size={26} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>جزئیات و بررسی تکلیف</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('CreateHomeworkScreen', { homework })}
          activeOpacity={0.7}
        >
          <Edit2 size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchHomework();
            }}
            colors={[colors.primary]}
          />
        }
      >
        {/* کارت سربرگ و اطلاعات کلی تکلیف */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.surface, borderColor: remaining.isToday ? '#ef4444' : colors.border },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.remainingBadge, { backgroundColor: remaining.badgeBg }]}>
              {remaining.isToday ? (
                <AlertTriangle size={13} color={remaining.badgeColor} style={{ marginLeft: 4 }} />
              ) : (
                <Clock size={13} color={remaining.badgeColor} style={{ marginLeft: 4 }} />
              )}
              <Text style={[styles.remainingBadgeText, { color: remaining.badgeColor }]}>
                {remaining.badgeText}
              </Text>
            </View>

            <View style={styles.subjectRow}>
              <BookOpen size={14} color={colors.primary} style={{ marginLeft: 4 }} />
              <Text style={[styles.subjectText, { color: colors.primary }]}>
                {homework.subject} • {homework.classId?.name || 'کلاس'}
              </Text>
            </View>
          </View>

          <Text style={[styles.mainTitle, { color: colors.text }]}>{homework.title}</Text>

          {homework.description ? (
            <Text style={[styles.description, { color: colors.textLight }]}>{homework.description}</Text>
          ) : null}

          <View style={styles.metaRow}>
            <Calendar size={14} color={colors.textLight} style={{ marginLeft: 4 }} />
            <Text style={[styles.metaText, { color: colors.textLight }]}>
              موعد تحویل: {toPersianNumbers(homework.dueDateJalali || homework.dueDate)}
            </Text>
            <Text style={styles.dotDivider}>•</Text>
            <Users size={14} color={colors.textLight} style={{ marginLeft: 4 }} />
            <Text style={[styles.metaText, { color: colors.textLight }]}>
              {homework.isForAllStudents
                ? `همه دانش‌آموزان (${toPersianNumbers(submissions.length)} نفر)`
                : `${toPersianNumbers(submissions.length)} دانش‌آموز انتخابی`}
            </Text>
          </View>
        </View>

        {/* لیست موارد و تمرین‌های تکلیف */}
        <View style={[styles.sectionBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionTitleRow}>
            <CheckSquare size={16} color={colors.primary} style={{ marginLeft: 6 }} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>موارد و تمرین‌های این تکلیف</Text>
          </View>

          {(homework.items || []).map((it, idx) => (
            <View key={idx} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.itemBullet, { backgroundColor: colors.primary }]} />
              <Text style={[styles.itemText, { color: colors.text }]}>
                {toPersianNumbers(idx + 1)}. {it.title}
              </Text>
            </View>
          ))}
        </View>

        {/* بخش بررسی تکالیف دانش‌آموزان */}
        <View style={styles.submissionsSectionHeader}>
          <Text style={[styles.sectionHeaderTitle, { color: colors.text }]}>
            بررسی وضعیت تکالیف دریافتی دانش‌آموزان
          </Text>

          {/* آمار خلاصه وضعیت‌ها */}
          <View style={styles.statsSummaryRow}>
            {submittedCount > 0 && (
              <View style={[styles.statPill, { backgroundColor: '#ede9fe' }]}>
                <Text style={[styles.statPillText, { color: '#6d28d9' }]}>
                  {toPersianNumbers(submittedCount)} پاسخ جدید
                </Text>
              </View>
            )}
            <View style={[styles.statPill, { backgroundColor: '#dcfce7' }]}>
              <Text style={[styles.statPillText, { color: '#166534' }]}>
                {toPersianNumbers(approvedCount)} تایید شده / انجام شده
              </Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: '#fee2e2' }]}>
              <Text style={[styles.statPillText, { color: '#991b1b' }]}>
                {toPersianNumbers(notDoneCount)} انجام نشده / اصلاح
              </Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: '#fef3c7' }]}>
              <Text style={[styles.statPillText, { color: '#92400e' }]}>
                {toPersianNumbers(pendingCount)} در انتظار
              </Text>
            </View>
          </View>
        </View>

        {/* فیلد جستجوی دانش‌آموز */}
        {submissions.length > 4 && (
          <TextInput
            style={[
              styles.studentSearchInput,
              { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="جستجوی نام یا شماره دانش‌آموز..."
            placeholderTextColor={colors.textLight}
            value={searchStudent}
            onChangeText={setSearchStudent}
          />
        )}

        {/* لیست دانش‌آموزان */}
        {filteredSubmissions.length === 0 ? (
          <View style={styles.emptySubmissionsBox}>
            <Text style={[styles.emptyText, { color: colors.textLight }]}>
              دانش‌آموزی برای این تکلیف یافت نشد.
            </Text>
          </View>
        ) : (
          filteredSubmissions.map((sub, index) => {
            const isUpdating = updatingPhone === sub.studentPhone;
            const badge = getStatusBadgeInfo(sub.status, sub.score);
            const hasSubmittedContent =
              Boolean(sub.studentText?.trim()) ||
              Boolean(sub.voiceUrl) ||
              Boolean(sub.images && sub.images.length > 0);
            const isSubmittedNew = sub.status === 'SUBMITTED';

            return (
              <View
                key={sub.studentPhone}
                style={[
                  styles.studentCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isSubmittedNew
                      ? '#a855f7'
                      : sub.status === 'DONE' || sub.status === 'APPROVED' || sub.status === 'GRADED'
                      ? '#86efac'
                      : sub.status === 'NOT_DONE' || sub.status === 'REJECTED'
                      ? '#fca5a5'
                      : colors.border,
                    borderWidth: isSubmittedNew ? 1.5 : 1,
                  },
                ]}
              >
                {/* هدر کارت دانش‌آموز */}
                <View style={styles.studentCardHeader}>
                  <View style={styles.studentInfoRow}>
                    <Text style={[styles.studentIndex, { color: colors.textLight }]}>
                      {toPersianNumbers(index + 1)}.
                    </Text>
                    <Text style={[styles.studentName, { color: colors.text }]}>
                      {sub.studentName || 'دانش‌آموز'}
                    </Text>
                    <Text style={[styles.studentPhone, { color: colors.textLight }]}>
                      ({sub.studentPhone})
                    </Text>
                  </View>

                  {/* نشان وضعیت فعلی */}
                  <View
                    style={[
                      styles.currentStatusBadge,
                      { backgroundColor: badge.bg, borderColor: badge.border, borderWidth: 1 },
                    ]}
                  >
                    <Text style={[styles.currentStatusBadgeText, { color: badge.color }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                {/* پیوست‌ها و محتوای ارسالی دانش‌آموز (آیکون‌ها) */}
                {hasSubmittedContent && (
                  <View style={styles.attachmentsOverviewRow}>
                    <Text style={styles.attachmentsOverviewLabel}>موارد ارسالی دانش‌آموز:</Text>
                    <View style={styles.attachmentsIconsRow}>
                      {sub.studentText ? (
                        <View style={styles.miniAttachmentBadge}>
                          <FileText size={11} color="#6366f1" style={{ marginLeft: 3 }} />
                          <Text style={styles.miniAttachmentText}>متن پاسخ</Text>
                        </View>
                      ) : null}

                      {sub.voiceUrl ? (
                        <View style={styles.miniAttachmentBadge}>
                          <Mic size={11} color="#059669" style={{ marginLeft: 3 }} />
                          <Text style={styles.miniAttachmentText}>
                            صوت {sub.voiceDuration ? `(${toPersianNumbers(sub.voiceDuration)}ثانیه)` : ''}
                          </Text>
                        </View>
                      ) : null}

                      {sub.images && sub.images.length > 0 ? (
                        <View style={styles.miniAttachmentBadge}>
                          <ImageIcon size={11} color="#ea580c" style={{ marginLeft: 3 }} />
                          <Text style={styles.miniAttachmentText}>
                            {toPersianNumbers(sub.images.length)} تصویر
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                )}

                {/* پیش‌نمایش نظر و نمره ثبت‌شده قبلی معلم */}
                {(sub.teacherFeedback || sub.score !== undefined) && (
                  <View style={styles.previousReviewBox}>
                    <View style={styles.previousReviewHeader}>
                      <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                        <MessageSquare size={12} color="#0284c7" style={{ marginLeft: 4 }} />
                        <Text style={styles.previousReviewTitle}>نظر ثبت‌شده معلم:</Text>
                      </View>
                      {sub.score !== undefined && (
                        <View style={styles.previousScoreBadge}>
                          <Award size={11} color="#047857" style={{ marginLeft: 3 }} />
                          <Text style={styles.previousScoreText}>
                            نمره: {toPersianNumbers(sub.score)}
                          </Text>
                          {sub.recordInGradebook && (
                            <Text style={styles.gradebookActivityText}> (فعالیت کلاسی)</Text>
                          )}
                        </View>
                      )}
                    </View>
                    {sub.teacherFeedback ? (
                      <Text style={styles.previousReviewFeedbackText}>{sub.teacherFeedback}</Text>
                    ) : null}
                  </View>
                )}

                {/* دکمه برجسته: مشاهده پاسخ و بررسی تکلیف */}
                <TouchableOpacity
                  style={[
                    styles.openReviewBtn,
                    isSubmittedNew && styles.openReviewBtnHighlight,
                  ]}
                  onPress={() => openReviewModal(sub)}
                  activeOpacity={0.8}
                >
                  <Eye size={15} color={isSubmittedNew ? '#fff' : colors.primary} style={{ marginLeft: 6 }} />
                  <Text
                    style={[
                      styles.openReviewBtnText,
                      { color: isSubmittedNew ? '#fff' : colors.primary },
                    ]}
                  >
                    {hasSubmittedContent
                      ? 'مشاهده پاسخ و ارزیابی تکلیف'
                      : sub.teacherFeedback || sub.score !== undefined
                      ? 'ویرایش نظر و نمره'
                      : 'بررسی، ثبت نمره و نظر'}
                  </Text>
                  {isSubmittedNew && (
                    <Sparkles size={14} color="#fef08a" style={{ marginRight: 6 }} />
                  )}
                </TouchableOpacity>

                {/* دکمه‌های سریع وضعیت (انجام شده / انجام نشده / تایید) */}
                <View style={styles.statusButtonsRow}>
                  {isUpdating ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ flex: 1, padding: 8 }} />
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.statusBtn,
                          (sub.status === 'DONE' || sub.status === 'APPROVED') && styles.statusBtnDoneActive,
                        ]}
                        onPress={() => handleStatusChange(sub.studentPhone, 'APPROVED')}
                        activeOpacity={0.7}
                      >
                        <CheckCircle2
                          size={14}
                          color={sub.status === 'DONE' || sub.status === 'APPROVED' ? '#fff' : '#166534'}
                          style={{ marginLeft: 4 }}
                        />
                        <Text
                          style={[
                            styles.statusBtnText,
                            { color: sub.status === 'DONE' || sub.status === 'APPROVED' ? '#fff' : '#166534' },
                          ]}
                        >
                          تایید عادی
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.statusBtn,
                          (sub.status === 'NOT_DONE' || sub.status === 'REJECTED') && styles.statusBtnNotDoneActive,
                        ]}
                        onPress={() => handleStatusChange(sub.studentPhone, 'NOT_DONE')}
                        activeOpacity={0.7}
                      >
                        <XCircle
                          size={14}
                          color={sub.status === 'NOT_DONE' || sub.status === 'REJECTED' ? '#fff' : '#991b1b'}
                          style={{ marginLeft: 4 }}
                        />
                        <Text
                          style={[
                            styles.statusBtnText,
                            { color: sub.status === 'NOT_DONE' || sub.status === 'REJECTED' ? '#fff' : '#991b1b' },
                          ]}
                        >
                          انجام نشده
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.statusBtn,
                          sub.status === 'PENDING' && styles.statusBtnPendingActive,
                        ]}
                        onPress={() => handleStatusChange(sub.studentPhone, 'PENDING')}
                        activeOpacity={0.7}
                      >
                        <HelpCircle
                          size={14}
                          color={sub.status === 'PENDING' ? '#fff' : '#92400e'}
                          style={{ marginLeft: 4 }}
                        />
                        <Text
                          style={[
                            styles.statusBtnText,
                            { color: sub.status === 'PENDING' ? '#fff' : '#92400e' },
                          ]}
                        >
                          در انتظار
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ========================================================= */}
      {/* مودال جامع بررسی پاسخ دانش‌آموز و ثبت نظر و نمره معلم      */}
      {/* ========================================================= */}
      <Modal
        visible={Boolean(selectedSubmission)}
        animationType="slide"
        transparent
        onRequestClose={closeReviewModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            {/* سربرگ مودال */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                <View style={styles.modalAvatar}>
                  <Users size={18} color="#6366f1" />
                </View>
                <View style={{ marginRight: 10 }}>
                  <Text style={[styles.modalStudentName, { color: colors.text }]}>
                    {selectedSubmission?.studentName || 'دانش‌آموز'}
                  </Text>
                  <Text style={[styles.modalStudentPhone, { color: colors.textLight }]}>
                    شماره تماس: {selectedSubmission?.studentPhone}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={closeReviewModal}
                activeOpacity={0.7}
              >
                <X size={20} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollBody}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {/* زمان ارسال توسط دانش‌آموز */}
              {selectedSubmission?.submittedAt && (
                <View style={styles.submissionTimeBanner}>
                  <Clock size={13} color="#6d28d9" style={{ marginLeft: 6 }} />
                  <Text style={styles.submissionTimeText}>
                    زمان ارسال پاسخ: {formatIsoToJalali(selectedSubmission.submittedAt, true)}
                  </Text>
                </View>
              )}

              {/* ---------------------------------------------------- */}
              {/* بخش ۱: پاسخ‌های ارسالی دانش‌آموز                      */}
              {/* ---------------------------------------------------- */}
              <View style={styles.reviewSectionBox}>
                <Text style={[styles.reviewSectionTitle, { color: colors.text }]}>
                  پاسخ و فایل‌های ارسالی دانش‌آموز:
                </Text>

                {/* ۱. متن ارسالی */}
                {selectedSubmission?.studentText ? (
                  <View style={styles.studentResponseCard}>
                    <View style={styles.responseSubheader}>
                      <FileText size={14} color="#6366f1" style={{ marginLeft: 4 }} />
                      <Text style={styles.responseSubheaderTitle}>متن ارسالی دانش‌آموز:</Text>
                    </View>
                    <Text style={[styles.studentResponseText, { color: colors.text }]}>
                      {selectedSubmission.studentText}
                    </Text>
                  </View>
                ) : null}

                {/* ۲. صوت ارسالی */}
                {selectedSubmission?.voiceUrl ? (
                  <View style={styles.studentResponseCard}>
                    <View style={styles.responseSubheader}>
                      <Mic size={14} color="#059669" style={{ marginLeft: 4 }} />
                      <Text style={styles.responseSubheaderTitle}>پیام صوتی ارسالی دانش‌آموز:</Text>
                    </View>

                    <View style={styles.voicePlayerBox}>
                      <TouchableOpacity
                        style={[
                          styles.voicePlayBtn,
                          isPlayingVoice && { backgroundColor: '#dc2626' },
                        ]}
                        onPress={() => handleTogglePlayVoice(selectedSubmission.voiceUrl!)}
                        activeOpacity={0.8}
                      >
                        {isPlayingVoice ? (
                          <Pause size={18} color="#fff" />
                        ) : (
                          <Play size={18} color="#fff" />
                        )}
                      </TouchableOpacity>

                      <View style={styles.voiceProgressContainer}>
                        <View style={styles.voiceProgressTrack}>
                          <View
                            style={[
                              styles.voiceProgressBar,
                              {
                                width: `${
                                  voiceDuration > 0
                                    ? Math.min(100, (voicePosition / voiceDuration) * 100)
                                    : 0
                                }%`,
                              },
                            ]}
                          />
                        </View>
                        <View style={styles.voiceTimeRow}>
                          <Text style={styles.voiceTimeText}>
                            {toPersianNumbers(voicePosition)}s
                          </Text>
                          <Text style={styles.voiceTimeText}>
                            {toPersianNumbers(voiceDuration || selectedSubmission.voiceDuration || 0)}s
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ) : null}

                {/* ۳. عکس‌های ارسالی */}
                {selectedSubmission?.images && selectedSubmission.images.length > 0 ? (
                  <View style={styles.studentResponseCard}>
                    <View style={styles.responseSubheader}>
                      <ImageIcon size={14} color="#ea580c" style={{ marginLeft: 4 }} />
                      <Text style={styles.responseSubheaderTitle}>
                        تصاویر ارسالی دانش‌آموز ({toPersianNumbers(selectedSubmission.images.length)} تصویر):
                      </Text>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.imagesScrollRow}
                    >
                      {selectedSubmission.images.map((imgUri, idx) => {
                        const fullUri = imgUri.startsWith('http')
                          ? imgUri
                          : `${serverBaseUrl}${imgUri}`;
                        return (
                          <TouchableOpacity
                            key={idx}
                            style={styles.imageThumbnailWrapper}
                            onPress={() => setPreviewZoomImage(fullUri)}
                            activeOpacity={0.8}
                          >
                            <Image source={{ uri: fullUri }} style={styles.imageThumbnail} />
                            <View style={styles.zoomIconOverlay}>
                              <Eye size={12} color="#fff" />
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                ) : null}

                {/* عدم ارسال محتوا */}
                {!selectedSubmission?.studentText &&
                  !selectedSubmission?.voiceUrl &&
                  (!selectedSubmission?.images || selectedSubmission.images.length === 0) && (
                    <View style={styles.noSubmissionBox}>
                      <HelpCircle size={22} color="#94a3b8" style={{ marginBottom: 6 }} />
                      <Text style={styles.noSubmissionText}>
                        هنوز متنی، تصویری یا فایل صوتی توسط دانش‌آموز ثبت نشده است.
                      </Text>
                      <Text style={styles.noSubmissionSubtext}>
                        می‌توانید وضعیت تکلیف را به صورت دستی تایید یا ارزیابی نمایید.
                      </Text>
                    </View>
                  )}
              </View>

              {/* ---------------------------------------------------- */}
              {/* بخش ۲: فرم ارزیابی، نظر و نمره معلم                   */}
              {/* ---------------------------------------------------- */}
              <View style={[styles.teacherEvaluationSection, { borderColor: colors.border }]}>
                <View style={styles.evaluationHeaderRow}>
                  <Award size={16} color="#6366f1" style={{ marginLeft: 6 }} />
                  <Text style={[styles.evaluationHeaderTitle, { color: colors.text }]}>
                    ارزیابی و بازخورد معلم
                  </Text>
                </View>

                {/* فیلد نظر / بازخورد معلم */}
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  نظر و بازخورد برای دانش‌آموز (اختیاری):
                </Text>
                <TextInput
                  style={[
                    styles.feedbackInput,
                    {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="توضیحات، نکات اصلاحی یا پیام تشویق معلم را بنویسید..."
                  placeholderTextColor={colors.textLight}
                  multiline
                  numberOfLines={3}
                  value={reviewFeedback}
                  onChangeText={setReviewFeedback}
                />

                {/* فیلد نمره تکلیف */}
                <View style={styles.scoreRowContainer}>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      نمره تکلیف (اختیاری):
                    </Text>
                    <TextInput
                      style={[
                        styles.scoreInput,
                        {
                          backgroundColor: colors.background,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                      placeholder="مثلاً ۲۰ یا ۱۸.۵"
                      placeholderTextColor={colors.textLight}
                      keyboardType="decimal-pad"
                      value={reviewScore}
                      onChangeText={setReviewScore}
                    />
                  </View>

                  <View style={styles.gradebookToggleBox}>
                    <View style={styles.gradebookToggleTextWrapper}>
                      <Text style={[styles.gradebookToggleTitle, { color: colors.text }]}>
                        ثبت در کارنامه
                      </Text>
                      <Text style={styles.gradebookToggleDesc}>
                        به عنوان فعالیت کلاسی در کارنامه دانش‌آموز
                      </Text>
                    </View>
                    <Switch
                      value={recordInGradebook}
                      onValueChange={setRecordInGradebook}
                      trackColor={{ false: '#cbd5e1', true: '#c7d2fe' }}
                      thumbColor={recordInGradebook ? '#6366f1' : '#f1f5f9'}
                    />
                  </View>
                </View>

                {/* دکمه‌های ۳ گانه ارزیابی معلم */}
                <View style={styles.evaluationActionsContainer}>
                  {submittingReview ? (
                    <ActivityIndicator size="small" color="#6366f1" style={{ padding: 12 }} />
                  ) : (
                    <>
                      {/* دکمه ۱: تایید عادی بدون نمره */}
                      <TouchableOpacity
                        style={styles.approveNormalBtn}
                        onPress={() => handleReviewSubmit('APPROVED')}
                        activeOpacity={0.8}
                      >
                        <Check size={16} color="#15803d" style={{ marginLeft: 6 }} />
                        <Text style={styles.approveNormalBtnText}>تایید عادی (بدون نمره)</Text>
                      </TouchableOpacity>

                      {/* دکمه ۲: ثبت نمره و نظر (فعالیت کلاسی) */}
                      <TouchableOpacity
                        style={styles.gradeAndFeedbackBtn}
                        onPress={() => handleReviewSubmit('GRADED')}
                        activeOpacity={0.8}
                      >
                        <Award size={16} color="#fff" style={{ marginLeft: 6 }} />
                        <Text style={styles.gradeAndFeedbackBtnText}>ثبت نمره و ارزیابی</Text>
                      </TouchableOpacity>

                      {/* دکمه ۳: نیاز به اصلاح */}
                      <TouchableOpacity
                        style={styles.rejectNeedsFixBtn}
                        onPress={() => handleReviewSubmit('REJECTED')}
                        activeOpacity={0.8}
                      >
                        <X size={15} color="#b91c1c" style={{ marginLeft: 6 }} />
                        <Text style={styles.rejectNeedsFixBtnText}>نیاز به اصلاح دانش‌آموز</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* مودال بزرگ‌نمایی تمام‌صفحه تصویر                            */}
      {/* ========================================================= */}
      <Modal
        visible={Boolean(previewZoomImage)}
        animationType="fade"
        transparent
        onRequestClose={() => setPreviewZoomImage(null)}
      >
        <View style={styles.zoomBackdrop}>
          <TouchableOpacity
            style={styles.closeZoomBtn}
            onPress={() => setPreviewZoomImage(null)}
            activeOpacity={0.8}
          >
            <X size={24} color="#fff" />
          </TouchableOpacity>
          {previewZoomImage && (
            <Image
              source={{ uri: previewZoomImage }}
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
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: 'bold', fontFamily: 'IRANSansX' },
  editBtn: { padding: 4 },
  content: { padding: 16, paddingBottom: 60 },
  infoCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  subjectRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  subjectText: {
    fontSize: 12.5,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
  },
  remainingBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  remainingBadgeText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
  },
  mainTitle: {
    fontSize: 16.5,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    textAlign: 'right',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    lineHeight: 20,
    textAlign: 'right',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 6,
  },
  metaText: {
    fontSize: 11.5,
    fontFamily: 'IRANSansX',
  },
  dotDivider: {
    marginHorizontal: 8,
    color: '#94a3b8',
  },
  sectionBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },
  itemRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
  },
  itemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 8,
  },
  itemText: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    flex: 1,
    textAlign: 'right',
  },
  submissionsSectionHeader: {
    marginTop: 8,
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 14.5,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    textAlign: 'right',
    marginBottom: 8,
  },
  statsSummaryRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  statPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statPillText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    fontWeight: '600',
  },
  studentSearchInput: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: 'IRANSansX',
    fontSize: 12.5,
    textAlign: 'right',
    marginBottom: 10,
  },
  studentCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  studentCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  studentInfoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  studentIndex: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    marginLeft: 4,
  },
  studentName: {
    fontSize: 13.5,
    fontWeight: '700',
    fontFamily: 'IRANSansX',
    marginLeft: 6,
  },
  studentPhone: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
  },
  currentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  currentStatusBadgeText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
  },
  attachmentsOverviewRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  attachmentsOverviewLabel: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    color: '#64748b',
    marginLeft: 6,
  },
  attachmentsIconsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  miniAttachmentBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  miniAttachmentText: {
    fontSize: 10,
    fontFamily: 'IRANSansX',
    color: '#334155',
  },
  previousReviewBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  previousReviewHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  previousReviewTitle: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
    color: '#0369a1',
  },
  previousScoreBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  previousScoreText: {
    fontSize: 10.5,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
    color: '#166534',
  },
  gradebookActivityText: {
    fontSize: 9.5,
    fontFamily: 'IRANSansX',
    color: '#059669',
  },
  previousReviewFeedbackText: {
    fontSize: 11.5,
    fontFamily: 'IRANSansX',
    color: '#334155',
    lineHeight: 18,
    textAlign: 'right',
  },
  openReviewBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  openReviewBtnHighlight: {
    backgroundColor: '#7c3aed',
    borderColor: '#6d28d9',
  },
  openReviewBtnText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
  },
  statusButtonsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  statusBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  statusBtnDoneActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  statusBtnNotDoneActive: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  statusBtnPendingActive: {
    backgroundColor: '#d97706',
    borderColor: '#d97706',
  },
  statusBtnText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    fontWeight: '600',
  },
  emptySubmissionsBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.9,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalStudentName: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    textAlign: 'right',
  },
  modalStudentPhone: {
    fontSize: 11.5,
    fontFamily: 'IRANSansX',
    textAlign: 'right',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  modalScrollBody: {
    marginTop: 10,
  },
  submissionTimeBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  submissionTimeText: {
    fontSize: 11.5,
    fontFamily: 'IRANSansX',
    color: '#6d28d9',
  },
  reviewSectionBox: {
    marginBottom: 14,
  },
  reviewSectionTitle: {
    fontSize: 13.5,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    textAlign: 'right',
    marginBottom: 8,
  },
  studentResponseCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 10,
  },
  responseSubheader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 6,
  },
  responseSubheaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'IRANSansX',
    color: '#475569',
  },
  studentResponseText: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    lineHeight: 22,
    textAlign: 'right',
  },
  voicePlayerBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  voicePlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  voiceProgressContainer: {
    flex: 1,
  },
  voiceProgressTrack: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  voiceProgressBar: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  voiceTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  voiceTimeText: {
    fontSize: 10,
    fontFamily: 'IRANSansX',
    color: '#64748b',
  },
  imagesScrollRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingVertical: 4,
  },
  imageThumbnailWrapper: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
  },
  zoomIconOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 3,
  },
  noSubmissionBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSubmissionText: {
    fontSize: 12.5,
    fontFamily: 'IRANSansX',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 4,
  },
  noSubmissionSubtext: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    color: '#94a3b8',
    textAlign: 'center',
  },
  teacherEvaluationSection: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 6,
  },
  evaluationHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 10,
  },
  evaluationHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 6,
  },
  feedbackInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    fontFamily: 'IRANSansX',
    fontSize: 12.5,
    textAlign: 'right',
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  scoreRowContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 14,
  },
  scoreInput: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: 'IRANSansX',
    fontSize: 13,
    textAlign: 'center',
  },
  gradebookToggleBox: {
    flex: 1.3,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  gradebookToggleTextWrapper: {
    flex: 1,
    marginRight: 6,
  },
  gradebookToggleTitle: {
    fontSize: 11.5,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
    textAlign: 'right',
  },
  gradebookToggleDesc: {
    fontSize: 9.5,
    fontFamily: 'IRANSansX',
    color: '#64748b',
    textAlign: 'right',
    marginTop: 2,
  },
  evaluationActionsContainer: {
    gap: 8,
    marginTop: 6,
  },
  approveNormalBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 10,
    paddingVertical: 11,
  },
  approveNormalBtnText: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
    color: '#15803d',
  },
  gradeAndFeedbackBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 12,
  },
  gradeAndFeedbackBtnText: {
    fontSize: 13.5,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  rejectNeedsFixBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 10,
    paddingVertical: 10,
  },
  rejectNeedsFixBtnText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
    color: '#b91c1c',
  },
  zoomBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeZoomBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  fullZoomImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
});

export default HomeworkDetailsScreen;
