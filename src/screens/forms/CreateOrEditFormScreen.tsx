import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  ActivityIndicator,
  Modal,
  Platform,
  NativeModules,
  I18nManager,
  Image,
  PermissionsAndroid,
} from 'react-native';
import { showError, showWarning, showSuccess, showConfirm } from '../../components/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import {
  ArrowRight,
  Plus,
  Trash2,
  Edit3,
  Save,
  CheckCircle,
  Calendar,
  Clock,
  Check,
  Smartphone,
  Layers,
  FileText,
  Star,
  Mic,
  Upload,
  X,
  Radio,
  CheckSquare,
  HelpCircle,
  ChevronDown,
  Camera,
  Image as ImageIcon,
  Play,
  Square,
  Volume2,
} from 'lucide-react-native';
import * as jalaali from 'jalaali-js';
import {
  formService,
  FormDataModel,
  QuestionItem,
  QuestionType,
  QuestionOption,
} from '../../services/forms/formService';
import FilePickerModule from '../../native/FilePicker';
import { COLORS } from '../../theme/colors';
import { formatIsoToJalali, toPersianNumbers } from '../../utils/date/jalaliHelper';

const { AudioRecorderModule } = NativeModules;

interface CreateOrEditFormScreenProps {
  route: any;
  navigation: any;
}

