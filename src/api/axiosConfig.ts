import axios from 'axios';
import { getToken } from '../utils/storage';
import { generateHMACSignature } from '../utils/security';

const BASE_URL = 'http://192.168.1.128:5001/api';

// 👈 لیست مسیرهایی که باید با HMAC امضا بشن
const SECURE_ROUTES = [
  '/teacher/builder/generate'
];

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // چک می‌کنیم مسیر درخواستی تو لیست امنیتی ما هست یا نه
    const isSecureRoute = SECURE_ROUTES.some(route => config.url?.includes(route));
    
    if (isSecureRoute) {
      const timestamp = Date.now().toString();
      const endpoint = `/api${config.url}`; 
      
      const signature = generateHMACSignature(timestamp, endpoint, config.data);

      config.headers['x-timestamp'] = timestamp;
      config.headers['x-signature'] = signature;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// اینترسپتور ریسپانس رو کلاً نیازی نداریم، چون رمزنگاری (AES) حذف شد.