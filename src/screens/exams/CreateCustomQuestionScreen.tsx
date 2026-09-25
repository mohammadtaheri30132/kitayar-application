import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, ActivityIndicator, Alert, Image, NativeModules, Platform, PermissionsAndroid 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, Image as ImageIcon, X, Trash2, StopCircle, Play, Pause, RefreshCw } from 'lucide-react-native';
import ImagePicker from 'react-native-image-crop-picker';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';
import { CustomDropdown } from '../../components/common/CustomDropdown';
import RNFetchBlob from 'react-native-blob-util';

const { AudioRecorderModule } = NativeModules;

const QUESTION_TYPES = [
  { id: '1', label: 'تستی', value: 'تستی' },
  { id: '2', label: 'صحیح-غلط', value: 'صحیح-غلط' },
  { id: '3', label: 'کوتاه-پاسخ', value: 'کوتاه-پاسخ' },
  { id: '4', label: 'گسترده-پاسخ', value: 'گسترده-پاسخ' },
];

const DIFFICULTIES = [
  { id: '1', label: 'ساده', value: 'ساده' },
  { id: '2', label: 'متوسط', value: 'متوسط' },
  { id: '3', label: 'دشوار', value: 'دشوار' },
];

const CreateCustomQuestionScreen = ({ route, navigation }: any) => {
  const { examId, editQuestion } = route.params || {};

  const [type, setType] = useState(editQuestion?.type || 'تستی');
  const [difficulty, setDifficulty] = useState(editQuestion?.difficulty || 'متوسط');
  const [question, setQuestion] = useState(editQuestion?.question || '');
  const [options, setOptions] = useState<string[]>(editQuestion?.options?.length > 0 ? editQuestion.options : ['', '']);
  const [answer, setAnswer] = useState(editQuestion?.answer || '');

  const [imagePath, setImagePath] = useState<string | null>(editQuestion?.source_image || null);
  const [audioPath, setAudioPath] = useState<string | null>(editQuestion?.audioUrl || null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleOptionChange = (text: string, index: number) => {
    const newOptions = [...options];
    newOptions[index] = text;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const handlePickImage = async () => {
    try {
      const image = await ImagePicker.openPicker({
        mediaType: 'photo',
        compressImageQuality: 0.6,
      });
      setImagePath(image.path);
    } catch (e) {
      console.log(e);
    }
  };

  const toggleRecording = async () => {
    if (Platform.OS !== 'android' || !AudioRecorderModule) {
      Alert.alert('توجه', 'ضبط صدا فقط در اندروید (نسخه نیتیو) فعال است.');
      return;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: "دسترسی به میکروفون",
          message: "برای ضبط صدا نیاز به دسترسی میکروفون داریم.",
          buttonNeutral: "بعدا",
          buttonNegative: "لغو",
          buttonPositive: "تایید"
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('توجه', 'برای ضبط صدا باید دسترسی میکروفون را بدهید.');
        return;
      }
    } catch (err) {
      console.warn(err);
      return;
    }

    if (isRecording) {
      try {
        const path = await AudioRecorderModule.stopRecording();
        setAudioPath(path);
        setIsRecording(false);
      } catch (e) {
        Alert.alert('خطا', 'مشکلی در توقف ضبط پیش آمد.');
        setIsRecording(false);
      }
    } else {
      try {
        await AudioRecorderModule.startRecording();
        setIsRecording(true);
      } catch (e) {
        Alert.alert('خطا', 'مشکلی در شروع ضبط پیش آمد. لطفاً دسترسی میکروفون را تایید کنید.');
      }
    }
  };

  const togglePlayback = async () => {
    if (!audioPath) return;
    try {
      if (isPlaying) {
        await AudioRecorderModule.stopPlaying();
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        await AudioRecorderModule.play(audioPath);
        // We set to false roughly when it finishes, or user can click stop
        setIsPlaying(false);
      }
    } catch (e) {
      console.log(e);
      setIsPlaying(false);
    }
  };

  const uploadFile = async (filePath: string, type: 'image' | 'audio') => {
    // If the path is a remote URL (already uploaded), don't upload again
    if (filePath.startsWith('http')) return filePath;

    try {
      const fileName = filePath.split('/').pop() || 'file';
      const fileData = {
        name: fileName,
        type: type === 'image' ? 'image/jpeg' : 'audio/mp4',
        uri: Platform.OS === 'ios' ? filePath.replace('file://', '') : filePath,
      };

      const formData = new FormData();
      formData.append('file', fileData as any);

      const res = await api.post('/teacher/upload-media', formData);
      return res.data.link;
    } catch (error) {
      console.log('Upload error', error);
      return '';
    }
  };

  const handleSubmit = async () => {
    if (!question.trim()) {
      Alert.alert('توجه', 'متن سوال الزامی است.');
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedImage = '';
      let uploadedAudio = '';

      if (imagePath) {
        uploadedImage = await uploadFile(imagePath, 'image');
      }
      if (audioPath) {
        uploadedAudio = await uploadFile(audioPath, 'audio');
      }

      const payload = {
        type,
        difficulty,
        question,
        options: type === 'تستی' ? options.filter(o => o.trim()) : [],
        answer,
        source_image: uploadedImage,
        audioUrl: uploadedAudio,
        tags: []
      };

      if (editQuestion) {
        const res = await api.put(`/teacher/questions/${editQuestion._id}`, payload);
        if (res.data.success) {
          Alert.alert('موفقیت', 'سوال با موفقیت ویرایش شد.', [
            { text: 'متوجه شدم', onPress: () => navigation.goBack() }
          ]);
        }
      } else {
        const res = await api.post('/teacher/questions', payload);
        if (res.data.success) {
          const newQuestionId = res.data.data._id;
          if (examId) {
            await api.post(`/teacher/exams/${examId}/questions`, {
              questionIds: [newQuestionId]
            });
          }
          Alert.alert('موفقیت', 'سوال شما ساخته و به آزمون اضافه شد.', [
            { text: 'متوجه شدم', onPress: () => navigation.goBack() }
          ]);
        }
      }
    } catch (error: any) {
      console.log('Error saving custom question:', error.response?.data || error.message);
      const msg = error.response?.data?.message || 'در ثبت سوال خطایی رخ داد.';
      Alert.alert('خطا', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>🔙 انصراف</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editQuestion ? 'ویرایش سوال' : 'ایجاد سوال جدید'}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <View style={styles.half}>
            <CustomDropdown
              items={QUESTION_TYPES}
              selectedValue={type}
              onSelect={(i) => setType(i.value)}
              label="نوع سوال"
            />
          </View>
          <View style={styles.half}>
            <CustomDropdown
              items={DIFFICULTIES}
              selectedValue={difficulty}
              onSelect={(i) => setDifficulty(i.value)}
              label="سختی"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>متن سوال</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            placeholder="سوال خود را اینجا بنویسید..."
            value={question}
            onChangeText={setQuestion}
            textAlignVertical="top"
          />
        </View>

        {type === 'تستی' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>گزینه‌ها</Text>
            {options.map((opt, index) => (
              <View key={index} style={styles.optionRow}>
                <TouchableOpacity onPress={() => handleRemoveOption(index)} style={styles.removeBtn}>
                  <Trash2 color={COLORS.error} size={20} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder={`گزینه ${index + 1}`}
                  value={opt}
                  onChangeText={(txt) => handleOptionChange(txt, index)}
                />
              </View>
            ))}
            <TouchableOpacity style={styles.addOptionBtn} onPress={handleAddOption}>
              <Text style={styles.addOptionText}>+ افزودن گزینه</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.mediaRow}>
          <TouchableOpacity style={styles.mediaBtn} onPress={handlePickImage}>
            <ImageIcon color={imagePath ? COLORS.primary : COLORS.textLight} size={24} />
            <Text style={[styles.mediaBtnText, imagePath && { color: COLORS.primary }]}>
              {imagePath ? 'تصویر انتخاب شد' : 'افزودن تصویر'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.mediaBtn, isRecording && { backgroundColor: '#fee2e2', borderColor: COLORS.error }]} 
            onPress={toggleRecording}
          >
            {isRecording ? <StopCircle color={COLORS.error} size={24} /> : <Mic color={audioPath ? COLORS.primary : COLORS.textLight} size={24} />}
            <Text style={[styles.mediaBtnText, audioPath && { color: COLORS.primary }, isRecording && { color: COLORS.error }]}>
              {isRecording ? 'در حال ضبط... (توقف)' : audioPath ? 'صدا ضبط شد' : 'ضبط صدا'}
            </Text>
          </TouchableOpacity>
        </View>

        {imagePath && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imagePath }} style={styles.previewImage} />
            <TouchableOpacity style={styles.removePreviewBtn} onPress={() => setImagePath(null)}>
              <X color="#fff" size={20} />
            </TouchableOpacity>
          </View>
        )}

        {audioPath && !isRecording && (
          <View style={styles.audioPreview}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity style={styles.iconBtn} onPress={togglePlayback}>
                {isPlaying ? <Pause color={COLORS.primary} size={24} /> : <Play color={COLORS.primary} size={24} />}
              </TouchableOpacity>
              <Text style={styles.audioText}>{isPlaying ? 'در حال پخش...' : 'فایل صوتی ضبط شد'}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity style={[styles.iconBtn, { marginRight: 10 }]} onPress={() => setAudioPath(null)}>
                <RefreshCw color={COLORS.primary} size={20} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => setAudioPath(null)}>
                <Trash2 color={COLORS.error} size={20} />
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>{editQuestion ? 'ذخیره تغییرات' : 'ثبت سوال'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  backButton: { padding: 8 },
  backButtonText: { color: COLORS.textLight, fontSize: 14 },
  content: { padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  half: { width: '48%' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 8, textAlign: 'right' },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12,
    fontSize: 15, color: COLORS.text, backgroundColor: COLORS.surface, textAlign: 'right'
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  optionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  removeBtn: { padding: 10, marginRight: 8 },
  addOptionBtn: { alignSelf: 'flex-start', padding: 8 },
  addOptionText: { color: COLORS.primary, fontWeight: 'bold' },
  mediaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  mediaBtn: {
    flex: 0.48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 16
  },
  mediaBtnText: { marginLeft: 8, fontSize: 14, color: COLORS.textLight, fontWeight: 'bold' },
  previewContainer: { position: 'relative', marginBottom: 20, borderRadius: 12, overflow: 'hidden' },
  previewImage: { width: '100%', height: 200, resizeMode: 'cover' },
  removePreviewBtn: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 20 },
  audioPreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#eff6ff', padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#bfdbfe' },
  audioText: { color: COLORS.primary, fontWeight: 'bold', marginRight: 8 },
  iconBtn: { padding: 8, backgroundColor: COLORS.surface, borderRadius: 8, elevation: 1 },
  footer: { padding: 20, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  submitBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default CreateCustomQuestionScreen;
