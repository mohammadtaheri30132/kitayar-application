import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
  Modal,
  TextInput,
  Share,
  RefreshControl,
  Switch,
} from 'react-native';
import { showConfirm, showWarning, showSuccess } from '../../components/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../api/axiosConfig';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Menu,
  ChevronRight,
  Plus,
  Grid,
  Briefcase,
  FolderOpen,
  Play,
  Video,
  Phone,
  MessageSquare,
  Info,
  LogOut,
  CheckCircle2,
  MapPin,
  School,
  GraduationCap,
  Award,
  X,
  Share2,
  Edit3,
  Trash2,
  Sparkles,
  BookMarked,
  Check,
  Calendar,
  Layers,
  TrendingUp,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 36) / 3;

export interface PostItem {
  id: string;
  type: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl: string;
  title: string;
  likes: number;
  views: number;
  date: string;
}

export interface ExperienceItem {
  id: string;
  title: string;
  school: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  field: string;
  university: string;
  startDate?: string;
  endDate?: string;
  grade?: string;
}

export interface CertificateItem {
  id: string;
  title: string;
  issuer: string;
  year?: string;
  hours?: string;
}

export interface HonorItem {
  id: string;
  title: string;
  issuer: string;
  year?: string;
  type?: string;
}

export interface TeacherStats {
  classesCount: number;
  studentsCount: number;
  postsCount: number;
  experienceYears: number;
}

const POPULAR_SKILL_SUGGESTIONS = [
  'روش تدریس فعال',
  'بازی‌وارسازی در یادگیری (گیمیفیکیشن)',
  'ارزشیابی توصیفی و کیفی',
  'تولید محتوای الکترونیکی',
  'آزمون‌سازی هوشمند',
  'مدیریت رفتار و نظم کلاس',
  'هوش مصنوعی در تدریس',
  'طراحی آموزشی و طرح درس',
  'آموزش تعاملی و گروهی',
  'مهارت‌های سواد دیجیتال',
  'تدریس آنلاین و ترکیبی',
  'مشاوره تحصیلی دانش‌آموزان',
];

