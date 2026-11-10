import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  PermissionsAndroid,
  Platform,
  StatusBar,
  NativeModules,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Mic,
  Sliders,
  Check,
  ShieldAlert,
  Lightbulb,
  X,
  Info,
} from 'lucide-react-native';

import { useTheme } from '../../../context/ThemeContext';
import { FONT_FAMILY } from '../../../theme/typography';
import { toPersianDigits } from '../../../utils/musicUtils';
import { PersianBottomSheet } from '../../../components/common/PersianBottomSheet';
import {
  ClassroomNoiseMeterNativeView,
  ClassroomNoiseMeterRef,
  SoundLevelChangeEvent,
  AlertTriggeredEvent,
  NoiseMeterErrorEvent,
} from './ClassroomNoiseMeterNativeView';

const { ClassroomNoiseMeterModule } = NativeModules;
const STORAGE_KEY = '@kitayar_noise_meter_settings_v2';
const TIP_STORAGE_KEY = '@kitayar_noise_meter_tip_dismissed_v1';

type BallStyle = 'emojis' | 'balls' | 'bubbles' | 'eyes';
type NoiseState = 'quiet' | 'moderate' | 'excessive';

interface SettingsState {
  sensitivity: number; // 1 to 10 (default 3)
  moderateThreshold: number; // 10 to 90 (default 50)
  excessiveThreshold: number; // 20 to 100 (default 75)
  alertModerateEnabled: boolean;
  alertExcessiveEnabled: boolean;
  ballCount: number; // 25, 45, 65
}

const DEFAULT_SETTINGS: SettingsState = {
  sensitivity: 3, // Default is 3 as requested
  moderateThreshold: 50,
  excessiveThreshold: 75,
  alertModerateEnabled: true,
  alertExcessiveEnabled: true,
  ballCount: 45,
};

// -------------------------------------------------------------
// Interactive Touch Slider Component
// -------------------------------------------------------------
const ModernSlider: React.FC<{
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (val: number) => void;
  accentColor?: string;
  unit?: string;
  label: string;
  hint?: string;
}> = ({
  value,
  min,
  max,
  step = 1,
  onValueChange,
  accentColor = '#2563eb',
  unit = '',
  label,
  hint,
}) => {
  const [trackWidth, setTrackWidth] = useState(1);

  const handleTouch = (evtX: number) => {
    if (trackWidth <= 0) return;
    const ratio = Math.max(0, Math.min(1, evtX / trackWidth));
    let rawVal = min + ratio * (max - min);
    if (step > 0) {
      rawVal = Math.round(rawVal / step) * step;
    }
    onValueChange(Math.max(min, Math.min(max, rawVal)));
  };

  const percent = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.headerRow}>
        <Text style={sliderStyles.label}>{label}</Text>
        <Text style={[sliderStyles.valueBadge, { color: accentColor }]}>
          {toPersianDigits(value)} {unit}
        </Text>
      </View>
      {hint ? <Text style={sliderStyles.hint}>{hint}</Text> : null}

      <View
        style={sliderStyles.trackTouchArea}
        onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onResponderGrant={e => handleTouch(e.nativeEvent.locationX)}
        onResponderMove={e => handleTouch(e.nativeEvent.locationX)}
      >
        <View style={sliderStyles.trackBackground}>
          <View
            style={[
              sliderStyles.trackFill,
              { width: `${percent}%`, backgroundColor: accentColor },
            ]}
          />
        </View>
        <View
          pointerEvents="none"
          style={[
            sliderStyles.thumb,
            { left: `${percent}%`, borderColor: accentColor },
          ]}
        />
      </View>
    </View>
  );
};

const sliderStyles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
    color: '#1e293b',
  },
  valueBadge: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
  },
  hint: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'right',
  },
  trackTouchArea: {
    height: 38,
    justifyContent: 'center',
  },
  trackBackground: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  trackFill: {
    height: '100%',
    borderRadius: 4,
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginLeft: -12,
    borderWidth: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});

