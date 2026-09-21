import React, { useEffect, useState } from 'react';
import { View, Image, ActivityIndicator, StyleSheet, PixelRatio } from 'react-native';
import PdfCore from '../../native/pdf/PdfCore';

// ضرب کردن در تراکم پیکسلی گوشی برای کیفیت HD (معمولاً 2 یا 3 برابر)
const SCALE_FACTOR = PixelRatio.get() > 2 ? 3 : 2;

const PdfPage = ({ docId, pageIndex, displayWidth, theme }) => {
  const [uri, setUri] = useState(null);
  
  // پیش‌فرض نسبت کاغذ A4 (حدود 1.414)
  const [displayHeight, setDisplayHeight] = useState(displayWidth * 1.414); 

  useEffect(() => {
    let isMounted = true;
    
    const loadPage = async () => {
      try {
        setUri(null);
        
        // 1. دریافت سایز واقعی از کاتلین
        const size = await PdfCore.getPageSize(docId, pageIndex);
        const ratio = size.height / size.width;
        const calcDisplayHeight = displayWidth * ratio;
        
        if (isMounted) setDisplayHeight(calcDisplayHeight);

        // 2. اعمال ضریب کیفیت (کیفیت تصویر رندر شده در کاتلین بالا می‌رود)
        const renderWidth = Math.floor(displayWidth * SCALE_FACTOR);
        const renderHeight = Math.floor(calcDisplayHeight * SCALE_FACTOR);

        const imgUri = await PdfCore.renderPage(docId, pageIndex, renderWidth, renderHeight, theme);
        if (isMounted) setUri(imgUri);
      } catch (error) {
        console.error(`خطا در رندر صفحه ${pageIndex}:`, error);
      }
    };

    loadPage();

    return () => { isMounted = false; };
  }, [docId, pageIndex, displayWidth, theme]);

  return (
    <View style={[styles.pageContainer, { width: displayWidth, height: displayHeight, backgroundColor: theme === 'dark' ? '#121212' : '#fff' }]}>
      {uri ? (
        <Image 
          source={{ uri }} 
          style={{ width: displayWidth, height: displayHeight }} 
          resizeMode="contain" 
          fadeDuration={0} // حذف افکت محو شدن برای رفع لگ اسکرول
        />
      ) : (
        <ActivityIndicator size="large" color="#3498db" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  pageContainer: {
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3, // ایجاد سایه بین صفحات
  }
});

export default React.memo(PdfPage, (prevProps, nextProps) => {
  // جلوگیری از رندر مجدد صفحات وقتی تم تغییر نکرده
  return prevProps.docId === nextProps.docId && prevProps.theme === nextProps.theme;
});