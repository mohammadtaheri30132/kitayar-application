import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { KitayarSensorsModule } = NativeModules;

if (Platform.OS === 'android' && !KitayarSensorsModule) {
  console.warn('KitayarSensorsModule is not available.');
}

const eventEmitter =
  Platform.OS === 'android' && KitayarSensorsModule
    ? new NativeEventEmitter(KitayarSensorsModule)
    : null;

export interface CompassData {
  heading: number; // 0 to 360 degrees from Magnetic/True North
  pitch: number;   // Incline forward/back in degrees
  roll: number;    // Incline left/right in degrees
}

export interface LightData {
  lux: number;     // Illuminance in Lux
}

export interface SeismicData {
  x: number;
  y: number;
  z: number;
  magnitude: number;
  peak: number;
  timestamp: number;
}

export interface SoundMeterData {
  db: number;
  min: number;
  max: number;
  avg: number;
  amplitude: number;
}

export interface CityLocation {
  name: string;
  province: string;
  lat: number;
  lon: number;
}

// Major cities of Iran for accurate offline Qibla & Prayer calculations
export const IRAN_CITIES: CityLocation[] = [
  { name: 'تهران', province: 'تهران', lat: 35.6892, lon: 51.3890 },
  { name: 'مشهد', province: 'خراسان رضوی', lat: 36.2605, lon: 59.6168 },
  { name: 'اصفهان', province: 'اصفهان', lat: 32.6546, lon: 51.6680 },
  { name: 'شیراز', province: 'فارس', lat: 29.5926, lon: 52.5836 },
  { name: 'تبریز', province: 'آذربایجان شرقی', lat: 38.0962, lon: 46.2738 },
  { name: 'کرج', province: 'البرز', lat: 35.8327, lon: 50.9915 },
  { name: 'قم', province: 'قم', lat: 34.6401, lon: 50.8764 },
  { name: 'اهواز', province: 'خوزستان', lat: 31.3183, lon: 48.6706 },
  { name: 'کرمانشاه', province: 'کرمانشاه', lat: 34.3142, lon: 47.0650 },
  { name: 'ارومیه', province: 'آذربایجان غربی', lat: 37.5527, lon: 45.0761 },
  { name: 'رشت', province: 'گیلان', lat: 37.2808, lon: 49.5832 },
  { name: 'زاهدان', province: 'سیستان و بلوچستان', lat: 29.4963, lon: 60.8629 },
  { name: 'همدان', province: 'همدان', lat: 34.7989, lon: 48.5150 },
  { name: 'کرمان', province: 'کرمان', lat: 30.2839, lon: 57.0834 },
  { name: 'یزد', province: 'یزد', lat: 31.8974, lon: 54.3569 },
  { name: 'اردبیل', province: 'اردبیل', lat: 38.2498, lon: 48.2933 },
  { name: 'بندرعباس', province: 'هرمزگان', lat: 27.1832, lon: 56.2666 },
  { name: 'اراک', province: 'مرکزی', lat: 34.0954, lon: 49.7013 },
  { name: 'زنجان', province: 'زنجان', lat: 36.6736, lon: 48.4787 },
  { name: 'سنندج', province: 'کردستان', lat: 35.3144, lon: 46.9923 },
  { name: 'قزوین', province: 'قزوین', lat: 36.2797, lon: 50.0049 },
  { name: 'خرم‌آباد', province: 'لرستان', lat: 33.4878, lon: 48.3558 },
  { name: 'گرگان', province: 'گلستان', lat: 36.8427, lon: 54.4439 },
  { name: 'ساری', province: 'مازندران', lat: 36.5659, lon: 53.0586 },
  { name: 'بوشهر', province: 'بوشهر', lat: 28.9220, lon: 50.8333 },
  { name: 'بیرجند', province: 'خراسان جنوبی', lat: 32.8663, lon: 59.2211 },
  { name: 'ایلام', province: 'ایلام', lat: 33.6374, lon: 46.4227 },
  { name: 'بجنورد', province: 'خراسان شمالی', lat: 37.4747, lon: 57.3290 },
  { name: 'شهرکرد', province: 'چهارمحال و بختیاری', lat: 32.3256, lon: 50.8644 },
  { name: 'یاسوج', province: 'کهگیلویه و بویراحمد', lat: 30.6684, lon: 51.5876 },
  { name: 'سمنان', province: 'سمنان', lat: 35.5769, lon: 53.3953 },
  { name: 'کاشان', province: 'اصفهان', lat: 33.9850, lon: 51.4100 },
  { name: 'دزفول', province: 'خوزستان', lat: 32.3811, lon: 48.4058 },
  { name: 'نیشابور', province: 'خراسان رضوی', lat: 36.2133, lon: 58.7958 },
  { name: 'بابل', province: 'مازندران', lat: 36.5513, lon: 52.6789 },
];

