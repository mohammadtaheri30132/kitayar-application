import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  Keyboard
} from 'react-native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';

const PhoneCheckScreen = ({ navigation }: any) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckPhone = async () => {
    Keyboard.dismiss(); // بستن کیبورد هنگام کلیک

    // اعتبارسنجی اولیه فرمت شماره موبایل
    if (!phoneNumber || phoneNumber.length !== 11 || !phoneNumber.startsWith('09')) {
      Alert.alert('خطا', 'لطفاً یک شماره موبایل معتبر وارد کنید (مثال: 09123456789)');
      return;
    }

    setIsLoading(true);
    try {
      // استفاده از فایل تنظیمات Axios که قبلا ساختیم
      const response = await api.post('/teacher/auth/check-phone', { phoneNumber });
      
      const data = response.data;

      if (data.success) {
        if (data.data.isRegistered) {
          // کاربر قبلاً ثبت‌نام کرده است -> هدایت به صفحه ورود با رمز
          navigation.navigate('LoginPasswordScreen', { phoneNumber });
          Alert.alert('وضعیت', 'شما قبلاً ثبت‌نام کرده‌اید. (هدایت به صفحه رمز)');
        } else {
          // کاربر جدید است -> هدایت به صفحه ثبت‌نام
          navigation.navigate('RegisterScreen', { phoneNumber });
          Alert.alert('وضعیت', 'شما کاربر جدید هستید. (هدایت به صفحه ثبت‌نام)');
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'خطای ارتباط با سرور. لطفاً اتصال اینترنت را بررسی کنید.';
      Alert.alert('خطا', errorMessage);
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ورود به کیتایار</Text>
        <Text style={styles.subtitle}>جهت ورود یا ثبت‌نام، شماره موبایل خود را وارد کنید</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="09123456789"
          placeholderTextColor={COLORS.textLight}
          keyboardType="numeric"
          maxLength={11}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleCheckPhone}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.surface} />
        ) : (
          <Text style={styles.buttonText}>ادامه</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    textAlign: 'center', // وسط‌چین شدن شماره موبایل
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    letterSpacing: 2, // فاصله دادن بین اعداد برای خوانایی بهتر
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2, // سایه ملایم برای دکمه در اندروید
  },
  buttonDisabled: {
    backgroundColor: COLORS.secondary,
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PhoneCheckScreen;