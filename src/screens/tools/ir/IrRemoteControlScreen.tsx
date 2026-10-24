import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { showWarning, showError, showConfirm } from '../../../components/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  Power,
  Volume2,
  VolumeX,
  Volume1,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Tv,
  Wind,
  Monitor,
  Radio,
  Sliders,
  Settings,
  Flame,
  Snowflake,
  Droplets,
  RotateCcw,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
  Lock,
  Pause,
  Play,
  Hash,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  DeviceCategory,
  IrCommand,
  IrProfile,
} from '../../../data/ir/types';
import { getProfileById, allProfiles } from '../../../data/ir';
import { irService } from '../../../services/irService';
import { AcDesiredState } from '../../../data/ir/acGenerators';

const { width } = Dimensions.get('window');

export const IrRemoteControlScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const profileId: string = route.params?.profileId || 'projector-epson-eb';
  const savedRemoteId: string | undefined = route.params?.savedRemoteId;
  const initialRemoteName: string = route.params?.remoteName || '';
  const initialRoomName: string = route.params?.roomName || '';
  const isSimulationMode: boolean = !!route.params?.isSimulationMode;

  const profile: IrProfile =
    getProfileById(profileId) || allProfiles[0];

  const remoteName = initialRemoteName || profile.brand;
  const roomName = initialRoomName || 'کلاس درس';

  // Air Conditioner State Model
  const [acState, setAcState] = useState<AcDesiredState>({
    power: true,
    temperature: 24,
    mode: 'cool',
    fanSpeed: 'auto',
    swing: true,
  });

  // UI state
  const [showNumberPad, setShowNumberPad] = useState<boolean>(false);
  const [lastTransmittedCommand, setLastTransmittedCommand] = useState<string | null>(null);
  const [pulseAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (savedRemoteId) {
      irService.updateLastUsed(savedRemoteId);
    }
  }, [savedRemoteId]);

  const triggerPulseEffect = () => {
    pulseAnim.setValue(1);
    Animated.timing(pulseAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const handleTransmit = async (
    commandId: string,
    overrideAcState?: AcDesiredState
  ) => {
    const cmd = profile.commands.find((c) => c.id === commandId);
    if (!cmd && profile.category !== 'ac') {
      showWarning('این دکمه در پروفایل دستگاه وجود ندارد.');
      return;
    }

    // Special safety confirmation for projector power-off
    if (profile.category === 'projector' && commandId === 'power') {
      showConfirm({
        title: 'هشدار خاموش کردن ویدئو پروژکتور',
        message: 'آیا مطمئن هستید که می‌خواهید ویدئو پروژکتور کلاس را خاموش کنید؟\n\nروشن شدن مجدد و خنک شدن لامپ پروژکتور چند دقیقه زمان می‌برد و ارائه کلاس متوقف خواهد شد.',
        confirmText: 'بله، ارسال فرمان خاموشی',
        cancelText: 'انصراف',
        isDestructive: true,
        icon: Power,
        onConfirm: () => doTransmit(cmd!),
      });
      return;
    }

    const stateToTransmit = overrideAcState || acState;
    const effectiveCmd = cmd || {
      id: commandId,
      label: commandId,
      protocol: 'RAW' as const,
    };

    await doTransmit(effectiveCmd, stateToTransmit);
  };

  const doTransmit = async (cmd: IrCommand, state?: AcDesiredState) => {
    triggerPulseEffect();
    setLastTransmittedCommand(cmd.label);

    try {
      const res = await irService.transmitCommand(
        profile,
        cmd,
        profile.category === 'ac' ? state || acState : undefined,
        isSimulationMode
      );

      if (!res.success) {
        showError(res.errorMessage || 'ارسال ناموفق بود.');
      }
    } catch (e: any) {
      showError(e?.message || 'خطای غیرمنتظره');
    }
  };

  // AC State Helpers
  const changeTemp = (delta: number) => {
    const minT = profile.acStateConfig?.minTemp || 16;
    const maxT = profile.acStateConfig?.maxTemp || 30;
    const newTemp = Math.max(minT, Math.min(maxT, acState.temperature + delta));

    if (newTemp !== acState.temperature) {
      const nextState = { ...acState, temperature: newTemp };
      setAcState(nextState);
      handleTransmit(delta > 0 ? 'temp_up' : 'temp_down', nextState);
    }
  };

  const setAcMode = (mode: 'cool' | 'heat' | 'dry' | 'fan' | 'auto') => {
    const nextState = { ...acState, mode, power: true };
    setAcState(nextState);
    handleTransmit(`mode_${mode}`, nextState);
  };

  const toggleAcFanSpeed = () => {
    const speeds: Array<'auto' | 'low' | 'med' | 'high'> = ['auto', 'low', 'med', 'high'];
    const curIdx = speeds.indexOf(acState.fanSpeed);
    const nextSpeed = speeds[(curIdx + 1) % speeds.length];
    const nextState = { ...acState, fanSpeed: nextSpeed };
    setAcState(nextState);
    handleTransmit('fan_speed', nextState);
  };

  const toggleAcSwing = () => {
    const nextState = { ...acState, swing: !acState.swing };
    setAcState(nextState);
    handleTransmit('swing', nextState);
  };

  const toggleAcPower = () => {
    const nextState = { ...acState, power: !acState.power };
    setAcState(nextState);
    handleTransmit('power', nextState);
  };

  // ==========================================
  // RENDER: PROJECTOR REMOTE LAYOUT
  // ==========================================
  const renderProjectorLayout = () => {
    return (
      <View style={styles.remoteLayoutContainer}>
        {/* Power & Blank Header Row */}
        <View style={styles.topControlRow}>
          <TouchableOpacity
            style={[styles.powerButton, styles.powerButtonRed]}
            activeOpacity={0.8}
            onPress={() => handleTransmit('power')}
          >
            <Power size={24} color="#ffffff" />
            <Text style={styles.powerButtonText}>خاموش / روشن</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.blankFeatureButton}
            activeOpacity={0.8}
            onPress={() => handleTransmit('blank')}
          >
            <Lock size={20} color="#0f172a" />
            <Text style={styles.blankFeatureText}>صفحه سیاه (Blank)</Text>
          </TouchableOpacity>
        </View>

        {/* Classroom Quick Controls: Freeze & Source */}
        <View style={styles.twoColumnRow}>
          <TouchableOpacity
            style={styles.featurePillButton}
            activeOpacity={0.8}
            onPress={() => handleTransmit('freeze')}
          >
            <Pause size={18} color="#2563eb" />
            <Text style={styles.featurePillText}>انجماد تصویر (Freeze)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featurePillButton}
            activeOpacity={0.8}
            onPress={() => handleTransmit('source')}
          >
            <Sliders size={18} color="#059669" />
            <Text style={styles.featurePillText}>انتخاب ورودی (Source)</Text>
          </TouchableOpacity>
        </View>

        {/* D-Pad Navigation */}
        <View style={styles.dpadSection}>
          <View style={styles.dpadCircle}>
            {/* UP */}
            <TouchableOpacity
              style={[styles.dpadArrow, styles.dpadUp]}
              activeOpacity={0.75}
              onPress={() => handleTransmit('up')}
            >
              <ChevronUp size={30} color="#1e293b" />
            </TouchableOpacity>

            {/* DOWN */}
            <TouchableOpacity
              style={[styles.dpadArrow, styles.dpadDown]}
              activeOpacity={0.75}
              onPress={() => handleTransmit('down')}
            >
              <ChevronDown size={30} color="#1e293b" />
            </TouchableOpacity>

            {/* LEFT */}
            <TouchableOpacity
              style={[styles.dpadArrow, styles.dpadLeft]}
              activeOpacity={0.75}
              onPress={() => handleTransmit('left')}
            >
              <ChevronLeft size={30} color="#1e293b" />
            </TouchableOpacity>

            {/* RIGHT */}
            <TouchableOpacity
              style={[styles.dpadArrow, styles.dpadRight]}
              activeOpacity={0.75}
              onPress={() => handleTransmit('right')}
            >
              <ChevronRight size={30} color="#1e293b" />
            </TouchableOpacity>

            {/* CENTER OK */}
            <TouchableOpacity
              style={styles.dpadCenter}
              activeOpacity={0.75}
              onPress={() => handleTransmit('enter')}
            >
              <Text style={styles.dpadCenterText}>تایید{'\n'}OK</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu & Esc Row */}
        <View style={styles.twoColumnRow}>
          <TouchableOpacity
            style={styles.featurePillButton}
            activeOpacity={0.8}
            onPress={() => handleTransmit('menu')}
          >
            <Settings size={18} color="#475569" />
            <Text style={styles.featurePillText}>منو (Menu)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featurePillButton}
            activeOpacity={0.8}
            onPress={() => handleTransmit('back')}
          >
            <RotateCcw size={18} color="#475569" />
            <Text style={styles.featurePillText}>بازگشت / خروج (Esc)</Text>
          </TouchableOpacity>
        </View>

        {/* Volume & Info Bar */}
        <View style={styles.volumeBarContainer}>
          <TouchableOpacity
            style={styles.volButton}
            activeOpacity={0.8}
            onPress={() => handleTransmit('vol_down')}
          >
            <Volume1 size={20} color="#334155" />
            <Text style={styles.volButtonText}>- صدا</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.volButton}
            activeOpacity={0.8}
            onPress={() => handleTransmit('info')}
          >
            <Info size={20} color="#2563eb" />
            <Text style={styles.volButtonText}>اطلاعات</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.volButton}
            activeOpacity={0.8}
            onPress={() => handleTransmit('vol_up')}
          >
            <Volume2 size={20} color="#334155" />
            <Text style={styles.volButtonText}>+ صدا</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ==========================================
  // RENDER: AIR CONDITIONER REMOTE LAYOUT
  // ==========================================
  const renderAcLayout = () => {
    return (
      <View style={styles.remoteLayoutContainer}>
        {/* Thermostat Display */}
        <View style={styles.thermostatCard}>
          <View style={styles.thermostatTopRow}>
            <View style={styles.acPowerStatusBadge}>
              <View
                style={[
                  styles.powerStatusDot,
                  { backgroundColor: acState.power ? '#22c55e' : '#94a3b8' },
                ]}
              />
              <Text style={styles.acPowerStatusText}>
                {acState.power ? 'دستگاه روشن' : 'دستگاه خاموش'}
              </Text>
            </View>

            <View style={styles.acModeBadge}>
              <Text style={styles.acModeBadgeText}>
                حالت:{' '}
                {acState.mode === 'cool'
                  ? 'سرمایش ❄️'
                  : acState.mode === 'heat'
                  ? 'گرمایش 🔥'
                  : acState.mode === 'dry'
                  ? 'رطوبت‌زدایی 💧'
                  : acState.mode === 'fan'
                  ? 'باد / فن 💨'
                  : 'خودکار 🔄'}
              </Text>
            </View>
          </View>

          {/* Large Target Temp */}
          <View style={styles.tempDisplayWrap}>
            <Text style={styles.tempNumberText}>{acState.temperature}</Text>
            <Text style={styles.tempUnitText}>°C</Text>
          </View>

          {/* Sub Attributes: Fan Speed & Swing */}
          <View style={styles.acSubAttributesRow}>
            <Text style={styles.acSubAttrText}>
              دور فن:{' '}
              {acState.fanSpeed === 'auto'
                ? 'خودکار'
                : acState.fanSpeed === 'low'
                ? 'کم'
                : acState.fanSpeed === 'med'
                ? 'متوسط'
                : 'زیاد'}
            </Text>
            <Text style={styles.acSubAttrText}>•</Text>
            <Text style={styles.acSubAttrText}>
              دمپر باد: {acState.swing ? 'گردش فعال' : 'ثابت'}
            </Text>
          </View>

          {/* Disclaimer: One-way IR limitation */}
          <View style={styles.acDisclaimerBox}>
            <Text style={styles.acDisclaimerText}>
              توجه: فرستنده مادون قرمز ارتباط یک‌طرفه دارد. صفحه نمایش آخرین حالت ارسالی شما را نشان می‌دهد.
            </Text>
          </View>
        </View>

        {/* Temperature Controls */}
        <View style={styles.tempControlsRow}>
          <TouchableOpacity
            style={styles.tempStepButton}
            activeOpacity={0.8}
            onPress={() => changeTemp(-1)}
          >
            <ChevronDown size={28} color="#0284c7" />
            <Text style={styles.tempStepText}>کاهش دما (-)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.acPowerToggleBtn,
              { backgroundColor: acState.power ? '#ef4444' : '#10b981' },
            ]}
            activeOpacity={0.85}
            onPress={toggleAcPower}
          >
            <Power size={28} color="#ffffff" />
            <Text style={styles.acPowerToggleText}>
              {acState.power ? 'خاموش' : 'روشن'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tempStepButton}
            activeOpacity={0.8}
            onPress={() => changeTemp(+1)}
          >
            <ChevronUp size={28} color="#0284c7" />
            <Text style={styles.tempStepText}>افزایش دما (+)</Text>
          </TouchableOpacity>
        </View>

        {/* Mode Selector Buttons */}
        <View style={styles.modesContainer}>
          <Text style={styles.modesTitle}>تغییر حالت کاربری:</Text>
          <View style={styles.modesGrid}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                acState.mode === 'cool' && styles.modeButtonActiveCool,
              ]}
              activeOpacity={0.8}
              onPress={() => setAcMode('cool')}
            >
              <Snowflake size={20} color={acState.mode === 'cool' ? '#0284c7' : '#64748b'} />
              <Text
                style={[
                  styles.modeButtonText,
                  acState.mode === 'cool' && styles.modeButtonTextActive,
                ]}
              >
                سرمایش
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                acState.mode === 'heat' && styles.modeButtonActiveHeat,
              ]}
              activeOpacity={0.8}
              onPress={() => setAcMode('heat')}
            >
              <Flame size={20} color={acState.mode === 'heat' ? '#ea580c' : '#64748b'} />
              <Text
                style={[
                  styles.modeButtonText,
                  acState.mode === 'heat' && styles.modeButtonTextActive,
                ]}
              >
                گرمایش
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                acState.mode === 'dry' && styles.modeButtonActiveDry,
              ]}
              activeOpacity={0.8}
              onPress={() => setAcMode('dry')}
            >
              <Droplets size={20} color={acState.mode === 'dry' ? '#0891b2' : '#64748b'} />
              <Text
                style={[
                  styles.modeButtonText,
                  acState.mode === 'dry' && styles.modeButtonTextActive,
                ]}
              >
                رطوبت‌زدایی
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                acState.mode === 'fan' && styles.modeButtonActiveFan,
              ]}
              activeOpacity={0.8}
              onPress={() => setAcMode('fan')}
            >
              <Wind size={20} color={acState.mode === 'fan' ? '#16a34a' : '#64748b'} />
              <Text
                style={[
                  styles.modeButtonText,
                  acState.mode === 'fan' && styles.modeButtonTextActive,
                ]}
              >
                باد / فن
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fan Speed & Swing Row */}
        <View style={styles.twoColumnRow}>
          <TouchableOpacity
            style={styles.featurePillButton}
            activeOpacity={0.8}
            onPress={toggleAcFanSpeed}
          >
            <Wind size={18} color="#0284c7" />
            <Text style={styles.featurePillText}>
              دور فن: {acState.fanSpeed.toUpperCase()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featurePillButton}
            activeOpacity={0.8}
            onPress={toggleAcSwing}
          >
            <RotateCcw size={18} color="#0284c7" />
            <Text style={styles.featurePillText}>
              گردش پره: {acState.swing ? 'روشن' : 'خاموش'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ==========================================
  // RENDER: TELEVISION REMOTE LAYOUT
  // ==========================================
  const renderTvLayout = () => {
    return (
      <View style={styles.remoteLayoutContainer}>
        {/* Top Control Bar: Power, Mute, Source */}
        <View style={styles.tvTopRow}>
          <TouchableOpacity
            style={[styles.powerButton, styles.powerButtonRed]}
            activeOpacity={0.8}
            onPress={() => handleTransmit('power')}
          >
            <Power size={22} color="#ffffff" />
            <Text style={styles.powerButtonText}>روشن / خاموش</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tvIconBtn}
            activeOpacity={0.8}
            onPress={() => handleTransmit('mute')}
          >
            <VolumeX size={20} color="#334155" />
            <Text style={styles.tvIconBtnText}>بی‌صدا</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tvIconBtn}
            activeOpacity={0.8}
            onPress={() => handleTransmit('source')}
          >
            <Sliders size={20} color="#334155" />
            <Text style={styles.tvIconBtnText}>ورودی</Text>
          </TouchableOpacity>
        </View>

        {/* Volume and Channel Rockers */}
        <View style={styles.rockersRow}>
          {/* Volume Rocker */}
          <View style={styles.rockerCard}>
            <TouchableOpacity
              style={styles.rockerHalfBtn}
              activeOpacity={0.8}
              onPress={() => handleTransmit('vol_up')}
            >
              <ChevronUp size={24} color="#0f172a" />
              <Text style={styles.rockerLabel}>صدا +</Text>
            </TouchableOpacity>

            <View style={styles.rockerDivider} />

            <TouchableOpacity
              style={styles.rockerHalfBtn}
              activeOpacity={0.8}
              onPress={() => handleTransmit('vol_down')}
            >
              <Text style={styles.rockerLabel}>صدا -</Text>
              <ChevronDown size={24} color="#0f172a" />
            </TouchableOpacity>
          </View>

          {/* Numeric Pad Toggle Center */}
          <TouchableOpacity
            style={styles.numPadToggleBtn}
            activeOpacity={0.8}
            onPress={() => setShowNumberPad(!showNumberPad)}
          >
            <Hash size={24} color="#2563eb" />
            <Text style={styles.numPadToggleText}>
              {showNumberPad ? 'بستن اعداد' : 'صفحه کلید اعداد'}
            </Text>
          </TouchableOpacity>

          {/* Channel Rocker */}
          <View style={styles.rockerCard}>
            <TouchableOpacity
              style={styles.rockerHalfBtn}
              activeOpacity={0.8}
              onPress={() => handleTransmit('ch_up')}
            >
              <ChevronUp size={24} color="#0f172a" />
              <Text style={styles.rockerLabel}>کانال +</Text>
            </TouchableOpacity>

            <View style={styles.rockerDivider} />

            <TouchableOpacity
              style={styles.rockerHalfBtn}
              activeOpacity={0.8}
              onPress={() => handleTransmit('ch_down')}
            >
              <Text style={styles.rockerLabel}>کانال -</Text>
              <ChevronDown size={24} color="#0f172a" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Collapsible Number Pad */}
        {showNumberPad && (
          <View style={styles.numPadGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
              <TouchableOpacity
                key={num}
                style={styles.numKeyButton}
                activeOpacity={0.75}
                onPress={() => handleTransmit(`num_${num}`)}
              >
                <Text style={styles.numKeyText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* TV D-Pad */}
        <View style={styles.dpadSection}>
          <View style={styles.dpadCircle}>
            <TouchableOpacity
              style={[styles.dpadArrow, styles.dpadUp]}
              activeOpacity={0.75}
              onPress={() => handleTransmit('up')}
            >
              <ChevronUp size={30} color="#1e293b" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dpadArrow, styles.dpadDown]}
              activeOpacity={0.75}
              onPress={() => handleTransmit('down')}
            >
              <ChevronDown size={30} color="#1e293b" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dpadArrow, styles.dpadLeft]}
              activeOpacity={0.75}
              onPress={() => handleTransmit('left')}
            >
              <ChevronLeft size={30} color="#1e293b" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dpadArrow, styles.dpadRight]}
              activeOpacity={0.75}
              onPress={() => handleTransmit('right')}
            >
              <ChevronRight size={30} color="#1e293b" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dpadCenter}
              activeOpacity={0.75}
              onPress={() => handleTransmit('enter')}
            >
              <Text style={styles.dpadCenterText}>تایید{'\n'}OK</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* TV Menu & Back */}
        <View style={styles.twoColumnRow}>
          <TouchableOpacity
            style={styles.featurePillButton}
            activeOpacity={0.8}
            onPress={() => handleTransmit('menu')}
          >
            <Settings size={18} color="#475569" />
            <Text style={styles.featurePillText}>تنظیمات / منو</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featurePillButton}
            activeOpacity={0.8}
            onPress={() => handleTransmit('back')}
          >
            <RotateCcw size={18} color="#475569" />
            <Text style={styles.featurePillText}>بازگشت (Return)</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Top App Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowRight size={22} color="#1e293b" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>{remoteName}</Text>
            <Text style={styles.headerSubtitle}>
              {roomName} • {profile.brand}
            </Text>
          </View>

          {/* IR Beam Pulse Indicator */}
          <Animated.View
            style={[
              styles.pulseIndicator,
              {
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.25],
                    }),
                  },
                ],
              },
            ]}
          >
            <Radio size={20} color="#2563eb" />
          </Animated.View>
        </View>

        {/* Top Info Banner if Simulation or Verified */}
        {isSimulationMode ? (
          <View style={styles.simulationBanner}>
            <Sparkles size={16} color="#b45309" />
            <Text style={styles.simulationBannerText}>
              حالت پیش‌نمایش / کدهای IR شبیه‌سازی می‌شوند.
            </Text>
          </View>
        ) : lastTransmittedCommand ? (
          <View style={styles.lastCommandBanner}>
            <Radio size={14} color="#15803d" />
            <Text style={styles.lastCommandText}>
              پالس «{lastTransmittedCommand}» ارسال شد ({profile.commands[0]?.protocol || 'NEC'})
            </Text>
          </View>
        ) : null}

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {profile.category === 'projector' && renderProjectorLayout()}
          {profile.category === 'ac' && renderAcLayout()}
          {profile.category === 'tv' && renderTvLayout()}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  pulseIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  simulationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  simulationBannerText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400e',
  },
  lastCommandBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  lastCommandText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  remoteLayoutContainer: {
    gap: 16,
  },
  // Top Controls
  topControlRow: {
    flexDirection: 'row',
    gap: 12,
  },
  powerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  powerButtonRed: {
    backgroundColor: '#ef4444',
  },
  powerButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  blankFeatureButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 18,
    paddingVertical: 14,
  },
  blankFeatureText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  featurePillButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingVertical: 12,
  },
  featurePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  // D-Pad
  dpadSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  dpadCircle: {
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  dpadArrow: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dpadUp: {
    top: 10,
    width: 64,
    height: 48,
  },
  dpadDown: {
    bottom: 10,
    width: 64,
    height: 48,
  },
  dpadLeft: {
    left: 10,
    width: 48,
    height: 64,
  },
  dpadRight: {
    right: 10,
    width: 48,
    height: 64,
  },
  dpadCenter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dpadCenterText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Volume Bar
  volumeBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 6,
    justifyContent: 'space-between',
  },
  volButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  volButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
  },
  // AC Layout Styles
  thermostatCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  thermostatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  acPowerStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  powerStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  acPowerStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  acModeBadge: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  acModeBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  tempDisplayWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginVertical: 12,
  },
  tempNumberText: {
    fontSize: 64,
    fontWeight: '900',
    color: '#0f172a',
  },
  tempUnitText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0284c7',
    marginTop: 10,
    marginLeft: 4,
  },
  acSubAttributesRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  acSubAttrText: {
    fontSize: 12,
    color: '#64748b',
  },
  acDisclaimerBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
  },
  acDisclaimerText: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
  tempControlsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  tempStepButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
    gap: 4,
  },
  tempStepText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  acPowerToggleBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  acPowerToggleText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 2,
  },
  modesContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  modesTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'right',
  },
  modesGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  modeButtonActiveCool: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7',
  },
  modeButtonActiveHeat: {
    backgroundColor: '#ffedd5',
    borderColor: '#ea580c',
  },
  modeButtonActiveDry: {
    backgroundColor: '#cffafe',
    borderColor: '#0891b2',
  },
  modeButtonActiveFan: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  modeButtonText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#0f172a',
    fontWeight: 'bold',
  },
  // TV Layout Styles
  tvTopRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tvIconBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingVertical: 12,
    gap: 4,
  },
  tvIconBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#334155',
  },
  rockersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  rockerCard: {
    width: 80,
    height: 140,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  rockerHalfBtn: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rockerDivider: {
    width: '60%',
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  rockerLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
  },
  numPadToggleBtn: {
    flex: 1,
    height: 140,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  numPadToggleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center',
  },
  numPadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
  },
  numKeyButton: {
    width: (width - 72) / 3,
    height: 46,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  numKeyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
});