export const CreateOrEditFormScreen: React.FC<CreateOrEditFormScreenProps> = ({ route, navigation }) => {
  const formId = route.params?.formId;

  // Wizard Step: 1 = Form Info, 2 = Add/Edit Questions One-by-One, 3 = Questions List & Reorder, 4 = Settings & Publish
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  const [loading, setLoading] = useState<boolean>(Boolean(formId));
  const [saving, setSaving] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // STEP 1 STATE: Basic Info & Visual Mode
  // --------------------------------------------------------------------------
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [presentationMode, setPresentationMode] = useState<'conversational' | 'traditional'>('conversational');
  const [status, setStatus] = useState<'draft' | 'published' | 'closed' | 'archived' | 'scheduled'>('published');
  const [publicSlug, setPublicSlug] = useState<string>('');

  // --------------------------------------------------------------------------
  // STEP 2 & 3 STATE: Questions Collection & Active Question Editor
  // --------------------------------------------------------------------------
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Question Type Dropdown Modal State
  const [typeDropdownVisible, setTypeDropdownVisible] = useState<boolean>(false);
  const [imagePickerModalVisible, setImagePickerModalVisible] = useState<boolean>(false);

  // Active question fields being drafted in Step 2
  const [qType, setQType] = useState<QuestionType>('single_choice');
  const [qTitle, setQTitle] = useState<string>('');
  const [qDesc, setQDesc] = useState<string>('');
  const [qRequired, setQRequired] = useState<boolean>(true);
  const [qPromptImage, setQPromptImage] = useState<string>('');
  const [qPromptAudio, setQPromptAudio] = useState<string>('');
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);

  const recordTimerRef = useRef<any>(null);
  const playbackTimerRef = useRef<any>(null);

  const [qAllowImageAttach, setQAllowImageAttach] = useState<boolean>(false);
  const [qAllowAudioAttach, setQAllowAudioAttach] = useState<boolean>(false);
  const [qOptions, setQOptions] = useState<QuestionOption[]>([
    { id: 'opt_1', label: 'گزینه اول' },
    { id: 'opt_2', label: 'گزینه دوم' },
  ]);

  // --------------------------------------------------------------------------
  // STEP 4 STATE: Settings & Publication
  // --------------------------------------------------------------------------
  const [limitOnePerDevice, setLimitOnePerDevice] = useState<boolean>(true);
  const [formPassword, setFormPassword] = useState<string>('');
  const [completionTitle, setCompletionTitle] = useState<string>('با تشکر از مشارکت شما');
  const [completionMessage, setCompletionMessage] = useState<string>('پاسخ شما با موفقیت در سیستم کیتایار ثبت شد.');

  // Publication timing: publish immediately (default) or scheduled
  const [publishImmediately, setPublishImmediately] = useState<boolean>(true);
  const [hasScheduleStart, setHasScheduleStart] = useState<boolean>(false);
  const [scheduleStartDateStr, setScheduleStartDateStr] = useState<string>('');

  // Deadline for auto-closing
  const [hasEndDate, setHasEndDate] = useState<boolean>(false);
  const [endDateStr, setEndDateStr] = useState<string>('');

  const QUESTION_TYPE_OPTIONS: { type: QuestionType; label: string; icon: any }[] = [
    { type: 'single_choice', label: 'تستی تک‌انتخابی', icon: Radio },
    { type: 'multiple_choice', label: 'چندانتخابی', icon: CheckSquare },
    { type: 'short_text', label: 'پاسخ متنی کوتاه', icon: FileText },
    { type: 'long_text', label: 'پاسخ متنی بلند تشریحی', icon: FileText },
    { type: 'rating_stars', label: 'امتیاز ستاره‌ای', icon: Star },
    { type: 'image_upload', label: 'ارسال تصویر', icon: ImageIcon },
    { type: 'audio_record', label: 'ضبط صدا', icon: Mic },
    { type: 'true_false', label: 'صحیح / غلط', icon: CheckCircle },
  ];

  // --------------------------------------------------------------------------
  // LOAD EXISTING FORM IF EDITING
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (formId) {
      loadFormData(formId);
    }
  }, [formId]);

  useEffect(() => {
    if (route.params?.scannedImageUri) {
      setQPromptImage(route.params.scannedImageUri);
      setCurrentStep(2); // Fix for Issue 1: stay directly on Step 2
      navigation.setParams({ scannedImageUri: undefined });
    }
  }, [route.params?.scannedImageUri]);

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      if (AudioRecorderModule) {
        try {
          AudioRecorderModule.stopPlaying();
        } catch {}
      }
    };
  }, []);

  const loadFormData = async (id: string) => {
    try {
      setLoading(true);
      const f = await formService.getFormById(id);
      if (f) {
        setTitle(f.title || '');
        setDescription(f.description || '');
        setStatus(f.status || 'published');
        setPublicSlug(f.publicSlug || '');
        setPresentationMode(f.theme?.mode || 'conversational');
        setCompletionTitle(f.theme?.completionTitle || 'با تشکر از مشارکت شما');
        setCompletionMessage(f.theme?.completionMessage || 'پاسخ شما با موفقیت ثبت شد.');

        setLimitOnePerDevice(f.settings?.limitOnePerDevice ?? true);
        setFormPassword(f.settings?.password || '');

        if (f.settings?.startDate) {
          setPublishImmediately(false);
          setHasScheduleStart(true);
          setScheduleStartDateStr(new Date(f.settings.startDate).toISOString());
        } else {
          setPublishImmediately(true);
        }

        if (f.settings?.endDate) {
          setHasEndDate(true);
          setEndDateStr(new Date(f.settings.endDate).toISOString());
        }

        const qList = (f.questions || []).sort((a: QuestionItem, b: QuestionItem) => a.order - b.order);
        setQuestions(qList);
      }
    } catch (err: any) {
      showError('خطا در بارگذاری اطلاعات فرم.');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // NATIVE PERSIAN DATE & TIME PICKER HANDLERS
  // --------------------------------------------------------------------------
  const openPersianDateTimePicker = async (target: 'start' | 'end') => {
    try {
      const todayJ = jalaali.toJalaali(new Date());
      const currentIso = target === 'start' ? scheduleStartDateStr : endDateStr;
      let jY = todayJ.jy,
        jM = todayJ.jm,
        jD = todayJ.jd;
      let hours = 18,
        minutes = 0;

      if (currentIso) {
        const d = new Date(currentIso);
        if (!isNaN(d.getTime())) {
          const j = jalaali.toJalaali(d);
          jY = j.jy;
          jM = j.jm;
          jD = j.jd;
          hours = d.getHours();
          minutes = d.getMinutes();
        }
      }

      if (NativeModules.PersianDatePicker) {
        const res = await NativeModules.PersianDatePicker.show({ year: jY, month: jM, day: jD });
        if (res && res.year) {
          DateTimePickerAndroid.open({
            value: new Date(2025, 0, 1, hours, minutes),
            mode: 'time',
            is24Hour: true,
            onChange: (_event, selectedTime) => {
              const h = selectedTime ? selectedTime.getHours() : hours;
              const m = selectedTime ? selectedTime.getMinutes() : minutes;
              const gDate = jalaali.toGregorian(res.year, res.month, res.day);
              const finalDate = new Date(gDate.gy, gDate.gm - 1, gDate.gd, h, m);
              if (target === 'start') {
                setScheduleStartDateStr(finalDate.toISOString());
                setHasScheduleStart(true);
              } else {
                setEndDateStr(finalDate.toISOString());
                setHasEndDate(true);
              }
            },
          });
        }
      } else {
        // Fallback standard DateTimePicker
        DateTimePickerAndroid.open({
          value: currentIso ? new Date(currentIso) : new Date(),
          mode: 'date',
          onChange: (_ev, selDate) => {
            if (selDate) {
              DateTimePickerAndroid.open({
                value: selDate,
                mode: 'time',
                is24Hour: true,
                onChange: (_tEv, finalD) => {
                  if (finalD) {
                    if (target === 'start') {
                      setScheduleStartDateStr(finalD.toISOString());
                      setHasScheduleStart(true);
                    } else {
                      setEndDateStr(finalD.toISOString());
                      setHasEndDate(true);
                    }
                  }
                },
              });
            }
          },
        });
      }
    } catch (e) {
      console.warn('Error opening date picker', e);
    }
  };

  // --------------------------------------------------------------------------
  // QUESTION EDITING HELPER METHODS
  // --------------------------------------------------------------------------
  const resetQuestionEditor = () => {
    if (AudioRecorderModule && isPlayingAudio) {
      try {
        AudioRecorderModule.stopPlaying();
      } catch {}
    }
    setEditingIndex(null);
    setQType('single_choice');
    setQTitle('');
    setQDesc('');
    setQRequired(true);
    setQPromptImage('');
    setQPromptAudio('');
    setIsRecordingAudio(false);
    setIsPlayingAudio(false);
    setRecordSeconds(0);
    setQAllowImageAttach(false);
    setQAllowAudioAttach(false);
    setQOptions([
      { id: 'opt_1', label: 'گزینه اول' },
      { id: 'opt_2', label: 'گزینه دوم' },
    ]);
  };

  const startEditQuestion = (index: number) => {
    if (AudioRecorderModule && isPlayingAudio) {
      try {
        AudioRecorderModule.stopPlaying();
      } catch {}
    }
    const q = questions[index];
    setEditingIndex(index);
    setQType(q.type);
    setQTitle(q.title);
    setQDesc(q.description || '');
    setQRequired(q.required);
    setQPromptImage(q.promptImageUrl || '');
    setQPromptAudio(q.promptAudioUrl || '');
    setIsRecordingAudio(false);
    setIsPlayingAudio(false);
    setRecordSeconds(0);
    setQAllowImageAttach(Boolean(q.allowImageAttachment));
    setQAllowAudioAttach(Boolean(q.allowAudioAttachment));
    setQOptions(
      q.options && q.options.length > 0
        ? JSON.parse(JSON.stringify(q.options))
        : [
            { id: 'opt_1', label: 'گزینه اول' },
            { id: 'opt_2', label: 'گزینه دوم' },
          ]
    );
    setCurrentStep(2);
  };

  const cancelCurrentQuestion = () => {
    if (AudioRecorderModule && isPlayingAudio) {
      try {
        AudioRecorderModule.stopPlaying();
      } catch {}
    }
    if (!qTitle.trim() && !qDesc.trim() && !qPromptImage && !qPromptAudio) {
      resetQuestionEditor();
      if (questions.length > 0) {
        setCurrentStep(3);
      } else {
        setCurrentStep(1);
      }
      return;
    }

    showConfirm({
      title: 'لغو سوال',
      message: 'آیا از لغو این سوال و بازگشت به لیست سوالات اطمینان دارید؟',
      confirmText: 'بله، لغو شود',
      cancelText: 'ادامه ویرایش',
      isDestructive: true,
      icon: 'warning',
      onConfirm: () => {
        resetQuestionEditor();
        if (questions.length > 0) {
          setCurrentStep(3);
        } else {
          setCurrentStep(1);
        }
      },
    });
  };

  const handlePickPromptImageFromGallery = async () => {
    setImagePickerModalVisible(false);
    try {
      const picked = await FilePickerModule.pickImage();
      if (picked) {
        const uri = Array.isArray(picked) ? picked[0] : typeof picked === 'string' ? picked : picked.uri;
        if (uri) setQPromptImage(uri);
      }
    } catch (err: any) {
      if (err?.code !== 'CANCELLED') showError('خطا در انتخاب عکس از گالری');
    }
  };

  const handleScanPromptImage = () => {
    setImagePickerModalVisible(false);
    navigation.navigate('DocumentScannerScreen', {
      returnScreen: 'CreateOrEditFormScreen',
    });
  };

  // --------------------------------------------------------------------------
  // AUDIO RECORDING & PLAYBACK HANDLERS (NATIVE AUDIO RECORDER)
  // --------------------------------------------------------------------------
  const startAudioRecording = async () => {
    if (Platform.OS !== 'android' || !AudioRecorderModule) {
      showWarning('قابلیت ضبط صدای نیتیو در این دستگاه پشتیبانی نمی‌شود.');
      return;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'دسترسی به میکروفون',
          message: 'برای ضبط صدای سوال یا راهنما، نیاز به تایید دسترسی به میکروفون است.',
          buttonPositive: 'تایید دسترسی',
          buttonNegative: 'انصراف',
        }
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        showWarning('دسترسی به میکروفون داده نشد.');
        return;
      }

      await AudioRecorderModule.startRecording();
      setIsRecordingAudio(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      showError(err?.message || 'مشکلی در شروع ضبط صدا پیش آمد.', 'خطا در شروع ضبط');
      setIsRecordingAudio(false);
    }
  };

  const stopAudioRecording = async () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }

    try {
      setIsRecordingAudio(false);
      setIsUploadingAudio(true);
      const localFilePath = await AudioRecorderModule.stopRecording();
      if (localFilePath) {
        const fileName = `voice_${Date.now()}.m4a`;
        const uploadedUrl = await formService.uploadMedia(localFilePath, fileName, 'audio/mp4');
        if (uploadedUrl) {
          setQPromptAudio(uploadedUrl);
        } else {
          showError('خطا در بارگذاری فایل صوتی به سرور.');
        }
      }
    } catch (err: any) {
      showError(err?.message || 'خطا در ذخیره فایل صوتی.', 'خطا در توقف ضبط');
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const togglePlayAudio = async () => {
    if (!qPromptAudio) return;
    try {
      if (isPlayingAudio) {
        await AudioRecorderModule.stopPlaying();
        setIsPlayingAudio(false);
        if (playbackTimerRef.current) {
          clearInterval(playbackTimerRef.current);
          playbackTimerRef.current = null;
        }
      } else {
        const fullUrl = qPromptAudio.startsWith('http')
          ? qPromptAudio
          : `${formService.getPublicFormUrl('').replace(/\/forms\/.*$/, '')}${qPromptAudio}`;

        await AudioRecorderModule.play(fullUrl);
        setIsPlayingAudio(true);

        playbackTimerRef.current = setInterval(async () => {
          try {
            const pos = await AudioRecorderModule.getPlaybackPosition();
            const dur = await AudioRecorderModule.getPlaybackDuration();
            if (pos >= dur && dur > 0) {
              if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
              setIsPlayingAudio(false);
            }
          } catch {
            setIsPlayingAudio(false);
          }
        }, 500);
      }
    } catch (err: any) {
      setIsPlayingAudio(false);
    }
  };

  const handleSaveCurrentQuestion = (andGoToNext: boolean) => {
    if (AudioRecorderModule && isPlayingAudio) {
      try {
        AudioRecorderModule.stopPlaying();
      } catch {}
    }

    if (!qTitle.trim()) {
      showWarning('لطفاً صورت سوال را وارد کنید.');
      return;
    }

    const questionItem: QuestionItem = {
      id: editingIndex !== null ? questions[editingIndex].id : `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: qType,
      title: qTitle.trim(),
      description: qDesc.trim() || undefined,
      required: qRequired,
      order: editingIndex !== null ? questions[editingIndex].order : questions.length + 1,
      promptImageUrl: qPromptImage || undefined,
      promptAudioUrl: qPromptAudio || undefined,
      allowImageAttachment: ['short_text', 'long_text'].includes(qType) ? qAllowImageAttach : undefined,
      allowAudioAttachment: ['short_text', 'long_text'].includes(qType) ? qAllowAudioAttach : undefined,
    };

    if (['single_choice', 'multiple_choice'].includes(qType)) {
      if (qOptions.length < 2) {
        showWarning('حداقل دو گزینه برای سوال تستی تعریف کنید.');
        return;
      }
      questionItem.options = qOptions.map((opt, i) => ({
        id: opt.id || `opt_${i + 1}`,
        label: opt.label.trim() || `گزینه ${toPersianNumbers(i + 1)}`,
      }));
    } else if (qType === 'true_false') {
      questionItem.options = qOptions.slice(0, 2);
    }

    let updatedList = [...questions];
    if (editingIndex !== null) {
      updatedList[editingIndex] = questionItem;
    } else {
      updatedList.push(questionItem);
    }
    setQuestions(updatedList);

    if (andGoToNext) {
      resetQuestionEditor();
      showSuccess(`سوال ${toPersianNumbers(updatedList.length)} ذخیره شد. اکنون مشخصات سوال بعدی را وارد نمایید.`, 'ثبت شد');
    } else {
      resetQuestionEditor();
      setCurrentStep(3);
    }
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === questions.length - 1)) return;
    const target = direction === 'up' ? index - 1 : index + 1;
    const newList = [...questions];
    const temp = newList[index];
    newList[index] = newList[target];
    newList[target] = temp;
    newList.forEach((q, i) => (q.order = i + 1));
    setQuestions(newList);
  };

  const deleteQuestion = (index: number) => {
    showConfirm({
      title: 'حذف سوال',
      message: 'آیا از حذف این سوال اطمینان دارید؟',
      confirmText: 'حذف',
      cancelText: 'انصراف',
      isDestructive: true,
      icon: 'delete',
      onConfirm: () => {
        const newList = questions.filter((_, i) => i !== index);
        newList.forEach((q, i) => (q.order = i + 1));
        setQuestions(newList);
      },
    });
  };

  // --------------------------------------------------------------------------
  // SAVE / PUBLISH TO SERVER
  // --------------------------------------------------------------------------
  const handleFinalSave = async (isDraftMode: boolean) => {
    if (!title.trim()) {
      showWarning('عنوان فرم نمی‌تواند خالی باشد.');
      setCurrentStep(1);
      return;
    }
    if (questions.length === 0) {
      showWarning('فرم باید حداقل دارای ۱ سوال باشد.');
      setCurrentStep(2);
      return;
    }

    try {
      setSaving(true);
      const calculatedStatus = isDraftMode
        ? 'draft'
        : hasScheduleStart && scheduleStartDateStr
        ? 'scheduled'
        : 'published';

      const payload: Partial<FormDataModel> = {
        title: title.trim(),
        description: description.trim(),
        category: 'عمومی',
        formType: 'survey',
        status: calculatedStatus,
        theme: {
          primaryColor: '#3B82F6',
          backgroundColor: '#FFFFFF',
          mode: presentationMode,
          completionTitle: completionTitle.trim(),
          completionMessage: completionMessage.trim(),
          showProgressBar: true,
        },
        settings: {
          accessType: 'public',
          limitOnePerDevice,
          limitOnePerAccount: false,
          isQuiz: false,
          showScoreToRespondent: false,
          showCorrectAnswers: 'never',
          allowPartialSave: true,
          allowMultipleSubmissions: !limitOnePerDevice,
          password: formPassword.trim() || undefined,
          startDate: !publishImmediately && hasScheduleStart && scheduleStartDateStr ? scheduleStartDateStr : undefined,
          endDate: hasEndDate && endDateStr ? endDateStr : undefined,
        },
        questions,
      };

      let res;
      if (formId) {
        res = await formService.updateForm(formId, payload);
      } else {
        res = await formService.createForm(payload);
      }

      if (res && res._id) {
        showSuccess(
          isDraftMode
            ? 'فرم به عنوان پیش‌نویس ذخیره گردید.'
            : 'فرم شما با موفقیت ذخیره و منتشر شد.',
          isDraftMode ? 'ذخیره شد' : 'فرم منتشر شد'
        );
        navigation.navigate('FormDashboardScreen');
      } else {
        showError('خطا در ثبت اطلاعات فرم.');
      }
    } catch (err: any) {
      showError(err.message || 'خطا در برقراری ارتباط با سرور.');
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------------------------------
  // RENDER STEP 1: Basic Info & Visual Mode
  // --------------------------------------------------------------------------
  const renderStep1 = () => (
    <ScrollView
      style={styles.scrollContent}
      contentContainerStyle={{ paddingBottom: 160 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Title Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>مشخصات نظرسنجی</Text>

        <Text style={styles.inputLabel}>عنوان فرم *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="مثلاً: نظرسنجی رضایت از خدمات یا فرم ثبت درخواست"
          placeholderTextColor="#94A3B8"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.inputLabel}>توضیحات و راهنمای شرکت‌کنندگان (اختیاری)</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="توضیحات یا نکات مهم برای پاسخ‌دهندگان..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={3}
          value={description}
          onChangeText={setDescription}
        />
      </View>

      {/* Visual Presentation Mode Selection */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>نحوه نمایش فرم به مخاطب (سبک بصری)</Text>
        <Text style={styles.cardSubtitle}>
          انتخاب کنید فرم در گوشی یا مرورگر مخاطب به چه شکلی رندر شود:
        </Text>

        {/* Visual Card 1: Conversational (Typeform) */}
        <TouchableOpacity
          style={[styles.visualModeCard, presentationMode === 'conversational' && styles.visualModeCardActive]}
          onPress={() => setPresentationMode('conversational')}
          activeOpacity={0.85}
        >
          <View style={styles.visualModeHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Smartphone size={20} color="#3B82F6" style={{ marginLeft: 8 }} />
              <Text style={styles.visualModeTitle}>حالت گفت‌وگویی (تایپ‌فرم - Typeform)</Text>
            </View>
            <View style={[styles.radioDot, presentationMode === 'conversational' && styles.radioDotActive]}>
              {presentationMode === 'conversational' && <View style={styles.radioInner} />}
            </View>
          </View>

          {/* Schematic Graphic Representation */}
          <View style={styles.mockupContainer}>
            <View style={styles.mockupProgressBar}>
              <View style={[styles.mockupProgressFill, { width: '45%' }]} />
            </View>
            <View style={styles.mockupQuestionTag}>
              <Text style={styles.mockupTagText}>سوال ۲ از ۵</Text>
            </View>
            <Text style={styles.mockupQuestionText}>«میزان رضایت خود را چطور ارزیابی می‌کنید؟»</Text>
            <View style={styles.mockupStarsRow}>
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
              <Star size={16} color="#CBD5E1" />
            </View>
            <View style={styles.mockupNextBtn}>
              <Text style={styles.mockupNextBtnText}>بعدی ❯</Text>
            </View>
          </View>

          <Text style={styles.visualModeDesc}>
            نمایش تک‌به‌تک سوالات در کارت‌های متمرکز با نوار پیشرفت و انیمیشن؛ تعامل بسیار بالا، بدون خستگی و ایده‌آل برای صفحه گوشی.
          </Text>
        </TouchableOpacity>

        {/* Visual Card 2: Traditional (Google Forms) */}
        <TouchableOpacity
          style={[styles.visualModeCard, presentationMode === 'traditional' && styles.visualModeCardActive]}
          onPress={() => setPresentationMode('traditional')}
          activeOpacity={0.85}
        >
          <View style={styles.visualModeHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Layers size={20} color="#10B981" style={{ marginLeft: 8 }} />
              <Text style={styles.visualModeTitle}>حالت سنتی و کلاسیک (گوگل‌فرم - Google Forms)</Text>
            </View>
            <View style={[styles.radioDot, presentationMode === 'traditional' && styles.radioDotActive]}>
              {presentationMode === 'traditional' && <View style={styles.radioInner} />}
            </View>
          </View>

          {/* Schematic Graphic Representation */}
          <View style={styles.mockupContainer}>
            <View style={styles.mockupTraditionalRow}>
              <Text style={styles.mockupTraditionalLabel}>۱. نام و نام خانوادگی:</Text>
              <View style={styles.mockupInputBox} />
            </View>
            <View style={styles.mockupTraditionalRow}>
              <Text style={styles.mockupTraditionalLabel}>۲. نظر شما:</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <Text style={styles.mockupOptionText}>○ عالی</Text>
                <Text style={styles.mockupOptionText}>○ متوسط</Text>
                <Text style={styles.mockupOptionText}>○ ضعیف</Text>
              </View>
            </View>
          </View>

          <Text style={styles.visualModeDesc}>
            نمایش تمامی سوالات در یک صفحه بلند با اسکرول عمودی؛ مناسب برای پرسشنامه‌های طولانی و مشاهده کلی.
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.primaryActionButton}
        onPress={() => {
          if (!title.trim()) {
            showWarning('لطفاً ابتدا عنوان فرم را وارد نمایید.');
            return;
          }
          setCurrentStep(2);
        }}
      >
        <Text style={styles.primaryActionText}>مرحله بعد: افزودن سوالات ❯</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // --------------------------------------------------------------------------
  // RENDER STEP 2: Add Questions One-by-One with Live Visual Preview
  // --------------------------------------------------------------------------
  const renderStep2 = () => {
    const questionNumber = editingIndex !== null ? editingIndex + 1 : questions.length + 1;
    const currentTypeConfig = QUESTION_TYPE_OPTIONS.find((t) => t.type === qType) || QUESTION_TYPE_OPTIONS[0];
    const SelectedIcon = currentTypeConfig.icon;

    return (
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Header with Cancel / Close Cross Button */}
          <View style={styles.stepHeaderRow}>
            <View style={styles.badgeNumber}>
              <Text style={styles.badgeNumberText}>سوال {toPersianNumbers(questionNumber)}</Text>
            </View>

            <TouchableOpacity
              style={styles.cancelQuestionBtn}
              onPress={cancelCurrentQuestion}
              activeOpacity={0.7}
            >
              <X size={16} color="#EF4444" style={{ marginLeft: 4 }} />
              <Text style={styles.cancelQuestionText}>لغو این سوال</Text>
            </TouchableOpacity>
          </View>

          {/* Question Type Selection via Persian Dropdown */}
          <Text style={styles.inputLabel}>نوع سوال:</Text>
          <TouchableOpacity
            style={styles.dropdownSelectorBtn}
            onPress={() => setTypeDropdownVisible(true)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <SelectedIcon size={18} color="#3B82F6" style={{ marginLeft: 8 }} />
              <Text style={styles.dropdownSelectedText}>{currentTypeConfig.label}</Text>
            </View>
            <ChevronDown size={18} color="#64748B" />
          </TouchableOpacity>

          {/* Question Title without type prefix */}
          <Text style={styles.inputLabel}>صورت سوال *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="متن سوال را اینجا بنویسید..."
            placeholderTextColor="#94A3B8"
            value={qTitle}
            onChangeText={setQTitle}
          />

          <Text style={styles.inputLabel}>راهنما یا توضیحات تکمیلی (اختیاری)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="توضیح یا راهنما برای شرکت‌کننده..."
            placeholderTextColor="#94A3B8"
            value={qDesc}
            onChangeText={setQDesc}
          />

          {/* Question Prompt Image Attachment Section */}
          <View style={styles.promptImageSection}>
            <Text style={styles.inputLabel}>تصویر این سوال (اختیاری):</Text>
            {qPromptImage ? (
              <View style={styles.promptImagePreviewCard}>
                <Image
                  source={{ uri: qPromptImage }}
                  style={styles.promptImagePreviewImage}
                  resizeMode="contain"
                />
                <View style={styles.promptImageActionsRow}>
                  <TouchableOpacity
                    style={styles.promptImageChangeBtn}
                    onPress={() => setImagePickerModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Edit3 size={15} color="#2563EB" style={{ marginLeft: 4 }} />
                    <Text style={styles.promptImageChangeBtnText}>تغییر تصویر</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.promptImageRemoveBtn}
                    onPress={() => setQPromptImage('')}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={15} color="#EF4444" style={{ marginLeft: 4 }} />
                    <Text style={styles.promptImageRemoveBtnText}>حذف</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addPromptImageBtn}
                onPress={() => setImagePickerModalVisible(true)}
                activeOpacity={0.8}
              >
                <ImageIcon size={18} color="#3B82F6" style={{ marginLeft: 8 }} />
                <Text style={styles.addPromptImageBtnText}>
                  افزودن تصویر به این سوال (گالری یا اسکنر هوشمند)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Question Prompt Audio Recording Section */}
          <View style={styles.promptAudioSection}>
            <Text style={styles.inputLabel}>
              {qType === 'audio_record' ? 'صدای ضبط‌شده سوال توسط معلم (جهت پخش برای مخاطب):' : 'ویس و صدای سوال (اختیاری):'}
            </Text>
            {isUploadingAudio ? (
              <View style={styles.audioUploadingBox}>
                <ActivityIndicator size="small" color="#9333EA" />
                <Text style={styles.audioUploadingText}>در حال بارگذاری و ذخیره ویس ضبط‌شده...</Text>
              </View>
            ) : isRecordingAudio ? (
              <View style={styles.audioRecordingBox}>
                <View style={styles.audioRecordingIndicatorRow}>
                  <View style={styles.recordingPulseDot} />
                  <Text style={styles.audioRecordingTimerText}>
                    00:{recordSeconds < 10 ? '0' : ''}{toPersianNumbers(recordSeconds)}
                  </Text>
                  <Text style={styles.audioRecordingLabel}>در حال ضبط صدای شما...</Text>
                </View>
                <TouchableOpacity
                  style={styles.stopRecordingBtn}
                  onPress={stopAudioRecording}
                  activeOpacity={0.8}
                >
                  <Square size={16} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 6 }} />
                  <Text style={styles.stopRecordingBtnText}>توقف و ثبت ویس</Text>
                </TouchableOpacity>
              </View>
            ) : qPromptAudio ? (
              <View style={styles.promptAudioCard}>
                <TouchableOpacity
                  style={styles.playAudioBtn}
                  onPress={togglePlayAudio}
                  activeOpacity={0.7}
                >
                  {isPlayingAudio ? (
                    <Square size={16} color="#FFFFFF" fill="#FFFFFF" />
                  ) : (
                    <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                  )}
                </TouchableOpacity>
                <View style={{ flex: 1, marginHorizontal: 10 }}>
                  <Text style={styles.promptAudioTitle}>صدای سوال ثبت شد 🎙️</Text>
                  <Text style={styles.promptAudioSubtitle}>
                    {isPlayingAudio ? 'در حال پخش ویس...' : 'برای شنیدن صدای ضبط‌شده کلیک کنید'}
                  </Text>
                </View>
                <View style={styles.promptAudioActionsRow}>
                  <TouchableOpacity
                    style={styles.reRecordAudioBtn}
                    onPress={startAudioRecording}
                    activeOpacity={0.7}
                  >
                    <Mic size={14} color="#9333EA" style={{ marginLeft: 4 }} />
                    <Text style={styles.reRecordAudioBtnText}>ضبط مجدد</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteAudioBtn}
                    onPress={() => setQPromptAudio('')}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={14} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addPromptAudioBtn}
                onPress={startAudioRecording}
                activeOpacity={0.8}
              >
                <Mic size={18} color="#9333EA" style={{ marginLeft: 8 }} />
                <Text style={styles.addPromptAudioBtnText}>
                  {qType === 'audio_record'
                    ? '🎙️ ضبط صدای شما به عنوان ویس سوال (جهت پخش برای کاربر)'
                    : 'ضبط صدای سوال با میکروفون (پیوست ویس)'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Attachment options for text questions */}
          {['short_text', 'long_text'].includes(qType) && (
            <View style={styles.textAttachmentSection}>
              <Text style={styles.textAttachmentTitle}>امکانات پاسخ برای شرکت‌کننده:</Text>
              <View style={styles.settingRow}>
                <Text style={styles.settingTitleSmall}>امکان پیوست تصویر به پاسخ</Text>
                <Switch
                  value={qAllowImageAttach}
                  onValueChange={setQAllowImageAttach}
                  trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                  thumbColor={qAllowImageAttach ? '#3B82F6' : '#F1F5F9'}
                />
              </View>
              <View style={[styles.settingRow, { marginTop: 8 }]}>
                <Text style={styles.settingTitleSmall}>امکان پیوست صدای ضبط‌شده به پاسخ</Text>
                <Switch
                  value={qAllowAudioAttach}
                  onValueChange={setQAllowAudioAttach}
                  trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                  thumbColor={qAllowAudioAttach ? '#3B82F6' : '#F1F5F9'}
                />
              </View>
            </View>
          )}

          {/* Live Mobile Web Preview Container */}
          <View style={styles.livePreviewBox}>
            <View style={styles.livePreviewHeader}>
              <Text style={styles.livePreviewTitle}>پیش‌نمایش خروجی وب (آنچه مخاطب می‌بیند)</Text>
            </View>

            <Text style={styles.previewQuestionTitle}>
              {qTitle.trim() || 'متن سوال را اینجا بنویسید...'}
              {qRequired && <Text style={{ color: '#EF4444' }}> *</Text>}
            </Text>
            {qDesc.trim() ? <Text style={styles.previewQuestionDesc}>{qDesc.trim()}</Text> : null}

            {qPromptImage ? (
              <View style={{ marginVertical: 10, alignItems: 'center' }}>
                <Image
                  source={{ uri: qPromptImage }}
                  style={{ width: '100%', height: 160, borderRadius: 8, backgroundColor: '#F1F5F9' }}
                  resizeMode="contain"
                />
              </View>
            ) : null}

            {qPromptAudio ? (
              <View style={styles.previewAudioPlayerCard}>
                <TouchableOpacity
                  onPress={togglePlayAudio}
                  style={styles.previewAudioPlayBtn}
                  activeOpacity={0.7}
                >
                  {isPlayingAudio ? (
                    <Square size={14} color="#FFFFFF" fill="#FFFFFF" />
                  ) : (
                    <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                  )}
                </TouchableOpacity>
                <View style={{ flex: 1, marginHorizontal: 8 }}>
                  <Text style={styles.previewAudioPlayerText}>پخش ویس ضبط‌شده توسط معلم</Text>
                </View>
                <Volume2 size={16} color="#9333EA" />
              </View>
            ) : null}

            {/* Live Interactive Representation based on type */}
            {['single_choice', 'multiple_choice'].includes(qType) && (
              <View style={{ marginTop: 12 }}>
                {qOptions.map((opt, i) => (
                  <View key={opt.id || i} style={styles.previewOptionRow}>
                    <View style={styles.previewOptionRadio} />
                    <TextInput
                      style={styles.optionInput}
                      placeholder={`عنوان گزینه ${toPersianNumbers(i + 1)}`}
                      value={opt.label}
                      onChangeText={(val) => {
                        const copy = [...qOptions];
                        copy[i].label = val;
                        setQOptions(copy);
                      }}
                    />
                    {qOptions.length > 2 && (
                      <TouchableOpacity
                        onPress={() => {
                          const copy = qOptions.filter((_, idx) => idx !== i);
                          setQOptions(copy);
                        }}
                        style={{ padding: 6 }}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addOptionBtn}
                  onPress={() => {
                    const newOpt: QuestionOption = {
                      id: `opt_${Date.now()}`,
                      label: `گزینه ${toPersianNumbers(qOptions.length + 1)}`,
                    };
                    setQOptions([...qOptions, newOpt]);
                  }}
                >
                  <Plus size={16} color="#3B82F6" style={{ marginLeft: 6 }} />
                  <Text style={styles.addOptionBtnText}>افزودن گزینه جدید</Text>
                </TouchableOpacity>
              </View>
            )}

            {qType === 'true_false' && (
              <View style={{ marginTop: 12, flexDirection: 'row', gap: 12 }}>
                {qOptions.slice(0, 2).map((opt, i) => (
                  <View key={opt.id || i} style={styles.trueFalseCard}>
                    <Text style={styles.trueFalseCardText}>{opt.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {qType === 'short_text' && (
              <View style={styles.previewInputDummy}>
                <Text style={styles.previewPlaceholderText}>کادر ورودی متن کوتاه پاسخ...</Text>
              </View>
            )}

            {qType === 'long_text' && (
              <View style={[styles.previewInputDummy, { height: 75 }]}>
                <Text style={styles.previewPlaceholderText}>کادر متنی چندخطی برای توضیحات و پاسخ تشریحی...</Text>
              </View>
            )}

            {qType === 'rating_stars' && (
              <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 8, justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={28} color="#F59E0B" fill="#FDE68A" />
                ))}
              </View>
            )}

            {qType === 'audio_record' && (
              <View style={styles.previewMediaBox}>
                <View style={styles.previewRecordCircle}>
                  <Mic size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.previewMediaText}>ضبط صدا یا ارسال فایل صوتی ضبط‌شده</Text>
              </View>
            )}

            {qType === 'image_upload' && (
              <View style={styles.previewMediaBox}>
                <ImageIcon size={24} color="#3B82F6" />
                <Text style={styles.previewMediaText}>انتخاب عکس از گالری یا عکاسی مستقیم</Text>
              </View>
            )}
          </View>

          {/* Question Settings Row */}
          <View style={styles.questionSettingsRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Switch
                value={qRequired}
                onValueChange={setQRequired}
                trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                thumbColor={qRequired ? '#3B82F6' : '#F1F5F9'}
              />
              <Text style={{ marginRight: 8, fontSize: 13, color: '#334155', fontWeight: '600' }}>
                پاسخ به این سوال الزامی است
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons for Step 2 */}
        <View style={styles.step2ActionsContainer}>
          <TouchableOpacity
            style={styles.addNextQuestionBtn}
            onPress={() => handleSaveCurrentQuestion(true)}
          >
            <Plus size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            <Text style={styles.addNextQuestionBtnText}>ثبت و سوال بعدی</Text>
          </TouchableOpacity>

          {(questions.length >= 1 || editingIndex !== null) && (
            <TouchableOpacity
              style={styles.finishQuestionsBtn}
              onPress={() => handleSaveCurrentQuestion(false)}
            >
              <Text style={styles.finishQuestionsBtnText}>اتمام سوالات و مشاهده لیست ❯</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  };

  // --------------------------------------------------------------------------
  // RENDER STEP 3: Questions List & Order Review
  // --------------------------------------------------------------------------
  const renderStep3 = () => (
    <ScrollView
      style={styles.scrollContent}
      contentContainerStyle={{ paddingBottom: 160 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <View style={styles.stepHeaderRow}>
          <Text style={styles.cardTitle}>لیست و چیدمان سوالات ({toPersianNumbers(questions.length)} سوال)</Text>
          <TouchableOpacity
            style={styles.addNewQuestionHeaderBtn}
            onPress={() => {
              resetQuestionEditor();
              setCurrentStep(2);
            }}
          >
            <Plus size={16} color="#3B82F6" style={{ marginLeft: 4 }} />
            <Text style={styles.addNewQuestionHeaderText}>+ سوال جدید</Text>
          </TouchableOpacity>
        </View>

        {questions.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 30 }}>
            <HelpCircle size={40} color="#94A3B8" />
            <Text style={{ marginTop: 10, color: '#64748B', fontSize: 14 }}>
              هنوز سوالی ثبت نشده است.
            </Text>
          </View>
        ) : (
          questions.map((q, idx) => (
            <View key={q.id || idx} style={styles.questionListItemCard}>
              <View style={styles.questionListOrderBox}>
                <Text style={styles.questionListOrderText}>{toPersianNumbers(idx + 1)}</Text>
              </View>

              <View style={{ flex: 1, paddingHorizontal: 10 }}>
                <Text style={styles.questionListItemTitle} numberOfLines={2}>
                  {q.title}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <Text style={styles.questionListItemTypeBadge}>
                    {q.type === 'single_choice'
                      ? 'تستی'
                      : q.type === 'multiple_choice'
                      ? 'چندانتخابی'
                      : q.type === 'rating_stars'
                      ? 'امتیازی'
                      : q.type === 'audio_record'
                      ? 'صوتی'
                      : q.type === 'image_upload'
                      ? 'تصویر'
                      : 'متنی'}
                  </Text>
                  {q.required && <Text style={styles.questionListItemReqBadge}>الزامی</Text>}
                </View>
              </View>

              {/* Order and Action Buttons */}
              <View style={styles.questionListActions}>
                <TouchableOpacity
                  style={styles.reorderBtn}
                  onPress={() => moveQuestion(idx, 'up')}
                  disabled={idx === 0}
                >
                  <Text style={[styles.reorderBtnText, idx === 0 && { color: '#CBD5E1' }]}>▲</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.reorderBtn}
                  onPress={() => moveQuestion(idx, 'down')}
                  disabled={idx === questions.length - 1}
                >
                  <Text style={[styles.reorderBtnText, idx === questions.length - 1 && { color: '#CBD5E1' }]}>▼</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.editActionBtn} onPress={() => startEditQuestion(idx)}>
                  <Edit3 size={16} color="#3B82F6" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteActionBtn} onPress={() => deleteQuestion(idx)}>
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.step3ActionsContainer}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => setCurrentStep(2)}>
          <Text style={styles.secondaryBtnText}>❮ افزودن سوال دیگر</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryActionButton}
          onPress={() => {
            if (questions.length === 0) {
              showWarning('حداقل ۱ سوال باید ایجاد شود.');
              return;
            }
            setCurrentStep(4);
          }}
        >
          <Text style={styles.primaryActionText}>تایید و رفتن به تنظیمات ❯</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // --------------------------------------------------------------------------
  // RENDER STEP 4: Settings & Final Save / Publication
  // --------------------------------------------------------------------------
  const renderStep4 = () => (
    <ScrollView
      style={styles.scrollContent}
      contentContainerStyle={{ paddingBottom: 160 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Device Limit Card */}
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={{ flex: 1, paddingLeft: 12 }}>
            <Text style={styles.settingTitle}>محدودیت به یک پاسخ در هر دستگاه</Text>
            <Text style={styles.settingDesc}>
              جلوگیری از ارسال مجدد فرم با یک مرورگر یا گوشی (با ذخیره‌سازی محلی و تطبیق دستگاه).
            </Text>
          </View>
          <Switch
            value={limitOnePerDevice}
            onValueChange={setLimitOnePerDevice}
            trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
            thumbColor={limitOnePerDevice ? '#3B82F6' : '#F1F5F9'}
          />
        </View>
      </View>

      {/* Publication Mode & Schedule Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>زمان‌بندی و انتشار فرم</Text>
        <Text style={styles.cardSubtitle}>
          وضعیت انتشار و زمان‌بندی دقیق فعال‌سازی و بسته‌شدن خودکار فرم را مشخص کنید:
        </Text>

        {/* Option 1: Publish Immediately */}
        <TouchableOpacity
          style={[styles.timingOptionRow, publishImmediately && styles.timingOptionRowActive]}
          onPress={() => {
            setPublishImmediately(true);
            setHasScheduleStart(false);
          }}
          activeOpacity={0.8}
        >
          <View style={[styles.radioDot, publishImmediately && styles.radioDotActive]}>
            {publishImmediately && <View style={styles.radioInner} />}
          </View>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.timingOptionTitle}>همین الان منتشر شود (پیش‌فرض)</Text>
            <Text style={styles.timingOptionDesc}>فرم بلافاصله فعال شده و لینک آن قابل استفاده خواهد بود.</Text>
          </View>
        </TouchableOpacity>

        {/* Option 2: Schedule for later */}
        <TouchableOpacity
          style={[styles.timingOptionRow, !publishImmediately && styles.timingOptionRowActive]}
          onPress={() => {
            setPublishImmediately(false);
            setHasScheduleStart(true);
            if (!scheduleStartDateStr) {
              openPersianDateTimePicker('start');
            }
          }}
          activeOpacity={0.8}
        >
          <View style={[styles.radioDot, !publishImmediately && styles.radioDotActive]}>
            {!publishImmediately && <View style={styles.radioInner} />}
          </View>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.timingOptionTitle}>زمان‌بندی انتشار در تاریخ و ساعت مشخص</Text>
            <Text style={styles.timingOptionDesc}>فرم تا زمان فرا رسیدن تاریخ تعیین شده در حالت انتظار می‌ماند.</Text>
          </View>
        </TouchableOpacity>

        {!publishImmediately && (
          <View style={[styles.scheduleItem, { marginTop: 10 }]}>
            <TouchableOpacity
              style={styles.datePickerBtn}
              onPress={() => openPersianDateTimePicker('start')}
            >
              <Calendar size={18} color="#3B82F6" style={{ marginLeft: 8 }} />
              <Text style={styles.datePickerBtnText}>
                {scheduleStartDateStr
                  ? `تاریخ شروع: ${formatIsoToJalali(scheduleStartDateStr, true)}`
                  : 'انتخاب تاریخ و ساعت انتشار (شمسی)...'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Option 3: Auto-closing deadline */}
        <View style={[styles.scheduleItem, { marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' }]}>
          <View style={styles.scheduleHeader}>
            <Text style={styles.scheduleLabel}>مهلت پایان و بسته‌شدن خودکار فرم (اختیاری):</Text>
            {hasEndDate && (
              <TouchableOpacity
                onPress={() => {
                  setHasEndDate(false);
                  setEndDateStr('');
                }}
              >
                <Text style={styles.clearDateText}>حذف مهلت</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.datePickerBtn}
            onPress={() => openPersianDateTimePicker('end')}
          >
            <Clock size={18} color="#EF4444" style={{ marginLeft: 8 }} />
            <Text style={styles.datePickerBtnText}>
              {hasEndDate && endDateStr
                ? `مهلت پایان: ${formatIsoToJalali(endDateStr, true)}`
                : 'انتخاب تاریخ و ساعت پایان (شمسی)...'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Password Protection Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>رمز عبور ورود به فرم (اختیاری)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="اگر خالی بماند بدون رمز خواهد بود..."
          placeholderTextColor="#94A3B8"
          value={formPassword}
          onChangeText={setFormPassword}
        />
      </View>

      {/* Completion Message Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>پیام پایانی پس از ثبت موفق</Text>
        <Text style={styles.inputLabel}>عنوان پیام تشکر:</Text>
        <TextInput
          style={styles.textInput}
          value={completionTitle}
          onChangeText={setCompletionTitle}
        />

        <Text style={styles.inputLabel}>متن پیام:</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          multiline
          numberOfLines={2}
          value={completionMessage}
          onChangeText={setCompletionMessage}
        />
      </View>

      {/* Final Action Buttons */}
      <View style={styles.step4ActionsContainer}>
        <TouchableOpacity
          style={styles.publishBtn}
          onPress={() => handleFinalSave(false)}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <CheckCircle size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              <Text style={styles.publishBtnText}>انتشار</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.draftBtn}
          onPress={() => handleFinalSave(true)}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#475569" />
          ) : (
            <>
              <Save size={18} color="#475569" style={{ marginLeft: 6 }} />
              <Text style={styles.draftBtnText}>ذخیره به عنوان پیش‌نویس</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // --------------------------------------------------------------------------
  // TOP STEP WIZARD PROGRESS BAR
  // --------------------------------------------------------------------------
  const renderWizardProgressBar = () => {
    const stepsConfig = [
      { step: 1, label: 'مشخصات' },
      { step: 2, label: 'ثبت سوالات' },
      { step: 3, label: 'مرور چیدمان' },
      { step: 4, label: 'تنظیمات' },
    ];

    return (
      <View style={styles.wizardBar}>
        {stepsConfig.map((item, idx) => {
          const isActive = currentStep === item.step;
          const isPassed = currentStep > item.step;
          return (
            <React.Fragment key={item.step}>
              <TouchableOpacity
                style={styles.wizardStepItem}
                onPress={() => {
                  if (item.step === 2 && !title.trim()) {
                    showWarning('ابتدا عنوان فرم را وارد کنید.');
                    return;
                  }
                  setCurrentStep(item.step as any);
                }}
              >
                <View
                  style={[
                    styles.wizardCircle,
                    isActive && styles.wizardCircleActive,
                    isPassed && styles.wizardCirclePassed,
                  ]}
                >
                  {isPassed ? (
                    <Check size={14} color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.wizardCircleText,
                        isActive && styles.wizardCircleTextActive,
                      ]}
                    >
                      {toPersianNumbers(item.step)}
                    </Text>
                  )}
                </View>
                <Text style={[styles.wizardStepLabel, isActive && styles.wizardStepLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
              {idx < stepsConfig.length - 1 && (
                <View
                  style={[
                    styles.wizardLine,
                    currentStep > item.step && styles.wizardLineActive,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={{ marginTop: 12, color: '#64748B' }}>در حال بارگذاری اطلاعات فرم...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowRight size={22} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {formId ? 'ویرایش فرم نظرسنجی' : 'ساخت فرم نظرسنجی مرحله‌ای'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Guided Wizard Steps Header */}
      {renderWizardProgressBar()}

      {/* Step Contents */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}

      {/* Question Type Selection Modal */}
      <Modal
        visible={typeDropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTypeDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setTypeDropdownVisible(false)}
        >
          <View style={styles.dropdownModalContent}>
            <Text style={styles.dropdownModalTitle}>نوع سوال را انتخاب کنید:</Text>
            {QUESTION_TYPE_OPTIONS.map((item) => {
              const ItemIcon = item.icon;
              const isSelected = qType === item.type;
              return (
                <TouchableOpacity
                  key={item.type}
                  style={[styles.dropdownModalItem, isSelected && styles.dropdownModalItemActive]}
                  onPress={() => {
                    setQType(item.type);
                    if (item.type === 'true_false' && qOptions.length === 0) {
                      setQOptions([
                        { id: 'opt_true', label: 'صحیح' },
                        { id: 'opt_false', label: 'غلط' },
                      ]);
                    }
                    setTypeDropdownVisible(false);
                  }}
                >
                  <ItemIcon size={18} color={isSelected ? '#2563EB' : '#475569'} style={{ marginLeft: 10 }} />
                  <Text style={[styles.dropdownModalItemText, isSelected && styles.dropdownModalItemTextActive]}>
                    {item.label}
                  </Text>
                  {isSelected && <Check size={18} color="#2563EB" style={{ marginRight: 'auto' }} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Image Picker Action Sheet Modal (Gallery or Smart Scanner) */}
      <Modal
        visible={imagePickerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImagePickerModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setImagePickerModalVisible(false)}
        >
          <View style={styles.dropdownModalContent}>
            <Text style={styles.dropdownModalTitle}>انتخاب تصویر برای سوال:</Text>

            <TouchableOpacity style={styles.dropdownModalItem} onPress={handlePickPromptImageFromGallery}>
              <ImageIcon size={20} color="#3B82F6" style={{ marginLeft: 12 }} />
              <Text style={styles.dropdownModalItemText}>انتخاب از گالری تصاویر</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dropdownModalItem} onPress={handleScanPromptImage}>
              <Camera size={20} color="#10B981" style={{ marginLeft: 12 }} />
              <Text style={styles.dropdownModalItemText}>استفاده از اسکنر هوشمند مدارک</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

// ----------------------------------------------------------------------------
// STYLES
// ----------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  // Wizard Bar
  wizardBar: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  wizardStepItem: {
    alignItems: 'center',
  },
  wizardCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  wizardCircleActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#2563EB',
  },
  wizardCirclePassed: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  wizardCircleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
  },
  wizardCircleTextActive: {
    color: '#FFFFFF',
  },
  wizardStepLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  wizardStepLabelActive: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  wizardLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
    marginBottom: 16,
  },
  wizardLineActive: {
    backgroundColor: '#10B981',
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
    textAlign: 'right',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 18,
    textAlign: 'right',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'right',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  // Visual Mode Cards
  visualModeCard: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    backgroundColor: '#FAFAFA',
  },
  visualModeCardActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F7FF',
  },
  visualModeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  visualModeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  radioDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDotActive: {
    borderColor: '#3B82F6',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  mockupContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 6,
  },
  mockupProgressBar: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  mockupProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  mockupQuestionTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  mockupTagText: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  mockupQuestionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'right',
  },
  mockupStarsRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 8,
  },
  mockupNextBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  mockupNextBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  mockupTraditionalRow: {
    marginBottom: 8,
  },
  mockupTraditionalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'right',
  },
  mockupInputBox: {
    height: 24,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    marginTop: 4,
  },
  mockupOptionText: {
    fontSize: 11,
    color: '#64748B',
  },
  visualModeDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 18,
    textAlign: 'right',
  },
  // Step 2 & 3 styles
  stepHeaderRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeNumber: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  cancelQuestionBtn: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelQuestionText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  dropdownSelectorBtn: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownSelectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  textAttachmentSection: {
    marginTop: 14,
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  textAttachmentTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 8,
    textAlign: 'right',
  },
  settingTitleSmall: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  promptImageSection: {
    marginTop: 10,
    marginBottom: 6,
  },
  promptImagePreviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 10,
    alignItems: 'center',
  },
  promptImagePreviewImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  promptImageActionsRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    gap: 12,
    marginTop: 10,
  },
  promptImageChangeBtn: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  promptImageChangeBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  promptImageRemoveBtn: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  promptImageRemoveBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  addPromptImageBtn: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  addPromptImageBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  livePreviewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    marginTop: 14,
  },
  livePreviewHeader: {
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  livePreviewTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563EB',
    textAlign: 'right',
  },
  previewQuestionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'right',
  },
  previewQuestionDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'right',
  },
  previewOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  previewOptionRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94A3B8',
  },
  optionInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: '#1E293B',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  addOptionBtnText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
  trueFalseCard: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    alignItems: 'center',
  },
  trueFalseCardText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
  },
  previewInputDummy: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
  },
  previewPlaceholderText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
  },
  previewMediaBox: {
    marginTop: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  previewRecordCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  previewMediaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  questionSettingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  step2ActionsContainer: {
    gap: 10,
    marginBottom: 30,
  },
  addNextQuestionBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addNextQuestionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  finishQuestionsBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  finishQuestionsBtnText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Step 3 Review List styles
  addNewQuestionHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addNewQuestionHeaderText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  questionListItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  questionListOrderBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionListOrderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  questionListItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'right',
  },
  questionListItemTypeBadge: {
    fontSize: 10,
    color: '#3B82F6',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  questionListItemReqBadge: {
    fontSize: 10,
    color: '#EF4444',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  questionListActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reorderBtn: {
    padding: 6,
  },
  reorderBtnText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  editActionBtn: {
    padding: 6,
  },
  deleteActionBtn: {
    padding: 6,
  },
  step3ActionsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 30,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: 'bold',
  },
  primaryActionButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Step 4 Settings styles
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'right',
  },
  settingDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'right',
    lineHeight: 17,
  },
  timingOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    backgroundColor: '#FAFAFA',
  },
  timingOptionRowActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  timingOptionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'right',
  },
  timingOptionDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'right',
  },
  scheduleItem: {
    marginTop: 4,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  scheduleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'right',
  },
  clearDateText: {
    fontSize: 11,
    color: '#EF4444',
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  datePickerBtnText: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
  },
  step4ActionsContainer: {
    gap: 10,
    marginBottom: 35,
  },
  publishBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
  },
  publishBtnText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  draftBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingVertical: 14,
    borderRadius: 12,
  },
  draftBtnText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: 'bold',
  },
  // Modal Backdrop & Content
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownModalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  dropdownModalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'right',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownModalItem: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  dropdownModalItemActive: {
    backgroundColor: '#EFF6FF',
  },
  dropdownModalItemText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  dropdownModalItemTextActive: {
    color: '#2563EB',
    fontWeight: 'bold',
  },
  // Audio Prompt Recording & Playback Styles
  promptAudioSection: {
    marginTop: 10,
    marginBottom: 6,
  },
  audioUploadingBox: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  audioUploadingText: {
    fontSize: 13,
    color: '#7E22CE',
    fontWeight: '600',
  },
  audioRecordingBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  audioRecordingIndicatorRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 8,
  },
  recordingPulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  audioRecordingTimerText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#DC2626',
    fontVariant: ['tabular-nums'],
  },
  audioRecordingLabel: {
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '500',
  },
  stopRecordingBtn: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  stopRecordingBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  promptAudioCard: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8B4FE',
    padding: 12,
  },
  playAudioBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#9333EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptAudioTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#581C87',
    textAlign: 'right',
  },
  promptAudioSubtitle: {
    fontSize: 11,
    color: '#7E22CE',
    marginTop: 2,
    textAlign: 'right',
  },
  promptAudioActionsRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  reRecordAudioBtn: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  reRecordAudioBtnText: {
    fontSize: 11,
    color: '#7E22CE',
    fontWeight: 'bold',
  },
  deleteAudioBtn: {
    padding: 6,
  },
  addPromptAudioBtn: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C084FC',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  addPromptAudioBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7E22CE',
  },
  previewAudioPlayerCard: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#D8B4FE',
  },
  previewAudioPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#9333EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewAudioPlayerText: {
    fontSize: 12,
    color: '#6B21A8',
    fontWeight: '600',
    marginHorizontal: 8,
    flex: 1,
    textAlign: 'right',
  },
});

export default CreateOrEditFormScreen;
