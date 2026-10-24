import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  BookOpen,
  ArrowRight,
  Clock,
  ChevronLeft,
  Sparkles,
  MapPin,
  Compass,
  X,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { QURAN_SURAHS, SurahMeta } from '../../../data/quranSurahs';
import { quranService, toPersianDigits, LastReadState } from '../../../services/quranService';

export const QuranSurahListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'Mecca' | 'Madina'>('all');
  const [lastRead, setLastRead] = useState<LastReadState | null>(null);

  useEffect(() => {
    loadLastRead();
  }, []);

  const loadLastRead = async () => {
    const lr = await quranService.getLastRead();
    if (lr) {
      setLastRead(lr);
    }
  };

  const filteredSurahs = useMemo(() => {
    let list = QURAN_SURAHS;

    if (activeFilter !== 'all') {
      list = list.filter(s => s.revelationEn === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(s => {
        const idMatch = String(s.id) === q || toPersianDigits(s.id) === q;
        const nameMatch = s.name.includes(q) || s.arabicNameFull.includes(q);
        const persianMatch = s.persianName.includes(q);
        const englishMatch = s.englishName.toLowerCase().includes(q);
        return idMatch || nameMatch || persianMatch || englishMatch;
      });
    }

    return list;
  }, [searchQuery, activeFilter]);

  const handleOpenSurah = (surahId: number, targetVerse: number = 1) => {
    navigation.navigate('QuranReaderScreen', { surahId, targetVerse });
  };

  const renderSurahItem = ({ item }: { item: SurahMeta }) => {
    const isMeccan = item.revelationEn === 'Mecca';

    return (
      <TouchableOpacity
        style={[
          styles.surahCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        activeOpacity={0.7}
        onPress={() => handleOpenSurah(item.id)}
      >
        <View style={styles.surahCardLeft}>
          <ChevronLeft size={20} color={colors.textLight} />
          <View style={styles.metaBadgeContainer}>
            <View
              style={[
                styles.revelationBadge,
                {
                  backgroundColor: isMeccan ? '#fef3c7' : '#dcfce7',
                },
              ]}
            >
              <Text
                style={[
                  styles.revelationText,
                  { color: isMeccan ? '#b45309' : '#15803d' },
                ]}
              >
                {item.revelation}
              </Text>
            </View>
            <Text style={[styles.versesCountText, { color: colors.textLight }]}>
              {toPersianDigits(item.versesCount)} آیه
            </Text>
          </View>
        </View>

        <View style={styles.surahCardRight}>
          <View style={styles.surahInfo}>
            <Text style={[styles.surahNameArabic, { color: colors.text }]}>
              {item.name}
            </Text>
            <Text style={[styles.surahNamePersian, { color: colors.textLight }]}>
              {item.persianName} • جزء {toPersianDigits(item.juz)}
            </Text>
          </View>

          {/* Surah Number Star/Badge */}
          <View
            style={[
              styles.numberBadge,
              {
                backgroundColor: isDark ? 'rgba(5, 150, 105, 0.2)' : '#ecfdf5',
                borderColor: '#10b981',
              },
            ]}
          >
            <Text style={[styles.numberText, { color: '#059669' }]}>
              {toPersianDigits(item.id)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowRight size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>قرآن کریم</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textLight }]}>
            متن کامل مصحف عثمان‌طه به همراه ترجمه روان
          </Text>
        </View>

        <View style={styles.headerIconBox}>
          <BookOpen size={22} color="#059669" />
        </View>
      </View>

      {/* Main List */}
      <FlatList
        data={filteredSurahs}
        keyExtractor={item => String(item.id)}
        renderItem={renderSurahItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        windowSize={10}
        ListHeaderComponent={
          <View style={styles.headerComponent}>
            {/* Last Read Bookmark Card */}
            {lastRead && (
              <TouchableOpacity
                style={[
                  styles.lastReadCard,
                  {
                    backgroundColor: isDark ? '#064e3b' : '#ecfdf5',
                    borderColor: '#10b981',
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => handleOpenSurah(lastRead.surahId, lastRead.verseNumber)}
              >
                <View style={styles.lastReadIconBox}>
                  <Clock size={20} color="#059669" />
                </View>
                <View style={styles.lastReadTextWrap}>
                  <Text style={[styles.lastReadTitle, { color: isDark ? '#a7f3d0' : '#065f46' }]}>
                    ادامه قرائت قبلی
                  </Text>
                  <Text style={[styles.lastReadSubtitle, { color: isDark ? '#6ee7b7' : '#047857' }]}>
                    سوره {lastRead.surahName} • آیه {toPersianDigits(lastRead.verseNumber)}
                  </Text>
                </View>
                <ChevronLeft size={18} color={isDark ? '#a7f3d0' : '#059669'} />
              </TouchableOpacity>
            )}

            {/* Search Input Box */}
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Search size={18} color={colors.textLight} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="جستجوی سوره، آیه یا معنی..."
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

            {/* Filter Tabs */}
            <View style={styles.filterTabsContainer}>
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  activeFilter === 'all' && styles.filterTabActive,
                  { borderColor: colors.border },
                ]}
                onPress={() => setActiveFilter('all')}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    activeFilter === 'all' && styles.filterTabTextActive,
                    { color: activeFilter === 'all' ? '#ffffff' : colors.textLight },
                  ]}
                >
                  همه (۱۱۴ سوره)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterTab,
                  activeFilter === 'Mecca' && styles.filterTabActive,
                  { borderColor: colors.border },
                ]}
                onPress={() => setActiveFilter('Mecca')}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    activeFilter === 'Mecca' && styles.filterTabTextActive,
                    { color: activeFilter === 'Mecca' ? '#ffffff' : colors.textLight },
                  ]}
                >
                  مکّی (۸۶)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterTab,
                  activeFilter === 'Madina' && styles.filterTabActive,
                  { borderColor: colors.border },
                ]}
                onPress={() => setActiveFilter('Madina')}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    activeFilter === 'Madina' && styles.filterTabTextActive,
                    { color: activeFilter === 'Madina' ? '#ffffff' : colors.textLight },
                  ]}
                >
                  مدنی (۲۸)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <BookOpen size={48} color={colors.textLight} />
            <Text style={[styles.emptyText, { color: colors.textLight }]}>
              سوره‌ای با این مشخصات یافت نشد
            </Text>
          </View>
        }
      />
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
    fontSize: 19,
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
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerComponent: {
    marginBottom: 14,
  },
  lastReadCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  lastReadIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  lastReadTextWrap: {
    flex: 1,
  },
  lastReadTitle: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  lastReadSubtitle: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'right',
  },
  searchBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginRight: 8,
    fontSize: 14,
    paddingVertical: 0,
  },
  filterTabsContainer: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 6,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#ffffff',
  },
  surahCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  surahCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  surahInfo: {
    alignItems: 'flex-end',
    marginRight: 14,
    flex: 1,
  },
  surahNameArabic: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 4,
  },
  surahNamePersian: {
    fontSize: 12,
    textAlign: 'right',
  },
  numberBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  surahCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaBadgeContainer: {
    alignItems: 'flex-start',
    marginLeft: 6,
  },
  revelationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  revelationText: {
    fontSize: 10,
    fontWeight: '700',
  },
  versesCountText: {
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
});
