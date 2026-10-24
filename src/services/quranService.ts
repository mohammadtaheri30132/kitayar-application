import AsyncStorage from '@react-native-async-storage/async-storage';
import { QURAN_SURAHS, SurahMeta } from '../data/quranSurahs';

export interface AyahItem {
  chapter: number;
  verse: number;
  arabicText: string;
  persianTranslation: string;
  audioUrl: string;
}

export interface SurahData {
  meta: SurahMeta;
  verses: AyahItem[];
}

export interface ReciterInfo {
  id: string;
  name: string;
  subname: string;
  folder: string;
  bitrate: string;
}

export interface TranslationEdition {
  id: string;
  name: string;
  translator: string;
}

export interface LastReadState {
  surahId: number;
  verseNumber: number;
  timestamp: number;
  surahName: string;
}

export interface QuranSettings {
  arabicFontSize: number;
  persianFontSize: number;
  showTranslation: boolean;
  themeMode: 'light' | 'sepia' | 'dark';
  reciterId: string;
  translationEditionId: string;
  continuousAudio: boolean;
}

export const RECITERS: ReciterInfo[] = [
  {
    id: 'parhizgar',
    name: 'استاد شهریار پرهیزگار',
    subname: 'ترتیل آموزشی (ایران)',
    folder: 'Parhizgar_48kbps',
    bitrate: '48kbps',
  },
  {
    id: 'karim-mansoori',
    name: 'استاد کریم منصوری',
    subname: 'ترتیل مجلسی (ایران)',
    folder: 'Karim_Mansoori_40kbps',
    bitrate: '40kbps',
  },
  {
    id: 'alafasy',
    name: 'استاد مشاری راشد العفاسی',
    subname: 'ترتیل استاندارد',
    folder: 'Alafasy_128kbps',
    bitrate: '128kbps',
  },
  {
    id: 'abdul-basit-murattal',
    name: 'استاد عبدالباسط عبدالصمد',
    subname: 'ترتیل',
    folder: 'Abdul_Basit_Murattal_192kbps',
    bitrate: '192kbps',
  },
  {
    id: 'abdul-basit-mujawwad',
    name: 'استاد عبدالباسط عبدالصمد',
    subname: 'تحقیق و تجوید',
    folder: 'Abdul_Basit_Mujawwad_128kbps',
    bitrate: '128kbps',
  },
  {
    id: 'minshawy',
    name: 'استاد محمد صدیق منشاوی',
    subname: 'ترتیل حزن‌انگیز',
    folder: 'Minshawy_Murattal_128kbps',
    bitrate: '128kbps',
  },
  {
    id: 'husary',
    name: 'استاد محمود خلیل الحصری',
    subname: 'ترتیل و تجوید دقیق',
    folder: 'Husary_128kbps',
    bitrate: '128kbps',
  },
  {
    id: 'ghamadi',
    name: 'استاد سعد الغامدی',
    subname: 'ترتیل روان',
    folder: 'Ghamadi_40kbps',
    bitrate: '40kbps',
  },
];

export const TRANSLATION_EDITIONS: TranslationEdition[] = [
  {
    id: 'fas-hussainansarian',
    name: 'استاد حسین انصاریان',
    translator: 'حسین انصاریان',
  },
  {
    id: 'fas-mohammadmahdifo',
    name: 'استاد محمدمهدی فولادوند',
    translator: 'محمدمهدی فولادوند',
  },
  {
    id: 'fas-nasermakaremshi',
    name: 'آیت‌الله مکارم شیرازی',
    translator: 'ناصر مکارم شیرازی',
  },
  {
    id: 'fas-mohsengharaati',
    name: 'حجت‌الاسلام محسن قرائتی',
    translator: 'محسن قرائتی',
  },
  {
    id: 'fas-mahdielahighoms',
    name: 'مهدی الهی قمشه‌ای',
    translator: 'الهی قمشه‌ای',
  },
];

export const DEFAULT_ARABIC_EDITION = 'ara-quranuthmanihaf';
export const DEFAULT_TRANSLATION_EDITION = 'fas-hussainansarian';
export const DEFAULT_RECITER_ID = 'parhizgar';

const API_CDN_BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions';
const AUDIO_BASE = 'https://everyayah.com/data';

const STORAGE_KEY_PREFIX = '@kitayar_quran_cache_';
const STORAGE_KEY_LAST_READ = '@kitayar_quran_last_read';
const STORAGE_KEY_SETTINGS = '@kitayar_quran_settings';

export const DEFAULT_SETTINGS: QuranSettings = {
  arabicFontSize: 24,
  persianFontSize: 15,
  showTranslation: true,
  themeMode: 'light',
  reciterId: DEFAULT_RECITER_ID,
  translationEditionId: DEFAULT_TRANSLATION_EDITION,
  continuousAudio: true,
};

export const toPersianDigits = (num: number | string): string => {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/[0-9]/g, w => farsiDigits[+w]);
};

export const getAyahAudioUrl = (
  surahNumber: number,
  verseNumber: number,
  reciterFolder: string
): string => {
  const sPad = String(surahNumber).padStart(3, '0');
  const vPad = String(verseNumber).padStart(3, '0');
  return `${AUDIO_BASE}/${reciterFolder}/${sPad}${vPad}.mp3`;
};

