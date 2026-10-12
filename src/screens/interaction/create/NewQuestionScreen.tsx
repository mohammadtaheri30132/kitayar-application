import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  I18nManager 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, ChevronLeft, Check, Plus, Folder, Tag } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { communityService, CommunityCategoryItem } from '../../../services/community/communityService';

const NewQuestionScreen = ({ navigation }: any) => {
  const { colors } = useTheme();

  const [categories, setCategories] = useState<CommunityCategoryItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  
  const [isLoadingCats, setIsLoadingCats] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoadingCats(true);
      const data = await communityService.getCategories();
      setCategories(data);
      if (data.length > 0) {
        setSelectedCategoryId(data[0]._id);
      }
    } catch (err) {
      Alert.alert('خطا', 'امکان بارگذاری دسته‌بندی‌ها وجود ندارد.');
    } finally {
      setIsLoadingCats(false);
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter(item => item !== t));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('خطا', 'لطفاً عنوان سوال را وارد کنید.');
      return;
    }
    if (!body.trim()) {
      Alert.alert('خطا', 'لطفاً متن سوال را وارد کنید.');
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert('خطا', 'لطفاً یک دسته‌بندی برای سوال انتخاب کنید.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await communityService.createQuestion({
        title: title.trim(),
        body: body.trim(),
        category: selectedCategoryId,
        tags,
      });

      const alertTitle = res.isPending ? 'در انتظار بررسی' : 'موفقیت';
      const alertMsg = res.message || (res.isPending 
        ? 'پرسش شما ثبت شد و پس از بررسی و تایید ناظر در تالار گفتگو منتشر خواهد شد.'
        : 'پرسش شما با موفقیت در تالار گفتگو منتشر شد.');

      Alert.alert(alertTitle, alertMsg, [
        { text: 'متوجه شدم', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'خطا در ثبت سوال. لطفاً دوباره تلاش کنید.';
      Alert.alert('خطا', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = title.trim().length > 3 && body.trim().length > 10 && !!selectedCategoryId;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          {I18nManager.isRTL ? <ChevronRight color={colors.text} size={28} /> : <ChevronLeft color={colors.text} size={28} />}
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>طرح پرسش جدید</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Category Selector */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Folder size={16} color={colors.primary} />
            <Text style={[styles.label, { color: colors.text }]}>دسته‌بندی موضوعی *</Text>
          </View>
          {isLoadingCats ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: 'flex-start', marginVertical: 8 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catChipsContainer}>
              {categories.map(cat => {
                const isSelected = selectedCategoryId === cat._id;
                return (
                  <TouchableOpacity
                    key={cat._id}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => setSelectedCategoryId(cat._id)}
                  >
                    <Text style={[styles.catChipText, { color: isSelected ? '#fff' : colors.text }]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>عنوان سوال *</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            placeholder="مثال: روش مناسب برای آموزش جدول ضرب به دانش‌آموزان با اختلال یادگیری"
            placeholderTextColor={colors.textLight}
            value={title}
            onChangeText={setTitle}
            maxLength={150}
          />
        </View>

        {/* Body */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>متن و شرح کامل سوال *</Text>
          <TextInput
            style={[styles.inputTextArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            placeholder="جزئیات مسئله، مقطع تحصیلی، روش‌هایی که امتحان کردید و هر نکته لازم را شرح دهید..."
            placeholderTextColor={colors.textLight}
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Tag size={16} color={colors.primary} />
            <Text style={[styles.label, { color: colors.text }]}>برچسب‌ها (اختیاری)</Text>
          </View>
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.tagInputField, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              placeholder="کلمه کلیدی را بنویسید و + بزنید..."
              placeholderTextColor={colors.textLight}
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={handleAddTag}
            />
            <TouchableOpacity 
              style={[styles.addTagBtn, { backgroundColor: colors.primary }]}
              onPress={handleAddTag}
            >
              <Plus color="#fff" size={20} />
            </TouchableOpacity>
          </View>

          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tagBadge, { backgroundColor: colors.primary + '18', borderColor: colors.primary }]}
                  onPress={() => handleRemoveTag(t)}
                >
                  <Text style={[styles.tagBadgeText, { color: colors.primary }]}>#{t} ✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Submit Button */}
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
            <Text style={styles.submitBtnText}>انتشار پرسش</Text>
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
  section: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  catChipsContainer: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    gap: 8,
    paddingVertical: 4,
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'IRANSansX',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  inputTextArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'IRANSansX',
    height: 140,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  tagInputRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    gap: 8,
    marginBottom: 8,
  },
  tagInputField: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: 'IRANSansX',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  addTagBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagBadgeText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
  },
  submitBtn: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  }
});

export default NewQuestionScreen;
