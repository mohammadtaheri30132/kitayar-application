import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, I18nManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, ChevronLeft, Check, Plus } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';

const SUGGESTED_TAGS = ['آموزشی', 'کلاسداری', 'ارزشیابی', 'سایر'];

const NewQuestionScreen = ({ navigation }: any) => {
  const { colors } = useTheme();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const [showSuccess, setShowSuccess] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !body.trim()) return;

    // Simulate saving and showing success message
    setShowSuccess(true);
    setTimeout(() => {
      navigation.goBack();
    }, 1500);
  };

  const isFormValid = title.trim().length > 0 && body.trim().length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          {I18nManager.isRTL ? <ChevronRight color={colors.text} size={28} /> : <ChevronLeft color={colors.text} size={28} />}
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>پرسش جدید</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {showSuccess && (
          <View style={[styles.successBox, { backgroundColor: '#10b98120', borderColor: '#10b981' }]}>
            <Check color="#10b981" size={24} />
            <Text style={[styles.successText, { color: '#10b981' }]}>سوال شما با موفقیت ثبت شد.</Text>
          </View>
        )}

        <Text style={[styles.label, { color: colors.text }]}>عنوان سوال *</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
          placeholder="عنوان سوال را بنویسید..."
          placeholderTextColor={colors.textLight}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.label, { color: colors.text }]}>متن سوال *</Text>
        <TextInput
          style={[styles.inputTextArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
          placeholder="متن سوال را به طور کامل توضیح دهید..."
          placeholderTextColor={colors.textLight}
          value={body}
          onChangeText={setBody}
          multiline
          textAlignVertical="top"
        />

        <Text style={[styles.label, { color: colors.text }]}>برچسب‌ها (اختیاری)</Text>
        <View style={styles.tagsContainer}>
          {SUGGESTED_TAGS.map(tag => {
            const isSelected = selectedTags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tag,
                  { 
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border
                  }
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.tagText, { color: isSelected ? '#fff' : colors.textLight }]}>{tag}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border, borderStyle: 'dashed' }]}>
            <Plus color={colors.textLight} size={16} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: isFormValid ? colors.primary : colors.surface }]}
          disabled={!isFormValid || showSuccess}
          onPress={handleSubmit}
        >
          <Text style={[styles.submitText, { color: isFormValid ? '#fff' : colors.textLight }]}>ثبت سوال</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'IRANSansX' },
  content: { padding: 20 },
  successBox: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 20
  },
  successText: { fontSize: 14, fontWeight: 'bold', fontFamily: 'IRANSansX', marginHorizontal: 12 },
  label: {
    fontSize: 14, fontWeight: 'bold', fontFamily: 'IRANSansX', marginBottom: 8,
    textAlign: I18nManager.isRTL ? 'right' : 'left'
  },
  input: {
    height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16,
    fontFamily: 'IRANSansX', marginBottom: 20, textAlign: I18nManager.isRTL ? 'right' : 'left'
  },
  inputTextArea: {
    minHeight: 120, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16,
    fontFamily: 'IRANSansX', marginBottom: 20, textAlign: I18nManager.isRTL ? 'right' : 'left'
  },
  tagsContainer: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    flexWrap: 'wrap', marginBottom: 40
  },
  tag: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
    marginHorizontal: 4, marginBottom: 8, flexDirection: 'row', alignItems: 'center'
  },
  tagText: { fontSize: 13, fontFamily: 'IRANSansX' },
  submitBtn: {
    height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center'
  },
  submitText: { fontSize: 16, fontWeight: 'bold', fontFamily: 'IRANSansX' }
});

export default NewQuestionScreen;
