import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { showWarning, showError } from '../../components/feedback';
import { api, getServerConfig, ServerMode } from '../../api/axiosConfig';
import { ServerSwitchModal } from '../../components/common/ServerSwitchModal';
import { COLORS } from '../../theme/colors';

const PhoneCheckScreen = ({ navigation }: any) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [serverMode, setServerMode] = useState<ServerMode>('server');

  useEffect(() => {
    getServerConfig().then(cfg => setServerMode(cfg.mode));
  }, []);

  const handleCheckPhone = async () => {
    Keyboard.dismiss(); // بستن کیبورد هنگام کلیک

    // اعتبارسنجی اولیه فرمت شماره موبایل
    if (!phoneNumber || phoneNumber.length !== 11 || !phoneNumber.startsWith('09')) {
      showWarning('لطفاً یک شماره موبایل معتبر وارد کنید (مثال: 09123456789)');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/teacher/auth/check-phone', { phoneNumber });
      
      const data = response.data;

      if (data.success) {
        if (data.data.isRegistered) {
          navigation.navigate('LoginPasswordScreen', { 
            phoneNumber,
            remainingSeconds: data.data.remainingSeconds || 0,
          });
        } else {
          navigation.navigate('RegisterScreen', { 
            phoneNumber,
            remainingSeconds: data.data.remainingSeconds || 120,
          });
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'خطای ارتباط با سرور. لطفاً اتصال اینترنت را بررسی کنید.';
      showError(errorMessage);
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
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

        {/* Server Status & Switcher */}
        <TouchableOpacity
          style={styles.serverBadge}
          onPress={() => setServerModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.serverDot, { backgroundColor: serverMode === 'server' ? '#10b981' : '#f59e0b' }]} />
          <Text style={styles.serverBadgeText}>
            {serverMode === 'server' ? 'متصل به سرور آنلاین کیتایار' : 'متصل به سرور محلی (Local)'}
          </Text>
          <Text style={styles.serverBadgeAction}>• تغییر سرور</Text>
        </TouchableOpacity>

        <ServerSwitchModal
          visible={serverModalVisible}
          onClose={() => setServerModalVisible(false)}
          onChanged={() => {
            getServerConfig().then(cfg => setServerMode(cfg.mode));
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  serverBadge: {
    marginTop: 24,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignSelf: 'center',
    gap: 8,
  },
  serverDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  serverBadgeText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  serverBadgeAction: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: 'bold',
  },
});

export default PhoneCheckScreen;