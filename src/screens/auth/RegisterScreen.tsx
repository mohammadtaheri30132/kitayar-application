import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';
import { AuthContext } from '../../context/AuthContext';

const RegisterScreen = ({ route, navigation }: any) => {
  const { phoneNumber } = route.params || { phoneNumber: 'نامشخص' };
  const { login } = useContext(AuthContext);

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    Keyboard.dismiss();
    if (!fullName.trim() || !password || !otp) {
      Alert.alert('توجه', 'لطفاً تمامی فیلدها را تکمیل کنید.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('توجه', 'رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/teacher/auth/register', {
        phoneNumber,
        fullName,
        password,
        otp,
      });

      if (response.data.success) {
        await login(response.data.data.token);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'خطای ارتباط با سرور';
      Alert.alert('خطا در ثبت‌نام', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>تکمیل اطلاعات</Text>
              <Text style={styles.subtitle}>
                کد تایید به <Text style={styles.highlightPhone}>{phoneNumber}</Text> پیامک شد
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>کد تایید ۵ رقمی</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="-  -  -  -  -"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="numeric"
                  maxLength={5}
                  value={otp}
                  onChangeText={setOtp}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>نام و نام خانوادگی</Text>
                <TextInput
                  style={styles.input}
                  placeholder="مثال: علی احمدی"
                  placeholderTextColor={COLORS.textLight}
                  value={fullName}
                  onChangeText={setFullName}
                  textAlign="right"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>رمز عبور (حداقل ۶ کاراکتر)</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="رمز عبور خود را تعیین کنید"
                    placeholderTextColor={COLORS.textLight}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    textAlign="left"
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton} 
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.surface} size="small" />
              ) : (
                <Text style={styles.buttonText}>ثبت‌نام و ورود</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>ویرایش شماره موبایل</Text>
            </TouchableOpacity>
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
    elevation: 3, // سایه ملایم کارت برای اندروید
  },
  header: { marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textLight, textAlign: 'center' },
  highlightPhone: { fontWeight: 'bold', color: COLORS.primary },
  form: { marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, color: COLORS.textLight, marginBottom: 8, textAlign: 'right', fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: '#f8fafc',
  },
  otpInput: { textAlign: 'center', fontSize: 24, letterSpacing: 10, fontWeight: 'bold', color: COLORS.primary },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
  },
  passwordInput: { flex: 1, padding: 16, fontSize: 16, color: COLORS.text },
  eyeButton: { padding: 16, justifyContent: 'center', alignItems: 'center' },
  eyeText: { fontSize: 18 },
  button: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  buttonDisabled: { backgroundColor: COLORS.secondary, opacity: 0.7 },
  buttonText: { color: COLORS.surface, fontSize: 16, fontWeight: 'bold' },
  backButton: { marginTop: 20, alignItems: 'center' },
  backButtonText: { color: COLORS.textLight, fontSize: 14, textDecorationLine: 'underline' }
});

export default RegisterScreen;