import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, I18nManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, ChevronLeft, Image as ImageIcon, X } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import ImagePicker from 'react-native-image-crop-picker';

const MAX_CHARS = 500;

const NewPostScreen = ({ navigation }: any) => {
  const { colors } = useTheme();

  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSelectImage = async () => {
    try {
      const image = await ImagePicker.openPicker({
        mediaType: 'photo',
        cropping: false,
      });

      // Simple validation: 10MB approx
      if (image.size && image.size > 10 * 1024 * 1024) {
        setErrorMsg('حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد.');
        return;
      }

      setImageUri(image.path);
      setErrorMsg('');
    } catch (err) {
      // User cancelled
    }
  };

  const handleSubmit = () => {
    if (!text.trim() && !imageUri) return;
    
    // Fake submission delay
    setTimeout(() => {
      navigation.goBack();
    }, 500);
  };

  const isFormValid = text.trim().length > 0 || imageUri;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          {I18nManager.isRTL ? <ChevronRight color={colors.text} size={28} /> : <ChevronLeft color={colors.text} size={28} />}
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>ارسال پست جدید</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <TextInput
          style={[styles.inputTextArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
          placeholder="متن پست را اینجا بنویسید..."
          placeholderTextColor={colors.textLight}
          value={text}
          onChangeText={(val) => { if (val.length <= MAX_CHARS) setText(val); }}
          multiline
          textAlignVertical="top"
        />
        <Text style={[styles.charCounter, { color: colors.textLight }]}>
          {text.length}/{MAX_CHARS}
        </Text>

        <TouchableOpacity 
          style={[styles.imageUploadArea, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={handleSelectImage}
        >
          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
              <TouchableOpacity 
                style={styles.removeImageBtn} 
                onPress={() => setImageUri(null)}
              >
                <X color="#fff" size={20} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <ImageIcon color={colors.textLight} size={40} />
              <Text style={[styles.uploadTitle, { color: colors.text }]}>افزودن عکس</Text>
              <Text style={[styles.uploadSubtitle, { color: colors.textLight }]}>
                حداکثر یک عکس - هر عکس تا 10 مگابایت
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {errorMsg ? (
          <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
        ) : null}

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.cancelBtn, { backgroundColor: colors.surface }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.cancelText, { color: colors.text }]}>انصراف</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: isFormValid ? colors.primary : colors.surface }]}
            disabled={!isFormValid}
            onPress={handleSubmit}
          >
            <Text style={[styles.submitText, { color: isFormValid ? '#fff' : colors.textLight }]}>ارسال</Text>
          </TouchableOpacity>
        </View>

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
  inputTextArea: {
    minHeight: 180, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16,
    fontFamily: 'IRANSansX', textAlign: I18nManager.isRTL ? 'right' : 'left'
  },
  charCounter: {
    fontFamily: 'monospace', fontSize: 12, textAlign: I18nManager.isRTL ? 'left' : 'right',
    marginTop: 8, marginBottom: 24, paddingHorizontal: 8
  },
  imageUploadArea: {
    borderRadius: 12, borderWidth: 1, borderStyle: 'dashed',
    minHeight: 150, justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, overflow: 'hidden'
  },
  uploadPlaceholder: {
    alignItems: 'center', padding: 20
  },
  uploadTitle: {
    fontSize: 16, fontWeight: 'bold', fontFamily: 'IRANSansX', marginTop: 12, marginBottom: 4
  },
  uploadSubtitle: {
    fontSize: 12, fontFamily: 'IRANSansX'
  },
  imagePreviewContainer: {
    width: '100%', height: 200, position: 'relative'
  },
  imagePreview: {
    width: '100%', height: '100%'
  },
  removeImageBtn: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)', width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center'
  },
  errorText: {
    fontFamily: 'IRANSansX', fontSize: 12, marginBottom: 16, textAlign: 'center'
  },
  actionRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    justifyContent: 'space-between', marginTop: 24
  },
  cancelBtn: {
    flex: 1, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    marginLeft: I18nManager.isRTL ? 12 : 0, marginRight: I18nManager.isRTL ? 0 : 12
  },
  cancelText: {
    fontSize: 16, fontWeight: 'bold', fontFamily: 'IRANSansX'
  },
  submitBtn: {
    flex: 2, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center'
  },
  submitText: {
    fontSize: 16, fontWeight: 'bold', fontFamily: 'IRANSansX'
  }
});

export default NewPostScreen;
