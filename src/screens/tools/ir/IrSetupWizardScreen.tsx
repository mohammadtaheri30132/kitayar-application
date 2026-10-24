import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { showError, showConfirm } from '../../../components/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  Tv,
  Wind,
  Monitor,
  CheckCircle2,
  AlertCircle,
  Radio,
  ChevronLeft,
  Send,
  Sparkles,
  Search,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  DeviceCategory,
  IrCommand,
  IrProfile,
} from '../../../data/ir/types';
import {
  deviceCategories,
  getProfilesByCategory,
  allProfiles,
} from '../../../data/ir';
import { irService } from '../../../services/irService';

const { width } = Dimensions.get('window');

export const IrSetupWizardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const isSimulationMode = !!route.params?.isSimulationMode;
  const initialCategory: DeviceCategory = route.params?.preselectedCategory || 'projector';

  // Wizard Steps:
  // 1: Category
  // 2: Brand
  // 3: Candidate Profile Selection
  // 4: Test Wizard
  // 5: Name & Save
  const [step, setStep] = useState<number>(route.params?.preselectedCategory ? 2 : 1);
  const [selectedCategory, setSelectedCategory] = useState<DeviceCategory>(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedProfileIndex, setSelectedProfileIndex] = useState<number>(0);
  const [brandSearchQuery, setBrandSearchQuery] = useState<string>('');

  // Test state
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [testResultMsg, setTestResultMsg] = useState<string | null>(null);

  // Save fields
  const [customName, setCustomName] = useState<string>('');
  const [roomName, setRoomName] = useState<string>('کلاس ۱۰۱');

  // Available profiles for current category
  const categoryProfiles = getProfilesByCategory(selectedCategory);

  // Unique brands in this category
  const availableBrands = Array.from(
    new Set(categoryProfiles.map((p) => p.brand))
  );

  // Candidates for selected brand
  const brandProfiles = categoryProfiles.filter(
    (p) => p.brand.toLowerCase() === selectedBrand.toLowerCase()
  );

  const currentProfile: IrProfile | undefined = brandProfiles[selectedProfileIndex] || brandProfiles[0];

  // Pick low risk test command (testPriority = 1, e.g. Mute, Info, Temp Up)
  const getLowRiskTestCommand = (profile: IrProfile): IrCommand => {
    const sorted = [...profile.commands].sort(
      (a, b) => (a.testPriority || 99) - (b.testPriority || 99)
    );
    return sorted[0] || profile.commands[0];
  };

  const handleTransmitTest = async () => {
    if (!currentProfile) return;

    const testCmd = getLowRiskTestCommand(currentProfile);
    setIsTransmitting(true);
    setTestResultMsg(null);

    try {
      const res = await irService.transmitCommand(
        currentProfile,
        testCmd,
        {
          power: true,
          temperature: 24,
          mode: 'cool',
          fanSpeed: 'auto',
          swing: false,
        },
        isSimulationMode
      );

      if (res.success) {
        setTestResultMsg(`سیگنال آزمایشی «${testCmd.label}» با موفقیت ارسال شد.`);
      } else {
        setTestResultMsg(res.errorMessage || 'ارسال سیگنال با خطا مواجه شد.');
      }
    } catch (e: any) {
      setTestResultMsg('خطا در ارسال: ' + (e?.message || 'نامشخص'));
    } finally {
      setTimeout(() => setIsTransmitting(false), 350);
    }
  };

  const handleSaveRemote = async () => {
    if (!currentProfile) return;

    const finalName =
      customName.trim() ||
      `${currentProfile.brand} (${currentProfile.brandFa})`;
    const finalRoom = roomName.trim() || 'کلاس درس';

    try {
      const saved = await irService.saveRemote({
        name: finalName,
        roomName: finalRoom,
        category: selectedCategory,
        brand: currentProfile.brand,
        profileId: currentProfile.id,
      });

      showConfirm({
        title: 'ریموت ذخیره شد',
        message: `ریموت «${finalName}» برای «${finalRoom}» با موفقیت ذخیره شد.`,
        confirmText: 'ورود به ریموت',
        cancelText: 'بستن',
        isDestructive: false,
        icon: CheckCircle2,
        onConfirm: () => {
          navigation.replace('IrRemoteControlScreen', {
            profileId: currentProfile.id,
            savedRemoteId: saved.id,
            remoteName: saved.name,
            roomName: saved.roomName,
            category: selectedCategory,
            isSimulationMode,
          });
        },
      });
    } catch (e) {
      showError('ذخیره‌سازی ریموت انجام نشد.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (step > 1) {
                setStep(step - 1);
              } else {
                navigation.goBack();
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowRight size={22} color="#1e293b" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>راه‌اندازی ریموت جدید</Text>
            <Text style={styles.headerSubtitle}>
              مرحله {step} از ۵:{' '}
              {step === 1
                ? 'انتخاب نوع دستگاه'
                : step === 2
                ? 'انتخاب برند'
                : step === 3
                ? 'انتخاب پروفایل'
                : step === 4
                ? 'تست سیگنال'
                : 'نام‌گذاری و ذخیره'}
            </Text>
          </View>

          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{step}/۵</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* STEP 1: CATEGORY SELECTION */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepPrompt}>دستگاه مورد نظر برای کنترل را انتخاب کنید:</Text>
              <View style={styles.categoryGrid}>
                {deviceCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categorySelectCard,
                      selectedCategory === cat.id && styles.categorySelectCardActive,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => {
                      setSelectedCategory(cat.id);
                      setStep(2);
                    }}
                  >
                    <View
                      style={[
                        styles.catIconBox,
                        { backgroundColor: `${cat.color}15` },
                      ]}
                    >
                      {cat.id === 'projector' && <Tv size={28} color={cat.color} />}
                      {cat.id === 'ac' && <Wind size={28} color={cat.color} />}
                      {cat.id === 'tv' && <Monitor size={28} color={cat.color} />}
                    </View>
                    <Text style={styles.catCardTitle}>{cat.titleFa}</Text>
                    <Text style={styles.catCardDesc}>{cat.subtitleFa}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* STEP 2: BRAND SELECTION */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepPrompt}>برند دستگاه را انتخاب نمایید:</Text>

              {/* Brand Search input */}
              <View style={styles.searchBar}>
                <Search size={18} color="#94a3b8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="جستجوی برند (مثلاً Epson یا Gree)..."
                  placeholderTextColor="#94a3b8"
                  value={brandSearchQuery}
                  onChangeText={setBrandSearchQuery}
                />
              </View>

              <View style={styles.brandsList}>
                {availableBrands
                  .filter((b) =>
                    b.toLowerCase().includes(brandSearchQuery.toLowerCase())
                  )
                  .map((brandName) => {
                    const prof = categoryProfiles.find((p) => p.brand === brandName);
                    const isVerified = prof?.verificationStatus === 'verified';

                    return (
                      <TouchableOpacity
                        key={brandName}
                        style={[
                          styles.brandItemCard,
                          selectedBrand === brandName && styles.brandItemCardActive,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedBrand(brandName);
                          setSelectedProfileIndex(0);
                          setCustomName(
                            `${prof?.brandFa || brandName} ${
                              selectedCategory === 'projector'
                                ? 'پروژکتور'
                                : selectedCategory === 'ac'
                                ? 'اسپلیت'
                                : 'تلویزیون'
                            }`
                          );
                          setStep(3);
                        }}
                      >
                        <View style={styles.brandTextWrap}>
                          <Text style={styles.brandNameText}>{brandName}</Text>
                          {prof?.brandFa && (
                            <Text style={styles.brandFaText}>{prof.brandFa}</Text>
                          )}
                        </View>

                        <View
                          style={[
                            styles.badgePill,
                            {
                              backgroundColor: isVerified ? '#dcfce7' : '#fef3c7',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgePillText,
                              {
                                color: isVerified ? '#15803d' : '#b45309',
                              },
                            ]}
                          >
                            {isVerified ? 'تایید شده ✓' : 'کاندید'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            </View>
          )}

          {/* STEP 3: CANDIDATE PROFILE DETAILS */}
          {step === 3 && currentProfile && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepPrompt}>مشخصات و کدهای سازگار برند {selectedBrand}:</Text>

              <View style={styles.profileDetailCard}>
                <View style={styles.profileDetailHeader}>
                  <Text style={styles.profileDetailTitle}>{currentProfile.modelFamily}</Text>
                  <View
                    style={[
                      styles.badgePill,
                      {
                        backgroundColor:
                          currentProfile.verificationStatus === 'verified'
                            ? '#dcfce7'
                            : '#fef3c7',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgePillText,
                        {
                          color:
                            currentProfile.verificationStatus === 'verified'
                              ? '#15803d'
                              : '#b45309',
                        },
                      ]}
                    >
                      {currentProfile.verificationStatus === 'verified'
                        ? 'تایید شده با سخت‌افزار واقعی ✓'
                        : 'کاندید استاندارد (مرجع معتبر)'}
                    </Text>
                  </View>
                </View>

                <View style={styles.profileMetaRow}>
                  <Text style={styles.profileMetaLabel}>پروتکل فرستنده:</Text>
                  <Text style={styles.profileMetaValue}>
                    {currentProfile.commands[0]?.protocol || 'NEC'} (۳۸ کیلوهرتز)
                  </Text>
                </View>

                <View style={styles.profileMetaRow}>
                  <Text style={styles.profileMetaLabel}>تعداد کلیدهای آماده:</Text>
                  <Text style={styles.profileMetaValue}>
                    {currentProfile.commands.length} کلید عملکردی
                  </Text>
                </View>

                <View style={styles.provenanceBox}>
                  <Text style={styles.provenanceTitle}>منبع و اصالت کدها:</Text>
                  <Text style={styles.provenanceDesc}>{currentProfile.provenance}</Text>
                  <Text style={styles.provenanceNotes}>{currentProfile.testNotes}</Text>
                </View>

                {brandProfiles.length > 1 && (
                  <View style={styles.multipleCandidatesBox}>
                    <Text style={styles.multipleCandidatesTitle}>
                      سایر کاندیدهای موجود برای این برند:
                    </Text>
                    <View style={styles.candidateChipsRow}>
                      {brandProfiles.map((p, idx) => (
                        <TouchableOpacity
                          key={p.id}
                          style={[
                            styles.candidateChip,
                            selectedProfileIndex === idx && styles.candidateChipActive,
                          ]}
                          onPress={() => setSelectedProfileIndex(idx)}
                        >
                          <Text
                            style={[
                              styles.candidateChipText,
                              selectedProfileIndex === idx &&
                                styles.candidateChipTextActive,
                            ]}
                          >
                            کاندید {idx + 1}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.primaryActionButton}
                  activeOpacity={0.88}
                  onPress={() => setStep(4)}
                >
                  <Text style={styles.primaryActionText}>ورود به مرحله آزمایش سیگنال</Text>
                  <ChevronLeft size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 4: SAFE TEST WIZARD */}
          {step === 4 && currentProfile && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepPrompt}>تست سازگاری با دستگاه کلاس:</Text>

              <View style={styles.testCard}>
                <View style={styles.testIconRing}>
                  <Radio size={36} color="#2563eb" />
                </View>

                <Text style={styles.testTitle}>ارسال سیگنال ایمن تستی</Text>
                <Text style={styles.testDesc}>
                  برای جلوگیری از اخلال در کارکرد دستگاه (مانند خاموش شدن پروژکتور در حین ارائه)، از کلید بی‌خطر «
                  {getLowRiskTestCommand(currentProfile).label}» برای بررسی اولیه استفاده می‌شود.
                </Text>

                <TouchableOpacity
                  style={[
                    styles.transmitPulseBtn,
                    isTransmitting && styles.transmitPulseBtnActive,
                  ]}
                  activeOpacity={0.85}
                  onPress={handleTransmitTest}
                  disabled={isTransmitting}
                >
                  <Send size={20} color="#ffffff" />
                  <Text style={styles.transmitPulseBtnText}>
                    {isTransmitting
                      ? 'در حال ارسال پالس مادون قرمز...'
                      : `ارسال فرمان تستی (${getLowRiskTestCommand(currentProfile).label})`}
                  </Text>
                </TouchableOpacity>

                {testResultMsg && (
                  <View style={styles.testResultBox}>
                    <CheckCircle2 size={16} color="#15803d" />
                    <Text style={styles.testResultText}>{testResultMsg}</Text>
                  </View>
                )}

                <View style={styles.questionSection}>
                  <Text style={styles.questionPrompt}>آیا دستگاه واکنش نشان داد؟</Text>
                  <View style={styles.questionButtonsRow}>
                    <TouchableOpacity
                      style={styles.yesButton}
                      activeOpacity={0.85}
                      onPress={() => setStep(5)}
                    >
                      <CheckCircle2 size={18} color="#ffffff" />
                      <Text style={styles.yesButtonText}>بله، پاسخ داد</Text>
                    </TouchableOpacity>

                    {brandProfiles.length > 1 && (
                      <TouchableOpacity
                        style={styles.noNextProfileBtn}
                        activeOpacity={0.85}
                        onPress={() => {
                          const nextIdx = (selectedProfileIndex + 1) % brandProfiles.length;
                          setSelectedProfileIndex(nextIdx);
                          setTestResultMsg(`پروفایل کاندید ${nextIdx + 1} فعال شد. مجدداً تست کنید.`);
                        }}
                      >
                        <Text style={styles.noNextProfileText}>
                          خیر، کاندید بعدی را امتحان کن
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* STEP 5: NAME AND SAVE */}
          {step === 5 && currentProfile && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepPrompt}>نام‌گذاری و ذخیره ریموت برای دسترسی سریع:</Text>

              <View style={styles.saveCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>عنوان ریموت (مثلاً پروژکتور کلاس ۲۰۱):</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="نام ریموت..."
                    placeholderTextColor="#94a3b8"
                    value={customName}
                    onChangeText={setCustomName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>مکان یا نام کلاس:</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="مثلاً کلاس ۲۰۱، آزمایشگاه شیمی، سالن اجتماعات..."
                    placeholderTextColor="#94a3b8"
                    value={roomName}
                    onChangeText={setRoomName}
                  />
                </View>

                <View style={styles.summaryBox}>
                  <Text style={styles.summaryTitle}>خلاصه تنظیمات ریموت:</Text>
                  <Text style={styles.summaryItem}>• دستگاه: {currentProfile.brand} ({currentProfile.brandFa})</Text>
                  <Text style={styles.summaryItem}>• وضعیت: {currentProfile.verificationStatus === 'verified' ? 'تایید شده ✓' : 'کاندید معتبر'}</Text>
                  <Text style={styles.summaryItem}>• پروتکل فرستنده: {currentProfile.commands[0]?.protocol || 'NEC'}</Text>
                  <Text style={styles.summaryItem}>• ذخیره‌سازی: آفلاین در حافظه داخلی کیتایار</Text>
                </View>

                <TouchableOpacity
                  style={styles.saveSubmitButton}
                  activeOpacity={0.88}
                  onPress={handleSaveRemote}
                >
                  <CheckCircle2 size={20} color="#ffffff" />
                  <Text style={styles.saveSubmitText}>ذخیره و ورود به صفحه ریموت</Text>
                </TouchableOpacity>
              </View>
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
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
  stepBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  stepContainer: {
    gap: 16,
  },
  stepPrompt: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    textAlign: 'right',
  },
  // Step 1: Category
  categoryGrid: {
    gap: 12,
  },
  categorySelectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    gap: 8,
  },
  categorySelectCardActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  catIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  catCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  catCardDesc: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  // Step 2: Brands
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    textAlign: 'right',
    padding: 0,
  },
  brandsList: {
    gap: 8,
  },
  brandItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  brandItemCardActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  brandTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandNameText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  brandFaText: {
    fontSize: 13,
    color: '#64748b',
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  // Step 3: Profile Detail
  profileDetailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 14,
  },
  profileDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
  },
  profileDetailTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  profileMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileMetaLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  profileMetaValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  provenanceBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  provenanceTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    textAlign: 'right',
  },
  provenanceDesc: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'right',
    lineHeight: 18,
  },
  provenanceNotes: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'right',
    lineHeight: 18,
  },
  multipleCandidatesBox: {
    gap: 8,
  },
  multipleCandidatesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    textAlign: 'right',
  },
  candidateChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  candidateChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  candidateChipActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  candidateChipText: {
    fontSize: 12,
    color: '#475569',
  },
  candidateChipTextActive: {
    color: '#1d4ed8',
    fontWeight: 'bold',
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  // Step 4: Test Wizard
  testCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 16,
  },
  testIconRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  testDesc: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
  },
  transmitPulseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    width: '100%',
  },
  transmitPulseBtnActive: {
    backgroundColor: '#1d4ed8',
  },
  transmitPulseBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  testResultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    width: '100%',
  },
  testResultText: {
    fontSize: 12,
    color: '#15803d',
    flex: 1,
    textAlign: 'right',
  },
  questionSection: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  questionPrompt: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  questionButtonsRow: {
    width: '100%',
    gap: 10,
  },
  yesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 14,
  },
  yesButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  noNextProfileBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  noNextProfileText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  // Step 5: Save
  saveCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'right',
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    textAlign: 'right',
  },
  summaryBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'right',
    marginBottom: 4,
  },
  summaryItem: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'right',
  },
  saveSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  saveSubmitText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
