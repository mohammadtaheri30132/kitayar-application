import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Linking, Animated, PanResponder, ActivityIndicator
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  X, Download, ChevronUp, ChevronDown, Edit, RefreshCw
} from 'lucide-react-native';
import { getToken } from '../../utils/storage';

// 👈 کامپوننت‌های مستقل تنظیمات؛ هرکدام state باتم‌شیت خودشان را نگه می‌دارند
import HeaderSettingItem from '../../components/question/HeaderSettingItem';
import StructureSettingItem from '../../components/question/StructureSettingItem';
import LinesSettingItem from '../../components/question/LinesSettingItem';
import FontsSettingItem from '../../components/question/FontsSettingItem';

const SHEET_MAX_HEIGHT = 260;
const SHEET_MIN_HEIGHT = 75;
const SNAP_TOP = 0;
const SNAP_BOTTOM = SHEET_MAX_HEIGHT - SHEET_MIN_HEIGHT;

// 👈 تاخیرهایی که بعد از سیگنال "آماده بودن" وب‌ویو، دوباره دیتا را تزریق می‌کنیم.
// تاخیر اول صفر شده تا به محض رسیدن سیگنال WEBVIEW_READY، بدون فوت وقت سینک انجام شود
// (حس سریع‌تر لود شدن سوالات)، بقیه فقط برای اطمینان (retry) هستند.
const RESYNC_RETRY_DELAYS_MS = [0, 300, 800, 1500];

