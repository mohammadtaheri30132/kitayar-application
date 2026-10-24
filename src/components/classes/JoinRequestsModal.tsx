import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform
} from 'react-native';
import { showConfirm, showError, showSuccess } from '../feedback';
import {
  X,
  UserCheck,
  UserX,
  Users,
  BadgeCheck,
  AlertTriangle,
  GitMerge,
  UserPlus,
  Phone,
  Calendar,
  FileText,
  Clock,
  ChevronDown,
  Info
} from 'lucide-react-native';
import { COLORS } from '../../theme/colors';
import { api } from '../../api/axiosConfig';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface JoinRequestsModalProps {
  visible: boolean;
  onClose: () => void;
  classroomId: string;
  classroomName: string;
  onRequestsUpdated?: () => void;
}

export const JoinRequestsModal: React.FC<JoinRequestsModalProps> = ({
  visible,
  onClose,
  classroomId,
  classroomName,
  onRequestsUpdated
}) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // States for Smart Match BottomSheet
  const [isMatchSheetVisible, setIsMatchSheetVisible] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<any | null>(null);
  const [matchCandidate, setMatchCandidate] = useState<any | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!classroomId) return;
    setLoading(true);
    try {
      const response = await api.get(`/teacher/classrooms/${classroomId}/join-requests`);
      if (response.data.success) {
        setRequests(response.data.data || []);
      }
    } catch (error) {
      console.warn('Error fetching join requests:', error);
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    if (visible && classroomId) {
      fetchRequests();
    }
  }, [visible, classroomId, fetchRequests]);

  const handlePressAccept = (reqItem: any) => {
    // اگر تشابه اسمی با دانش‌آموز دستی قبلی کشف شده باشد (>= ۷۰٪ یا شامل بودن)
    if (reqItem.similarityMatches && reqItem.similarityMatches.length > 0) {
      setCurrentRequest(reqItem);
      setMatchCandidate(reqItem.similarityMatches[0]);
      setIsMatchSheetVisible(true);
    } else {
      // بدون تشابه -> مستقیماً تایید می‌شود
      confirmDirectAccept(reqItem._id);
    }
  };

  const confirmDirectAccept = async (requestId: string) => {
    setActionLoadingId(requestId);
    try {
      const res = await api.post(`/teacher/classrooms/${classroomId}/join-requests/${requestId}/accept`, {
        action: 'DIRECT'
      });
      if (res.data.success) {
        showSuccess('دانش‌آموز با نشان تیک آبی معتبر به کلاس افزوده شد.', 'تایید شد');
        await fetchRequests();
        if (onRequestsUpdated) onRequestsUpdated();
      }
    } catch (error: any) {
      console.warn(error);
      showError(error.response?.data?.message || 'مشکلی در تایید درخواست پیش آمد.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExecuteMerge = async () => {
    if (!currentRequest || !matchCandidate) return;
    setActionLoadingId(currentRequest._id);
    try {
      const res = await api.post(
        `/teacher/classrooms/${classroomId}/join-requests/${currentRequest._id}/accept`,
        {
          action: 'MERGE',
          targetMembershipId: matchCandidate.membershipId
        }
      );
      if (res.data.success) {
        setIsMatchSheetVisible(false);
        setCurrentRequest(null);
        setMatchCandidate(null);
        showSuccess(
          'اطلاعات دانش‌آموز با پرونده قبلی تطبیق داده شد و نشان تیک آبی به آن اعطا گردید.',
          'تطبیق و ادغام موفق'
        );
        await fetchRequests();
        if (onRequestsUpdated) onRequestsUpdated();
      }
    } catch (error: any) {
      console.warn(error);
      showError(error.response?.data?.message || 'خطا در تطبیق پرونده.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExecuteCreateOther = async () => {
    if (!currentRequest) return;
    const reqId = currentRequest._id;
    setIsMatchSheetVisible(false);
    setCurrentRequest(null);
    setMatchCandidate(null);
    await confirmDirectAccept(reqId);
  };

  const handleReject = (reqItem: any) => {
    const studentName = `${reqItem.firstName || ''} ${reqItem.lastName || ''}`.trim() || reqItem.studentPhone;
    showConfirm({
      title: 'رد درخواست',
      message: `آیا از رد درخواست عضویت «${studentName}» اطمینان دارید؟`,
      confirmText: 'رد درخواست',
      cancelText: 'انصراف',
      isDestructive: true,
      icon: 'delete',
      onConfirm: async () => {
        setActionLoadingId(reqItem._id);
        try {
          const res = await api.post(`/teacher/classrooms/${classroomId}/join-requests/${reqItem._id}/reject`);
          if (res.data.success) {
            showSuccess('درخواست عضویت حذف گردید.');
            await fetchRequests();
            if (onRequestsUpdated) onRequestsUpdated();
          }
        } catch (error: any) {
          console.warn(error);
          showError(error.response?.data?.message || 'مشکلی در رد درخواست پیش آمد.');
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  };

  const toPersianDigits = (str: string | number) => {
    if (!str) return '';
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return str.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
  };

  const renderRequestItem = ({ item }: { item: any }) => {
    const fullName = `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'بدون نام';
    const isProcessing = actionLoadingId === item._id;
    const hasSimilarity = item.hasSimilarity && item.similarityMatches && item.similarityMatches.length > 0;
    const match = hasSimilarity ? item.similarityMatches[0] : null;

    return (
      <View style={styles.requestCard}>
        {/* Card Header with Avatar & Name */}
        <View style={styles.cardHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {item.firstName ? item.firstName.charAt(0) : '؟'}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.studentName}>{fullName}</Text>
              <View style={styles.onlinePendingBadge}>
                <Text style={styles.onlinePendingText}>فرم اینترنتی</Text>
              </View>
            </View>
            <Text style={styles.fatherName}>نام پدر: {item.fatherName || 'ثبت نشده'}</Text>
          </View>
        </View>

        {/* Detailed Fields */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailRow}>
            <Phone size={13} color="#64748b" style={{ marginLeft: 6 }} />
            <Text style={styles.detailLabel}>موبایل دانش‌آموز:</Text>
            <Text style={styles.detailValue}>{item.studentPhone}</Text>
          </View>

          {item.parentPhone ? (
            <View style={styles.detailRow}>
              <Phone size={13} color="#0284c7" style={{ marginLeft: 6 }} />
              <Text style={styles.detailLabel}>شماره والدین:</Text>
              <Text style={styles.detailValue}>{item.parentPhone}</Text>
            </View>
          ) : null}

          {item.birthDate ? (
            <View style={styles.detailRow}>
              <Calendar size={13} color="#64748b" style={{ marginLeft: 6 }} />
              <Text style={styles.detailLabel}>تاریخ تولد:</Text>
              <Text style={styles.detailValue}>{toPersianDigits(item.birthDate)}</Text>
            </View>
          ) : null}

          {item.specialNotes ? (
            <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
              <FileText size={13} color="#64748b" style={{ marginLeft: 6, marginTop: 2 }} />
              <Text style={styles.detailLabel}>یادداشت:</Text>
              <Text style={[styles.detailValue, { flex: 1 }]}>{item.specialNotes}</Text>
            </View>
          ) : null}
        </View>

        {/* Smart Similarity Warning Banner if match detected */}
        {hasSimilarity && match ? (
          <View style={styles.similarityWarningBox}>
            <View style={styles.similarityWarningHeader}>
              <AlertTriangle size={15} color="#d97706" style={{ marginLeft: 6 }} />
              <Text style={styles.similarityWarningTitle}>
                تشابه با دانش‌آموز دستی ({match.percent}٪)
              </Text>
            </View>
            <Text style={styles.similarityWarningText}>
              قبلاً دانش‌آموزی با نام «{match.firstName} {match.lastName}» به صورت دستی وارد کرده‌اید. با زدن دکمه «پذیرفتن» می‌توانید این دو را تطبیق دهید یا به عنوان فرد دیگر ثبت کنید.
            </Text>
          </View>
        ) : null}

        {/* Action Buttons: Reject & Accept */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => handleReject(item)}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <UserX size={16} color="#ef4444" style={{ marginLeft: 6 }} />
            <Text style={styles.rejectBtnText}>رد</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={() => handlePressAccept(item)}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <UserCheck size={16} color="#ffffff" style={{ marginLeft: 6 }} />
                <Text style={styles.acceptBtnText}>
                  {hasSimilarity ? 'بررسی و پذیرفتن' : 'پذیرفتن'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <>
      {/* Main Join Requests Modal */}
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          {/* Backdrop Tap to Close */}
          <TouchableOpacity 
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
          <TouchableOpacity 
            style={{ flex: 1, width: '100%' }}
            activeOpacity={1}
            onPress={onClose}
          />
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerTitleContainer}>
                <View style={styles.headerIconBadge}>
                  <Users size={18} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>درخواست‌های عضویت در کلاس</Text>
                  <Text style={styles.headerSubtitle}>
                    {classroomName} • {toPersianDigits(requests.length)} درخواست در انتظار
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Content List */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>در حال دریافت درخواست‌ها...</Text>
              </View>
            ) : requests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <UserCheck size={52} color="#94a3b8" />
                <Text style={styles.emptyTitle}>هیچ درخواستی در انتظار نیست</Text>
                <Text style={styles.emptySubtitle}>
                  تمامی دانش‌آموزان ثبت‌نامی بررسی و تایید شده‌اند.
                </Text>
              </View>
            ) : (
              <FlatList
                data={requests}
                keyExtractor={(item) => item._id}
                renderItem={renderRequestItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Smart Match Comparison BottomSheet */}
      <Modal
        visible={isMatchSheetVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsMatchSheetVisible(false)}
      >
        <View style={styles.sheetOverlay}>
          {/* Backdrop Tap to Close */}
          <TouchableOpacity 
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsMatchSheetVisible(false)}
          />
          <TouchableOpacity 
            style={{ flex: 1, width: '100%' }}
            activeOpacity={1}
            onPress={() => setIsMatchSheetVisible(false)}
          />
          <View style={styles.sheetContainer}>
            <View style={styles.sheetDragHandle} />

            <View style={styles.sheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <GitMerge size={20} color={COLORS.primary} style={{ marginLeft: 8 }} />
                <Text style={styles.sheetTitle}>بررسی تطبیق دانش‌آموز</Text>
              </View>
              <TouchableOpacity onPress={() => setIsMatchSheetVisible(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
              {/* Match Similarity Badge */}
              {matchCandidate && (
                <View style={styles.matchScoreBadge}>
                  <AlertTriangle size={15} color="#b45309" style={{ marginLeft: 6 }} />
                  <Text style={styles.matchScoreText}>
                    تشابه اسمی {toPersianDigits(matchCandidate.percent)}٪ ({matchCandidate.reason})
                  </Text>
                </View>
              )}

              <Text style={styles.matchIntroText}>
                یک دانش‌آموز با نام و مشخصات مشابه قبلاً به صورت دستی در این کلاس ثبت شده است. آیا این دو نفر یکی هستند؟
              </Text>

              {/* Side-by-side or Stacked Comparison Cards */}
              <View style={styles.comparisonWrapper}>
                {/* 1. Existing Manual Record */}
                <View style={[styles.compareCard, styles.manualCompareCard]}>
                  <View style={styles.compareCardHeader}>
                    <Text style={styles.compareCardTagManual}>پرونده قبلی (ثبت دستی شما)</Text>
                    <View style={styles.noBadgeTag}>
                      <Text style={styles.noBadgeText}>بدون تیک آبی</Text>
                    </View>
                  </View>

                  <Text style={styles.compareName}>
                    {matchCandidate?.firstName} {matchCandidate?.lastName}
                  </Text>
                  <Text style={styles.compareSub}>
                    نام پدر: {matchCandidate?.fatherName || 'ثبت نشده'}
                  </Text>
                  <Text style={styles.comparePhone}>
                    موبایل ثبت شده: {matchCandidate?.studentPhone}
                  </Text>
                  {matchCandidate?.parentPhone ? (
                    <Text style={styles.comparePhone}>
                      تلفن ولی: {matchCandidate?.parentPhone}
                    </Text>
                  ) : null}
                </View>

                {/* 2. Incoming Web Request */}
                <View style={[styles.compareCard, styles.webCompareCard]}>
                  <View style={styles.compareCardHeader}>
                    <Text style={styles.compareCardTagWeb}>درخواست جدید (فرم اینترنتی)</Text>
                    <View style={styles.verifiedPendingTag}>
                      <BadgeCheck size={14} color="#0284c7" style={{ marginLeft: 4 }} />
                      <Text style={styles.verifiedPendingText}>تایید پیامکی</Text>
                    </View>
                  </View>

                  <Text style={styles.compareName}>
                    {currentRequest?.firstName} {currentRequest?.lastName}
                  </Text>
                  <Text style={styles.compareSub}>
                    نام پدر: {currentRequest?.fatherName || 'ثبت نشده'}
                  </Text>
                  <Text style={styles.comparePhone}>
                    موبایل احراز شده: {currentRequest?.studentPhone}
                  </Text>
                  {currentRequest?.parentPhone ? (
                    <Text style={styles.comparePhone}>
                      تلفن اولیا: {currentRequest?.parentPhone}
                    </Text>
                  ) : null}
                  {currentRequest?.birthDate ? (
                    <Text style={styles.compareSub}>
                      تاریخ تولد: {toPersianDigits(currentRequest?.birthDate)}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Decision Explanation */}
              <View style={styles.infoTipBox}>
                <Info size={16} color="#0284c7" style={{ marginLeft: 6, marginTop: 1 }} />
                <Text style={styles.infoTipText}>
                  با انتخاب «تطبیق و ادغام»، شماره موبایل و مشخصات جدید در پرونده دستی قبلی جایگزین شده و نشان تیک آبی معتبر دریافت می‌کند.
                </Text>
              </View>

              {/* Action Buttons in Sheet */}
              <View style={styles.sheetActionsContainer}>
                {/* 1. Merge & Confirm (Same Student) */}
                <TouchableOpacity
                  style={styles.sheetMergeBtn}
                  onPress={handleExecuteMerge}
                  disabled={actionLoadingId !== null}
                  activeOpacity={0.8}
                >
                  <BadgeCheck size={18} color="#ffffff" style={{ marginLeft: 8 }} />
                  <Text style={styles.sheetMergeBtnText}>
                    تطبیق و ادغام با دانش‌آموز قبلی (تایید که این همان است)
                  </Text>
                </TouchableOpacity>

                {/* 2. Register as Another Separate Student */}
                <TouchableOpacity
                  style={styles.sheetOtherBtn}
                  onPress={handleExecuteCreateOther}
                  disabled={actionLoadingId !== null}
                  activeOpacity={0.8}
                >
                  <UserPlus size={18} color={COLORS.primary} style={{ marginLeft: 8 }} />
                  <Text style={styles.sheetOtherBtnText}>
                    ثبت به عنوان دانش‌آموز دیگر (شخص جداگانه)
                  </Text>
                </TouchableOpacity>

                {/* 3. Cancel */}
                <TouchableOpacity
                  style={styles.sheetCancelBtn}
                  onPress={() => setIsMatchSheetVisible(false)}
                >
                  <Text style={styles.sheetCancelBtnText}>انصراف</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: SCREEN_HEIGHT * 0.85,
    paddingTop: 16,
    paddingBottom: 80 + (Platform.OS === 'ios' ? 24 : 12),
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitleContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  headerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'left',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    color: '#64748b',
    marginTop: 2,
    textAlign: 'left',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: 'IRANSansX',
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
    color: '#334155',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    marginBottom: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(37, 99, 235, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentName: {
    fontSize: 15,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'left',
  },
  onlinePendingBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  onlinePendingText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    color: '#2563eb',
    fontWeight: '600',
  },
  fatherName: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    color: '#64748b',
    marginTop: 3,
    textAlign: 'left',
  },
  detailsGrid: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    color: '#64748b',
    marginLeft: 6,
  },
  detailValue: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    color: '#1e293b',
    fontWeight: '600',
  },
  similarityWarningBox: {
    backgroundColor: '#fffbeb',
    borderColor: '#fcd34d',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  similarityWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  similarityWarningTitle: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
    color: '#92400e',
  },
  similarityWarningText: {
    fontSize: 11.5,
    fontFamily: 'IRANSansX',
    color: '#78350f',
    lineHeight: 18,
    textAlign: 'left',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  rejectBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  rejectBtnText: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    fontWeight: '600',
    color: '#ef4444',
  },
  acceptBtn: {
    backgroundColor: '#16a34a',
  },
  acceptBtnText: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
    color: '#ffffff',
  },

  // Sheet Styles
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
    paddingTop: 12,
    paddingBottom: 80 + (Platform.OS === 'ios' ? 24 : 12),
  },
  sheetDragHandle: {
    width: 44,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
    color: '#0f172a',
  },
  sheetContent: {
    padding: 20,
  },
  matchScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  matchScoreText: {
    fontSize: 12.5,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
    color: '#92400e',
  },
  matchIntroText: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    color: '#475569',
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'left',
  },
  comparisonWrapper: {
    gap: 12,
    marginBottom: 16,
  },
  compareCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
  },
  manualCompareCard: {
    backgroundColor: '#fafaf9',
    borderColor: '#e7e5e4',
  },
  webCompareCard: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  compareCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  compareCardTagManual: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
    color: '#78716c',
  },
  noBadgeTag: {
    backgroundColor: '#e7e5e4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  noBadgeText: {
    fontSize: 10,
    fontFamily: 'IRANSansX',
    color: '#57534e',
    fontWeight: '600',
  },
  compareCardTagWeb: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
    color: '#0369a1',
  },
  verifiedPendingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedPendingText: {
    fontSize: 10,
    fontFamily: 'IRANSansX',
    color: '#0284c7',
    fontWeight: '700',
  },
  compareName: {
    fontSize: 15,
    fontFamily: 'IRANSansX',
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
    textAlign: 'left',
  },
  compareSub: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    color: '#64748b',
    marginBottom: 2,
    textAlign: 'left',
  },
  comparePhone: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'left',
  },
  infoTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 10,
    marginBottom: 20,
  },
  infoTipText: {
    fontSize: 11.5,
    fontFamily: 'IRANSansX',
    color: '#166534',
    flex: 1,
    lineHeight: 18,
    textAlign: 'left',
  },
  sheetActionsContainer: {
    gap: 10,
  },
  sheetMergeBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  sheetMergeBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
  },
  sheetOtherBtn: {
    backgroundColor: '#ffffff',
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOtherBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
  },
  sheetCancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelBtnText: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    color: '#64748b',
  },
});
