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
}

// ساخت کانتکست
export const AuthContext = createContext<AuthContextType>({
  isLoading: true,
  userToken: null,
  login: async () => {},
  logout: async () => {},
  connectionError: false,
  retryConnection: () => {},
});

// ساخت Provider (پوشش‌دهنده‌ای که داده‌ها را به کل اپلیکیشن تزریق می‌کند)
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);

  // بررسی توکن هنگام باز شدن اپلیکیشن
  const checkInitialToken = async () => {
    setIsLoading(true);
    setConnectionError(false);
    try {
      // بررسی اتصال به سرور (با یک پینگ ساده)
      // استفاده از import به صورت داینامیک برای جلوگیری از دور باطل (در صورت وجود)
      const { api } = require('../api/axiosConfig');
      try {
        await api.get('/health', { timeout: 3000 });
      } catch (err) {
        setConnectionError(true);
        return; // توقف در صفحه اسپلش
      }

      const [token] = await Promise.all([
        getToken(),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
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
    setUserToken(token); // این خط باعث می‌شود مسیرها اتوماتیک عوض شوند
  };

  // تابع خروج
  const logout = async () => {
    await removeToken();
    setUserToken(null);
  };

  return (
    <AuthContext.Provider value={{ isLoading, userToken, login, logout, connectionError, retryConnection: checkInitialToken }}>
      {children}
    </AuthContext.Provider>
  );
};