import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/axiosConfig';
import { showSuccess, showError, showWarning } from '../../components/feedback';
import {
  ChevronRight,
  BookOpen,
  FileText,
  Upload,
  CheckCircle2,
  DollarSign,
} from 'lucide-react-native';

export const UploadMaterialScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState('25000');
  const [pageCount, setPageCount] = useState('12');
  const [previewFileUrl, setPreviewFileUrl] = useState('');
  const [fullFileUrl, setFullFileUrl] = useState('');
  const [fileType, setFileType] = useState<'pdf' | 'video' | 'audio' | 'document'>('pdf');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      showWarning('لطفاً عنوان جزوه را وارد کنید');
      return;
    }
    if (!fullFileUrl.trim()) {
      showWarning('لطفاً آدرس یا لینک فایل اصلی را وارد کنید');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post('/teacher/center/materials', {
        title: title.trim(),
        description: description.trim(),
        price: isFree ? 0 : Number(price) || 0,
        pageCount: Number(pageCount) || 0,
        previewFileUrl: previewFileUrl.trim() || undefined,
        fullFileUrl: fullFileUrl.trim(),
        fileType,
      });

      if (response.data?.success) {
        showSuccess('جزوه آموزشی با موفقیت منتشر گردید');
        navigation.goBack();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'خطا در ثبت و انتشار جزوه');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronRight size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>انتشار جزوه و منبع آموزشی</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Form Fields */}
        <Text style={[styles.label, { color: colors.text }]}>عنوان جزوه یا منبع آموزشی *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="مثلاً: خلاصه کامل فصل سوم فیزیک دوازدهم با حل تست"
          placeholderTextColor={colors.textLight}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.label, { color: colors.text }]}>توضیحات و سرفصل‌ها</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
              height: 90,
            },
          ]}
          placeholder="شرح مباحث تدریس شده، مناسب برای کدام پایه‌ها و..."
          placeholderTextColor={colors.textLight}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={[styles.label, { color: colors.text }]}>نوع فایل</Text>
        <View style={styles.fileTypeRow}>
          {(['pdf', 'video', 'audio', 'document'] as const).map((ft) => (
            <TouchableOpacity
              key={ft}
              style={[
                styles.fileTypeBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
                fileType === ft && { backgroundColor: colors.primary + '18', borderColor: colors.primary },
              ]}
              onPress={() => setFileType(ft)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.fileTypeText,
                  {
                    color: fileType === ft ? colors.primary : colors.textLight,
                    fontFamily: fileType === ft ? 'Estedad-FD-Bold' : 'Estedad-FD-Regular',
                  },
                ]}
              >
                {ft === 'pdf' ? '📄 PDF' : ft === 'video' ? '🎬 ویدیو' : ft === 'audio' ? '🎙 صوتی' : '📑 سند'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Free toggle */}
        <View style={[styles.switchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View>
            <Text style={[styles.switchTitle, { color: colors.text }]}>انتشار رایگان برای همه</Text>
            <Text style={[styles.switchSub, { color: colors.textLight }]}>
              دانش‌آموزان بدون کسر اعتبار می‌توانند دانلود کنند
            </Text>
          </View>
          <Switch
            value={isFree}
            onValueChange={setIsFree}
            trackColor={{ false: '#CBD5E1', true: colors.primary }}
          />
        </View>

        {!isFree && (
          <>
            <Text style={[styles.label, { color: colors.text }]}>قیمت فروش به تومان *</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
              ]}
              placeholder="مثلاً: ۲۵۰۰۰"
              placeholderTextColor={colors.textLight}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </>
        )}

        <Text style={[styles.label, { color: colors.text }]}>تعداد صفحات (اختیاری)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="مثلاً: ۱۲"
          placeholderTextColor={colors.textLight}
          value={pageCount}
          onChangeText={setPageCount}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: colors.text }]}>لینک نمونه / پیش‌نمایش رایگان (اختیاری)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="آدرس اینترنتی فایل نمونه یا چند صفحه اول..."
          placeholderTextColor={colors.textLight}
          value={previewFileUrl}
          onChangeText={setPreviewFileUrl}
        />

        <Text style={[styles.label, { color: colors.text }]}>لینک فایل اصلی و کامل *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="آدرس امن فایل کامل که پس از خرید دانلود می‌شود..."
          placeholderTextColor={colors.textLight}
          value={fullFileUrl}
          onChangeText={setFullFileUrl}
        />

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>ثبت و انتشار در فروشگاه</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontFamily: 'Estedad-FD-Bold' },
  content: { flex: 1 },
  contentContainer: { padding: 16, gap: 8 },
  label: { fontSize: 12, fontFamily: 'Estedad-FD-Bold', textAlign: 'right', marginTop: 10, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Estedad-FD-Regular',
    fontSize: 13,
    textAlign: 'right',
  },
  fileTypeRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  fileTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  fileTypeText: { fontSize: 12 },
  switchRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  switchTitle: { fontSize: 13, fontFamily: 'Estedad-FD-Bold', textAlign: 'right' },
  switchSub: { fontSize: 11, fontFamily: 'Estedad-FD-Regular', textAlign: 'right', marginTop: 2 },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Estedad-FD-Bold',
  },
});

export default UploadMaterialScreen;
