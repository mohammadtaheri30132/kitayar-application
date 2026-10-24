import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
  NativeModules,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { showError, showWarning, showSuccess, showConfirm } from '../../components/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';
import {
  ChevronRight,
  Mic,
  Square,
  Play,
  Pause,
  Image as ImageIcon,
  Send,
  Users,
  User,
  Trash2,
  Check,
  X,
  Volume2,
} from 'lucide-react-native';
import ImagePicker from 'react-native-image-crop-picker';
import { chatService, ClassMessageItem } from '../../services/chatService';
import { api } from '../../api/axiosConfig';

const { AudioRecorderModule, ImageConverterModule } = NativeModules;

export default function ClassChatScreen({ route, navigation }: any) {
  const { classId, className, classroom } = route.params;
  const currentClassId = classId || classroom?._id;

  const { colors, isDark } = useTheme();
  const [messages, setMessages] = useState<ClassMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);

  // Text message input state
  const [textMessage, setTextMessage] = useState('');

  // Recipient selection: 'ALL' or specific student phone
  const [recipientScope, setRecipientScope] = useState<'ALL' | 'STUDENT'>('ALL');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [showStudentPickerModal, setShowStudentPickerModal] = useState(false);

  // Audio Recording State (Kotlin Native)
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedFilePath, setRecordedFilePath] = useState<string | null>(null);
  const [recordingTimer, setRecordingTimer] = useState<any>(null);

  // Audio Playback State (Kotlin Native)
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const playbackTimerRef = useRef<any>(null);

  // Image / WebP State (Kotlin Native ImageConverterModule)
  const [selectedWebpUri, setSelectedWebpUri] = useState<string | null>(null);
  const [webpFileSize, setWebpFileSize] = useState<number>(0);
  const [imageCaption, setImageCaption] = useState('');
  const [showImagePreviewModal, setShowImagePreviewModal] = useState(false);

  // Uploading / Sending state
  const [sending, setSending] = useState(false);

  // Full-screen image zoom modal
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  const serverBaseUrl = (api.defaults.baseURL || 'http://192.168.1.128:5001/api').replace(/\/api\/?$/, '');

  useEffect(() => {
    loadClassStudents();
    loadMessages();

    // Polling every 4 seconds for new chat messages
    const pollInterval = setInterval(() => {
      loadMessages(false);
    }, 4000);

    return () => {
      clearInterval(pollInterval);
      stopAudioPlayback();
      if (recordingTimer) clearInterval(recordingTimer);
    };
  }, [currentClassId]);

  const loadClassStudents = async () => {
    try {
      const res = await api.get(`/teacher/classrooms/${currentClassId}/students`);
      if (res.data?.success) {
        setStudents(res.data.data || []);
      }
    } catch (e) {
      console.warn('Error loading class students:', e);
    }
  };

  const loadMessages = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const list = await chatService.getMessages(currentClassId);
      setMessages(list);
    } catch (e) {
      console.warn('Error fetching chat messages:', e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // AUDIO RECORDING (Kotlin MediaRecorder)
  // -------------------------------------------------------------
  const requestAudioPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'دسترسی به میکروفون',
            message: 'برای ضبط پیام صوتی لطفاً دسترسی میکروفون را تأیید کنید.',
            buttonPositive: 'تأیید',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        return false;
      }
    }
    return true;
  };

  const startVoiceRecording = async () => {
    const hasPermission = await requestAudioPermission();
    if (!hasPermission) {
      showWarning('دسترسی به میکروفون داده نشده است.');
      return;
    }

    if (!AudioRecorderModule) {
      showWarning('ماژول ضبط صدا در این نسخه فعال نیست.');
      return;
    }

    try {
      stopAudioPlayback();
      await AudioRecorderModule.startRecording();
      setIsRecording(true);
      setRecordDuration(0);
      setRecordedFilePath(null);

      const timer = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
      setRecordingTimer(timer);
    } catch (error: any) {
      showError(error?.message || 'مشکلی در شروع ضبط صدا رخ داد');
    }
  };

  const stopVoiceRecording = async (shouldSend = false) => {
    if (!isRecording) return;
    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }

    try {
      const filePath = await AudioRecorderModule.stopRecording();
      setIsRecording(false);
      setRecordedFilePath(filePath);

      if (shouldSend && filePath) {
        await handleSendVoiceMessage(filePath, recordDuration);
      }
    } catch (error: any) {
      setIsRecording(false);
      showError(error?.message || 'مشکلی در اتمام ضبط رخ داد');
    }
  };

  const cancelVoiceRecording = async () => {
    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }
    try {
      if (AudioRecorderModule && isRecording) {
        await AudioRecorderModule.stopRecording();
      }
    } catch (e) {
      // ignore
    }
    setIsRecording(false);
    setRecordedFilePath(null);
    setRecordDuration(0);
  };

  const handleSendVoiceMessage = async (localPath: string, durationSec: number) => {
    if (!localPath) return;
    setSending(true);
    try {
      const fileName = `voice_${Date.now()}.m4a`;
      const uploadedUrl = await chatService.uploadMedia(localPath, fileName, 'audio/m4a');

      await chatService.sendMessage(currentClassId, {
        messageType: 'VOICE',
        mediaUrl: uploadedUrl,
        voiceDuration: durationSec,
        recipientScope,
        targetStudentPhone: recipientScope === 'STUDENT' ? selectedStudent?.phoneNumber : undefined,
        targetStudentName:
          recipientScope === 'STUDENT'
            ? `${selectedStudent?.firstName || ''} ${selectedStudent?.lastName || ''}`.trim()
            : undefined,
      });

      setRecordedFilePath(null);
      setRecordDuration(0);
      loadMessages(false);
    } catch (error: any) {
      showError(error?.message || 'مشکلی در آپلود پیام صوتی پیش آمد.');
    } finally {
      setSending(false);
    }
  };

  // -------------------------------------------------------------
  // AUDIO PLAYBACK (Kotlin MediaPlayer)
  // -------------------------------------------------------------
  const playAudio = async (message: ClassMessageItem) => {
    if (!AudioRecorderModule) return;

    if (playingMessageId === message._id) {
      stopAudioPlayback();
      return;
    }

    stopAudioPlayback();

    try {
      if (!message.mediaUrl) return;
      const fullAudioUrl = message.mediaUrl.startsWith('http')
        ? message.mediaUrl
        : `${serverBaseUrl}${message.mediaUrl}`;

      await AudioRecorderModule.play(fullAudioUrl);
      setPlayingMessageId(message._id);
      setPlaybackPosition(0);
      setPlaybackDuration(message.voiceDuration || 0);

      playbackTimerRef.current = setInterval(async () => {
        try {
          const pos = await AudioRecorderModule.getPlaybackPosition();
          const dur = await AudioRecorderModule.getPlaybackDuration();
          if (dur > 0) {
            setPlaybackPosition(Math.floor(pos / 1000));
            setPlaybackDuration(Math.floor(dur / 1000));
          }
          if (pos >= dur && dur > 0) {
            stopAudioPlayback();
          }
        } catch (e) {
          stopAudioPlayback();
        }
      }, 500);
    } catch (error: any) {
      showError(error?.message || 'امکان پخش این پیام صوتی وجود ندارد');
      stopAudioPlayback();
    }
  };

  const stopAudioPlayback = () => {
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    if (AudioRecorderModule) {
      AudioRecorderModule.stopPlaying().catch(() => {});
    }
    setPlayingMessageId(null);
    setPlaybackPosition(0);
  };

  // -------------------------------------------------------------
  // IMAGE PICKING & KOTLIN WEBP COMPRESSION
  // -------------------------------------------------------------
  const pickAndConvertImage = async (fromCamera = false) => {
    try {
      const image = fromCamera
        ? await ImagePicker.openCamera({ cropping: false, mediaType: 'photo' })
        : await ImagePicker.openPicker({ cropping: false, mediaType: 'photo' });

      if (!image || !image.path) return;

      // اجرای تبدیل و فشرده‌سازی با ماژول کاتلین به فرمت WebP
      if (ImageConverterModule?.convertImage) {
        const convertResult = await ImageConverterModule.convertImage(image.path, 'WEBP', 80);
        setSelectedWebpUri(convertResult.uri || convertResult.path);
        setWebpFileSize(convertResult.sizeBytes || 0);
      } else {
        // Fallback
        setSelectedWebpUri(image.path);
        setWebpFileSize(image.size || 0);
      }

      setShowImagePreviewModal(true);
    } catch (err: any) {
      if (err?.code !== 'E_PICKER_CANCELLED') {
        showError(err?.message || 'مشکلی در انتخاب تصویر رخ داد');
      }
    }
  };

  const handleSendWebpImage = async () => {
    if (!selectedWebpUri) return;
    setSending(true);
    try {
      const fileName = `image_${Date.now()}.webp`;
      const uploadedUrl = await chatService.uploadMedia(selectedWebpUri, fileName, 'image/webp');

      await chatService.sendMessage(currentClassId, {
        messageType: 'IMAGE',
        mediaUrl: uploadedUrl,
        caption: imageCaption.trim(),
        fileSize: webpFileSize,
        recipientScope,
        targetStudentPhone: recipientScope === 'STUDENT' ? selectedStudent?.phoneNumber : undefined,
        targetStudentName:
          recipientScope === 'STUDENT'
            ? `${selectedStudent?.firstName || ''} ${selectedStudent?.lastName || ''}`.trim()
            : undefined,
      });

      setShowImagePreviewModal(false);
      setSelectedWebpUri(null);
      setImageCaption('');
      loadMessages(false);
    } catch (error: any) {
      showError(error?.message || 'مشکلی در ارسال تصویر رخ داد');
    } finally {
      setSending(false);
    }
  };

  const handleSendTextMessage = async () => {
    if (!textMessage.trim() || sending) return;
    setSending(true);
    try {
      await chatService.sendMessage(currentClassId, {
        messageType: 'TEXT',
        caption: textMessage.trim(),
        recipientScope,
        targetStudentPhone: recipientScope === 'STUDENT' ? selectedStudent?.phoneNumber : undefined,
        targetStudentName:
          recipientScope === 'STUDENT'
            ? `${selectedStudent?.firstName || ''} ${selectedStudent?.lastName || ''}`.trim()
            : undefined,
      });
      setTextMessage('');
      loadMessages(false);
    } catch (error: any) {
      showError(error?.message || 'مشکلی در ارسال پیام رخ داد');
    } finally {
      setSending(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleDeleteMessage = (item: ClassMessageItem) => {
    showConfirm({
      title: 'حذف پیام',
      message: 'آیا از حذف این پیام اطمینان دارید؟',
      confirmText: 'حذف',
      cancelText: 'انصراف',
      isDestructive: true,
      icon: Trash2,
      onConfirm: async () => {
        try {
          await chatService.deleteMessage(currentClassId, item._id);
          showSuccess('پیام حذف شد');
          loadMessages(false);
        } catch (e: any) {
          showError('امکان حذف پیام وجود ندارد');
        }
      },
    });
  };

  const renderMessageItem = ({ item }: { item: ClassMessageItem }) => {
    const isMe = item.senderRole === 'teacher';
    const isPlaying = playingMessageId === item._id;

    return (
      <View
        style={[
          styles.messageRow,
          isMe ? styles.messageRowRight : styles.messageRowLeft,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMe
              ? isDark
                ? styles.bubbleTeacher
                : styles.bubbleTeacherLight
              : isDark
              ? styles.bubbleStudent
              : styles.bubbleStudentLight,
          ]}
        >
          {/* Header of message: Sender & Recipient badge */}
          <View style={styles.bubbleHeader}>
            <Text style={[styles.senderName, { color: isMe ? COLORS.primary : '#0284c7' }]}>
              {item.senderName}
            </Text>
            {isMe && (
              <View
                style={[
                  styles.scopeBadge,
                  item.recipientScope === 'ALL'
                    ? styles.scopeBadgeAll
                    : styles.scopeBadgeStudent,
                ]}
              >
                {item.recipientScope === 'ALL' ? (
                  <Text style={styles.scopeBadgeText}>👥 کل کلاس</Text>
                ) : (
                  <Text style={styles.scopeBadgeText} numberOfLines={1}>
                    👤 {item.targetStudentName || 'دانش‌آموز خاص'}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* VOICE Message */}
          {item.messageType === 'VOICE' && (
            <View style={styles.voiceContainer}>
              <TouchableOpacity
                onPress={() => playAudio(item)}
                style={[styles.playBtn, isPlaying && styles.playBtnActive]}
                activeOpacity={0.8}
              >
                {isPlaying ? (
                  <Pause size={20} color="#fff" />
                ) : (
                  <Play size={20} color="#fff" />
                )}
              </TouchableOpacity>

              <View style={styles.voiceProgressArea}>
                <View style={styles.waveformContainer}>
                  {[12, 24, 18, 30, 16, 26, 20, 32, 14, 22, 28, 16, 24, 18, 30].map(
                    (barHeight, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.waveformBar,
                          { height: barHeight },
                          isPlaying && idx % 3 === 0 && styles.waveformBarActive,
                        ]}
                      />
                    )
                  )}
                </View>
                <View style={styles.voiceDurationRow}>
                  <Text style={styles.voiceDurationText}>
                    {isPlaying
                      ? `${formatSeconds(playbackPosition)} / ${formatSeconds(playbackDuration || item.voiceDuration)}`
                      : formatSeconds(item.voiceDuration)}
                  </Text>
                  <Text style={styles.voiceLabel}>پیام صوتی</Text>
                </View>
              </View>
            </View>
          )}

          {/* IMAGE Message (WebP) */}
          {item.messageType === 'IMAGE' && (
            <View style={styles.imageContainer}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  const rawUrl = item.mediaUrl || '';
                  const url = rawUrl.startsWith('http')
                    ? rawUrl
                    : `${serverBaseUrl}${rawUrl}`;
                  setPreviewZoomImage(url);
                }}
              >
                <Image
                  source={{
                    uri: (item.mediaUrl || '').startsWith('http')
                      ? (item.mediaUrl || '')
                      : `${serverBaseUrl}${item.mediaUrl || ''}`,
                  }}
                  style={styles.chatImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
              {item.caption ? (
                <Text style={styles.imageCaption}>{item.caption}</Text>
              ) : null}
              <View style={styles.webpBadge}>
                <Text style={styles.webpBadgeText}>WebP فشرده</Text>
              </View>
            </View>
          )}

          {/* TEXT Message */}
          {item.messageType === 'TEXT' && (
            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.chatTextMessage,
                  { color: isMe ? (isDark ? '#f8fafc' : '#0f172a') : (isDark ? '#f8fafc' : '#0f172a') },
                ]}
              >
                {item.caption}
              </Text>
            </View>
          )}

          {/* Footer of bubble: Time & delete */}
          <View style={styles.bubbleFooter}>
            <Text style={styles.timeText}>
              {new Date(item.createdAt).toLocaleTimeString('fa-IR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            {isMe && (
              <TouchableOpacity
                onPress={() => handleDeleteMessage(item)}
                style={styles.deleteBtn}
              >
                <Trash2 size={13} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderBottomColor: isDark ? '#334155' : '#e2e8f0' }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronRight size={26} color={isDark ? '#94a3b8' : COLORS.textLight} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>پیام‌ها و چت کلاس</Text>
          <Text style={[styles.headerSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>{className}</Text>
        </View>

        <View style={styles.headerRight}>
          <Volume2 size={22} color={COLORS.primary} />
        </View>
      </View>

      {/* Recipient Selection Bar */}
      <View style={[styles.recipientBar, { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderBottomColor: isDark ? '#334155' : '#e2e8f0' }]}>
        <Text style={[styles.recipientBarLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>ارسال به:</Text>

        <TouchableOpacity
          style={[
            styles.recipientPill,
            { backgroundColor: isDark ? '#0f172a' : '#f1f5f9', borderColor: isDark ? '#334155' : '#e2e8f0' },
            recipientScope === 'ALL' && styles.recipientPillActive,
          ]}
          onPress={() => {
            setRecipientScope('ALL');
            setSelectedStudent(null);
          }}
        >
          <Users size={14} color={recipientScope === 'ALL' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} />
          <Text
            style={[
              styles.recipientPillText,
              { color: isDark ? '#94a3b8' : '#64748b' },
              recipientScope === 'ALL' && styles.recipientPillTextActive,
            ]}
          >
            همه دانش‌آموزان
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.recipientPill,
            { backgroundColor: isDark ? '#0f172a' : '#f1f5f9', borderColor: isDark ? '#334155' : '#e2e8f0' },
            recipientScope === 'STUDENT' && styles.recipientPillActive,
          ]}
          onPress={() => setShowStudentPickerModal(true)}
        >
          <User size={14} color={recipientScope === 'STUDENT' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} />
          <Text
            style={[
              styles.recipientPillText,
              { color: isDark ? '#94a3b8' : '#64748b' },
              recipientScope === 'STUDENT' && styles.recipientPillTextActive,
            ]}
            numberOfLines={1}
          >
            {selectedStudent
              ? `${selectedStudent.firstName} ${selectedStudent.lastName}`
              : 'انتخاب دانش‌آموز...'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>در حال دریافت پیام‌ها...</Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Volume2 size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>هنوز پیامی ارسال نشده است</Text>
          <Text style={styles.emptySubtitle}>
            می‌توانید برای کل کلاس یا دانش‌آموز مورد نظر، پیام صوتی و تصویر فشرده WebP ارسال کنید.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* Recording in progress overlay bar */}
      {isRecording && (
        <View style={styles.recordingOverlay}>
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingTimeText}>
              در حال ضبط صدا: {formatSeconds(recordDuration)}
            </Text>
          </View>

          <View style={styles.recordingActions}>
            <TouchableOpacity
              onPress={cancelVoiceRecording}
              style={styles.cancelRecordBtn}
            >
              <X size={20} color="#ef4444" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => stopVoiceRecording(true)}
              style={styles.sendRecordBtn}
            >
              <Send size={18} color="#fff" />
              <Text style={styles.sendRecordText}>ارسال</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Native Bottom Actions Bar (Voice, Text & Image WebP) */}
      {!isRecording && (
        <View style={[styles.bottomBar, { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderTopColor: isDark ? '#334155' : '#e2e8f0' }]}>
          {sending ? (
            <View style={styles.sendingRow}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={[styles.sendingText, { color: isDark ? '#94a3b8' : '#64748b' }]}>در حال ارسال...</Text>
            </View>
          ) : (
            <>
              {/* Photo & WebP options */}
              <TouchableOpacity
                onPress={() => pickAndConvertImage(false)}
                style={[styles.actionCircleBtn, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' }]}
                activeOpacity={0.8}
              >
                <ImageIcon size={22} color={COLORS.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => pickAndConvertImage(true)}
                style={[styles.actionCircleBtn, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' }]}
                activeOpacity={0.8}
              >
                <Text style={styles.cameraEmoji}>📷</Text>
              </TouchableOpacity>

              {/* Text Input Box */}
              <View
                style={[
                  styles.inputBox,
                  {
                    backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.textInput,
                    { color: isDark ? '#f8fafc' : '#0f172a' },
                  ]}
                  placeholder="پیام خود را بنویسید..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={textMessage}
                  onChangeText={setTextMessage}
                  multiline
                  maxLength={1000}
                />
              </View>

              {/* Toggle Send button vs Mic button */}
              {textMessage.trim().length > 0 ? (
                <TouchableOpacity
                  onPress={handleSendTextMessage}
                  style={styles.sendButton}
                  activeOpacity={0.8}
                >
                  <Send size={20} color="#fff" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={startVoiceRecording}
                  style={styles.micButton}
                  activeOpacity={0.8}
                >
                  <Mic size={24} color="#fff" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}

      {/* Student Picker Modal */}
      <Modal
        visible={showStudentPickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStudentPickerModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#334155' : '#e2e8f0' }]}>
              <Text style={[styles.modalTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                انتخاب دانش‌آموز جهت ارسال پیام اختصاصی
              </Text>
              <TouchableOpacity onPress={() => setShowStudentPickerModal(false)}>
                <X size={22} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.studentRow,
                { borderBottomColor: isDark ? '#334155' : '#f1f5f9' },
                recipientScope === 'ALL' && (isDark ? styles.studentRowActiveDark : styles.studentRowActiveLight),
              ]}
              onPress={() => {
                setRecipientScope('ALL');
                setSelectedStudent(null);
                setShowStudentPickerModal(false);
              }}
            >
              <Users size={20} color={COLORS.primary} />
              <Text style={[styles.studentRowName, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                همه دانش‌آموزان (پیام عمومی کلاس)
              </Text>
              {recipientScope === 'ALL' && <Check size={18} color={COLORS.primary} />}
            </TouchableOpacity>

            <FlatList
              data={students}
              keyExtractor={(item) => item._id || item.phoneNumber}
              renderItem={({ item }) => {
                const isSelected = selectedStudent?._id === item._id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.studentRow,
                      { borderBottomColor: isDark ? '#334155' : '#f1f5f9' },
                      isSelected && (isDark ? styles.studentRowActiveDark : styles.studentRowActiveLight),
                    ]}
                    onPress={() => {
                      setRecipientScope('STUDENT');
                      setSelectedStudent(item);
                      setShowStudentPickerModal(false);
                    }}
                  >
                    <User size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                    <View style={styles.studentInfo}>
                      <Text style={[styles.studentRowName, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                        {item.firstName} {item.lastName}
                      </Text>
                      {item.phoneNumber ? (
                        <Text style={[styles.studentPhone, { color: isDark ? '#64748b' : '#94a3b8' }]}>{item.phoneNumber}</Text>
                      ) : null}
                    </View>
                    {isSelected && <Check size={18} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Image Preview & WebP Caption Modal */}
      <Modal
        visible={showImagePreviewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImagePreviewModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.imagePreviewModalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>پیش‌نمایش تصویر WebP</Text>
                <Text style={styles.webpInfoText}>
                  فرمت فشرده‌شده کاتلین: WebP | حجم:{' '}
                  {(webpFileSize / 1024).toFixed(1)} کیلوبایت
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowImagePreviewModal(false)}>
                <X size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedWebpUri && (
              <Image
                source={{ uri: selectedWebpUri }}
                style={styles.modalPreviewImage}
                resizeMode="contain"
              />
            )}

            <TextInput
              placeholder="توضیحات یا کپشن عکس (اختیاری)..."
              placeholderTextColor="#94a3b8"
              value={imageCaption}
              onChangeText={setImageCaption}
              style={styles.captionInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowImagePreviewModal(false)}
                style={styles.cancelModalBtn}
              >
                <Text style={styles.cancelModalText}>انصراف</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSendWebpImage}
                disabled={sending}
                style={styles.sendModalBtn}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Send size={18} color="#fff" />
                    <Text style={styles.sendModalText}>ارسال تصویر WebP</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full screen zoom image modal */}
      <Modal
        visible={!!previewZoomImage}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewZoomImage(null)}
      >
        <View style={styles.fullScreenImageContainer}>
          <TouchableOpacity
            style={styles.closeZoomBtn}
            onPress={() => setPreviewZoomImage(null)}
          >
            <X size={28} color="#fff" />
          </TouchableOpacity>
          {previewZoomImage && (
            <Image
              source={{ uri: previewZoomImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    padding: 6,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  headerRight: {
    padding: 6,
  },
  recipientBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    gap: 8,
  },
  recipientBarLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  recipientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    maxWidth: 160,
  },
  recipientPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  recipientPillText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  recipientPillTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  messagesList: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  messageRowRight: {
    justifyContent: 'flex-start',
  },
  messageRowLeft: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 18,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 2,
  },
  bubbleTeacher: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bubbleTeacherLight: {
    backgroundColor: '#eff6ff',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  bubbleStudent: {
    backgroundColor: '#0f2942',
    borderTopRightRadius: 4,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  bubbleStudentLight: {
    backgroundColor: '#ffffff',
    borderTopRightRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  scopeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  scopeBadgeAll: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  scopeBadgeStudent: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
  },
  scopeBadgeText: {
    fontSize: 10,
    color: '#e2e8f0',
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtnActive: {
    backgroundColor: '#ef4444',
  },
  voiceProgressArea: {
    flex: 1,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 32,
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#64748b',
    borderRadius: 2,
  },
  waveformBarActive: {
    backgroundColor: COLORS.primary,
  },
  voiceDurationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  voiceDurationText: {
    fontSize: 11,
    color: '#94a3b8',
    fontVariant: ['tabular-nums'],
  },
  voiceLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  chatImage: {
    width: 230,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#0f172a',
  },
  imageCaption: {
    fontSize: 13,
    color: '#f8fafc',
    marginTop: 6,
    lineHeight: 18,
  },
  webpBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  webpBadgeText: {
    fontSize: 9,
    color: '#38bdf8',
    fontWeight: 'bold',
  },
  bubbleFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  timeText: {
    fontSize: 10,
    color: '#64748b',
  },
  deleteBtn: {
    padding: 2,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 10,
  },
  actionCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cameraEmoji: {
    fontSize: 18,
  },
  textContainer: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  chatTextMessage: {
    fontSize: 14,
    fontFamily: 'IRANSansX',
    lineHeight: 22,
    textAlign: 'right',
  },
  inputBox: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    borderWidth: 1,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    textAlign: 'right',
    padding: 0,
    margin: 0,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  recordingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#ef4444',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
  },
  recordingTimeText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
  recordingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelRecordBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#22c55e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  sendRecordText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  sendingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 42,
  },
  sendingText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 18,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 18,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  studentRowActive: {
    backgroundColor: '#0f172a',
  },
  studentRowActiveDark: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  studentRowActiveLight: {
    backgroundColor: '#eff6ff',
  },
  studentInfo: {
    flex: 1,
  },
  studentRowName: {
    fontSize: 14,
    color: '#f8fafc',
    fontWeight: '500',
  },
  studentPhone: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  imagePreviewModalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 18,
  },
  webpInfoText: {
    fontSize: 11,
    color: '#38bdf8',
    marginTop: 2,
  },
  modalPreviewImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginVertical: 14,
  },
  captionInput: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelModalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#334155',
  },
  cancelModalText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  sendModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  sendModalText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  closeZoomBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
  },
});
