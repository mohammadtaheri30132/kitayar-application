import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  ActivityIndicator, 
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { showError, showWarning, showSuccess } from '../../../components/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Image as ImageIcon, Video, X, UploadCloud, Film } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import ImagePicker from 'react-native-image-crop-picker';
import { communityService } from '../../../services/community/communityService';
import { FONT_FAMILY } from '../../../theme/typography';
import { toPersianNumbers } from '../../../utils/date/jalaliHelper';

const MAX_CHARS = 1000;

const NewPostScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();

  const [text, setText] = useState('');
  const [localMediaUri, setLocalMediaUri] = useState<string | null>(null);
  const [isVideoType, setIsVideoType] = useState(false);
  const [mediaFileName, setMediaFileName] = useState<string>('');
  const [mediaMime, setMediaMime] = useState<string>('image/jpeg');
  const [mediaSize, setMediaSize] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');

  const handleSelectMedia = async () => {
    try {
      const media = await ImagePicker.openPicker({
        mediaType: 'any',
        cropping: false,
      });

      const isVideo = media.mime?.startsWith('video/') || false;
      const isImage = !isVideo;

      // Size validations
      if (isImage && media.size && media.size > 2 * 1024 * 1024) {
        showWarning('حجم تصویر نباید بیشتر از ۲ مگابایت باشد.');
        return;
      }

      if (isVideo && media.size && media.size > 30 * 1024 * 1024) {
        showWarning('حجم ویدیو نباید بیشتر از ۳۰ مگابایت باشد.');
        return;
      }

      setLocalMediaUri(media.path);
      setIsVideoType(isVideo);
      setMediaSize(media.size || 0);

      const defaultExt = isVideo ? 'mp4' : 'jpg';
      const filename = media.filename || `post_${Date.now()}.${defaultExt}`;
      setMediaFileName(filename);
      setMediaMime(media.mime || (isVideo ? 'video/mp4' : 'image/jpeg'));
    } catch {
      // User dismissed picker
    }
  };

  const handleRemoveMedia = () => {
    setLocalMediaUri(null);
    setIsVideoType(false);
    setMediaFileName('');
    setMediaMime('image/jpeg');
    setMediaSize(0);
  };

  const handleSubmit = async () => {
    if (!text.trim() && !localMediaUri) {
      showWarning('لطفاً متن پست یا یک تصویر/ویدیو اضافه کنید.');
      return;
    }

    try {
      setIsSubmitting(true);
      const images: string[] = [];

      if (localMediaUri) {
        setUploadProgressText(isVideoType ? 'در حال فشرده‌سازی و بارگذاری ویدیو...' : 'در حال بهینه‌سازی و بارگذاری تصویر...');
        const uploadedUrl = await communityService.uploadAttachment(
          localMediaUri,
          mediaFileName,
          mediaMime
        );
        if (uploadedUrl) {
          images.push(uploadedUrl);
        }
      }

      setUploadProgressText('در حال ذخیره و انتشار پست...');
      await communityService.createPost({
        content: text.trim(),
        images,
      });

      showSuccess('پست شما با موفقیت منتشر شد.');
      navigation.goBack();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'خطا در انتشار پست. لطفاً اتصال اینترنت را بررسی کنید.';
      showError(msg);
    } finally {
      setIsSubmitting(false);
      setUploadProgressText('');
    }
  };

  const isFormValid = text.trim().length > 0 || !!localMediaUri;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} disabled={isSubmitting}>
          <ChevronRight color={colors.text} size={26} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>انتشار پست و نمونه کار جدید</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          {/* 1. TOP LARGE DASHED SQUARE MEDIA PICKER */}
          <TouchableOpacity 
            style={[
              styles.mediaSquareArea, 
              { 
                borderColor: localMediaUri ? colors.primary : colors.border, 
                backgroundColor: isDark ? '#1e293b' : '#f8fafc' 
              }
            ]}
            onPress={handleSelectMedia}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {localMediaUri ? (
              <View style={styles.mediaPreviewContainer}>
                {isVideoType ? (
                  <View style={styles.videoPreviewWrap}>
                    <View style={styles.videoIconCircle}>
                      <Film size={44} color="#ffffff" />
                    </View>
                    <Text style={[styles.videoFilenameText, { color: colors.text }]} numberOfLines={1}>
                      {mediaFileName}
                    </Text>
                    <Text style={[styles.videoSizeText, { color: colors.textLight }]}>
                      حجم فایل: {toPersianNumbers((mediaSize / (1024 * 1024)).toFixed(1))} مگابایت (ویدیو)
                    </Text>
                  </View>
                ) : (
                  <Image source={{ uri: localMediaUri }} style={styles.imagePreview} resizeMode="cover" />
                )}

                <TouchableOpacity 
                  style={styles.removeMediaBtn} 
                  onPress={handleRemoveMedia}
                  disabled={isSubmitting}
                >
                  <X color="#ffffff" size={18} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <View style={[styles.uploadIconCircle, { backgroundColor: isDark ? '#334155' : '#e0e7ff' }]}>
                  <UploadCloud color="#2563eb" size={36} />
                </View>
                <Text style={[styles.uploadTitle, { color: colors.text }]}>
                  افزودن تصویر یا ویدیو
                </Text>
                <Text style={[styles.uploadSubtitle, { color: colors.textLight }]}>
                  روی این کادر ضربه بزنید تا عکس یا ویدیو موردنظرتان را انتخاب کنید
                </Text>
                <View style={styles.sizeNoticeBadge}>
                  <Text style={styles.sizeNoticeText}>
                    حداکثر عکس: ۲ مگابایت • حداکثر ویدیو: ۳۰ مگابایت
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* 2. BOTTOM TEXT INPUT FOR CAPTION / DESCRIPTION */}
          <Text style={[styles.inputLabel, { color: colors.text }]}>توضیحات و متن پست:</Text>
          <TextInput
            style={[
              styles.inputTextArea, 
              { 
                color: colors.text, 
                borderColor: colors.border, 
                backgroundColor: colors.surface 
              }
            ]}
            placeholder="درباره این نمونه کار، تجربه تدریس، نکته آموزشی یا مبحث کلاسی توضیح دهید..."
            placeholderTextColor={colors.textLight}
            value={text}
            onChangeText={(val) => { if (val.length <= MAX_CHARS) setText(val); }}
            multiline
            textAlignVertical="top"
            editable={!isSubmitting}
          />
          <Text style={[styles.charCounter, { color: colors.textLight }]}>
            {toPersianNumbers(text.length)}/{toPersianNumbers(MAX_CHARS)} کاراکتر
          </Text>

          {/* Progress / Spinner */}
          {uploadProgressText ? (
            <View style={styles.progressRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.progressText, { color: colors.primary }]}>{uploadProgressText}</Text>
            </View>
          ) : null}

          {/* 3. SUBMIT BUTTON */}
          <TouchableOpacity 
            style={[
              styles.submitBtn, 
              { backgroundColor: isFormValid && !isSubmitting ? colors.primary : colors.border }
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>انتشار در جامعه معلمان کیتایار</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 15.5,
    fontFamily: FONT_FAMILY.bold,
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  // Full-width Dashed Media Area
  mediaSquareArea: {
    width: '100%',
    height: 200,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    padding: 20,
  },
  uploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  sizeNoticeBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  sizeNoticeText: {
    color: '#2563eb',
    fontSize: 11,
    fontFamily: FONT_FAMILY.bold,
  },
  mediaPreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  videoPreviewWrap: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 16,
  },
  videoIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  videoFilenameText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'center',
  },
  videoSizeText: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 4,
    textAlign: 'center',
  },
  removeMediaBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Text Input
  inputLabel: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
    marginBottom: 8,
  },
  inputTextArea: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13.5,
    fontFamily: FONT_FAMILY.regular,
    height: 140,
    textAlign: 'right',
  },
  charCounter: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 20,
  },
  progressRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  progressText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
  },
});

export default NewPostScreen;
