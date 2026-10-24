import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { KitayarMusicPlayerModule } = NativeModules;

if (Platform.OS === 'android' && !KitayarMusicPlayerModule) {
  console.warn(
    'KitayarMusicPlayerModule is not available. Native audio playback will not work.'
  );
}

const eventEmitter =
  Platform.OS === 'android' && KitayarMusicPlayerModule
    ? new NativeEventEmitter(KitayarMusicPlayerModule)
    : null;

export interface PlayTrackParams {
  id?: string;
  url: string;
  title?: string;
  artist?: string;
  coverUrl?: string;
}

export interface PlaybackStateEvent {
  state: 'idle' | 'loading' | 'playing' | 'paused' | 'stopped' | 'completed' | 'error';
  trackId: string;
  duration?: number;
  position?: number;
  error?: string;
}

export interface PlaybackProgressEvent {
  position: number;
  duration: number;
  buffered: number;
  trackId: string;
}

export interface PlaybackCompletedEvent {
  trackId: string;
}

export interface PlaybackErrorEvent {
  error: string;
  what?: number;
  extra?: number;
}

export interface PlayerStatus {
  state: string;
  trackId: string;
  title: string;
  artist: string;
  coverUrl: string;
  speed: number;
  isLooping: boolean;
  position: number;
  duration: number;
  isPlaying: boolean;
  buffered: number;
}

export const nativeAudioPlayer = {
  /**
   * Play a track by URL (handles HTTP streaming & local files)
   */
  async playTrack(params: PlayTrackParams): Promise<boolean> {
    if (!KitayarMusicPlayerModule) return false;
    return await KitayarMusicPlayerModule.playTrack(params);
  },

  /**
   * Pause playback
   */
  async pause(): Promise<boolean> {
    if (!KitayarMusicPlayerModule) return false;
    return await KitayarMusicPlayerModule.pause();
  },

  /**
   * Resume paused playback
   */
  async resume(): Promise<boolean> {
    if (!KitayarMusicPlayerModule) return false;
    return await KitayarMusicPlayerModule.resume();
  },

  /**
   * Stop playback completely
   */
  async stop(): Promise<boolean> {
    if (!KitayarMusicPlayerModule) return false;
    return await KitayarMusicPlayerModule.stop();
  },

  /**
   * Seek to specific millisecond
   */
  async seekTo(positionMs: number): Promise<boolean> {
    if (!KitayarMusicPlayerModule) return false;
    return await KitayarMusicPlayerModule.seekTo(positionMs);
  },

  /**
   * Set playback speed (e.g. 0.75, 1.0, 1.25, 1.5, 2.0)
   */
  async setPlaybackSpeed(speed: number): Promise<number> {
    if (!KitayarMusicPlayerModule) return 1.0;
    return await KitayarMusicPlayerModule.setPlaybackSpeed(speed);
  },

  /**
   * Enable/disable looping
   */
  async setLooping(enabled: boolean): Promise<boolean> {
    if (!KitayarMusicPlayerModule) return false;
    return await KitayarMusicPlayerModule.setLooping(enabled);
  },

  /**
   * Query current player status
   */
  async getPlayerStatus(): Promise<PlayerStatus | null> {
    if (!KitayarMusicPlayerModule) return null;
    return await KitayarMusicPlayerModule.getPlayerStatus();
  },

  /**
   * Event Listeners
   */
  onStateChange(callback: (event: PlaybackStateEvent) => void) {
    if (!eventEmitter) return { remove: () => {} };
    const subscription = eventEmitter.addListener('onMusicStateChange', (data: any) =>
      callback(data as PlaybackStateEvent)
    );
    return subscription;
  },

  onProgress(callback: (event: PlaybackProgressEvent) => void) {
    if (!eventEmitter) return { remove: () => {} };
    const subscription = eventEmitter.addListener('onMusicProgress', (data: any) =>
      callback(data as PlaybackProgressEvent)
    );
    return subscription;
  },

  onCompleted(callback: (event: PlaybackCompletedEvent) => void) {
    if (!eventEmitter) return { remove: () => {} };
    const subscription = eventEmitter.addListener('onMusicCompleted', (data: any) =>
      callback(data as PlaybackCompletedEvent)
    );
    return subscription;
  },

  onError(callback: (event: PlaybackErrorEvent) => void) {
    if (!eventEmitter) return { remove: () => {} };
    const subscription = eventEmitter.addListener('onMusicError', (data: any) =>
      callback(data as PlaybackErrorEvent)
    );
    return subscription;
  },

  onNotificationNext(callback: () => void) {
    if (!eventEmitter) return { remove: () => {} };
    return eventEmitter.addListener('onMusicNotificationNext', callback);
  },

  onNotificationPrev(callback: () => void) {
    if (!eventEmitter) return { remove: () => {} };
    return eventEmitter.addListener('onMusicNotificationPrev', callback);
  },

  onNotificationStop(callback: () => void) {
    if (!eventEmitter) return { remove: () => {} };
    return eventEmitter.addListener('onMusicNotificationStop', callback);
  },
};
