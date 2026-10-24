import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  Maximize2,
  Lock,
  Unlock,
  RotateCcw,
  Sparkles,
  Smartphone,
  Sliders,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { sensorsService, CompassData } from '../../../services/sensorsService';
import { toPersianDigits } from '../../../utils/musicUtils';

const { width } = Dimensions.get('window');
const PROTRACTOR_RADIUS = Math.min((width - 40) / 2, 160);

export const ProtractorScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [activeTab, setActiveTab] = useState<'screen' | 'sensor'>('screen');

  // Screen Protractor State
  const [angle, setAngle] = useState<number>(45);

  // Sensor / Inclinometer State
  const [sensorAngle, setSensorAngle] = useState<number>(0);
  const [isSensorLocked, setIsSensorLocked] = useState<boolean>(false);

  useEffect(() => {
    if (activeTab === 'sensor') {
      sensorsService.startCompass();
      const sub = sensorsService.onCompassUpdate((data: CompassData) => {
        if (!isSensorLocked) {
          // Calculate surface inclination from pitch/roll
          const pitch = Math.abs(data.pitch);
          const roll = Math.abs(data.roll);
          const maxTilt = Math.max(pitch, roll);
          setSensorAngle(Math.round(maxTilt * 10) / 10);
        }
      });

      return () => {
        sub.remove();
        sensorsService.stopCompass();
      };
    }
  }, [activeTab, isSensorLocked]);

  // Touch gesture handler for protractor needle
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const { locationX, locationY } = evt.nativeEvent;
        const centerX = PROTRACTOR_RADIUS;
        const centerY = PROTRACTOR_RADIUS;

        const dx = locationX - centerX;
        const dy = centerY - locationY; // Invert Y so up is positive

        let rad = Math.atan2(dy, dx);
        let deg = (rad * 180) / Math.PI;
        if (deg < 0) deg = 0;
        if (deg > 180) deg = 180;

        setAngle(Math.round(deg));
      },
    })
  ).current;

  // Derived math angles
  const complementaryAngle = Math.max(0, 90 - angle);
  const supplementaryAngle = Math.max(0, 180 - angle);
  const radians = ((angle * Math.PI) / 180).toFixed(3);

  // Needle angle rotation (starts at horizontal right 0 deg, counterclockwise up to 180 deg)
  const needleRotation = `${-angle}deg`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowRight size={22} color="#1e293b" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>نقاله و زاویه‌سنج هوشمند</Text>
            <Text style={styles.headerSubtitle}>اندازه‌گیری زوایا روی صفحه یا با شیب دستگاه</Text>
          </View>
        </View>

        {/* Mode Selector Tabs */}
        <View style={styles.modeTabsRow}>
          <TouchableOpacity
            style={[styles.modeTab, activeTab === 'screen' && styles.modeTabActive]}
            onPress={() => setActiveTab('screen')}
          >
            <Sliders size={16} color={activeTab === 'screen' ? '#6366f1' : '#64748b'} />
            <Text style={[styles.modeTabText, activeTab === 'screen' && styles.modeTabTextActive]}>
              نقاله لمسی (۱۸۰ درجه)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, activeTab === 'sensor' && styles.modeTabActive]}
            onPress={() => setActiveTab('sensor')}
          >
            <Smartphone size={16} color={activeTab === 'sensor' ? '#6366f1' : '#64748b'} />
            <Text style={[styles.modeTabText, activeTab === 'sensor' && styles.modeTabTextActive]}>
              زاویه‌سنج فیزیکی (شیب)
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'screen' ? (
            /* Virtual Protractor Mode */
            <View style={styles.screenProtractorWrap}>
              {/* Digital Angle Big Banner */}
              <View style={styles.angleBanner}>
                <Text style={styles.angleBannerNumber}>
                  {toPersianDigits(angle)}°
                </Text>
                <Text style={styles.angleBannerSub}>
                  {angle < 90 ? 'زاویه تند (حاده)' : angle === 90 ? 'زاویه راست (قائمه)' : 'زاویه باز (منفرجه)'}
                </Text>
              </View>

              {/* Interactive Protractor View */}
              <View
                style={[
                  styles.protractorArc,
                  { width: PROTRACTOR_RADIUS * 2, height: PROTRACTOR_RADIUS + 30 },
                ]}
                {...panResponder.panHandlers}
              >
                {/* Degree tick marks on semi-circle */}
                {[0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180].map(deg => {
                  const rad = (deg * Math.PI) / 180;
                  const x = PROTRACTOR_RADIUS + (PROTRACTOR_RADIUS - 20) * Math.cos(rad);
                  const y = PROTRACTOR_RADIUS - (PROTRACTOR_RADIUS - 20) * Math.sin(rad);

                  return (
                    <Text
                      key={deg}
                      style={[
                        styles.tickLabel,
                        {
                          left: x - 12,
                          top: y - 8,
                        },
                      ]}
                    >
                      {toPersianDigits(deg)}
                    </Text>
                  );
                })}

                {/* Base Horizontal Line */}
                <View
                  style={[
                    styles.baseLine,
                    {
                      width: PROTRACTOR_RADIUS * 2,
                      top: PROTRACTOR_RADIUS,
                    },
                  ]}
                />

                {/* Moving Needle */}
                <View
                  style={[
                    styles.needleContainer,
                    {
                      width: PROTRACTOR_RADIUS * 2,
                      top: PROTRACTOR_RADIUS,
                      transform: [{ rotate: needleRotation }],
                    },
                  ]}
                >
                  <View style={[styles.needleBody, { width: PROTRACTOR_RADIUS - 10 }]} />
                </View>

                {/* Center Pivot Point */}
                <View
                  style={[
                    styles.centerPivot,
                    {
                      left: PROTRACTOR_RADIUS - 10,
                      top: PROTRACTOR_RADIUS - 10,
                    },
                  ]}
                />
              </View>

              <Text style={styles.dragHint}>
                روی لبه نقاله لمس کرده و انگشت خود را بکشید تا زاویه تغییر کند
              </Text>

              {/* Quick Preset Buttons */}
              <View style={styles.presetsRow}>
                {[30, 45, 60, 90, 120, 180].map(val => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.presetBtn, angle === val && styles.presetBtnActive]}
                    onPress={() => setAngle(val)}
                  >
                    <Text
                      style={[
                        styles.presetBtnText,
                        angle === val && styles.presetBtnTextActive,
                      ]}
                    >
                      {toPersianDigits(val)}°
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Math Angles Analysis Grid */}
              <View style={styles.mathGrid}>
                <View style={styles.mathCard}>
                  <Text style={styles.mathCardLabel}>زاویه متمم (تا ۹۰°)</Text>
                  <Text style={styles.mathCardValue}>
                    {toPersianDigits(complementaryAngle)}°
                  </Text>
                </View>

                <View style={styles.mathCard}>
                  <Text style={styles.mathCardLabel}>زاویه مکمل (تا ۱۸۰°)</Text>
                  <Text style={styles.mathCardValue}>
                    {toPersianDigits(supplementaryAngle)}°
                  </Text>
                </View>

                <View style={styles.mathCard}>
                  <Text style={styles.mathCardLabel}>مقدار بر حسب رادیان</Text>
                  <Text style={styles.mathCardValue}>
                    {toPersianDigits(radians)} rad
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            /* Physical Inclinometer Mode */
            <View style={styles.sensorModeWrap}>
              <View style={styles.sensorAngleBox}>
                <Text style={styles.sensorAngleNumber}>
                  {toPersianDigits(sensorAngle)}°
                </Text>
                <Text style={styles.sensorAngleSub}>
                  زاویه شیب نسبت به سطح افق
                </Text>
              </View>

              {/* Visual Tilt Representation */}
              <View style={styles.tiltVisualBox}>
                <View
                  style={[
                    styles.tiltPhoneBar,
                    { transform: [{ rotate: `${-sensorAngle}deg` }] },
                  ]}
                >
                  <Smartphone size={28} color="#ffffff" />
                  <Text style={styles.tiltBarText}>لبه دستگاه</Text>
                </View>
                <View style={styles.horizontalSurfaceLine} />
              </View>

              <Text style={styles.sensorInstruction}>
                لبه پایینی یا کناری گوشی را روی سطح میز، تخته، شیب یا کتاب قرار دهید تا زاویه آن به دقت اندازه‌گیری شود.
              </Text>

              {/* Lock / Freeze Button */}
              <TouchableOpacity
                style={[
                  styles.lockButton,
                  isSensorLocked ? styles.lockButtonActive : styles.lockButtonNormal,
                ]}
                onPress={() => setIsSensorLocked(prev => !prev)}
              >
                {isSensorLocked ? (
                  <>
                    <Unlock size={18} color="#ffffff" />
                    <Text style={styles.lockButtonText}>بازگشایی و ادامه سنجش</Text>
                  </>
                ) : (
                  <>
                    <Lock size={18} color="#ffffff" />
                    <Text style={styles.lockButtonText}>ثابت نگه داشتن زاویه (Freeze)</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
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
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'flex-end',
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'right',
  },
  modeTabsRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modeTabActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  modeTabTextActive: {
    color: '#6366f1',
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  screenProtractorWrap: {
    width: '100%',
    alignItems: 'center',
  },
  angleBanner: {
    alignItems: 'center',
    marginBottom: 20,
  },
  angleBannerNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  angleBannerSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  protractorArc: {
    borderTopLeftRadius: PROTRACTOR_RADIUS,
    borderTopRightRadius: PROTRACTOR_RADIUS,
    borderWidth: 4,
    borderColor: '#6366f1',
    borderBottomWidth: 0,
    backgroundColor: '#ffffff',
    position: 'relative',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  tickLabel: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
  },
  baseLine: {
    position: 'absolute',
    left: 0,
    height: 3,
    backgroundColor: '#0f172a',
  },
  needleContainer: {
    position: 'absolute',
    left: 0,
    height: 4,
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 5,
  },
  needleBody: {
    height: 4,
    backgroundColor: '#ef4444',
    borderRadius: 2,
  },
  centerPivot: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 3,
    borderColor: '#ffffff',
    zIndex: 10,
  },
  dragHint: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 16,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  presetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  presetBtnActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  presetBtnTextActive: {
    color: '#ffffff',
  },
  mathGrid: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  mathCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mathCardLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
    textAlign: 'center',
  },
  mathCardValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  sensorModeWrap: {
    width: '100%',
    alignItems: 'center',
  },
  sensorAngleBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sensorAngleNumber: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  sensorAngleSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  tiltVisualBox: {
    width: 220,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  tiltPhoneBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0284c7',
    borderRadius: 14,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tiltBarText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  horizontalSurfaceLine: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    height: 2,
    backgroundColor: '#cbd5e1',
  },
  sensorInstruction: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  lockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 48,
    borderRadius: 14,
  },
  lockButtonNormal: {
    backgroundColor: '#0284c7',
  },
  lockButtonActive: {
    backgroundColor: '#059669',
  },
  lockButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
