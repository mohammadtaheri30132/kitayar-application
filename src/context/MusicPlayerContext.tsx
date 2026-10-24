import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import {
  nativeAudioPlayer,
  PlaybackStateEvent,
  PlaybackProgressEvent,
} from '../services/nativeAudioPlayer';
import {
  musicService,
  MusicTrack,
  resolveMediaUrl,
} from '../services/musicService';

export interface MusicPlayerContextType {
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  playbackState: 'idle' | 'loading' | 'playing' | 'paused' | 'stopped' | 'completed' | 'error';
  positionMs: number;
  durationMs: number;
  bufferedPercent: number;
  playbackSpeed: number;
  isLooping: boolean;
  isShuffling: boolean;
  queue: MusicTrack[];
  queueIndex: number;
  isFullPlayerVisible: boolean;

  playTrack: (track: MusicTrack, queue?: MusicTrack[], index?: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (positionMs: number) => Promise<void>;
  setSpeed: (speed: number) => Promise<void>;
  toggleLoop: () => Promise<void>;
  toggleShuffle: () => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  stopPlayer: () => Promise<void>;
  openFullPlayer: () => void;
  closeFullPlayer: () => void;
  refreshTrackDetails: (trackId: string) => Promise<void>;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

export const MusicPlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [playbackState, setPlaybackState] = useState<
    'idle' | 'loading' | 'playing' | 'paused' | 'stopped' | 'completed' | 'error'
  >('idle');
  const [positionMs, setPositionMs] = useState<number>(0);
  const [durationMs, setDurationMs] = useState<number>(0);
  const [bufferedPercent, setBufferedPercent] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [queue, setQueue] = useState<MusicTrack[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [isFullPlayerVisible, setIsFullPlayerVisible] = useState<boolean>(false);

  // References to keep event handlers fresh without re-subscribing
  const queueRef = useRef<MusicTrack[]>(queue);
  queueRef.current = queue;

  const queueIndexRef = useRef<number>(queueIndex);
  queueIndexRef.current = queueIndex;

  const isLoopingRef = useRef<boolean>(isLooping);
  isLoopingRef.current = isLooping;

  const isShufflingRef = useRef<boolean>(isShuffling);
  isShufflingRef.current = isShuffling;

  const currentTrackRef = useRef<MusicTrack | null>(currentTrack);
  currentTrackRef.current = currentTrack;

  const positionMsRef = useRef<number>(positionMs);
  positionMsRef.current = positionMs;

  const isPlaying = playbackState === 'playing';

  // Play a specific track
  const playTrack = useCallback(
    async (track: MusicTrack, newQueue?: MusicTrack[], index?: number) => {
      try {
        const resolvedAudioUrl = resolveMediaUrl(track.audioUrl);
        const resolvedCoverUrl = resolveMediaUrl(track.coverUrl);

        if (newQueue && newQueue.length > 0) {
          setQueue(newQueue);
          const foundIdx = index !== undefined ? index : newQueue.findIndex(t => t._id === track._id);
          setQueueIndex(foundIdx >= 0 ? foundIdx : 0);
        } else if (queueRef.current.length === 0) {
          setQueue([track]);
          setQueueIndex(0);
        }

        setCurrentTrack(track);
        setPlaybackState('loading');
        setPositionMs(0);
        setDurationMs(track.duration ? track.duration * 1000 : 0);

        await nativeAudioPlayer.playTrack({
          id: track._id,
          url: resolvedAudioUrl,
          title: track.title,
          artist: track.artist || '',
          coverUrl: resolvedCoverUrl,
        });

        // Fetch full track details (lyrics, incremented playsCount) in background
        try {
          const fullDetails = await musicService.getTrackDetails(track._id);
          if (fullDetails) {
            setCurrentTrack(prev => (prev && prev._id === track._id ? { ...prev, ...fullDetails } : prev));
          }
        } catch {
          // ignore background fetch error
        }
      } catch (err) {
        console.error('Failed to play track:', err);
        setPlaybackState('error');
      }
    },
    []
  );

  const refreshTrackDetails = useCallback(async (trackId: string) => {
    try {
      const fullDetails = await musicService.getTrackDetails(trackId);
      if (fullDetails) {
        setCurrentTrack(prev => (prev && prev._id === trackId ? { ...prev, ...fullDetails } : prev));
      }
    } catch (err) {
      console.warn('Failed refreshing track details:', err);
    }
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (playbackState === 'playing') {
      await nativeAudioPlayer.pause();
    } else if (playbackState === 'paused') {
      await nativeAudioPlayer.resume();
    } else if (currentTrackRef.current) {
      await playTrack(currentTrackRef.current, queueRef.current, queueIndexRef.current);
    }
  }, [playbackState, playTrack]);

  const seekTo = useCallback(async (ms: number) => {
    setPositionMs(ms);
    await nativeAudioPlayer.seekTo(ms);
  }, []);

  const setSpeed = useCallback(async (spd: number) => {
    const updated = await nativeAudioPlayer.setPlaybackSpeed(spd);
    setPlaybackSpeed(updated);
  }, []);

  const toggleLoop = useCallback(async () => {
    const nextVal = !isLoopingRef.current;
    setIsLooping(nextVal);
    await nativeAudioPlayer.setLooping(nextVal);
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffling(prev => !prev);
  }, []);

  const playNext = useCallback(async () => {
    const q = queueRef.current;
    if (q.length === 0) return;

    let nextIdx: number;
    if (isShufflingRef.current && q.length > 1) {
      do {
        nextIdx = Math.floor(Math.random() * q.length);
      } while (nextIdx === queueIndexRef.current);
    } else {
      nextIdx = (queueIndexRef.current + 1) % q.length;
    }

    const nextTrack = q[nextIdx];
    if (nextTrack) {
      await playTrack(nextTrack, q, nextIdx);
    }
  }, [playTrack]);

  const playPrevious = useCallback(async () => {
    const q = queueRef.current;
    if (q.length === 0) return;

    // If current position is more than 3 seconds in, restart track
    if (positionMsRef.current > 3000) {
      await seekTo(0);
      return;
    }

    let prevIdx: number;
    if (isShufflingRef.current && q.length > 1) {
      do {
        prevIdx = Math.floor(Math.random() * q.length);
      } while (prevIdx === queueIndexRef.current);
    } else {
      prevIdx = queueIndexRef.current - 1;
      if (prevIdx < 0) prevIdx = q.length - 1;
    }

    const prevTrack = q[prevIdx];
    if (prevTrack) {
      await playTrack(prevTrack, q, prevIdx);
    }
  }, [playTrack, seekTo]);

  const stopPlayer = useCallback(async () => {
    await nativeAudioPlayer.stop();
    setCurrentTrack(null);
    setPlaybackState('idle');
    setPositionMs(0);
    setDurationMs(0);
    setIsFullPlayerVisible(false);
  }, []);

  const openFullPlayer = useCallback(() => {
    setIsFullPlayerVisible(true);
  }, []);

  const closeFullPlayer = useCallback(() => {
    setIsFullPlayerVisible(false);
  }, []);

  // Listen to native events
  useEffect(() => {
    const stateSub = nativeAudioPlayer.onStateChange((event: PlaybackStateEvent) => {
      setPlaybackState(event.state);
      if (event.duration && event.duration > 0) {
        setDurationMs(event.duration);
      }
      if (event.position !== undefined) {
        setPositionMs(event.position);
      }
    });

    const progressSub = nativeAudioPlayer.onProgress((event: PlaybackProgressEvent) => {
      setPositionMs(event.position);
      if (event.duration && event.duration > 0) {
        setDurationMs(event.duration);
      }
      setBufferedPercent(event.buffered || 0);
    });

    const completedSub = nativeAudioPlayer.onCompleted(() => {
      if (!isLoopingRef.current) {
        // Auto play next song if available
        const q = queueRef.current;
        if (q.length > 1 || (q.length === 1 && queueIndexRef.current === -1)) {
          playNext();
        } else {
          setPlaybackState('completed');
        }
      }
    });

    const errorSub = nativeAudioPlayer.onError(err => {
      console.warn('Native player error:', err);
      setPlaybackState('error');
    });

    const notifNextSub = nativeAudioPlayer.onNotificationNext(() => {
      playNext();
    });

    const notifPrevSub = nativeAudioPlayer.onNotificationPrev(() => {
      playPrevious();
    });

    const notifStopSub = nativeAudioPlayer.onNotificationStop(() => {
      stopPlayer();
    });

    return () => {
      stateSub.remove();
      progressSub.remove();
      completedSub.remove();
      errorSub.remove();
      notifNextSub.remove();
      notifPrevSub.remove();
      notifStopSub.remove();
    };
  }, [playNext, playPrevious, stopPlayer]);

  return (
    <MusicPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        playbackState,
        positionMs,
        durationMs,
        bufferedPercent,
        playbackSpeed,
        isLooping,
        isShuffling,
        queue,
        queueIndex,
        isFullPlayerVisible,
        playTrack,
        togglePlayPause,
        seekTo,
        setSpeed,
        toggleLoop,
        toggleShuffle,
        playNext,
        playPrevious,
        stopPlayer,
        openFullPlayer,
        closeFullPlayer,
        refreshTrackDetails,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = (): MusicPlayerContextType => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};