export const quranService = {
  /**
   * Return metadata for a surah by ID (1..114)
   */
  getSurahMeta(surahId: number): SurahMeta | undefined {
    return QURAN_SURAHS.find(s => s.id === surahId);
  },

  /**
   * Return all 114 surahs
   */
  getAllSurahs(): SurahMeta[] {
    return QURAN_SURAHS;
  },

  /**
   * Fetch a surah with both Arabic text and Persian translation
   * Checks AsyncStorage cache first; if missing, fetches concurrently from CDN.
   */
  async getSurah(
    surahId: number,
    translationEditionId: string = DEFAULT_TRANSLATION_EDITION,
    reciterId: string = DEFAULT_RECITER_ID
  ): Promise<SurahData> {
    const meta = this.getSurahMeta(surahId);
    if (!meta) {
      throw new Error(`سوره شماره ${surahId} معتبر نمی‌باشد.`);
    }

    const reciter = RECITERS.find(r => r.id === reciterId) || RECITERS[0];
    const arabicEdition = DEFAULT_ARABIC_EDITION;

    const cacheKey = `${STORAGE_KEY_PREFIX}${surahId}_${arabicEdition}_${translationEditionId}`;

    // 1. Check local cache
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          // Re-inject the dynamic audio URL for the selected reciter
          const versesWithAudio: AyahItem[] = parsed.map((item: any) => ({
            ...item,
            audioUrl: getAyahAudioUrl(surahId, item.verse, reciter.folder),
          }));
          return { meta, verses: versesWithAudio };
        }
      }
    } catch (e) {
      console.warn('Error reading Quran cache:', e);
    }

    // 2. Network Fetch Concurrently
    const arabicUrl = `${API_CDN_BASE}/${arabicEdition}/${surahId}.json`;
    const translationUrl = `${API_CDN_BASE}/${translationEditionId}/${surahId}.json`;

    try {
      const [araRes, transRes] = await Promise.all([
        fetch(arabicUrl, { headers: { Accept: 'application/json' } }),
        fetch(translationUrl, { headers: { Accept: 'application/json' } }),
      ]);

      if (!araRes.ok) {
        throw new Error(`خطا در بارگذاری متن عربی سوره (${araRes.status})`);
      }
      if (!transRes.ok) {
        throw new Error(`خطا در بارگذاری ترجمه فارسی سوره (${transRes.status})`);
      }

      const araJson = await araRes.json();
      const transJson = await transRes.json();

      const araList: Array<{ chapter: number; verse: number; text: string }> =
        araJson.chapter || [];
      const transList: Array<{ chapter: number; verse: number; text: string }> =
        transJson.chapter || [];

      // Create a map of translations for accurate 1:1 verse pairing
      const transMap = new Map<number, string>();
      for (const t of transList) {
        transMap.set(t.verse, t.text);
      }

      const verses: AyahItem[] = araList.map(a => {
        const persian = transMap.get(a.verse) || '';
        return {
          chapter: a.chapter,
          verse: a.verse,
          arabicText: a.text,
          persianTranslation: persian,
          audioUrl: getAyahAudioUrl(surahId, a.verse, reciter.folder),
        };
      });

      // Save to cache for offline and instant revisit (without audio URL, so reciter can vary)
      const storableVerses = verses.map(v => ({
        chapter: v.chapter,
        verse: v.verse,
        arabicText: v.arabicText,
        persianTranslation: v.persianTranslation,
      }));
      AsyncStorage.setItem(cacheKey, JSON.stringify(storableVerses)).catch(e =>
        console.warn('Failed to cache Quran surah:', e)
      );

      return { meta, verses };
    } catch (error: any) {
      // Check if we have any cached data even for fallback translation
      try {
        const keys = await AsyncStorage.getAllKeys();
        const fallbackKey = keys.find(k => k.startsWith(`${STORAGE_KEY_PREFIX}${surahId}_`));
        if (fallbackKey) {
          const fallbackData = await AsyncStorage.getItem(fallbackKey);
          if (fallbackData) {
            const parsed = JSON.parse(fallbackData);
            const versesWithAudio: AyahItem[] = parsed.map((item: any) => ({
              ...item,
              audioUrl: getAyahAudioUrl(surahId, item.verse, reciter.folder),
            }));
            return { meta, verses: versesWithAudio };
          }
        }
      } catch (fbErr) {
        // ignore
      }

      throw new Error(
        error?.message || 'خطا در برقراری ارتباط با سرور قرآن. لطفاً اتصال اینترنت خود را بررسی کنید.'
      );
    }
  },

  /**
   * Save last read bookmark
   */
  async saveLastRead(surahId: number, verseNumber: number): Promise<void> {
    try {
      const meta = this.getSurahMeta(surahId);
      const state: LastReadState = {
        surahId,
        verseNumber,
        timestamp: Date.now(),
        surahName: meta ? meta.name : `سوره ${surahId}`,
      };
      await AsyncStorage.setItem(STORAGE_KEY_LAST_READ, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save last read:', e);
    }
  },

  /**
   * Get last read bookmark
   */
  async getLastRead(): Promise<LastReadState | null> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY_LAST_READ);
      if (json) {
        return JSON.parse(json);
      }
    } catch (e) {
      console.warn('Failed to load last read:', e);
    }
    return null;
  },

  /**
   * Load Quran user settings
   */
  async getSettings(): Promise<QuranSettings> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY_SETTINGS);
      if (json) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(json) };
      }
    } catch (e) {
      console.warn('Failed to load Quran settings:', e);
    }
    return DEFAULT_SETTINGS;
  },

  /**
   * Save Quran user settings
   */
  async saveSettings(settings: Partial<QuranSettings>): Promise<void> {
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...settings };
      await AsyncStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save Quran settings:', e);
    }
  },
};
