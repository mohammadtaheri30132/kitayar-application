import { NativeModules } from 'react-native';

const { PersianOcrModule } = NativeModules;

if (!PersianOcrModule) {
  console.error("❌ خطا: ماژول PersianOcrModule در NativeModules مقدار undefined است! آیا MainApplication را ثبت کرده‌اید و پروژه را کلین بیلد کرده‌اید؟");
}

const PersianOcr = {
  // خروجی حالا { text: string, confidence: number } است، نه رشته خام
  extractText: async (uri) => {
    if (!PersianOcrModule || typeof PersianOcrModule.extractText !== 'function') {
      throw new Error("توابع PersianOcrModule در دسترس نیستند یا نام متد در کاتلین اشتباه است.");
    }
    const result = await PersianOcrModule.extractText(uri);
    return result; // { text, confidence }
  }
};

export default PersianOcr;