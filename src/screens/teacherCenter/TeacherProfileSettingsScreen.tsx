import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/axiosConfig';
import {
  ChevronRight,
  Camera,
  User,
  Building,
  MapPin,
  Clock,
  FileText,
  Save,
  CheckCircle2,
} from 'lucide-react-native';
import ImagePicker from 'react-native-image-crop-picker';
import { communityService } from '../../services/community/communityService';
import { FONT_FAMILY } from '../../theme/typography';
import { showSuccess, showError, showWarning } from '../../components/feedback';

export const TeacherProfileSettingsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Photos
  const [avatarUri, setAvatarUri] = useState<string>('https://i.pravatar.cc/150?u=kitayar@teacher.com');
  const [coverUri, setCoverUri] = useState<string | null>(null);

  // Profile Fields
  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [experienceYears, setExperienceYears] = useState('5');
  const [bio, setBio] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/profile');
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        if (d.user?.fullName) setFullName(d.user.fullName);
        else if (d.fullName) setFullName(d.fullName);

        if (d.avatar) setAvatarUri(d.avatar);
        if (d.coverImage) setCoverUri(d.coverImage);
        if (d.headline) setHeadline(d.headline);
        if (d.bio) setBio(d.bio);
        if (d.schools && d.schools.length > 0) setSchoolName(d.schools[0]);
        else if (d.school) setSchoolName(d.school);
        if (d.city) setCity(d.city);
        if (d.province) setProvince(d.province);
        if (d.experienceYears !== undefined) setExperienceYears(d.experienceYears.toString());
      }
    } catch (e) {
      console.warn('Error fetching profile settings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const getFullUrl = (uri?: string | null) => {
    if (!uri) return null;
    if (uri.startsWith('http')) return uri;
    const base = api.defaults.baseURL || 'https://api.kitayar.ir';
    return `${base}${uri.startsWith('/') ? '' : '/'}${uri}`;
  };

  const handlePickCover = async () => {
    try {
      const image = await ImagePicker.openPicker({
        mediaType: 'photo',
        cropping: true,
        width: 1200,
        height: 450,
      });

      if (image.size && image.size > 2 * 1024 * 1024) {
        showWarning('حجم تصویر کاور نباید بیشتر از ۲ مگابایت باشد.');
        return;
      }

      showSuccess('در حال بارگذاری تصویر کاور...');
      const uploadedUrl = await communityService.uploadAttachment(
        image.path,
        image.filename || `cover_${Date.now()}.jpg`,
        image.mime || 'image/jpeg'
      );

      if (uploadedUrl) {
        setCoverUri(uploadedUrl);
        await api.put('/teacher/profile', { coverImage: uploadedUrl });
        showSuccess('تصویر کاور با موفقیت به‌روزرسانی شد.');
      }
    } catch {
      // User cancelled
    }
  };

  const handlePickAvatar = async () => {
    try {
      const image = await ImagePicker.openPicker({
        mediaType: 'photo',
        cropping: true,
        width: 400,
        height: 400,
        cropperCircleOverlay: true,
      });

      if (image.size && image.size > 2 * 1024 * 1024) {
        showWarning('حجم عکس پروفایل نباید بیشتر از ۲ مگابایت باشد.');
        return;
      }

      showSuccess('در حال بارگذاری عکس پروفایل...');
      const uploadedUrl = await communityService.uploadAttachment(
        image.path,
        image.filename || `avatar_${Date.now()}.jpg`,
        image.mime || 'image/jpeg'
      );

      if (uploadedUrl) {
        setAvatarUri(uploadedUrl);
        await api.put('/teacher/profile', { avatar: uploadedUrl });
        showSuccess('عکس پروفایل با موفقیت تغییر یافت.');
      }
    } catch {
      // User cancelled
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      showWarning('نام و نام خانوادگی نمی‌تواند خالی باشد.');
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        fullName: fullName.trim(),
        headline: headline.trim(),
        bio: bio.trim(),
        schools: schoolName.trim() ? [schoolName.trim()] : [],
        city: city.trim(),
        province: province.trim(),
        experienceYears: parseInt(experienceYears) || 0,
        avatar: avatarUri,
        coverImage: coverUri || '',
      };

      const res = await api.put('/teacher/profile', payload);
      if (res.data?.success) {
        showSuccess('مشخصات پروفایل با موفقیت در سرور ذخیره شد.');
        navigation.goBack();
      } else {
        showError(res.data?.message || 'خطا در ذخیره‌سازی اطلاعات');
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'خطا در برقراری ارتباط با سرور');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronRight size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>ویرایش مشخصات و پروفایل</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textLight }]}>در حال بارگذاری اطلاعات پروفایل...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Cover Photo & Avatar Customization */}
            <View style={styles.bannerContainer}>
              {coverUri ? (
                <Image source={{ uri: getFullUrl(coverUri)! }} style={styles.coverImage} resizeMode="cover" />
              ) : (
                <View style={[styles.coverPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={styles.coverPlaceholderText}>کیتایار • پروفایل رسمی معلم</Text>
                </View>
              )}

              {/* Change Cover Button */}
              <TouchableOpacity style={styles.changeCoverBtn} onPress={handlePickCover} activeOpacity={0.85}>
                <Camera size={15} color="#ffffff" style={{ marginLeft: 5 }} />
                <Text style={styles.changeCoverBtnText}>تغییر عکس پشت پروفایل (کاور)</Text>
              </TouchableOpacity>

              {/* Avatar Circle with Camera Button */}
              <View style={[styles.avatarWrapper, { borderColor: colors.surface, backgroundColor: colors.surface }]}>
                <Image source={{ uri: getFullUrl(avatarUri)! }} style={styles.avatarImage} resizeMode="cover" />
                <TouchableOpacity style={styles.changeAvatarBtn} onPress={handlePickAvatar} activeOpacity={0.85}>
                  <Camera size={14} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Form Inputs */}
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Full Name */}
              <View style={styles.fieldWrap}>
                <View style={styles.labelRow}>
                  <User size={15} color={colors.primary} />
                  <Text style={[styles.inputLabel, { color: colors.text }]}>نام و نام خانوادگی:</Text>
                </View>
                <TextInput
                  style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="مثال: علی احمدی"
                  placeholderTextColor={colors.textLight}
                />
              </View>

              {/* Headline */}
              <View style={styles.fieldWrap}>
                <View style={styles.labelRow}>
                  <FileText size={15} color={colors.primary} />
                  <Text style={[styles.inputLabel, { color: colors.text }]}>عنوان حرفه‌ای (Headline):</Text>
                </View>
                <TextInput
                  style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                  value={headline}
                  onChangeText={setHeadline}
                  placeholder="مثال: آموزگار رسمی پایه ششم • مدرس ریاضی تیزهوشان"
                  placeholderTextColor={colors.textLight}
                />
              </View>

              {/* School Name */}
              <View style={styles.fieldWrap}>
                <View style={styles.labelRow}>
                  <Building size={15} color={colors.primary} />
                  <Text style={[styles.inputLabel, { color: colors.text }]}>مدرسه محل خدمت فعلی:</Text>
                </View>
                <TextInput
                  style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                  value={schoolName}
                  onChangeText={setSchoolName}
                  placeholder="مثال: دبستان شهید همت منطقه ۵ تهران"
                  placeholderTextColor={colors.textLight}
                />
              </View>

              {/* City & Province & Experience Years */}
              <View style={styles.twoInputsRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.labelRow}>
                    <MapPin size={14} color={colors.primary} />
                    <Text style={[styles.inputLabel, { color: colors.text }]}>شهر:</Text>
                  </View>
                  <TextInput
                    style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                    value={city}
                    onChangeText={setCity}
                    placeholder="تهران"
                    placeholderTextColor={colors.textLight}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.labelRow}>
                    <Clock size={14} color={colors.primary} />
                    <Text style={[styles.inputLabel, { color: colors.text }]}>سابقه کار (سال):</Text>
                  </View>
                  <TextInput
                    style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                    value={experienceYears}
                    onChangeText={setExperienceYears}
                    keyboardType="numeric"
                    placeholder="۸"
                    placeholderTextColor={colors.textLight}
                  />
                </View>
              </View>

              {/* Bio / About Me */}
              <View style={styles.fieldWrap}>
                <View style={styles.labelRow}>
                  <FileText size={15} color={colors.primary} />
                  <Text style={[styles.inputLabel, { color: colors.text }]}>درباره من (بیوگرافی و تجربیات):</Text>
                </View>
                <TextInput
                  style={[styles.inputField, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="چند خط درباره سبک تدریس، اهداف آموزشی، سوابق و شیوه‌های تعامل با دانش‌آموزان بنویسید..."
                  placeholderTextColor={colors.textLight}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* 3. Save Button */}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Save size={18} color="#ffffff" style={{ marginLeft: 8 }} />
                  <Text style={styles.saveBtnText}>ذخیره تغییرات مشخصات پروفایل</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 60,
  },

  // Cover & Avatar
  bannerContainer: {
    position: 'relative',
    height: 150,
    marginBottom: 50,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholderText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
  },
  changeCoverBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  changeCoverBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: FONT_FAMILY.bold,
  },
  avatarWrapper: {
    position: 'absolute',
    bottom: -40,
    right: 20,
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3.5,
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
  },
  changeAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: '#2563eb',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },

  // Form Card
  formCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  fieldWrap: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  inputLabel: {
    fontSize: 12.5,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
  },
  inputField: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'right',
  },
  twoInputsRow: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  textArea: {
    height: 100,
    paddingTop: 10,
  },

  // Save Button
  saveBtn: {
    marginHorizontal: 16,
    marginTop: 20,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
  },
});

export default TeacherProfileSettingsScreen;
