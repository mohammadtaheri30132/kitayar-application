import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
  Play,
  Pause,
  Music,
  PlayCircle,
  X,
  ListMusic,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  musicService,
  MusicTrack,
  resolveMediaUrl,
} from '../../../services/musicService';
import { useMusicPlayer } from '../../../context/MusicPlayerContext';
import { MiniMusicPlayer } from '../../../components/music/MiniMusicPlayer';
import { MusicPlayerScreen } from './MusicPlayerScreen';
import { formatDurationSec, toPersianDigits } from '../../../utils/musicUtils';

export const MusicCategoryTracksScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { categoryId, categoryTitle } = route.params || {};

  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useMusicPlayer();

  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  const fetchTracks = useCallback(
    async (targetPage = 1, search = '', append = false) => {
      if (!categoryId) return;
      try {
        if (targetPage === 1 && !append) setLoading(true);
        const res = await musicService.getCategoryTracks(
          categoryId,
          targetPage,
          30,
          search
        );
        if (append) {
          setTracks(prev => [...prev, ...res.tracks]);
        } else {
          setTracks(res.tracks);
        }
        setTotalPages(res.pagination.totalPages);
        setPage(targetPage);
      } catch (err) {
        console.error('Failed to load category tracks:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [categoryId]
  );

  useEffect(() => {
    fetchTracks(1, searchQuery);
  }, [fetchTracks]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTracks(1, searchQuery);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    fetchTracks(1, text);
  };

  const handleLoadMore = () => {
    if (!loadingMore && page < totalPages) {
      setLoadingMore(true);
      fetchTracks(page + 1, searchQuery, true);
    }
  };

  const handleTrackPress = (track: MusicTrack, index: number) => {
    if (currentTrack?._id === track._id) {
      togglePlayPause();
    } else {
      playTrack(track, tracks, index);
    }
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks, 0);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowRight size={24} color="#1e293b" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {categoryTitle || 'لیست موزیک‌ها'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {toPersianDigits(tracks.length)} قطعه صوتی
            </Text>
          </View>

          {tracks.length > 0 && (
            <TouchableOpacity
              style={styles.playAllButton}
              onPress={handlePlayAll}
              activeOpacity={0.8}
            >
              <Play size={14} color="#ffffff" fill="#ffffff" />
              <Text style={styles.playAllText}>پخش همه</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search inside category */}
        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <Search size={18} color="#94a3b8" style={{ marginLeft: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="جستجو در این دسته‌بندی..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={handleSearchChange}
              textAlign="right"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => handleSearchChange('')}
                style={{ padding: 6 }}
              >
                <X size={16} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tracks List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>در حال دریافت قطعات صوتی...</Text>
          </View>
        ) : tracks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ListMusic size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>قطعه‌ای یافت نشد</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'با عبارت دیگری جستجو کنید' : 'هیچ موزیکی در این دسته‌بندی وجود ندارد'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={tracks}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#6366f1']}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator
                  size="small"
                  color="#6366f1"
                  style={{ marginVertical: 16 }}
                />
              ) : (
                <View style={{ height: currentTrack ? 90 : 20 }} />
              )
            }
            renderItem={({ item, index }) => {
              const isCurrent = currentTrack?._id === item._id;
              const cover = resolveMediaUrl(item.coverUrl);

              return (
                <TouchableOpacity
                  style={[styles.trackRow, isCurrent && styles.trackRowActive]}
                  onPress={() => handleTrackPress(item, index)}
                  activeOpacity={0.75}
                >
                  {/* Left: Play icon and duration */}
                  <View style={styles.trackRowLeft}>
                    <View
                      style={[
                        styles.playIconCircle,
                        isCurrent && styles.playIconCircleActive,
                      ]}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause size={16} color="#ffffff" fill="#ffffff" />
                      ) : (
                        <Play
                          size={16}
                          color={isCurrent ? '#ffffff' : '#6366f1'}
                          fill={isCurrent ? '#ffffff' : '#6366f1'}
                          style={{ marginLeft: 2 }}
                        />
                      )}
                    </View>
                    {item.duration ? (
                      <Text style={styles.durationText}>
                        {formatDurationSec(item.duration)}
                      </Text>
                    ) : null}
                  </View>

                  {/* Right: Info + Cover */}
                  <View style={styles.trackRowRight}>
                    <View style={styles.trackInfo}>
                      <Text
                        style={[styles.trackTitle, isCurrent && styles.activeTrackTitle]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.trackArtist} numberOfLines={1}>
                        {item.artist || 'ناشناس'}
                      </Text>
                    </View>

                    <View style={styles.trackCover}>
                      {cover ? (
                        <Image
                          source={{ uri: cover }}
                          style={styles.coverImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.coverFallback}>
                          <Music size={20} color="#ffffff" />
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
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
    fontSize: 16,
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
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  playAllText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    paddingVertical: 0,
    paddingHorizontal: 8,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  trackRowActive: {
    backgroundColor: '#faf5ff',
    borderColor: '#6366f1',
  },
  trackRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconCircleActive: {
    backgroundColor: '#6366f1',
  },
  durationText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  trackRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    marginLeft: 12,
  },
  trackInfo: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 10,
  },
  trackTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'right',
  },
  activeTrackTitle: {
    color: '#6366f1',
  },
  trackArtist: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'right',
  },
  trackCover: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
