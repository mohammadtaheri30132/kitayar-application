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
  Activity,
  RotateCcw,
  Play,
  Pause,
  AlertTriangle,
  Info,
  Zap,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { sensorsService, SeismicData } from '../../../services/sensorsService';
import { toPersianDigits } from '../../../utils/musicUtils';

const { width } = Dimensions.get('window');
const WAVE_BUFFER_SIZE = 36;

export const SeismographScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [currentMagnitude, setCurrentMagnitude] = useState<number>(0);
  const [peakMagnitude, setPeakMagnitude] = useState<number>(0);
  const [axisX, setAxisX] = useState<number>(0);
  const [axisY, setAxisY] = useState<number>(0);
  const [axisZ, setAxisZ] = useState<number>(0);
  const [waveHistory, setWaveHistory] = useState<number[]>(Array(WAVE_BUFFER_SIZE).fill(0));

  useEffect(() => {
    if (isRunning) {
      sensorsService.startSeismograph();
      const sub = sensorsService.onSeismicUpdate((data: SeismicData) => {
        setAxisX(data.x);
        setAxisY(data.y);
        setAxisZ(data.z);
        setCurrentMagnitude(data.magnitude);
        setPeakMagnitude(data.peak);
        setWaveHistory(prev => [...prev.slice(1), data.magnitude]);
      });

      return () => {
        sub.remove();
        sensorsService.stopSeismograph();
      };
    } else {
      sensorsService.stopSeismograph();
    }
  }, [isRunning]);

  const toggleRun = () => {
    setIsRunning(prev => !prev);
  };

  const handleReset = () => {
    sensorsService.stopSeismograph();
    setCurrentMagnitude(0);
    setPeakMagnitude(0);
    setWaveHistory(Array(WAVE_BUFFER_SIZE).fill(0));
    if (isRunning) {
      sensorsService.startSeismograph();
    }
  };

  const getIntensityScale = (mag: number) => {
    if (mag < 0.6) return { title: 'آرام و بی‌حرکت (وضعیت پایدار)', color: '#059669', bg: '#ecfdf5', level: 'I' };
    if (mag < 2.0) return { title: 'لرزش خفیف (احساس در حالت سکون)', color: '#0284c7', bg: '#f0f9ff', level: 'II-III' };
    if (mag < 4.5) return { title: 'لرزش متوسط (تکان خوردن اشیاء سبک)', color: '#f59e0b', bg: '#fef3c7', level: 'IV-V' };
    return { title: 'شوک و لرزش شدید!', color: '#ef4444', bg: '#fee2e2', level: 'VI+' };
  };

  const intensity = getIntensityScale(currentMagnitude);

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
            <Text style={styles.headerTitle}>لرزه‌نگار و زلزله‌سنج</Text>
            <Text style={styles.headerSubtitle}>سنجش ارتعاشات زمین و امواج لرزه‌ای</Text>
          </View>

          <View style={styles.headerBadge}>
            <Activity size={20} color="#ef4444" />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Intensity Status Banner */}
          <View style={[styles.intensityBanner, { backgroundColor: intensity.bg }]}>
            <Text style={[styles.intensityText, { color: intensity.color }]}>
              {intensity.title}
            </Text>
            <Text style={[styles.mercalliBadge, { color: intensity.color }]}>
              مقیاس مرکالی: {intensity.level}
            </Text>
          </View>

          {/* Real-time Seismogram Waveform Chart */}
          <View style={styles.seismogramCard}>
            <View style={styles.seismogramHeader}>
              <View style={styles.liveIndicator}>
                <View style={[styles.liveDot, !isRunning && { backgroundColor: '#94a3b8' }]} />
                <Text style={styles.liveText}>{isRunning ? 'زنده' : 'متوقف'}</Text>
              </View>
              <Text style={styles.seismogramTitle}>لرزه‌نگاشت آنی (Seismogram)</Text>
            </View>

            {/* Scrolling Wave Bars View */}
            <View style={styles.waveChartBox}>
              <View style={styles.waveZeroLine} />
              <View style={styles.waveBarsRow}>
                {waveHistory.map((val, idx) => {
                  const maxH = 90;
                  const barH = Math.max(4, Math.min(maxH, (val / 6) * maxH));
                  const isHigh = val > 3.0;
                  const isMid = val > 1.2;

                  return (
                    <View key={idx} style={styles.barSlot}>
                      <View
                        style={[
                          styles.waveBar,
                          {
                            height: barH,
                            backgroundColor: isHigh ? '#ef4444' : isMid ? '#f59e0b' : '#0284c7',
                          },
                        ]}
                      />
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.waveScaleLabels}>
              <Text style={styles.waveScaleText}>+۶ m/s²</Text>
              <Text style={styles.waveScaleText}>۰ (ثابت)</Text>
            </View>
          </View>

          {/* Current Magnitude & Peak Card */}
          <View style={styles.magnitudeCard}>
            <View style={styles.magBox}>
              <Text style={styles.magLabel}>شتاب لحظه‌ای (Magnitude)</Text>
              <Text style={[styles.magValue, { color: intensity.color }]}>
                {toPersianDigits(currentMagnitude.toFixed(2))}
                <Text style={styles.magUnit}> m/s²</Text>
              </Text>
            </View>

            <View style={styles.magDivider} />

            <View style={styles.magBox}>
              <Text style={styles.magLabel}>بیشترین شتاب ثبت‌شده (Peak)</Text>
              <Text style={styles.magValue}>
                {toPersianDigits(peakMagnitude.toFixed(2))}
                <Text style={styles.magUnit}> m/s²</Text>
              </Text>
            </View>
          </View>

          {/* 3 Axes Grid: X, Y, Z */}
          <View style={styles.axesGrid}>
            <View style={styles.axisCard}>
              <Text style={styles.axisLabel}>محور X (افقی)</Text>
              <Text style={styles.axisValue}>{toPersianDigits(axisX.toFixed(2))}</Text>
            </View>

            <View style={styles.axisCard}>
              <Text style={styles.axisLabel}>محور Y (عمودی)</Text>
              <Text style={styles.axisValue}>{toPersianDigits(axisY.toFixed(2))}</Text>
            </View>

            <View style={styles.axisCard}>
              <Text style={styles.axisLabel}>محور Z (ارتفاع)</Text>
              <Text style={styles.axisValue}>{toPersianDigits(axisZ.toFixed(2))}</Text>
            </View>
          </View>

          {/* Action Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <RotateCcw size={16} color="#475569" />
              <Text style={styles.resetBtnText}>تنظیم مجدد قله</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, isRunning ? styles.pauseBtn : styles.startBtn]}
              onPress={toggleRun}
            >
              {isRunning ? (
                <>
                  <Pause size={18} color="#ffffff" />
                  <Text style={styles.toggleBtnText}>توقف ثبت</Text>
                </>
              ) : (
                <>
                  <Play size={18} color="#ffffff" />
                  <Text style={styles.toggleBtnText}>شروع مجدد ثبت</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Education Info Card */}
          <View style={styles.eduCard}>
            <View style={styles.eduHeader}>
              <Info size={16} color="#0f172a" />
              <Text style={styles.eduTitle}>آزمایش کلاسی با لرزه‌نگار</Text>
            </View>
            <Text style={styles.eduText}>
              برای شبیه‌سازی زلزله در کلاس علوم یا جغرافیا، گوشی را روی میز قرار دهید و با دست به آرامی روی میز ضربه بزنید تا نحوه انتشار امواج و ثبت توسط شتاب‌سنج را مشاهده کنید.
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
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  intensityBanner: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 4,
  },
  intensityText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  mercalliBadge: {
    fontSize: 11,
    fontWeight: '600',
  },
  seismogramCard: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 4,
  },
  seismogramHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  liveText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  seismogramTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  waveChartBox: {
    height: 120,
    justifyContent: 'center',
    position: 'relative',
  },
  waveZeroLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  waveBarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  barSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  waveBar: {
    width: '65%',
    borderRadius: 2,
  },
  waveScaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 6,
  },
  waveScaleText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  magnitudeCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  magBox: {
    flex: 1,
    alignItems: 'center',
  },
  magDivider: {
    width: 1,
    backgroundColor: '#f1f5f9',
  },
  magLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 6,
    textAlign: 'center',
  },
  magValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  magUnit: {
    fontSize: 12,
    color: '#94a3b8',
  },
  axesGrid: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 16,
  },
  axisCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  axisLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
  },
  axisValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 16,
  },
  resetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  toggleBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: 14,
  },
  startBtn: {
    backgroundColor: '#10b981',
  },
  pauseBtn: {
    backgroundColor: '#0f172a',
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  eduCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  eduHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'flex-end',
  },
  eduTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  eduText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 22,
    textAlign: 'right',
  },
});
