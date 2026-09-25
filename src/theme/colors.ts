export const lightColors = {
  primary: '#2563eb',     // آبی اصلی (برند)
  secondary: '#3b82f6',   // آبی روشن‌تر
  background: '#f8fafc',  // پس‌زمینه صفحات
  surface: '#ffffff',     // رنگ کارت‌ها و باکس‌ها
  text: '#1e293b',        // متن اصلی
  textLight: '#64748b',   // متن فرعی
  error: '#ef4444',       // خطاها
  border: '#e2e8f0',      // حاشیه‌ها
  iconBackground: 'rgba(37, 99, 235, 0.1)',
  shadow: '#000000',
  success: '#10b981',
};

export const darkColors = {
  primary: '#3b82f6',     // آبی اصلی (برند در دارک مود کمی روشن‌تر برای خوانایی)
  secondary: '#60a5fa',   // آبی ثانویه
  background: '#0f172a',  // پس‌زمینه صفحات
  surface: '#1e293b',     // کارت‌ها
  text: '#f8fafc',        // متن اصلی
  textLight: '#94a3b8',   // متن فرعی
  error: '#f87171',       // خطاها
  border: '#334155',      // حاشیه‌ها
  iconBackground: 'rgba(59, 130, 246, 0.2)',
  shadow: '#000000',
  success: '#34d399',
};

// Fallback for existing components that directly import COLORS
export const COLORS = lightColors;