import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Linking,
  Dimensions,
  Animated,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/axiosConfig';
import {
  Bell,
  Menu,
  Clock,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Play,
  PlayCircle,
  Video,
  Lightbulb,
  Sparkles,
  Check,
  TrendingUp,
  Wallet,
  BookOpen,
  User,
  HelpCircle,
  Search,
  Plus,
  X,
  GraduationCap,
  CheckCircle2,
} from 'lucide-react-native';
import { FONT_FAMILY } from '../../theme/typography';
import { showSuccess, showWarning, showError } from '../../components/feedback';

const { width } = Dimensions.get('window');

interface ConversationItem {
  id: string;
  studentName: string;
  studentAvatar?: string;
  time: string;
  subject: string;
  grade: string;
  lastMessage: string;
  isOnline: boolean;
  status: 'active' | 'closed';
  unreadCount?: number;
  payoutStatus?: string;
}

const INITIAL_CONVERSATIONS: ConversationItem[] = [
  {
    id: 'conv-1',
    studentName: 'سارا محمدی',
    studentAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    time: '۱۰:۳۲',
    subject: 'ریاضی',
    grade: 'پایه نهم',
    lastMessage: 'سلام استاد، لطفاً در مورد سوال ۳ توضیح کامل بدید...',
    isOnline: true,
    status: 'active',
  },
  {
    id: 'conv-2',
    studentName: 'علی رضایی',
    studentAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    time: '۰۹:۴۵',
    subject: 'فیزیک',
    grade: 'پایه دهم',
    lastMessage: 'در مورد این مسئله راهنمایی می‌خواستم...',
    isOnline: true,
    status: 'active',
  },
  {
    id: 'conv-3',
    studentName: 'نگار احمدی',
    studentAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    time: '۱۷:۲۰',
    subject: 'شیمی',
    grade: 'پایه دهم',
    lastMessage: 'لطفاً نکات مهم فصل ۴ رو برام بفرستید...',
    isOnline: false,
    status: 'active',
  },
  {
    id: 'conv-4',
    studentName: 'امیرحسین کاظمی',
    studentAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    time: 'دیروز',
    subject: 'هندسه',
    grade: 'پایه یازدهم',
    lastMessage: 'خیلی ممنون استاد، پاسخ را متوجه شدم.',
    isOnline: false,
    status: 'closed',
  },
  {
    id: 'conv-5',
    studentName: 'مریم حسینی',
    studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    time: '۳ روز پیش',
    subject: 'زیست‌شناسی',
    grade: 'پایه دوازدهم',
    lastMessage: 'جلسه رفع اشکال بسیار عالی بود، سپاسگزارم.',
    isOnline: false,
    status: 'closed',
  },
];

