import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  requireNativeComponent,
  ViewProps,
  findNodeHandle,
  UIManager,
  NativeSyntheticEvent
} from 'react-native';

const NativeComponent = requireNativeComponent<any>('InfiniteCanvasView');

export interface ViewportChangeEvent {
  scale: number;
  panX: number;
  panY: number;
}

export interface SelectionChangeEvent {
  hasSelection: boolean;
  count: number;
  selectedType: string;
  text: string;
  color: string;
  width: number;
}

export interface HistoryChangeEvent {
  canUndo: boolean;
  canRedo: boolean;
}

export interface DocumentChangeEvent {
  elementCount: number;
}

export interface TextEditRequestEvent {
  elementId: string;
  currentText: string;
  fontSize: number;
  color: string;
  worldX: number;
  worldY: number;
}

export interface InfiniteCanvasNativeViewProps extends ViewProps {
  activeTool?: 'pen' | 'pencil' | 'brush' | 'highlighter' | 'eraser' | 'shape' | 'text' | 'select';
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  shapeType?: string;
  shapeFillColor?: string;
  shapeStrokeStyle?: 'solid' | 'dashed' | 'dotted';
  shapeStartArrow?: boolean;
  shapeEndArrow?: boolean;
  gridType?: 'none' | 'grid' | 'dots' | 'lines';
  gridColor?: string;
  gridSpacing?: number;
  canvasBackgroundColor?: string;
  isReadOnly?: boolean;

  onViewportChange?: (e: NativeSyntheticEvent<ViewportChangeEvent>) => void;
  onSelectionChange?: (e: NativeSyntheticEvent<SelectionChangeEvent>) => void;
  onHistoryChange?: (e: NativeSyntheticEvent<HistoryChangeEvent>) => void;
  onDocumentChange?: (e: NativeSyntheticEvent<DocumentChangeEvent>) => void;
  onTextEditRequest?: (e: NativeSyntheticEvent<TextEditRequestEvent>) => void;
}

export interface InfiniteCanvasRef {
  undo: () => void;
  redo: () => void;
  clear: () => void;
  resetViewport: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToContent: () => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  addText: (text: string, fontSize?: number, color?: string, isBold?: boolean, isItalic?: boolean, wx?: number, wy?: number) => void;
  updateText: (text: string, fontSize?: number, color?: string) => void;
  addImage: (uri: string) => void;
  loadDocument: (jsonStr: string) => void;
  selectAll: () => void;
}

export const InfiniteCanvasNativeView = forwardRef<InfiniteCanvasRef, InfiniteCanvasNativeViewProps>((props, ref) => {
  const nativeRef = useRef<any>(null);

  const dispatch = (commandName: string, args: any[] = []) => {
    if (!nativeRef.current) return;
    const tag = findNodeHandle(nativeRef.current);
    if (tag) {
      const config = UIManager.getViewManagerConfig ? UIManager.getViewManagerConfig('InfiniteCanvasView') : (UIManager as any).InfiniteCanvasView;
      const cmdId = config?.Commands?.[commandName] ?? commandName;
      UIManager.dispatchViewManagerCommand(tag, cmdId, args);
    }
  };

  useImperativeHandle(ref, () => ({
    undo: () => dispatch('undo'),
    redo: () => dispatch('redo'),
    clear: () => dispatch('clear'),
    resetViewport: () => dispatch('resetViewport'),
    zoomIn: () => dispatch('zoomIn'),
    zoomOut: () => dispatch('zoomOut'),
    fitToContent: () => dispatch('fitToContent'),
    deleteSelected: () => dispatch('deleteSelected'),
    duplicateSelected: () => dispatch('duplicateSelected'),
    bringForward: () => dispatch('bringForward'),
    sendBackward: () => dispatch('sendBackward'),
    addText: (text: string, fontSize = 24, color = '#000000', isBold = false, isItalic = false, wx?: number, wy?: number) => {
      dispatch('addText', [text, fontSize, color, isBold, isItalic, wx ?? null, wy ?? null]);
    },
    updateText: (text: string, fontSize?: number, color?: string) => {
      dispatch('updateText', [text, fontSize ?? null, color ?? null]);
    },
    addImage: (uri: string) => dispatch('addImage', [uri]),
    loadDocument: (jsonStr: string) => dispatch('loadDocument', [jsonStr]),
    selectAll: () => dispatch('selectAll'),
  }));

  return <NativeComponent ref={nativeRef} {...props} />;
});
