import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  ScrollView,
  Animated,
  Easing,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Music,
  FileText,
  Gauge,
  RotateCcw,
  RotateCw,
  Headphones,
} from 'lucide-react-native';
import { useMusicPlayer } from '../../../context/MusicPlayerContext';
import { resolveMediaUrl } from '../../../services/musicService';
import { formatDurationMs, toPersianDigits } from '../../../utils/musicUtils';

const { width, height } = Dimensions.get('window');

const PLAYBACK_SPEEDS = [0.75, 1.0, 1.25, 1.5, 2.0];

export const MusicPlayerScreen: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    playbackState,
    positionMs,
    durationMs,
    playbackSpeed,
    isLooping,
    isShuffling,
    isFullPlayerVisible,
    closeFullPlayer,
    togglePlayPause,
    seekTo,
    setSpeed,
    toggleLoop,
    toggleShuffle,
    playNext,
    playPrevious,
  } = useMusicPlayer();

  const [activeTab, setActiveTab] = useState<'player' | 'lyrics'>('player');
  const [showSpeedModal, setShowSpeedModal] = useState<boolean>(false);
  const [isSeeking, setIsSeeking] = useState<boolean>(false);
  const [seekPreviewMs, setSeekPreviewMs] = useState<number>(0);

  // Rotation animation for vinyl artwork
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rotateLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isPlaying) {
      rotateLoop.current = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 12000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotateLoop.current.start();
    } else {
      if (rotateLoop.current) {
        rotateLoop.current.stop();
      }
    }
  }, [isPlaying, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!isFullPlayerVisible || !currentTrack) return null;

  const currentPos = isSeeking ? seekPreviewMs : positionMs;
  const progressRatio = durationMs > 0 ? Math.min(1, Math.max(0, currentPos / durationMs)) : 0;
  const progressPercent = progressRatio * 100;

  const coverUrl = resolveMediaUrl(currentTrack.coverUrl);
  const isLoading = playbackState === 'loading';

  // Slider touch handling
  const handleProgressBarPress = (evt: GestureResponderEvent) => {
    if (durationMs <= 0) return;
    const { locationX } = evt.nativeEvent;
    const barWidth = width - 48; // padding horizontal 24 on each side
    const ratio = Math.max(0, Math.min(1, locationX / barWidth));
    const targetMs = Math.round(ratio * durationMs);
    seekTo(targetMs);
  };

  const handleSeekBackward10 = () => {
    const target = Math.max(0, positionMs - 10000);
    seekTo(target);
  };

  const handleSeekForward10 = () => {
    const target = Math.min(durationMs, positionMs + 10000);
    seekTo(target);
  };

  return (
    <Modal
      visible={isFullPlayerVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={closeFullPlayer}
    >
      <SafeAreaView style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={closeFullPlayer}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronDown size={28} color="#1e293b" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerSub}>در حال پخش</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {currentTrack.title}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.headerButton, activeTab === 'lyrics' && styles.headerButtonActive]}
            onPress={() => setActiveTab(activeTab === 'player' ? 'lyrics' : 'player')}
          >
            <FileText size={22} color={activeTab === 'lyrics' ? '#6366f1' : '#64748b'} />
          </TouchableOpacity>
        </View>

        {/* Content Tabs */}
        {activeTab === 'player' ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Artwork Section */}
            <View style={styles.artworkSection}>
              <View style={styles.artworkShadowWrapper}>
                {coverUrl ? (
                  <Animated.Image
                    source={{ uri: coverUrl }}
                    style={[
                      styles.artworkImage,
                      {
                        transform: [{ rotate: spin }],
                      },
                    ]}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.artworkPlaceholder}>
                    <Music size={72} color="#ffffff" />
                  </View>
                )}
                <View style={styles.vinylCenterPin} />
              </View>
            </View>

            {/* Track Info */}
            <View style={styles.trackInfoSection}>
              <Text style={styles.trackTitleText} numberOfLines={2}>
                {currentTrack.title}
              </Text>
              <Text style={styles.trackArtistText} numberOfLines={1}>
                {currentTrack.artist || 'نامشخص'}
              </Text>

              {currentTrack.playsCount !== undefined && (
                <View style={styles.playsCountBadge}>
                  <Headphones size={13} color="#6366f1" />
                  <Text style={styles.playsCountText}>
                    {toPersianDigits(currentTrack.playsCount)} پخش
                  </Text>
                </View>
              )}
            </View>

            {/* Interactive Seekbar */}
            <View style={styles.progressSection}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={handleProgressBarPress}
                style={styles.progressBarTrack}
              >
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                <View style={[styles.progressBarThumb, { left: `${progressPercent}%` }]} />
              </TouchableOpacity>

              <View style={styles.timeLabelsRow}>
                <Text style={styles.timeLabelText}>
                  {formatDurationMs(currentPos)}
                </Text>
                <Text style={styles.timeLabelText}>
                  {formatDurationMs(durationMs)}
                </Text>
              </View>
            </View>

            {/* Primary Controls (LTR ordered to keep intuitive Persian audio playback flow) */}
            <View style={styles.controlsSection}>
              {/* Shuffle */}
              <TouchableOpacity
                style={[styles.secondaryControl, isShuffling && styles.activeControl]}
                onPress={toggleShuffle}
              >
                <Shuffle size={20} color={isShuffling ? '#6366f1' : '#64748b'} />
              </TouchableOpacity>

              {/* Rewind 10s */}
              <TouchableOpacity
                style={styles.secondaryControl}
                onPress={handleSeekBackward10}
              >
                <RotateCcw size={22} color="#334155" />
              </TouchableOpacity>

              {/* Next Track (plays forward in queue) */}
              <TouchableOpacity
                style={styles.skipButton}
                onPress={playNext}
              >
                <SkipForward size={26} color="#1e293b" />
              </TouchableOpacity>

              {/* Main Play / Pause Circle */}
              <TouchableOpacity
                style={styles.playPauseCircle}
                onPress={togglePlayPause}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <Music size={28} color="#ffffff" />
                ) : isPlaying ? (
                  <Pause size={32} color="#ffffff" fill="#ffffff" />
                ) : (
                  <Play size={32} color="#ffffff" fill="#ffffff" style={{ marginLeft: 3 }} />
                )}
              </TouchableOpacity>

              {/* Previous Track */}
              <TouchableOpacity
                style={styles.skipButton}
                onPress={playPrevious}
              >
                <SkipBack size={26} color="#1e293b" />
              </TouchableOpacity>

              {/* Forward 10s */}
              <TouchableOpacity
                style={styles.secondaryControl}
                onPress={handleSeekForward10}
              >
                <RotateCw size={22} color="#334155" />
              </TouchableOpacity>

              {/* Repeat / Loop */}
              <TouchableOpacity
                style={[styles.secondaryControl, isLooping && styles.activeControl]}
                onPress={toggleLoop}
              >
                <Repeat size={20} color={isLooping ? '#6366f1' : '#64748b'} />
              </TouchableOpacity>
            </View>

            {/* Bottom Actions Row: Speed & Lyrics toggle */}
            <View style={styles.bottomActionsRow}>
              <TouchableOpacity
                style={styles.speedButton}
                onPress={() => setShowSpeedModal(true)}
              >
                <Gauge size={16} color="#6366f1" />
                <Text style={styles.speedButtonText}>
                  {toPersianDigits(playbackSpeed)}x
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.lyricsTabButton}
                onPress={() => setActiveTab('lyrics')}
              >
                <FileText size={16} color="#6366f1" />
                <Text style={styles.lyricsTabButtonText}>متن ترانه</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          /* Lyrics View */
          <View style={styles.lyricsContainer}>
            <View style={styles.lyricsHeader}>
              <Text style={styles.lyricsHeading}>متن ترانه</Text>
              <TouchableOpacity
                style={styles.closeLyricsButton}
                onPress={() => setActiveTab('player')}
              >
                <Text style={styles.closeLyricsText}>بازگشت به پلیر</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.lyricsScroll}
              showsVerticalScrollIndicator={false}
            >
              {currentTrack.lyrics && currentTrack.lyrics.trim().length > 0 ? (
                <Text style={styles.lyricsContent}>
                  {currentTrack.lyrics}
                </Text>
              ) : (
                <View style={styles.noLyricsContainer}>
                  <FileText size={48} color="#cbd5e1" />
                  <Text style={styles.noLyricsText}>
                    متن این ترانه هنوز ثبت نشده است.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* Playback Speed Modal */}
        <Modal
          visible={showSpeedModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSpeedModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowSpeedModal(false)}
          >
            <View style={styles.speedModalContent}>
              <Text style={styles.speedModalTitle}>سرعت پخش</Text>
              <View style={styles.speedOptionsGrid}>
                {PLAYBACK_SPEEDS.map(spd => (
                  <TouchableOpacity
                    key={spd}
                    style={[
                      styles.speedOptionButton,
                      playbackSpeed === spd && styles.speedOptionSelected,
                    ]}
                    onPress={() => {
                      setSpeed(spd);
                      setShowSpeedModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.speedOptionText,
                        playbackSpeed === spd && styles.speedOptionTextSelected,
                      ]}
                    >
                      {toPersianDigits(spd)}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonActive: {
    backgroundColor: '#eef2ff',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerSub: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  artworkSection: {
    width: width * 0.75,
    height: width * 0.75,
    maxWidth: 320,
    maxHeight: 320,
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkShadowWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: (width * 0.75) / 2,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    backgroundColor: '#0f172a',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: '#e2e8f0',
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  artworkPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vinylCenterPin: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 4,
    borderColor: '#0f172a',
  },
  trackInfoSection: {
    alignItems: 'center',
    marginVertical: 12,
    width: '100%',
  },
  trackTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6,
  },
  trackArtistText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
  playsCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  playsCountText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  progressSection: {
    width: '100%',
    marginVertical: 16,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    position: 'relative',
    justifyContent: 'center',
    direction: 'ltr',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
    position: 'absolute',
    left: 0,
  },
  progressBarThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    marginLeft: -8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  timeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    direction: 'ltr',
    marginTop: 8,
  },
  timeLabelText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  controlsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    direction: 'ltr',
    width: '100%',
    marginVertical: 16,
  },
  secondaryControl: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeControl: {
    backgroundColor: '#eef2ff',
  },
  skipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  speedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  speedButtonText: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  lyricsTabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  lyricsTabButtonText: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  lyricsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  lyricsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  lyricsHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  closeLyricsButton: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  closeLyricsText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  lyricsScroll: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  lyricsContent: {
    fontSize: 16,
    lineHeight: 32,
    color: '#1e293b',
    textAlign: 'center',
  },
  noLyricsContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  noLyricsText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  speedModalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  speedModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  speedOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  speedOptionButton: {
    width: 60,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedOptionSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  speedOptionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
  },
  speedOptionTextSelected: {
    color: '#ffffff',
  },
});
