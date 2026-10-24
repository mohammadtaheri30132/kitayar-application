export type DeviceCategory = 'projector' | 'ac' | 'tv';

export type VerificationStatus = 'verified' | 'candidate' | 'unsupported';

export type ProtocolType = 
  | 'NEC' 
  | 'NEC_EXTENDED' 
  | 'SAMSUNG' 
  | 'SONY_12' 
  | 'SONY_15' 
  | 'SONY_20' 
  | 'RAW';

export interface IrCommand {
  id: string;
  label: string;
  protocol: ProtocolType;
  frequency?: number; // default 38000 Hz
  address?: number;
  command?: number;
  rawPattern?: number[]; // Timing pulses in microseconds
  isExtended?: boolean;
  isPowerOffConfirm?: boolean; // For projectors that require confirmation warning
  testPriority?: number; // 1 = highest recommendation for safe testing (e.g. Mute, Info)
}

export interface AcStateConfig {
  minTemp: number; // typically 16
  maxTemp: number; // typically 30
  supportedModes: Array<'cool' | 'heat' | 'dry' | 'fan' | 'auto'>;
  supportedFanSpeeds: Array<'auto' | 'low' | 'med' | 'high'>;
  hasSwing: boolean;
}

export interface IrProfile {
  id: string;
  category: DeviceCategory;
  brand: string;
  brandFa: string;
  modelFamily: string;
  verificationStatus: VerificationStatus;
  provenance: string;
  testNotes: string;
  commands: IrCommand[];
  acStateConfig?: AcStateConfig;
}

export interface SavedRemote {
  id: string;
  name: string;
  roomName: string;
  category: DeviceCategory;
  brand: string;
  profileId: string;
  createdAt: number;
  lastUsedAt: number;
}

export interface IrCapabilities {
  hasEmitter: boolean;
  carrierFrequencies: Array<{ minFrequency: number; maxFrequency: number }>;
  unsupportedMessage?: string;
}

export interface TransmitResult {
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  pulseCount?: number;
  protocol?: string;
}
