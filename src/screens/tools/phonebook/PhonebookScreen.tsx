import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Linking,
  Share,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { showWarning } from '../../../components/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  Phone,
  PhoneCall,
  Search,
  ChevronLeft,
  Share2,
  Copy,
  Check,
  AlertTriangle,
  Building,
  School,
  MapPin,
  Folder,
  Layers,
  X,
  Compass,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import {
  phonebookService,
  PhoneCategory,
  PhoneContact,
  toPersianDigits,
  FALLBACK_EMERGENCY_CONTACTS,
} from '../../../services/phonebookService';

export const PhonebookScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();

  // Navigation Stack History for Hierarchical Browsing
  // Each entry is { categoryId: string | null, title: string }
  const [navHistory, setNavHistory] = useState<Array<{ categoryId: string | null; title: string }>>([
    { categoryId: null, title: 'دفترچه تلفن' },
  ]);

  const currentNav = navHistory[navHistory.length - 1];
  const currentCategoryId = currentNav.categoryId;

  // Data State
  const [rootCategories, setRootCategories] = useState<PhoneCategory[]>([]);
  const [currentSubcategories, setCurrentSubcategories] = useState<PhoneCategory[]>([]);
  const [currentContacts, setCurrentContacts] = useState<PhoneContact[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<PhoneContact[]>(FALLBACK_EMERGENCY_CONTACTS);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<{ contacts: PhoneContact[]; categories: PhoneCategory[] }>({
    contacts: [],
    categories: [],
  });

  // Copied indicator state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load root or current category content
  useEffect(() => {
    loadContent(currentCategoryId);
  }, [currentCategoryId]);

  const loadContent = async (catId: string | null) => {
    try {
      setLoading(true);
      if (catId === null) {
        // Load Root
        const [roots, emergencies] = await Promise.all([
          phonebookService.getRootCategories(),
          phonebookService.getEmergencyContacts(),
        ]);
        setRootCategories(roots);
        if (emergencies && emergencies.length > 0) {
          setEmergencyContacts(emergencies);
        }
        setCurrentSubcategories([]);
        setCurrentContacts([]);
      } else {
        // Load Specific Category
        const detail = await phonebookService.getCategoryDetails(catId);
        setCurrentSubcategories(detail.subcategories || []);
        setCurrentContacts(detail.contacts || []);
      }
    } catch (err: any) {
      console.warn('Error loading phonebook content:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadContent(currentCategoryId);
    setRefreshing(false);
  }, [currentCategoryId]);

  // Handle Search Input
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults({ contacts: [], categories: [] });
      return;
    }

    setIsSearching(true);
    const delayDebounce = setTimeout(async () => {
      const res = await phonebookService.search(searchQuery);
      setSearchResults(res);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Navigate deeper into a subcategory
  const handleOpenCategory = (cat: PhoneCategory) => {
    setNavHistory(prev => [...prev, { categoryId: cat._id, title: cat.title }]);
    setSearchQuery('');
  };

  // Navigate back one level or to specific breadcrumb
  const handleBack = () => {
    if (navHistory.length > 1) {
      setNavHistory(prev => prev.slice(0, prev.length - 1));
    } else {
      navigation.goBack();
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    setNavHistory(prev => prev.slice(0, index + 1));
  };

  // Direct Phone Call
  const handleCall = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    const url = `tel:${cleanNumber}`;
    Linking.canOpenURL(url)
      .then(supported => {
        if (!supported) {
          showWarning('دستگاه شما از برقراری تماس مستقیم پشتیبانی نمی‌کند.');
        } else {
          return Linking.openURL(url);
        }
      })
      .catch(err => console.warn('Error opening dialer:', err));
  };

  // Copy number
  const handleCopyNumber = (contact: PhoneContact) => {
    setCopiedId(contact._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Share Contact
  const handleShareContact = async (contact: PhoneContact) => {
    let msg = `📞 ${contact.title}\nشماره تماس: ${contact.phoneNumber}`;
    if (contact.internalNumber) msg += `\nداخلی: ${contact.internalNumber}`;
    if (contact.phoneSecondary) msg += `\nشماره همراه: ${contact.phoneSecondary}`;
    if (contact.department) msg += `\nواحد: ${contact.department}`;
    if (contact.city) msg += `\nشهر: ${contact.city}`;
    msg += '\n\n(از طریق دفترچه تلفن کیتایار)';

    try {
      await Share.share({ message: msg });
    } catch (e) {}
  };

  // Render Contact Item Card
  const renderContactCard = (contact: PhoneContact) => {
    const isCopied = copiedId === contact._id;

    return (
      <View
        key={contact._id}
        style={[
          styles.contactCard,
          {
            backgroundColor: colors.surface,
            borderColor: contact.isEmergency ? '#fecaca' : colors.border,
          },
          contact.isEmergency && styles.emergencyCardBorder,
        ]}
      >
        <View style={styles.contactHeader}>
          {/* Action buttons (Left) */}
          <View style={styles.contactActions}>
            <TouchableOpacity
              style={[styles.callBtn, { backgroundColor: '#10b981' }]}
              onPress={() => handleCall(contact.phoneNumber)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <PhoneCall size={16} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryActionBtn, { borderColor: colors.border }]}
              onPress={() => handleShareContact(contact)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Share2 size={15} color={colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryActionBtn,
                { borderColor: colors.border },
                isCopied && { backgroundColor: '#dcfce7', borderColor: '#10b981' },
              ]}
              onPress={() => handleCopyNumber(contact)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {isCopied ? (
                <Check size={15} color="#15803d" />
              ) : (
                <Copy size={15} color={colors.textLight} />
              )}
            </TouchableOpacity>
          </View>

          {/* Title & Department (Right) */}
          <View style={styles.contactTitleWrap}>
            <View style={styles.titleWithBadge}>
              <Text style={[styles.contactTitle, { color: colors.text }]}>
                {contact.title}
              </Text>
              {contact.isEmergency && (
                <View style={styles.emergencyTag}>
                  <Text style={styles.emergencyTagText}>فوری</Text>
                </View>
              )}
            </View>

            <View style={styles.badgesRow}>
              {contact.department ? (
                <View style={[styles.badgeItem, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                  <Text style={[styles.badgeText, { color: colors.textLight }]}>
                    🏢 {contact.department}
                  </Text>
                </View>
              ) : null}

              {contact.responsiblePerson ? (
                <View style={[styles.badgeItem, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                  <Text style={[styles.badgeText, { color: colors.textLight }]}>
                    👤 {contact.responsiblePerson}
                  </Text>
                </View>
              ) : null}

              {contact.city ? (
                <View style={[styles.badgeItem, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                  <Text style={[styles.badgeText, { color: colors.textLight }]}>
                    📍 {contact.city}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Numbers Row */}
        <View
          style={[
            styles.phoneNumbersContainer,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={styles.mainNumberBox}
            onPress={() => handleCall(contact.phoneNumber)}
          >
            <Phone size={14} color="#2563eb" />
            <Text style={styles.mainNumberText}>
              {toPersianDigits(contact.phoneNumber)}
            </Text>
          </TouchableOpacity>

          {contact.internalNumber ? (
            <View style={styles.internalNumberBox}>
              <Text style={[styles.internalNumberText, { color: colors.textLight }]}>
                داخلی: {toPersianDigits(contact.internalNumber)}
              </Text>
            </View>
          ) : null}

          {contact.phoneSecondary ? (
            <TouchableOpacity
              style={styles.secondaryNumberBox}
              onPress={() => handleCall(contact.phoneSecondary || '')}
            >
              <Text style={[styles.secondaryNumberText, { color: colors.textLight }]}>
                همراه: {toPersianDigits(contact.phoneSecondary)}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Optional Description */}
        {contact.description ? (
          <Text style={[styles.contactDesc, { color: colors.textLight }]}>
            {contact.description}
          </Text>
        ) : null}
      </View>
    );
  };

  // Render Category Card
  const renderCategoryCard = (cat: PhoneCategory) => {
    return (
      <TouchableOpacity
        key={cat._id}
        style={[
          styles.categoryCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        activeOpacity={0.75}
        onPress={() => handleOpenCategory(cat)}
      >
        <ChevronLeft size={20} color={colors.textLight} />

        <View style={styles.categoryCardRight}>
          <View style={styles.categoryInfo}>
            <View style={styles.categoryTitleRow}>
              <Text style={[styles.categoryTitle, { color: colors.text }]}>
                {cat.title}
              </Text>
              {cat.isEmergency && (
                <View style={styles.emergencyTag}>
                  <Text style={styles.emergencyTagText}>اضطراری</Text>
                </View>
              )}
            </View>

            {cat.description ? (
              <Text style={[styles.categoryDesc, { color: colors.textLight }]} numberOfLines={1}>
                {cat.description}
              </Text>
            ) : null}

            <View style={styles.categoryCountsRow}>
              {cat.subcategoriesCount !== undefined && cat.subcategoriesCount > 0 && (
                <Text style={[styles.countBadgeText, { color: colors.primary }]}>
                  {toPersianDigits(cat.subcategoriesCount)} زیردسته
                </Text>
              )}
              {cat.contactsCount !== undefined && cat.contactsCount > 0 && (
                <Text style={[styles.countBadgeText, { color: colors.textLight }]}>
                  • {toPersianDigits(cat.contactsCount)} شماره تماس
                </Text>
              )}
            </View>
          </View>

          <View
            style={[
              styles.categoryIconBox,
              { backgroundColor: `${cat.color || colors.primary}20` },
            ]}
          >
            <Folder size={22} color={cat.color || colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowRight size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {currentCategoryId === null ? 'دفترچه تلفن و اطلاعات تماس' : currentNav.title}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textLight }]}>
            اطلاعات تماس مدارس، ادارات و مراجع اضطراری
          </Text>
        </View>

        <View style={styles.headerIconBox}>
          <Phone size={22} color="#2563eb" />
        </View>
      </View>

      {/* Interactive Breadcrumb Bar (Visible when drilled down) */}
      {navHistory.length > 1 && (
        <View style={[styles.breadcrumbBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.breadcrumbScroll}>
            {navHistory.map((item, idx) => {
              const isLast = idx === navHistory.length - 1;
              return (
                <View key={idx} style={styles.breadcrumbItemWrap}>
                  <TouchableOpacity
                    style={[styles.breadcrumbPill, isLast && styles.breadcrumbPillActive]}
                    onPress={() => handleBreadcrumbClick(idx)}
                    disabled={isLast}
                  >
                    <Text style={[styles.breadcrumbPillText, { color: isLast ? '#ffffff' : colors.textLight }]}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                  {!isLast && <ChevronLeft size={14} color={colors.textLight} style={{ marginHorizontal: 4 }} />}
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search size={18} color={colors.textLight} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="جستجوی نام شخص، اداره، مدرسه یا شماره..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
      >
        {/* VIEW 1: SEARCH RESULTS */}
        {isSearching ? (
          <View style={styles.searchResultsContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              نتایج جستجو برای «{searchQuery}»
            </Text>

            {searchResults.contacts.length === 0 && searchResults.categories.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textLight }]}>
                  موردی با این عبارت یافت نشد
                </Text>
              </View>
            ) : (
              <>
                {/* Matching Categories */}
                {searchResults.categories.length > 0 && (
                  <View style={{ marginBottom: 14 }}>
                    <Text style={[styles.subSectionTitle, { color: colors.textLight }]}>
                      دسته‌بندی‌های مرتبط:
                    </Text>
                    {searchResults.categories.map(renderCategoryCard)}
                  </View>
                )}

                {/* Matching Contacts */}
                {searchResults.contacts.length > 0 && (
                  <View>
                    <Text style={[styles.subSectionTitle, { color: colors.textLight }]}>
                      شماره‌های تماس:
                    </Text>
                    {searchResults.contacts.map(renderContactCard)}
                  </View>
                )}
              </>
            )}
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={[styles.loadingText, { color: colors.textLight }]}>
              در حال دریافت اطلاعات تماس...
            </Text>
          </View>
        ) : currentCategoryId === null ? (
          /* VIEW 2: ROOT DIRECTORY */
          <View>
            {/* Emergency Contacts Quick Horizontal Carousel */}
            <View style={styles.emergencySection}>
              <View style={styles.emergencySectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  🚨 شماره‌های اضطراری کشور
                </Text>
                <Text style={[styles.emergencySubtitle, { color: colors.textLight }]}>
                  تماس فوری ۲۴ ساعته
                </Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emergencyScroll}>
                {emergencyContacts.map(em => (
                  <TouchableOpacity
                    key={em._id}
                    style={[styles.emergencyQuickPill, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}
                    activeOpacity={0.8}
                    onPress={() => handleCall(em.phoneNumber)}
                  >
                    <View style={styles.emergencyPillIcon}>
                      <PhoneCall size={14} color="#b91c1c" />
                    </View>
                    <Text style={styles.emergencyPillTitle}>{em.title}</Text>
                    <Text style={styles.emergencyPillNumber}>{toPersianDigits(em.phoneNumber)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Main Categories Section */}
            <View style={styles.categoriesSection}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
                🗂️ دسته‌بندی‌ها و ادارات
              </Text>

              {rootCategories.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.textLight }]}>
                    دسته‌بندی ثبت نشده است
                  </Text>
                </View>
              ) : (
                rootCategories.map(renderCategoryCard)
              )}
            </View>
          </View>
        ) : (
          /* VIEW 3: DRILLED-DOWN CATEGORY (Subcategories & Contacts) */
          <View>
            {/* Subcategories if any */}
            {currentSubcategories.length > 0 && (
              <View style={{ marginBottom: 18 }}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 10 }]}>
                  📁 زیردسته‌ها ({toPersianDigits(currentSubcategories.length)})
                </Text>
                {currentSubcategories.map(renderCategoryCard)}
              </View>
            )}

            {/* Direct Contacts in this category */}
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 10 }]}>
                📞 شماره‌های تماس ({toPersianDigits(currentContacts.length)})
              </Text>

              {currentContacts.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.textLight }]}>
                    هنوز شماره تماسی در این دسته‌بندی ثبت نشده است
                  </Text>
                </View>
              ) : (
                currentContacts.map(renderContactCard)
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
  },
  headerTitleWrap: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'right',
  },
  headerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  breadcrumbBar: {
    borderBottomWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  breadcrumbScroll: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  breadcrumbItemWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  breadcrumbPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  breadcrumbPillActive: {
    backgroundColor: '#2563eb',
  },
  breadcrumbPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginRight: 8,
    fontSize: 13,
    paddingVertical: 0,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emergencySection: {
    marginBottom: 20,
  },
  emergencySectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
  emergencySubtitle: {
    fontSize: 11,
  },
  emergencyScroll: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  emergencyQuickPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  emergencyPillIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyPillTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991b1b',
  },
  emergencyPillNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b91c1c',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  categoriesSection: {
    marginBottom: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  categoryCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  categoryInfo: {
    alignItems: 'flex-end',
    marginRight: 12,
    flex: 1,
  },
  categoryTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
  categoryDesc: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'right',
  },
  categoryCountsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  categoryIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  emergencyCardBorder: {
    borderRightWidth: 4,
    borderRightColor: '#ef4444',
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  contactTitleWrap: {
    alignItems: 'flex-end',
    flex: 1,
    marginLeft: 10,
  },
  titleWithBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
  emergencyTag: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 0.8,
    borderColor: '#fca5a5',
  },
  emergencyTagText: {
    color: '#dc2626',
    fontSize: 10,
    fontWeight: '700',
  },
  badgesRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  badgeItem: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
  },
  contactActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  callBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  secondaryActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneNumbersContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flexWrap: 'wrap',
    padding: 8,
    borderRadius: 10,
    borderWidth: 0.8,
    gap: 12,
  },
  mainNumberBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  mainNumberText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2563eb',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  internalNumberBox: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  internalNumberText: {
    fontSize: 11,
    fontWeight: '600',
  },
  secondaryNumberBox: {
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  secondaryNumberText: {
    fontSize: 11,
  },
  contactDesc: {
    fontSize: 11,
    marginTop: 6,
    textAlign: 'right',
  },
  searchResultsContainer: {
    paddingTop: 4,
  },
  subSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 8,
    marginTop: 10,
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 13,
  },
});
