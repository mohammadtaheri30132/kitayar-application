import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  SafeAreaView,
  Platform,
  NativeModules,
  ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import {
  Mic,
  Video as VideoIcon,
  FileText,
  PhoneOff,
  Users,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react-native';
import { api, BASE_URL } from '../../api/axiosConfig';

const WebViewComponent = WebView as any;

export default function LiveClassroomScreen({ navigation, route }: any) {
  const { sessionId, bookingCode, title = 'کلاس آنلاین رفع اشکال' } = route?.params || {};

  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState<any>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [useEmbeddedWebView, setUseEmbeddedWebView] = useState(false);

  const webViewRef = useRef<WebView>(null);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Launch Native Kotlin Activity or Embedded WebRTC Classroom
  const openNativeClassroom = async (customUrl?: string) => {
    const roomTarget = tokenData?.roomId || sessionId || 'test-room';
    const url =
      customUrl ||
      tokenData?.directUrl ||
      `https://class.kitayar.ir/classroom/native/${encodeURIComponent(roomTarget)}?role=teacher&platform=app`;

    if (!url) {
      Alert.alert('خطا', 'آدرس ورود به کلاس یافت نشد.');
      return;
    }

    if (Platform.OS === 'android' && NativeModules.KitayarClassroom?.openClassroom) {
      try {
        await NativeModules.KitayarClassroom.openClassroom({
          roomUrl: url,
          title: tokenData?.title || title || 'کلاس آنلاین کیتایار',
          isTeacher: true,
          sessionId: sessionId || '',
        });
      } catch (err: any) {
        console.error('Launch Native Classroom Error:', err);
        Alert.alert('خطا در اجرای کلاس نیتیو', err?.message || 'لطفاً از حالت تحت وب استفاده کنید.');
        setUseEmbeddedWebView(true);
      }
    } else {
      setUseEmbeddedWebView(true);
    }
  };

  // Fetch token from backend
  useEffect(() => {
    let isMounted = true;

    const fetchClassToken = async () => {
      try {
        setLoading(true);
        const res = await api.post(`/classroom/rooms/${sessionId}/token`, {
          clientPlatform: Platform.OS === 'android' ? 'android_emulator' : 'mobile',
        });

        if (res.data?.success && res.data?.data) {
          const data = res.data.data;
          if (isMounted) {
            setTokenData(data);
          }

          const roomTarget = data.roomId || sessionId || 'test-room';
          const directUrl =
            data.directUrl ||
            `https://class.kitayar.ir/classroom/native/${encodeURIComponent(roomTarget)}?role=teacher&platform=app`;

          // Automatically launch the high-performance native Kotlin Activity on Android
          if (Platform.OS === 'android' && NativeModules.KitayarClassroom?.openClassroom && directUrl) {
            try {
              await NativeModules.KitayarClassroom.openClassroom({
                roomUrl: directUrl,
                title: data.title || title || 'کلاس آنلاین کیتایار',
                isTeacher: true,
                sessionId: sessionId || '',
              });
            } catch (openErr) {
              console.warn('Native auto-launch notice:', openErr);
            }
          }
        } else {
          Alert.alert('خطا در ورود به کلاس', res.data?.message || 'دریافت توکن ناموفق بود.');
          navigation.goBack();
        }
      } catch (err: any) {
        console.error('Classroom Token Error:', err);
        Alert.alert(
          'خطا در برقراری ارتباط',
          err.response?.data?.message || 'امکان ورود به کلاس آنلاین در این لحظه وجود ندارد.'
        );
        navigation.goBack();
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchClassToken();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  const handleEndClass = () => {
    Alert.alert(
      'پایان کلاس آنلاین',
      'آیا از اتمام رسمی این جلسه کلاس اطمینان دارید؟',
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'بله، خاتمه کلاس',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/classroom/rooms/${sessionId}/end`);
              Alert.alert('کلاس پایان یافت', 'جلسه با موفقیت خاتمه یافت و زمان آن ثبت گردید.');
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('خطا', err.response?.data?.message || 'خطا در خاتمه دادن به کلاس.');
            }
          },
        },
      ]
    );
  };

  const roomTarget = tokenData?.roomId || sessionId || 'test-room';
  const directUrl =
    tokenData?.directUrl ||
    `https://class.kitayar.ir/classroom/native/${encodeURIComponent(roomTarget)}?role=teacher&platform=app`;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>در حال ایجاد نشست نیتیو و صدور مجوز کلاس...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronRight color="#94a3b8" size={24} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {tokenData?.title || title}
          </Text>
          <View style={styles.headerSubrow}>
            <View style={styles.timerBadge}>
              <Text style={styles.timerText}>{formatTimer(elapsedSeconds)}</Text>
            </View>
            <View style={styles.nativeBadge}>
              <ShieldCheck size={12} color="#10b981" />
              <Text style={styles.nativeBadgeText}>موتور نیتیو کاتلین</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.participantPill}>
            <Users size={14} color="#f59e0b" />
            <Text style={styles.participantCount}>معلم</Text>
          </View>
        </View>
      </View>

      {/* Content Stage: Either Native Control Center or Embedded WebView */}
      {useEmbeddedWebView ? (
        <View style={styles.stageContainer}>
          <WebViewComponent
            ref={webViewRef}
            source={{ uri: directUrl }}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback={true}
            originWhitelist={['*']}
            mixedContentMode="always"
          />
          <TouchableOpacity
            style={styles.switchToNativeFloatBtn}
            onPress={() => {
              setUseEmbeddedWebView(false);
              openNativeClassroom();
            }}
          >
            <Sparkles size={16} color="#ffffff" />
            <Text style={styles.switchToNativeFloatText}>انتقال به محیط نیتیو تمام‌صفحه</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.lobbyContent} showsVerticalScrollIndicator={false}>
          {/* Main Action Banner */}
          <View style={styles.bannerCard}>
            <View style={styles.bannerHeader}>
              <View style={styles.iconCircle}>
                <Sparkles size={28} color="#3b82f6" />
              </View>
              <View style={styles.bannerTitles}>
                <Text style={styles.bannerMainTitle}>کلاس آنلاین اختصاصی کیتایار</Text>
                <Text style={styles.bannerSubTitle}>محیط فوق‌سریع و پایدار با زبان کاتلین و WebRTC</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryLaunchBtn}
              onPress={() => openNativeClassroom()}
              activeOpacity={0.85}
            >
              <ExternalLink size={20} color="#ffffff" />
              <Text style={styles.primaryLaunchBtnText}>ورود به محیط کلاس آنلاین نیتیو</Text>
            </TouchableOpacity>

            <Text style={styles.launchHint}>
              با لمس این دکمه، صفحه کلاس به‌صورت نیتیو، تمام‌صفحه و با پشتیبانی کامل از میکروفون، دوربین و ارسال فایل باز می‌شود.
            </Text>
          </View>

          {/* Features Grid */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>قابلیت‌های فعال در نسخه نیتیو:</Text>
          </View>

          <View style={styles.featureGrid}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIconBox, { backgroundColor: '#1e3a8a' }]}>
                <Mic size={20} color="#60a5fa" />
              </View>
              <Text style={styles.featureItemTitle}>ارتباط صوتی دوطرفه</Text>
              <Text style={styles.featureItemDesc}>کیفیت صدای شفاف با مدیریت اختصاصی AudioManager</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconBox, { backgroundColor: '#312e81' }]}>
                <FileText size={20} color="#a5b4fc" />
              </View>
              <Text style={styles.featureItemTitle}>بارگذاری فایل و PDF</Text>
              <Text style={styles.featureItemDesc}>انتخاب مستقیم اسلایدها و جزوات از حافظه گوشی با انتخاب‌گر نیتیو</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconBox, { backgroundColor: '#064e3b' }]}>
                <VideoIcon size={20} color="#34d399" />
              </View>
              <Text style={styles.featureItemTitle}>تصویر و دوربین</Text>
              <Text style={styles.featureItemDesc}>اشتراک تصویر زنده مدرس بدون افت فریم و بدون نیاز به مرورگر خارجی</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconBox, { backgroundColor: '#701a75' }]}>
                <ShieldCheck size={20} color="#f472b6" />
              </View>
              <Text style={styles.featureItemTitle}>روشن ماندن دائم صفحه</Text>
              <Text style={styles.featureItemDesc}>جلوگیری از خاموش یا قفل شدن گوشی حین تدریس با FLAG_KEEP_SCREEN_ON</Text>
            </View>
          </View>

          {/* Quick Actions Card */}
          <View style={styles.actionsCard}>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => openNativeClassroom()}
              activeOpacity={0.8}
            >
              <RefreshCw size={18} color="#94a3b8" />
              <Text style={styles.refreshBtnText}>اتصال مجدد به کلاس</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.embeddedToggleBtn}
              onPress={() => setUseEmbeddedWebView(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.embeddedToggleBtnText}>نمایش در نمای ادغام‌شده (پیش‌نمایش)</Text>
            </TouchableOpacity>
          </View>

          {/* End Call Button */}
          <TouchableOpacity
            style={styles.endCallCardBtn}
            onPress={handleEndClass}
            activeOpacity={0.85}
          >
            <PhoneOff color="#ffffff" size={20} />
            <Text style={styles.endCallCardBtnText}>خاتمه رسمی جلسه کلاس</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070b14',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#070b14',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 14,
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0b1122',
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  headerSubrow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 3,
    gap: 8,
  },
  timerBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timerText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  nativeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064e3b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  nativeBadgeText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerRight: {
    alignItems: 'center',
  },
  participantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#451a03',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#b45309',
  },
  participantCount: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lobbyContent: {
    padding: 16,
  },
  bannerCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e3a8a',
    marginBottom: 20,
  },
  bannerHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#172554',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitles: {
    flex: 1,
    alignItems: 'flex-end',
  },
  bannerMainTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'right',
  },
  bannerSubTitle: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'right',
  },
  primaryLaunchBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryLaunchBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  launchHint: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 16,
  },
  sectionTitleRow: {
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  sectionTitle: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  featureItem: {
    width: '48%',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'flex-end',
  },
  featureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureItemTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'right',
  },
  featureItemDesc: {
    color: '#64748b',
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'right',
  },
  actionsCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
    gap: 10,
  },
  refreshBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  refreshBtnText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  embeddedToggleBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  embeddedToggleBtnText: {
    color: '#64748b',
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  endCallCardBtn: {
    backgroundColor: '#dc2626',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 30,
  },
  endCallCardBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stageContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: '#070b14',
  },
  switchToNativeFloatBtn: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#4f46e5',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 8,
    elevation: 6,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  switchToNativeFloatText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
