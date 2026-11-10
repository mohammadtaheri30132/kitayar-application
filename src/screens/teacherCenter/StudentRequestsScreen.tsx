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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/axiosConfig';
import { showSuccess, showError, showWarning } from '../../components/feedback';
import {
  ChevronRight,
  HelpCircle,
  MessageCircle,
  CheckCircle2,
  Clock,
  User,
  Radio,
  FileText,
  Tag,
  DollarSign,
  ChevronLeft,
} from 'lucide-react-native';

export const StudentRequestsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();

  const [activeTab, setActiveTab] = useState<'broadcast' | 'my_active' | 'history'>('broadcast');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);

  // Answer modal
  const [answerModalVisible, setAnswerModalVisible] = useState(false);
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [answerSummary, setAnswerSummary] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // Claiming loading state
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const response = await api.get(`/teacher/center/requests?tab=${activeTab}`);
      if (response.data?.success) {
        setRequests(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching student requests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchRequests();
  }, [activeTab]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleClaim = async (requestId: string) => {
    try {
      setClaimingId(requestId);
      const response = await api.post(`/teacher/center/requests/${requestId}/claim`);
      if (response.data?.success) {
        showSuccess('سوال با موفقیت به شما اختصاص یافت');
        setActiveTab('my_active');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'خطا در انتخاب سوال';
      showError(msg);
      fetchRequests();
    } finally {
      setClaimingId(null);
    }
  };

  const handleAcceptAndChat = async (reqItem: any) => {
    try {
      const response = await api.post(`/teacher/center/requests/${reqItem._id}/accept`);
      if (response.data?.success) {
        const conversationId = response.data.data?.conversationId;
        navigation.navigate('TeacherChatScreen', {
          conversationId,
          title: reqItem.studentId?.fullName || 'دانش‌آموز',
          questionTitle: reqItem.title,
        });
      }
    } catch (err: any) {
      showError('خطا در آغاز گفتگو');
    }
  };

  const handleOpenAnswerModal = (id: string) => {
    setAnsweringQuestionId(id);
    setAnswerSummary('');
    setAnswerModalVisible(true);
  };

  const handleSubmitAnswer = async () => {
    if (!answeringQuestionId) return;
    try {
      setSubmittingAnswer(true);
      const response = await api.post(`/teacher/center/requests/${answeringQuestionId}/answer`, {
        answerSummary,
      });
      if (response.data?.success) {
        showSuccess('پاسخ سوال ثبت شد و مبلغ به کیف پول شما اضافه گردید');
        setAnswerModalVisible(false);
        fetchRequests();
      }
    } catch (err: any) {
      showError('خطا در ثبت پاسخ سوال');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronRight size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>درخواست‌ها و سوالات دانش‌آموزان</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'broadcast' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('broadcast')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'broadcast' ? colors.primary : colors.textLight,
                fontFamily: activeTab === 'broadcast' ? 'Estedad-FD-Bold' : 'Estedad-FD-Medium',
              },
            ]}
          >
            بانک سوالات عمومی
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'my_active' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('my_active')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'my_active' ? colors.primary : colors.textLight,
                fontFamily: activeTab === 'my_active' ? 'Estedad-FD-Bold' : 'Estedad-FD-Medium',
              },
            ]}
          >
            سوالات در جریان من
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'history' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('history')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'history' ? colors.primary : colors.textLight,
                fontFamily: activeTab === 'history' ? 'Estedad-FD-Bold' : 'Estedad-FD-Medium',
              },
            ]}
          >
            سابقه پاسخ‌ها
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
          }
        >
          {requests.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <HelpCircle size={44} color={colors.textLight} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {activeTab === 'broadcast'
                  ? 'در حال حاضر سوال عمومی جدیدی ثبت نشده است'
                  : activeTab === 'my_active'
                  ? 'شما در حال حاضر سوال در جریانی ندارید'
                  : 'سابقه سوالی یافت نشد'}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textLight }]}>
                {activeTab === 'broadcast'
                  ? 'به محض ثبت سوال توسط دانش‌آموزان، در این بخش نمایش داده می‌شود.'
                  : 'از تب بانک سوالات عمومی، سوالات مورد نظرتان را انتخاب کنید.'}
              </Text>
            </View>
          ) : (
            requests.map((item) => (
              <View
                key={item._id}
                style={[styles.questionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.studentInfo}>
                    <View style={[styles.avatarWrap, { backgroundColor: colors.primary + '15' }]}>
                      <User size={18} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={[styles.studentName, { color: colors.text }]}>
                        {item.studentId?.fullName || 'دانش‌آموز'}
                      </Text>
                      <Text style={[styles.dateText, { color: colors.textLight }]}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('fa-IR') : ''}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.priceBadge,
                      { backgroundColor: item.price > 0 ? '#10B98115' : '#64748B15' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priceBadgeText,
                        { color: item.price > 0 ? '#059669' : colors.textLight },
                      ]}
                    >
                      {item.price > 0 ? `${Number(item.price).toLocaleString()} تومان` : 'رایگان'}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.questionTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.questionDesc, { color: colors.textLight }]} numberOfLines={3}>
                  {item.description}
                </Text>

                {item.attachments && item.attachments.length > 0 && (
                  <View style={styles.attachmentsRow}>
                    <Text style={[styles.attachmentsLabel, { color: colors.primary }]}>
                      📎 شامل {item.attachments.length} پیوست (تصویر / صوت)
                    </Text>
                  </View>
                )}

                {/* Actions depending on Tab */}
                <View style={styles.cardActionsRow}>
                  {activeTab === 'broadcast' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                      onPress={() => handleClaim(item._id)}
                      disabled={claimingId === item._id}
                      activeOpacity={0.85}
                    >
                      {claimingId === item._id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.actionBtnText}>پذیرفتن و پاسخ به این سوال</Text>
                      )}
                    </TouchableOpacity>
                  )}

                  {activeTab === 'my_active' && (
                    <View style={styles.activeActionsWrap}>
                      <TouchableOpacity
                        style={[styles.chatBtn, { backgroundColor: '#10B981' }]}
                        onPress={() => handleAcceptAndChat(item)}
                        activeOpacity={0.85}
                      >
                        <MessageCircle size={16} color="#FFFFFF" />
                        <Text style={styles.chatBtnText}>چت با دانش‌آموز</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.finalizeBtn, { backgroundColor: colors.primary }]}
                        onPress={() => handleOpenAnswerModal(item._id)}
                        activeOpacity={0.85}
                      >
                        <CheckCircle2 size={16} color="#FFFFFF" />
                        <Text style={styles.finalizeBtnText}>ثبت پاسخ نهایی</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {activeTab === 'history' && (
                    <View style={styles.historyStatusRow}>
                      <Text style={[styles.historyStatusText, { color: '#059669' }]}>
                        ✅ پاسخ داده شده
                      </Text>
                      {item.answerSummary ? (
                        <Text style={[styles.answerSummaryText, { color: colors.textLight }]}>
                          خلاصه: {item.answerSummary}
                        </Text>
                      ) : null}
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Answer Modal */}
      <Modal
        visible={answerModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAnswerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>ثبت پاسخ نهایی به سوال</Text>
            <Text style={[styles.modalSub, { color: colors.textLight }]}>
              با تایید این بخش، سوال به وضعیت پاسخ داده شده تغییر می‌یابد و هزینه سوال به کیف پول شما واریز می‌شود.
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
              ]}
              value={answerSummary}
              onChangeText={setAnswerSummary}
              multiline
              placeholder="شرح یا خلاصه پاسخ ارائه‌شده..."
              placeholderTextColor={colors.textLight}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setAnswerModalVisible(false)}
              >
                <Text style={{ color: colors.textLight, fontFamily: 'Estedad-FD-Medium' }}>انصراف</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleSubmitAnswer}
                disabled={submittingAnswer}
              >
                {submittingAnswer ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontFamily: 'Estedad-FD-Bold' }}>ثبت و نهایی‌سازی</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
  headerTitle: { fontSize: 16, fontFamily: 'Estedad-FD-Bold' },
  tabBar: {
    flexDirection: 'row-reverse',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 12 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  contentContainer: { padding: 16, gap: 14 },
  emptyCard: {
    padding: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  emptyTitle: { fontSize: 14, fontFamily: 'Estedad-FD-Bold', textAlign: 'center' },
  emptySub: { fontSize: 12, fontFamily: 'Estedad-FD-Regular', textAlign: 'center' },
  questionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  cardTopRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentName: { fontSize: 13, fontFamily: 'Estedad-FD-Bold', textAlign: 'right' },
  dateText: { fontSize: 10, fontFamily: 'Estedad-FD-Regular', textAlign: 'right' },
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceBadgeText: { fontSize: 11, fontFamily: 'Estedad-FD-Bold' },
  questionTitle: { fontSize: 14, fontFamily: 'Estedad-FD-Bold', textAlign: 'right', marginTop: 4 },
  questionDesc: { fontSize: 12, fontFamily: 'Estedad-FD-Regular', textAlign: 'right', lineHeight: 18 },
  attachmentsRow: {
    paddingVertical: 4,
  },
  attachmentsLabel: { fontSize: 11, fontFamily: 'Estedad-FD-Medium', textAlign: 'right' },
  cardActionsRow: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  actionBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Estedad-FD-Bold',
  },
  activeActionsWrap: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  chatBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  chatBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Estedad-FD-Bold',
  },
  finalizeBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  finalizeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Estedad-FD-Bold',
  },
  historyStatusRow: {
    alignItems: 'flex-end',
    gap: 4,
  },
  historyStatusText: { fontSize: 12, fontFamily: 'Estedad-FD-Bold' },
  answerSummaryText: { fontSize: 11, fontFamily: 'Estedad-FD-Regular', textAlign: 'right' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: { width: '100%', borderRadius: 18, padding: 18 },
  modalTitle: { fontSize: 15, fontFamily: 'Estedad-FD-Bold', textAlign: 'right' },
  modalSub: {
    fontSize: 11,
    fontFamily: 'Estedad-FD-Regular',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    height: 90,
    fontFamily: 'Estedad-FD-Regular',
    fontSize: 13,
    textAlign: 'right',
    marginBottom: 14,
  },
  modalBtns: { flexDirection: 'row-reverse', gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  submitBtn: { flex: 2, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
});

export default StudentRequestsScreen;
