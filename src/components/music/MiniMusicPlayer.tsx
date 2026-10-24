import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Pause, SkipForward, X, Music } from 'lucide-react-native';
import { useMusicPlayer } from '../../context/MusicPlayerContext';
import { resolveMediaUrl } from '../../services/musicService';

const { width } = Dimensions.get('window');

interface MiniMusicPlayerProps {
  bottomOffset?: number;
}

export const MiniMusicPlayer: React.FC<MiniMusicPlayerProps> = ({ bottomOffset }) => {
  const insets = useSafeAreaInsets();
  const effectiveBottom = bottomOffset !== undefined ? bottomOffset : Math.max(insets.bottom + 65, 80);
  const {
    currentTrack,
    isPlaying,
    playbackState,
    positionMs,
    durationMs,
    togglePlayPause,
    playNext,
    stopPlayer,
    openFullPlayer,
  } = useMusicPlayer();

  if (!currentTrack) return null;

  const progressPercent =
    durationMs > 0 ? Math.min(100, Math.max(0, (positionMs / durationMs) * 100)) : 0;

  const coverUrl = resolveMediaUrl(currentTrack.coverUrl);
  const isLoading = playbackState === 'loading';

  return (
    <View style={[styles.container, { bottom: effectiveBottom }]}>
      {/* Top progress bar */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      <TouchableOpacity
        style={styles.touchableContent}
        activeOpacity={0.9}
        onPress={openFullPlayer}
      >
        {/* Track Cover Thumbnail */}
        <View style={styles.coverWrapper}>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Music size={18} color="#ffffff" />
            </View>
          )}
        </View>

        {/* Track Info */}
        <View style={styles.infoWrapper}>
          <Text style={styles.titleText} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artistText} numberOfLines={1}>
            {currentTrack.artist || 'نامشخص'}
          </Text>
        </View>

        {/* Action Controls */}
        <View style={styles.actionsWrapper}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={stopPlayer}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={16} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={playNext}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SkipForward size={18} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={togglePlayPause}
            disabled={isLoading}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : isPlaying ? (
              <Pause size={20} color="#1e293b" fill="#1e293b" />
            ) : (
              <Play size={20} color="#1e293b" fill="#1e293b" />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    zIndex: 999,
  },
  progressBarBackground: {
    height: 3,
    backgroundColor: '#f1f5f9',
    width: '100%',
    direction: 'ltr',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    position: 'absolute',
    left: 0,
  },
  touchableContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  coverWrapper: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoWrapper: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'flex-end',
  },
  titleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'right',
  },
  artistText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'right',
  },
  actionsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
