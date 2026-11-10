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
  AlertCircle,
  Calendar,
  Trash2,
  Settings,
  UserCheck,
} from 'lucide-react-native';
import * as jalaali from 'jalaali-js';
import {
  PERSIAN_MONTHS,
  toPersianNumbers,
  getCalendarGrid,
  getTodayJalali,
  formatJalaliStandard,
  getDaysInJalaliMonth,
} from '../../utils/date/jalaliHelper';
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

export interface DaySchedule {
  date: string; // Jalali YYYY-MM-DD e.g. 1405-08-25
  slots: string[]; // e.g. ["۳ تا ۴ و نیم", "۵ تا ۶ و نیم"]
}

const PERSIAN_DAY_NAMES = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
];

export const TeacherCenterScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();

  // Active Schedule & Calendar states
  const [availableSchedule, setAvailableSchedule] = useState<DaySchedule[]>([]);
  const [bookedDates, setBookedDates] = useState<string[]>([]);

  const todayJalali = getTodayJalali();
  const [calJy, setCalJy] = useState<number>(todayJalali.jy);
  const [calJm, setCalJm] = useState<number>(todayJalali.jm);
  const [calJd, setCalJd] = useState<number>(todayJalali.jd);

  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [conversations, setConversations] = useState<ConversationItem[]>(INITIAL_CONVERSATIONS);

  // Teacher Profile & Wallet states
  const [teacherName, setTeacherName] = useState<string>('همکار گرامی');
  const [teacherAvatar, setTeacherAvatar] = useState<string | null>('https://i.pravatar.cc/150?u=kitayar@teacher.com');
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Onboarding & Requirement checklist status
  const [onboardingStatus, setOnboardingStatus] = useState<{
    hasResume: boolean;
    hasPosts: boolean;
    hasSchedule: boolean;
    hasEducation: boolean;
  }>({
    hasResume: false,
    hasPosts: false,
    hasSchedule: false,
    hasEducation: false,
  });

  const handlePrevMonth = () => {
    if (calJm === 1) {
      setCalJm(12);
      setCalJy((prev) => prev - 1);
    } else {
      setCalJm((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calJm === 12) {
      setCalJm(1);
      setCalJy((prev) => prev + 1);
    } else {
      setCalJm((prev) => prev + 1);
    }
  };

  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [claimingReqId, setClaimingReqId] = useState<string | null>(null);

  const fetchServerData = async () => {
    try {
      setRefreshing(true);
      const [ovRes, convRes, reqRes, wallRes, clsRes, profRes, schedRes] = await Promise.allSettled([
        api.get('/teacher/center/overview'),
        api.get('/chat/conversations'),
        api.get('/teacher/center/requests?tab=pending&limit=5'),
        api.get('/teacher/center/wallet'),
        api.get('/teacher/center/classes'),
        api.get('/teacher/profile'),
        api.get('/teacher/schedule'),
      ]);

      let hasResume = false;
      let hasPosts = false;
      let hasEducation = false;
      let hasSchedule = false;

      // Always sync profile photo & full name directly from main profile
      if (profRes.status === 'fulfilled' && profRes.value.data?.success) {
        const pd = profRes.value.data.data;
        const ps = profRes.value.data.stats;
        if (pd.user?.fullName) setTeacherName(pd.user.fullName);
        else if (pd.fullName) setTeacherName(pd.fullName);
        const resolved = pd.avatar || pd.user?.avatar || (pd.user?._id ? `https://i.pravatar.cc/150?u=${pd.user._id}` : null);
        if (resolved) setTeacherAvatar(resolved);

        hasResume = Boolean(
          (pd.bio && pd.bio.trim().length > 0) ||
          (pd.resume?.experiences && pd.resume.experiences.length > 0) ||
          (pd.resume?.skills && pd.resume.skills.length > 0) ||
          (pd.resume?.education && pd.resume.education.length > 0) ||
          (pd.schools && pd.schools.length > 0)
        );

        hasPosts = Boolean(ps?.postsCount && ps.postsCount > 0);

        hasEducation = Boolean(
          pd.educationLevel &&
          Array.isArray(pd.teachingSubjects) &&
          pd.teachingSubjects.length > 0
        );
      }

      if (schedRes.status === 'fulfilled' && schedRes.value.data?.success && Array.isArray(schedRes.value.data.data)) {
        hasSchedule = schedRes.value.data.data.length > 0;
      } else if (profRes.status === 'fulfilled' && Array.isArray(profRes.value.data?.data?.availableSchedule)) {
        hasSchedule = profRes.value.data.data.availableSchedule.length > 0;
      }

      setOnboardingStatus({
        hasResume,
        hasPosts,
        hasSchedule,
        hasEducation,
      });

      if (ovRes.status === 'fulfilled' && ovRes.value.data?.success) {
        const d = ovRes.value.data.data;
        if (d.profileSummary) {
          if (!teacherName && d.profileSummary.fullName) setTeacherName(d.profileSummary.fullName);
          if (!teacherAvatar && d.profileSummary.avatar) setTeacherAvatar(d.profileSummary.avatar);
        }
        if (d.wallet?.balance !== undefined) {
          setWalletBalance(d.wallet.balance);
        }
      }

      if (wallRes.status === 'fulfilled' && wallRes.value.data?.success && wallRes.value.data.data?.balance !== undefined) {
        setWalletBalance(wallRes.value.data.data.balance);
      }

      // Fetch booked dates from scheduled classes
      if (clsRes.status === 'fulfilled' && clsRes.value.data?.success && Array.isArray(clsRes.value.data.data)) {
        const booked = clsRes.value.data.data
          .map((c: any) => c.date || c.scheduledDate)
          .filter(Boolean);
        setBookedDates(booked);
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



  const getFullAvatarUrl = (uri?: string | null) => {
    if (!uri) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherName || 'معلم')}&background=2563EB&color=fff&size=150`;
    }
    if (uri.startsWith('http')) return uri;
    const base = api.defaults.baseURL || 'https://api.kitayar.ir';
    return `${base}${uri.startsWith('/') ? '' : '/'}${uri}`;
  };

  const completedStepsCount = [
    onboardingStatus.hasResume,
    onboardingStatus.hasPosts,
    onboardingStatus.hasSchedule,
    onboardingStatus.hasEducation,
  ].filter(Boolean).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 1. TOP APP BAR (Complete Profile button on left & Profile info on right) */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeftActions}>
          <TouchableOpacity
            style={[styles.completeProfileBtn, { backgroundColor: isDark ? '#1e3a8a30' : '#eff6ff', borderColor: isDark ? '#1e40af' : '#bfdbfe' }]}
            onPress={() => navigation.navigate('ProfileScreen')}
            activeOpacity={0.8}
          >
            <UserCheck size={15} color="#2563eb" style={{ marginLeft: 5 }} />
            <Text style={styles.completeProfileBtnText}>تکمیل پروفایل</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.teacherHeaderInfo}
          onPress={() => navigation.navigate('ProfileScreen')}
          activeOpacity={0.8}
        >
          <View style={styles.teacherTextCol}>
            <Text style={[styles.teacherFullName, { color: colors.text }]}>
              {teacherName || 'همکار گرامی'}
            </Text>
            <Text style={[styles.teacherWalletSubtitle, { color: colors.primary }]}>
              موجودی کیف پول: {walletBalance.toLocaleString('fa-IR')} تومان
            </Text>
          </View>
          <Image
            source={{ uri: getFullAvatarUrl(teacherAvatar) }}
            style={styles.teacherAvatarImg}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchServerData} colors={[colors.primary]} />}
      >
        {/* 2. HERO BANNER */}
        <TouchableOpacity
          style={styles.bannerContainer}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('OnlineClassesScreen')}
        >
          <Image
            source={require('../../assets/image/classBanner.png')}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* 3. ONBOARDING & EARNING REQUIREMENTS CARD */}
        <View style={[styles.onboardingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Top Banner Row with 3D Character Illustration */}
          <View style={styles.onboardingHeaderRow}>
            <View style={styles.onboardingHeaderInfo}>
              <View style={[styles.onboardingBadge, { backgroundColor: isDark ? '#1e3a8a30' : '#eff6ff', borderColor: isDark ? '#1e40af' : '#bfdbfe' }]}>
                <Sparkles size={12} color="#2563eb" style={{ marginLeft: 4 }} />
                <Text style={styles.onboardingBadgeText}>راهنمای شروع درآمدزایی</Text>
              </View>
              <Text style={[styles.onboardingTitle, { color: colors.text }]}>
                برای شروع درآمدزایی باید این موارد را تکمیل کنید:
              </Text>
              <Text style={[styles.onboardingProgressText, { color: completedStepsCount === 4 ? '#16a34a' : colors.textLight }]}>
                {completedStepsCount === 4
                  ? 'تمامی ۴ مرحله تکمیل شدند ✓'
                  : `${toPersianNumbers(completedStepsCount)} از ۴ مرحله تکمیل شده است`}
              </Text>
            </View>

            <Image
              source={require('../../assets/image/activecarecter.png')}
              style={styles.onboardingCharacterImg}
              resizeMode="contain"
            />
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressBarTrack, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${(completedStepsCount / 4) * 100}%`,
                  backgroundColor: completedStepsCount === 4 ? '#16a34a' : '#2563eb',
                },
              ]}
            />
          </View>

          {/* 4 Interactive Checklist Steps */}
          <View style={styles.checklistWrap}>
            {/* ۱- تکمیل رزومه */}
            <TouchableOpacity
              style={[styles.checklistItem, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}
              onPress={() => navigation.navigate('ProfileScreen', { activeTab: 'resume' })}
              activeOpacity={0.75}
            >
              <View style={styles.checklistLeft}>
                <ChevronLeft size={16} color={colors.textLight} />
                <Text style={[styles.checklistStatusBadgeText, { color: onboardingStatus.hasResume ? '#16a34a' : '#ea580c' }]}>
                  {onboardingStatus.hasResume ? 'تکمیل شده' : 'اقدام کنید'}
                </Text>
              </View>
              <View style={styles.checklistRight}>
                <View style={styles.checklistTextCol}>
                  <Text style={[styles.checklistTitle, { color: colors.text }]}>۱. تکمیل رزومه</Text>
                  <Text style={[styles.checklistDesc, { color: colors.textLight }]}>سوابق تحصیلی، شغلی و بیوگرافی</Text>
                </View>
                <View style={[styles.checkIconCircle, { backgroundColor: onboardingStatus.hasResume ? '#dcfce7' : '#ffedd5' }]}>
                  {onboardingStatus.hasResume ? (
                    <CheckCircle2 size={18} color="#16a34a" />
                  ) : (
                    <AlertCircle size={18} color="#ea580c" />
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {/* ۲- افزودن پست و نمونه کار */}
            <TouchableOpacity
              style={[styles.checklistItem, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}
              onPress={() => navigation.navigate('NewPostScreen')}
              activeOpacity={0.75}
            >
              <View style={styles.checklistLeft}>
                <ChevronLeft size={16} color={colors.textLight} />
                <Text style={[styles.checklistStatusBadgeText, { color: onboardingStatus.hasPosts ? '#16a34a' : '#ea580c' }]}>
                  {onboardingStatus.hasPosts ? 'تکمیل شده' : 'اقدام کنید'}
                </Text>
              </View>
              <View style={styles.checklistRight}>
                <View style={styles.checklistTextCol}>
                  <Text style={[styles.checklistTitle, { color: colors.text }]}>۲. افزودن پست و نمونه کار</Text>
                  <Text style={[styles.checklistDesc, { color: colors.textLight }]}>معرفی تدریس و انتشار محتوا در تعامل</Text>
                </View>
                <View style={[styles.checkIconCircle, { backgroundColor: onboardingStatus.hasPosts ? '#dcfce7' : '#ffedd5' }]}>
                  {onboardingStatus.hasPosts ? (
                    <CheckCircle2 size={18} color="#16a34a" />
                  ) : (
                    <AlertCircle size={18} color="#ea580c" />
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {/* ۳- تنظیم برنامه تدریس */}
            <TouchableOpacity
              style={[styles.checklistItem, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}
              onPress={() => navigation.navigate('TeacherScheduleScreen')}
              activeOpacity={0.75}
            >
              <View style={styles.checklistLeft}>
                <ChevronLeft size={16} color={colors.textLight} />
                <Text style={[styles.checklistStatusBadgeText, { color: onboardingStatus.hasSchedule ? '#16a34a' : '#ea580c' }]}>
                  {onboardingStatus.hasSchedule ? 'تکمیل شده' : 'اقدام کنید'}
                </Text>
              </View>
              <View style={styles.checklistRight}>
                <View style={styles.checklistTextCol}>
                  <Text style={[styles.checklistTitle, { color: colors.text }]}>۳. تنظیم برنامه تدریس</Text>
                  <Text style={[styles.checklistDesc, { color: colors.textLight }]}>تعیین روزها و ساعات حضور در هفته</Text>
                </View>
                <View style={[styles.checkIconCircle, { backgroundColor: onboardingStatus.hasSchedule ? '#dcfce7' : '#ffedd5' }]}>
                  {onboardingStatus.hasSchedule ? (
                    <CheckCircle2 size={18} color="#16a34a" />
                  ) : (
                    <AlertCircle size={18} color="#ea580c" />
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {/* ۴- مقطع تحصیلی تدریس */}
            <TouchableOpacity
              style={[styles.checklistItem, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}
              onPress={() => navigation.navigate('OnlineClassSettingsScreen')}
              activeOpacity={0.75}
            >
              <View style={styles.checklistLeft}>
                <ChevronLeft size={16} color={colors.textLight} />
                <Text style={[styles.checklistStatusBadgeText, { color: onboardingStatus.hasEducation ? '#16a34a' : '#ea580c' }]}>
                  {onboardingStatus.hasEducation ? 'تکمیل شده' : 'اقدام کنید'}
                </Text>
              </View>
              <View style={styles.checklistRight}>
                <View style={styles.checklistTextCol}>
                  <Text style={[styles.checklistTitle, { color: colors.text }]}>۴. مقطع تحصیلی تدریس</Text>
                  <Text style={[styles.checklistDesc, { color: colors.textLight }]}>انتخاب مقاطع و دروس تخصصی تدریس</Text>
                </View>
                <View style={[styles.checkIconCircle, { backgroundColor: onboardingStatus.hasEducation ? '#dcfce7' : '#ffedd5' }]}>
                  {onboardingStatus.hasEducation ? (
                    <CheckCircle2 size={18} color="#16a34a" />
                  ) : (
                    <AlertCircle size={18} color="#ea580c" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

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

        {/* 4. ONLINE CLASS SECTION WITH 4 DEDICATED ACTION BOXES */}
        <View style={[styles.onlineClassHeroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.onlineClassHeroTop}>
            <View style={styles.onlineClassTextCol}>
              <Text style={[styles.onlineClassTitle, { color: colors.text }]}>کلاس‌های آنلاین اختصاصی</Text>
              <Text style={[styles.onlineClassSub, { color: colors.textLight }]}>
                برگزاری جلسات رفع اشکال زنده، ایجاد کلاس مجازی، گفتگوها و تنظیمات تدریس
              </Text>
            </View>
            <View style={[styles.onlineClassIconCircle, { backgroundColor: isDark ? '#1e3a8a40' : '#eff6ff' }]}>
              <Video size={24} color="#2563eb" />
            </View>
          </View>

          {/* 4 Feature Boxes (2x2 Grid) */}
          <View style={styles.fourBoxesGrid}>
            {/* Box 1: مدیریت کلاس‌ها */}
            <TouchableOpacity
              style={[styles.featureBox, { backgroundColor: isDark ? '#1e293b' : '#eff6ff', borderColor: '#bfdbfe' }]}
              onPress={() => navigation.navigate('OnlineClassesScreen')}
              activeOpacity={0.8}
            >
              <View style={[styles.featureBoxIconCircle, { backgroundColor: '#dbeafe' }]}>
                <Video size={22} color="#2563eb" />
              </View>
              <Text style={[styles.featureBoxTitle, { color: colors.text }]}>مدیریت کلاس‌ها</Text>
              <Text style={[styles.featureBoxSub, { color: colors.textLight }]}>کلاس‌ها و لینک جلسات</Text>
            </TouchableOpacity>

            {/* Box 2: ایجاد کلاس مجازی */}
            <TouchableOpacity
              style={[styles.featureBox, { backgroundColor: isDark ? '#064e3b20' : '#f0fdf4', borderColor: '#bbf7d0' }]}
              onPress={() => navigation.navigate('CreateVirtualClassScreen')}
              activeOpacity={0.8}
            >
              <View style={[styles.featureBoxIconCircle, { backgroundColor: '#dcfce7' }]}>
                <Plus size={22} color="#16a34a" />
              </View>
              <Text style={[styles.featureBoxTitle, { color: colors.text }]}>ایجاد کلاس مجازی</Text>
              <Text style={[styles.featureBoxSub, { color: colors.textLight }]}>جلسه زنده (۵۰ ت/نفر)</Text>
            </TouchableOpacity>

            {/* Box 3: گفتگوها (with Badge) */}
            <TouchableOpacity
              style={[styles.featureBox, { backgroundColor: isDark ? '#3b076420' : '#faf5ff', borderColor: '#e9d5ff' }]}
              onPress={() => navigation.navigate('TeacherConversationsScreen')}
              activeOpacity={0.8}
            >
              {conversations.length > 0 && (
                <View style={styles.featureBoxBadge}>
                  <Text style={styles.featureBoxBadgeText}>
                    {toPersianNumbers(conversations.length)}
                  </Text>
                </View>
              )}
              <View style={[styles.featureBoxIconCircle, { backgroundColor: '#f3e8ff' }]}>
                <MessageCircle size={22} color="#9333ea" />
              </View>
              <Text style={[styles.featureBoxTitle, { color: colors.text }]}>گفتگوها</Text>
              <Text style={[styles.featureBoxSub, { color: colors.textLight }]}>رفع اشکال و پیام‌ها</Text>
            </TouchableOpacity>

            {/* Box 4: تنظیمات */}
            <TouchableOpacity
              style={[styles.featureBox, { backgroundColor: isDark ? '#451a0320' : '#fffbeb', borderColor: '#fde68a' }]}
              onPress={() => navigation.navigate('OnlineClassSettingsScreen')}
              activeOpacity={0.8}
            >
              <View style={[styles.featureBoxIconCircle, { backgroundColor: '#fef3c7' }]}>
                <Settings size={22} color="#d97706" />
              </View>
              <Text style={[styles.featureBoxTitle, { color: colors.text }]}>تنظیمات تدریس</Text>
              <Text style={[styles.featureBoxSub, { color: colors.textLight }]}>تعرفه‌ها و مدت جلسات</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. 2 ACTION CARDS (مدیریت جزوه‌ها و کیف پول) */}
        <View style={styles.twoCardsRow}>
          {/* Card 1: مدیریت جزوه‌ها */}
          <TouchableOpacity
            style={[styles.actionCardHalf, { backgroundColor: colors.surface, borderColor: colors.border }]}
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
              بارگذاری، مدیریت و فروش جزوه‌ها
            </Text>
            <View style={[styles.cardArrowCircle, { backgroundColor: '#ea580c' }]}>
              <ChevronLeft size={16} color="#ffffff" strokeWidth={2.5} />
            </View>
          </TouchableOpacity>

          {/* Card 2: کیف پول */}
          <TouchableOpacity
            style={[styles.actionCardHalf, { backgroundColor: colors.surface, borderColor: colors.border }]}
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
            <Text style={[styles.actionCardTitle, { color: colors.text }]}>کیف پول و درآمدها</Text>
            <Text style={[styles.actionCardSub, { color: colors.textLight }]} numberOfLines={2}>
              مشاهده موجودی و تسویه‌حساب
            </Text>
            <View style={[styles.cardArrowCircle, { backgroundColor: '#2563eb' }]}>
              <ChevronLeft size={16} color="#ffffff" strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
        </View>

        {/* 7. PENDING STUDENT QUESTIONS POOL (۵ سوال در جریان دانش‌آموزان) */}
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

  // Onboarding & Requirement checklist Card
  onboardingCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 16,
    gap: 12,
    elevation: 3,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  onboardingHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  onboardingHeaderInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  onboardingCharacterImg: {
    width: 78,
    height: 85,
  },
  onboardingBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  onboardingBadgeText: {
    color: '#2563eb',
    fontSize: 11,
    fontFamily: FONT_FAMILY.bold,
  },
  onboardingTitle: {
    fontSize: 13.5,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
    lineHeight: 20,
  },
  onboardingProgressText: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.medium,
    marginTop: 4,
    textAlign: 'right',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  checklistWrap: {
    gap: 8,
    marginTop: 4,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  checklistRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  checklistLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checklistTextCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  checklistTitle: {
    fontSize: 12.5,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
  },
  checklistDesc: {
    fontSize: 10.5,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 2,
    textAlign: 'right',
  },
  checklistStatusBadgeText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bold,
  },
  checkIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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

  // Active Days / Schedule Card
  activeDaysCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 16,
    gap: 12,
  },
  activeDaysTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeDaysBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeDaysBadgeText: {
    fontSize: 10.5,
    fontFamily: FONT_FAMILY.bold,
    color: '#15803d',
  },
  activeDaysHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activeDaysTitle: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
  },
  activeDaysSub: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 2,
    textAlign: 'right',
  },
  activeDaysIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDaysSlotsPreview: {
    marginTop: 2,
    gap: 6,
  },
  previewLabel: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
  },
  previewSlotChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  previewSlotText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.medium,
  },
  emptyScheduleNotice: {
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  emptyScheduleText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'center',
    lineHeight: 18,
  },
  activeDaysFooterRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#bbf7d040',
  },
  openCalendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  openCalendarBtnText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
    color: '#15803d',
  },
  slotDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#bbf7d033',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  slotDurationText: {
    fontSize: 10.5,
    fontFamily: FONT_FAMILY.medium,
    color: '#15803d',
  },

  // Calendar Modal View
  calendarMonthHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNavTitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.bold,
  },
  monthNavSub: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 2,
  },
  calendarWeekdaysRow: {
    flexDirection: 'row-reverse',
    marginBottom: 8,
  },
  calendarWeekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  calendarWeekdayText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },
  calendarGridWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  calendarDayCellEmpty: {
    width: `${(100 - 6 * 1) / 7}%`,
    height: 48,
  },
  calendarDayCell: {
    width: `${(100 - 6 * 1) / 7}%`,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  calendarDayNum: {
    fontSize: 13,
  },
  slotDotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  greenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16a34a',
  },
  slotCountText: {
    fontSize: 9.5,
    fontFamily: FONT_FAMILY.bold,
    color: '#15803d',
  },
  calendarLegendCard: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  legendIndicator: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
  },

  // Day Slot Config View
  dayConfigHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backToCalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  backToCalText: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.bold,
  },
  dayConfigTitle: {
    fontSize: 14.5,
    fontFamily: FONT_FAMILY.bold,
  },
  dayConfigSub: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 2,
  },
  sectionWrap: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
  },
  emptySlotsNotice: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    alignItems: 'center',
  },
  emptySlotsText: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'center',
    lineHeight: 18,
  },
  slotItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  deleteSlotBtn: {
    padding: 6,
  },
  slotItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  oneAndHalfBadge: {
    backgroundColor: '#bbf7d0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  oneAndHalfText: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bold,
    color: '#15803d',
  },
  slotItemText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
  },
  addSlotCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  addSlotHelper: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'right',
    marginTop: 2,
    marginBottom: 10,
    lineHeight: 17,
  },
  presetsRow: {
    flexDirection: 'row-reverse',
    gap: 6,
    marginBottom: 10,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipText: {
    fontSize: 10.5,
    fontFamily: FONT_FAMILY.medium,
  },
  slotInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  slotHourTextInput: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 12.5,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'right',
  },
  addSlotActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 4,
  },
  addSlotActionText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontFamily: FONT_FAMILY.bold,
  },
  calculatedPreviewRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#dcfce740',
  },
  calculatedPreviewText: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.bold,
    color: '#15803d',
  },
  repeatSectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  repeatDesc: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'right',
    marginTop: 2,
    marginBottom: 10,
    lineHeight: 17,
  },
  weekdaysSelectionRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  weekdayPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  weekdayPillText: {
    fontSize: 11,
  },
  saveScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    marginBottom: 10,
  },
  saveScheduleBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontFamily: FONT_FAMILY.bold,
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
  twoCardsRow: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  actionCardHalf: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
  headerLeftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completeProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  completeProfileBtnText: {
    color: '#2563eb',
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },
  profileHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  profileHeaderBtnText: {
    color: '#2563eb',
    fontSize: 11.5,
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
  // Main Embedded Calendar
  mainCalendarCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  mainCalendarHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainCalMonthTitle: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
  },
  mainCalSub: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 2,
  },
  calWeekdaysRow: {
    flexDirection: 'row-reverse',
    marginBottom: 8,
  },
  calWeekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  calWeekdayText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },
  calGridWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  calDayCellEmpty: {
    width: '12%',
    height: 44,
  },
  calDayCell: {
    width: '12%',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 3,
  },
  calDayNum: {
    fontSize: 12,
  },
  bookedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#2563eb',
    marginTop: 3,
  },
  activeSlotDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16a34a',
    marginTop: 3,
  },
  calLegendRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
    marginTop: 10,
    borderTopWidth: 1,
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  manageScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
  },
  manageScheduleBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontFamily: FONT_FAMILY.bold,
  },
  // 4 Action Boxes Grid
  fourBoxesGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
  },
  featureBox: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 110,
  },
  featureBoxIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureBoxTitle: {
    fontSize: 12.5,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'center',
  },
  featureBoxSub: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'center',
    marginTop: 2,
  },
  featureBoxBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBoxBadgeText: {
    color: '#ffffff',
    fontSize: 10,
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
    textAlign: 'right',
  },
  teacherWalletSubtitle: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bold,
    marginTop: 2,
    textAlign: 'right',
  },
  teacherAvatarImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#2563eb',
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
