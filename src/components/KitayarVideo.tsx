import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { requireNativeComponent, UIManager, findNodeHandle } from 'react-native';

const NativeVideoView = requireNativeComponent('KitayarVideoView');

const KitayarVideo = forwardRef(({ src, paused, onProgress, style }, ref) => {
  const nativeRef = useRef(null);

  useImperativeHandle(ref, () => ({
    seek: (seconds) => {
      UIManager.dispatchViewManagerCommand(
        findNodeHandle(nativeRef.current),
        'seek',
        [seconds]
      );
    }
  }));

  const _onProgress = (event) => {
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