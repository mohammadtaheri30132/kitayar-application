import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Keyboard, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from 'react-native';
import { showWarning, showError, showSuccess } from '../../components/feedback';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';
import { AuthContext } from '../../context/AuthContext';

type ScreenMode = 'password' | 'otp' | 'reset_password';

const LoginPasswordScreen = ({ route, navigation }: any) => {
  const { phoneNumber } = route.params || { phoneNumber: 'نامشخص' };
  const initialRemainingSeconds = Number(route.params?.remainingSeconds) || 0;
  const { login } = useContext(AuthContext);

  const [mode, setMode] = useState<ScreenMode>('password');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(initialRemainingSeconds);

  // شمارش معکوس ۲ دقیقه‌ای
  React.useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // ۱. ورود با رمز عبور
  const handlePasswordLogin = async () => {
    Keyboard.dismiss();
    if (!password.trim()) {
      showWarning('لطفاً رمز عبور خود را وارد کنید.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/teacher/auth/login', { 
        phoneNumber, 
        password 
      });
      if (response.data.success) {
        showSuccess('ورود موفقیت‌آمیز بود');
        await login(response.data.data.token);
      } else {
        showError(response.data.message || 'رمز عبور اشتباه است');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'خطای ارتباط با سرور';
      showError(errorMessage, 'خطا در ورود');
    } finally {
      setIsLoading(false);
    }
  };

  // ۲. ارسال کد یک‌بارمصرف برای ورود با OTP با رعایت محدودیت ۲ دقیقه
  const handleSwitchToOtp = async () => {
    if (countdown > 0) {
      setMode('otp');
      setOtp('');
      showSuccess(`کد تایید اخیراً ارسال شده است (${countdown} ثانیه مهلت)`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/teacher/auth/request-otp', { phoneNumber });
      setMode('otp');
      setOtp('');
      const secs = response.data?.remainingSeconds || 120;
      setCountdown(secs);
      showSuccess('کد یک‌بارمصرف پیامک شد');
    } catch (error: any) {
      const data = error.response?.data;
      if (data?.remainingSeconds) {
        setCountdown(data.remainingSeconds);
        setMode('otp');
      }
      const errorMessage = data?.message || 'خطا در ارسال کد یک‌بارمصرف';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // تایید کد یک‌بارمصرف و ورود
  const handleOtpLogin = async () => {
    Keyboard.dismiss();
    if (!otp.trim()) {
      showWarning('لطفاً کد ۵ رقمی را وارد کنید.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/teacher/auth/login-otp', {
        phoneNumber,
        otp: otp.trim(),
      });
      if (response.data.success) {
        showSuccess('ورود با کد یک‌بارمصرف موفقیت‌آمیز بود');
        await login(response.data.data.token);
      } else {
        showError(response.data.message || 'کد یک‌بارمصرف اشتباه یا منقضی شده است');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'خطای ارتباط با سرور';
      showError(errorMessage, 'خطا در ورود');
    } finally {
      setIsLoading(false);
    }
  };

  // ۳. فراموشی رمز عبور: ارسال کد و باز کردن فرم تنظیم مجدد
  const handleOpenForgotPassword = async () => {
    if (countdown > 0) {
      setMode('reset_password');
      setOtp('');
      setNewPassword('');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/teacher/auth/request-otp', { phoneNumber });
      setMode('reset_password');
      setOtp('');
      setNewPassword('');
      const secs = response.data?.remainingSeconds || 120;
      setCountdown(secs);
      showSuccess('کد تایید جهت بازنشانی رمز ارسال شد');
    } catch (error: any) {
      const data = error.response?.data;
      if (data?.remainingSeconds) {
        setCountdown(data.remainingSeconds);
        setMode('reset_password');
      }
      const errorMessage = data?.message || 'خطا در ارسال کد تایید';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // تایید کد و ذخیره رمز عبور جدید
  const handleResetPassword = async () => {
    Keyboard.dismiss();
    if (!otp.trim()) {
      showWarning('لطفاً کد تایید ۵ رقمی را وارد کنید');
      return;
    }
    if (newPassword.length < 5) {
      showWarning('رمز عبور جدید باید حداقل ۵ کاراکتر باشد');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/teacher/auth/reset-password', {
        phoneNumber,
        otp: otp.trim(),
        newPassword,
      });

      if (response.data.success) {
        showSuccess('رمز عبور با موفقیت به‌روزرسانی شد. اکنون وارد شدید.');
        if (response.data.data?.token) {
          await login(response.data.data.token);
        } else {
          setMode('password');
        }
      } else {
        showError(response.data.message || 'خطا در تغییر رمز عبور');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'کد تایید نامعتبر است';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          
          <View style={styles.card}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarIcon}>
                {mode === 'password' ? '👋' : mode === 'otp' ? '📱' : '🔑'}
              </Text>
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>
                {mode === 'password'
                  ? 'خوش برگشتید!'
                  : mode === 'otp'
                  ? 'ورود با کد یک‌بارمصرف'
                  : 'تغییر رمز عبور'}
              </Text>
              <Text style={styles.subtitle}>
                حساب کاربری: <Text style={styles.highlightPhone}>{phoneNumber}</Text>
              </Text>
            </View>

            {/* فرم ۱: ورود با رمز عبور */}
            {mode === 'password' && (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>رمز عبور</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="رمز عبور خود را وارد کنید"
                      placeholderTextColor={COLORS.textLight}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      textAlign="left"
                    />
                    <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                      <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* دکمه ورود */}
                <TouchableOpacity 
                  style={[styles.button, isLoading && styles.buttonDisabled]} 
                  onPress={handlePasswordLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.surface} size="small" />
                  ) : (
                    <Text style={styles.buttonText}>ورود</Text>
                  )}
                </TouchableOpacity>

                {/* خط جداکننده «یا» */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>یا</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* دکمه ورود با کد یک‌بارمصرف */}
                <TouchableOpacity 
                  style={styles.secondaryButton} 
                  onPress={handleSwitchToOtp}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>ورود با کد یک‌بارمصرف</Text>
                </TouchableOpacity>

                {/* لینک‌های پایین: تغییر شماره و فراموشی رمز عبور */}
                <View style={styles.footerLinks}>
                  <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.linkText}>تغییر شماره</Text>
                  </TouchableOpacity>
                  <Text style={styles.dotSeparator}>•</Text>
                  <TouchableOpacity onPress={handleOpenForgotPassword}>
                    <Text style={[styles.linkText, { color: COLORS.primary }]}>فراموشی رمز عبور</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* فرم ۲: ورود با کد یک‌بارمصرف */}
            {mode === 'otp' && (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    کد یک‌بارمصرف پیامک‌شده {countdown > 0 ? `(${countdown} ثانیه)` : ''}
                  </Text>
                  <TextInput
                    style={[styles.passwordInput, styles.otpInput]}
                    placeholder="• • • • •"
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="numeric"
                    maxLength={5}
                    value={otp}
                    onChangeText={setOtp}
                    textAlign="center"
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.button, isLoading && styles.buttonDisabled]} 
                  onPress={handleOtpLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.surface} size="small" />
                  ) : (
                    <Text style={styles.buttonText}>ورود با کد یک‌بارمصرف</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.textOnlyButton}
                  onPress={() => setMode('password')}
                  disabled={isLoading}
                >
                  <Text style={styles.textOnlyButtonText}>← بازگشت به ورود با رمز عبور</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* فرم ۳: فراموشی و بازنشانی رمز عبور */}
            {mode === 'reset_password' && (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    کد تایید پیامک‌شده {countdown > 0 ? `(${countdown} ثانیه)` : ''}
                  </Text>
                  <TextInput
                    style={[styles.passwordInput, styles.otpInput]}
                    placeholder="• • • • •"
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="numeric"
                    maxLength={5}
                    value={otp}
                    onChangeText={setOtp}
                    textAlign="center"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>رمز عبور جدید (حداقل ۵ کاراکتر)</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="رمز عبور جدید خود را وارد کنید"
                      placeholderTextColor={COLORS.textLight}
                      secureTextEntry={!showPassword}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      textAlign="left"
                    />
                    <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                      <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.button, isLoading && styles.buttonDisabled]} 
                  onPress={handleResetPassword}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.surface} size="small" />
                  ) : (
                    <Text style={styles.buttonText}>ثبت رمز جدید و ورود</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.textOnlyButton}
                  onPress={() => setMode('password')}
                  disabled={isLoading}
                >
                  <Text style={styles.textOnlyButtonText}>← انصراف و بازگشت به ورود</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#eff6ff',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  avatarIcon: { fontSize: 32 },
  header: { marginBottom: 24, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textLight, textAlign: 'center' },
  highlightPhone: { fontWeight: 'bold', color: COLORS.primary },
  form: { marginBottom: 10 },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 13, color: COLORS.textLight, marginBottom: 8, textAlign: 'left', fontWeight: 'bold' },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
  },
  passwordInput: { flex: 1, padding: 14, fontSize: 16, color: COLORS.text },
  otpInput: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 14,
    backgroundColor: '#f0fdf4',
    letterSpacing: 4,
    fontWeight: 'bold',
  },
  eyeButton: { padding: 14 },
  eyeText: { fontSize: 18 },
  button: { 
    backgroundColor: COLORS.primary, 
    padding: 16, 
    borderRadius: 14, 
    alignItems: 'center', 
    marginTop: 6 
  },
  buttonDisabled: { backgroundColor: COLORS.secondary, opacity: 0.7 },
  buttonText: { color: COLORS.surface, fontSize: 16, fontWeight: 'bold' },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 12,
    color: COLORS.textLight,
    fontSize: 13,
    fontWeight: 'bold',
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#eff6ff',
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: 'bold',
  },
  textOnlyButton: {
    alignItems: 'center',
    marginTop: 18,
    padding: 8,
  },
  textOnlyButtonText: {
    color: COLORS.textLight,
    fontSize: 13,
    fontWeight: 'bold',
  },
  footerLinks: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 22 
  },
  linkText: { color: COLORS.textLight, fontSize: 13, fontWeight: 'bold' },
  dotSeparator: { marginHorizontal: 12, color: COLORS.border, fontSize: 18 }
});

export default LoginPasswordScreen;
