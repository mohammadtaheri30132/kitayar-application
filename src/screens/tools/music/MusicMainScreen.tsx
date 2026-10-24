import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  Search,
  ChevronLeft,
  Play,
  Pause,
  Music,
  Headphones,
  Sparkles,
  Layers,
  X,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import {
  musicService,
  MusicCategory,
  MusicTrack,
  resolveMediaUrl,
} from '../../../services/musicService';
import { useMusicPlayer } from '../../../context/MusicPlayerContext';
import { MiniMusicPlayer } from '../../../components/music/MiniMusicPlayer';
import { MusicPlayerScreen } from './MusicPlayerScreen';
import { formatDurationSec, toPersianDigits } from '../../../utils/musicUtils';

const { width } = Dimensions.get('window');

export const MusicMainScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useMusicPlayer();

  const [categories, setCategories] = useState<MusicCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<MusicTrack[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await musicService.getCategoriesWithTracks();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load music categories:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    try {
      setIsSearching(true);
      const results = await musicService.searchTracks(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleTrackPress = (track: MusicTrack, queue: MusicTrack[]) => {
    if (currentTrack?._id === track._id) {
      togglePlayPause();
    } else {
      playTrack(track, queue);
    }
  };

  const navigateToCategory = (cat: MusicCategory) => {
    navigation.navigate('MusicCategoryTracksScreen', {
      categoryId: cat._id,
      categoryTitle: cat.title,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowRight size={24} color="#1e293b" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>موزیک و آواهای آموزشی</Text>
            <Text style={styles.headerSubtitle}>مجموعه سرودها، آواها و قطعات صوتی</Text>
          </View>

          <View style={styles.headerIconBadge}>
            <Music size={20} color="#6366f1" />
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBarWrapper}>
            <Search size={18} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="جستجوی موزیک، خواننده، سرود..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={handleSearch}
              textAlign="right"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearSearchBtn}>
                <X size={16} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content Body */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>در حال دریافت لیست موزیک‌ها...</Text>
          </View>
        ) : searchQuery.trim().length > 0 ? (
          /* Search Results */
          <ScrollView
            contentContainerStyle={styles.searchContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.searchResultsHeader}>
              <Text style={styles.searchResultsTitle}>
                نتایج جستجو برای "{searchQuery}"
              </Text>
              <Text style={styles.searchResultsCount}>
                {toPersianDigits(searchResults.length)} مورد یافت شد
              </Text>
            </View>

            {isSearching ? (
              <ActivityIndicator size="small" color="#6366f1" style={{ marginTop: 24 }} />
            ) : searchResults.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Music size={48} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>موردی یافت نشد</Text>
                <Text style={styles.emptySubtitle}>
                  با عنوان یا نام خواننده دیگری امتحان کنید
                </Text>
              </View>
            ) : (
              <View style={styles.searchGrid}>
                {searchResults.map(track => {
                  const isCurrent = currentTrack?._id === track._id;
                  const cover = resolveMediaUrl(track.coverUrl);
                  return (
                    <TouchableOpacity
                      key={track._id}
                      style={[styles.searchItemCard, isCurrent && styles.activeItemCard]}
                      onPress={() => handleTrackPress(track, searchResults)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.squareCoverWrapper}>
                        {cover ? (
                          <Image
                            source={{ uri: cover }}
                            style={styles.squareCoverImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.squareCoverFallback}>
                            <Music size={32} color="#ffffff" />
                          </View>
                        )}
                        <View style={styles.playBadge}>
                          {isCurrent && isPlaying ? (
                            <Pause size={14} color="#ffffff" fill="#ffffff" />
                          ) : (
                            <Play size={14} color="#ffffff" fill="#ffffff" style={{ marginLeft: 2 }} />
                          )}
                        </View>
                      </View>

                      <View style={styles.itemMeta}>
                        <Text style={styles.trackTitle} numberOfLines={1}>
                          {track.title}
                        </Text>
                        <Text style={styles.trackArtist} numberOfLines={1}>
                          {track.artist || 'هنرمند ناشناس'}
                        </Text>
                        {track.duration ? (
                          <Text style={styles.trackDuration}>
                            {formatDurationSec(track.duration)}
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>
        ) : categories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Layers size={52} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>دسته‌بندی فعالی یافت نشد</Text>
            <Text style={styles.emptySubtitle}>
              از طریق پنل مدیریت، دسته‌بندی و قطعات صوتی را اضافه کنید.
            </Text>
          </View>
        ) : (
          /* Categories Feed */
          <ScrollView
            contentContainerStyle={styles.feedContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />
            }
            showsVerticalScrollIndicator={false}
          >
            {categories.map(category => {
              const tracks = category.tracks || [];
              if (tracks.length === 0) return null;

              return (
                <View key={category._id} style={styles.categorySection}>
                  {/* Category Header */}
                  <View style={styles.categoryHeader}>
                    <TouchableOpacity
                      style={styles.viewMoreButton}
                      onPress={() => navigateToCategory(category)}
                      activeOpacity={0.7}
                    >
                      <ChevronLeft size={16} color="#6366f1" />
                      <Text style={styles.viewMoreText}>مشاهده بیشتر</Text>
                    </TouchableOpacity>

                    <View style={styles.categoryTitleWrapper}>
                      <Text style={styles.categoryTitle}>{category.title}</Text>
                      {category.description ? (
                        <Text style={styles.categoryDescription} numberOfLines={1}>
                          {category.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Horizontal Scroll of Up to 10 Square Cards */}
                  <FlatList
                    horizontal
                    data={tracks.slice(0, 10)}
                    keyExtractor={item => item._id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalListContent}
                    inverted // RTL scrolling
                    renderItem={({ item }) => {
                      const isCurrent = currentTrack?._id === item._id;
                      const cover = resolveMediaUrl(item.coverUrl);

                      return (
                        <TouchableOpacity
                          style={[styles.squareTrackCard, isCurrent && styles.activeSquareCard]}
                          onPress={() => handleTrackPress(item, tracks)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.squareCoverWrapper}>
                            {cover ? (
                              <Image
                                source={{ uri: cover }}
                                style={styles.squareCoverImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={styles.squareCoverFallback}>
                                <Music size={36} color="#ffffff" />
                              </View>
                            )}

                            {/* Floating Play Indicator */}
                            <View
                              style={[
                                styles.playBadge,
                                isCurrent && styles.playBadgeActive,
                              ]}
                            >
                              {isCurrent && isPlaying ? (
                                <Pause size={14} color="#ffffff" fill="#ffffff" />
                              ) : (
                                <Play
                                  size={14}
                                  color="#ffffff"
                                  fill="#ffffff"
                                  style={{ marginLeft: 2 }}
                                />
                              )}
                            </View>

                            {/* Duration pill badge */}
                            {item.duration ? (
                              <View style={styles.durationPill}>
                                <Text style={styles.durationPillText}>
                                  {formatDurationSec(item.duration)}
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          <View style={styles.trackInfo}>
                            <Text style={styles.trackTitle} numberOfLines={1}>
                              {item.title}
                            </Text>
                            <Text style={styles.trackArtist} numberOfLines={1}>
                              {item.artist || 'ناشناس'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                  />
                </View>
              );
            })}

            <View style={{ height: currentTrack ? 90 : 30 }} />
          </ScrollView>
        )}
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
    paddingHorizontal: 20,
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
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'right',
  },
  headerIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 0,
    paddingHorizontal: 8,
  },
  clearSearchBtn: {
    padding: 6,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
  },
  feedContent: {
    paddingVertical: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  categoryTitleWrapper: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  categoryTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'right',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'right',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  viewMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
  },
  horizontalListContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  squareTrackCard: {
    width: 136,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  activeSquareCard: {
    borderColor: '#6366f1',
    backgroundColor: '#faf5ff',
  },
  squareCoverWrapper: {
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    position: 'relative',
  },
  squareCoverImage: {
    width: '100%',
    height: '100%',
  },
  squareCoverFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBadgeActive: {
    backgroundColor: '#6366f1',
  },
  durationPill: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  durationPillText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '500',
  },
  trackInfo: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  trackTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'right',
    width: '100%',
  },
  trackArtist: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'right',
    width: '100%',
  },
  trackDuration: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  searchContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchResultsTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  searchResultsCount: {
    fontSize: 12,
    color: '#64748b',
  },
  searchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  searchItemCard: {
    width: (width - 44) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  activeItemCard: {
    borderColor: '#6366f1',
    backgroundColor: '#faf5ff',
  },
  itemMeta: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
