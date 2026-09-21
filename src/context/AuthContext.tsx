import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { getToken, saveToken, removeToken } from '../utils/storage';

// تعریف ساختار داده‌های کانتکست
interface AuthContextType {
  isLoading: boolean;
  userToken: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ساخت کانتکست
export const AuthContext = createContext<AuthContextType>({
  isLoading: true,
  userToken: null,
  login: async () => {},
  logout: async () => {},
});

// ساخت Provider (پوشش‌دهنده‌ای که داده‌ها را به کل اپلیکیشن تزریق می‌کند)
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);

  // بررسی توکن هنگام باز شدن اپلیکیشن
  const checkInitialToken = async () => {
    try {
      const token = await getToken();
      setUserToken(token); // اگر توکن باشد، وضعیت آپدیت می‌شود
    } catch (error) {
      console.error('Error fetching token:', error);
    } finally {
      setIsLoading(false); // در هر صورت (موفق یا خطا)، لودینگ اولیه تمام می‌شود
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
    <AuthContext.Provider value={{ isLoading, userToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};