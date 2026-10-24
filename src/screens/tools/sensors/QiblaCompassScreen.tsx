import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
  ScrollView,
  TextInput,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  Compass as CompassIcon,
  MapPin,
  CheckCircle,
  HelpCircle,
  Search,
  Check,
  RotateCw,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import {
  sensorsService,
  CompassData,
  calculateQibla,
  IRAN_CITIES,
  CityLocation,
} from '../../../services/sensorsService';
import { toPersianDigits } from '../../../utils/musicUtils';

const { width } = Dimensions.get('window');
const DIAL_SIZE = Math.min(width * 0.78, 310);

export const QiblaCompassScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [selectedCity, setSelectedCity] = useState<CityLocation>(IRAN_CITIES[0]); // تهران
  const [heading, setHeading] = useState<number>(0);
  const [pitch, setPitch] = useState<number>(0);
  const [roll, setRoll] = useState<number>(0);
  const [isCityModalVisible, setIsCityModalVisible] = useState<boolean>(false);
  const [searchCityQuery, setSearchCityQuery] = useState<string>('');
  const [isCalibrated, setIsCalibrated] = useState<boolean>(true);

  // Qibla calculation for selected city
  const qiblaInfo = calculateQibla(selectedCity.lat, selectedCity.lon);
  const qiblaBearing = qiblaInfo.bearing;

  // Bearing diff: how many degrees device is away from Qibla
  // When difference is within +/- 3 degrees, user is facing Qibla!
  const diffFromQibla = Math.abs(((heading - qiblaBearing + 540) % 360) - 180);
  const isFacingQibla = diffFromQibla <= 3.5;

  const prevFacingQibla = useRef(false);
  useEffect(() => {
    if (isFacingQibla && !prevFacingQibla.current) {
      try {
        Vibration.vibrate([0, 70, 50, 70]);
      } catch {}
    }
    prevFacingQibla.current = isFacingQibla;
  }, [isFacingQibla]);

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

  // Filter cities for search
  const filteredCities = IRAN_CITIES.filter(
    c => c.name.includes(searchCityQuery) || c.province.includes(searchCityQuery)
  );

  // Rotation of compass dial: rotates counter to heading so North stays pointing North
  const dialRotation = `${-heading}deg`;
  // Kaaba pointer angle relative to phone's top
  const kaabaRelativeAngle = `${(qiblaBearing - heading + 360) % 360}deg`;

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
            <Text style={styles.headerTitle}>قبله‌نمای دقیق</Text>
            <Text style={styles.headerSubtitle}>محاسبه دقیق زاویه قبله و مکه مکرمه</Text>
          </View>

          {/* City selector badge */}
          <TouchableOpacity
            style={styles.citySelectorBtn}
            onPress={() => setIsCityModalVisible(true)}
          >
            <MapPin size={15} color="#059669" />
            <Text style={styles.citySelectorText}>{selectedCity.name}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Target Status Banner */}
          <View
            style={[
              styles.targetBanner,
              isFacingQibla ? styles.targetBannerActive : styles.targetBannerInactive,
            ]}
          >
            {isFacingQibla ? (
              <CheckCircle size={20} color="#059669" />
            ) : (
              <RotateCw size={18} color="#64748b" />
            )}
            <Text
              style={[
                styles.targetBannerText,
                isFacingQibla && { color: '#059669', fontWeight: 'bold' },
              ]}
            >
              {isFacingQibla
                ? 'شما دقیقاً روبه‌روی قبله هستید'
                : `گوشی را بچرخانید تا نشانگر سبز شود (${toPersianDigits(Math.round(diffFromQibla))}° اختلاف)`}
            </Text>
          </View>

          {/* Compass Dial Area */}
          <View style={styles.compassWrapper}>
            {/* Outer Glow Ring */}
            <View
              style={[
                styles.outerGlowRing,
                isFacingQibla && styles.outerGlowRingActive,
              ]}
            >
              {/* Rotating Dial */}
              <View style={[styles.compassDial, { transform: [{ rotate: dialRotation }] }]}>
                {/* Degree tick marks */}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => {
                  const isCardinal = deg % 90 === 0;
                  return (
                    <View
                      key={deg}
                      style={[
                        styles.tickMarkWrap,
                        { transform: [{ rotate: `${deg}deg` }] },
                      ]}
                    >
                      <View
                        style={[
                          styles.tickMark,
                          isCardinal && styles.tickMarkCardinal,
                        ]}
                      />
                    </View>
                  );
                })}

                {/* Cardinal Labels */}
                <Text style={[styles.cardinalLabel, styles.cardinalN]}>شمال</Text>
                <Text style={[styles.cardinalLabel, styles.cardinalE]}>شرق</Text>
                <Text style={[styles.cardinalLabel, styles.cardinalS]}>جنوب</Text>
                <Text style={[styles.cardinalLabel, styles.cardinalW]}>غرب</Text>

                {/* Kaaba Direction Icon on the dial */}
                <View
                  style={[
                    styles.kaabaDialMarkerWrap,
                    { transform: [{ rotate: `${qiblaBearing}deg` }] },
                  ]}
                >
                  <View style={styles.kaabaIcon}>
                    <Text style={styles.kaabaIconText}>🕋</Text>
                  </View>
                </View>
              </View>

              {/* Kaaba Arrow Needle pointing from center */}
              <View
                style={[
                  styles.kaabaNeedleContainer,
                  { transform: [{ rotate: kaabaRelativeAngle }] },
                ]}
              >
                <View
                  style={[
                    styles.kaabaNeedle,
                    isFacingQibla && styles.kaabaNeedleActive,
                  ]}
                />
              </View>

              {/* Center Pin */}
              <View style={[styles.centerPin, isFacingQibla && styles.centerPinActive]} />
            </View>
          </View>

          {/* Digital Degrees Display */}
          <View style={styles.degreeBox}>
            <Text style={styles.currentDegreeText}>
              {toPersianDigits(Math.round(heading))}°
            </Text>
            <Text style={styles.degreeSubText}>جهت کنونی دستگاه</Text>
          </View>

          {/* Info Cards Grid */}
          <View style={styles.infoCardsRow}>
            <View style={styles.infoCard}>
              <Text style={styles.infoCardLabel}>زاویه قبله {selectedCity.name}</Text>
              <Text style={styles.infoCardValue}>
                {toPersianDigits(qiblaBearing)}°
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoCardLabel}>فاصله تا کعبه</Text>
              <Text style={styles.infoCardValue}>
                {toPersianDigits(qiblaInfo.distanceKm)} کیلومتر
              </Text>
            </View>
          </View>

          {/* Calibration Notice */}
          <View style={styles.calibNotice}>
            <HelpCircle size={16} color="#0284c7" />
            <Text style={styles.calibNoticeText}>
              برای دقت بیشتر، گوشی را روی سطح صاف نگه داشته و آن را به شکل عدد ۸ انگلیسی در هوا بچرخانید تا قطب‌نما کالیبره شود.
            </Text>
          </View>
        </ScrollView>

        {/* City Selection Modal */}
        <Modal
          visible={isCityModalVisible}
          animationType="slide"
          onRequestClose={() => setIsCityModalVisible(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalBackBtn}
                onPress={() => setIsCityModalVisible(false)}
              >
                <ArrowRight size={22} color="#1e293b" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>انتخاب شهر برای قبله‌نما</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.searchBox}>
              <Search size={18} color="#94a3b8" style={{ marginLeft: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="جستجوی نام شهر یا استان..."
                placeholderTextColor="#94a3b8"
                value={searchCityQuery}
                onChangeText={setSearchCityQuery}
                textAlign="right"
              />
            </View>

            <ScrollView contentContainerStyle={styles.cityList}>
              {filteredCities.map(city => {
                const isSelected = selectedCity.name === city.name;
                return (
                  <TouchableOpacity
                    key={city.name}
                    style={[styles.cityRow, isSelected && styles.cityRowSelected]}
                    onPress={() => {
                      setSelectedCity(city);
                      setIsCityModalVisible(false);
                    }}
                  >
                    {isSelected && <Check size={18} color="#059669" />}
                    <View style={styles.cityMeta}>
                      <Text style={[styles.cityName, isSelected && styles.cityNameSelected]}>
                        {city.name}
                      </Text>
                      <Text style={styles.cityProvince}>{city.province}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </Modal>
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
  citySelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  citySelectorText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#059669',
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  targetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  targetBannerInactive: {
    backgroundColor: '#f1f5f9',
  },
  targetBannerActive: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  targetBannerText: {
    fontSize: 13,
    color: '#475569',
  },
  compassWrapper: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  outerGlowRing: {
    width: '100%',
    height: '100%',
    borderRadius: DIAL_SIZE / 2,
    backgroundColor: '#ffffff',
    borderWidth: 4,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 6,
  },
  outerGlowRingActive: {
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOpacity: 0.35,
    shadowRadius: 24,
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
  tickMarkWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tickMark: {
    width: 2,
    height: 10,
    backgroundColor: '#cbd5e1',
  },
  tickMarkCardinal: {
    width: 3,
    height: 16,
    backgroundColor: '#0f172a',
  },
  cardinalLabel: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  cardinalN: {
    top: 20,
    color: '#ef4444',
  },
  cardinalE: {
    right: 20,
  },
  cardinalS: {
    bottom: 20,
  },
  cardinalW: {
    left: 20,
  },
  kaabaDialMarkerWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  kaabaIcon: {
    top: 28,
  },
  kaabaIconText: {
    fontSize: 22,
  },
  kaabaNeedleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kaabaNeedle: {
    width: 6,
    height: DIAL_SIZE * 0.38,
    backgroundColor: '#059669',
    borderRadius: 3,
    marginBottom: DIAL_SIZE * 0.38,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  kaabaNeedleActive: {
    backgroundColor: '#10b981',
    width: 8,
  },
  centerPin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 3,
    borderColor: '#ffffff',
    zIndex: 10,
  },
  centerPinActive: {
    backgroundColor: '#10b981',
  },
  degreeBox: {
    alignItems: 'center',
    marginVertical: 12,
  },
  currentDegreeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  degreeSubText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  infoCardsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginVertical: 10,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoCardLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
    textAlign: 'center',
  },
  infoCardValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  calibNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f0f9ff',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  calibNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#0369a1',
    lineHeight: 18,
    textAlign: 'right',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    paddingVertical: 0,
  },
  cityList: {
    padding: 16,
    gap: 8,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cityRowSelected: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  cityMeta: {
    alignItems: 'flex-end',
  },
  cityName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  cityNameSelected: {
    color: '#059669',
  },
  cityProvince: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
});
