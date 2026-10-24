import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { BarcodeModule } = NativeModules;

if (Platform.OS === 'android' && !BarcodeModule) {
  console.warn('BarcodeModule is not available. Native barcode features will not work.');
}

export type BarcodeFormat =
  | 'QR_CODE'
  | 'CODE_128'
  | 'CODE_39'
  | 'EAN_13'
  | 'EAN_8'
  | 'UPC_A'
  | 'UPC_E'
  | 'PDF_417'
  | 'AZTEC'
  | 'DATA_MATRIX';

export type BarcodeContentType =
  | 'URL'
  | 'TEXT'
  | 'WIFI'
  | 'PHONE'
  | 'SMS'
  | 'EMAIL'
  | 'GEO'
  | 'CONTACT'
  | 'PRODUCT'
  | 'ISBN';

export interface BarcodeDetectedData {
  value: string;
  displayValue?: string;
  format: string;
  type: BarcodeContentType;
  url?: { url: string; title?: string };
  wifi?: { ssid: string; password?: string; encryptionType?: number };
  phone?: { number: string };
  sms?: { phoneNumber: string; message?: string };
  contact?: {
    name?: string;
    organization?: string;
    title?: string;
    phone?: string;
    email?: string;
  };
}

export interface GenerateBarcodeOptions {
  content: string;
  format?: BarcodeFormat;
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  includeText?: boolean;
}

export interface GeneratedBarcodeResult {
  uri: string;
  filePath: string;
  base64: string;
  width: number;
  height: number;
  format: string;
  content: string;
}

export interface BarcodeHistoryItem {
  id: string;
  value: string;
  displayValue?: string;
  format: string;
  type: string;
  timestamp: number;
  isGenerated?: boolean;
  imageUri?: string;
}

const STORAGE_KEY_SCANNED = '@kitayar_barcode_scanned_history';
const STORAGE_KEY_GENERATED = '@kitayar_barcode_generated_history';

export const barcodeService = {
  /**
   * Generates a Barcode or QR Code into a high-res Bitmap & PNG
   */
  async generateBarcode(options: GenerateBarcodeOptions): Promise<GeneratedBarcodeResult> {
    if (!BarcodeModule) {
      throw new Error('BarcodeModule is not available on this platform.');
    }
    return await BarcodeModule.generateBarcode(options);
  },

  /**
   * Scans a barcode from an image file/URI (e.g. from gallery)
   */
  async scanFromImage(imageUri: string): Promise<{ found: boolean } & Partial<BarcodeDetectedData>> {
    if (!BarcodeModule) {
      throw new Error('BarcodeModule is not available on this platform.');
    }
    return await BarcodeModule.scanFromImage(imageUri);
  },

  /**
   * Saves barcode image to device gallery (Pictures/Kitayar/Barcodes)
   */
  async saveToGallery(filePathOrUri: string, fileName = 'barcode'): Promise<string> {
    if (!BarcodeModule) {
      throw new Error('BarcodeModule is not available on this platform.');
    }
    return await BarcodeModule.saveBarcodeToGallery(filePathOrUri, fileName);
  },

  /**
   * Scanned History
   */
  async getScannedHistory(): Promise<BarcodeHistoryItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY_SCANNED);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async addScannedItem(item: Omit<BarcodeHistoryItem, 'id' | 'timestamp'>): Promise<BarcodeHistoryItem> {
    try {
      const history = await this.getScannedHistory();
      const newItem: BarcodeHistoryItem = {
        ...item,
        id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        isGenerated: false,
      };

      // Keep up to 100 items, avoid exact duplicate as top item
      const filtered = history.filter(h => h.value !== newItem.value);
      const updated = [newItem, ...filtered].slice(0, 100);
      await AsyncStorage.setItem(STORAGE_KEY_SCANNED, JSON.stringify(updated));
      return newItem;
    } catch (err) {
      console.warn('Error saving scanned item:', err);
      return {
        ...item,
        id: String(Date.now()),
        timestamp: Date.now(),
      };
    }
  },

  async clearScannedHistory(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY_SCANNED);
  },

  /**
   * Generated History
   */
  async getGeneratedHistory(): Promise<BarcodeHistoryItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY_GENERATED);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async addGeneratedItem(item: Omit<BarcodeHistoryItem, 'id' | 'timestamp'>): Promise<BarcodeHistoryItem> {
    try {
      const history = await this.getGeneratedHistory();
      const newItem: BarcodeHistoryItem = {
        ...item,
        id: `gen_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        isGenerated: true,
      };

      const updated = [newItem, ...history].slice(0, 100);
      await AsyncStorage.setItem(STORAGE_KEY_GENERATED, JSON.stringify(updated));
      return newItem;
    } catch (err) {
      console.warn('Error saving generated item:', err);
      return {
        ...item,
        id: String(Date.now()),
        timestamp: Date.now(),
      };
    }
  },

  async clearGeneratedHistory(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY_GENERATED);
  },
};
