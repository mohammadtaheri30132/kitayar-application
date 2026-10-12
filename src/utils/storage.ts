import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@auth_token';

// ذخیره توکن
export const saveToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('❌ خطا در ذخیره توکن:', error);
  }
};

// دریافت توکن
export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('❌ خطا در خواندن توکن:', error);
    return null;
  }
};

// حذف توکن (برای خروج از حساب - Logout)
export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('❌ خطا در حذف توکن:', error);
  }
};

// دریافت شناسه کاربر از توکن JWT
export const getUserIdFromToken = async (): Promise<string | null> => {
  try {
    const token = await getToken();
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    // Base64 decode using global atob or Buffer
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let decoded = '';
    if (typeof atob === 'function') {
      decoded = atob(base64);
    } else {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let str = base64.replace(/=+$/, '');
      let output = '';
      for (let bc = 0, bs = 0, buffer, i = 0; buffer = str.charAt(i++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
        buffer = chars.indexOf(buffer);
      }
      decoded = output;
    }
    const parsed = JSON.parse(decoded);
    return parsed.userId || parsed.id || parsed._id || null;
  } catch {
    return null;
  }
};