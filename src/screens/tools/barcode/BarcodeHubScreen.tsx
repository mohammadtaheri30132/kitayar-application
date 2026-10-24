import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  ScanLine,
  QrCode,
  Barcode as BarcodeIcon,
  Sparkles,
  Wifi,
  ExternalLink,
  ChevronLeft,
  CheckCircle2,
  Info,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export const BarcodeHubScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowRight size={22} color="#1e293b" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>بارکدخوان و بارکدساز</Text>
            <Text style={styles.headerSubtitle}>ابزار جامع اسکن و ساخت انواع کدهای QR و بارکد</Text>
          </View>

          <View style={styles.headerBadge}>
            <QrCode size={20} color="#0284c7" />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Main Action Cards */}
          <View style={styles.cardsContainer}>
            {/* 1. Barcode Scanner Card */}
            <TouchableOpacity
              style={[styles.featureCard, styles.scannerCard]}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('BarcodeScannerScreen')}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconCircle, { backgroundColor: '#e0f2fe' }]}>
                  <ScanLine size={28} color="#0284c7" />
                </View>
                <View style={styles.cardBadge}>
                  <Text style={[styles.cardBadgeText, { color: '#0284c7' }]}>اسکن آنی</Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>بارکدخوان و اسکنر هوشمند</Text>
              <Text style={styles.cardDescription}>
                اسکن فوری انواع QR کد و بارکدهای میله‌ای کالا با دوربین یا گالری، تشخیص هوشمند پیوند، وای‌فای، شماره و متن همراه با امکان باز کردن مستقیم و کپی.
              </Text>

              <View style={styles.cardButtonRow}>
                <View style={[styles.actionButton, { backgroundColor: '#0284c7' }]}>
                  <Text style={styles.actionButtonText}>باز کردن دوربین و اسکن</Text>
                  <ChevronLeft size={16} color="#ffffff" />
                </View>
              </View>
            </TouchableOpacity>

            {/* 2. Barcode Generator Card */}
            <TouchableOpacity
              style={[styles.featureCard, styles.generatorCard]}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('BarcodeGeneratorScreen')}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconCircle, { backgroundColor: '#f3e8ff' }]}>
                  <QrCode size={28} color="#7c3aed" />
                </View>
                <View style={[styles.cardBadge, { backgroundColor: '#f3e8ff' }]}>
                  <Text style={[styles.cardBadgeText, { color: '#7c3aed' }]}>تولید گرافیکی</Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>بارکدساز و ساخت QR کد</Text>
              <Text style={styles.cardDescription}>
                ساخت آسان انواع QR کد متنی، لینک آزمون‌ها و جزوات، اتصال وای‌فای و بارکدهای خطی استاندارد (Code 128 و EAN-13) همراه با امکان شخصی‌سازی رنگ و ذخیره در گالری.
              </Text>

              <View style={styles.cardButtonRow}>
                <View style={[styles.actionButton, { backgroundColor: '#7c3aed' }]}>
                  <Text style={styles.actionButtonText}>ساخت بارکد یا QR جدید</Text>
                  <ChevronLeft size={16} color="#ffffff" />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick Educational Guide */}
          <View style={styles.guideCard}>
            <View style={styles.guideHeader}>
              <Sparkles size={18} color="#f59e0b" />
              <Text style={styles.guideTitle}>کاربردهای کلاسی و آموزشی</Text>
            </View>

            <View style={styles.guideItem}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: 2 }} />
              <Text style={styles.guideItemText}>
                <Text style={{ fontWeight: 'bold' }}>دسترسی سریع به تکالیف و آزمون‌ها:</Text> لینک آزمون‌ها یا تمرین‌های آنلاین را به QR تبدیل کرده و روی تخته یا کاربرگ‌ها چاپ کنید.
              </Text>
            </View>

            <View style={styles.guideItem}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: 2 }} />
              <Text style={styles.guideItemText}>
                <Text style={{ fontWeight: 'bold' }}>اشتراک آسان اینترنت مدرسه:</Text> رمز وای‌فای دفتر یا آزمایشگاه را بدون نیاز به تایپ دستی با همکاران به اشتراک بگذارید.
              </Text>
            </View>

            <View style={styles.guideItem}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: 2 }} />
              <Text style={styles.guideItemText}>
                <Text style={{ fontWeight: 'bold' }}>ساماندهی کتب و پرونده‌ها:</Text> بارکدهای میله‌ای برای شماره دانش‌آموزی، پوشه کار یا کتاب‌های کتابخانه کلاس بسازید.
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
  backButton: {
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
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 17,
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
    paddingBottom: 36,
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 20,
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  scannerCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#0284c7',
  },
  generatorCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#7c3aed',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'right',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: 16,
  },
  cardButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  guideCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
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
