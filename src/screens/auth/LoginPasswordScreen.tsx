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

const LoginPasswordScreen = ({ route, navigation }: any) => {
  const { phoneNumber } = route.params || { phoneNumber: 'نامشخص' };
  const { login } = useContext(AuthContext);

  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!password.trim()) {
      Alert.alert('توجه', 'لطفاً رمز عبور خود را وارد کنید.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/teacher/auth/login', { phoneNumber, password });
      if (response.data.success) {
        await login(response.data.data.token);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'خطای ارتباط با سرور';
      Alert.alert('خطا در ورود', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          
          <View style={styles.card}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarIcon}>👋</Text>
            </View>
            <View style={styles.header}>
              <Text style={styles.title}>خوش برگشتید!</Text>
              <Text style={styles.subtitle}>
                ورود به حساب <Text style={styles.highlightPhone}>{phoneNumber}</Text>
              </Text>
            </View>

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
            </View>

            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.surface} size="small" />
              ) : (
                <Text style={styles.buttonText}>ورود به پنل</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerLinks}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.linkText}>تغییر شماره</Text>
              </TouchableOpacity>
              <Text style={styles.dotSeparator}>•</Text>
              <TouchableOpacity onPress={() => Alert.alert('توجه', 'بزودی اضافه می‌شود')}>
                <Text style={styles.linkText}>فراموشی رمز</Text>
              </TouchableOpacity>
            </View>
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
  header: { marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textLight, textAlign: 'center' },
  highlightPhone: { fontWeight: 'bold', color: COLORS.primary },
  form: { marginBottom: 10 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, color: COLORS.textLight, marginBottom: 8, textAlign: 'right', fontWeight: 'bold' },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
  },
  passwordInput: { flex: 1, padding: 16, fontSize: 16, color: COLORS.text },
  eyeButton: { padding: 16 },
  eyeText: { fontSize: 18 },
  button: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  buttonDisabled: { backgroundColor: COLORS.secondary, opacity: 0.7 },
  buttonText: { color: COLORS.surface, fontSize: 16, fontWeight: 'bold' },
  footerLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  linkText: { color: COLORS.textLight, fontSize: 14, fontWeight: 'bold' },
  dotSeparator: { marginHorizontal: 12, color: COLORS.border, fontSize: 18 }
});

export default LoginPasswordScreen;