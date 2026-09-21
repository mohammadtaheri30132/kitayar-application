import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';
import { AuthContext } from '../../context/AuthContext';

const ProfileScreen = ({ navigation }: any) => {
  const { logout } = useContext(AuthContext);

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // دریافت اطلاعات پروفایل از سرور
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // فرض می‌کنیم روت /teacher/profile در بک‌اند ساخته شده است
        const response = await api.get('/teacher/profile');
        if (response.data.success) {
          setFullName(response.data.data.fullName || '');
          setPhoneNumber(response.data.data.username || ''); // شماره موبایل
        }
      } catch (error) {
        console.log('خطا در دریافت پروفایل، در حال نمایش دیتای پیش‌فرض...');
        // در صورتی که API هنوز در بک‌اند ساخته نشده باشد، اپ کرش نکند
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // ذخیره نام جدید
  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('توجه', 'نام و نام خانوادگی نمی‌تواند خالی باشد.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.put('/teacher/profile', {
        fullName: fullName
      });

      if (response.data.success) {
        Alert.alert('موفقیت', 'اطلاعات شما با موفقیت بروزرسانی شد.');
      }
    } catch (error: any) {
      Alert.alert('خطا', 'مشکلی در بروزرسانی اطلاعات رخ داد.');
    } finally {
      setIsSaving(false);
    }
  };

  // خروج از حساب کاربری
  const handleLogout = () => {
    Alert.alert(
      'خروج از حساب',
      'آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟',
      [
        { text: 'انصراف', style: 'cancel' },
        { 
          text: 'خروج', 
          style: 'destructive',
          onPress: async () => {
            // تابع logout از AuthContext صدا زده می‌شود
            // این کار توکن را پاک کرده و کاربر را خودکار به صفحه PhoneCheckScreen می‌برد
            await logout(); 
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      
      {/* هدر */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>🔙 داشبورد</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>حساب کاربری</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        
        {/* آواتار کاربر */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarIcon}>👨‍🏫</Text>
          </View>
          <Text style={styles.avatarName}>{fullName || 'معلم عزیز'}</Text>
          <Text style={styles.avatarPhone}>{phoneNumber}</Text>
        </View>

        {/* فرم ویرایش اطلاعات */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>اطلاعات شخصی</Text>
          
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
            <Text style={styles.label}>شماره موبایل (غیرقابل تغییر)</Text>
            <View style={styles.disabledInput}>
              <Text style={styles.disabledText}>{phoneNumber}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.buttonDisabled]} 
            onPress={handleUpdateProfile}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={COLORS.surface} size="small" />
            ) : (
              <Text style={styles.saveButtonText}>ذخیره تغییرات</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* بخش خروج از حساب */}
        <View style={styles.dangerZone}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>🚪 خروج از حساب کاربری</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
    zIndex: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  backButton: { padding: 8 },
  backButtonText: { color: COLORS.textLight, fontSize: 14 },

  scrollContainer: { flexGrow: 1, backgroundColor: COLORS.background, padding: 20 },
  
  avatarSection: { alignItems: 'center', marginBottom: 32, marginTop: 16 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarIcon: { fontSize: 40 },
  avatarName: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  avatarPhone: { fontSize: 14, color: COLORS.textLight, letterSpacing: 1 },

  formContainer: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, elevation: 1, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginBottom: 16, textAlign: 'right' },
  
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: COLORS.text, marginBottom: 8, textAlign: 'right', fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: '#f8fafc',
  },
  disabledInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#e2e8f0', // رنگ خاکستری برای نشان دادن غیرفعال بودن
    alignItems: 'flex-end',
  },
  disabledText: { fontSize: 16, color: COLORS.textLight, letterSpacing: 1 },

  saveButton: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { backgroundColor: COLORS.secondary, opacity: 0.7 },
  saveButtonText: { color: COLORS.surface, fontSize: 16, fontWeight: 'bold' },

  dangerZone: { marginTop: 'auto', marginBottom: 20 },
  logoutButton: { backgroundColor: '#fee2e2', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#f87171' },
  logoutButtonText: { color: COLORS.error, fontWeight: 'bold', fontSize: 16 },
});

export default ProfileScreen;