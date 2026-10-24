import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  IrCapabilities,
  IrCommand,
  IrProfile,
  SavedRemote,
  TransmitResult,
} from '../data/ir/types';
import {
  AcDesiredState,
  generateGreeAcRawPattern,
  generateLgAcRawPattern,
} from '../data/ir/acGenerators';

const { KitayarIrModule } = NativeModules;
const SAVED_REMOTES_STORAGE_KEY = '@kitayar_saved_remotes';

export const HARDWARE_UNSUPPORTED_PERSIAN_MESSAGE =
  'گوشی شما به فرستنده مادون قرمز مجهز نیست و نمیتواند از این قابلیت استفاده کند.';

class IrService {
  /**
   * Check physical infrared capabilities
   */
  async checkCapabilities(): Promise<IrCapabilities> {
    if (Platform.OS !== 'android' || !KitayarIrModule) {
      return {
        hasEmitter: false,
        carrierFrequencies: [],
        unsupportedMessage: HARDWARE_UNSUPPORTED_PERSIAN_MESSAGE,
      };
    }

    try {
      const caps = await KitayarIrModule.getIrCapabilities();
      return {
        hasEmitter: !!caps.hasEmitter,
        carrierFrequencies: caps.carrierFrequencies || [],
        unsupportedMessage: caps.hasEmitter
          ? undefined
          : HARDWARE_UNSUPPORTED_PERSIAN_MESSAGE,
      };
    } catch (e) {
      console.warn('Error reading IR capabilities:', e);
      return {
        hasEmitter: false,
        carrierFrequencies: [],
        unsupportedMessage: HARDWARE_UNSUPPORTED_PERSIAN_MESSAGE,
      };
    }
  }

  /**
   * Transmit command according to profile protocol or dynamic AC generator
   */
  async transmitCommand(
    profile: IrProfile,
    command: IrCommand,
    acState?: AcDesiredState,
    isSimulationMode: boolean = false
  ): Promise<TransmitResult> {
    if (isSimulationMode || !KitayarIrModule) {
      // Simulation / UI Inspection mode for non-IR test devices
      return {
        success: true,
        protocol: command.protocol,
        pulseCount: 67,
      };
    }

    try {
      // 1. Dynamic Air Conditioner state frames
      if (profile.category === 'ac' && acState) {
        let rawPattern: number[] | null = null;

        if (profile.id.includes('gree') || profile.id.includes('general') || profile.id.includes('gplus') || profile.id.includes('iranradiator')) {
          rawPattern = generateGreeAcRawPattern(acState);
        } else if (profile.id.includes('lg')) {
          rawPattern = generateLgAcRawPattern(acState);
        }

        if (rawPattern && rawPattern.length > 0) {
          return await KitayarIrModule.transmitRaw(38000, rawPattern);
        }
      }

      // 2. Raw Timing pattern
      if (command.protocol === 'RAW' && command.rawPattern && command.rawPattern.length > 0) {
        return await KitayarIrModule.transmitRaw(
          command.frequency || 38000,
          command.rawPattern
        );
      }

      // 3. NEC & NEC Extended
      if (command.protocol === 'NEC' || command.protocol === 'NEC_EXTENDED') {
        const address = command.address ?? 0x00;
        const cmd = command.command ?? 0x00;
        const isExtended = command.protocol === 'NEC_EXTENDED' || !!command.isExtended;
        const freq = command.frequency || 38000;
        return await KitayarIrModule.transmitNec(address, cmd, isExtended, freq);
      }

      // 4. Samsung
      if (command.protocol === 'SAMSUNG') {
        const address = command.address ?? 0x07;
        const cmd = command.command ?? 0x00;
        return await KitayarIrModule.transmitSamsung(address, cmd);
      }

      // 5. Sony SIRC
      if (command.protocol.startsWith('SONY_')) {
        const cmd = command.command ?? 0x00;
        const address = command.address ?? 0x01;
        let bits = 12;
        if (command.protocol === 'SONY_15') bits = 15;
        if (command.protocol === 'SONY_20') bits = 20;
        return await KitayarIrModule.transmitSony(cmd, address, bits);
      }

      return {
        success: false,
        errorCode: 'UNSUPPORTED_PROTOCOL',
        errorMessage: `پروتکل ${command.protocol} پشتیبانی نمی‌شود.`,
      };
    } catch (e: any) {
      console.warn('Transmission error:', e);
      return {
        success: false,
        errorCode: 'TRANSMISSION_EXCEPTION',
        errorMessage: e?.message || 'خطا در برقراری ارتباط با فرستنده مادون قرمز',
      };
    }
  }

  // ==========================================
  // LOCAL STORAGE / SAVED REMOTES
  // ==========================================

  async getSavedRemotes(): Promise<SavedRemote[]> {
    try {
      const data = await AsyncStorage.getItem(SAVED_REMOTES_STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data) as SavedRemote[];
    } catch (e) {
      console.warn('Error reading saved remotes:', e);
      return [];
    }
  }

  async saveRemote(
    params: Omit<SavedRemote, 'id' | 'createdAt' | 'lastUsedAt'>
  ): Promise<SavedRemote> {
    const remotes = await this.getSavedRemotes();
    const newRemote: SavedRemote = {
      ...params,
      id: `remote_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    };
    remotes.unshift(newRemote);
    await AsyncStorage.setItem(
      SAVED_REMOTES_STORAGE_KEY,
      JSON.stringify(remotes)
    );
    return newRemote;
  }

  async deleteRemote(id: string): Promise<boolean> {
    try {
      const remotes = await this.getSavedRemotes();
      const filtered = remotes.filter((r) => r.id !== id);
      await AsyncStorage.setItem(
        SAVED_REMOTES_STORAGE_KEY,
        JSON.stringify(filtered)
      );
      return true;
    } catch (e) {
      console.warn('Error deleting remote:', e);
      return false;
    }
  }

  async updateLastUsed(id: string): Promise<void> {
    try {
      const remotes = await this.getSavedRemotes();
      const index = remotes.findIndex((r) => r.id === id);
      if (index !== -1) {
        remotes[index].lastUsedAt = Date.now();
        await AsyncStorage.setItem(
          SAVED_REMOTES_STORAGE_KEY,
          JSON.stringify(remotes)
        );
      }
    } catch (e) {
      console.warn('Error updating last used remote:', e);
    }
  }
}

export const irService = new IrService();
