import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  NativeModules,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  HelpCircle,
  Star,
  Award,
  Smartphone,
  Layers,
  Sparkles,
  Play,
  Square,
  Volume2,
  Mic,
} from 'lucide-react-native';
import { formService, FormDataModel, QuestionItem } from '../../services/forms/formService';
import { COLORS } from '../../theme/colors';

const { AudioRecorderModule } = NativeModules;

interface FormPreviewScreenProps {
  route: any;
  navigation: any;
}

export const FormPreviewScreen: React.FC<FormPreviewScreenProps> = ({ route, navigation }) => {
  const { formId } = route.params;

  const [form, setForm] = useState<FormDataModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<{ [qId: string]: any }>({});
  const [previewMode, setPreviewMode] = useState<'conversational' | 'traditional'>('conversational');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    loadForm();
    return () => {
      if (AudioRecorderModule) {
        AudioRecorderModule.stopPlaying().catch(() => {});
      }
    };
  }, [formId]);

  const loadForm = async () => {
    try {
      setLoading(true);
      const data = await formService.getFormById(formId);
      setForm(data);
      setPreviewMode(data.theme?.mode || 'conversational');
    } catch (err: any) {
      Alert.alert('خطا', 'خطا در بارگذاری پیش‌نمایش فرم');
    } finally {
      setLoading(false);
    }
  };

  const getFullMediaUrl = (url?: string) => {
    if (!url) return '';
    return url.startsWith('http')
      ? url
      : `${formService.getPublicFormUrl('').replace(/\/forms\/.*$/, '')}${url}`;
  };

  const handleTogglePlayPromptAudio = async (rawUrl: string) => {
    if (!AudioRecorderModule) return;
    try {
      if (playingAudioUrl === rawUrl) {
        await AudioRecorderModule.stopPlaying();
        setPlayingAudioUrl(null);
      } else {
        await AudioRecorderModule.stopPlaying().catch(() => {});
        const fullUrl = getFullMediaUrl(rawUrl);
        await AudioRecorderModule.play(fullUrl);
        setPlayingAudioUrl(rawUrl);
      }
    } catch (e) {
      console.warn('Audio play failed:', e);
      setPlayingAudioUrl(null);
    }
  };

  const handleSelectOption = (qId: string, optId: string, isMulti: boolean) => {
    if (isMulti) {
      const prev = answers[qId] || [];
      const updated = prev.includes(optId) ? prev.filter((id: string) => id !== optId) : [...prev, optId];
      setAnswers({ ...answers, [qId]: updated });
    } else {
      setAnswers({ ...answers, [qId]: optId });
    }
  };

  const handleNext = () => {
    if (AudioRecorderModule && playingAudioUrl) {
      AudioRecorderModule.stopPlaying().catch(() => {});
      setPlayingAudioUrl(null);
    }
    if (!form) return;
    const q = form.questions[currentIdx];
    if (q.required && !answers[q.id]) {
      Alert.alert('توجه', 'پاسخ به این سوال الزامی است.');
      return;
    }
    if (currentIdx < form.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setSubmitted(true);
    }
  };

  const handlePrev = () => {
    if (AudioRecorderModule && playingAudioUrl) {
      AudioRecorderModule.stopPlaying().catch(() => {});
      setPlayingAudioUrl(null);
    }
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const renderPromptMedia = (q?: QuestionItem) => {
    if (!q) return null;
    if (!q.promptImageUrl && !q.promptAudioUrl) return null;
    return (
      <View style={styles.promptMediaContainer}>
        {q.promptImageUrl ? (
          <View style={styles.promptImageWrapper}>
            <Image
              source={{ uri: getFullMediaUrl(q.promptImageUrl) }}
              style={styles.promptImage}
              resizeMode="contain"
            />
          </View>
        ) : null}

        {q.promptAudioUrl ? (
          <View style={styles.promptAudioCard}>
            <TouchableOpacity
              style={styles.promptAudioPlayBtn}
              onPress={() => handleTogglePlayPromptAudio(q.promptAudioUrl!)}
              activeOpacity={0.7}
            >
              {playingAudioUrl === q.promptAudioUrl ? (
                <Square size={16} color="#FFFFFF" fill="#FFFFFF" />
              ) : (
                <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
              )}
            </TouchableOpacity>
            <View style={{ flex: 1, marginHorizontal: 10 }}>
              <Text style={styles.promptAudioTitle}>ویس و صدای سوال 🎙️</Text>
              <Text style={styles.promptAudioSubtitle}>
                {playingAudioUrl === q.promptAudioUrl
                  ? 'در حال پخش صدای معلم...'
                  : 'برای شنیدن صدای سوال کلیک کنید'}
              </Text>
            </View>
            <Volume2 size={20} color="#7E22CE" />
          </View>
        ) : null}
      </View>
    );
  };

  if (loading || !form) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>در حال آماده‌سازی پیش‌نمایش فرم...</Text>
      </View>
    );
  }

  const questionsCount = form.questions.length;
  const progressPercent = questionsCount > 0 ? Math.round(((currentIdx + 1) / questionsCount) * 100) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowRight size={22} color="#1e293b" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>پیش‌نمایش زنده فرم</Text>
          <Text style={styles.headerSubtitle}>مشاهده فرم به صورت مخاطب</Text>
        </View>

        {/* Mode Switcher */}
        <TouchableOpacity
          style={styles.modeSwitchBtn}
          onPress={() => setPreviewMode(previewMode === 'conversational' ? 'traditional' : 'conversational')}
        >
          <Text style={styles.modeSwitchBtnText}>
            {previewMode === 'conversational' ? 'تک‌سواله' : 'سنتی'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar (in conversational mode) */}
      {previewMode === 'conversational' && !submitted && (
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressPercent}%`, backgroundColor: form.theme?.primaryColor || COLORS.primary },
            ]}
          />
        </View>
      )}

      {submitted ? (
        <View style={styles.submittedContainer}>
          <CheckCircle size={64} color="#10b981" />
          <Text style={styles.submittedTitle}>{form.theme?.completionTitle || 'با تشکر از شما'}</Text>
          <Text style={styles.submittedDesc}>
            {form.theme?.completionMessage || 'پاسخ‌های شما با موفقیت ثبت شد.'}
          </Text>
          <TouchableOpacity
            style={styles.resetPreviewBtn}
            onPress={() => {
              setSubmitted(false);
              setCurrentIdx(0);
              setAnswers({});
            }}
          >
            <Text style={styles.resetPreviewBtnText}>تست مجدد فرم</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Card */}
          <View style={styles.formHeaderCard}>
            <Text style={styles.formTitle}>{form.title}</Text>
            {form.description ? <Text style={styles.formDesc}>{form.description}</Text> : null}
          </View>

          {/* Questions Rendering */}
          {previewMode === 'conversational' ? (
            /* CONVERSATIONAL (ONE AT A TIME) */
            <View style={styles.questionCard}>
              <View style={styles.qMetaRow}>
                <Text style={styles.qCounterText}>
                  سوال {currentIdx + 1} از {questionsCount}
                </Text>
                {form.questions[currentIdx]?.points ? (
                  <Text style={styles.pointsBadge}>{form.questions[currentIdx].points} نمره</Text>
                ) : null}
              </View>

              <Text style={styles.qTitle}>
                {form.questions[currentIdx]?.title}
                {form.questions[currentIdx]?.required && <Text style={{ color: '#ef4444' }}> *</Text>}
              </Text>

              {form.questions[currentIdx]?.description ? (
                <Text style={styles.qDesc}>{form.questions[currentIdx].description}</Text>
              ) : null}

              {/* Prompt image / audio from teacher */}
              {renderPromptMedia(form.questions[currentIdx])}

              {/* Render Input for Current Question */}
              {renderQuestionInput(
                form.questions[currentIdx],
                answers[form.questions[currentIdx]?.id],
                (val) => setAnswers({ ...answers, [form.questions[currentIdx]?.id]: val }),
                handleSelectOption
              )}

              {/* Navigation Buttons */}
              <View style={styles.navRow}>
                {currentIdx > 0 && (
                  <TouchableOpacity style={styles.prevBtn} onPress={handlePrev}>
                    <ChevronRight size={18} color="#475569" style={{ marginLeft: 4 }} />
                    <Text style={styles.prevBtnText}>قبلی</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.nextBtn,
                    { backgroundColor: form.theme?.primaryColor || COLORS.primary },
                  ]}
                  onPress={handleNext}
                >
                  <Text style={styles.nextBtnText}>
                    {currentIdx === questionsCount - 1 ? 'تکمیل و ثبت' : 'بعدی'}
                  </Text>
                  <ChevronLeft size={18} color="#ffffff" style={{ marginRight: 4 }} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* TRADITIONAL (ALL QUESTIONS VISIBLE) */
            <View>
              {form.questions.map((q, idx) => (
                <View key={q.id} style={styles.questionCard}>
                  <View style={styles.qMetaRow}>
                    <Text style={styles.qCounterText}>سوال {idx + 1}</Text>
                    {q.points ? <Text style={styles.pointsBadge}>{q.points} نمره</Text> : null}
                  </View>
                  <Text style={styles.qTitle}>
                    {q.title}
                    {q.required && <Text style={{ color: '#ef4444' }}> *</Text>}
                  </Text>
                  {q.description ? <Text style={styles.qDesc}>{q.description}</Text> : null}

                  {/* Prompt image / audio from teacher */}
                  {renderPromptMedia(q)}

                  {renderQuestionInput(
                    q,
                    answers[q.id],
                    (val) => setAnswers({ ...answers, [q.id]: val }),
                    handleSelectOption
                  )}
                </View>
              ))}

              <TouchableOpacity
                style={[
                  styles.submitTraditionalBtn,
                  { backgroundColor: form.theme?.primaryColor || COLORS.primary },
                ]}
                onPress={() => setSubmitted(true)}
              >
                <Text style={styles.submitTraditionalBtnText}>ثبت نهایی پاسخ‌ها</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const renderQuestionInput = (
  q: QuestionItem,
  currentVal: any,
  onChange: (val: any) => void,
  onSelectOption: (qId: string, optId: string, isMulti: boolean) => void
) => {
  if (!q) return null;

  // Text inputs
  if (['short_text', 'email', 'phone', 'url', 'quiz_short_answer'].includes(q.type)) {
    return (
      <TextInput
        style={styles.textInput}
        placeholder="پاسخ شما..."
        placeholderTextColor="#94a3b8"
        value={currentVal || ''}
        onChangeText={onChange}
      />
    );
  }

  if (q.type === 'long_text') {
    return (
      <TextInput
        style={[styles.textInput, { minHeight: 90, textAlignVertical: 'top' }]}
        placeholder="توضیحات و پاسخ کامل..."
        placeholderTextColor="#94a3b8"
        multiline
        value={currentVal || ''}
        onChangeText={onChange}
      />
    );
  }

  if (q.type === 'number') {
    return (
      <TextInput
        style={styles.textInput}
        placeholder="عدد..."
        placeholderTextColor="#94a3b8"
        keyboardType="numeric"
        value={currentVal ? String(currentVal) : ''}
        onChangeText={(val) => onChange(Number(val) || '')}
      />
    );
  }

  // Choices & Quizzes
  if (q.options && q.options.length > 0) {
    const isMulti = q.type === 'multiple_choice' || q.type === 'quiz_multiple';
    return (
      <View style={styles.optionsList}>
        {q.options.map((opt) => {
          const isSelected = isMulti
            ? Array.isArray(currentVal) && currentVal.includes(opt.id)
            : currentVal === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.optionItem, isSelected && styles.optionItemSelected]}
              onPress={() => onSelectOption(q.id, opt.id, isMulti)}
            >
              <View style={[styles.optionCircle, isSelected && styles.optionCircleSelected]}>
                {isSelected && <View style={styles.optionCircleDot} />}
              </View>
              <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // Rating Stars
  if (q.type === 'rating_stars') {
    const score = Number(currentVal) || 0;
    return (
      <View style={styles.ratingStarsRow}>
        {[1, 2, 3, 4, 5].map((s) => (
          <TouchableOpacity key={s} onPress={() => onChange(s)}>
            <Star
              size={34}
              color={s <= score ? '#FBBF24' : '#CBD5E1'}
              fill={s <= score ? '#FBBF24' : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // Media
  if (['file_upload', 'image_upload', 'audio_record'].includes(q.type)) {
    return (
      <View style={styles.mockMediaBox}>
        <Text style={styles.mockMediaText}>
          {q.type === 'image_upload'
            ? '📷 بخش ارسال تصویر در مرورگر یا وب‌فرم باز می‌شود'
            : q.type === 'audio_record'
            ? '🎙️ دکمه ضبط صدا روی مرورگر تعبیه شده است'
            : '📎 بخش پیوست فایل فعال است'}
        </Text>
      </View>
    );
  }

  return (
    <TextInput
      style={styles.textInput}
      placeholder="پاسخ..."
      value={currentVal || ''}
      onChangeText={onChange}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleBox: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modeSwitchBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
  },
  modeSwitchBtnText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#E2E8F0',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'left',
  },
  formDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 20,
    textAlign: 'left',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  qCounterText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  pointsBadge: {
    backgroundColor: '#FEF3C7',
    color: '#B45309',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  qTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
    lineHeight: 22,
    textAlign: 'left',
  },
  qDesc: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
    textAlign: 'left',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    textAlign: 'right',
  },
  optionsList: {
    gap: 10,
    marginTop: 6,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  optionItemSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  optionCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  optionCircleSelected: {
    borderColor: '#3B82F6',
  },
  optionCircleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  optionLabel: {
    fontSize: 13,
    color: '#334155',
  },
  optionLabelSelected: {
    fontWeight: 'bold',
    color: '#1E293B',
  },
  ratingStarsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  mockMediaBox: {
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  mockMediaText: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 10,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  prevBtnText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: 'bold',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  nextBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  submitTraditionalBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitTraditionalBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  submittedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  submittedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 16,
    textAlign: 'center',
  },
  submittedDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  resetPreviewBtn: {
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
  },
  resetPreviewBtnText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
  },
  promptMediaContainer: {
    marginVertical: 10,
    gap: 10,
  },
  promptImageWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    alignItems: 'center',
    padding: 6,
  },
  promptImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
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
  promptAudioPlayBtn: {
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
});

export default FormPreviewScreen;
