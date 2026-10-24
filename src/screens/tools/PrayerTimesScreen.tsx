import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, NativeModules, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sun, Clock, MapPin, ChevronLeft } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';

const { PrayerTimesModule } = NativeModules;

const PrayerTimesScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);

  const openNativePrayerTimes = () => {
    if (Platform.OS === 'android' && PrayerTimesModule?.open) {
      PrayerTimesModule.open()
        .then(() => {
          // در صورت موفقیت، اگر کاربر به صفحه برگشت می‌تواند دوباره دکمه را بزند
        })
        .catch((err: any) => {
          console.warn('Error opening PrayerTimes:', err);
        });
    }
  };

  useEffect(() => {
    openNativePrayerTimes();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>اوقات شرعی ایران</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Sun size={48} color="#0D9488" />
        </View>

        <Text style={styles.title}>اوقات شرعی و اذان ایران</Text>
        <Text style={styles.subtitle}>
          محاسبه ۱۰۰٪ آفلاین بر مبنای استاندارد مؤسسه ژئوفیزیک دانشگاه تهران با پوشش تمام ۳۱ استان و شهرهای ایران
        </Text>

        <TouchableOpacity style={styles.openButton} onPress={openNativePrayerTimes}>
          <Clock size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
          <Text style={styles.openButtonText}>مشاهده و تغییر شهر</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginRight: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D9488',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  openButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default PrayerTimesScreen;