// -------------------------------------------------------------
// Main Classroom Noise Meter Screen
// -------------------------------------------------------------
export const ClassroomNoiseMeterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const meterRef = useRef<ClassroomNoiseMeterRef>(null);

  // States
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [ballStyle, setBallStyle] = useState<BallStyle>('emojis');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(true);

  // Calibration Tip Banner state
  const [showTipBanner, setShowTipBanner] = useState<boolean>(true);

  // Live Sound Level (0 - 100)
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [noiseState, setNoiseState] = useState<NoiseState>('quiet');

  // Configurable settings
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);

  // Load saved preferences & tip dismissal status
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [storedSettings, storedTip] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(TIP_STORAGE_KEY),
        ]);

        if (storedSettings) {
          const parsed = JSON.parse(storedSettings);
          setSettings(prev => ({ ...prev, ...parsed }));
          if (parsed.ballStyle) {
            setBallStyle(parsed.ballStyle);
          }
        }

        if (storedTip === 'true') {
          setShowTipBanner(false);
        }
      } catch (err) {
        console.warn('Failed to load noise meter settings', err);
      }
    };
    loadSettings();
  }, []);

  const dismissTipBanner = async () => {
    setShowTipBanner(false);
    try {
      await AsyncStorage.setItem(TIP_STORAGE_KEY, 'true');
    } catch (_: any) {}
  };

  // Save settings when changed
  const saveSettings = async (newSettings: SettingsState) => {
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...newSettings, ballStyle })
      );
    } catch (err) {
      console.warn('Failed to save noise meter settings', err);
    }
  };

  // Microphone Permission Check & Request
  const requestMicPermission = useCallback(async () => {
    if (Platform.OS !== 'android') return true;

    try {
      const alreadyGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      if (alreadyGranted) {
        setPermissionGranted(true);
        return true;
      }

      const status = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'دسترسی به میکروفون',
          message:
            'جهت اندازه‌گیری میزان صدای کلاس و تکان دادن ایموجی‌ها، برنامه نیاز به دسترسی میکروفون دارد. هیچ صدایی ذخیره یا ارسال نمی‌شود.',
          buttonPositive: 'تأیید',
          buttonNegative: 'انصراف',
        }
      );

      const granted = status === PermissionsAndroid.RESULTS.GRANTED;
      setPermissionGranted(granted);
      return granted;
    } catch (err) {
      console.error('Permission request error', err);
      return false;
    }
  }, []);

  useEffect(() => {
    requestMicPermission();
  }, [requestMicPermission]);

  // Clean lifecycle handling on navigation blur/focus
  useFocusEffect(
    useCallback(() => {
      setIsRunning(true);
      return () => {
        setIsRunning(false);
        if (ClassroomNoiseMeterModule?.stopSounds) {
          ClassroomNoiseMeterModule.stopSounds();
        }
      };
    }, [])
  );

  // Event Callbacks from Native View
  const handleSoundLevelChange = useCallback((e: SoundLevelChangeEvent) => {
    const { level, state } = e.nativeEvent;
    setCurrentLevel(level);
    setNoiseState(state);
  }, []);

  const handleAlertTriggered = useCallback((e: AlertTriggeredEvent) => {
    // Native audio handles alert beep playback
  }, []);

  const handleError = useCallback((e: NoiseMeterErrorEvent) => {
    if (e.nativeEvent.code === 'PERMISSION_DENIED') {
      setPermissionGranted(false);
    }
  }, []);

  // Convert sensitivity slider (1-10) to native float multiplier (0.35x - 1.85x)
  // Level 3 (default) evaluates to ~0.68x, providing a well-balanced acoustic curve
  const sensitivityMultiplier = 0.35 + (settings.sensitivity - 1) * 0.165;

  // Toggle Controls
  const toggleRunning = () => {
    const next = !isRunning;
    setIsRunning(next);
    if (next) {
      meterRef.current?.start();
    } else {
      meterRef.current?.stop();
      if (ClassroomNoiseMeterModule?.stopSounds) {
        ClassroomNoiseMeterModule.stopSounds();
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const handleReset = () => {
    meterRef.current?.reset();
  };

  const cycleBallStyle = () => {
    const styles: BallStyle[] = ['emojis', 'balls', 'bubbles', 'eyes'];
    const idx = styles.indexOf(ballStyle);
    const nextStyle = styles[(idx + 1) % styles.length];
    setBallStyle(nextStyle);
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...settings, ballStyle: nextStyle })
    ).catch(() => {});
  };

  // State Color & Text Helpers
  const getStateInfo = () => {
    switch (noiseState) {
      case 'excessive':
        return {
          title: 'سروصدای زیاد',
          color: '#ef4444',
          bg: '#fee2e2',
          border: '#fca5a5',
        };
      case 'moderate':
        return {
          title: 'صدای متوسط',
          color: '#f59e0b',
          bg: '#fef3c7',
          border: '#fcd34d',
        };
      default:
        return {
          title: 'آرام و مناسب',
          color: '#10b981',
          bg: '#ecfdf5',
          border: '#a7f3d0',
        };
    }
  };

  const stateInfo = getStateInfo();

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? '#0f172a' : '#f8fafc' },
      ]}
      edges={isFullscreen ? [] : ['top', 'bottom']}
    >
      <StatusBar
        hidden={isFullscreen}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      {/* Normal App Header (Hidden in Fullscreen) */}
      {!isFullscreen && (
        <View style={[styles.header, { borderBottomColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.goBack()}
            accessibilityLabel="بازگشت"
          >
            <ArrowRight size={22} color={isDark ? '#f8fafc' : '#1e293b'} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: isDark ? '#f8fafc' : '#1e293b' }]}>
              صداسنج کلاس
            </Text>
            <Text style={styles.headerSubtitle}>
              سنجش زنده همهمه با توپ‌های متحرک
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => setShowTipBanner(prev => !prev)}
              accessibilityLabel="راهنمای کالیبراسیون"
            >
              <Lightbulb size={20} color="#f59e0b" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => setIsFullscreen(true)}
              accessibilityLabel="تمام‌صفحه"
            >
              <Maximize2 size={20} color={isDark ? '#cbd5e1' : '#475569'} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => setShowSettings(true)}
              accessibilityLabel="تنظیمات"
            >
              <Settings size={20} color={isDark ? '#cbd5e1' : '#475569'} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Calibration Notice Banner */}
      {!isFullscreen && showTipBanner && (
        <View
          style={[
            styles.tipBanner,
            {
              backgroundColor: isDark ? '#1e293b' : '#eff6ff',
              borderColor: isDark ? '#334155' : '#bfdbfe',
            },
          ]}
        >
          <View style={styles.tipIconWrap}>
            <Lightbulb size={18} color="#2563eb" />
          </View>
          <View style={styles.tipTextCol}>
            <Text style={[styles.tipTitle, { color: isDark ? '#f8fafc' : '#1e3a8a' }]}>
              کالیبراسیون میکروفون
            </Text>
            <Text style={[styles.tipText, { color: isDark ? '#cbd5e1' : '#1e40af' }]}>
              بر اساس مدل هر گوشی حساسیت میکروفون متفاوت است. لطفاً ابتدا از نوار زیر، حساسیت را نسبت به محیط و شلوغی کلاس خود تنظیم کنید.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.tipCloseBtn}
            onPress={dismissTipBanner}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={16} color={isDark ? '#94a3b8' : '#64748b'} />
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Sensitivity Control Bar (Always accessible at the top) */}
      {!isFullscreen && (
        <View
          style={[
            styles.quickSensBar,
            {
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              borderBottomColor: isDark ? '#334155' : '#f1f5f9',
            },
          ]}
        >
          <View style={styles.quickSensHeader}>
            <View style={styles.quickSensLabelGroup}>
              <Mic size={15} color="#2563eb" />
              <Text style={[styles.quickSensLabel, { color: isDark ? '#f8fafc' : '#1e293b' }]}>
                حساسیت میکروفون:
              </Text>
              <View style={styles.quickSensValueBadge}>
                <Text style={styles.quickSensValueText}>
                  {toPersianDigits(settings.sensitivity)}
                </Text>
              </View>
            </View>

            <Text style={styles.quickSensHintText}>
              {settings.sensitivity <= 2
                ? 'کم (کلاس‌های پرصدا)'
                : settings.sensitivity <= 4
                ? 'متعادل (استاندارد کلاس)'
                : 'زیاد (امتحان / کتابخانه)'}
            </Text>
          </View>

          {/* 10-Step Touch Selector for instant 1-tap sensitivity change */}
          <View style={styles.stepsRow}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(step => {
              const isActive = settings.sensitivity === step;
              return (
                <TouchableOpacity
                  key={step}
                  style={[
                    styles.stepPill,
                    isActive && styles.stepPillActive,
                    {
                      backgroundColor: isActive
                        ? '#2563eb'
                        : isDark
                        ? '#334155'
                        : '#f1f5f9',
                    },
                  ]}
                  onPress={() => saveSettings({ ...settings, sensitivity: step })}
                  hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
                >
                  <Text
                    style={[
                      styles.stepPillText,
                      isActive && styles.stepPillTextActive,
                      { color: isActive ? '#ffffff' : isDark ? '#cbd5e1' : '#64748b' },
                    ]}
                  >
                    {toPersianDigits(step)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Main Interactive Stage */}
      <View style={styles.stageContainer}>
        {/* Floating Top HUD Status Bar */}
        <View
          style={[
            styles.floatingHud,
            isFullscreen && styles.floatingHudFullscreen,
            { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.92)' : 'rgba(255, 255, 255, 0.92)' },
          ]}
        >
          {/* Level Progress Indicator */}
          <View style={styles.hudLevelRow}>
            <View style={styles.levelBarWrapper}>
              <View
                style={[
                  styles.levelBarFill,
                  {
                    width: `${Math.min(100, Math.max(0, currentLevel))}%`,
                    backgroundColor: stateInfo.color,
                  },
                ]}
              />
              {/* Threshold Indicators */}
              <View
                style={[
                  styles.thresholdMarker,
                  { left: `${settings.moderateThreshold}%`, backgroundColor: '#f59e0b' },
                ]}
              />
              <View
                style={[
                  styles.thresholdMarker,
                  { left: `${settings.excessiveThreshold}%`, backgroundColor: '#ef4444' },
                ]}
              />
            </View>

            <View style={styles.numericLevelWrap}>
              <Text style={[styles.numericLevelText, { color: stateInfo.color }]}>
                {toPersianDigits(Math.round(currentLevel))}
              </Text>
              <Text style={styles.numericLevelMax}> / ۱۰۰</Text>
            </View>
          </View>

          {/* Status Badge & Fullscreen Exit Button */}
          <View style={styles.hudMetaRow}>
            <View
              style={[
                styles.statePill,
                { backgroundColor: stateInfo.bg, borderColor: stateInfo.border },
              ]}
            >
              <View style={[styles.stateDot, { backgroundColor: stateInfo.color }]} />
              <Text style={[styles.statePillText, { color: stateInfo.color }]}>
                {stateInfo.title}
              </Text>
            </View>

            {/* Quick Fullscreen Floating Controls */}
            {isFullscreen ? (
              <View style={styles.fullscreenControls}>
                {/* Fullscreen Quick Sensitivity Stepper */}
                <View style={styles.fullscreenSensBox}>
                  <Text style={styles.fullscreenSensLabel}>
                    حساسیت: {toPersianDigits(settings.sensitivity)}
                  </Text>
                  <TouchableOpacity
                    style={styles.fullscreenSensBtn}
                    onPress={() =>
                      saveSettings({
                        ...settings,
                        sensitivity: Math.max(1, settings.sensitivity - 1),
                      })
                    }
                  >
                    <Text style={styles.fullscreenSensBtnText}>-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.fullscreenSensBtn}
                    onPress={() =>
                      saveSettings({
                        ...settings,
                        sensitivity: Math.min(10, settings.sensitivity + 1),
                      })
                    }
                  >
                    <Text style={styles.fullscreenSensBtnText}>+</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.miniFab}
                  onPress={toggleRunning}
                >
                  {isRunning ? (
                    <Pause size={18} color="#2563eb" />
                  ) : (
                    <Play size={18} color="#10b981" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.miniFab}
                  onPress={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX size={18} color="#ef4444" />
                  ) : (
                    <Volume2 size={18} color="#2563eb" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.miniFab, styles.exitFullscreenBtn]}
                  onPress={() => setIsFullscreen(false)}
                >
                  <Minimize2 size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>

        {/* Permission Denied Warning Banner */}
        {!permissionGranted && (
          <View style={styles.permissionBanner}>
            <ShieldAlert size={24} color="#ef4444" />
            <Text style={styles.permissionText}>
              دسترسی به میکروفون غیرفعال است. جهت کارکرد صداسنج دسترسی را تأیید کنید.
            </Text>
            <TouchableOpacity
              style={styles.permissionBtn}
              onPress={requestMicPermission}
            >
              <Text style={styles.permissionBtnText}>فعال‌سازی</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Native Kotlin Physics Visualization Canvas */}
        <ClassroomNoiseMeterNativeView
          ref={meterRef}
          style={styles.nativeCanvas}
          isRunning={isRunning}
          isMuted={isMuted}
          sensitivity={sensitivityMultiplier}
          moderateThreshold={settings.moderateThreshold}
          excessiveThreshold={settings.excessiveThreshold}
          alertModerateEnabled={settings.alertModerateEnabled}
          alertExcessiveEnabled={settings.alertExcessiveEnabled}
          ballStyle={ballStyle}
          ballCount={settings.ballCount}
          onSoundLevelChange={handleSoundLevelChange}
          onAlertTriggered={handleAlertTriggered}
          onError={handleError}
        />
      </View>

      {/* Normal Bottom Controls (Hidden in Fullscreen) */}
      {!isFullscreen && (
        <View
          style={[
            styles.bottomControls,
            {
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              borderTopColor: isDark ? '#334155' : '#e2e8f0',
            },
          ]}
        >
          {/* Main Action Button (Play / Pause) */}
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              { backgroundColor: isRunning ? '#f1f5f9' : '#2563eb' },
            ]}
            onPress={toggleRunning}
            activeOpacity={0.8}
          >
            {isRunning ? (
              <>
                <Pause size={20} color="#1e293b" />
                <Text style={[styles.primaryBtnText, { color: '#1e293b' }]}>
                  توقف پایش
                </Text>
              </>
            ) : (
              <>
                <Play size={20} color="#ffffff" />
                <Text style={[styles.primaryBtnText, { color: '#ffffff' }]}>
                  شروع پایش
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Auxiliary Tool Buttons */}
          <View style={styles.auxControls}>
            {/* Mute Button */}
            <TouchableOpacity
              style={[
                styles.toolIconBtn,
                isMuted && styles.mutedActiveBtn,
                { backgroundColor: isDark ? '#334155' : '#f8fafc' },
              ]}
              onPress={toggleMute}
            >
              {isMuted ? (
                <VolumeX size={20} color="#ef4444" />
              ) : (
                <Volume2 size={20} color="#2563eb" />
              )}
              <Text
                style={[
                  styles.toolBtnText,
                  { color: isMuted ? '#ef4444' : isDark ? '#cbd5e1' : '#475569' },
                ]}
              >
                {isMuted ? 'بی‌صدا' : 'با هشدار'}
              </Text>
            </TouchableOpacity>

            {/* Visual Style Switcher */}
            <TouchableOpacity
              style={[
                styles.toolIconBtn,
                { backgroundColor: isDark ? '#334155' : '#f8fafc' },
              ]}
              onPress={cycleBallStyle}
            >
              <Sparkles size={20} color="#8b5cf6" />
              <Text style={[styles.toolBtnText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                {ballStyle === 'emojis'
                  ? 'ایموجی'
                  : ballStyle === 'balls'
                  ? 'توپ‌ها'
                  : ballStyle === 'bubbles'
                  ? 'حباب‌ها'
                  : 'چشم‌ها'}
              </Text>
            </TouchableOpacity>

            {/* Reset Simulation */}
            <TouchableOpacity
              style={[
                styles.toolIconBtn,
                { backgroundColor: isDark ? '#334155' : '#f8fafc' },
              ]}
              onPress={handleReset}
            >
              <RotateCcw size={20} color="#64748b" />
              <Text style={[styles.toolBtnText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                ریست
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Settings Bottom Sheet */}
      <PersianBottomSheet
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        title="تنظیمات صداسنج کلاس"
        subtitle="شخصی‌سازی حساسیت میکروفون، آستانه‌ها و هشدارهای صوتی"
      >
        <View style={styles.settingsContent}>
          {/* Sensitivity Slider in Settings */}
          <ModernSlider
            label="حساسیت میکروفون"
            hint="پیش‌فرض: ۳ (در کلاس‌های پرجمعیت ۳ یا کمتر، در کلاس‌های خلوت یا امتحان ۵ به بالا)"
            value={settings.sensitivity}
            min={1}
            max={10}
            step={1}
            accentColor="#2563eb"
            onValueChange={val => saveSettings({ ...settings, sensitivity: val })}
          />

          <View style={styles.divider} />

          {/* Moderate Noise Threshold */}
          <ModernSlider
            label="آستانه هشدار صدای متوسط (زرد)"
            hint="سطح صدایی که در آن صدای ملایم هشدار پخش می‌شود."
            value={settings.moderateThreshold}
            min={20}
            max={Math.min(80, settings.excessiveThreshold - 5)}
            step={5}
            unit="٪"
            accentColor="#f59e0b"
            onValueChange={val => saveSettings({ ...settings, moderateThreshold: val })}
          />

          <View style={styles.settingToggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>پخش هشدار صدای متوسط</Text>
              <Text style={styles.toggleDesc}>پخش صدای کوتاه با فواصل مجاز</Text>
            </View>
            <View style={styles.toggleActionCol}>
              <Switch
                value={settings.alertModerateEnabled}
                onValueChange={val =>
                  saveSettings({ ...settings, alertModerateEnabled: val })
                }
                thumbColor={settings.alertModerateEnabled ? '#2563eb' : '#f4f4f5'}
                trackColor={{ false: '#e4e4e7', true: '#93c5fd' }}
              />
              <TouchableOpacity
                style={styles.testToneBtn}
                onPress={() => ClassroomNoiseMeterModule?.testAlertSound('moderate')}
              >
                <Text style={styles.testToneText}>تست صدا</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Excessive Noise Threshold */}
          <ModernSlider
            label="آستانه هشدار سروصدای زیاد (قرمز)"
            hint="سطح صدایی که در آن بوق ممتد هشدار فعال خواهد شد."
            value={settings.excessiveThreshold}
            min={Math.max(30, settings.moderateThreshold + 5)}
            max={95}
            step={5}
            unit="٪"
            accentColor="#ef4444"
            onValueChange={val => saveSettings({ ...settings, excessiveThreshold: val })}
          />

          <View style={styles.settingToggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>بوق ممتد سروصدای بیش‌ازحد</Text>
              <Text style={styles.toggleDesc}>پخش ممتد بوق تا زمان برقراری سکوت</Text>
            </View>
            <View style={styles.toggleActionCol}>
              <Switch
                value={settings.alertExcessiveEnabled}
                onValueChange={val =>
                  saveSettings({ ...settings, alertExcessiveEnabled: val })
                }
                thumbColor={settings.alertExcessiveEnabled ? '#ef4444' : '#f4f4f5'}
                trackColor={{ false: '#e4e4e7', true: '#fca5a5' }}
              />
              <TouchableOpacity
                style={styles.testToneBtn}
                onPress={() => ClassroomNoiseMeterModule?.testAlertSound('excessive')}
              >
                <Text style={styles.testToneText}>تست صدا</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Visual Ball Count */}
          <View style={styles.settingToggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>تعداد اجزای متحرک</Text>
              <Text style={styles.toggleDesc}>تعداد ایموجی‌ها و توپ‌ها روی صفحه</Text>
            </View>
            <View style={styles.ballCountSelector}>
              {[25, 45, 65].map(cnt => (
                <TouchableOpacity
                  key={cnt}
                  style={[
                    styles.countPill,
                    settings.ballCount === cnt && styles.countPillActive,
                  ]}
                  onPress={() => saveSettings({ ...settings, ballCount: cnt })}
                >
                  <Text
                    style={[
                      styles.countPillText,
                      settings.ballCount === cnt && styles.countPillTextActive,
                    ]}
                  >
                    {toPersianDigits(cnt)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Restore Defaults */}
          <TouchableOpacity
            style={styles.restoreDefaultsBtn}
            onPress={() => {
              saveSettings(DEFAULT_SETTINGS);
              Alert.alert('موفق', 'تنظیمات به حالت پیش‌فرض (حساسیت ۳) بازگردانده شد.');
            }}
          >
            <RotateCcw size={16} color="#64748b" />
            <Text style={styles.restoreDefaultsText}>
              بازنشانی تنظیمات به حالت اولیه (پیش‌فرض ۳)
            </Text>
          </TouchableOpacity>
        </View>
      </PersianBottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: FONT_FAMILY.bold,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    color: '#64748b',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row-reverse',
    gap: 4,
  },
  tipBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  tipIconWrap: {
    marginTop: 2,
  },
  tipTextCol: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
    marginBottom: 2,
  },
  tipText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'right',
    lineHeight: 18,
  },
  tipCloseBtn: {
    padding: 2,
  },
  quickSensBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 6,
  },
  quickSensHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickSensLabelGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  quickSensLabel: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },
  quickSensValueBadge: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  quickSensValueText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: FONT_FAMILY.bold,
  },
  quickSensHintText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    color: '#64748b',
  },
  stepsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 4,
  },
  stepPill: {
    flex: 1,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepPillActive: {
    backgroundColor: '#2563eb',
  },
  stepPillText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },
  stepPillTextActive: {
    color: '#ffffff',
  },
  stageContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  nativeCanvas: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  floatingHud: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    zIndex: 10,
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingHudFullscreen: {
    top: 20,
    left: 20,
    right: 20,
  },
  hudLevelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  levelBarWrapper: {
    flex: 1,
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 5,
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  levelBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  thresholdMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    zIndex: 2,
  },
  numericLevelWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    minWidth: 58,
  },
  numericLevelText: {
    fontSize: 18,
    fontFamily: FONT_FAMILY.bold,
  },
  numericLevelMax: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    color: '#94a3b8',
  },
  hudMetaRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  statePill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  stateDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statePillText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },
  fullscreenControls: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  fullscreenSensBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  fullscreenSensLabel: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bold,
    color: '#334155',
  },
  fullscreenSensBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenSensBtnText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
    color: '#2563eb',
  },
  miniFab: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  exitFullscreenBtn: {
    backgroundColor: '#ef4444',
  },
  permissionBanner: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    zIndex: 20,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  permissionText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    color: '#991b1b',
    textAlign: 'right',
  },
  permissionBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  permissionBtnText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
    color: '#ffffff',
  },
  bottomControls: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    borderTopWidth: 1,
    gap: 10,
  },
  primaryBtn: {
    height: 46,
    borderRadius: 12,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryBtnText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
  },
  auxControls: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  toolIconBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  mutedActiveBtn: {
    backgroundColor: '#fee2e2',
  },
  toolBtnText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.medium,
  },
  settingsContent: {
    paddingHorizontal: 8,
    paddingBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  settingToggleRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
    color: '#1e293b',
    textAlign: 'right',
  },
  toggleDesc: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    color: '#64748b',
    textAlign: 'right',
    marginTop: 2,
  },
  toggleActionCol: {
    alignItems: 'center',
    gap: 4,
  },
  testToneBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  testToneText: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.medium,
    color: '#475569',
  },
  ballCountSelector: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  countPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  countPillActive: {
    backgroundColor: '#2563eb',
  },
  countPillText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
    color: '#475569',
  },
  countPillTextActive: {
    color: '#ffffff',
  },
  restoreDefaultsBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  restoreDefaultsText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.medium,
    color: '#64748b',
  },
});

export default ClassroomNoiseMeterScreen;
