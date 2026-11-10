import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { showWarning, showError, showSuccess } from '../../components/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/axiosConfig';
import {
  ChevronRight,
  Plus,
  Send,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  HelpCircle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';

const FAQS = [
  {
    q: 'درآمد حاصل از پاسخ به سوالات و فروش جزوه چگونه تسویه می‌شود؟',
    a: 'مبالغ به صورت آنی به کیف پول شما در کیتایار اضافه می‌شوند. برای تسویه حساب، از تب مرکز معلمان وارد بخش «کیف پول و تراکنش‌ها» شوید و درخواست برداشت را ثبت نمایید. مبالغ حداکثر ظرف ۲۴ ساعت کاری به شماره شبای شما واریز خواهد شد.',
  },
  {
    q: 'چگونه می‌توانم وضعیت حضور و آنلاین بودن خود را تغییر دهم؟',
    a: 'در صفحه اصلی مرکز معلمان (تب پنجم نوار پایین)، در بالای صفحه سوئیچ سه حالته «آنلاین، مشغول و آفلاین» قرار دارد. در حالت آنلاین، دانش‌آموزان می‌توانند سوالات خود را به طور مستقیم برای شما ارسال کنند.',
  },
  {
    q: 'فرمت‌های مجاز فایل‌های آموزشی برای فروش در مارکت چیست؟',
    a: 'فایل‌های PDF جزوه، نمونه‌سوال همراه با پاسخ‌نامه تشریحی و صوت‌های آموزشی تدریس مجاز هستند. برای جزوات، صفحاتی به عنوان پیش‌نمایش رایگان انتخاب می‌شوند تا دانش‌آموز قبل از خرید بتواند کیفیت فایل را بررسی کند.',
  },
  {
    q: 'کلاس‌های آنلاین با چه پلتفرمی برگزار می‌شوند؟',
    a: 'سامانه کیتایار از پلتفرم‌های امن ویدیو کنفرانس نظیر Google Meet و Jitsi Meet پشتیبانی می‌کند. هنگام تعریف کلاس، لینک جلسه را وارد کنید و دانش‌آموزان در موعد مقرر مستقیماً با یک لمس وارد کلاس می‌شوند.',
  },
  {
    q: 'اگر دانش‌آموزی در گفتگوی چت رفتار نامناسب داشت چه اقدامی باید کرد؟',
    a: 'از طریق بخش «گزارش تخلف»، شناسه گفتگو یا نام دانش‌آموز را به همراه توضیحات ارسال نمایید. تیم پشتیبانی کیتایار ظرف چند ساعت موضوع را بررسی و در صورت لزوم حساب کاربر را مسدود خواهد کرد.',
  },
];

interface Message {
  _id?: string;
  sender: 'teacher' | 'admin';
  senderName: string;
  text: string;
  createdAt: string;
}

export interface SupportTicket {
  _id: string;
  teacherId: string;
  teacherName: string;
  teacherPhone: string;
  subject: string;
  status: 'open' | 'answered' | 'closed';
  messages: Message[];
  lastReplyAt: string;
  createdAt: string;
  updatedAt: string;
}

export const SupportTicketsScreen = ({ route, navigation }: any) => {
  const { colors, isDark } = useTheme();
  const initialTicketId = route.params?.ticketId;

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sub Tab: tickets, faq, report
  const [subTab, setSubTab] = useState<'tickets' | 'faq' | 'report'>('tickets');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Active / Selected Ticket (Chat thread view)
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // New Ticket Modal State
  const [newModalVisible, setNewModalVisible] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const fetchTickets = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get('/teacher/support/tickets');
      if (res.data?.success) {
        const list: SupportTicket[] = res.data.data || [];
        setTickets(list);

        // If navigated with a specific ticketId from notification
        if (initialTicketId) {
          const target = list.find((t) => t._id === initialTicketId);
          if (target) {
            setActiveTicket(target);
          }
        } else if (activeTicket) {
          const updated = list.find((t) => t._id === activeTicket._id);
          if (updated) setActiveTicket(updated);
        }
      }
    } catch (e) {
      console.warn('Error fetching support tickets:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [initialTicketId, activeTicket?._id]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCreateTicket = async () => {
    if (!newSubject.trim() || !newMessage.trim()) {
      showWarning('لطفاً موضوع و متن پیام خود را وارد نمایید.');
      return;
    }

    setCreatingTicket(true);
    try {
      const res = await api.post('/teacher/support/tickets', {
        subject: newSubject.trim(),
        message: newMessage.trim(),
      });
      if (res.data?.success) {
        setNewModalVisible(false);
        setNewSubject('');
        setNewMessage('');
        showSuccess('پیام شما با موفقیت ارسال شد.');
        fetchTickets();
        if (res.data.data) {
          setActiveTicket(res.data.data);
        }
      }
    } catch (e: any) {
      showError(e.response?.data?.message || 'مشکلی در ارسال پیام رخ داد.');
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleSendReply = async () => {
    if (!activeTicket || !replyText.trim()) return;

    setSendingReply(true);
    try {
      const res = await api.post(`/teacher/support/tickets/${activeTicket._id}/reply`, {
        message: replyText.trim(),
      });
      if (res.data?.success) {
        setReplyText('');
        setActiveTicket(res.data.data);
        showSuccess('پاسخ شما ارسال شد.');
        fetchTickets();
      }
    } catch (e: any) {
      showError('ارسال پاسخ با خطا مواجه شد.');
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <View style={[styles.badge, { backgroundColor: isDark ? '#78350f' : '#fef3c7' }]}>
            <Clock size={12} color={isDark ? '#fbbf24' : '#b45309'} />
            <Text style={[styles.badgeText, { color: isDark ? '#fbbf24' : '#b45309' }]}>در انتظار پاسخ ادمین</Text>
          </View>
        );
      case 'answered':
        return (
          <View style={[styles.badge, { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }]}>
            <CheckCircle2 size={12} color={isDark ? '#34d399' : '#15803d'} />
            <Text style={[styles.badgeText, { color: isDark ? '#34d399' : '#15803d' }]}>پاسخ داده شده</Text>
          </View>
        );
      case 'closed':
        return (
          <View style={[styles.badge, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
            <AlertCircle size={12} color={colors.textLight} />
            <Text style={[styles.badgeText, { color: colors.textLight }]}>بسته شده</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (activeTicket) setActiveTicket(null);
            else navigation.goBack();
          }}
        >
          <ChevronRight color={colors.text} size={26} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {activeTicket ? activeTicket.subject : 'ارتباط با ما (پشتیبانی)'}
        </Text>
        {!activeTicket ? (
          <TouchableOpacity
            style={[styles.newBtn, { backgroundColor: colors.primary }]}
            onPress={() => setNewModalVisible(true)}
          >
            <Plus color="#fff" size={18} />
            <Text style={styles.newBtnText}>پیام جدید</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Content */}
      {activeTicket ? (
        /* Conversation Thread View */
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={[styles.threadStatusBanner, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[styles.threadSubject, { color: colors.text }]}>{activeTicket.subject}</Text>
              {getStatusBadge(activeTicket.status)}
            </View>
            <Text style={[styles.threadDate, { color: colors.textLight }]}>
              تاریخ آخرین بروزرسانی: {new Date(activeTicket.lastReplyAt).toLocaleDateString('fa-IR')}
            </Text>
          </View>

          <FlatList
            ref={flatListRef}
            data={activeTicket.messages}
            keyExtractor={(item, index) => item._id || index.toString()}
            contentContainerStyle={styles.messagesList}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => {
              const isAdmin = item.sender === 'admin';
              return (
                <View style={[styles.messageRow, isAdmin ? styles.messageRowAdmin : styles.messageRowTeacher]}>
                  <View
                    style={[
                      styles.messageBubble,
                      isAdmin
                        ? [styles.adminBubble, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: colors.border }]
                        : [styles.teacherBubble, { backgroundColor: colors.primary }],
                    ]}
                  >
                    <View style={styles.messageHeader}>
                      <Text style={[styles.senderName, { color: isAdmin ? (isDark ? '#38bdf8' : '#0284c7') : '#fff' }]}>
                        {isAdmin ? '🛡️ پشتیبانی کیتایار' : 'شما'}
                      </Text>
                      <Text style={[styles.messageTime, { color: isAdmin ? colors.textLight : 'rgba(255,255,255,0.7)' }]}>
                        {new Date(item.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={[styles.messageText, { color: isAdmin ? colors.text : '#fff' }]}>{item.text}</Text>
                  </View>
                </View>
              );
            }}
          />

          {/* Reply Box */}
          <View style={[styles.replyContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: colors.primary }]}
              onPress={handleSendReply}
              disabled={sendingReply}
            >
              {sendingReply ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Send color="#fff" size={18} />
              )}
            </TouchableOpacity>
            <TextInput
              style={[styles.replyInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', color: colors.text, borderColor: colors.border }]}
              placeholder="پاسخ خود را بنویسید..."
              placeholderTextColor={colors.textLight}
              value={replyText}
              onChangeText={setReplyText}
              multiline
            />
          </View>
        </KeyboardAvoidingView>
      ) : (
        /* Main Support View with Sub-Tabs */
        <View style={{ flex: 1 }}>
          {/* Sub-Tab Navigation */}
          <View style={[styles.subTabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.subTabBtn, subTab === 'tickets' && [styles.subTabBtnActive, { borderBottomColor: colors.primary }]]}
              onPress={() => setSubTab('tickets')}
            >
              <Text style={[styles.subTabText, { color: subTab === 'tickets' ? colors.primary : colors.textLight }]}>
                تیکت‌های من ({tickets.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.subTabBtn, subTab === 'faq' && [styles.subTabBtnActive, { borderBottomColor: colors.primary }]]}
              onPress={() => setSubTab('faq')}
            >
              <Text style={[styles.subTabText, { color: subTab === 'faq' ? colors.primary : colors.textLight }]}>
                سوالات متداول (FAQ)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.subTabBtn, subTab === 'report' && [styles.subTabBtnActive, { borderBottomColor: colors.primary }]]}
              onPress={() => setSubTab('report')}
            >
              <Text style={[styles.subTabText, { color: subTab === 'report' ? colors.primary : colors.textLight }]}>
                گزارش مشکل و تخلف
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: TICKETS */}
          {subTab === 'tickets' && (
            loading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textLight }]}>در حال بارگذاری پیام‌ها...</Text>
              </View>
            ) : tickets.length === 0 ? (
              <View style={styles.centerBox}>
                <MessageCircle size={56} color={colors.textLight} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>هیچ تیکتی ثبت نشده است</Text>
                <Text style={[styles.emptySub, { color: colors.textLight }]}>
                  برای ارتباط با پشتیبان کیتایار، روی دکمه "پیام جدید" ضربه بزنید.
                </Text>
              </View>
            ) : (
              <FlatList
                data={tickets}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.ticketsList}
                refreshing={refreshing}
                onRefresh={() => fetchTickets(true)}
                renderItem={({ item }) => {
                  const lastMsg = item.messages[item.messages.length - 1];
                  return (
                    <TouchableOpacity
                      style={[styles.ticketCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={() => setActiveTicket(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.ticketCardHeader}>
                        <Text style={[styles.ticketSubject, { color: colors.text }]}>{item.subject}</Text>
                        {getStatusBadge(item.status)}
                      </View>
                      <Text style={[styles.ticketPreview, { color: colors.textLight }]} numberOfLines={2}>
                        {lastMsg?.text || 'بدون پیام'}
                      </Text>
                      <View style={styles.ticketCardFooter}>
                        <Text style={[styles.ticketFooterText, { color: colors.textLight }]}>
                          {new Date(item.lastReplyAt).toLocaleDateString('fa-IR')}
                        </Text>
                        <Text style={[styles.ticketFooterLink, { color: colors.primary }]}>مشاهده گفتگو ›</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )
          )}

          {/* TAB 2: FAQS */}
          {subTab === 'faq' && (
            <ScrollView contentContainerStyle={styles.faqList} showsVerticalScrollIndicator={false}>
              <View style={styles.faqIntroBox}>
                <HelpCircle size={22} color={colors.primary} />
                <Text style={[styles.faqIntroTitle, { color: colors.text }]}>راهنمای جامع معلمان</Text>
              </View>
              {FAQS.map((faq, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.faqCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setExpandedFaq(isOpen ? null : idx)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.faqHeaderRow}>
                      <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.q}</Text>
                      {isOpen ? <ChevronUp size={20} color={colors.primary} /> : <ChevronDown size={20} color={colors.textLight} />}
                    </View>
                    {isOpen && (
                      <Text style={[styles.faqAnswer, { color: colors.textLight }]}>{faq.a}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* TAB 3: REPORT */}
          {subTab === 'report' && (
            <ScrollView contentContainerStyle={styles.reportList} showsVerticalScrollIndicator={false}>
              <View style={[styles.reportAlertBox, { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fee2e2', borderColor: '#ef4444' }]}>
                <ShieldAlert size={24} color="#dc2626" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reportAlertTitle, { color: isDark ? '#fca5a5' : '#991b1b' }]}>
                    مرکز رسیدگی به گزارش‌ها و تخلفات
                  </Text>
                  <Text style={[styles.reportAlertSub, { color: isDark ? '#fecaca' : '#7f1d1d' }]}>
                    تیم پشتیبانی کیتایار تمام گزارش‌های فنی و انضباطی را با اولویت ویژه و محرمانه بررسی می‌نماید.
                  </Text>
                </View>
              </View>

              <Text style={[styles.reportSectionHeader, { color: colors.text }]}>موضوع گزارش خود را انتخاب کنید:</Text>

              {[
                { title: 'گزارش رفتار نامناسب یا محتوای غیرمجاز دانش‌آموز', defaultSubject: '[گزارش تخلف دانش‌آموز]' },
                { title: 'گزارش مشکل فنی در چت بومی، ویس یا ارسال فایل', defaultSubject: '[گزارش فنی چت]' },
                { title: 'گزارش اشکال در تسویه حساب یا تراکنش کیف پول', defaultSubject: '[گزارش مالی کیف پول]' },
                { title: 'گزارش اشکال در برگزاری و لینک کلاس آنلاین', defaultSubject: '[گزارش کلاس آنلاین]' },
              ].map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.reportOptionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => {
                    setNewSubject(item.defaultSubject + ' ');
                    setNewModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.reportOptionHeader}>
                    <Text style={[styles.reportOptionTitle, { color: colors.text }]}>{item.title}</Text>
                    <ChevronRight size={18} color={colors.textLight} />
                  </View>
                  <Text style={[styles.reportOptionSub, { color: colors.primary }]}>ثبت گزارش فوری ›</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* New Ticket Modal */}
      <Modal visible={newModalVisible} transparent animationType="slide" onRequestClose={() => setNewModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>ارسال پیام جدید به ادمین</Text>
              <TouchableOpacity onPress={() => setNewModalVisible(false)}>
                <X color={colors.textLight} size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={[styles.inputLabel, { color: colors.text }]}>موضوع پیام</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', color: colors.text, borderColor: colors.border }]}
                placeholder="مثال: سوال درباره آزمون‌ساز یا پیشنهاد ویژگی"
                placeholderTextColor={colors.textLight}
                value={newSubject}
                onChangeText={setNewSubject}
                textAlign="right"
              />

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: 16 }]}>متن پیام</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', color: colors.text, borderColor: colors.border }]}
                placeholder="پیام، سوال یا مشکل خود را اینجا بنویسید..."
                placeholderTextColor={colors.textLight}
                value={newMessage}
                onChangeText={setNewMessage}
                textAlign="right"
                multiline
                numberOfLines={5}
              />

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreateTicket}
                disabled={creatingTicket}
              >
                {creatingTicket ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>ارسال پیام به پشتیبانی</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  backButton: { padding: 4 },
  headerTitle: {
    fontFamily: 'IRANSansX',
    fontSize: 16,
    fontWeight: 'bold',
  },
  newBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  newBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
    marginTop: 12,
  },
  emptyTitle: {
    fontFamily: 'IRANSansX',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySub: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  ticketsList: {
    padding: 16,
    gap: 12,
  },
  ticketCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  ticketCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketSubject: {
    fontFamily: 'IRANSansX',
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  ticketPreview: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
    textAlign: 'right',
    lineHeight: 20,
  },
  ticketCardFooter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  ticketFooterText: {
    fontFamily: 'IRANSansX',
    fontSize: 11,
  },
  ticketFooterLink: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
    fontWeight: 'bold',
  },
  badge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  badgeText: {
    fontFamily: 'IRANSansX',
    fontSize: 11,
    fontWeight: 'bold',
  },
  threadStatusBanner: {
    padding: 14,
    borderBottomWidth: 1,
    gap: 4,
  },
  threadSubject: {
    fontFamily: 'IRANSansX',
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  threadDate: {
    fontFamily: 'IRANSansX',
    fontSize: 11,
    textAlign: 'right',
  },
  messagesList: {
    padding: 16,
    gap: 12,
  },
  messageRow: {
    width: '100%',
    flexDirection: 'row',
  },
  messageRowAdmin: {
    justifyContent: 'flex-start',
  },
  messageRowTeacher: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '82%',
    padding: 12,
    borderRadius: 14,
  },
  adminBubble: {
    borderTopLeftRadius: 0,
    borderWidth: 1,
  },
  teacherBubble: {
    borderTopRightRadius: 0,
  },
  messageHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  senderName: {
    fontFamily: 'IRANSansX',
    fontSize: 11,
    fontWeight: 'bold',
  },
  messageTime: {
    fontFamily: 'IRANSansX',
    fontSize: 10,
  },
  messageText: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'right',
  },
  replyContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontFamily: 'IRANSansX',
    fontSize: 13,
    maxHeight: 100,
    textAlign: 'right',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontFamily: 'IRANSansX',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalBody: {
    paddingVertical: 16,
  },
  inputLabel: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'right',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'IRANSansX',
    fontSize: 13,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'IRANSansX',
    fontSize: 13,
    height: 120,
    textAlignVertical: 'top',
  },
  submitBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitBtnText: {
    color: '#fff',
    fontFamily: 'IRANSansX',
    fontSize: 14,
    fontWeight: 'bold',
  },
  subTabBar: {
    flexDirection: 'row-reverse',
    borderBottomWidth: 1,
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabBtnActive: {
    borderBottomWidth: 2,
  },
  subTabText: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
    fontWeight: 'bold',
  },
  faqList: {
    padding: 16,
    gap: 12,
  },
  faqIntroBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  faqIntroTitle: {
    fontFamily: 'IRANSansX',
    fontSize: 15,
    fontWeight: 'bold',
  },
  faqCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  faqHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  faqAnswer: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
    lineHeight: 22,
    textAlign: 'right',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.15)',
  },
  reportList: {
    padding: 16,
    gap: 14,
  },
  reportAlertBox: {
    flexDirection: 'row-reverse',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    alignItems: 'center',
  },
  reportAlertTitle: {
    fontFamily: 'IRANSansX',
    fontSize: 14,
    fontWeight: 'bold',
  },
  reportAlertSub: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  reportSectionHeader: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'right',
  },
  reportOptionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  reportOptionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportOptionTitle: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  reportOptionSub: {
    fontFamily: 'IRANSansX',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'left',
  },
});

export default SupportTicketsScreen;
