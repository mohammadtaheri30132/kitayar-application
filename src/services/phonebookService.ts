import { api } from '../api/axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PhoneCategory {
  _id: string;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: string | null;
  order: number;
  isEmergency: boolean;
  subcategoriesCount?: number;
  contactsCount?: number;
}

export interface PhoneContact {
  _id: string;
  title: string;
  phoneNumber: string;
  phoneSecondary?: string;
  internalNumber?: string;
  categoryId: any;
  department?: string;
  responsiblePerson?: string;
  city?: string;
  address?: string;
  description?: string;
  order: number;
  isEmergency: boolean;
}

export interface CategoryDetailResponse {
  category: PhoneCategory;
  breadcrumbs: Array<{ _id: string; title: string; parentId?: string | null }>;
  subcategories: PhoneCategory[];
  contacts: PhoneContact[];
}

const CACHE_KEY_ROOT = '@kitayar_phonebook_roots';
const CACHE_KEY_EMERGENCY = '@kitayar_phonebook_emergency';
const CACHE_KEY_CAT_PREFIX = '@kitayar_phonebook_cat_';

export const toPersianDigits = (num: number | string): string => {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/[0-9]/g, w => farsiDigits[+w]);
};

// Fallback emergency data if offline on first open
export const FALLBACK_EMERGENCY_CONTACTS: PhoneContact[] = [
  { _id: 'em-1', title: 'اورژانس کشور', phoneNumber: '115', department: 'فوریت‌های پزشکی', isEmergency: true, description: 'امداد فوریت‌های پزشکی ۲۴ ساعته', order: 1, categoryId: 'em' },
  { _id: 'em-2', title: 'آتش‌نشانی و خدمات ایمنی', phoneNumber: '125', department: 'ایمنی و نجات', isEmergency: true, description: 'حوادث آتش‌سوزی و امداد و نجات', order: 2, categoryId: 'em' },
  { _id: 'em-3', title: 'پلیس ۱۱۰ (فوریت‌های پلیسی)', phoneNumber: '110', department: 'انتظامی', isEmergency: true, description: 'امداد و فوریت‌های پلیسی', order: 3, categoryId: 'em' },
  { _id: 'em-4', title: 'هلال احمر (امداد و نجات)', phoneNumber: '112', department: 'امداد کوهستان و جاده', isEmergency: true, description: 'امداد بدون سیم‌کارت', order: 4, categoryId: 'em' },
  { _id: 'em-5', title: 'اورژانس اجتماعی (بهزیستی)', phoneNumber: '123', department: 'مشاوره و آسیب‌های اجتماعی', isEmergency: true, description: 'مداخله در بحران‌های فردی و خانوادگی', order: 5, categoryId: 'em' },
  { _id: 'em-6', title: 'پلیس فتا (جرایم سایبری)', phoneNumber: '096380', department: 'امنیت سایبری', isEmergency: true, description: 'مرکز فوریت‌های سایبری و کلاهبرداری', order: 6, categoryId: 'em' },
  { _id: 'em-7', title: 'اطلاعات دارویی و سموم', phoneNumber: '190', department: 'دارو و درمان', isEmergency: true, description: 'مرکز پاسخگویی وزارت بهداشت', order: 7, categoryId: 'em' },
];

export const phonebookService = {
  /**
   * Get top-level root categories with caching
   */
  async getRootCategories(): Promise<PhoneCategory[]> {
    try {
      const res = await api.get('/public/phonebook/categories');
      if (res.data?.success && Array.isArray(res.data.categories)) {
        await AsyncStorage.setItem(CACHE_KEY_ROOT, JSON.stringify(res.data.categories));
        return res.data.categories;
      }
    } catch (e) {
      console.warn('Network error loading phonebook roots, checking cache:', e);
    }

    // Cache fallback
    const cached = await AsyncStorage.getItem(CACHE_KEY_ROOT);
    if (cached) {
      return JSON.parse(cached);
    }

    return [];
  },

  /**
   * Get category children (subcategories, contacts, breadcrumbs)
   */
  async getCategoryDetails(categoryId: string): Promise<CategoryDetailResponse> {
    const cacheKey = `${CACHE_KEY_CAT_PREFIX}${categoryId}`;

    try {
      const res = await api.get(`/public/phonebook/categories/${categoryId}`);
      if (res.data?.success) {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(res.data));
        return res.data;
      }
    } catch (e) {
      console.warn(`Network error loading category ${categoryId}, checking cache:`, e);
    }

    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    throw new Error('امکان دریافت اطلاعات این دسته‌بندی وجود ندارد.');
  },

  /**
   * Get emergency contacts
   */
  async getEmergencyContacts(): Promise<PhoneContact[]> {
    try {
      const res = await api.get('/public/phonebook/emergency');
      if (res.data?.success && Array.isArray(res.data.contacts)) {
        await AsyncStorage.setItem(CACHE_KEY_EMERGENCY, JSON.stringify(res.data.contacts));
        return res.data.contacts;
      }
    } catch (e) {
      console.warn('Network error loading emergency contacts:', e);
    }

    const cached = await AsyncStorage.getItem(CACHE_KEY_EMERGENCY);
    if (cached) {
      return JSON.parse(cached);
    }

    return FALLBACK_EMERGENCY_CONTACTS;
  },

  /**
   * Global search across contacts and categories
   */
  async search(query: string): Promise<{ contacts: PhoneContact[]; categories: PhoneCategory[] }> {
    if (!query.trim()) return { contacts: [], categories: [] };

    try {
      const res = await api.get('/public/phonebook/search', { params: { q: query } });
      if (res.data?.success) {
        return {
          contacts: res.data.contacts || [],
          categories: res.data.categories || [],
        };
      }
    } catch (e) {
      console.warn('Search error:', e);
    }

    return { contacts: [], categories: [] };
  },
};