const PreviewExamScreen = ({ route, navigation }: any) => {
  const initialQuestions = route.params?.questions || [];
  const initialHeader = route.params?.header || { id: 'none', label: 'بدون سربرگ' };

  const [questions, setQuestions] = useState<any[]>(initialQuestions);
  const [activeHeader, setActiveHeader] = useState<any>(initialHeader);
  const webViewRef = useRef<WebView>(null);
  const [isWebViewReady, setIsWebViewReady] = useState(false);

  const [isExpanded, setIsExpanded] = useState(true);
  const translateY = useRef(new Animated.Value(SNAP_TOP)).current;
  const lastGestureDy = useRef(SNAP_TOP);

  const [settings, setSettings] = useState({
    optionsLayout: 'inline',
    groupingMode: 'grouped',
    showScore: true,
    showQuestionNumber: true,
    questionDivider: true,
    showBismillah: false,
    essayAnswerLines: true,
    shortAnswerLine: true,
    optionLabelFormat: 'fa-alphabet',
    footerText: 'موفق و سرفراز باشید',
    questionsFontFamily: "'B Nazanin', Tahoma, sans-serif",
    headerFontFamily: "'B Nazanin', Tahoma, sans-serif",
    groupTitleFontFamily: "'B Titr Bold', Tahoma, sans-serif",
    baseFontSize: 13,
  });

  // 👈 رف‌هایی که همیشه آخرین مقدار استیت‌ها را نگه می‌دارند (برای جلوگیری از stale closure)
  const questionsRef = useRef(questions);
  const settingsRef = useRef(settings);
  const activeHeaderRef = useRef(activeHeader);

  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { activeHeaderRef.current = activeHeader; }, [activeHeader]);

  // 👈 حالا فقط ManageQuestionsScreen (که یک صفحه‌ی جدا و لازم است) از این مسیر
  // برمی‌گردد. تنظیمات و سربرگ دیگر هیچ‌وقت از طریق navigation params رد و بدل
  // نمی‌شوند، چون داخل همین صفحه با باتم‌شیت مدیریت می‌شوند و همین چیزی بود که
  // باعث خالی شدن سوالات بعد از برگشت از صفحه‌ی تنظیمات می‌شد.
  useEffect(() => {
    if (route.params?.updatedQuestions && route.params.updatedQuestions.length > 0) {
      setQuestions(route.params.updatedQuestions);
    }
  }, [route.params?.updatedQuestions]);

  const syncDataWithWebView = useCallback(() => {
    if (!webViewRef.current) return;

    const currentQuestions = questionsRef.current;
    if (!currentQuestions || currentQuestions.length === 0) return;

    const currentHeader = activeHeaderRef.current;
    const activeHeadersArray = currentHeader?.id && currentHeader.id !== 'none' ? [currentHeader] : [];

    const payloadObj = {
      type: 'SYNC_BUILDER_DATA',
      payload: { questions: currentQuestions, headers: activeHeadersArray, settings: settingsRef.current }
    };

    const safeString = JSON.stringify(JSON.stringify(payloadObj));

    webViewRef.current.injectJavaScript(`
      try {
        window.postMessage(${safeString}, '*');
      } catch (e) {
        console.error('WebView Sync Error:', e);
      }
      true;
    `);
  }, []);

  const syncWithRetries = useCallback(() => {
    syncDataWithWebView();
    const timers = RESYNC_RETRY_DELAYS_MS.map(delay => setTimeout(syncDataWithWebView, delay));
    return () => timers.forEach(clearTimeout);
  }, [syncDataWithWebView]);

  // هر زمان دیتا (سوالات/تنظیمات/هدر) تغییر کرد و وب‌ویو آماده بود، سینک کن.
  // چون حالا تنظیمات و هدر state محلی همین صفحه هستند (نه پارامترهای navigation)،
  // این افکت بلافاصله بعد از هر تغییر در باتم‌شیت‌ها اجرا می‌شود.
  useEffect(() => {
    if (!isWebViewReady) return;
    const cancel = syncWithRetries();
    return cancel;
  }, [settings, activeHeader, questions, isWebViewReady, syncWithRetries]);

  // برگشت از ManageQuestionsScreen هم دوباره سینک را تضمین می‌کند
  useFocusEffect(
    useCallback(() => {
      if (isWebViewReady) {
        const cancel = syncWithRetries();
        return cancel;
      }
      return undefined;
    }, [isWebViewReady, syncWithRetries])
  );

  const handleRequestPdfLink = async () => {
    if (!webViewRef.current) return;
    const token = await getToken();
    Alert.alert('در حال پردازش', 'لطفا چند لحظه صبر کنید...');
    const payloadObj = { type: 'REQUEST_PDF_LINK', token };
    webViewRef.current.injectJavaScript(`window.postMessage(${JSON.stringify(JSON.stringify(payloadObj))}, '*'); true;`);
  };

  // 👈 دکمه رفرش دقیقا مثل قبل حفظ شده
  const handleReloadWebView = () => {
    setIsWebViewReady(false);
    webViewRef.current?.reload();
  };

  const collapseSheet = () => {
    if (!isExpanded) return;
    setIsExpanded(false);
    lastGestureDy.current = SNAP_BOTTOM;
    Animated.spring(translateY, { toValue: SNAP_BOTTOM, useNativeDriver: true, bounciness: 4 }).start();
  };

  const expandSheet = () => {
    if (isExpanded) return;
    setIsExpanded(true);
    lastGestureDy.current = SNAP_TOP;
    Animated.spring(translateY, { toValue: SNAP_TOP, useNativeDriver: true, bounciness: 4 }).start();
  };

  const toggleSheet = () => {
    isExpanded ? collapseSheet() : expandSheet();
  };

  const onWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'WEBVIEW_READY') {
        setIsWebViewReady(true);
        syncWithRetries();
      }

      if (data.type === 'WEBVIEW_TOUCHED') {
        collapseSheet();
      }

      if (data.type === 'ERROR') Alert.alert('خطا', data.message || 'مشکلی پیش آمد.');
      if (data.type === 'PDF_LINK_READY') {
        Alert.alert('فایل آماده است!', 'فایل شما ساخته شد.', [
          { text: 'انصراف', style: 'cancel' },
          { text: 'دانلود', onPress: () => Linking.openURL(data.link) }
        ]);
      }
    } catch (error) {}
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
      onPanResponderGrant: () => {
        translateY.setOffset(lastGestureDy.current);
        translateY.setValue(0);
      },
      onPanResponderMove: Animated.event([null, { dy: translateY }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gestureState) => {
        translateY.flattenOffset();
        lastGestureDy.current += gestureState.dy;

        let snapTo = SNAP_BOTTOM;
        let expanded = false;
        if (lastGestureDy.current < SNAP_BOTTOM / 2) {
          snapTo = SNAP_TOP;
          expanded = true;
        }

        setIsExpanded(expanded);
        lastGestureDy.current = snapTo;
        Animated.spring(translateY, { toValue: snapTo, useNativeDriver: true, bounciness: 4 }).start();
      }
    })
  ).current;

  const openManageQuestions = () => {
    const bookId = questions[0]?.book || (typeof questions[0]?.book === 'object' ? questions[0].book._id : null);
    navigation.navigate('ManageQuestionsScreen', { questions, bookId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <X size={24} color="#334155" />
          </TouchableOpacity>
          <Text style={styles.title}>پیش‌نمایش نهایی</Text>
        </View>

        <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
          <TouchableOpacity onPress={handleReloadWebView} style={styles.reloadBtn}>
            <RefreshCw size={16} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.manageQBtn} onPress={openManageQuestions}>
            <Edit size={14} color="#2563eb" />
            <Text style={styles.manageQBtnText}>ویرایش سوالات</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRequestPdfLink} style={styles.downloadBtn}>
            <Download size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <WebView
          ref={webViewRef}
          source={{ uri: 'http://192.168.1.128:5173/kitayar-dashboard/mobile-preview' }}
          onLoadStart={() => {
            setIsWebViewReady(false);
          }}
          onLoadEnd={() => {
            setIsWebViewReady(true);
            syncWithRetries();
          }}
          onMessage={onWebViewMessage}
          userAgent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
          injectedJavaScript={`
            var meta = document.querySelector('meta[name="viewport"]');
            if (meta) { meta.setAttribute('content', 'width=1024, initial-scale=0.5, maximum-scale=5.0, user-scalable=yes'); }

            document.body.style.paddingBottom = '${SHEET_MIN_HEIGHT + 20}px';

            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'WEBVIEW_READY' }));

            document.addEventListener('touchstart', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'WEBVIEW_TOUCHED' }));
            });
            true;
          `}
          scalesPageToFit={true}
          setBuiltInZoomControls={true}
          setDisplayZoomControls={false}
          bounces={false}
          style={{ flex: 1, backgroundColor: '#f1f5f9' }}
        />

        {/* 👈 اورلی لودینگ: تا وقتی وب‌ویو دیتای سوالات را نگرفته، این نمایش داده می‌شود
            به جای این‌که کاربر یک صفحه‌ی خالی/نیمه‌بارگذاری‌شده ببیند */}
        {!isWebViewReady && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>در حال بارگذاری سوالات...</Text>
          </View>
        )}

        <Animated.View style={[styles.animatedSheet, { transform: [{ translateY }] }]}>
          <TouchableOpacity activeOpacity={0.9} onPress={toggleSheet} {...panResponder.panHandlers} style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
            <View style={styles.sheetHeaderTitle}>

              <Text style={styles.sheetTitle}>تنظیمات برگه</Text>

              <View style={styles.sheetHeaderLeft}>
                <Text style={styles.sheetToggleText}>
                  {isExpanded ? 'بستن تنظیمات' : 'مشاهده تنظیمات'}
                </Text>
                <View style={styles.iconCircle}>
                  {isExpanded ? <ChevronDown size={18} color="#3b82f6" /> : <ChevronUp size={18} color="#3b82f6" />}
                </View>
              </View>

            </View>
          </TouchableOpacity>

          {/* 👈 هر آیتم کاملاً مستقل است: دکمه‌ی گرید + باتم‌شیت خودش را دارد */}
          <View style={styles.gridContainer}>
            <HeaderSettingItem header={activeHeader} onChange={setActiveHeader} />
            <StructureSettingItem settings={settings} onChange={setSettings} />
            <LinesSettingItem settings={settings} onChange={setSettings} />
            <FontsSettingItem settings={settings} onChange={setSettings} />
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0', zIndex: 10 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginRight: 12 },
  backBtn: { padding: 4 },
  manageQBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  manageQBtnText: { color: '#2563eb', fontWeight: 'bold', fontSize: 13 },
  downloadBtn: { backgroundColor: '#10b981', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  reloadBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

  loadingOverlay: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', zIndex: 5, gap: 12,
  },
  loadingText: { fontSize: 13, color: '#64748b', fontWeight: 'bold' },

  animatedSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, height: SHEET_MAX_HEIGHT, backgroundColor: '#f8fafc', borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 20, zIndex: 100 },
  dragHandleContainer: { paddingTop: 12, paddingBottom: 16, alignItems: 'center', backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  dragHandle: { width: 40, height: 5, backgroundColor: '#cbd5e1', borderRadius: 3, marginBottom: 12 },

  sheetHeaderTitle: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 20 },
  sheetTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },

  sheetHeaderLeft: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 6 },
  sheetToggleText: { fontSize: 12, color: '#2563eb', fontWeight: 'bold' },
  iconCircle: { justifyContent: 'center', alignItems: 'center' },

  gridContainer: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16 },
});

export default PreviewExamScreen;