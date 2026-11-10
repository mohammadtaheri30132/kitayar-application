import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken } from '../utils/storage';
import { generateHMACSignature } from '../utils/security';

// کلیدهای ذخیره‌سازی وضعیت سرور در حافظه پایدار اپ
export const SERVER_MODE_STORAGE_KEY = '@kitayar_server_mode';
export const CUSTOM_LOCAL_URL_STORAGE_KEY = '@kitayar_custom_local_url';

// آدرس‌های دو حالت:
// ۱. سرور آنلاین کیتایار (پیش‌فرض پروداکشن)
export const PROD_SERVER_URL = 'https://class.kitayar.ir/api';

// ۲. سرور محلی (حالت توسعه و شبیه‌ساز)
export const DEFAULT_LOCAL_SERVER_URL = 'http://10.0.2.2:5001/api';

export type ServerMode = 'server' | 'local';

// مقدار اولیه پیش‌فرض: سرور آنلاین
export let BASE_URL = PROD_SERVER_URL;

// لیست مسیرهایی که باید با HMAC امضا بشن
const SECURE_ROUTES = [
  '/teacher/builder/generate'
];

export const api = axios.create({
  baseURL: PROD_SERVER_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// اینترسپتور درخواست‌ها (Request Interceptor)
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const isSecureRoute = SECURE_ROUTES.some(route => config.url?.includes(route));

    if (isSecureRoute) {
      const timestamp = Date.now().toString();
      const endpoint = `/api${config.url}`;

      const signature = generateHMACSignature(timestamp, endpoint, config.data);

      config.headers['x-timestamp'] = timestamp;
      config.headers['x-signature'] = signature;
    }

    if (__DEV__) {
      const method = (config.method || 'GET').toUpperCase();
      const fullUrl = (config.baseURL || '') + (config.url || '');
      console.log(`📡 [API Request] [${method}] ${fullUrl}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// اینترسپتور پاسخ‌ها و خطاهای شبکه
api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      const method = (response.config.method || 'GET').toUpperCase();
      const fullUrl = (response.config.baseURL || '') + (response.config.url || '');
      console.log(`✅ [API Success] [${method}] ${fullUrl} (کد: ${response.status})`);
    }
    return response;
  },
  (error) => {
    const config = error.config || {};
    const method = (config.method || 'GET').toUpperCase();
    const fullUrl = (config.baseURL || '') + (config.url || '');
    const status = error.response ? error.response.status : (error.code || 'NO_RESPONSE');
    const responseData = error.response?.data;

    console.error(
      `🚨 [خطای API] ----------------------------------------\n` +
      `🌐 مسیر: [${method}] ${fullUrl}\n` +
      `⚠️ وضعیت: ${status} (${error.message})\n` +
      `📦 پارامترها: ${JSON.stringify(config.params || {})}\n` +
      `📄 پاسخ سرور: ${JSON.stringify(responseData || 'پاسخی دریافت نشد - بررسی اتصال اینترنت یا سرور')}\n` +
      `-------------------------------------------------------`
    );

    error.message = `${error.message} [مسیر: ${method} ${fullUrl}]`;
    error.url = fullUrl;
    error.method = method;
    error.status = status;

    return Promise.reject(error);
  }
);

// دریافت تنظیمات جاری سرور
export async function getServerConfig(): Promise<{ mode: ServerMode; url: string }> {
  try {
    const savedMode = await AsyncStorage.getItem(SERVER_MODE_STORAGE_KEY);
    if (savedMode === 'local') {
      const customUrl = await AsyncStorage.getItem(CUSTOM_LOCAL_URL_STORAGE_KEY);
      const url = customUrl?.trim() || DEFAULT_LOCAL_SERVER_URL;
      return { mode: 'local', url };
    }
  } catch (e) {
    console.warn('Error reading server config:', e);
  }
  return { mode: 'server', url: PROD_SERVER_URL };
}

// تغییر حالت سرور و به‌روزرسانی آنی axios instance
export async function setServerMode(mode: ServerMode, customLocalUrl?: string): Promise<string> {
  let targetUrl = PROD_SERVER_URL;
  if (mode === 'local') {
    targetUrl = customLocalUrl?.trim() || DEFAULT_LOCAL_SERVER_URL;
    await AsyncStorage.setItem(SERVER_MODE_STORAGE_KEY, 'local');
    if (customLocalUrl) {
      await AsyncStorage.setItem(CUSTOM_LOCAL_URL_STORAGE_KEY, customLocalUrl.trim());
    }
  } else {
    targetUrl = PROD_SERVER_URL;
    await AsyncStorage.setItem(SERVER_MODE_STORAGE_KEY, 'server');
  }

  api.defaults.baseURL = targetUrl;
  BASE_URL = targetUrl;
  return targetUrl;
}

// بررسی سلامت ارتباط با سرور
export async function checkServerHealth(testUrl?: string): Promise<{ ok: boolean; message: string; ms: number }> {
  const target = (testUrl || api.defaults.baseURL || PROD_SERVER_URL).replace(/\/+$/, '');
  const healthUrl = `${target}/health`;
  const start = Date.now();
  try {
    const res = await axios.get(healthUrl, { timeout: 6000 });
    const ms = Date.now() - start;
    if (res.status === 200) {
      return { ok: true, message: 'ارتباط با سرور برقرار است', ms };
    }
    return { ok: false, message: `پاسخ با کد ${res.status}`, ms };
  } catch (err: any) {
    const ms = Date.now() - start;
    return { ok: false, message: err?.message || 'خطا در برقراری ارتباط', ms };
  }
}

// بارگذاری تنظیمات در استارتاپ برنامه
(async () => {
  try {
    const { mode, url } = await getServerConfig();
    api.defaults.baseURL = url;
    BASE_URL = url;
  } catch {}
})();
