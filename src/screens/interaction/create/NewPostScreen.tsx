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
  I18nManager 
} from 'react-native';
import { showError, showWarning, showSuccess } from '../../../components/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, ChevronLeft, Image as ImageIcon, X } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import ImagePicker from 'react-native-image-crop-picker';
import { communityService } from '../../../services/community/communityService';

const MAX_CHARS = 1000;

const NewPostScreen = ({ navigation }: any) => {
  const { colors } = useTheme();

  const [text, setText] = useState('');
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');

  const handleSelectImage = async () => {
    try {
      const image = await ImagePicker.openPicker({
        mediaType: 'photo',
        cropping: false,
      });

      if (image.size && image.size > 10 * 1024 * 1024) {
        showWarning('حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد.');
        return;
      }

      setLocalImageUri(image.path);
      const filename = image.filename || `post_${Date.now()}.jpg`;
      setImageFileName(filename);
      setImageMime(image.mime || 'image/jpeg');
    } catch {
      // User cancelled
    }
  };

  const handleSubmit = async () => {
    if (!text.trim() && !localImageUri) {
      showWarning('لطفاً متن پست یا یک تصویر اضافه کنید.');
      return;
    }

    try {
      setIsSubmitting(true);
      const images: string[] = [];

      if (localImageUri) {
        setUploadProgressText('در حال بارگذاری تصویر...');
        const uploadedUrl = await communityService.uploadAttachment(
          localImageUri,
          imageFileName,
          imageMime
        );
        if (uploadedUrl) {
          images.push(uploadedUrl);
        }
      }

      setUploadProgressText('در حال ذخیره پست...');
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

  const isFormValid = text.trim().length > 0 || !!localImageUri;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} disabled={isSubmitting}>
          {I18nManager.isRTL ? <ChevronRight color={colors.text} size={28} /> : <ChevronLeft color={colors.text} size={28} />}
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>ارسال تجربه / پست جدید</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          style={[styles.inputTextArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          placeholder="تجربه تدریس، چالش کلاسی، روش نوآورانه یا مطلب خود را بنویسید..."
          placeholderTextColor={colors.textLight}
          value={text}
          onChangeText={(val) => { if (val.length <= MAX_CHARS) setText(val); }}
          multiline
          textAlignVertical="top"
          editable={!isSubmitting}
        />
        <Text style={[styles.charCounter, { color: colors.textLight }]}>
          {text.length}/{MAX_CHARS}
        </Text>

        <TouchableOpacity 
          style={[styles.imageUploadArea, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={handleSelectImage}
          disabled={isSubmitting}
        >
          {localImageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: localImageUri }} style={styles.imagePreview} resizeMode="cover" />
              <TouchableOpacity 
                style={styles.removeImageBtn} 
                onPress={() => setLocalImageUri(null)}
                disabled={isSubmitting}
              >
                <X color="#fff" size={20} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <ImageIcon color={colors.textLight} size={40} />
              <Text style={[styles.uploadTitle, { color: colors.text }]}>افزودن عکس به پست</Text>
              <Text style={[styles.uploadSubtitle, { color: colors.textLight }]}>
                یک تصویر مرتبط با تجربه آموزشی خود انتخاب کنید (حداکثر ۱۰ مگابایت)
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {uploadProgressText ? (
          <View style={styles.progressRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.progressText, { color: colors.primary }]}>{uploadProgressText}</Text>
          </View>
        ) : null}

        <TouchableOpacity 
          style={[
            styles.submitBtn, 
            { backgroundColor: isFormValid && !isSubmitting ? colors.primary : colors.border }
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>انتشار در جامعه معلمان</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  inputTextArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'IRANSansX',
    height: 160,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  charCounter: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 16,
  },
  imageUploadArea: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    overflow: 'hidden',
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    padding: 20,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    marginTop: 8,
  },
  uploadSubtitle: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    textAlign: 'center',
    marginTop: 4,
  },
  imagePreviewContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#00000080',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  progressText: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    fontWeight: '500',
  },
  submitBtn: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  }
});

export default NewPostScreen;