export const TeacherCenterScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();

  // Online Availability state
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [selectedDurationHours, setSelectedDurationHours] = useState<number>(2); // 1, 2, 3, 4
  const [remainingSeconds, setRemainingSeconds] = useState<number>(7172); // ~ 01:59:32
  const [activeTab, setActiveTab] = useState<'active' | 'closed'>('active');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [conversations, setConversations] = useState<ConversationItem[]>(INITIAL_CONVERSATIONS);

  // Stats from backend
  const [stats, setStats] = useState({
    todayEarnings: 450000,
    activeQuestionsCount: 3,
    avgResponseMinutes: 12,
    rating: 4.9,
  });

  // Teacher Profile & Wallet states
  const [teacherName, setTeacherName] = useState<string>('همکار گرامی');
  const [teacherAvatar, setTeacherAvatar] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Virtual classroom creation modal states
  const [isVirtualClassModalVisible, setIsVirtualClassModalVisible] = useState(false);
  const [virtualClassName, setVirtualClassName] = useState('');
  const [virtualStudentCount, setVirtualStudentCount] = useState<number>(5);
  const [virtualSubject, setVirtualSubject] = useState('');
  const [submittingVirtualClass, setSubmittingVirtualClass] = useState(false);

  // Workdesk & Teaching Subjects settings modal states
  const [isWorkdeskModalVisible, setIsWorkdeskModalVisible] = useState(false);
  const [educationLevel, setEducationLevel] = useState<'elementary' | 'secondary' | 'both'>('secondary');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['ریاضی']);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');
  const [submittingWorkdesk, setSubmittingWorkdesk] = useState(false);

  const timerRef = useRef<any>(null);

  // Countdown timer logic
  useEffect(() => {
    if (isOnline && remainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsOnline(false);
            showWarning('زمان آنلاین بودن به پایان رسید و به حالت آفلاین تغییر یافتید.');
            handleUpdateBackendAvailability(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOnline, remainingSeconds]);

  // Format seconds into HH:MM:SS with Persian digits
  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const timeStr = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return timeStr.replace(/[0-9]/g, (w) => farsiDigits[+w]);
  };

  const handleSelectDuration = (hours: number) => {
    setSelectedDurationHours(hours);
    const newSeconds = hours * 3600;
    setRemainingSeconds(newSeconds);
    if (!isOnline) {
      setIsOnline(true);
      handleUpdateBackendAvailability(true);
    }
    showSuccess(`زمان پاسخگویی روی ${hours} ساعت تنظیم شد.`);
  };

  const handleToggleOnline = (value: boolean) => {
    setIsOnline(value);
    if (value) {
      setRemainingSeconds(selectedDurationHours * 3600);
      showSuccess('وضعیت شما به «آنلاین» تغییر یافت.');
    } else {
      showWarning('وضعیت شما به «آفلاین» تغییر یافت.');
    }
    handleUpdateBackendAvailability(value);
  };

  const handleUpdateBackendAvailability = async (online: boolean) => {
    try {
      await api.post('/teacher/center/availability', {
        status: online ? 'online' : 'offline',
        acceptingQuestions: online,
      });
    } catch (e) {
      console.warn('Could not sync availability with server:', e);
    }
  };

  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [claimingReqId, setClaimingReqId] = useState<string | null>(null);

  const fetchServerData = async () => {
    try {
      setRefreshing(true);
      const [ovRes, convRes, reqRes, wallRes] = await Promise.allSettled([
        api.get('/teacher/center/overview'),
        api.get('/chat/conversations'),
        api.get('/teacher/center/requests?tab=pending&limit=5'),
        api.get('/teacher/center/wallet'),
      ]);

      if (ovRes.status === 'fulfilled' && ovRes.value.data?.success) {
        const d = ovRes.value.data.data;
        if (d.availability?.status) {
          setIsOnline(d.availability.status === 'online');
        }
        if (d.counters) {
          setStats({
            todayEarnings: d.counters.todayEarnings || 450000,
            activeQuestionsCount: d.counters.pendingDirectRequests || 3,
            avgResponseMinutes: 12,
            rating: d.profileSummary?.rating || 4.9,
          });
        }
        if (d.profileSummary) {
          setTeacherName(d.profileSummary.fullName || 'همکار گرامی');
          setTeacherAvatar(d.profileSummary.avatar || null);
          if (Array.isArray(d.profileSummary.teachingSubjects) && d.profileSummary.teachingSubjects.length > 0) {
            setSelectedSubjects(d.profileSummary.teachingSubjects);
          }
        }
        if (d.wallet?.balance !== undefined) {
          setWalletBalance(d.wallet.balance);
        }
      }

      if (wallRes.status === 'fulfilled' && wallRes.value.data?.success && wallRes.value.data.data?.balance !== undefined) {
        setWalletBalance(wallRes.value.data.data.balance);
      }

      // Fetch conversations if available
      if (convRes.status === 'fulfilled' && convRes.value.data?.success && Array.isArray(convRes.value.data.data)) {
        const serverConvs: ConversationItem[] = convRes.value.data.data.map((c: any) => ({
          id: c._id,
          studentName: c.studentId?.fullName || 'دانش‌آموز',
          studentAvatar: c.studentId?.avatar || undefined,
          time: new Date(c.updatedAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          subject: c.subject || 'پاسخ سوال',
          grade: c.grade || 'کیتایار',
          lastMessage: c.lastMessage || 'پیام جدید',
          isOnline: true,
          status: c.status === 'closed' ? 'closed' : 'active',
          payoutStatus: c.questionRequestId?.payoutStatus,
        }));
        if (serverConvs.length > 0) {
          setConversations(serverConvs);
        }
      }

      // Fetch 5 pending broadcast / live questions
      if (reqRes.status === 'fulfilled' && reqRes.value.data?.success && Array.isArray(reqRes.value.data.data)) {
        setPendingRequests(reqRes.value.data.data);
      }
    } catch (e) {
      // Keep initial/fallback data for preview
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateVirtualClassroom = async () => {
    if (!virtualClassName.trim()) {
      showError('لطفاً نام کلاس مجازی را وارد کنید.');
      return;
    }
    const totalFee = virtualStudentCount * 50000;
    if (walletBalance < totalFee) {
      showError(`موجودی کیف پول کافی نیست. هزینه: ${totalFee.toLocaleString('fa-IR')} تومان است.`);
      return;
    }

    try {
      setSubmittingVirtualClass(true);
      const res = await api.post('/teacher/center/virtual-classroom', {
        name: virtualClassName.trim(),
        studentCount: virtualStudentCount,
        subject: virtualSubject.trim() || undefined,
      });
      if (res.data?.success) {
        showSuccess(`کلاس مجازی ایجاد شد و ${totalFee.toLocaleString('fa-IR')} تومان از کیف پول کسر گردید.`);
        setIsVirtualClassModalVisible(false);
        setVirtualClassName('');
        setVirtualSubject('');
        fetchServerData();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'خطا در ایجاد کلاس مجازی');
    } finally {
      setSubmittingVirtualClass(false);
    }
  };

  const handleSaveWorkdeskSettings = async () => {
    try {
      setSubmittingWorkdesk(true);
      const res = await api.put('/teacher/center/workdesk-settings', {
        educationLevel,
        teachingSubjects: educationLevel === 'elementary' ? ['ابتدایی (تمام دروس)'] : selectedSubjects,
      });
      if (res.data?.success) {
        showSuccess('تنظیمات دروس و مقطع تدریس با موفقیت ذخیره شد.');
        setIsWorkdeskModalVisible(false);
        fetchServerData();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'خطا در ذخیره تنظیمات');
    } finally {
      setSubmittingWorkdesk(false);
    }
  };

  const toggleSubjectSelection = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const handleClaimAndOpenChat = async (item: any) => {
    try {
      setClaimingReqId(item._id);
      const res = await api.post(`/teacher/center/requests/${item._id}/claim-and-chat`);
      if (res.data?.success) {
        // Immediately remove question so it's not shown anymore to anyone
        setPendingRequests((prev) => prev.filter((r) => r._id !== item._id));
        showSuccess('سوال با موفقیت به شما اختصاص یافت');
        navigation.navigate('TeacherChatScreen', {
          conversationId: res.data.data.conversationId,
          title: res.data.data.studentName || 'دانش‌آموز',
          studentAvatar: res.data.data.studentAvatar,
        });
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'این سوال قبلاً توسط همکار دیگری پذیرفته شده است.');
      fetchServerData();
    } finally {
      setClaimingReqId(null);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchServerData();
    }, [])
  );

  const activeConversations = conversations.filter((c) => c.status === 'active');
  const closedConversations = conversations.filter((c) => c.status === 'closed');
  const displayedConversations = activeTab === 'active' ? activeConversations : closedConversations;

  const handleOpenChat = (item: ConversationItem) => {
    navigation.navigate('TeacherChatScreen', {
      conversationId: item.id,
      studentName: item.studentName,
      studentAvatar: item.studentAvatar,
      subject: item.subject,
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 1. TOP APP BAR (Avatar, Name, Wallet balance underneath & Wallet button opposite) */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.walletHeaderBtn}
          onPress={() => navigation.navigate('TeacherWalletScreen')}
          activeOpacity={0.8}
        >
          <Wallet size={16} color="#ffffff" style={{ marginLeft: 5 }} />
          <Text style={styles.walletHeaderBtnText}>کیف پول</Text>
        </TouchableOpacity>

        <View style={styles.teacherHeaderInfo}>
          <View style={styles.teacherTextCol}>
            <Text style={[styles.teacherFullName, { color: colors.text }]}>
              {teacherName || 'همکار گرامی'}
            </Text>
            <Text style={[styles.teacherWalletSubtitle, { color: colors.primary }]}>
              موجودی کیف پول: {walletBalance.toLocaleString('fa-IR')} تومان
            </Text>
          </View>
          {teacherAvatar ? (
            <Image source={{ uri: teacherAvatar }} style={styles.teacherAvatarImg} />
          ) : (
            <View style={[styles.teacherAvatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.teacherAvatarLetter}>
                {(teacherName || 'م').charAt(0)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchServerData} colors={[colors.primary]} />}
      >
        {/* 2. STATS MINI-BAR */}
        <View style={[styles.statsBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {stats.todayEarnings.toLocaleString('fa-IR')} <Text style={styles.statUnit}>تومان</Text>
            </Text>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>درآمد امروز</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#16a34a' }]}>
              {stats.activeQuestionsCount.toLocaleString('fa-IR')}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>گفتگوی فعال</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#eab308' }]}>★ {stats.rating}</Text>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>امتیاز تدریس</Text>
          </View>
        </View>

        {/* 3. HERO BANNER (3:4 aspect ratio, width larger) */}
        <TouchableOpacity
          style={styles.bannerContainer}
          activeOpacity={0.9}
          onPress={() => handleToggleOnline(true)}
        >
          <Image
            source={require('../../assets/image/classBanner.png')}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* 4. TUTORIAL VIDEO BOX */}
        <TouchableOpacity
          style={[styles.videoBox, { backgroundColor: isDark ? '#1e293b' : '#eff6ff', borderColor: isDark ? '#334155' : '#bfdbfe' }]}
          activeOpacity={0.8}
          onPress={() => Linking.openURL('https://kitayar.ir/guide/teacher-earnings')}
        >
          <View style={styles.videoBoxLeft}>
            <View style={styles.videoPlayCircle}>
              <Play size={16} color="#2563eb" fill="#2563eb" style={{ marginLeft: 2 }} />
            </View>
          </View>

          <View style={styles.videoBoxCenter}>
            <Text style={[styles.videoBoxTitle, { color: isDark ? '#93c5fd' : '#1e3a8a' }]}>
              آموزش و آشنایی با نحوه درآمد از کیتایار
            </Text>
            <Text style={[styles.videoBoxSub, { color: isDark ? '#60a5fa' : '#3b82f6' }]}>
              ویدیو را ببینید
            </Text>
          </View>

          <View style={styles.videoBoxRight}>
            <Video size={24} color="#2563eb" />
          </View>
        </TouchableOpacity>

        {/* 5. ONLINE STATUS CARD (Character + Toggle + 4 Duration Pills + Timer) */}
        <View style={[styles.onlineCard, { backgroundColor: isDark ? '#064e3b18' : '#f0fdf4', borderColor: isDark ? '#047857' : '#bbf7d0' }]}>
          {/* Top Row: Character & Toggle */}
          <View style={styles.onlineHeaderRow}>
            {/* Status Text on Right */}
            <View style={styles.onlineStatusTextCol}>
              <View style={styles.statusIndicatorRow}>
                <View style={[styles.statusGlowDot, { backgroundColor: isOnline ? '#16a34a' : '#94a3b8' }]} />
                <Text style={[styles.statusTitle, { color: isOnline ? '#15803d' : '#64748b' }]}>
                  {isOnline ? 'آنلاین' : 'آفلاین'}
                </Text>
              </View>
              <Text style={[styles.statusSubtitle, { color: isDark ? '#a7f3d0' : '#475569' }]}>
                {isOnline ? 'در حال پاسخ به سوالات دانش‌آموزان' : 'جهت دریافت سوالات جدید آنلاین شوید'}
              </Text>
            </View>

            {/* Switch in Center */}
            <View style={styles.switchCol}>
              <Text style={[styles.switchHint, { color: isDark ? '#86efac' : '#2563eb' }]}>
                فعال‌سازی وضعیت آنلاین
              </Text>
              <Switch
                value={isOnline}
                onValueChange={handleToggleOnline}
                trackColor={{ false: '#cbd5e1', true: '#16a34a' }}
                thumbColor="#ffffff"
                style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }], marginTop: 4 }}
              />
            </View>

            {/* Character Image on Left */}
            <View style={styles.characterContainer}>
              <Image
                source={
                  isOnline
                    ? require('../../assets/image/activecarecter.png')
                    : require('../../assets/image/diactive-carecter.png')
                }
                style={styles.characterImage}
                resizeMode="contain"
              />
              <ChevronLeft size={18} color="#15803d" style={styles.characterChevron} />
            </View>
          </View>

          {/* 4 Duration Pills: 1 ساعت، ۲ ساعت، ۳ ساعت، ۴ ساعت */}
          <View style={styles.durationsRow}>
            {[
              { hours: 1, label: '۱ ساعت' },
              { hours: 2, label: '۲ ساعت' },
              { hours: 3, label: '۳ ساعت' },
              { hours: 4, label: '۴ ساعت' },
            ].map((pill) => {
              const isSelected = selectedDurationHours === pill.hours && isOnline;
              return (
                <TouchableOpacity
                  key={pill.hours}
                  style={[
                    styles.durationPill,
                    {
                      backgroundColor: isSelected
                        ? (isDark ? '#065f46' : '#dcfce7')
                        : (isDark ? '#0f172a66' : '#ffffff'),
                      borderColor: isSelected ? '#16a34a' : (isDark ? '#334155' : '#e2e8f0'),
                    },
                  ]}
                  onPress={() => handleSelectDuration(pill.hours)}
                  activeOpacity={0.8}
                >
                  {isSelected ? (
                    <View style={styles.checkCircleSmall}>
                      <Check size={11} color="#ffffff" strokeWidth={3} />
                    </View>
                  ) : (
                    <Clock size={13} color="#64748b" />
                  )}
                  <Text
                    style={[
                      styles.durationPillText,
                      { color: isSelected ? '#15803d' : '#475569', fontWeight: isSelected ? 'bold' : '500' },
                    ]}
                  >
                    {pill.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Countdown Timer Row */}
          <View style={[styles.timerBanner, { backgroundColor: isDark ? '#064e3b33' : '#dcfce788', borderColor: isDark ? '#059669' : '#86efac' }]}>
            <Text style={[styles.timerDigits, { color: isOnline ? '#15803d' : '#64748b' }]}>
              {isOnline ? formatTimer(remainingSeconds) : '۰۰:۰۰:۰۰'}
            </Text>
            <View style={styles.timerLabelRow}>
              <Text style={[styles.timerLabel, { color: isDark ? '#a7f3d0' : '#166534' }]}>
                زمان تا غیرفعال شدن آنلاین بودن:
              </Text>
              <Clock size={16} color="#16a34a" style={{ marginRight: 6 }} />
            </View>
          </View>
        </View>

        {/* ONLINE CLASSES PROMINENT BANNER */}
        <View style={[styles.onlineClassHeroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.onlineClassHeroTop}>
            <View style={styles.onlineClassTextCol}>
              <Text style={[styles.onlineClassTitle, { color: colors.text }]}>کلاس‌های آنلاین اختصاصی</Text>
              <Text style={[styles.onlineClassSub, { color: colors.textLight }]}>
                برگزاری جلسات رفع اشکال زنده ۱ تا ۱۰ نفره همراه با درآمد مستقیم
              </Text>
            </View>
            <View style={[styles.onlineClassIconCircle, { backgroundColor: isDark ? '#1e3a8a40' : '#eff6ff' }]}>
              <Video size={24} color="#2563eb" />
            </View>
          </View>
          <View style={styles.onlineClassBtnRow}>
            <TouchableOpacity
              style={[styles.onlineClassSubBtn, { borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
              onPress={() => setIsVirtualClassModalVisible(true)}
              activeOpacity={0.8}
            >
              <Plus size={15} color="#2563eb" style={{ marginLeft: 4 }} />
              <Text style={[styles.onlineClassSubBtnText, { color: colors.text }]}>ایجاد کلاس مجازی (۵۰ ت/نفر)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.onlineClassMainBtn, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('OnlineClassesScreen')}
              activeOpacity={0.85}
            >
              <ChevronLeft size={16} color="#ffffff" style={{ marginLeft: 4 }} />
              <Text style={styles.onlineClassMainBtnText}>کلاس‌ها و درخواست‌ها</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 6. 3 ACTION CARDS (مدیریت جزوه‌ها، دروس و مقطع تدریس، کیف پول) */}
        <View style={styles.threeCardsRow}>
          {/* Card 1: مدیریت جزوه‌ها */}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('TeacherMaterialsScreen')}
            activeOpacity={0.8}
          >
            <View style={styles.actionCardImageWrap}>
              <Image
                source={require('../../assets/image/materials_3d.png')}
                style={styles.actionCard3DImage}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.actionCardTitle, { color: colors.text }]}>مدیریت جزوه‌ها</Text>
            <Text style={[styles.actionCardSub, { color: colors.textLight }]} numberOfLines={2}>
              بارگذاری، مدیریت و فروش جزوه‌های آموزشی
            </Text>
            <View style={[styles.cardArrowCircle, { backgroundColor: '#ea580c' }]}>
              <ChevronLeft size={16} color="#ffffff" strokeWidth={2.5} />
            </View>
          </TouchableOpacity>

          {/* Card 2: دروس و مقطع تدریس */}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setIsWorkdeskModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.actionCardImageWrap}>
              <Image
                source={require('../../assets/image/profile_badge_3d.png')}
                style={styles.actionCard3DImage}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.actionCardTitle, { color: colors.text }]}>دروس و مقطع تدریس</Text>
            <Text style={[styles.actionCardSub, { color: colors.textLight }]} numberOfLines={2}>
              تعیین دروس تخصصی و مقطع ابتدایی/متوسطه
            </Text>
            <View style={[styles.cardArrowCircle, { backgroundColor: '#8b5cf6' }]}>
              <ChevronLeft size={16} color="#ffffff" strokeWidth={2.5} />
            </View>
          </TouchableOpacity>

          {/* Card 3: کیف پول */}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('TeacherWalletScreen')}
            activeOpacity={0.8}
          >
            <View style={styles.actionCardImageWrap}>
              <Image
                source={require('../../assets/image/wallet_3d.png')}
                style={styles.actionCard3DImage}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.actionCardTitle, { color: colors.text }]}>کیف پول</Text>
            <Text style={[styles.actionCardSub, { color: colors.textLight }]} numberOfLines={2}>
              مشاهده موجودی و تراکنش‌ها
            </Text>
            <View style={[styles.cardArrowCircle, { backgroundColor: '#2563eb' }]}>
              <ChevronLeft size={16} color="#ffffff" strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
        </View>

        {/* 6.5. PENDING STUDENT QUESTIONS POOL (۵ سوال در جریان دانش‌آموزان) */}
        {pendingRequests.length > 0 && (
          <View style={[styles.pendingPoolContainer, { backgroundColor: isDark ? '#1e293b' : '#eff6ff', borderColor: isDark ? '#334155' : '#bfdbfe' }]}>
            <View style={styles.pendingPoolHeader}>
              <View style={styles.pendingPoolBadge}>
                <View style={styles.pulsingDotLive} />
                <Text style={styles.pendingPoolBadgeText}>
                  {pendingRequests.length.toLocaleString('fa-IR')} سوال در انتظار پاسخ
                </Text>
              </View>
              <View style={styles.pendingPoolTitleRow}>
                <HelpCircle size={18} color="#2563eb" />
                <Text style={[styles.pendingPoolTitle, { color: colors.text }]}>
                  سوالات در جریان دانش‌آموزان
                </Text>
              </View>
            </View>

            <Text style={[styles.pendingPoolSub, { color: colors.textLight }]}>
              هر سوالی را سریع‌تر قبول کنید، بلافاصله وارد گفتگوی اختصاصی رفع اشکال با دانش‌آموز می‌شوید.
            </Text>

            {pendingRequests.map((q) => (
              <View
                key={q._id}
                style={[
                  styles.pendingReqCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={styles.pendingReqTop}>
                  <View style={styles.reqPriceBadge}>
                    <Text style={styles.reqPriceText}>
                      {q.price && q.price > 0 ? `${q.price.toLocaleString('fa-IR')} تومان` : 'رایگان'}
                    </Text>
                  </View>
                  <View style={styles.reqStudentRow}>
                    <Text style={[styles.reqStudentName, { color: colors.text }]}>
                      {q.studentId?.fullName || 'دانش‌آموز'}
                    </Text>
                    {q.studentId?.avatar ? (
                      <Image source={{ uri: q.studentId.avatar }} style={styles.reqStudentAvatar} />
                    ) : (
                      <View style={styles.reqStudentAvatarPlaceholder}>
                        <User size={14} color={colors.primary} />
                      </View>
                    )}
                  </View>
                </View>

                <Text style={[styles.reqTitle, { color: colors.primary }]}>{q.title}</Text>
                <Text style={[styles.reqDesc, { color: colors.textLight }]} numberOfLines={2}>
                  {q.description}
                </Text>

                <TouchableOpacity
                  style={[styles.acceptReqBtn, claimingReqId === q._id && { opacity: 0.7 }]}
                  onPress={() => handleClaimAndOpenChat(q)}
                  disabled={claimingReqId === q._id}
                  activeOpacity={0.85}
                >
                  {claimingReqId === q._id ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Send size={15} color="#ffffff" style={{ marginLeft: 6 }} />
                      <Text style={styles.acceptReqBtnText}>قبول سوال و ورود به گفتگو</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* 7. CONVERSATIONS SEGMENTED TABS (گفتگوهای فعال / گفتگوهای بسته شده) */}
        <View style={styles.conversationsSection}>
          <View style={styles.segmentTabBar}>
            {/* Tab 1: گفتگوهای فعال */}
            <TouchableOpacity
              style={[
                styles.segmentTabBtn,
                activeTab === 'active'
                  ? styles.segmentTabBtnActive
                  : [styles.segmentTabBtnInactive, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }],
              ]}
              onPress={() => setActiveTab('active')}
              activeOpacity={0.8}
            >
              <MessageCircle
                size={17}
                color={activeTab === 'active' ? '#ffffff' : colors.textLight}
                style={{ marginLeft: 6 }}
              />
              <Text
                style={[
                  styles.segmentTabText,
                  { color: activeTab === 'active' ? '#ffffff' : colors.textLight },
                ]}
              >
                گفتگوهای فعال
              </Text>
              <View
                style={[
                  styles.segmentCountPill,
                  {
                    backgroundColor: activeTab === 'active' ? '#ffffff' : (isDark ? '#334155' : '#e2e8f0'),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.segmentCountText,
                    { color: activeTab === 'active' ? '#2563eb' : colors.text },
                  ]}
                >
                  {activeConversations.length.toLocaleString('fa-IR')}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Tab 2: گفتگوهای بسته شده */}
            <TouchableOpacity
              style={[
                styles.segmentTabBtn,
                activeTab === 'closed'
                  ? styles.segmentTabBtnActive
                  : [styles.segmentTabBtnInactive, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }],
              ]}
              onPress={() => setActiveTab('closed')}
              activeOpacity={0.8}
            >
              <Clock
                size={16}
                color={activeTab === 'closed' ? '#ffffff' : colors.textLight}
                style={{ marginLeft: 6 }}
              />
              <Text
                style={[
                  styles.segmentTabText,
                  { color: activeTab === 'closed' ? '#ffffff' : colors.textLight },
                ]}
              >
                گفتگوهای بسته شده
              </Text>
              <View
                style={[
                  styles.segmentCountPill,
                  {
                    backgroundColor: activeTab === 'closed' ? '#ffffff' : (isDark ? '#334155' : '#e2e8f0'),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.segmentCountText,
                    { color: activeTab === 'closed' ? '#2563eb' : colors.text },
                  ]}
                >
                  {closedConversations.length.toLocaleString('fa-IR')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Student Conversations List */}
          <View style={styles.conversationsList}>
            {displayedConversations.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.convCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handleOpenChat(item)}
                activeOpacity={0.8}
              >
                {/* Action: Reply Button */}
                <TouchableOpacity
                  style={styles.replyButton}
                  onPress={() => handleOpenChat(item)}
                  activeOpacity={0.8}
                >
                  <Send size={14} color="#ffffff" style={{ marginLeft: 4 }} />
                  <Text style={styles.replyButtonText}>پاسخ</Text>
                </TouchableOpacity>

                {/* Center Content: Name, Time, Badges, Message Snippet */}
                <View style={styles.convDetailsCol}>
                  <View style={styles.convTopRow}>
                    <Text style={[styles.convStudentName, { color: colors.text }]}>{item.studentName}</Text>
                    <Text style={[styles.convTime, { color: colors.textLight }]}>{item.time}</Text>
                  </View>

                  {/* Subject and Grade Badges */}
                  <View style={styles.convBadgesRow}>
                    <View style={styles.badgePill}>
                      <Text style={styles.badgeText}>{item.subject}</Text>
                    </View>
                    <View style={styles.badgePill}>
                      <Text style={styles.badgeText}>{item.grade}</Text>
                    </View>
                  </View>

                  {/* Escrow badge if pending review */}
                  {item.payoutStatus === 'pending_review' && (
                    <View style={styles.escrowBadge}>
                      <Clock size={11} color="#d97706" style={{ marginLeft: 3 }} />
                      <Text style={styles.escrowBadgeText}>در انتظار بررسی کارشناس و واریز پول</Text>
                    </View>
                  )}

                  <Text style={[styles.convMessageSnippet, { color: colors.textLight }]} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                </View>

                {/* Right: Avatar with Online indicator */}
                <View style={styles.avatarWrap}>
                  <Image
                    source={{ uri: item.studentAvatar || 'https://i.pravatar.cc/150' }}
                    style={styles.avatarImage}
                  />
                  {item.isOnline && <View style={styles.avatarOnlineDot} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 8. BOTTOM TUTORIAL BANNER */}
        <View style={[styles.bottomCard, { backgroundColor: isDark ? '#1e293b' : '#eff6ff', borderColor: isDark ? '#334155' : '#bfdbfe' }]}>
          <View style={styles.bottomLeftGraphic}>
            <View style={styles.bottomIconCircle}>
              <Play size={20} color="#2563eb" fill="#2563eb" />
            </View>
          </View>

          <View style={styles.bottomCenterContent}>
            <View style={styles.bottomTitleRow}>
              <Lightbulb size={18} color="#eab308" style={{ marginLeft: 6 }} />
              <Text style={[styles.bottomTitle, { color: isDark ? '#93c5fd' : '#1e3a8a' }]}>
                چطور از کیتایار درآمد کسب کنیم؟
              </Text>
            </View>
            <Text style={[styles.bottomSubtitle, { color: isDark ? '#94a3b8' : '#475569' }]}>
              آموزش کامل نحوه تدریس و فروش جزوه در چند دقیقه
            </Text>
            <TouchableOpacity
              style={styles.bottomWatchBtn}
              onPress={() => Linking.openURL('https://kitayar.ir/guide/teacher-earnings')}
              activeOpacity={0.8}
            >
              <PlayCircle size={15} color="#2563eb" style={{ marginLeft: 4 }} />
              <Text style={styles.bottomWatchBtnText}>مشاهده ویدیو</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* MODAL 1: Virtual Classroom Creation (50k/student) */}
      <Modal
        visible={isVirtualClassModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsVirtualClassModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
            <View style={styles.modalBoxHeader}>
              <TouchableOpacity onPress={() => setIsVirtualClassModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color={colors.textLight} />
              </TouchableOpacity>
              <Text style={[styles.modalBoxTitle, { color: colors.text }]}>ایجاد کلاس مجازی جدید</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalNoticeBox}>
                <Text style={styles.modalNoticeText}>
                  هزینه ایجاد کلاس مجازی به ازای هر دانش‌آموز ۵۰,۰۰۰ تومان است که از کیف پول شما کسر می‌شود.
                </Text>
              </View>

              <Text style={[styles.modalInputLabel, { color: colors.text }]}>نام کلاس مجازی</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border, color: colors.text }]}
                placeholder="مثال: کلاس رفع اشکال ریاضی دهم"
                placeholderTextColor={colors.textLight}
                value={virtualClassName}
                onChangeText={setVirtualClassName}
                textAlign="right"
              />

              <Text style={[styles.modalInputLabel, { color: colors.text }]}>درس مربوطه (اختیاری)</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border, color: colors.text }]}
                placeholder="مثال: ریاضی، فیزیک، شیمی..."
                placeholderTextColor={colors.textLight}
                value={virtualSubject}
                onChangeText={setVirtualSubject}
                textAlign="right"
              />

              <Text style={[styles.modalInputLabel, { color: colors.text }]}>تعداد ظرفیت دانش‌آموزان</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[styles.stepperBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setVirtualStudentCount((prev) => Math.min(prev + 1, 50))}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
                <Text style={[styles.stepperValueText, { color: colors.text }]}>
                  {virtualStudentCount.toLocaleString('fa-IR')} نفر
                </Text>
                <TouchableOpacity
                  style={[styles.stepperBtn, { backgroundColor: '#e2e8f0' }]}
                  onPress={() => setVirtualStudentCount((prev) => Math.max(prev - 1, 1))}
                >
                  <Text style={[styles.stepperBtnText, { color: '#334155' }]}>-</Text>
                </TouchableOpacity>
              </View>

              {/* Total Calculation & Wallet comparison */}
              <View style={[styles.calcBox, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                <View style={styles.calcRow}>
                  <Text style={[styles.calcVal, { color: colors.primary }]}>
                    {(virtualStudentCount * 50000).toLocaleString('fa-IR')} تومان
                  </Text>
                  <Text style={[styles.calcLabel, { color: colors.textLight }]}>مبلغ کل قابل پرداخت:</Text>
                </View>
                <View style={styles.calcRow}>
                  <Text style={[styles.calcVal, { color: walletBalance >= virtualStudentCount * 50000 ? '#16a34a' : '#ef4444' }]}>
                    {walletBalance.toLocaleString('fa-IR')} تومان
                  </Text>
                  <Text style={[styles.calcLabel, { color: colors.textLight }]}>موجودی کیف پول شما:</Text>
                </View>
                {walletBalance < virtualStudentCount * 50000 && (
                  <Text style={styles.insufficientWarning}>
                    ⚠️ موجودی کیف پول برای ایجاد این کلاس کافی نیست. لطفاً کیف پول خود را شارژ فرمایید.
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.modalSubmitBtn,
                  { backgroundColor: colors.primary },
                  (submittingVirtualClass || walletBalance < virtualStudentCount * 50000) && { opacity: 0.6 },
                ]}
                onPress={handleCreateVirtualClassroom}
                disabled={submittingVirtualClass || walletBalance < virtualStudentCount * 50000}
                activeOpacity={0.85}
              >
                {submittingVirtualClass ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>پرداخت و ایجاد کلاس مجازی</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Workdesk & Teaching Subjects Settings */}
      <Modal
        visible={isWorkdeskModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsWorkdeskModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, maxHeight: '88%' }]}>
            <View style={styles.modalBoxHeader}>
              <TouchableOpacity onPress={() => setIsWorkdeskModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color={colors.textLight} />
              </TouchableOpacity>
              <Text style={[styles.modalBoxTitle, { color: colors.text }]}>دروس و مقطع تدریس</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalSectionDesc, { color: colors.textLight }]}>
                مقطع و دروسی که توانایی حل مسئله و تدریس برای دانش‌آموزان را دارید مشخص کنید.
              </Text>

              {/* Education Level selector */}
              <Text style={[styles.modalInputLabel, { color: colors.text }]}>مقطع تحصیلی تدریس:</Text>
              <View style={styles.levelSelectorRow}>
                <TouchableOpacity
                  style={[
                    styles.levelPill,
                    educationLevel === 'elementary' && styles.levelPillActive,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => setEducationLevel('elementary')}
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
                >
                  <Text style={[styles.levelPillText, educationLevel === 'both' && styles.levelPillTextActive]}>
                    هر دو مقطع
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Elementary Notice */}
              {educationLevel === 'elementary' && (
                <View style={styles.elementaryNoticeCard}>
                  <GraduationCap size={20} color="#2563eb" style={{ marginLeft: 8 }} />
                  <Text style={styles.elementaryNoticeText}>
                    در مقطع ابتدایی، شما به عنوان آموزگار دوره ابتدایی تمام سوالات درسی پایه‌های اول تا ششم را دریافت می‌کنید.
                  </Text>
                </View>
              )}

              {/* Secondary Specialized Subjects */}
              {(educationLevel === 'secondary' || educationLevel === 'both') && (
                <View style={{ marginTop: 14 }}>
                  <Text style={[styles.modalInputLabel, { color: colors.text }]}>
                    دروس تخصصی تدریس (امکان انتخاب همزمان چند درس):
                  </Text>

                  {/* Search box for subjects */}
                  <View style={[styles.subjectSearchRow, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border }]}>
                    <Search size={16} color={colors.textLight} />
                    <TextInput
                      style={[styles.subjectSearchInput, { color: colors.text }]}
                      placeholder="جستجوی درس (مثال: ریاضی، شیمی، زبان...)"
                      placeholderTextColor={colors.textLight}
                      value={subjectSearchQuery}
                      onChangeText={setSubjectSearchQuery}
                      textAlign="right"
                    />
                  </View>

                  <View style={styles.subjectChipsWrap}>
                    {[
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
                    ]
                      .filter((s) => !subjectSearchQuery || s.includes(subjectSearchQuery))
                      .map((subj) => {
                        const isSelected = selectedSubjects.includes(subj);
                        return (
                          <TouchableOpacity
                            key={subj}
                            style={[
                              styles.subjectChip,
                              isSelected && styles.subjectChipActive,
                              { borderColor: isSelected ? colors.primary : colors.border },
                            ]}
                            onPress={() => toggleSubjectSelection(subj)}
                            activeOpacity={0.7}
                          >
                            {isSelected && <CheckCircle2 size={13} color="#ffffff" style={{ marginLeft: 4 }} />}
                            <Text
                              style={[
                                styles.subjectChipText,
                                isSelected && styles.subjectChipTextActive,
                                { color: isSelected ? '#ffffff' : colors.text },
                              ]}
                            >
                              {subj}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.modalSubmitBtn,
                  { backgroundColor: colors.primary, marginTop: 24 },
                  submittingWorkdesk && { opacity: 0.7 },
                ]}
                onPress={handleSaveWorkdeskSettings}
                disabled={submittingWorkdesk}
                activeOpacity={0.85}
              >
                {submittingWorkdesk ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>ذخیره تنظیمات میز کار</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  // Top Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  headerLogoContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  headerLogoImage: {
    width: 32,
    height: 32,
  },
  headerTitleColumn: {
    alignItems: 'flex-end',
  },
  headerLogoText: {
    fontSize: 18,
    fontFamily: FONT_FAMILY.bold,
    letterSpacing: -0.5,
  },
  headerLogoSub: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.regular,
    marginTop: -2,
  },

  // Stats Mini Bar
  statsBar: {
    flexDirection: 'row-reverse',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
  },
  statUnit: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.regular,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
  },

  // Hero Banner (3:4 aspect ratio, width larger)
  bannerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },

  // Tutorial Video Box
  videoBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  videoBoxRight: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBoxCenter: {
    flex: 1,
    paddingHorizontal: 12,
    alignItems: 'flex-end',
  },
  videoBoxTitle: {
    fontSize: 13.5,
    fontFamily: FONT_FAMILY.bold,
  },
  videoBoxSub: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.medium,
    marginTop: 2,
  },
  videoBoxLeft: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  // Online Card
  onlineCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    gap: 14,
  },
  onlineHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  onlineStatusTextCol: {
    alignItems: 'flex-end',
    flex: 1.2,
  },
  statusIndicatorRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  statusGlowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusTitle: {
    fontSize: 18,
    fontFamily: FONT_FAMILY.bold,
  },
  statusSubtitle: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 2,
    textAlign: 'right',
  },
  switchCol: {
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  switchHint: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bold,
  },
  characterContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  characterImage: {
    width: 76,
    height: 86,
  },
  characterChevron: {
    marginRight: -4,
  },

  // 4 Duration Pills
  durationsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  durationPill: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1.2,
  },
  checkCircleSmall: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationPillText: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.medium,
  },

  // Timer Banner
  timerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  timerDigits: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.bold,
    letterSpacing: 1,
  },
  timerLabelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.medium,
  },

  // Online Class Hero Card
  onlineClassHeroCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  onlineClassHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  onlineClassIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineClassTextCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  onlineClassTitle: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
    marginBottom: 2,
    textAlign: 'right',
  },
  onlineClassSub: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    lineHeight: 16,
    textAlign: 'right',
  },
  onlineClassBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  onlineClassSubBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineClassSubBtnText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },
  onlineClassMainBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  onlineClassMainBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
  },

  // 3 Action Cards
  threeCardsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  actionCardImageWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  actionCard3DImage: {
    width: 54,
    height: 54,
  },
  actionCardTitle: {
    fontSize: 12.5,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'center',
  },
  actionCardSub: {
    fontSize: 9.5,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  cardArrowCircle: {
    position: 'absolute',
    bottom: -8,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  // Conversations Section
  conversationsSection: {
    marginTop: 10,
    gap: 12,
  },
  segmentTabBar: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  segmentTabBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 16,
    gap: 6,
  },
  segmentTabBtnActive: {
    backgroundColor: '#2563eb',
    elevation: 3,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  segmentTabBtnInactive: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentTabText: {
    fontSize: 12.5,
    fontFamily: FONT_FAMILY.bold,
  },
  segmentCountPill: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 10,
  },
  segmentCountText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bold,
  },

  // Student Conversations List
  conversationsList: {
    gap: 10,
  },
  convCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#16a34a',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  convDetailsCol: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 3,
  },
  convTopRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  convStudentName: {
    fontSize: 13.5,
    fontFamily: FONT_FAMILY.bold,
  },
  convTime: {
    fontSize: 10.5,
    fontFamily: FONT_FAMILY.regular,
  },
  convBadgesRow: {
    flexDirection: 'row-reverse',
    gap: 6,
    marginVertical: 2,
  },
  badgePill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.medium,
    color: '#475569',
  },
  convMessageSnippet: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'right',
  },
  replyButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    elevation: 2,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  replyButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },

  // Bottom Card
  bottomCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  bottomLeftGraphic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomCenterContent: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  bottomTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  bottomTitle: {
    fontSize: 13.5,
    fontFamily: FONT_FAMILY.bold,
  },
  bottomSubtitle: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'right',
  },
  bottomWatchBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  bottomWatchBtnText: {
    color: '#2563eb',
    fontSize: 11,
    fontFamily: FONT_FAMILY.bold,
  },
  // Pending Questions Pool
  pendingPoolContainer: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
  },
  pendingPoolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pendingPoolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  pulsingDotLive: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#2563eb',
  },
  pendingPoolBadgeText: {
    fontSize: 10.5,
    fontFamily: FONT_FAMILY.bold,
    color: '#1e40af',
  },
  pendingPoolTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingPoolTitle: {
    fontSize: 14.5,
    fontFamily: FONT_FAMILY.bold,
  },
  pendingPoolSub: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'right',
    marginBottom: 12,
  },
  pendingReqCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  pendingReqTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reqPriceBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reqPriceText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bold,
    color: '#15803d',
  },
  reqStudentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reqStudentName: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
  },
  reqStudentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  reqStudentAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reqTitle: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
    marginBottom: 4,
  },
  reqDesc: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'right',
    lineHeight: 18,
    marginBottom: 10,
  },
  acceptReqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 10,
  },
  acceptReqBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontFamily: FONT_FAMILY.bold,
  },
  walletHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    elevation: 2,
  },
  walletHeaderBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },
  teacherHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  teacherTextCol: {
    alignItems: 'flex-end',
  },
  teacherFullName: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
  },
  teacherWalletSubtitle: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bold,
    marginTop: 2,
  },
  teacherAvatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#3b82f6',
  },
  teacherAvatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teacherAvatarLetter: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: FONT_FAMILY.bold,
  },
  escrowBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  escrowBadgeText: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bold,
    color: '#b45309',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  modalBox: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 20,
    padding: 18,
    elevation: 10,
  },
  modalBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 10,
  },
  modalBoxTitle: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalNoticeBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  modalNoticeText: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.regular,
    color: '#1e40af',
    lineHeight: 18,
    textAlign: 'right',
  },
  modalInputLabel: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
    marginBottom: 6,
    marginTop: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12.5,
    fontFamily: FONT_FAMILY.regular,
    marginBottom: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 10,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: FONT_FAMILY.bold,
  },
  stepperValueText: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
    minWidth: 70,
    textAlign: 'center',
  },
  calcBox: {
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  calcLabel: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.regular,
  },
  calcVal: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
  },
  insufficientWarning: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bold,
    color: '#ef4444',
    textAlign: 'right',
    marginTop: 8,
    lineHeight: 17,
  },
  modalSubmitBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
  },
  modalSectionDesc: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'right',
    marginBottom: 12,
    lineHeight: 18,
  },
  levelSelectorRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 12,
  },
  levelPill: {
    flex: 1,
    paddingVertical: 9,
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
  elementaryNoticeCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
  },
  elementaryNoticeText: {
    flex: 1,
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    color: '#1e40af',
    textAlign: 'right',
    lineHeight: 18,
  },
  subjectSearchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  subjectSearchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
  },
  subjectChipsWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    maxHeight: 180,
  },
  subjectChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#f8fafc',
  },
  subjectChipActive: {
    backgroundColor: '#2563eb',
  },
  subjectChipText: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.regular,
  },
  subjectChipTextActive: {
    color: '#ffffff',
    fontFamily: FONT_FAMILY.bold,
  },
});

export default TeacherCenterScreen;
