import { NativeModules, requireNativeComponent, Platform, ViewProps } from 'react-native';

const { DocumentScannerModule } = NativeModules;

export interface CornerPoint {
  x: number;
  y: number;
}

export interface DetectionResult {
  width: number;
  height: number;
  corners: CornerPoint[];
  confidence: number;
  isFallback: boolean;
  imageUri?: string;
}

export interface ProcessingResult {
  uri: string;
  width: number;
  height: number;
  filter: string;
}

export interface FilterItem {
  id: string;
  title: string;
  description: string;
}

export interface ExportPdfResult {
  uri: string;
  fileName: string;
  fileSize: number;
}

function normalizeUri(input: any): string {
  if (!input) return '';
  if (typeof input === 'string') return input;
  if (Array.isArray(input)) return normalizeUri(input[0]);
  if (typeof input === 'object') {
    if (input.uri) return normalizeUri(input.uri);
    if (input.path) return normalizeUri(input.path);
  }
  return String(input);
}

class ScannerService {
  async detectDocument(imageUri: any): Promise<DetectionResult> {
    if (Platform.OS !== 'android') {
      throw new Error('اسکنر اسناد فقط در اندروید در دسترس است');
    }
    const safeUri = normalizeUri(imageUri);
    if (!safeUri) {
      throw new Error('آدرس تصویر معتبر نیست');
    }
    return await DocumentScannerModule.detectDocument(safeUri);
  }

  async processDocument(
    imageUri: any,
    corners: CornerPoint[],
    filterMode: string = 'AUTO_ENHANCE',
    rotationDegrees: number = 0
  ): Promise<ProcessingResult> {
    if (Platform.OS !== 'android') {
      throw new Error('اسکنر اسناد فقط در اندروید در دسترس است');
    }
    const safeUri = normalizeUri(imageUri);
    return await DocumentScannerModule.processDocument(
      safeUri,
      corners,
      filterMode,
      rotationDegrees
    );
  }

  async captureCameraPhoto(): Promise<{ uri: string }> {
    if (Platform.OS !== 'android') {
      throw new Error('دوربین فقط در اندروید در دسترس است');
    }
    return await DocumentScannerModule.captureCameraPhoto();
  }

  async saveToGallery(imageUri: any, customName?: string): Promise<string> {
    if (Platform.OS !== 'android') {
      throw new Error('ذخیره در گالری فقط در اندروید در دسترس است');
    }
    const safeUri = normalizeUri(imageUri);
    return await DocumentScannerModule.saveToGallery(safeUri, customName || null);
  }

  async exportToPdf(imageUris: any[], pdfTitle?: string): Promise<ExportPdfResult> {
    if (Platform.OS !== 'android') {
      throw new Error('تولید PDF فقط در اندروید در دسترس است');
    }
    const safeUris = imageUris.map((u) => normalizeUri(u)).filter(Boolean);
    return await DocumentScannerModule.exportToPdf(safeUris, pdfTitle || null);
  }

  async getSupportedFilters(): Promise<FilterItem[]> {
    if (Platform.OS !== 'android') {
      return [];
    }
    return await DocumentScannerModule.getSupportedFilters();
  }
}

export const scannerService = new ScannerService();

export interface DocumentCameraViewProps extends ViewProps {
  flashMode?: 'OFF' | 'ON' | 'AUTO';
  cameraType?: 'BACK' | 'FRONT';
  onDocumentDetected?: (event: any) => void;
}

export const DocumentCameraView = requireNativeComponent<DocumentCameraViewProps>('DocumentCameraView');
