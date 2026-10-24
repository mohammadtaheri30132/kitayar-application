import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, NativeModules, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Clock, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

const { PrayerTimesModule } = NativeModules;

interface PrayerTimesWidgetProps {
  navigation: any;
}

interface PrayerData {
  cityName: string;
  province: string;
  fajr: string;
  dhuhr: string;
  maghrib: string;
  isha: string;
  nextPrayerName: string;
}

const PrayerTimesWidget: React.FC<PrayerTimesWidgetProps> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const [data, setData] = useState<PrayerData | null>(null);

  const loadPrayerTimes = useCallback(() => {
    if (Platform.OS === 'android' && PrayerTimesModule?.getTodayPrayerTimesForSelectedCity) {
      PrayerTimesModule.getTodayPrayerTimesForSelectedCity()
        .then((res: any) => {
          if (res) {
            setData({
              cityName: res.cityName || 'تهران',
              province: res.province || 'تهران',
              fajr: res.fajr || '۰۴:۴۷',
              dhuhr: res.dhuhr || '۱۱:۵۰',
              maghrib: res.maghrib || '۱۷:۴۷',
              isha: res.isha || '۱۸:۴۱',
              nextPrayerName: res.nextPrayerName || '',
            });
          }
        })
        .catch((err: any) => {
          console.warn('Failed to load prayer times for widget:', err);
        });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPrayerTimes();
    }, [loadPrayerTimes])
  );

  const handlePress = () => {
    navigation.navigate('PrayerTimesScreen');
  };

  if (!data) return null;

  const prayers = [
    { key: 'fajr', title: 'صبح', time: data.fajr, matchName: 'اذان صبح' },
    { key: 'dhuhr', title: 'ظهر', time: data.dhuhr, matchName: 'اذان ظهر' },
    { key: 'maghrib', title: 'مغرب', time: data.maghrib, matchName: 'اذان مغرب' },
    { key: 'isha', title: 'عشاء', time: data.isha, matchName: 'اذان عشاء' },
  ];

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderColor: isDark ? colors.border : '#E2E8F0',
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* سربرگ بسیار فشرده و کوچک */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Clock size={13} color="#0D9488" style={{ marginLeft: 4 }} />
          <Text style={[styles.headerCity, { color: colors.text }]}>
            اوقات شرعی • {data.cityName}
          </Text>
        </View>

        <View style={styles.moreGroup}>
          <Text style={styles.moreText}>اطلاعات بیشتر</Text>
          <ChevronLeft size={13} color="#0D9488" />
        </View>
      </View>

      {/* ردیف ۴ وقت درخواستی کاربر: صبح، ظهر، مغرب، عشاء */}
      <View
        style={[
          styles.timesRow,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
          },
        ]}
      >
        {prayers.map((item, idx) => {
          const isNext = data.nextPrayerName === item.matchName;
          return (
            <View key={item.key} style={styles.timeCol}>
              {/* نام وقت با فونت بسیار کوچک و محو */}
              <View style={styles.labelWrapper}>
                {isNext && <View style={styles.nextDot} />}
                <Text
                  style={[
                    styles.label,
                    { color: isNext ? '#0D9488' : colors.textLight },
                    isNext && { fontWeight: '700' },
                  ]}
                >
                  {item.title}
                </Text>
              </View>

              {/* ساعت با فونت درشت و برجسته طبق خواسته کاربر */}
              <Text
                style={[
                  styles.timeValue,
                  { color: isNext ? '#0D9488' : colors.text },
                ]}
              >
                {item.time}
              </Text>
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    elevation: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  titleGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  headerCity: {
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: 'IRANSansX',
    marginRight: 6,
    textAlign: 'right',
  },
  moreGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 10.5,
    color: '#0D9488',
    fontWeight: '600',
    marginRight: 2,
    fontFamily: 'IRANSansX',
  },
  timesRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  timeCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 2,
  },
  nextDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#0D9488',
    marginLeft: 3,
  },
  label: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
  },
  timeValue: {
    fontSize: 19,
    fontWeight: '800',
    fontFamily: 'IRANSansX',
    letterSpacing: -0.5,
  },
});

export default PrayerTimesWidget;
