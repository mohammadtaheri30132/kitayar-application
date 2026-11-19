import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { requireNativeComponent, UIManager, findNodeHandle, StyleProp, ViewStyle } from 'react-native';

const NativeVideoView = requireNativeComponent<any>('KitayarVideoView');

export interface KitayarVideoHandle {
  seek: (seconds: number) => void;
}

export interface KitayarVideoProps {
  src: string;
  paused?: boolean;
  onProgress?: (event: { currentTime: number }) => void;
  style?: StyleProp<ViewStyle>;
}

const KitayarVideo = forwardRef<KitayarVideoHandle, KitayarVideoProps>(({ src, paused, onProgress, style }, ref) => {
  const nativeRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    seek: (seconds: number) => {
      const node = findNodeHandle(nativeRef.current);
      if (node != null) {
        UIManager.dispatchViewManagerCommand(node, 'seek' as unknown as number, [seconds]);
      }
    },
  }));

  const _onProgress = (event: { nativeEvent: { currentTime: number } }) => {
    if (onProgress) {
      onProgress(event.nativeEvent);
    }
  };

  return (
    <NativeVideoView
      ref={nativeRef}
      style={style}
      src={src}
      paused={paused}
      onVideoProgress={_onProgress}
    />
  );
});

export default KitayarVideo;