/**
 * Calculates Great-Circle Qibla bearing from True North and distance in kilometers to Mecca
 * Mecca coordinates: 21.4225° N, 39.8262° E
 */
export const calculateQibla = (lat: number, lon: number): { bearing: number; distanceKm: number } => {
  const meccaLat = 21.4225;
  const meccaLon = 39.8262;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const phi1 = toRad(lat);
  const phi2 = toRad(meccaLat);
  const deltaLambda = toRad(meccaLon - lon);

  const y = Math.sin(deltaLambda);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);

  let qiblaRad = Math.atan2(y, x);
  let qiblaDeg = (toDeg(qiblaRad) + 360) % 360;

  // Haversine distance
  const R = 6371; // Earth radius in km
  const deltaPhi = toRad(meccaLat - lat);
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = Math.round(R * c);

  return {
    bearing: Math.round(qiblaDeg * 10) / 10,
    distanceKm,
  };
};

export const sensorsService = {
  // 🧭 Compass
  async startCompass(): Promise<boolean> {
    if (!KitayarSensorsModule) return false;
    return await KitayarSensorsModule.startCompass();
  },

  async stopCompass(): Promise<boolean> {
    if (!KitayarSensorsModule) return false;
    return await KitayarSensorsModule.stopCompass();
  },

  onCompassUpdate(callback: (data: CompassData) => void) {
    if (!eventEmitter) return { remove: () => {} };
    return eventEmitter.addListener('onCompassUpdate', (data: any) => callback(data as CompassData));
  },

  // 💡 Light Meter
  async isLightSensorAvailable(): Promise<boolean> {
    if (!KitayarSensorsModule) return false;
    return await KitayarSensorsModule.isLightSensorAvailable();
  },

  async startLightSensor(): Promise<boolean> {
    if (!KitayarSensorsModule) return false;
    return await KitayarSensorsModule.startLightSensor();
  },

  async stopLightSensor(): Promise<boolean> {
    if (!KitayarSensorsModule) return false;
    return await KitayarSensorsModule.stopLightSensor();
  },

  onLightUpdate(callback: (data: LightData) => void) {
    if (!eventEmitter) return { remove: () => {} };
    return eventEmitter.addListener('onLightUpdate', (data: any) => callback(data as LightData));
  },

  // 📈 Seismograph
  async startSeismograph(): Promise<boolean> {
    if (!KitayarSensorsModule) return false;
    return await KitayarSensorsModule.startSeismograph();
  },

  async stopSeismograph(): Promise<boolean> {
    if (!KitayarSensorsModule) return false;
    return await KitayarSensorsModule.stopSeismograph();
  },

  onSeismicUpdate(callback: (data: SeismicData) => void) {
    if (!eventEmitter) return { remove: () => {} };
    return eventEmitter.addListener('onSeismicUpdate', (data: any) => callback(data as SeismicData));
  },

  // 🎙️ Sound Meter
  async startSoundMeter(intervalMs = 100): Promise<boolean> {
    if (!KitayarSensorsModule) return false;
    return await KitayarSensorsModule.startSoundMeter(intervalMs);
  },

  async stopSoundMeter(): Promise<boolean> {
    if (!KitayarSensorsModule) return false;
    return await KitayarSensorsModule.stopSoundMeter();
  },

  onSoundMeterUpdate(callback: (data: SoundMeterData) => void) {
    if (!eventEmitter) return { remove: () => {} };
    return eventEmitter.addListener('onSoundMeterUpdate', (data: any) => callback(data as SoundMeterData));
  },
};