export const ProfileScreen = ({ navigation }: any) => {
  const { logout } = useContext(AuthContext);
  const { colors, isDark } = useTheme();

  // Basic Profile State
  const [fullName, setFullName] = useState('معلم کیتایار');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [headline, setHeadline] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [avatarUri, setAvatarUri] = useState('https://i.pravatar.cc/150?u=kitayar@teacher.com');
  const [category, setCategory] = useState('آموزگار');
  const [position, setPosition] = useState('معلم');

  // Stats State (Live from Server)
  const [stats, setStats] = useState<TeacherStats>({
    classesCount: 0,
    studentsCount: 0,
    postsCount: 0,
    experienceYears: 0,
  });

  // Resume State (Live from Server)
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [education, setEducation] = useState<EducationItem[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [honors, setHonors] = useState<HonorItem[]>([]);

  // Active Tab: 'posts' | 'resume' | 'notes'
  const [activeTab, setActiveTab] = useState<'posts' | 'resume' | 'notes'>('resume');

  // Posts State
  const [posts, setPosts] = useState<PostItem[]>([]);

  // Loading & Refreshing
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modals Visibility
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [contactUsModalVisible, setContactUsModalVisible] = useState(false);
  const [aboutUsModalVisible, setAboutUsModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);
  const [createPostVisible, setCreatePostVisible] = useState(false);

  // Resume Modals
  const [expModalVisible, setExpModalVisible] = useState(false);
  const [eduModalVisible, setEduModalVisible] = useState(false);
  const [skillsModalVisible, setSkillsModalVisible] = useState(false);
  const [certModalVisible, setCertModalVisible] = useState(false);
  const [honorModalVisible, setHonorModalVisible] = useState(false);

  // Forms state for adding items
  const [expForm, setExpForm] = useState({
    title: '',
    school: '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
  });

  const [eduForm, setEduForm] = useState({
    degree: 'کارشناسی',
    field: '',
    university: '',
    startDate: '',
    endDate: '',
    grade: '',
  });

  const [customSkillInput, setCustomSkillInput] = useState('');

  const [certForm, setCertForm] = useState({
    title: '',
    issuer: '',
    year: '',
    hours: '',
  });

  const [honorForm, setHonorForm] = useState({
    title: '',
    issuer: '',
    year: '',
    type: 'تقدیرنامه',
  });

  // Edit Basic Profile Form
  const [editProfileForm, setEditProfileForm] = useState({
    fullName: '',
    headline: '',
    bio: '',
    schoolName: '',
    city: '',
    province: '',
    experienceYears: '0',
  });

  // Create Post Form State
  const [newPostType, setNewPostType] = useState<'image' | 'video'>('image');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostUrl, setNewPostUrl] = useState('');

  // 1. Fetch Profile & Resume Data from Server
  const fetchProfile = async () => {
    try {
      const [profileRes, postsRes] = await Promise.allSettled([
        api.get('/teacher/profile'),
        api.get('/teacher/community/posts?filter=my_posts&limit=30'),
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value.data?.success) {
        const d = profileRes.value.data.data;
        const s = profileRes.value.data.stats;

        if (d.user?.fullName) setFullName(d.user.fullName);
        else if (d.fullName) setFullName(d.fullName);

        if (d.user?.username) setPhoneNumber(d.user.username);
        if (d.headline) setHeadline(d.headline);
        if (d.bio) setBio(d.bio);
        if (d.avatar) setAvatarUri(d.avatar);
        if (d.city) setCity(d.city);
        if (d.province) setProvince(d.province);
        if (d.schools && d.schools.length > 0) setSchoolName(d.schools[0]);
        else if (d.school) setSchoolName(d.school);
        if (d.category) setCategory(d.category);
        if (d.position) setPosition(d.position);

        if (d.resume) {
          if (Array.isArray(d.resume.experiences)) setExperiences(d.resume.experiences);
          if (Array.isArray(d.resume.education)) setEducation(d.resume.education);
          if (Array.isArray(d.resume.skills)) setSkills(d.resume.skills);
          if (Array.isArray(d.resume.certificates)) setCertificates(d.resume.certificates);
          if (Array.isArray(d.resume.honors)) setHonors(d.resume.honors);
        }

        if (s) {
          setStats(s);
        }
      }

      if (postsRes.status === 'fulfilled' && postsRes.value.data?.success) {
        const rawPosts = postsRes.value.data.data || [];
        const mapped: PostItem[] = rawPosts.map((p: any) => ({
          id: p._id || p.id,
          type: p.images && p.images.length > 0 && p.images[0].endsWith('.mp4') ? 'video' : 'image',
          mediaUrl: (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=500&auto=format&fit=crop',
          thumbnailUrl: (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=500&auto=format&fit=crop',
          title: p.content || 'پست آموزشی و تدریس',
          likes: p.likeCount || 0,
          views: p.viewCount || 0,
          date: 'اخیر',
        }));
        setPosts(mapped);
      }
    } catch (error) {
      console.error('Error fetching profile from server:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchProfile();
  };

  // 2. Calculate Resume Completion Percentage
  const completionPercentage = useMemo(() => {
    let score = 0;
    if (fullName && fullName.trim() && fullName !== 'معلم کیتایار') score += 10;
    if (headline && headline.trim()) score += 15;
    if (bio && bio.trim()) score += 15;
    if (schoolName && schoolName.trim()) score += 10;
    if (experiences.length > 0) score += 20;
    if (education.length > 0) score += 15;
    if (skills.length > 0) score += 10;
    if (certificates.length > 0 || honors.length > 0) score += 5;
    return Math.min(100, score);
  }, [fullName, headline, bio, schoolName, experiences, education, skills, certificates, honors]);

  // 3. Save Basic Profile Info
  const handleOpenEditProfile = () => {
    setEditProfileForm({
      fullName,
      headline,
      bio,
      schoolName,
      city,
      province,
      experienceYears: String(stats.experienceYears || 0),
    });
    setEditProfileModalVisible(true);
  };

  const handleSaveEditProfile = async () => {
    if (!editProfileForm.fullName.trim()) {
      showWarning('نام و نام خانوادگی نمی‌تواند خالی باشد');
      return;
    }

    try {
      setIsSaving(true);
      const res = await api.put('/teacher/profile', {
        fullName: editProfileForm.fullName.trim(),
        headline: editProfileForm.headline.trim(),
        bio: editProfileForm.bio.trim(),
        schools: editProfileForm.schoolName.trim() ? [editProfileForm.schoolName.trim()] : [],
        city: editProfileForm.city.trim(),
        province: editProfileForm.province.trim(),
        experienceYears: parseInt(editProfileForm.experienceYears) || 0,
      });

      if (res.data?.success) {
        setFullName(editProfileForm.fullName.trim());
        setHeadline(editProfileForm.headline.trim());
        setBio(editProfileForm.bio.trim());
        setSchoolName(editProfileForm.schoolName.trim());
        setCity(editProfileForm.city.trim());
        setProvince(editProfileForm.province.trim());
        setStats((prev) => ({
          ...prev,
          experienceYears: parseInt(editProfileForm.experienceYears) || prev.experienceYears,
        }));
        setEditProfileModalVisible(false);
        showSuccess('مشخصات کاربری با موفقیت در سرور به‌روزرسانی شد');
      }
    } catch (err) {
      showWarning('خطا در ذخیره‌سازی اطلاعات در سرور');
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Resume Mutations (Connected to Server)
  // Experience
  const handleAddExperience = async () => {
    if (!expForm.title.trim() || !expForm.school.trim() || !expForm.startDate.trim()) {
      showWarning('لطفاً عنوان سمت، نام مدرسه و سال شروع را وارد کنید');
      return;
    }

    try {
      setIsSaving(true);
      const res = await api.post('/teacher/profile/resume/experience', expForm);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setExperiences(res.data.data);
        setExpModalVisible(false);
        setExpForm({
          title: '',
          school: '',
          location: '',
          startDate: '',
          endDate: '',
          isCurrent: false,
          description: '',
        });
        showSuccess('سابقه تدریس جدید با موفقیت ثبت شد');
      }
    } catch (err) {
      showWarning('خطا در ثبت سابقه در سرور');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExperience = (id: string, title: string) => {
    showConfirm({
      title: 'حذف سابقه تدریس',
      message: `آیا از حذف سابقه «${title}» اطمینان دارید؟`,
      confirmText: 'حذف',
      cancelText: 'انصراف',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await api.delete(`/teacher/profile/resume/experience/${id}`);
          if (res.data?.success && Array.isArray(res.data.data)) {
            setExperiences(res.data.data);
            showSuccess('سابقه مورد نظر با موفقیت حذف شد');
          }
        } catch (e) {
          showWarning('خطا در حذف سابقه تدریس');
        }
      },
    });
  };

  // Education
  const handleAddEducation = async () => {
    if (!eduForm.field.trim() || !eduForm.university.trim()) {
      showWarning('لطفاً رشته تحصیلی و نام دانشگاه را وارد نمایید');
      return;
    }

    try {
      setIsSaving(true);
      const res = await api.post('/teacher/profile/resume/education', eduForm);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setEducation(res.data.data);
        setEduModalVisible(false);
        setEduForm({
          degree: 'کارشناسی',
          field: '',
          university: '',
          startDate: '',
          endDate: '',
          grade: '',
        });
        showSuccess('مدرک تحصیلی با موفقیت ثبت شد');
      }
    } catch (err) {
      showWarning('خطا در ثبت مدرک تحصیلی');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEducation = (id: string, field: string) => {
    showConfirm({
      title: 'حذف مدرک تحصیلی',
      message: `آیا از حذف مدرک «${field}» اطمینان دارید؟`,
      confirmText: 'حذف',
      cancelText: 'انصراف',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await api.delete(`/teacher/profile/resume/education/${id}`);
          if (res.data?.success && Array.isArray(res.data.data)) {
            setEducation(res.data.data);
            showSuccess('مدرک تحصیلی با موفقیت حذف شد');
          }
        } catch (e) {
          showWarning('خطا در حذف مدرک تحصیلی');
        }
      },
    });
  };

  // Skills
  const handleToggleSkill = async (skillName: string) => {
    const exists = skills.includes(skillName);
    const updatedSkills = exists
      ? skills.filter((s) => s !== skillName)
      : [...skills, skillName];

    try {
      const res = await api.put('/teacher/profile/resume/skills', { skills: updatedSkills });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setSkills(res.data.data);
      }
    } catch (e) {
      showWarning('خطا در به‌روزرسانی مهارت‌ها');
    }
  };

  const handleAddCustomSkill = async () => {
    if (!customSkillInput.trim()) return;
    const skillName = customSkillInput.trim();
    if (skills.includes(skillName)) {
      showWarning('این مهارت قبلاً اضافه شده است');
      return;
    }
    const updatedSkills = [...skills, skillName];
    try {
      const res = await api.put('/teacher/profile/resume/skills', { skills: updatedSkills });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setSkills(res.data.data);
        setCustomSkillInput('');
        showSuccess(`مهارت «${skillName}» افزوده شد`);
      }
    } catch (e) {
      showWarning('خطا در ذخیره مهارت');
    }
  };

  // Certificates
  const handleAddCertificate = async () => {
    if (!certForm.title.trim() || !certForm.issuer.trim()) {
      showWarning('لطفاً عنوان دوره و مرجع صادرکننده را وارد کنید');
      return;
    }

    try {
      setIsSaving(true);
      const res = await api.post('/teacher/profile/resume/certificate', certForm);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setCertificates(res.data.data);
        setCertModalVisible(false);
        setCertForm({ title: '', issuer: '', year: '', hours: '' });
        showSuccess('گواهینامه دوره با موفقیت ثبت شد');
      }
    } catch (err) {
      showWarning('خطا در ثبت دوره و گواهینامه');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCertificate = (id: string, title: string) => {
    showConfirm({
      title: 'حذف دوره / گواهینامه',
      message: `آیا از حذف «${title}» اطمینان دارید؟`,
      confirmText: 'حذف',
      cancelText: 'انصراف',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await api.delete(`/teacher/profile/resume/certificate/${id}`);
          if (res.data?.success && Array.isArray(res.data.data)) {
            setCertificates(res.data.data);
            showSuccess('گواهینامه حذف شد');
          }
        } catch (e) {
          showWarning('خطا در حذف گواهینامه');
        }
      },
    });
  };

  // Honors
  const handleAddHonor = async () => {
    if (!honorForm.title.trim() || !honorForm.issuer.trim()) {
      showWarning('لطفاً عنوان افتخار و سازمان اهداکننده را وارد کنید');
      return;
    }

    try {
      setIsSaving(true);
      const res = await api.post('/teacher/profile/resume/honor', honorForm);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setHonors(res.data.data);
        setHonorModalVisible(false);
        setHonorForm({ title: '', issuer: '', year: '', type: 'تقدیرنامه' });
        showSuccess('افتخار / اثر با موفقیت افزوده شد');
      }
    } catch (err) {
      showWarning('خطا در ثبت افتخار');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteHonor = (id: string, title: string) => {
    showConfirm({
      title: 'حذف افتخار / تقدیرنامه',
      message: `آیا از حذف «${title}» اطمینان دارید؟`,
      confirmText: 'حذف',
      cancelText: 'انصراف',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await api.delete(`/teacher/profile/resume/honor/${id}`);
          if (res.data?.success && Array.isArray(res.data.data)) {
            setHonors(res.data.data);
            showSuccess('افتخار حذف شد');
          }
        } catch (e) {
          showWarning('خطا در حذف افتخار');
        }
      },
    });
  };

  // 5. Create Post (Community Server API)
  const handleCreatePost = async () => {
    if (!newPostTitle.trim()) {
      showWarning('لطفاً متن یا عنوان پست آموزشی را بنویسید');
      return;
    }

    try {
      setIsSaving(true);
      const imagesPayload = newPostUrl.trim() ? [newPostUrl.trim()] : [];
      const res = await api.post('/teacher/community/posts', {
        content: newPostTitle.trim(),
        images: imagesPayload,
      });

      if (res.data?.success && res.data.data) {
        const created = res.data.data;
        const newPostItem: PostItem = {
          id: created._id || created.id,
          type: newPostType,
          mediaUrl: newPostUrl.trim() || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=500&auto=format&fit=crop',
          thumbnailUrl: newPostUrl.trim() || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=500&auto=format&fit=crop',
          title: created.content,
          likes: 0,
          views: 1,
          date: 'همین الان',
        };
        setPosts([newPostItem, ...posts]);
        setStats((prev) => ({ ...prev, postsCount: prev.postsCount + 1 }));
        setCreatePostVisible(false);
        setNewPostTitle('');
        setNewPostUrl('');
        showSuccess('پست آموزشی شما با موفقیت در تالار تعامل منتشر گردید');
      }
    } catch (err) {
      showWarning('خطا در انتشار پست در سرور');
    } finally {
      setIsSaving(false);
    }
  };

  // 6. Share Resume
  const handleShareResume = async () => {
    try {
      const expList = experiences
        .map((e) => `• ${e.title} در ${e.school} (${e.startDate} تا ${e.isCurrent ? 'اکنون' : e.endDate})`)
        .join('\n');
      const eduList = education
        .map((e) => `• ${e.degree} ${e.field} (${e.university})`)
        .join('\n');
      const skillsList = skills.join(' ، ');

      const message =
        `📋 رزومه رسمی معلم در سامانه کیتایار\n\n` +
        `👤 نام: ${fullName}\n` +
        `🏷️ عنوان: ${headline || `${position} • ${category}`}\n` +
        `🏫 مدرسه: ${schoolName || 'تعیین نشده'}\n` +
        `📍 شهر/منطقه: ${city || 'ایران'}\n` +
        (expList ? `\n💼 سوابق تدریس:\n${expList}\n` : '') +
        (eduList ? `\n🎓 مدارک تحصیلی:\n${eduList}\n` : '') +
        (skillsList ? `\n⭐ مهارت‌های تدریس:\n${skillsList}\n` : '') +
        `\n📲 کیتایار • یار هوشمند معلم`;

      await Share.share({ message });
    } catch (e) {
      // ignore
    }
  };

  const handleLogout = () => {
    setMenuModalVisible(false);
    showConfirm({
      title: 'خروج از حساب',
      message: 'آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟',
      confirmText: 'خروج',
      cancelText: 'انصراف',
      isDestructive: true,
      onConfirm: async () => {
        await logout();
      },
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.centerBox, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textLight }]}>در حال بارگذاری اطلاعات رزومه از سرور...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {navigation?.canGoBack && navigation.canGoBack() ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <ChevronRight color={colors.text} size={26} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}

        <Text style={[styles.headerTitle, { color: colors.text }]}>{fullName}</Text>

        <TouchableOpacity onPress={() => setMenuModalVisible(true)} style={styles.headerBtn}>
          <Menu color={colors.text} size={26} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} />}
      >
        {/* Cover Banner (LinkedIn Style) */}
        <View style={styles.bannerContainer}>
          <View style={[styles.bannerGradient, { backgroundColor: colors.primary }]}>
            <View style={styles.bannerBadge}>
              <School size={14} color="#fff" />
              <Text style={styles.bannerBadgeText}>کیتایار • آموزش و پرورش</Text>
            </View>
          </View>

          {/* Avatar */}
          <View style={[styles.avatarWrapper, { borderColor: colors.surface, backgroundColor: colors.surface }]}>
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            <View style={styles.verifiedBadge}>
              <CheckCircle2 size={18} color="#0284c7" fill="#fff" />
            </View>
          </View>
        </View>

        {/* Profile Info Section */}
        <View style={[styles.profileInfoSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.nameRow}>
            <Text style={[styles.profileName, { color: colors.text }]}>{fullName}</Text>
          </View>

          <Text style={[styles.profileHeadline, { color: colors.textLight }]}>
            {headline || `${position} رسمی • ${category}`}
          </Text>

          <View style={styles.metaRow}>
            <MapPin size={13} color={colors.textLight} />
            <Text style={[styles.metaText, { color: colors.textLight }]}>
              {schoolName || 'مدرسه ثبت نشده'} {city ? `• ${city}` : ''}
            </Text>
          </View>

          {bio ? <Text style={[styles.bioText, { color: colors.text }]}>{bio}</Text> : null}

          {/* Live Server Stats Row */}
          <View style={[styles.statsRow, { borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{posts.length || stats.postsCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textLight }]}>پست‌ها</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{stats.studentsCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textLight }]}>دانش‌آموز</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{stats.classesCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textLight }]}>کلاس</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {stats.experienceYears > 0 ? `${stats.experienceYears} سال` : `${experiences.length} دوره`}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textLight }]}>سابقه</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
              onPress={() => setCreatePostVisible(true)}
              activeOpacity={0.85}
            >
              <Plus size={18} color="#fff" />
              <Text style={styles.primaryActionText}>پست جدید</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryActionBtn, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc' }]}
              onPress={handleOpenEditProfile}
              activeOpacity={0.85}
            >
              <Edit3 size={16} color={colors.text} />
              <Text style={[styles.secondaryActionText, { color: colors.text }]}>ویرایش پروفایل</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconActionBtn, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc' }]}
              onPress={handleShareResume}
              activeOpacity={0.85}
            >
              <Share2 size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation: Resume | Posts | Notes */}
        <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'resume' && [styles.activeTabBtn, { borderBottomColor: colors.primary }]]}
            onPress={() => setActiveTab('resume')}
          >
            <Briefcase size={18} color={activeTab === 'resume' ? colors.primary : colors.textLight} />
            <Text style={[styles.tabBtnText, { color: activeTab === 'resume' ? colors.primary : colors.textLight }]}>
              رزومه و سوابق
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'posts' && [styles.activeTabBtn, { borderBottomColor: colors.primary }]]}
            onPress={() => setActiveTab('posts')}
          >
            <Grid size={18} color={activeTab === 'posts' ? colors.primary : colors.textLight} />
            <Text style={[styles.tabBtnText, { color: activeTab === 'posts' ? colors.primary : colors.textLight }]}>
              پست‌ها ({posts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'notes' && [styles.activeTabBtn, { borderBottomColor: colors.primary }]]}
            onPress={() => setActiveTab('notes')}
          >
            <FolderOpen size={18} color={activeTab === 'notes' ? colors.primary : colors.textLight} />
            <Text style={[styles.tabBtnText, { color: activeTab === 'notes' ? colors.primary : colors.textLight }]}>
              جزوات و طرح درس
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: RESUME & EXPERIENCE (Dynamic Builder) */}
        {activeTab === 'resume' && (
          <View style={styles.resumeContainer}>
            {/* Resume Completion Progress Card */}
            <View style={[styles.completionCard, { backgroundColor: isDark ? '#1e293b' : '#f0fdf4', borderColor: colors.border }]}>
              <View style={styles.completionHeader}>
                <View style={styles.completionTitleWrap}>
                  <Sparkles size={18} color="#16a34a" />
                  <Text style={[styles.completionTitle, { color: colors.text }]}>درصد تکمیل رزومه فرهنگیان</Text>
                </View>
                <Text style={[styles.completionBadge, { color: '#16a34a' }]}>{completionPercentage}٪</Text>
              </View>

              <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#dcfce7' }]}>
                <View style={[styles.progressBarFill, { width: `${completionPercentage}%`, backgroundColor: '#16a34a' }]} />
              </View>

              <Text style={[styles.completionHint, { color: colors.textLight }]}>
                {completionPercentage < 50
                  ? 'برای دریافت پیشنهادات تدریس و رزومه کامل، سوابق و مدارک تحصیلی خود را ثبت نمایید.'
                  : completionPercentage < 90
                  ? 'عالی است! با افزودن گواهینامه‌های ضمن خدمت و افتخارات، رزومه خود را متمایز کنید.'
                  : '⭐ تبریک! رزومه آموزشی شما در بالاترین سطح استاندارد قرار دارد.'}
              </Text>
            </View>

            {/* 1. Teaching Experience Section */}
            <View style={[styles.resumeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.resumeCardHeader}>
                <View style={styles.sectionTitleRow}>
                  <School size={20} color={colors.primary} />
                  <Text style={[styles.resumeCardTitle, { color: colors.text }]}>سوابق تدریس در مدارس</Text>
                </View>
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: `${colors.primary}15` }]}
                  onPress={() => setExpModalVisible(true)}
                >
                  <Plus size={15} color={colors.primary} />
                  <Text style={[styles.addBtnText, { color: colors.primary }]}>افزودن</Text>
                </TouchableOpacity>
              </View>

              {experiences.length === 0 ? (
                <View style={styles.emptySectionBox}>
                  <Text style={[styles.emptySectionText, { color: colors.textLight }]}>
                    هنوز سابقه تدریسی در مدارس ثبت نشده است.
                  </Text>
                  <TouchableOpacity style={styles.emptyActionBtn} onPress={() => setExpModalVisible(true)}>
                    <Text style={[styles.emptyActionBtnText, { color: colors.primary }]}>+ اولین سابقه را ثبت کنید</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                experiences.map((exp, index) => (
                  <View key={exp.id || index} style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                    <View style={styles.timelineContent}>
                      <View style={styles.itemTitleRow}>
                        <TouchableOpacity
                          onPress={() => handleDeleteExperience(exp.id, exp.title)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </TouchableOpacity>
                        <Text style={[styles.timelineRole, { color: colors.text }]}>{exp.title}</Text>
                      </View>
                      <Text style={[styles.timelineCompany, { color: colors.textLight }]}>
                        {exp.school} {exp.location ? `(${exp.location})` : ''}
                      </Text>
                      <Text style={[styles.timelinePeriod, { color: colors.textLight }]}>
                        {exp.startDate} - {exp.isCurrent ? 'تاکنون' : exp.endDate || 'پایان دوره'}
                      </Text>
                      {exp.description ? (
                        <Text style={[styles.itemDesc, { color: colors.text }]}>{exp.description}</Text>
                      ) : null}
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* 2. Education Degrees Section */}
            <View style={[styles.resumeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.resumeCardHeader}>
                <View style={styles.sectionTitleRow}>
                  <GraduationCap size={20} color={colors.primary} />
                  <Text style={[styles.resumeCardTitle, { color: colors.text }]}>تحصیلات و مدارک دانشگاهی</Text>
                </View>
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: `${colors.primary}15` }]}
                  onPress={() => setEduModalVisible(true)}
                >
                  <Plus size={15} color={colors.primary} />
                  <Text style={[styles.addBtnText, { color: colors.primary }]}>افزودن</Text>
                </TouchableOpacity>
              </View>

              {education.length === 0 ? (
                <View style={styles.emptySectionBox}>
                  <Text style={[styles.emptySectionText, { color: colors.textLight }]}>
                    مدرک تحصیلی یا دانشگاهی ثبت نشده است.
                  </Text>
                  <TouchableOpacity style={styles.emptyActionBtn} onPress={() => setEduModalVisible(true)}>
                    <Text style={[styles.emptyActionBtnText, { color: colors.primary }]}>+ ثبت مدرک دانشگاهی</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                education.map((edu, index) => (
                  <View key={edu.id || index} style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                    <View style={styles.timelineContent}>
                      <View style={styles.itemTitleRow}>
                        <TouchableOpacity
                          onPress={() => handleDeleteEducation(edu.id, edu.field)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </TouchableOpacity>
                        <Text style={[styles.timelineRole, { color: colors.text }]}>
                          {edu.degree} {edu.field}
                        </Text>
                      </View>
                      <Text style={[styles.timelineCompany, { color: colors.textLight }]}>{edu.university}</Text>
                      {edu.startDate || edu.endDate ? (
                        <Text style={[styles.timelinePeriod, { color: colors.textLight }]}>
                          {edu.startDate} - {edu.endDate || 'فارغ‌التحصیل'}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* 3. Skills & Competencies Section */}
            <View style={[styles.resumeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.resumeCardHeader}>
                <View style={styles.sectionTitleRow}>
                  <Award size={20} color={colors.primary} />
                  <Text style={[styles.resumeCardTitle, { color: colors.text }]}>مهارت‌ها و شایستگی‌های تدریس</Text>
                </View>
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: `${colors.primary}15` }]}
                  onPress={() => setSkillsModalVisible(true)}
                >
                  <Plus size={15} color={colors.primary} />
                  <Text style={[styles.addBtnText, { color: colors.primary }]}>ویرایش</Text>
                </TouchableOpacity>
              </View>

              {skills.length === 0 ? (
                <View style={styles.emptySectionBox}>
                  <Text style={[styles.emptySectionText, { color: colors.textLight }]}>
                    هنوز مهارتی انتخاب نکرده‌اید.
                  </Text>
                  <TouchableOpacity style={styles.emptyActionBtn} onPress={() => setSkillsModalVisible(true)}>
                    <Text style={[styles.emptyActionBtnText, { color: colors.primary }]}>+ انتخاب مهارت‌های تدریس</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.skillsPillsContainer}>
                  {skills.map((skill, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.skillPill,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', borderColor: colors.border },
                      ]}
                      onPress={() => handleToggleSkill(skill)}
                    >
                      <Text style={[styles.skillPillText, { color: colors.text }]}>✓ {skill}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* 4. In-Service Courses & Certificates */}
            <View style={[styles.resumeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.resumeCardHeader}>
                <View style={styles.sectionTitleRow}>
                  <BookMarked size={20} color={colors.primary} />
                  <Text style={[styles.resumeCardTitle, { color: colors.text }]}>دوره‌ها و گواهینامه‌های ضمن خدمت</Text>
                </View>
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: `${colors.primary}15` }]}
                  onPress={() => setCertModalVisible(true)}
                >
                  <Plus size={15} color={colors.primary} />
                  <Text style={[styles.addBtnText, { color: colors.primary }]}>افزودن</Text>
                </TouchableOpacity>
              </View>

              {certificates.length === 0 ? (
                <View style={styles.emptySectionBox}>
                  <Text style={[styles.emptySectionText, { color: colors.textLight }]}>
                    گواهینامه یا دوره ضمن خدمتی ثبت نشده است.
                  </Text>
                  <TouchableOpacity style={styles.emptyActionBtn} onPress={() => setCertModalVisible(true)}>
                    <Text style={[styles.emptyActionBtnText, { color: colors.primary }]}>+ ثبت دوره ضمن خدمت</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                certificates.map((cert, index) => (
                  <View key={cert.id || index} style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: '#10b981' }]} />
                    <View style={styles.timelineContent}>
                      <View style={styles.itemTitleRow}>
                        <TouchableOpacity
                          onPress={() => handleDeleteCertificate(cert.id, cert.title)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </TouchableOpacity>
                        <Text style={[styles.timelineRole, { color: colors.text }]}>{cert.title}</Text>
                      </View>
                      <Text style={[styles.timelineCompany, { color: colors.textLight }]}>
                        مرجع: {cert.issuer} {cert.hours ? `• ${cert.hours} ساعت` : ''}
                      </Text>
                      {cert.year ? (
                        <Text style={[styles.timelinePeriod, { color: colors.textLight }]}>سال اخذ: {cert.year}</Text>
                      ) : null}
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* 5. Honors, Awards & Publications */}
            <View style={[styles.resumeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.resumeCardHeader}>
                <View style={styles.sectionTitleRow}>
                  <Sparkles size={20} color="#f59e0b" />
                  <Text style={[styles.resumeCardTitle, { color: colors.text }]}>افتخارات، تقدیرنامه‌ها و مقالات</Text>
                </View>
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: `${colors.primary}15` }]}
                  onPress={() => setHonorModalVisible(true)}
                >
                  <Plus size={15} color={colors.primary} />
                  <Text style={[styles.addBtnText, { color: colors.primary }]}>افزودن</Text>
                </TouchableOpacity>
              </View>

              {honors.length === 0 ? (
                <View style={styles.emptySectionBox}>
                  <Text style={[styles.emptySectionText, { color: colors.textLight }]}>
                    تقدیرنامه یا عنوان افتخاری درج نشده است.
                  </Text>
                  <TouchableOpacity style={styles.emptyActionBtn} onPress={() => setHonorModalVisible(true)}>
                    <Text style={[styles.emptyActionBtnText, { color: colors.primary }]}>+ ثبت عنوان افتخار یا تقدیرنامه</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                honors.map((h, index) => (
                  <View key={h.id || index} style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: '#f59e0b' }]} />
                    <View style={styles.timelineContent}>
                      <View style={styles.itemTitleRow}>
                        <TouchableOpacity
                          onPress={() => handleDeleteHonor(h.id, h.title)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </TouchableOpacity>
                        <Text style={[styles.timelineRole, { color: colors.text }]}>{h.title}</Text>
                      </View>
                      <Text style={[styles.timelineCompany, { color: colors.textLight }]}>
                        {h.issuer} {h.type ? `(${h.type})` : ''}
                      </Text>
                      {h.year ? (
                        <Text style={[styles.timelinePeriod, { color: colors.textLight }]}>سال: {h.year}</Text>
                      ) : null}
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* TAB 2: POSTS (Community Grid) */}
        {activeTab === 'posts' && (
          <View>
            {posts.length === 0 ? (
              <View style={[styles.notesEmptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Grid size={48} color={colors.textLight} />
                <Text style={[styles.notesEmptyTitle, { color: colors.text }]}>هنوز پستی منتشر نکرده‌اید</Text>
                <Text style={[styles.notesEmptyDesc, { color: colors.textLight }]}>
                  تجربیات تدریس، عکس‌های فعالیت کلاسی و فیلم آزمایش‌های علمی خود را با همکاران در بخش تعامل به اشتراک بگذارید.
                </Text>
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: colors.primary, marginTop: 14 }]}
                  onPress={() => setCreatePostVisible(true)}
                >
                  <Plus size={16} color="#fff" />
                  <Text style={styles.primaryActionText}>ارسال اولین پست</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.postsGrid}>
                {posts.map((post) => (
                  <TouchableOpacity
                    key={post.id}
                    style={[styles.gridItem, { backgroundColor: colors.surface }]}
                    onPress={() => setSelectedPost(post)}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: post.thumbnailUrl }} style={styles.gridImage} />
                    {post.type === 'video' && (
                      <View style={styles.videoBadge}>
                        <Play size={12} color="#fff" fill="#fff" />
                      </View>
                    )}
                    <View style={styles.gridOverlay}>
                      <Text style={styles.gridLikesText}>♥ {post.likes}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* TAB 3: NOTES & PAMPHLETS */}
        {activeTab === 'notes' && (
          <View style={[styles.notesEmptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <FolderOpen size={48} color={colors.textLight} />
            <Text style={[styles.notesEmptyTitle, { color: colors.text }]}>آرشیو جزوات و کاربرگ‌های کلاسی</Text>
            <Text style={[styles.notesEmptyDesc, { color: colors.textLight }]}>
              فایل‌های آموزشی، نمونه سوالات امتحانی و فرم‌های ارزشیابی کلاسی شما به زودی در این پوشه قابل دسترسی و مدیریت خواهند بود.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* MODAL 1: Edit Basic Profile */}
      <Modal visible={editProfileModalVisible} transparent animationType="slide" onRequestClose={() => setEditProfileModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>ویرایش مشخصات حرفه‌ای</Text>
              <TouchableOpacity onPress={() => setEditProfileModalVisible(false)}>
                <X size={22} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>نام و نام خانوادگی:</Text>
              <TextInput
                style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                value={editProfileForm.fullName}
                onChangeText={(t) => setEditProfileForm((p) => ({ ...p, fullName: t }))}
                placeholder="مثال: علی احمدی"
                placeholderTextColor={colors.textLight}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>عنوان حرفه‌ای (Headline):</Text>
              <TextInput
                style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                value={editProfileForm.headline}
                onChangeText={(t) => setEditProfileForm((p) => ({ ...p, headline: t }))}
                placeholder="مثال: آموزگار رسمی پایه ششم • مدرس روش تدریس نوین"
                placeholderTextColor={colors.textLight}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>مدرسه محل خدمت فعلی:</Text>
              <TextInput
                style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                value={editProfileForm.schoolName}
                onChangeText={(t) => setEditProfileForm((p) => ({ ...p, schoolName: t }))}
                placeholder="مثال: دبستان شهید همت منطقه ۵ تهران"
                placeholderTextColor={colors.textLight}
              />

              <View style={styles.twoInputsRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>شهر:</Text>
                  <TextInput
                    style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                    value={editProfileForm.city}
                    onChangeText={(t) => setEditProfileForm((p) => ({ ...p, city: t }))}
                    placeholder="تهران"
                    placeholderTextColor={colors.textLight}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>سابقه کار (سال):</Text>
                  <TextInput
                    style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                    value={editProfileForm.experienceYears}
                    onChangeText={(t) => setEditProfileForm((p) => ({ ...p, experienceYears: t }))}
                    keyboardType="numeric"
                    placeholder="۸"
                    placeholderTextColor={colors.textLight}
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: colors.text }]}>درباره من (بیوگرافی):</Text>
              <TextInput
                style={[styles.inputField, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                value={editProfileForm.bio}
                onChangeText={(t) => setEditProfileForm((p) => ({ ...p, bio: t }))}
                placeholder="چند خط درباره تجربیات، اهداف آموزشی و علاقه‌مندی‌های خود در کلاس درس..."
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveEditProfile}
                disabled={isSaving}
              >
                {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalSubmitBtnText}>ذخیره تغییرات در سرور</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Add Teaching Experience */}
      <Modal visible={expModalVisible} transparent animationType="slide" onRequestClose={() => setExpModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>افزودن سابقه تدریس</Text>
              <TouchableOpacity onPress={() => setExpModalVisible(false)}>
                <X size={22} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>سمت یا درس تدریسی *:</Text>
              <TextInput
                style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                value={expForm.title}
                onChangeText={(t) => setExpForm((p) => ({ ...p, title: t }))}
                placeholder="مثال: آموزگار پایه پنجم، دبیر فیزیک، معاون"
                placeholderTextColor={colors.textLight}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>نام مدرسه یا آموزشگاه *:</Text>
              <TextInput
                style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                value={expForm.school}
                onChangeText={(t) => setExpForm((p) => ({ ...p, school: t }))}
                placeholder="مثال: دبستان غیردولتی مهر تابان"
                placeholderTextColor={colors.textLight}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>شهر یا منطقه آموزش و پرورش:</Text>
              <TextInput
                style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                value={expForm.location}
                onChangeText={(t) => setExpForm((p) => ({ ...p, location: t }))}
                placeholder="مثال: منطقه ۲ تهران"
                placeholderTextColor={colors.textLight}
              />

              <View style={styles.twoInputsRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>سال شروع *:</Text>
                  <TextInput
                    style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                    value={expForm.startDate}
                    onChangeText={(t) => setExpForm((p) => ({ ...p, startDate: t }))}
                    placeholder="مثال: ۱۳۹۸"
                    placeholderTextColor={colors.textLight}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>سال پایان:</Text>
                  <TextInput
                    style={[
                      styles.inputField,
                      { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc', opacity: expForm.isCurrent ? 0.4 : 1 },
                    ]}
                    value={expForm.endDate}
                    onChangeText={(t) => setExpForm((p) => ({ ...p, endDate: t }))}
                    placeholder="مثال: ۱۴۰۱"
                    placeholderTextColor={colors.textLight}
                    editable={!expForm.isCurrent}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.switchRow}
                activeOpacity={0.8}
                onPress={() => setExpForm((p) => ({ ...p, isCurrent: !p.isCurrent, endDate: !p.isCurrent ? '' : p.endDate }))}
              >
                <Switch
                  value={expForm.isCurrent}
                  onValueChange={(val) => setExpForm((p) => ({ ...p, isCurrent: val, endDate: val ? '' : p.endDate }))}
                  thumbColor={expForm.isCurrent ? colors.primary : '#ccc'}
                />
                <Text style={[styles.switchLabel, { color: colors.text }]}>هم‌اکنون در این مدرسه تدریس می‌کنم</Text>
              </TouchableOpacity>

              <Text style={[styles.inputLabel, { color: colors.text }]}>توضیحات و دستاوردها (اختیاری):</Text>
              <TextInput
                style={[styles.inputField, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                value={expForm.description}
                onChangeText={(t) => setExpForm((p) => ({ ...p, description: t }))}
                placeholder="مثال: مجری طرح درس پژوهی، قبولی ۱۰۰٪ در آزمون‌های هماهنگ..."
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={2}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddExperience}
                disabled={isSaving}
              >
                {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalSubmitBtnText}>ثبت سابقه تدریس در سرور</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Add Education Degree */}
      <Modal visible={eduModalVisible} transparent animationType="slide" onRequestClose={() => setEduModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>افزودن مدرک تحصیلی</Text>
              <TouchableOpacity onPress={() => setEduModalVisible(false)}>
                <X size={22} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>مقطع تحصیلی:</Text>
              <View style={styles.degreePillsRow}>
                {['کاردانی', 'کارشناسی', 'کارشناسی ارشد', 'دکتری'].map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.degreePill,
                      eduForm.degree === d
                        ? { backgroundColor: colors.primary, borderColor: colors.primary }
                        : { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc' },
                    ]}
                    onPress={() => setEduForm((p) => ({ ...p, degree: d }))}
                  >
                    <Text style={[styles.degreePillText, { color: eduForm.degree === d ? '#fff' : colors.text }]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: colors.text }]}>رشته تحصیلی *:</Text>
              <TextInput
                style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                value={eduForm.field}
                onChangeText={(t) => setEduForm((p) => ({ ...p, field: t }))}
                placeholder="مثال: آموزش ابتدایی، ادبیات فارسی، ریاضی"
                placeholderTextColor={colors.textLight}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>نام دانشگاه یا موسسه *:</Text>
              <TextInput
                style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                value={eduForm.university}
                onChangeText={(t) => setEduForm((p) => ({ ...p, university: t }))}
                placeholder="مثال: دانشگاه فرهنگیان تهران، دانشگاه شهید بهشتی"
                placeholderTextColor={colors.textLight}
              />

              <View style={styles.twoInputsRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>سال شروع:</Text>
                  <TextInput
                    style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                    value={eduForm.startDate}
                    onChangeText={(t) => setEduForm((p) => ({ ...p, startDate: t }))}
                    placeholder="مثال: ۱۳۹۵"
                    placeholderTextColor={colors.textLight}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>سال پایان:</Text>
                  <TextInput
                    style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                    value={eduForm.endDate}
                    onChangeText={(t) => setEduForm((p) => ({ ...p, endDate: t }))}
                    placeholder="مثال: ۱۳۹۹"
                    placeholderTextColor={colors.textLight}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddEducation}
                disabled={isSaving}
              >
                {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalSubmitBtnText}>ثبت مدرک در سرور</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: Manage Skills */}
      <Modal visible={skillsModalVisible} transparent animationType="slide" onRequestClose={() => setSkillsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>مهارت‌ها و شایستگی‌های تدریس</Text>
              <TouchableOpacity onPress={() => setSkillsModalVisible(false)}>
                <X size={22} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.sectionSubtitle, { color: colors.textLight }]}>
                مهارت‌های پرکاربرد معلمان را انتخاب کنید یا مهارت اختصاصی خود را اضافه نمایید:
              </Text>

              {/* Add Custom Skill */}
              <View style={styles.addCustomSkillRow}>
                <TouchableOpacity style={[styles.addCustomSkillBtn, { backgroundColor: colors.primary }]} onPress={handleAddCustomSkill}>
                  <Text style={styles.addCustomSkillBtnText}>افزودن</Text>
                </TouchableOpacity>
                <TextInput
                  style={[styles.customSkillInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                  value={customSkillInput}
                  onChangeText={setCustomSkillInput}
                  placeholder="تایپ مهارت جدید..."
                  placeholderTextColor={colors.textLight}
                  onSubmitEditing={handleAddCustomSkill}
                />
              </View>

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: 14 }]}>مهارت‌های انتخاب‌شده ({skills.length}):</Text>
              <View style={styles.skillsPillsContainer}>
                {skills.map((skill, idx) => (
                  <View key={idx} style={[styles.activeSkillPill, { backgroundColor: colors.primary }]}>
                    <TouchableOpacity onPress={() => handleToggleSkill(skill)}>
                      <X size={14} color="#fff" style={{ marginRight: 6 }} />
                    </TouchableOpacity>
                    <Text style={styles.activeSkillText}>{skill}</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: 18 }]}>مهارت‌های پیشنهادی:</Text>
              <View style={styles.skillsPillsContainer}>
                {POPULAR_SKILL_SUGGESTIONS.map((skill, idx) => {
                  const isSelected = skills.includes(skill);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.suggestedSkillPill,
                        isSelected
                          ? { backgroundColor: colors.primary, borderColor: colors.primary }
                          : { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc' },
                      ]}
                      onPress={() => handleToggleSkill(skill)}
                    >
                      <Text style={[styles.suggestedSkillText, { color: isSelected ? '#fff' : colors.text }]}>
                        {isSelected ? '✓ ' : '+ '} {skill}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                onPress={() => setSkillsModalVisible(false)}
              >
                <Text style={styles.modalSubmitBtnText}>تأیید و بازگشت</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 5: Add Certificate */}
      <Modal visible={certModalVisible} transparent animationType="slide" onRequestClose={() => setCertModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>افزودن دوره و گواهینامه</Text>
              <TouchableOpacity onPress={() => setCertModalVisible(false)}>
                <X size={22} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>عنوان دوره / گواهینامه *:</Text>
              <TextInput
                style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                value={certForm.title}
                onChangeText={(t) => setCertForm((p) => ({ ...p, title: t }))}
                placeholder="مثال: روش‌های نوین سنجش، سواد هوش مصنوعی"
                placeholderTextColor={colors.textLight}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>مرجع صادرکننده *:</Text>
              <TextInput
                style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                value={certForm.issuer}
                onChangeText={(t) => setCertForm((p) => ({ ...p, issuer: t }))}
                placeholder="مثال: ضمن خدمت فرهنگیان، دانشگاه، سمپاد"
                placeholderTextColor={colors.textLight}
              />

              <View style={styles.twoInputsRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>سال اخذ:</Text>
                  <TextInput
                    style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                    value={certForm.year}
                    onChangeText={(t) => setCertForm((p) => ({ ...p, year: t }))}
                    placeholder="مثال: ۱۴۰۲"
                    placeholderTextColor={colors.textLight}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>مدت (ساعت):</Text>
                  <TextInput
                    style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                    value={certForm.hours}
                    onChangeText={(t) => setCertForm((p) => ({ ...p, hours: t }))}
                    placeholder="مثال: ۳۲ ساعت"
                    placeholderTextColor={colors.textLight}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddCertificate}
                disabled={isSaving}
              >
                {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalSubmitBtnText}>ثبت گواهینامه در سرور</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 6: Add Honor or Publication */}
      <Modal visible={honorModalVisible} transparent animationType="slide" onRequestClose={() => setHonorModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>افزودن افتخار، تقدیرنامه یا اثر</Text>
              <TouchableOpacity onPress={() => setHonorModalVisible(false)}>
                <X size={22} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>نوع اثر یا افتخار:</Text>
              <View style={styles.degreePillsRow}>
                {['تقدیرنامه', 'معلم نمونه', 'مقاله', 'کتاب', 'جشنواره'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.degreePill,
                      honorForm.type === t
                        ? { backgroundColor: colors.primary, borderColor: colors.primary }
                        : { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc' },
                    ]}
                    onPress={() => setHonorForm((p) => ({ ...p, type: t }))}
                  >
                    <Text style={[styles.degreePillText, { color: honorForm.type === t ? '#fff' : colors.text }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: colors.text }]}>عنوان افتخار یا کتاب/مقاله *:</Text>
              <TextInput
                style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                value={honorForm.title}
                onChangeText={(t) => setHonorForm((p) => ({ ...p, title: t }))}
                placeholder="مثال: معلم نمونه استانی، تالیف کتاب کار علوم"
                placeholderTextColor={colors.textLight}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>مرجع اهداکننده یا ناشر *:</Text>
              <TextInput
                style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                value={honorForm.issuer}
                onChangeText={(t) => setHonorForm((p) => ({ ...p, issuer: t }))}
                placeholder="مثال: اداره کل آموزش و پرورش، جشنواره خوارزمی"
                placeholderTextColor={colors.textLight}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>سال دریافت:</Text>
              <TextInput
                style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                value={honorForm.year}
                onChangeText={(t) => setHonorForm((p) => ({ ...p, year: t }))}
                placeholder="مثال: ۱۴۰۱"
                placeholderTextColor={colors.textLight}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddHonor}
                disabled={isSaving}
              >
                {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalSubmitBtnText}>ثبت افتخار در سرور</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 7: Create Post Modal */}
      <Modal visible={createPostVisible} transparent animationType="slide" onRequestClose={() => setCreatePostVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>انتشار پست آموزشی جدید</Text>
              <TouchableOpacity onPress={() => setCreatePostVisible(false)}>
                <X size={22} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>متن یا توضیح فعالیت آموزشی *:</Text>
              <TextInput
                style={[styles.inputField, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                value={newPostTitle}
                onChangeText={setNewPostTitle}
                placeholder="توضیحاتی درباره روش تدریس، دستاورد دانش‌آموزان یا تجربه کلاسی امروز..."
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={4}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>نوع محتوا:</Text>
              <View style={styles.degreePillsRow}>
                <TouchableOpacity
                  style={[
                    styles.degreePill,
                    newPostType === 'image'
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc' },
                  ]}
                  onPress={() => setNewPostType('image')}
                >
                  <Text style={[styles.degreePillText, { color: newPostType === 'image' ? '#fff' : colors.text }]}>📷 عکس</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.degreePill,
                    newPostType === 'video'
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc' },
                  ]}
                  onPress={() => setNewPostType('video')}
                >
                  <Text style={[styles.degreePillText, { color: newPostType === 'video' ? '#fff' : colors.text }]}>🎬 ویدیو</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { color: colors.text }]}>آدرس تصویر یا ویدیو (URL):</Text>
              <TextInput
                style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                value={newPostUrl}
                onChangeText={setNewPostUrl}
                placeholder="https://... (اختیاری)"
                placeholderTextColor={colors.textLight}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreatePost}
                disabled={isSaving}
              >
                {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalSubmitBtnText}>انتشار در تالار تعامل</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Hamburger Menu Bottom Sheet */}
      <Modal visible={menuModalVisible} transparent animationType="slide" onRequestClose={() => setMenuModalVisible(false)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuModalVisible(false)}>
          <View style={[styles.menuSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.menuDragHandle} />
            <Text style={[styles.menuSheetTitle, { color: colors.text }]}>منوی تنظیمات و پشتیبانی</Text>

            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => {
                setMenuModalVisible(false);
                handleOpenEditProfile();
              }}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: '#e0f2fe' }]}>
                <Edit3 size={20} color="#0284c7" />
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={[styles.menuItemText, { color: colors.text }]}>ویرایش اطلاعات پروفایل</Text>
                <Text style={[styles.menuItemSubText, { color: colors.textLight }]}>نام، عنوان، بیوگرافی و مدرسه</Text>
              </View>
              <ChevronRight size={18} color={colors.textLight} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => {
                setMenuModalVisible(false);
                navigation.navigate('SupportTicketsScreen');
              }}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: '#f3e8ff' }]}>
                <MessageSquare size={20} color="#7e22ce" />
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={[styles.menuItemText, { color: colors.text }]}>ارتباط با ما (ارسال تیکت به ادمین)</Text>
                <Text style={[styles.menuItemSubText, { color: colors.textLight }]}>ارسال تیکت و دریافت پاسخ فوری</Text>
              </View>
              <ChevronRight size={18} color={colors.textLight} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => {
                setMenuModalVisible(false);
                setContactUsModalVisible(true);
              }}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: '#dcfce7' }]}>
                <Phone size={20} color="#15803d" />
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>تماس با پشتیبانی</Text>
              <ChevronRight size={18} color={colors.textLight} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => {
                setMenuModalVisible(false);
                setAboutUsModalVisible(true);
              }}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: '#fef3c7' }]}>
                <Info size={20} color="#b45309" />
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>درباره کیتایار</Text>
              <ChevronRight size={18} color={colors.textLight} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.menuItemRow} onPress={handleLogout}>
              <View style={[styles.menuItemIcon, { backgroundColor: '#fee2e2' }]}>
                <LogOut size={20} color="#dc2626" />
              </View>
              <Text style={[styles.menuItemText, { color: '#dc2626' }]}>خروج از حساب کاربری</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Contact Us Modal */}
      <Modal visible={contactUsModalVisible} transparent animationType="fade" onRequestClose={() => setContactUsModalVisible(false)}>
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogCard, { backgroundColor: colors.surface }]}>
            <View style={styles.dialogHeader}>
              <Text style={[styles.dialogTitle, { color: colors.text }]}>تماس با پشتیبانی کیتایار</Text>
              <TouchableOpacity onPress={() => setContactUsModalVisible(false)}>
                <X size={20} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <View style={styles.dialogBody}>
              <Text style={[styles.dialogText, { color: colors.text }]}>
                تیم پشتیبانی کیتایار همواره آماده راهنمایی و پاسخگویی به سوالات همکاران فرهنگی است:
              </Text>

              <View style={[styles.contactCardItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', borderColor: colors.border }]}>
                <Phone size={18} color={colors.primary} />
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={[styles.contactLabel, { color: colors.textLight }]}>تلفن پشتیبانی مرکزی:</Text>
                  <Text style={[styles.contactValue, { color: colors.text }]}>۰۲۱ - ۸۸۸۸۰۰۰۰</Text>
                </View>
              </View>

              <View style={[styles.contactCardItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', borderColor: colors.border }]}>
                <MessageSquare size={18} color="#0284c7" />
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={[styles.contactLabel, { color: colors.textLight }]}>پیام‌رسان (ایتا، شاد، تلگرام):</Text>
                  <Text style={[styles.contactValue, { color: colors.text }]}>@Kitayar_Support</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={[styles.dialogCloseBtn, { backgroundColor: colors.primary }]} onPress={() => setContactUsModalVisible(false)}>
              <Text style={styles.dialogCloseBtnText}>متوجه شدم</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* About Us Modal */}
      <Modal visible={aboutUsModalVisible} transparent animationType="fade" onRequestClose={() => setAboutUsModalVisible(false)}>
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogCard, { backgroundColor: colors.surface }]}>
            <View style={styles.dialogHeader}>
              <Text style={[styles.dialogTitle, { color: colors.text }]}>درباره سامانه کیتایار</Text>
              <TouchableOpacity onPress={() => setAboutUsModalVisible(false)}>
                <X size={20} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <View style={styles.dialogBody}>
              <Text style={[styles.aboutText, { color: colors.text }]}>
                کیتایار یک پلتفرم جامع و هوشمند برای معلمان و دبیران سراسر کشور است که با هدف کاهش بار اداری معلمان و ارتقای کیفیت تدریس در کلاس درس طراحی شده است.
              </Text>
              <Text style={[styles.versionText, { color: colors.textLight }]}>نسخه اپلیکیشن: ۲.۰.۰</Text>
            </View>

            <TouchableOpacity style={[styles.dialogCloseBtn, { backgroundColor: colors.primary }]} onPress={() => setAboutUsModalVisible(false)}>
              <Text style={styles.dialogCloseBtnText}>بستن</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { fontFamily: 'IRANSansX', fontSize: 13, marginTop: 12 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBtn: { padding: 4 },
  headerTitle: {
    fontFamily: 'IRANSansX',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: { paddingBottom: 40 },

  // Cover Banner
  bannerContainer: {
    position: 'relative',
    height: 120,
    marginBottom: 44,
  },
  bannerGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 12,
  },
  bannerBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  bannerBadgeText: {
    color: '#fff',
    fontFamily: 'IRANSansX',
    fontSize: 11,
  },
  avatarWrapper: {
    position: 'absolute',
    bottom: -38,
    right: 20,
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3.5,
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 42,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: '#fff',
    borderRadius: 10,
  },

  // Profile Info
  profileInfoSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  nameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileName: {
    fontFamily: 'IRANSansX',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  profileHeadline: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metaText: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
  },
  bioText: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'right',
    marginBottom: 16,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'IRANSansX',
    fontSize: 15,
    fontWeight: 'bold',
  },
  statLabel: {
    fontFamily: 'IRANSansX',
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
  },

  // Action Buttons
  actionButtonsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  primaryActionBtn: {
    flex: 2,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  primaryActionText: {
    color: '#fff',
    fontFamily: 'IRANSansX',
    fontSize: 13,
    fontWeight: 'bold',
  },
  secondaryActionBtn: {
    flex: 2,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  secondaryActionText: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
    fontWeight: '600',
  },
  iconActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tabs
  tabBar: {
    flexDirection: 'row-reverse',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabBtn: {
    borderBottomWidth: 2,
  },
  tabBtnText: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Posts Grid
  postsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 4,
    padding: 12,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gridLikesText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'IRANSansX',
  },

  // Resume Container & Completion Card
  resumeContainer: {
    padding: 16,
    gap: 16,
  },
  completionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  completionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  completionTitleWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  completionTitle: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
    fontWeight: 'bold',
  },
  completionBadge: {
    fontFamily: 'IRANSansX',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  completionHint: {
    fontFamily: 'IRANSansX',
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'right',
    marginTop: 6,
  },

  // Resume Card
  resumeCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  resumeCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  sectionTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  resumeCardTitle: {
    fontFamily: 'IRANSansX',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addBtnText: {
    fontFamily: 'IRANSansX',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Timeline Items
  timelineItem: {
    flexDirection: 'row-reverse',
    marginBottom: 16,
    gap: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  timelineContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  itemTitleRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  timelineRole: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  timelineCompany: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
    marginTop: 2,
    textAlign: 'right',
  },
  timelinePeriod: {
    fontFamily: 'IRANSansX',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'right',
  },
  itemDesc: {
    fontFamily: 'IRANSansX',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 18,
    textAlign: 'right',
  },

  // Empty Section
  emptySectionBox: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySectionText: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
    textAlign: 'center',
  },
  emptyActionBtn: {
    marginTop: 8,
  },
  emptyActionBtnText: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Skills
  skillsPillsContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  skillPillText: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
  },
  activeSkillPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activeSkillText: {
    color: '#fff',
    fontFamily: 'IRANSansX',
    fontSize: 12,
    fontWeight: '600',
  },
  suggestedSkillPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  suggestedSkillText: {
    fontFamily: 'IRANSansX',
    fontSize: 11,
  },
  addCustomSkillRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  customSkillInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: 'IRANSansX',
    fontSize: 12,
    textAlign: 'right',
  },
  addCustomSkillBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  addCustomSkillBtnText: {
    color: '#fff',
    fontFamily: 'IRANSansX',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Notes Empty
  notesEmptyCard: {
    margin: 20,
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesEmptyTitle: {
    fontFamily: 'IRANSansX',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 14,
  },
  notesEmptyDesc: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },

  // Modals Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  modalTitle: {
    fontFamily: 'IRANSansX',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  sectionSubtitle: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 6,
    lineHeight: 18,
  },
  inputLabel: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 12,
    marginBottom: 6,
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'IRANSansX',
    fontSize: 13,
    textAlign: 'right',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  twoInputsRow: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  switchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  switchLabel: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
  },
  degreePillsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  degreePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  degreePillText: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
    fontWeight: '600',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalSubmitBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnText: {
    color: '#fff',
    fontFamily: 'IRANSansX',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Hamburger Sheet
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  menuDragHandle: {
    width: 38,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  menuSheetTitle: {
    fontFamily: 'IRANSansX',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 16,
  },
  menuItemRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
  },
  menuItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  menuItemSubText: {
    fontFamily: 'IRANSansX',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'right',
  },
  menuDivider: {
    height: 1,
    marginVertical: 10,
  },

  // Dialog Modals
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
  },
  dialogHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dialogTitle: {
    fontFamily: 'IRANSansX',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dialogBody: {
    marginBottom: 16,
  },
  dialogText: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: 12,
  },
  contactCardItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  contactLabel: {
    fontFamily: 'IRANSansX',
    fontSize: 11,
  },
  contactValue: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  aboutText: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: 8,
  },
  versionText: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
    textAlign: 'right',
  },
  dialogCloseBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dialogCloseBtnText: {
    color: '#fff',
    fontFamily: 'IRANSansX',
    fontSize: 13,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;