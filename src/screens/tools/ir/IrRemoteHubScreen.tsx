import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { showConfirm, showSuccess } from '../../../components/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  Tv,
  Wind,
  Monitor,
  Plus,
  Trash2,
  ChevronLeft,
  Info,
  Radio,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  SlidersHorizontal,
  Layers,
  Sparkles,
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { irService, HARDWARE_UNSUPPORTED_PERSIAN_MESSAGE } from '../../../services/irService';
import { IrCapabilities, SavedRemote, DeviceCategory } from '../../../data/ir/types';
import { deviceCategories, allProfiles } from '../../../data/ir';

const { width } = Dimensions.get('window');

export const IrRemoteHubScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [isLoading, setIsLoading] = useState(true);
  const [capabilities, setCapabilities] = useState<IrCapabilities | null>(null);
  const [savedRemotes, setSavedRemotes] = useState<SavedRemote[]>([]);
  const [showPreviewMode, setShowPreviewMode] = useState(false);
  const [showHardwareInfoModal, setShowHardwareInfoModal] = useState(false);

  const loadCapabilitiesAndRemotes = async () => {
    setIsLoading(true);
    try {
      const caps = await irService.checkCapabilities();
      setCapabilities(caps);
      const remotes = await irService.getSavedRemotes();
      setSavedRemotes(remotes);
    } catch (e) {
      console.warn('Error loading IR hub data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCapabilitiesAndRemotes();
    }, [])
  );

  const handleDeleteRemote = (remote: SavedRemote) => {
    showConfirm({
      title: 'حذف ریموت',
      message: `آیا از حذف ریموت «${remote.name}» اطمینان دارید؟`,
      confirmText: 'حذف ریموت',
      cancelText: 'انصراف',
      isDestructive: true,
      icon: Trash2,
      onConfirm: async () => {
        await irService.deleteRemote(remote.id);
        const remotes = await irService.getSavedRemotes();
        setSavedRemotes(remotes);
        showSuccess('ریموت با موفقیت حذف شد');
      },
    });
  };

  const openSavedRemote = (remote: SavedRemote) => {
    navigation.navigate('IrRemoteControlScreen', {
      profileId: remote.profileId,
      savedRemoteId: remote.id,
      remoteName: remote.name,
      roomName: remote.roomName,
      category: remote.category,
      isSimulationMode: !capabilities?.hasEmitter && showPreviewMode,
    });
  };

  const getCategoryIcon = (category: DeviceCategory) => {
    switch (category) {
      case 'projector':
        return <Tv size={22} color="#6366f1" />;
      case 'ac':
        return <Wind size={22} color="#0284c7" />;
      case 'tv':
        return <Monitor size={22} color="#ec4899" />;
      default:
        return <Radio size={22} color="#64748b" />;
    }
  };

  const getCategoryTitle = (category: DeviceCategory) => {
    switch (category) {
      case 'projector':
        return 'پروژکتور';
      case 'ac':
        return 'کولر گازی';
      case 'tv':
        return 'تلویزیون';
      default:
        return 'دستگاه';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>در حال بررسی فرستنده مادون قرمز دستگاه...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // HARDWARE DETECTION SCREEN: If phone lacks internal IR emitter
  const hasHardware = capabilities?.hasEmitter || showPreviewMode;

  if (!hasHardware) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowRight size={22} color="#1e293b" />
            </TouchableOpacity>

            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle}>ریموت کنترل مادون قرمز</Text>
              <Text style={styles.headerSubtitle}>وضعیت سخت‌افزار فرستنده IR</Text>
            </View>

            <View style={[styles.headerBadge, { backgroundColor: '#fee2e2' }]}>
              <AlertTriangle size={20} color="#ef4444" />
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Exact Required Persian Notice Card */}
            <View style={styles.unsupportedCard}>
              <View style={styles.unsupportedIconCircle}>
                <Radio size={36} color="#ef4444" />
              </View>

              <Text style={styles.unsupportedTitle}>سخت‌افزار مادون قرمز یافت نشد</Text>
              
              <View style={styles.requiredMessageContainer}>
                <Text style={styles.requiredMessageText}>
                  {HARDWARE_UNSUPPORTED_PERSIAN_MESSAGE}
                </Text>
              </View>

              <Text style={styles.unsupportedDesc}>
                برای ارسال مستقیم امواج نوری مادون قرمز به پروژکتور، کولر گازی و تلویزیون، گوشی تلفن همراه باید دارای سخت‌افزار فرستنده داخلی (IR Blaster) روی لبه دستگاه باشد.
              </Text>

              {/* Hardware explanation trigger */}
              <TouchableOpacity
                style={styles.infoToggleBtn}
                onPress={() => setShowHardwareInfoModal(!showHardwareInfoModal)}
                activeOpacity={0.8}
              >
                <HelpCircle size={18} color="#2563eb" />
                <Text style={styles.infoToggleText}>
                  {showHardwareInfoModal ? 'بستن توضیحات فنی سخت‌افزار' : 'توضیحات بیشتر درباره سخت‌افزار مورد نیاز'}
                </Text>
              </TouchableOpacity>

              {showHardwareInfoModal && (
                <View style={styles.hardwareExplanationBox}>
                  <Text style={styles.explanationTitle}>چرا به IR Blaster نیاز است؟</Text>
                  <Text style={styles.explanationText}>
                    • کنترل‌های کلاسی از دیودهای نوری با فرکانس ۳۶ تا ۴۰ کیلوهرتز استفاده می‌کنند.{'\n'}
                    • برخی گوشی‌های شیائومی (Xiaomi)، هواوی (Huawei) و آنر مجهز به فرستنده مادون قرمز هستند، اما اکثر گوشی‌های سامسونگ و آیفون‌های جدید فاقد این سنسور سخت‌افزاری هستند.{'\n'}
                    • این قابلیت وابسته به قطعه فیزیکی داخل گوشی است و با نصب نرم‌افزار روی گوشی بدون فرستنده کار نمی‌کند.
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.unsupportedActions}>
                <TouchableOpacity
                  style={styles.backActionButton}
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.85}
                >
                  <ArrowRight size={18} color="#ffffff" />
                  <Text style={styles.backActionText}>بازگشت به جعبه ابزار</Text>
                </TouchableOpacity>

                {/* Preview / Inspection Mode Button */}
                <TouchableOpacity
                  style={styles.previewModeButton}
                  onPress={() => setShowPreviewMode(true)}
                  activeOpacity={0.85}
                >
                  <Sparkles size={18} color="#2563eb" />
                  <Text style={styles.previewModeText}>
                    ورود به حالت پیش‌نمایش و بررسی ریموت‌ها
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // MAIN REMOTE HUB SCREEN (When IR emitter exists or Preview mode is active)
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowRight size={22} color="#1e293b" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>ریموت کنترل کلاسی</Text>
            <Text style={styles.headerSubtitle}>پروژکتور، اسپلیت و تلویزیون</Text>
          </View>

          <View style={[styles.headerBadge, { backgroundColor: '#e0e7ff' }]}>
            <Radio size={20} color="#4f46e5" />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hardware status badge / banner */}
          {showPreviewMode ? (
            <View style={styles.previewBanner}>
              <Sparkles size={18} color="#b45309" />
              <View style={styles.previewBannerTextWrap}>
                <Text style={styles.previewBannerTitle}>حالت شبیه‌سازی و پیش‌نمایش فعال است</Text>
                <Text style={styles.previewBannerDesc}>
                  گوشی شما فرستنده مادون قرمز ندارد؛ می‌توانید ظاهر ریموت‌ها و کدهای پروژکتور، کولر و تلویزیون را بررسی کنید.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.hardwareReadyBanner}>
              <CheckCircle2 size={18} color="#15803d" />
              <View style={styles.hardwareReadyTextWrap}>
                <Text style={styles.hardwareReadyTitle}>فرستنده مادون قرمز گوشی فعال است</Text>
                <Text style={styles.hardwareReadyDesc}>
                  آماده ارسال امواج ۳۶ تا ۴۰ کیلوهرتز به تجهیزات کلاسی
                </Text>
              </View>
            </View>
          )}

          {/* Quick Action: Add New Remote */}
          <TouchableOpacity
            style={styles.addNewButton}
            activeOpacity={0.88}
            onPress={() =>
              navigation.navigate('IrSetupWizardScreen', {
                isSimulationMode: showPreviewMode,
              })
            }
          >
            <View style={styles.addNewIconCircle}>
              <Plus size={22} color="#ffffff" />
            </View>
            <View style={styles.addNewTextWrap}>
              <Text style={styles.addNewTitle}>راه‌اندازی و افزودن ریموت جدید</Text>
              <Text style={styles.addNewSubtitle}>انتخاب برند، تست سازگاری و نام‌گذاری کلاس</Text>
            </View>
            <ChevronLeft size={20} color="#2563eb" />
          </TouchableOpacity>

          {/* Saved Remotes Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ریموت‌های ذخیره‌شده من</Text>
            <Text style={styles.sectionBadge}>
              {savedRemotes.length > 0 ? `${savedRemotes.length} ریموت` : 'بدون ریموت'}
            </Text>
          </View>

          {savedRemotes.length === 0 ? (
            <View style={styles.emptySavedBox}>
              <SlidersHorizontal size={36} color="#94a3b8" />
              <Text style={styles.emptySavedTitle}>هنوز ریموتی ذخیره نشده است</Text>
              <Text style={styles.emptySavedDesc}>
                با انتخاب دکمه «افزودن ریموت جدید»، ریموت پروژکتور یا کولر کلاس خود را در چند ثانیه تنظیم کنید تا همیشه در دسترس باشد.
              </Text>
            </View>
          ) : (
            <View style={styles.savedRemotesList}>
              {savedRemotes.map((remote) => {
                const profile = allProfiles.find((p) => p.id === remote.profileId);
                const isVerified = profile?.verificationStatus === 'verified';

                return (
                  <TouchableOpacity
                    key={remote.id}
                    style={styles.savedRemoteCard}
                    activeOpacity={0.88}
                    onPress={() => openSavedRemote(remote)}
                  >
                    <View style={styles.savedCardTopRow}>
                      <View style={styles.savedCardTitleWrap}>
                        <View style={styles.savedCardIconCircle}>
                          {getCategoryIcon(remote.category)}
                        </View>
                        <View>
                          <Text style={styles.savedCardName}>{remote.name}</Text>
                          <Text style={styles.savedCardRoom}>مکان: {remote.roomName}</Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.deleteBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() => handleDeleteRemote(remote)}
                      >
                        <Trash2 size={18} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.savedCardFooter}>
                      <View style={styles.brandBadge}>
                        <Text style={styles.brandBadgeText}>{remote.brand}</Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: isVerified ? '#dcfce7' : '#fef3c7',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            {
                              color: isVerified ? '#15803d' : '#b45309',
                            },
                          ]}
                        >
                          {isVerified ? 'تایید شده ✓' : 'کاندید معتبر'}
                        </Text>
                      </View>

                      <View style={styles.openActionWrap}>
                        <Text style={styles.openActionText}>کنترل دستگاه</Text>
                        <ChevronLeft size={16} color="#2563eb" />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Equipment Categories */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>دسته‌بندی تجهیزات کلاسی</Text>
          </View>

          <View style={styles.categoriesContainer}>
            {deviceCategories.map((cat) => {
              const count = allProfiles.filter((p) => p.category === cat.id).length;

              return (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.categoryCard}
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate('IrSetupWizardScreen', {
                      preselectedCategory: cat.id,
                      isSimulationMode: showPreviewMode,
                    })
                  }
                >
                  <View style={styles.categoryCardHeader}>
                    <View
                      style={[
                        styles.categoryIconCircle,
                        { backgroundColor: `${cat.color}15` },
                      ]}
                    >
                      {getCategoryIcon(cat.id)}
                    </View>
                    <View style={styles.categoryCountBadge}>
                      <Text style={[styles.categoryCountText, { color: cat.color }]}>
                        {count} پروفایل کد
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.categoryTitle}>{cat.titleFa}</Text>
                  <Text style={styles.categorySubtitle}>{cat.subtitleFa}</Text>

                  <View style={styles.priorityBrandsRow}>
                    <Text style={styles.priorityBrandsText}>
                      برندها: {cat.priorityBrands.slice(0, 4).join(' • ')} و...
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Offline & Verification Info Card */}
          <View style={styles.infoNoticeCard}>
            <View style={styles.infoNoticeHeader}>
              <Info size={18} color="#0369a1" />
              <Text style={styles.infoNoticeTitle}>ویژگی‌های فنی و امنیت</Text>
            </View>
            <Text style={styles.infoNoticeText}>
              • عملکرد کاملاً آفلاین: کدهای مادون قرمز درون اپلیکیشن تعبیه شده و بدون نیاز به اینترنت ارسال می‌شوند.{'\n'}
              • تفکیک شفاف: کدهای تاییدشده (Verified) از کدهای کاندید (Candidate) مجزا شده‌اند تا از ارسال کدهای نامطمئن جلوگیری شود.{'\n'}
              • ریموت پروژکتور دارای تاییدیه ایمنی خاموش‌کردن است تا ارائه کلاس تصادفاً قطع نشود.
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
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
  headerBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // Hardware Unsupported Styles
  unsupportedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  unsupportedIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  unsupportedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 12,
    textAlign: 'center',
  },
  requiredMessageContainer: {
    backgroundColor: '#fff1f2',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fda4af',
    marginBottom: 16,
    width: '100%',
  },
  requiredMessageText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#be123c',
    textAlign: 'center',
    lineHeight: 24,
  },
  unsupportedDesc: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  infoToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: 16,
  },
  infoToggleText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
  hardwareExplanationBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
    marginBottom: 20,
  },
  explanationTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'right',
  },
  explanationText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 22,
    textAlign: 'right',
  },
  unsupportedActions: {
    width: '100%',
    gap: 12,
  },
  backActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 16,
  },
  backActionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  previewModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  previewModeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1d4ed8',
  },
  // Active Banners
  hardwareReadyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f0fdf4',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 16,
  },
  hardwareReadyTextWrap: {
    flex: 1,
  },
  hardwareReadyTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#166534',
    textAlign: 'right',
  },
  hardwareReadyDesc: {
    fontSize: 11,
    color: '#15803d',
    textAlign: 'right',
    marginTop: 2,
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fffbeb',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 16,
  },
  previewBannerTextWrap: {
    flex: 1,
  },
  previewBannerTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#92400e',
    textAlign: 'right',
  },
  previewBannerDesc: {
    fontSize: 11,
    color: '#b45309',
    textAlign: 'right',
    marginTop: 2,
    lineHeight: 18,
  },
  // Add New Remote
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  addNewIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNewTextWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  addNewTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'right',
  },
  addNewSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
    marginTop: 2,
  },
  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  sectionBadge: {
    fontSize: 12,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  emptySavedBox: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  emptySavedTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 10,
    marginBottom: 6,
  },
  emptySavedDesc: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  savedRemotesList: {
    gap: 12,
  },
  savedRemoteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  savedCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  savedCardTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  savedCardIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  savedCardName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'right',
  },
  savedCardRoom: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
    marginTop: 2,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 10,
  },
  brandBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  brandBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  openActionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  openActionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  // Categories
  categoriesContainer: {
    gap: 12,
    marginBottom: 20,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCountBadge: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryCountText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'right',
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
    marginBottom: 10,
  },
  priorityBrandsRow: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 10,
  },
  priorityBrandsText: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'right',
  },
  // Info Notice Card
  infoNoticeCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
    gap: 8,
  },
  infoNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoNoticeTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  infoNoticeText: {
    fontSize: 11,
    color: '#0c4a6e',
    lineHeight: 20,
    textAlign: 'right',
  },
});
