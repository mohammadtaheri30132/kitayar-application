import React, { useState, useEffect, useRef } from 'react';
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
  Mic,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Info,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { sensorsService, SoundMeterData } from '../../../services/sensorsService';
import { toPersianDigits } from '../../../utils/musicUtils';

const { width } = Dimensions.get('window');
const GAUGE_SIZE = Math.min(width * 0.72, 270);

export const SoundMeterScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [currentDb, setCurrentDb] = useState<number>(30);
  const [minDb, setMinDb] = useState<number>(30);
  const [maxDb, setMaxDb] = useState<number>(30);
  const [avgDb, setAvgDb] = useState<number>(30);
  const [history, setHistory] = useState<number[]>(Array(24).fill(30));

  useEffect(() => {
    if (isRunning) {
      sensorsService.startSoundMeter(100);
      const sub = sensorsService.onSoundMeterUpdate((data: SoundMeterData) => {
        setCurrentDb(data.db);
        setMinDb(data.min);
        setMaxDb(data.max);
        setAvgDb(data.avg);
        setHistory(prev => [...prev.slice(1), data.db]);
      });

      return () => {
        sub.remove();
        sensorsService.stopSoundMeter();
      };
    } else {
      sensorsService.stopSoundMeter();
    }
  }, [isRunning]);

  const toggleRun = () => {
    setIsRunning(prev => !prev);
  };

  const handleReset = () => {
    sensorsService.stopSoundMeter();
    setMinDb(currentDb);
    setMaxDb(currentDb);
    setAvgDb(currentDb);
    setHistory(Array(24).fill(currentDb));
    if (isRunning) {
      sensorsService.startSoundMeter(100);
    }
  };

  const getDbCategory = (db: number) => {
    if (db < 35) return { title: 'خیلی آرام (نجوا / کتابخانه)', color: '#059669', bg: '#ecfdf5' };
    if (db < 55) return { title: 'آرام و مناسب تمرکز', color: '#0284c7', bg: '#f0f9ff' };
    if (db < 70) return { title: 'صدای طبیعی کلاس درس', color: '#6366f1', bg: '#eef2ff' };
    if (db < 85) return { title: 'پر سر و صدا و همهمه', color: '#f59e0b', bg: '#fef3c7' };
    return { title: 'خطرناک برای شنوایی', color: '#ef4444', bg: '#fee2e2' };
  };

  const cat = getDbCategory(currentDb);
  const gaugePercent = Math.min(100, Math.max(0, ((currentDb - 20) / (100 - 20)) * 100));
  // Needle angle from -120deg to +120deg
  const needleAngle = `${(gaugePercent / 100) * 240 - 120}deg`;

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
            <Text style={styles.headerTitle}>صداسنج و دسی‌بل‌متر</Text>
            <Text style={styles.headerSubtitle}>اندازه‌گیری شدت صوت محیط کلاس و مدرسه</Text>
          </View>

          <View style={styles.headerBadge}>
            <Mic size={20} color="#ec4899" />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Status Alert Banner */}
          <View style={[styles.statusBanner, { backgroundColor: cat.bg }]}>
            <Text style={[styles.statusBannerText, { color: cat.color }]}>
              {cat.title}
            </Text>
          </View>

          {/* Large Gauge */}
          <View style={styles.gaugeContainer}>
            <View style={styles.gaugeOuter}>
              {/* Semi-circle dial background */}
              <View style={styles.dialArcTrack} />

              {/* Needle */}
              <View style={[styles.needleWrap, { transform: [{ rotate: needleAngle }] }]}>
                <View style={[styles.needleArm, { backgroundColor: cat.color }]} />
              </View>

              <View style={styles.needlePivot} />

              {/* Digital Readout */}
              <View style={styles.digitalReadout}>
                <Text style={[styles.digitalDbNumber, { color: cat.color }]}>
                  {toPersianDigits(Math.round(currentDb))}
                </Text>
                <Text style={styles.digitalDbUnit}>dB (دسی‌بل)</Text>
              </View>
            </View>
          </View>

          {/* Live Waveform Spectrum */}
          <View style={styles.spectrumCard}>
            <Text style={styles.spectrumTitle}>نمودار زنده شدت صوت</Text>
            <View style={styles.barsRow}>
              {history.map((val, idx) => {
                const barHeight = Math.max(6, Math.min(60, (val / 100) * 60));
                return (
                  <View key={idx} style={styles.barSlot}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: barHeight,
                          backgroundColor: val > 75 ? '#ef4444' : val > 60 ? '#f59e0b' : '#6366f1',
                        },
                      ]}
                    />
                  </View>
                );
              })}
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statCardLabel}>حداقل (Min)</Text>
              <Text style={styles.statCardValue}>
                {toPersianDigits(Math.round(minDb))} dB
              </Text>
            </View>

            <View style={[styles.statCard, { borderColor: '#6366f1' }]}>
              <Text style={styles.statCardLabel}>میانگین (Avg)</Text>
              <Text style={[styles.statCardValue, { color: '#6366f1' }]}>
                {toPersianDigits(Math.round(avgDb))} dB
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statCardLabel}>حداکثر (Max)</Text>
              <Text style={styles.statCardValue}>
                {toPersianDigits(Math.round(maxDb))} dB
              </Text>
            </View>
          </View>

          {/* Primary Action Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <RotateCcw size={18} color="#64748b" />
              <Text style={styles.resetBtnText}>شروع مجدد</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, isRunning ? styles.pauseBtn : styles.startBtn]}
              onPress={toggleRun}
            >
              {isRunning ? (
                <>
                  <Pause size={18} color="#ffffff" />
                  <Text style={styles.toggleBtnText}>توقف موقت</Text>
                </>
              ) : (
                <>
                  <Play size={18} color="#ffffff" />
                  <Text style={styles.toggleBtnText}>ادامه سنجش</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Noise Standards Reference */}
          <View style={styles.standardsCard}>
            <View style={styles.standardsHeader}>
              <Info size={16} color="#475569" />
              <Text style={styles.standardsTitle}>راهنمای استاندارد شدت صوت</Text>
            </View>
            <View style={styles.standardItem}>
              <View style={[styles.standardDot, { backgroundColor: '#059669' }]} />
              <Text style={styles.standardItemText}>۳۰ تا ۵۰ دسی‌بل: ایده‌آل برای مطالعه و کلاس درس</Text>
            </View>
            <View style={styles.standardItem}>
              <View style={[styles.standardDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.standardItemText}>۶۵ تا ۷۵ دسی‌بل: همهمه دانش‌آموزان و زنگ تفریح</Text>
            </View>
            <View style={styles.standardItem}>
              <View style={[styles.standardDot, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.standardItemText}>بالاتر از ۸۵ دسی‌بل: آستانه آسیب به شنوایی</Text>
            </View>
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
    backgroundColor: '#fce7f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  statusBanner: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusBannerText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  gaugeContainer: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  gaugeOuter: {
    width: '100%',
    height: '100%',
    borderRadius: GAUGE_SIZE / 2,
    backgroundColor: '#ffffff',
    borderWidth: 4,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    position: 'relative',
  },
  dialArcTrack: {
    position: 'absolute',
    width: GAUGE_SIZE * 0.82,
    height: GAUGE_SIZE * 0.82,
    borderRadius: (GAUGE_SIZE * 0.82) / 2,
    borderWidth: 8,
    borderColor: '#f1f5f9',
  },
  needleWrap: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  needleArm: {
    width: 4,
    height: GAUGE_SIZE * 0.36,
    marginBottom: GAUGE_SIZE * 0.36,
    borderRadius: 2,
  },
  needlePivot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0f172a',
    borderWidth: 3,
    borderColor: '#ffffff',
    zIndex: 5,
  },
  digitalReadout: {
    position: 'absolute',
    bottom: 24,
    alignItems: 'center',
  },
  digitalDbNumber: {
    fontSize: 34,
    fontWeight: 'bold',
  },
  digitalDbUnit: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  spectrumCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  spectrumTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'right',
    marginBottom: 12,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: 4,
  },
  barSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barFill: {
    width: '70%',
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statCardLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  statCardValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 20,
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
    fontSize: 13,
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
  standardsCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  standardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  standardsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  standardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
  },
  standardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  standardItemText: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'right',
  },
});
