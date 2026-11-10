import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  requireNativeComponent,
  ViewProps,
  findNodeHandle,
  UIManager,
  Platform,
} from 'react-native';

const NativeComponent = requireNativeComponent<any>('ClassroomNoiseMeterView');

export interface SoundLevelChangeEvent {
  nativeEvent: {
    level: number;
    state: 'quiet' | 'moderate' | 'excessive';
    rms: number;
  };
}

export interface AlertTriggeredEvent {
  nativeEvent: {
    alertType: 'moderate' | 'excessive' | 'excessive_cleared';
  };
}

export interface NoiseMeterErrorEvent {
  nativeEvent: {
    code: string;
    message: string;
  };
}

export interface ClassroomNoiseMeterNativeViewProps extends ViewProps {
  isRunning?: boolean;
  isMuted?: boolean;
  sensitivity?: number;
  moderateThreshold?: number;
  excessiveThreshold?: number;
  alertModerateEnabled?: boolean;
  alertExcessiveEnabled?: boolean;
  ballStyle?: 'emojis' | 'balls' | 'bubbles' | 'eyes';
  ballCount?: number;
  onSoundLevelChange?: (event: SoundLevelChangeEvent) => void;
  onAlertTriggered?: (event: AlertTriggeredEvent) => void;
  onError?: (event: NoiseMeterErrorEvent) => void;
}

export interface ClassroomNoiseMeterRef {
  reset: () => void;
  start: () => void;
  stop: () => void;
}

export const ClassroomNoiseMeterNativeView = forwardRef<
  ClassroomNoiseMeterRef,
  ClassroomNoiseMeterNativeViewProps
>((props, ref) => {
  const nativeRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    reset: () => {
      dispatchCommand('reset', 1);
    },
    start: () => {
      dispatchCommand('start', 2);
    },
    stop: () => {
      dispatchCommand('stop', 3);
    },
  }));

  const dispatchCommand = (commandName: string, commandId: number) => {
    if (Platform.OS !== 'android') return;
    const node = findNodeHandle(nativeRef.current);
    if (!node) return;

    if ((UIManager as any).dispatchViewManagerCommand) {
      (UIManager as any).dispatchViewManagerCommand(node, commandName, []);
    }
  };

  return <NativeComponent ref={nativeRef} {...props} />;
});
