import React from 'react';
import {
  requireNativeComponent,
  ViewProps,
  StyleSheet,
  View,
  NativeSyntheticEvent,
} from 'react-native';
import { BarcodeDetectedData } from '../../services/barcodeService';

interface NativeBarcodeCameraViewProps extends ViewProps {
  flashEnabled?: boolean;
  lensFacing?: 'back' | 'front';
  isScanningActive?: boolean;
  onBarcodeDetected?: (event: NativeSyntheticEvent<BarcodeDetectedData>) => void;
}

const NativeBarcodeCameraView =
  requireNativeComponent<NativeBarcodeCameraViewProps>('BarcodeCameraView');

export interface BarcodeCameraViewProps {
  flashEnabled?: boolean;
  lensFacing?: 'back' | 'front';
  isScanningActive?: boolean;
  onBarcodeDetected: (barcode: BarcodeDetectedData) => void;
  style?: any;
}

export const BarcodeCameraView: React.FC<BarcodeCameraViewProps> = ({
  flashEnabled = false,
  lensFacing = 'back',
  isScanningActive = true,
  onBarcodeDetected,
  style,
}) => {
  const handleBarcodeDetected = (event: NativeSyntheticEvent<BarcodeDetectedData>) => {
    if (onBarcodeDetected && event.nativeEvent) {
      onBarcodeDetected(event.nativeEvent);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <NativeBarcodeCameraView
        style={StyleSheet.absoluteFill}
        flashEnabled={flashEnabled}
        lensFacing={lensFacing}
        isScanningActive={isScanningActive}
        onBarcodeDetected={handleBarcodeDetected}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
});
