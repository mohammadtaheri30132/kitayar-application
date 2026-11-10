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
  ScrollView,
  Image,
} from 'react-native';
import { showWarning, showError, showSuccess } from '../../components/feedback';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';
import { AuthContext } from '../../context/AuthContext';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

const RegisterScreen = ({ route, navigation }: any) => {
  const { phoneNumber } = route.params || { phoneNumber: 'نامشخص' };
  const initialSeconds = Number(route.params?.remainingSeconds) || 120;
  const { login } = useContext(AuthContext);

  // مرحله ۱: otp | مرحله ۲: complete_profile
  const [currentStep, setCurrentStep] = useState<'otp' | 'complete_profile'>('otp');

  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_PRESETS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(initialSeconds);

  // شمارش معکوس ۲ دقیقه‌ای
  React.useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // بررسی و تایید OTP
  const handleVerifyOtp = async () => {
    Keyboard.dismiss();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      showWarning('لطفاً کد تایید ۵ رقمی پیامک‌شده را وارد کنید');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/teacher/auth/verify-otp', {
        phoneNumber,
        otp: cleanOtp,
      });

      if (response.data.success) {
        showSuccess('کد تایید شد. لطفاً نام و تصویر پروفایل خود را وارد کنید.');
        setCurrentStep('complete_profile');
      } else {
        showError(response.data.message || 'کد تایید اشتباه یا منقضی شده است');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'کد تایید نادرست است';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ارسال مجدد کد با رعایت سقف ۲ دقیقه
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    try {
      const response = await api.post('/teacher/auth/request-otp', { phoneNumber });
      if (response.data?.success) {
        setCountdown(response.data?.remainingSeconds || 120);
        showSuccess('کد تایید مجدداً پیامک شد');
      } else {
        if (response.data?.remainingSeconds) setCountdown(response.data.remainingSeconds);
        showError(response.data?.message || 'خطا در ارسال مجدد کد');
      }
    } catch (error: any) {
      const data = error.response?.data;
      if (data?.remainingSeconds) setCountdown(data.remainingSeconds);
      showError(data?.message || 'خطا در ارسال مجدد کد تایید');
    } finally {
      setIsLoading(false);
    }
  };

  // ثبت‌نام نهایی و تکمیل پروفایل (فقط نام و نام خانوادگی و عکس پروفایل)
  const handleCompleteRegistration = async () => {
    Keyboard.dismiss();
    if (!fullName.trim()) {
      showWarning('لطفاً نام و نام خانوادگی خود را وارد کنید.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/teacher/auth/register', {
        phoneNumber,
        fullName: fullName.trim(),
        avatar,
        otp: otp.trim(),
      });

      if (response.data.success) {
        showSuccess('ثبت‌نام با موفقیت انجام شد!');
        await login(response.data.data.token);
      } else {
        showError(response.data.message || 'خطا در ثبت‌نام دبیر');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'خطای ارتباط با سرور';
      showError(errorMessage, 'خطا در ثبت‌نام');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          
          <View style={styles.card}>

            {/* مرحله ۱: ورود کد تایید پیامک */}
            {currentStep === 'otp' ? (
              <>
                <View style={styles.header}>
                  <View style={styles.iconCircle}>
                    <Text style={styles.iconCircleText}>📩</Text>
                  </View>
                  <Text style={styles.title}>کد تایید را وارد کنید</Text>
                  <Text style={styles.subtitle}>
                    کد تایید به شماره <Text style={styles.highlightPhone}>{phoneNumber}</Text> ارسال شد
                  </Text>
                </View>

                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>کد تایید ۵ رقمی</Text>
                    <TextInput
                      style={[styles.input, styles.otpInput]}
                      placeholder="• • • • •"
                      placeholderTextColor={COLORS.textLight}
                      keyboardType="numeric"
                      maxLength={5}
                      value={otp}
                      onChangeText={setOtp}
                      textAlign="center"
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.button, isLoading && styles.buttonDisabled]} 
                  onPress={handleVerifyOtp}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.surface} size="small" />
                  ) : (
                    <Text style={styles.buttonText}>ادامه و تکمیل پروفایل ←</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.footerRow}>
                  {countdown > 0 ? (
                    <Text style={styles.countdownText}>
                      ارسال مجدد ({Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')})
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendOtp} disabled={isLoading}>
                      <Text style={styles.resendText}>ارسال مجدد کد</Text>
                    </TouchableOpacity>
                  )}
                  <Text style={styles.dotSeparator}>•</Text>
                  <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>تغییر شماره</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              /* مرحله ۲: تکمیل پروفایل (تصویر + نام و نام خانوادگی + رمز عبور) */
              <>
                <View style={styles.header}>
                  <Text style={styles.title}>تکمیل پروفایل</Text>
                  <Text style={styles.subtitle}>
                    لطفاً تصویر پروفایل و نام خود را مشخص نمایید
                  </Text>
                </View>

                {/* بخش انتخاب عکس */}
                <View style={styles.avatarSection}>
                  <Image source={{ uri: avatar }} style={styles.mainAvatarImage} />
                  <Text style={styles.avatarLabel}>انتخاب تصویر پروفایل:</Text>
                  <View style={styles.presetRow}>
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setAvatar(preset)}
                        style={[
                          styles.presetItem,
                          avatar === preset && styles.presetItemActive,
                        ]}
                      >
                        <Image source={{ uri: preset }} style={styles.presetThumb} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>نام و نام خانوادگی</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="مثال: مریم محمدی"
                      placeholderTextColor={COLORS.textLight}
                      value={fullName}
                      onChangeText={setFullName}
                      textAlign="right"
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.button, isLoading && styles.buttonDisabled]} 
                  onPress={handleCompleteRegistration}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.surface} size="small" />
                  ) : (
                    <Text style={styles.buttonText}>ثبت‌نام و ورود به پنل</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.textOnlyButton}
                  onPress={() => setCurrentStep('otp')}
                >
                  <Text style={styles.backButtonText}>← ویرایش کد تایید</Text>
                </TouchableOpacity>
              </>
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
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconCircleText: { fontSize: 28 },
  header: { marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: 13, color: COLORS.textLight, textAlign: 'center' },
  highlightPhone: { fontWeight: 'bold', color: COLORS.primary },
  mockBanner: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  mockBannerText: {
    fontSize: 12,
    color: '#166534',
    marginBottom: 6,
  },
  fillMockBtn: {
    backgroundColor: '#dcfce7',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  fillMockBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#15803d',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mainAvatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: COLORS.primary,
    marginBottom: 10,
  },
  avatarLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
  },
  presetItem: {
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 24,
    padding: 2,
  },
  presetItemActive: {
    borderColor: COLORS.primary,
  },
  presetThumb: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  form: { marginBottom: 10 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, color: COLORS.textLight, marginBottom: 6, textAlign: 'right', fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: '#f8fafc',
  },
  otpInput: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: '#f0fdf4',
    letterSpacing: 6,
    fontWeight: 'bold',
    fontSize: 20,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
  },
  passwordInput: { flex: 1, padding: 14, fontSize: 15, color: COLORS.text },
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
  textOnlyButton: {
    alignItems: 'center',
    marginTop: 16,
    padding: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  countdownText: {
    color: COLORS.textLight,
    fontSize: 13,
    fontWeight: 'bold',
  },
  dotSeparator: {
    marginHorizontal: 10,
    color: COLORS.border,
    fontSize: 16,
  },
  backButtonText: { 
    color: COLORS.textLight, 
    fontSize: 13, 
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
