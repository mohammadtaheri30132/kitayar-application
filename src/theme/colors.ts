export const lightColors = {
  primary: '#2563eb', // آبی اصلی (برند)
  secondary: '#3b82f6', // آبی روشن‌تر
  background: '#f8fafc', // پس‌زمینه صفحات
  surface: '#ffffff', // رنگ کارت‌ها و باکس‌ها
  surfaceVariant: '#f1f5f9', // سطوح ثانویه و فیلدها
  text: '#1e293b', // متن اصلی
  textLight: '#64748b', // متن فرعی
  textMuted: '#94a3b8', // متن بسیار کم‌رنگ / placeholder
  error: '#ef4444', // خطاها
  errorBackground: '#fef2f2',
  border: '#e2e8f0', // حاشیه‌ها
  borderSubtle: '#f1f5f9',
  iconBackground: 'rgba(37, 99, 235, 0.1)',
  shadow: '#000000',
  success: '#10b981',
  successBackground: '#ecfdf5',
  warning: '#f59e0b',
  warningBackground: '#fffbeb',
  info: '#0284c7',
  infoBackground: '#f0f9ff',
  card: '#ffffff',
  backdrop: 'rgba(15, 23, 42, 0.55)',
  disabled: '#cbd5e1',
  disabledText: '#94a3b8',
};

export const darkColors = {
  primary: '#3b82f6', // آبی اصلی
  secondary: '#60a5fa', // آبی ثانویه
  background: '#0f172a', // پس‌زمینه صفحات
  surface: '#1e293b', // کارت‌ها
  surfaceVariant: '#334155',
  text: '#f8fafc', // متن اصلی
  textLight: '#94a3b8', // متن فرعی
  textMuted: '#64748b',
  error: '#f87171', // خطاها
  errorBackground: 'rgba(239, 68, 68, 0.15)',
  border: '#334155', // حاشیه‌ها
  borderSubtle: '#1e293b',
  iconBackground: 'rgba(59, 130, 246, 0.2)',
  shadow: '#000000',
  success: '#34d399',
  successBackground: 'rgba(16, 185, 129, 0.15)',
  warning: '#fbbf24',
  warningBackground: 'rgba(245, 158, 11, 0.15)',
  info: '#38bdf8',
  infoBackground: 'rgba(2, 132, 199, 0.15)',
  card: '#1e293b',
  backdrop: 'rgba(0, 0, 0, 0.75)',
  disabled: '#475569',
  disabledText: '#64748b',
};

// Fallback for existing components that directly import COLORS
export const COLORS = lightColors;

export type ThemeColors = typeof lightColors;