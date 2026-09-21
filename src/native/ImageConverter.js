import { NativeModules } from 'react-native';

const { ImageConverterModule } = NativeModules;

if (!ImageConverterModule) {
  console.error(
    '❌ ImageConverterModule یافت نشد. ماژول را در MainApplication.kt ثبت کرده و پروژه را clean build کنید.'
  );
}

// فرمت‌های خروجی پشتیبانی‌شده برای نمایش در UI
export const SUPPORTED_TARGET_FORMATS = ['JPEG', 'PNG', 'WEBP', 'BMP'];

const ImageConverter = {
  // فرمت عکس ورودی رو برمی‌گردونه: { format: 'JPEG' | 'PNG' | ... , supported: boolean }
  detectFormat: async (uri) => {
    if (!ImageConverterModule) throw new Error('ImageConverterModule در دسترس نیست.');
    return await ImageConverterModule.detectFormat(uri);
  },

  // تبدیل عکس به فرمت جدید. quality بین 0 تا 100 (پیش‌فرض 90)
  // خروجی: { path, uri, sizeBytes }
  convert: async (uri, targetFormat, quality = 90) => {
    if (!ImageConverterModule) throw new Error('ImageConverterModule در دسترس نیست.');
    if (!SUPPORTED_TARGET_FORMATS.includes(targetFormat.toUpperCase())) {
      throw new Error(`فرمت "${targetFormat}" پشتیبانی نمی‌شود.`);
    }
    return await ImageConverterModule.convertImage(uri, targetFormat.toUpperCase(), quality);
  },
};

export default ImageConverter;