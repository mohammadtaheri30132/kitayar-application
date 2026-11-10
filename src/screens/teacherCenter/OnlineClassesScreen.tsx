import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Linking,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/axiosConfig';
import { showSuccess, showError, showWarning } from '../../components/feedback';
import { FONT_FAMILY } from '../../theme/typography';
import { formatPersianDate, toPersianDigits } from '../../utils/persianDate';
import {
  ChevronRight,
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  ExternalLink,
  Settings,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  BookOpen,
  DollarSign,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react-native';

export const OnlineClassesScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'upcoming' | 'history'>('pending');

  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [historyBookings, setHistoryBookings] = useState<any[]>([]);

  // Action states
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Rejection modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingBookingId, setRejectingBookingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchBookings = async () => {
    try {
      const [pendingRes, upcomingRes, historyRes] = await Promise.allSettled([
        api.get('/teacher/center/class-requests?tab=pending'),
        api.get('/teacher/center/class-requests?tab=upcoming'),
        api.get('/teacher/center/class-requests?tab=history'),
      ]);

      if (pendingRes.status === 'fulfilled' && pendingRes.value.data?.success) {
        setPendingBookings(pendingRes.value.data.data || []);
      }
      if (upcomingRes.status === 'fulfilled' && upcomingRes.value.data?.success) {
        setUpcomingBookings(upcomingRes.value.data.data || []);
      }
      if (historyRes.status === 'fulfilled' && historyRes.value.data?.success) {
        setHistoryBookings(historyRes.value.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching teacher class bookings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleAcceptRequest = async (id: string) => {
    try {
      setProcessingId(id);
      const res = await api.post(`/teacher/center/class-requests/${id}/accept`);
      if (res.data?.success) {
        showSuccess('کلاس با موفقیت تایید شد و لینک جلسه فعال گردید.');
        fetchBookings();
        setActiveTab('upcoming');
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'خطا در تایید کلاس');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (id: string) => {
    setRejectingBookingId(id);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingBookingId) return;

    try {
      setProcessingId(rejectingBookingId);
      const res = await api.post(`/teacher/center/class-requests/${rejectingBookingId}/reject`, {
        reason: rejectReason.trim() || 'عدم امکان برگزاری در زمان درخواستی',
      });

      if (res.data?.success) {
        showSuccess('درخواست کلاس رد شد و وجه آزمایشی به دانش‌آموز بازگردانده شد.');
        setRejectModalVisible(false);
        setRejectingBookingId(null);
        fetchBookings();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'خطا در رد درخواست');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCompleteClass = (id: string, topic: string) => {
    Alert.alert(
      'پایان کلاس و تسویه حساب',
      `آیا از پایان یافتن کلاس «${topic}» اطمینان دارید؟ با تایید، درآمد کلاس به کیف پول شما واریز خواهد شد.`,
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'بله، پایان کلاس',
          onPress: async () => {
            try {
              setProcessingId(id);
              const res = await api.post(`/teacher/center/class-requests/${id}/complete`);
              if (res.data?.success) {
                showSuccess('کلاس پایان یافت و درآمد به کیف پول شما اضافه شد.');
                fetchBookings();
                setActiveTab('history');
              }
            } catch (err: any) {
              showError(err.response?.data?.message || 'خطا در پایان کلاس');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleJoinClass = (item: any) => {
    navigation.navigate('LiveClassroomScreen', {
      sessionId: item._id,
      bookingCode: item.bookingCode,
      title: item.topic || item.subjectName || 'کلاس آنلاین رفع اشکال',
    });
  };

  const formatScheduledDate = (isoString: string) => {
    return formatPersianDate(isoString);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'paid_pending_teacher':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
            <Clock size={12} color="#b45309" />
            <Text style={[styles.statusBadgeText, { color: '#b45309' }]}>در انتظار تایید شما</Text>
          </View>
        );
      case 'confirmed':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' }]}>
            <CheckCircle2 size={12} color="#15803d" />
            <Text style={[styles.statusBadgeText, { color: '#15803d' }]}>تایید شده / آماده ورود</Text>
          </View>
        );
      case 'completed':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
            <ShieldCheck size={12} color="#1d4ed8" />
            <Text style={[styles.statusBadgeText, { color: '#1d4ed8' }]}>برگزار شد و تسویه شد</Text>
          </View>
        );
      case 'rejected':
      case 'refunded':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#fee2e2', borderColor: '#fecaca' }]}>
            <XCircle size={12} color="#b91c1c" />
            <Text style={[styles.statusBadgeText, { color: '#b91c1c' }]}>رد شده / عودت وجه</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }]}>
            <Text style={[styles.statusBadgeText, { color: '#475569' }]}>{status}</Text>
          </View>
        );
    }
  };

  const currentList =
    activeTab === 'pending'
      ? pendingBookings
      : activeTab === 'upcoming'
      ? upcomingBookings
      : historyBookings;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronRight size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>مدیریت کلاس‌های آنلاین</Text>
        <TouchableOpacity
          style={[styles.settingsBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
          onPress={() => navigation.navigate('OnlineClassSettingsScreen')}
          activeOpacity={0.8}
        >
          <Settings size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Segmented Tabs */}
      <View style={[styles.tabsRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'history' && [styles.tabBtnActive, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, { color: activeTab === 'history' ? colors.primary : colors.textLight }]}>
            تاریخچه ({historyBookings.length.toLocaleString('fa-IR')})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'upcoming' && [styles.tabBtnActive, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('upcoming')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, { color: activeTab === 'upcoming' ? colors.primary : colors.textLight }]}>
            کلاس‌های آینده ({upcomingBookings.length.toLocaleString('fa-IR')})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'pending' && [styles.tabBtnActive, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('pending')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, { color: activeTab === 'pending' ? colors.primary : colors.textLight }]}>
            درخواست‌های جدید ({pendingBookings.length.toLocaleString('fa-IR')})
          </Text>
          {pendingBookings.length > 0 && <View style={styles.tabBadgeDot} />}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textLight }]}>در حال بارگذاری لیست کلاس‌ها...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />}
        >
          {/* Quick Notice Banner if settings can be adjusted */}
          <TouchableOpacity
            style={[styles.settingsNoticeCard, { backgroundColor: isDark ? '#1e293b' : '#eff6ff', borderColor: isDark ? '#334155' : '#bfdbfe' }]}
            onPress={() => navigation.navigate('OnlineClassSettingsScreen')}
            activeOpacity={0.85}
          >
            <ChevronLeft size={18} color="#2563eb" />
            <View style={styles.settingsNoticeTextCol}>
              <Text style={[styles.settingsNoticeTitle, { color: isDark ? '#93c5fd' : '#1e3a8a' }]}>
                تنظیم نرخ و زمان‌بندی جلسات
              </Text>
              <Text style={[styles.settingsNoticeSub, { color: isDark ? '#cbd5e1' : '#3b82f6' }]}>
                تغییر قیمت پایه ۹۰ دقیقه و فعال/غیرفعال کردن مدت‌های مختلف
              </Text>
            </View>
            <Settings size={22} color="#2563eb" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          {currentList.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Video size={48} color={colors.textLight} opacity={0.5} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {activeTab === 'pending'
                  ? 'هیچ درخواست کلاس در انتظار تایید وجود ندارد'
                  : activeTab === 'upcoming'
                  ? 'هیچ کلاس تاییدشده یا در پیش‌رویی ندارید'
                  : 'تاریخچه کلاسی ثبت نشده است'}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textLight }]}>
                {activeTab === 'pending'
                  ? 'به محض اینکه دانش‌آموز کلاسی رزرو کند در این بخش نمایش داده خواهد شد.'
                  : 'کلاس‌های تایید شده در زمان مقرر لینک ورود را فعال خواهند کرد.'}
              </Text>
            </View>
          ) : (
            currentList.map((item) => {
              const dt = formatScheduledDate(item.scheduledAt);
              const isProcessing = processingId === item._id;
              const earnings = item.pricing?.teacherEarnings || 0;
              const studentName = item.studentId?.fullName || 'دانش‌آموز';
              const capacity = item.capacity || 1;

              return (
                <View
                  key={item._id}
                  style={[styles.bookingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  {/* Top Row: Status badge & Booking Code */}
                  <View style={styles.bookingCardHeader}>
                    <Text style={[styles.bookingCode, { color: colors.textLight }]}>
                      کد رزرو: {item.bookingCode}
                    </Text>
                    {renderStatusBadge(item.status)}
                  </View>

                  {/* Student & Subject row */}
                  <View style={styles.studentRow}>
                    <View style={styles.studentInfoCol}>
                      <Text style={[styles.studentName, { color: colors.text }]}>{studentName}</Text>
                      <Text style={[styles.subjectGrade, { color: colors.primary }]}>
                        {item.subjectName} {item.gradeName ? `• ${item.gradeName}` : ''}
                      </Text>
                    </View>
                    <View style={styles.avatarWrap}>
                      {item.studentId?.avatar ? (
                        <Image source={{ uri: item.studentId.avatar }} style={styles.avatarImg} />
                      ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
                          <User size={18} color={colors.primary} />
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Topic & Notes */}
                  <View style={[styles.topicBox, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border }]}>
                    <Text style={[styles.topicTitle, { color: colors.text }]}>
                      موضوع: {item.topic}
                    </Text>
                    {item.description ? (
                      <Text style={[styles.topicDesc, { color: colors.textLight }]} numberOfLines={3}>
                        توضیحات دانش‌آموز: {item.description}
                      </Text>
                    ) : null}
                  </View>

                  {/* Metadata Chips: Date, Time, Duration, Capacity */}
                  <View style={styles.metaRow}>
                    <View style={[styles.metaChip, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                      <Users size={13} color={colors.textLight} />
                      <Text style={[styles.metaChipText, { color: colors.text }]}>
                        {capacity > 1 ? `${capacity.toLocaleString('fa-IR')} نفر (گروهی)` : '۱ نفر (انفرادی)'}
                      </Text>
                    </View>

                    <View style={[styles.metaChip, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                      <Clock size={13} color={colors.textLight} />
                      <Text style={[styles.metaChipText, { color: colors.text }]}>
                        {item.durationMinutes?.toLocaleString('fa-IR')} دقیقه
                      </Text>
                    </View>

                    <View style={[styles.metaChip, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                      <Calendar size={13} color={colors.textLight} />
                      <Text style={[styles.metaChipText, { color: colors.text }]}>
                        {dt.date} - ساعت {dt.time}
                      </Text>
                    </View>
                  </View>

                  {/* Earnings Row */}
                  <View style={[styles.earningsRow, { borderTopColor: colors.border }]}>
                    <Text style={[styles.earningsValue, { color: '#16a34a' }]}>
                      {earnings.toLocaleString('fa-IR')} <Text style={styles.earningsUnit}>تومان</Text>
                    </Text>
                    <Text style={[styles.earningsLabel, { color: colors.textLight }]}>
                      درآمد خالص دبیر (واریز به کیف پول):
                    </Text>
                  </View>

                  {/* Action Buttons depending on Tab */}
                  {activeTab === 'pending' && (
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={[styles.rejectBtn, isProcessing && { opacity: 0.6 }]}
                        onPress={() => openRejectModal(item._id)}
                        disabled={isProcessing}
                        activeOpacity={0.8}
                      >
                        <XCircle size={16} color="#ef4444" style={{ marginLeft: 6 }} />
                        <Text style={styles.rejectBtnText}>رد درخواست</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.acceptBtn, { backgroundColor: '#16a34a' }, isProcessing && { opacity: 0.6 }]}
                        onPress={() => handleAcceptRequest(item._id)}
                        disabled={isProcessing}
                        activeOpacity={0.85}
                      >
                        {isProcessing ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <>
                            <CheckCircle2 size={16} color="#ffffff" style={{ marginLeft: 6 }} />
                            <Text style={styles.acceptBtnText}>تایید و ایجاد جلسه</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {activeTab === 'upcoming' && (
                    <View style={styles.upcomingActionsCol}>
                      <TouchableOpacity
                        style={[styles.joinClassBtn, { backgroundColor: '#2563eb' }]}
                        onPress={() => handleJoinClass(item)}
                        activeOpacity={0.85}
                      >
                        <Video size={18} color="#ffffff" style={{ marginLeft: 8 }} />
                        <Text style={styles.joinClassBtnText}>ورود به کلاس آنلاین</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.completeClassBtn, { borderColor: '#16a34a' }, isProcessing && { opacity: 0.6 }]}
                        onPress={() => handleCompleteClass(item._id, item.topic)}
                        disabled={isProcessing}
                        activeOpacity={0.8}
                      >
                        {isProcessing ? (
                          <ActivityIndicator size="small" color="#16a34a" />
                        ) : (
                          <>
                            <CheckCircle2 size={16} color="#16a34a" style={{ marginLeft: 6 }} />
                            <Text style={[styles.completeClassBtnText, { color: '#16a34a' }]}>
                              پایان کلاس و تسویه حساب
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Reject Reason Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>علت رد درخواست کلاس</Text>
            <Text style={[styles.modalSub, { color: colors.textLight }]}>
              با رد درخواست، وجه پرداختی آزمایشی دانش‌آموز بلافاصله به او بازگردانده می‌شود.
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' },
              ]}
              placeholder="مثال: در این بازه زمانی امکان تدریس ندارم..."
              placeholderTextColor={colors.textLight}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalBtnsRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>انصراف</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmRejectBtn, { backgroundColor: '#ef4444' }]}
                onPress={handleConfirmReject}
              >
                <Text style={styles.modalConfirmRejectText}>تایید رد درخواست</Text>
              </TouchableOpacity>
            </View>
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
    padding: 6,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.bold,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsRow: {
    flexDirection: 'row-reverse',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    position: 'relative',
  },
  tabBtnActive: {},
  tabBtnText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },
  tabBadgeDot: {
    position: 'absolute',
    top: 8,
    right: 12,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ef4444',
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
    gap: 14,
  },
  settingsNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  settingsNoticeTextCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  settingsNoticeTitle: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
    marginBottom: 2,
  },
  settingsNoticeSub: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
    marginTop: 14,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'center',
    lineHeight: 18,
  },
  bookingCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  bookingCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingCode: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.medium,
  },
  statusBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.medium,
  },
  studentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentInfoCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  studentName: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
  },
  subjectGrade: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.medium,
    marginTop: 2,
  },
  topicBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  topicTitle: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
    marginBottom: 4,
  },
  topicDesc: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    lineHeight: 18,
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
  },
  metaChipText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.medium,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  earningsValue: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
  },
  earningsUnit: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
  },
  earningsLabel: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#ef4444',
  },
  rejectBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
  },
  acceptBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  acceptBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
  },
  upcomingActionsCol: {
    gap: 8,
    marginTop: 4,
  },
  joinClassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  joinClassBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
  },
  completeClassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  completeClassBtnText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    lineHeight: 18,
    textAlign: 'right',
    marginBottom: 14,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'right',
    textAlignVertical: 'top',
    height: 80,
    marginBottom: 16,
  },
  modalBtnsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.medium,
  },
  modalConfirmRejectBtn: {
    flex: 1.5,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalConfirmRejectText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
  },
});

export default OnlineClassesScreen;
