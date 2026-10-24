import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  Compass as CompassIcon,
  HelpCircle,
  Activity,
  CheckCircle2,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { sensorsService, CompassData } from '../../../services/sensorsService';
import { toPersianDigits } from '../../../utils/musicUtils';

const { width } = Dimensions.get('window');
const DIAL_SIZE = Math.min(width * 0.78, 310);
const LEVEL_BOX_SIZE = 120;

export const CompassScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [heading, setHeading] = useState<number>(0);
  const [pitch, setPitch] = useState<number>(0);
  const [roll, setRoll] = useState<number>(0);

  useEffect(() => {
    sensorsService.startCompass();
    const sub = sensorsService.onCompassUpdate((data: CompassData) => {
      setHeading(data.heading);
      setPitch(data.pitch);
      setRoll(data.roll);
    });

    return () => {
      sub.remove();
      sensorsService.stopCompass();
    };
  }, []);

  // Direction string in Persian
  const getDirectionText = (deg: number): string => {
    const d = (deg + 360) % 360;
    if (d >= 337.5 || d < 22.5) return 'شمال (N)';
    if (d >= 22.5 && d < 67.5) return 'شمال شرقی (NE)';
    if (d >= 67.5 && d < 112.5) return 'شرق (E)';
    if (d >= 112.5 && d < 157.5) return 'جنوب شرقی (SE)';
    if (d >= 157.5 && d < 202.5) return 'جنوب (S)';
    if (d >= 202.5 && d < 247.5) return 'جنوب غربی (SW)';
    if (d >= 247.5 && d < 292.5) return 'غرب (W)';
    return 'شمال غربی (NW)';
  };

  const dialRotation = `${-heading}deg`;

  // Level bubble calculation: pitch is Y tilt, roll is X tilt
  const bubbleX = Math.max(-LEVEL_BOX_SIZE / 2 + 12, Math.min(LEVEL_BOX_SIZE / 2 - 12, (roll / 30) * (LEVEL_BOX_SIZE / 2)));
  const bubbleY = Math.max(-LEVEL_BOX_SIZE / 2 + 12, Math.min(LEVEL_BOX_SIZE / 2 - 12, (pitch / 30) * (LEVEL_BOX_SIZE / 2)));
  const isLevel = Math.abs(pitch) < 2.5 && Math.abs(roll) < 2.5;

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
            <Text style={styles.headerTitle}>قطب‌نمای دیجیتال</Text>
            <Text style={styles.headerSubtitle}>جهت‌یابی دقیق همراه با تراز شیب‌سنج</Text>
          </View>

          <View style={styles.headerBadge}>
            <CompassIcon size={20} color="#0284c7" />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Degree & Direction Readout */}
          <View style={styles.headingBox}>
            <Text style={styles.headingDegree}>
              {toPersianDigits(Math.round(heading))}°
            </Text>
            <Text style={styles.headingDirection}>
              {getDirectionText(heading)}
            </Text>
          </View>

          {/* Compass Dial */}
          <View style={styles.compassWrapper}>
            <View style={styles.compassContainer}>
              <View style={[styles.compassDial, { transform: [{ rotate: dialRotation }] }]}>
                {/* Degree ticks */}
                {Array.from({ length: 24 }).map((_, i) => {
                  const deg = i * 15;
                  const isCardinal = deg % 90 === 0;
                  const isSemiCardinal = deg % 45 === 0;
                  return (
                    <View
                      key={deg}
                      style={[
                        styles.tickWrap,
                        { transform: [{ rotate: `${deg}deg` }] },
                      ]}
                    >
                      <View
                        style={[
                          styles.tick,
                          isSemiCardinal && styles.tickSemi,
                          isCardinal && styles.tickMajor,
                        ]}
                      />
                    </View>
                  );
                })}

                {/* Major Cardinal Labels */}
                <Text style={[styles.cardinalTxt, styles.cardinalN]}>N</Text>
                <Text style={[styles.cardinalTxt, styles.cardinalE]}>E</Text>
                <Text style={[styles.cardinalTxt, styles.cardinalS]}>S</Text>
                <Text style={[styles.cardinalTxt, styles.cardinalW]}>W</Text>
              </View>

              {/* Fixed Center Crosshair & Needle */}
              <View style={styles.needlePointer} />
              <View style={styles.dialCenterDot} />
            </View>
          </View>

          {/* Spirit Level / Inclinometer (تراز حبابی) */}
          <View style={styles.levelCard}>
            <View style={styles.levelCardHeader}>
              <View style={styles.levelStatusBadge}>
                {isLevel ? (
                  <CheckCircle2 size={16} color="#10b981" />
                ) : (
                  <Activity size={16} color="#f59e0b" />
                )}
                <Text
                  style={[
                    styles.levelStatusText,
                    isLevel && { color: '#10b981', fontWeight: 'bold' },
                  ]}
                >
                  {isLevel ? 'کاملاً تراز' : 'ناهموار / مایل'}
                </Text>
              </View>
              <Text style={styles.levelTitle}>تراز حبابی سطح (شیب‌سنج)</Text>
            </View>

            <View style={styles.levelBodyRow}>
              {/* Level Circle */}
              <View
                style={[
                  styles.levelBox,
                  isLevel && styles.levelBoxActive,
                ]}
              >
                <View style={styles.levelCrosshairH} />
                <View style={styles.levelCrosshairV} />
                <View style={styles.levelCenterRing} />

                {/* Moving Bubble */}
                <View
                  style={[
                    styles.levelBubble,
                    {
                      transform: [
                        { translateX: bubbleX },
                        { translateY: bubbleY },
                      ],
                    },
                    isLevel && styles.levelBubbleActive,
                  ]}
                />
              </View>

              {/* Angles details */}
              <View style={styles.levelStatsCol}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>شیب طولی (Pitch):</Text>
                  <Text style={styles.statValue}>
                    {toPersianDigits(Math.round(pitch))}°
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>شیب عرضی (Roll):</Text>
                  <Text style={styles.statValue}>
                    {toPersianDigits(Math.round(roll))}°
                  </Text>
                </View>
                <Text style={styles.levelHint}>
                  برای سنجش تراز بودن میز یا سطح، حباب را در مرکز دایره قرار دهید.
                </Text>
              </View>
            </View>
          </View>

          {/* Calibration info */}
          <View style={styles.infoFooter}>
            <HelpCircle size={16} color="#64748b" />
            <Text style={styles.infoFooterText}>
              برای عملکرد صحیح قطب‌نما، دستگاه را از قاب‌های مغناطیسی و قطعات فلزی دور نگه دارید.
            </Text>
          </View>
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
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  headingBox: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headingDegree: {
    fontSize: 44,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headingDirection: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0284c7',
    marginTop: 2,
  },
  compassWrapper: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  compassContainer: {
    width: '100%',
    height: '100%',
    borderRadius: DIAL_SIZE / 2,
    backgroundColor: '#0f172a',
    borderWidth: 6,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  compassDial: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tick: {
    width: 2,
    height: 8,
    backgroundColor: '#475569',
  },
  tickSemi: {
    height: 12,
    backgroundColor: '#94a3b8',
  },
  tickMajor: {
    width: 3,
    height: 16,
    backgroundColor: '#f8fafc',
  },
  cardinalTxt: {
    position: 'absolute',
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  cardinalN: {
    top: 24,
    color: '#ef4444',
  },
  cardinalE: {
    right: 24,
  },
  cardinalS: {
    bottom: 24,
  },
  cardinalW: {
    left: 24,
  },
  needlePointer: {
    position: 'absolute',
    top: 14,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#ef4444',
    zIndex: 10,
  },
  dialCenterDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#0f172a',
    zIndex: 10,
  },
  levelCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  levelCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  levelTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  levelStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  levelStatusText: {
    fontSize: 11,
    color: '#64748b',
  },
  levelBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  levelBox: {
    width: LEVEL_BOX_SIZE,
    height: LEVEL_BOX_SIZE,
    borderRadius: LEVEL_BOX_SIZE / 2,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  levelBoxActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  levelCrosshairH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#cbd5e1',
  },
  levelCrosshairV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#cbd5e1',
  },
  levelCenterRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
  },
  levelBubble: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0284c7',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  levelBubbleActive: {
    backgroundColor: '#10b981',
  },
  levelStatsCol: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  statValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  levelHint: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
    marginTop: 6,
    lineHeight: 18,
  },
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  infoFooterText: {
    flex: 1,
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
    lineHeight: 18,
  },
});
