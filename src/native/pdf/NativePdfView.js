import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { requireNativeComponent, UIManager, findNodeHandle } from 'react-native';

const RCTKitayarNativePdfView = requireNativeComponent('KitayarNativePdfView');

export const KitayarNativePdfView = forwardRef(({ config, onPageChanged, onDocumentLoaded, onError, style }, ref) => {
  const nativeRef = useRef(null);

  useImperativeHandle(ref, () => ({
    jumpToPage: (pageNumberZeroBased) => {
      UIManager.dispatchViewManagerCommand(
        findNodeHandle(nativeRef.current),
        UIManager.KitayarNativePdfView.Commands.jumpToPage,
        [pageNumberZeroBased]
      );
    },
    resetZoom: () => {
      UIManager.dispatchViewManagerCommand(
        findNodeHandle(nativeRef.current),
        UIManager.KitayarNativePdfView.Commands.resetZoom,
        []
      );
    }
  }));

  return (
    <RCTKitayarNativePdfView
      ref={nativeRef}
      style={style}
      config={config}
      onPageChanged={onPageChanged}
      onDocumentLoaded={onDocumentLoaded}
      onError={onError}
    />
  );
});

export default KitayarNativePdfView;