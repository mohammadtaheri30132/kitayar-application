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
  Sun,
  SunMedium,
  Moon,
  RotateCcw,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { sensorsService, LightData } from '../../../services/sensorsService';
import { toPersianDigits } from '../../../utils/musicUtils';

const { width } = Dimensions.get('window');
const METER_SIZE = Math.min(width * 0.72, 270);

export const LightMeterScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [lux, setLux] = useState<number>(350);
  const [minLux, setMinLux] = useState<number>(350);
  const [maxLux, setMaxLux] = useState<number>(350);
  const [luxSum, setLuxSum] = useState<number>(350);
  const [count, setCount] = useState<number>(1);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);

  useEffect(() => {
    sensorsService.isLightSensorAvailable().then(avail => {
      setIsAvailable(avail);
    });

    sensorsService.startLightSensor();
    const sub = sensorsService.onLightUpdate((data: LightData) => {
      const val = data.lux;
      setLux(val);
      setMinLux(prev => Math.min(prev, val));
      setMaxLux(prev => Math.max(prev, val));
      setLuxSum(prev => prev + val);
      setCount(prev => prev + 1);
    });

    return () => {
      sub.remove();
      sensorsService.stopLightSensor();
    };
  }, []);

  const handleReset = () => {
    setMinLux(lux);
    setMaxLux(lux);
    setLuxSum(lux);
    setCount(1);
  };

  const avgLux = Math.round(luxSum / count);
  const footCandles = Math.round((lux / 10.764) * 10) / 10;

  const getLightingState = (l: number) => {
    if (l < 50) return { title: 'محیط بسیار کم‌نور / تاریک', color: '#64748b', bg: '#f1f5f9' };
    if (l < 250) return { title: 'نور کم (نامناسب برای مطالعه طولانی)', color: '#f59e0b', bg: '#fef3c7' };
    if (l <= 750) return { title: 'ایده‌آل برای کلاس درس و مطالعه', color: '#10b981', bg: '#ecfdf5' };
    if (l <= 2000) return { title: 'محیط پرنور و درخشان', color: '#0284c7', bg: '#f0f9ff' };
    return { title: 'تابش مستقیم خورشید', color: '#f97316', bg: '#fff7ed' };
  };

  const state = getLightingState(lux);
  const meterProgress = Math.min(100, Math.max(0, (Math.log10(Math.max(1, lux)) / 4) * 100));

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
            <Text style={styles.headerTitle}>نورسنج و لوکس‌متر</Text>
            <Text style={styles.headerSubtitle}>سنجش میزان روشنایی کلاس و محیط آموزش</Text>
          </View>

          <View style={styles.headerBadge}>
            <Sun size={20} color="#f59e0b" />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {!isAvailable && (
            <View style={styles.warningBanner}>
              <AlertCircle size={18} color="#f59e0b" />
              <Text style={styles.warningText}>
                سنسور سخت‌افزاری نور در این دستگاه شناسایی نشد؛ مقادیر به صورت تخمینی نمایش داده می‌شوند.
              </Text>
            </View>
          )}

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: state.bg }]}>
            <Text style={[styles.statusText, { color: state.color }]}>
              {state.title}
            </Text>
          </View>

          {/* Main Lux Display Circle */}
          <View style={styles.circleContainer}>
            <View style={styles.circleOuter}>
              <View style={[styles.glowBackground, { opacity: Math.min(1, Math.max(0.2, lux / 1000)) }]} />

              <SunMedium size={36} color={state.color} style={{ marginBottom: 6 }} />
              <Text style={styles.luxNumber}>
                {toPersianDigits(Math.round(lux))}
              </Text>
              <Text style={styles.luxUnit}>Lux (لوکس)</Text>
              <Text style={styles.fcUnit}>
                {toPersianDigits(footCandles)} فوت‌کندل (fc)
              </Text>
            </View>
          </View>

          {/* Stats 3 Cards */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>حداقل (Min)</Text>
              <Text style={styles.statValue}>
                {toPersianDigits(Math.round(minLux))} lx
              </Text>
            </View>

            <View style={[styles.statCard, { borderColor: '#f59e0b' }]}>
              <Text style={styles.statLabel}>میانگین (Avg)</Text>
              <Text style={[styles.statValue, { color: '#f59e0b' }]}>
                {toPersianDigits(avgLux)} lx
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>حداکثر (Max)</Text>
              <Text style={styles.statValue}>
                {toPersianDigits(Math.round(maxLux))} lx
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <RotateCcw size={16} color="#64748b" />
            <Text style={styles.resetBtnText}>تنظیم مجدد آمار</Text>
          </TouchableOpacity>

          {/* Classroom Standards Guide */}
          <View style={styles.guideCard}>
            <View style={styles.guideHeader}>
              <Info size={16} color="#1e293b" />
              <Text style={styles.guideTitle}>استاندارد روشنایی مدارس</Text>
            </View>

            <View style={styles.guideItem}>
              <CheckCircle2 size={16} color="#10b981" />
              <Text style={styles.guideItemText}>
                <Text style={{ fontWeight: 'bold' }}>۳۰۰ تا ۵۰۰ لوکس:</Text> استاندارد روشنایی میز تحریر، کلاس درس و مطالعه
              </Text>
            </View>

            <View style={styles.guideItem}>
              <CheckCircle2 size={16} color="#0284c7" />
              <Text style={styles.guideItemText}>
                <Text style={{ fontWeight: 'bold' }}>۵۰۰ تا ۷۵۰ لوکس:</Text> کارگاه‌های نقشه کشی، آزمایشگاه علوم و کار با کامپیوتر
              </Text>
            </View>

            <View style={styles.guideItem}>
              <CheckCircle2 size={16} color="#f59e0b" />
              <Text style={styles.guideItemText}>
                <Text style={{ fontWeight: 'bold' }}>۱۵۰ تا ۳۰۰ لوکس:</Text> راهروها، سالن ورزشی و سالن غذاخوری
              </Text>
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
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#b45309',
    textAlign: 'right',
    lineHeight: 18,
  },
  statusBadge: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  circleContainer: {
    width: METER_SIZE,
    height: METER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  circleOuter: {
    width: '100%',
    height: '100%',
    borderRadius: METER_SIZE / 2,
    backgroundColor: '#ffffff',
    borderWidth: 4,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  glowBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fef3c7',
  },
  luxNumber: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  luxUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  fcUnit: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 14,
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
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    marginBottom: 20,
  },
  resetBtnText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  guideCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    justifyContent: 'flex-end',
  },
  guideItemText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    lineHeight: 20,
    textAlign: 'right',
  },
});
