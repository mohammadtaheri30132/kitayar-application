import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  PermissionsAndroid,
  Alert,
  NativeModules,
  Keyboard,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/axiosConfig';
import { NativeChatList, NativeChatListRef } from '../../components/chat/NativeChatList';
import { showError, showSuccess } from '../../components/feedback';
import { toPersianDigits } from '../../utils/persianDate';
import { FONT_FAMILY } from '../../theme/typography';
import {
  ChevronRight,
  Send,
  Image as ImageIcon,
  Mic,
  Trash2,
  X,
  Paperclip,
  Video,
  FileText,
  Clock,
} from 'lucide-react-native';

const { AudioRecorderModule, FilePickerModule, VideoPickerModule } = NativeModules;

export const TeacherChatScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const { conversationId, title } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [isAttachmentModalVisible, setIsAttachmentModalVisible] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const recordIntervalRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Keyboard visible state
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Image preview modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const chatListRef = useRef<NativeChatListRef>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const fetchMessages = async () => {
    if (!conversationId) return;
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/messages`);
      if (response.data?.success) {
        setMessages(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get('/teacher/profile/me');
      if (res.data?.data?.user) {
        setCurrentUserId(res.data.data.user._id || res.data.data.user);
      }
    } catch (err) {
      // Fallback
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [conversationId]);

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    try {
      setSending(true);
      setInputText('');

      const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
        content: text,
        type: 'text',
      });

      if (response.data?.success) {
        setMessages((prev) => [...prev, response.data.data]);
        chatListRef.current?.scrollToBottom();
      }
    } catch (err: any) {
      showError('خطا در ارسال پیام');
    } finally {
      setSending(false);
    }
  };

  const handleStartRecording = async () => {
    if (isRecording || sending || uploadingVoice) return;

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'دسترسی میکروفون',
            message: 'برای ضبط پیام صوتی به دسترسی میکروفون نیاز است.',
            buttonPositive: 'تایید',
            buttonNegative: 'انصراف',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('دسترسی داده نشد', 'امکان ضبط صدا بدون دسترسی میکروفون وجود ندارد.');
          return;
        }
      } catch (err) {
        return;
      }
    }

    if (!AudioRecorderModule) {
      Alert.alert('خطا', 'ماژول ضبط صدا در دستگاه در دسترس نیست.');
      return;
    }

    try {
      await AudioRecorderModule.startRecording();
      setIsRecording(true);
      setRecordDuration(0);
      recordIntervalRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      Alert.alert('خطا', 'امکان شروع ضبط صدا وجود ندارد.');
    }
  };

  const handleCancelRecording = async () => {
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
    try {
      if (AudioRecorderModule && isRecording) {
        await AudioRecorderModule.stopRecording();
      }
    } catch (e) {
      // ignore
    }
    setIsRecording(false);
    setRecordDuration(0);
  };

  const handleFinishAndSendVoice = async () => {
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }

    if (!AudioRecorderModule) return;

    try {
      setUploadingVoice(true);
      const filePath = await AudioRecorderModule.stopRecording();
      setIsRecording(false);

      if (!filePath) {
        setUploadingVoice(false);
        return;
      }

      const formData = new FormData();
      const cleanPath = filePath.startsWith('file://') ? filePath : `file://${filePath}`;
      formData.append('file', {
        uri: cleanPath,
        name: `voice_${Date.now()}.m4a`,
        type: 'audio/m4a',
      } as any);

      const uploadRes = await api.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (uploadRes.data?.success && uploadRes.data.data?.url) {
        const mediaUrl = uploadRes.data.data.url;
        const msgRes = await api.post(`/chat/conversations/${conversationId}/messages`, {
          type: 'voice',
          mediaUrl,
          mediaDuration: recordDuration,
          content: '🎙 پیام صوتی',
        });

        if (msgRes.data?.success) {
          setMessages((prev) => [...prev, msgRes.data.data]);
          chatListRef.current?.scrollToBottom();
        }
      }
    } catch (err) {
      showError('خطا در ارسال پیام صوتی');
    } finally {
      setUploadingVoice(false);
      setRecordDuration(0);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const str = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return toPersianDigits(str);
  };

  const uploadAndSendMessage = async (fileUri: string, type: 'image' | 'video' | 'file', defaultCaption: string) => {
    try {
      setSending(true);
      const formData = new FormData();
      const ext = type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'pdf';
      const cleanPath = fileUri.startsWith('file://') || fileUri.startsWith('content://') ? fileUri : `file://${fileUri}`;
      formData.append('file', {
        uri: cleanPath,
        name: `attachment_${Date.now()}.${ext}`,
        type: type === 'image' ? 'image/jpeg' : type === 'video' ? 'video/mp4' : 'application/octet-stream',
      } as any);

      const uploadRes = await api.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (uploadRes.data?.success && uploadRes.data.data?.url) {
        const mediaUrl = uploadRes.data.data.url;
        const msgRes = await api.post(`/chat/conversations/${conversationId}/messages`, {
          type,
          mediaUrl,
          content: defaultCaption,
        });

        if (msgRes.data?.success) {
          setMessages((prev) => [...prev, msgRes.data.data]);
          chatListRef.current?.scrollToBottom();
        }
      }
    } catch (err: any) {
      showError('خطا در ارسال فایل (حداکثر سقف مجاز ۳۰ مگابایت است)');
    } finally {
      setSending(false);
    }
  };

  const handlePickAndSendImage = async () => {
    try {
      setIsAttachmentModalVisible(false);
      if (!FilePickerModule?.pickImage) {
        showError('ماژول انتخاب تصویر در دسترس نیست');
        return;
      }
      const rawUri = await FilePickerModule.pickImage();
      if (!rawUri) return;
      const cleanUri = Array.isArray(rawUri) ? rawUri[0] : rawUri;
      await uploadAndSendMessage(cleanUri, 'image', '📷 تصویر');
    } catch (e: any) {
      if (e?.message !== 'CANCELLED') {
        showError('خطا در انتخاب تصویر');
      }
    }
  };

  const handlePickAndSendVideo = async () => {
    try {
      setIsAttachmentModalVisible(false);
      if (!VideoPickerModule?.pickVideo) {
        showError('ماژول انتخاب ویدیو در دسترس نیست');
        return;
      }
      const rawUri = await VideoPickerModule.pickVideo();
      if (!rawUri) return;
      await uploadAndSendMessage(rawUri, 'video', '🎥 ویدیو');
    } catch (e: any) {
      if (e?.message !== 'CANCELLED') {
        showError('خطا در انتخاب ویدیو');
      }
    }
  };

  const handlePickAndSendDocument = async () => {
    try {
      setIsAttachmentModalVisible(false);
      if (!FilePickerModule?.pickDocument) {
        showError('ماژول انتخاب فایل در دسترس نیست');
        return;
      }
      const rawUri = await FilePickerModule.pickDocument('*/*');
      if (!rawUri) return;
      const cleanUri = Array.isArray(rawUri) ? rawUri[0] : rawUri;
      await uploadAndSendMessage(cleanUri, 'file', '📎 فایل پیوست');
    } catch (e: any) {
      if (e?.message !== 'CANCELLED') {
        showError('خطا در انتخاب فایل');
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronRight size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{title || 'گفتگوی آموزشی'}</Text>
          <Text style={[styles.headerSub, { color: '#10B981' }]}>ارتباط آنلاین</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Retention info banner */}
      <View style={[styles.retentionBanner, { backgroundColor: isDark ? '#1e293b' : '#f0f9ff', borderBottomColor: isDark ? '#334155' : '#bae6fd' }]}>
        <Clock size={12} color="#0284c7" style={{ marginLeft: 4 }} />
        <Text style={[styles.retentionBannerText, { color: isDark ? '#93c5fd' : '#0369a1' }]}>
          این گفتگو تا ۲ روز پس از پایان در دسترس شما خواهد بود.
        </Text>
      </View>

      {/* Native RecyclerView Chat Messages List */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <NativeChatList
            ref={chatListRef}
            currentUserId={currentUserId}
            messages={messages}
            onImagePress={(imgUrl) => setPreviewImageUrl(imgUrl)}
            style={{ flex: 1, backgroundColor: colors.background }}
          />
        )}

        {/* Bottom Input Row & Voice Recording */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingBottom: isKeyboardVisible ? 10 : Math.max(insets.bottom, 10),
            },
          ]}
        >
          {isRecording ? (
            <View style={styles.recordingRow}>
              <TouchableOpacity
                style={styles.cancelRecordBtn}
                onPress={handleCancelRecording}
                activeOpacity={0.8}
              >
                <Trash2 size={20} color="#ef4444" />
              </TouchableOpacity>

              <View style={styles.recordingTimerCol}>
                <Text style={styles.recordingTimerText}>{formatTimer(recordDuration)}</Text>
                <View style={styles.pulsingRow}>
                  <Animated.View
                    style={[
                      styles.pulsingDot,
                      {
                        transform: [{ scale: pulseAnim }],
                      },
                    ]}
                  />
                  <Text style={[styles.recordingLabel, { color: colors.textLight }]}>در حال ضبط صدا...</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.sendVoiceBtn, { backgroundColor: colors.primary }]}
                onPress={handleFinishAndSendVoice}
                disabled={uploadingVoice}
                activeOpacity={0.85}
              >
                {uploadingVoice ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Send size={18} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.normalInputRow}>
              {inputText.trim().length > 0 ? (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSendMessage}
                  disabled={sending}
                  activeOpacity={0.8}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Send size={18} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={handleStartRecording}
                  activeOpacity={0.85}
                >
                  <Mic size={20} color="#ffffff" />
                </TouchableOpacity>
              )}

              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="پیام خود را بنویسید یا ویس بگیرید..."
                placeholderTextColor={colors.textLight}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={1000}
                underlineColorAndroid="transparent"
              />

              {/* Attachment Button */}
              <TouchableOpacity
                style={[
                  styles.attachBtn,
                  { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
                ]}
                onPress={() => setIsAttachmentModalVisible(true)}
                disabled={sending}
                activeOpacity={0.8}
              >
                <Paperclip size={20} color={colors.textLight || '#64748b'} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Attachment Selection Modal */}
      <Modal visible={isAttachmentModalVisible} transparent={true} animationType="slide">
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setIsAttachmentModalVisible(false)}
        >
          <View style={[styles.sheetContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>ارسال فایل یا مدیا</Text>
            <Text style={[styles.sheetSub, { color: colors.textLight }]}>حداکثر سقف مجاز برای فایل و ویدیو ۳۰ مگابایت است.</Text>

            <TouchableOpacity style={styles.sheetOption} onPress={handlePickAndSendImage} activeOpacity={0.75}>
              <View style={[styles.sheetIconCircle, { backgroundColor: '#dbeafe' }]}>
                <ImageIcon size={20} color="#2563eb" />
              </View>
              <View style={styles.sheetOptionTextCol}>
                <Text style={[styles.sheetOptionTitle, { color: colors.text }]}>ارسال عکس</Text>
                <Text style={[styles.sheetOptionDesc, { color: colors.textLight }]}>انتخاب عکس سوال یا پاسخ از گالری</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetOption} onPress={handlePickAndSendVideo} activeOpacity={0.75}>
              <View style={[styles.sheetIconCircle, { backgroundColor: '#fee2e2' }]}>
                <Video size={20} color="#dc2626" />
              </View>
              <View style={styles.sheetOptionTextCol}>
                <Text style={[styles.sheetOptionTitle, { color: colors.text }]}>ارسال ویدیو (تا ۳۰ مگابایت)</Text>
                <Text style={[styles.sheetOptionDesc, { color: colors.textLight }]}>ویدیو حل تمرین و تدریس</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetOption} onPress={handlePickAndSendDocument} activeOpacity={0.75}>
              <View style={[styles.sheetIconCircle, { backgroundColor: '#fef3c7' }]}>
                <FileText size={20} color="#d97706" />
              </View>
              <View style={styles.sheetOptionTextCol}>
                <Text style={[styles.sheetOptionTitle, { color: colors.text }]}>ارسال فایل و PDF</Text>
                <Text style={[styles.sheetOptionDesc, { color: colors.textLight }]}>جزوه، تمرین، نمونه سوال و فایل متنی</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetCancelBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
              onPress={() => setIsAttachmentModalVisible(false)}
            >
              <Text style={[styles.sheetCancelBtnText, { color: colors.text }]}>انصراف</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Image Preview Modal */}
      <Modal visible={!!previewImageUrl} transparent={true} animationType="fade">
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.closeImageBtn}
            onPress={() => setPreviewImageUrl(null)}
            activeOpacity={0.8}
          >
            <X size={26} color="#FFFFFF" />
          </TouchableOpacity>
          {previewImageUrl && (
            <Image source={{ uri: previewImageUrl }} style={styles.fullImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
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
  backBtn: { padding: 6, borderRadius: 8 },
  headerTitleWrap: { alignItems: 'center' },
  headerTitle: { fontSize: 15, fontFamily: FONT_FAMILY.bold },
  headerSub: { fontSize: 10, fontFamily: FONT_FAMILY.regular, marginTop: 2 },
  keyboardContainer: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  inputBar: {
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  normalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 9,
    maxHeight: 110,
    fontSize: 13,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'right',
  },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  cancelRecordBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingTimerCol: {
    alignItems: 'center',
  },
  recordingTimerText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.bold,
    color: '#ef4444',
  },
  pulsingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  recordingLabel: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
  },
  sendVoiceBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeImageBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
  retentionBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  retentionBannerText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
  },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 28,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'center',
  },
  sheetSub: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  sheetOption: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  sheetIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetOptionTextCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  sheetOptionTitle: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
  },
  sheetOptionDesc: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 2,
  },
  sheetCancelBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  sheetCancelBtnText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
  },
});

export default TeacherChatScreen;
