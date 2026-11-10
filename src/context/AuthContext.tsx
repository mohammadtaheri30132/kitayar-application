import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { getToken, saveToken, removeToken } from '../utils/storage';

// تعریف ساختار داده‌های کانتکست
interface AuthContextType {
  isLoading: boolean;
  userToken: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  connectionError: boolean;
  retryConnection: () => void;
  needsScheduleSetup: boolean;
  setNeedsScheduleSetup: (needs: boolean) => void;
  checkScheduleStatus: () => Promise<boolean>;
}

// ساخت کانتکست
export const AuthContext = createContext<AuthContextType>({
  isLoading: true,
  userToken: null,
  login: async () => {},
  logout: async () => {},
  connectionError: false,
  retryConnection: () => {},
  needsScheduleSetup: false,
  setNeedsScheduleSetup: () => {},
  checkScheduleStatus: async () => false,
});

// ساخت Provider (پوشش‌دهنده‌ای که داده‌ها را به کل اپلیکیشن تزریق می‌کند)
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const [needsScheduleSetup, setNeedsScheduleSetup] = useState(false);

  // بررسی وضعیت برنامه هفتگی معلم
  const checkScheduleStatus = async (): Promise<boolean> => {
    try {
      const { api } = require('../api/axiosConfig');
      const schedRes = await api.get('/teacher/schedule');
      if (schedRes.data?.success && Array.isArray(schedRes.data.data)) {
        const needs = schedRes.data.data.length === 0;
        setNeedsScheduleSetup(needs);
        return needs;
      }
    } catch (e) {
      console.warn('checkScheduleStatus failed:', e);
    }
    return false;
  };

  // بررسی توکن هنگام باز شدن اپلیکیشن
  const checkInitialToken = async () => {
    setIsLoading(true);
    setConnectionError(false);
    try {
      // بررسی اتصال به سرور (با پینگ سلامت سرور)
      const { api, getServerConfig } = require('../api/axiosConfig');
      try {
        const cfg = await getServerConfig();
        if (cfg?.url) {
          api.defaults.baseURL = cfg.url;
        }
        await api.get('/health', { timeout: 8000 });
      } catch (err) {
        setConnectionError(true);
        return; // توقف در صفحه اسپلش
      }

      const [token] = await Promise.all([
        getToken(),
        new Promise(resolve => setTimeout(resolve, 1500))
      ]);

      if (token) {
        try {
          const schedRes = await api.get('/teacher/schedule', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (schedRes.data?.success && Array.isArray(schedRes.data.data)) {
            setNeedsScheduleSetup(schedRes.data.data.length === 0);
          }
        } catch (e) {
          console.warn('Initial schedule check failed:', e);
        }
      }

      setUserToken(token);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching token:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkInitialToken();
  }, []);

  // تابع لاگین (که در صفحات ورود صدا می‌زنیم)
  const login = async (token: string) => {
    await saveToken(token);
    try {
      const { api } = require('../api/axiosConfig');
      const schedRes = await api.get('/teacher/schedule', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (schedRes.data?.success && Array.isArray(schedRes.data.data)) {
        setNeedsScheduleSetup(schedRes.data.data.length === 0);
      }
    } catch (e) {
      console.warn('Login schedule check failed:', e);
    }
    setUserToken(token); // این خط باعث می‌شود مسیرها اتوماتیک عوض شوند
  };

  // تابع خروج
  const logout = async () => {
    await removeToken();
    setNeedsScheduleSetup(false);
    setUserToken(null);
  };

  return (
    <AuthContext.Provider value={{
      isLoading,
      userToken,
      login,
      logout,
      connectionError,
      retryConnection: checkInitialToken,
      needsScheduleSetup,
      setNeedsScheduleSetup,
      checkScheduleStatus,
    }}>
      {children}
    </AuthContext.Provider>
  );
};