import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import {
  ChevronLeft,
  Sun,
  Moon,
  Bell,
  Shield,
  Lock,
  Eye,
  Clock,
  HelpCircle,
  FileText,
  Info,
  LogOut,
  CheckCircle2,
  X,
  Server,
} from 'lucide-react-native';
import { FONT_FAMILY } from '../../theme/typography';
import { showSuccess, showWarning } from '../../components/feedback';
import { ServerSwitchModal } from '../../components/common/ServerSwitchModal';
import { getServerConfig, ServerMode } from '../../api/axiosConfig';

const SettingsScreen = ({ navigation }: any) => {
  const { theme, toggleTheme, colors, isDark } = useTheme();
  const { logout } = useContext(AuthContext);

  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [serverMode, setServerModeState] = useState<ServerMode>('server');
  const [activeServerUrl, setActiveServerUrl] = useState('');

  useEffect(() => {
    getServerConfig().then(cfg => {
      setServerModeState(cfg.mode);
      setActiveServerUrl(cfg.url);
    });
  }, []);

  // Notification switches
  const [notifyPush, setNotifyPush] = useState(true);
  const [notifyQuestions, setNotifyQuestions] = useState(true);
  const [notifySales, setNotifySales] = useState(true);
  const [notifySound, setNotifySound] = useState(true);

  // Privacy & Availability switches
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [showPhoneToTeachers, setShowPhoneToTeachers] = useState(false);
  const [autoDndWeekend, setAutoDndWeekend] = useState(true);

  // Password Modal
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Logout Confirmation Modal
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showWarning('لطفاً همه فیلدهای کلمه عبور را تکمیل نمایید.');
      return;
    }
    if (newPassword.length < 6) {
      showWarning('کلمه عبور جدید باید حداقل ۶ کاراکتر باشد.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showWarning('کلمه عبور جدید و تکرار آن یکسان نیستند.');
      return;
    }

    setPasswordModalVisible(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showSuccess('کلمه عبور شما با موفقیت تغییر یافت.');
  };

  const handleConfirmLogout = async () => {
    setLogoutModalVisible(false);
    try {
      await logout();
    } catch (e) {
      console.warn('Error during logout:', e);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color={colors.textLight} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>تنظیمات سامانه</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* SECTION 1: APPEARANCE */}
        <Text style={[styles.sectionTitle, { color: colors.textLight }]}>پوسته و ظاهر برنامه</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            onPress={() => toggleTheme('light')}
          >
            <View style={styles.leftContent}>
              <View style={[styles.radio, { borderColor: theme === 'light' ? colors.primary : colors.border }]}>
                {theme === 'light' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
              </View>
            </View>
            <View style={styles.rightContent}>
              <Sun size={20} color={colors.textLight} style={{ marginLeft: 12 }} />
              <Text style={[styles.rowText, { color: colors.text }]}>حالت روشن</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => toggleTheme('dark')}>
            <View style={styles.leftContent}>
              <View style={[styles.radio, { borderColor: theme === 'dark' ? colors.primary : colors.border }]}>
                {theme === 'dark' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
              </View>
            </View>
            <View style={styles.rightContent}>
              <Moon size={20} color={colors.textLight} style={{ marginLeft: 12 }} />
              <Text style={[styles.rowText, { color: colors.text }]}>حالت تاریک</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* SECTION 2: NOTIFICATIONS */}
        <Text style={[styles.sectionTitle, { color: colors.textLight, marginTop: 24 }]}>
          اعلانات و پیام‌ها
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Switch
              value={notifyPush}
              onValueChange={setNotifyPush}
              trackColor={{ false: '#cbd5e1', true: colors.primary }}
              thumbColor="#ffffff"
            />
            <View style={styles.rightContent}>
              <Bell size={20} color={colors.textLight} style={{ marginLeft: 12 }} />
              <View>
                <Text style={[styles.rowText, { color: colors.text }]}>اعلان‌های سراسری (Push Notification)</Text>
              </View>
            </View>
          </View>

          <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Switch
              value={notifyQuestions}
              onValueChange={setNotifyQuestions}
              trackColor={{ false: '#cbd5e1', true: colors.primary }}
              thumbColor="#ffffff"
            />
            <View style={styles.rightContent}>
              <HelpCircle size={20} color={colors.textLight} style={{ marginLeft: 12 }} />
              <Text style={[styles.rowText, { color: colors.text }]}>درخواست سوال جدید از دانش‌آموز</Text>
            </View>
          </View>

          <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Switch
              value={notifySales}
              onValueChange={setNotifySales}
              trackColor={{ false: '#cbd5e1', true: colors.primary }}
              thumbColor="#ffffff"
            />
            <View style={styles.rightContent}>
              <CheckCircle2 size={20} color={colors.textLight} style={{ marginLeft: 12 }} />
              <Text style={[styles.rowText, { color: colors.text }]}>فروش محتوا و رزرو کلاس آنلاین</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Switch
              value={notifySound}
              onValueChange={setNotifySound}
              trackColor={{ false: '#cbd5e1', true: colors.primary }}
              thumbColor="#ffffff"
            />
            <View style={styles.rightContent}>
              <Bell size={20} color={colors.textLight} style={{ marginLeft: 12 }} />
              <Text style={[styles.rowText, { color: colors.text }]}>صدای زنگ و لرزش اعلانات</Text>
            </View>
          </View>
        </View>

        {/* SECTION 3: SECURITY & PRIVACY */}
        <Text style={[styles.sectionTitle, { color: colors.textLight, marginTop: 24 }]}>
          امنیت و حریم خصوصی
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            onPress={() => setPasswordModalVisible(true)}
          >
            <View style={styles.leftContent}>
              <Text style={[styles.actionLinkText, { color: colors.primary }]}>تغییر رمز</Text>
            </View>
            <View style={styles.rightContent}>
              <Lock size={20} color={colors.textLight} style={{ marginLeft: 12 }} />
              <Text style={[styles.rowText, { color: colors.text }]}>رمز عبور حساب کاربری</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Switch
              value={showOnlineStatus}
              onValueChange={setShowOnlineStatus}
              trackColor={{ false: '#cbd5e1', true: colors.primary }}
              thumbColor="#ffffff"
            />
            <View style={styles.rightContent}>
              <Eye size={20} color={colors.textLight} style={{ marginLeft: 12 }} />
              <Text style={[styles.rowText, { color: colors.text }]}>نمایش وضعیت آنلاین به دانش‌آموزان</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Switch
              value={showPhoneToTeachers}
              onValueChange={setShowPhoneToTeachers}
              trackColor={{ false: '#cbd5e1', true: colors.primary }}
              thumbColor="#ffffff"
            />
            <View style={styles.rightContent}>
              <Shield size={20} color={colors.textLight} style={{ marginLeft: 12 }} />
              <Text style={[styles.rowText, { color: colors.text }]}>نمایش شماره تماس در انجمن همکاران</Text>
            </View>
          </View>
        </View>

        {/* SECTION 4: AVAILABILITY PREFERENCES */}
        <Text style={[styles.sectionTitle, { color: colors.textLight, marginTop: 24 }]}>
          تنظیمات دسترسی و ساعات کاری
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Switch
              value={autoDndWeekend}
              onValueChange={setAutoDndWeekend}
              trackColor={{ false: '#cbd5e1', true: colors.primary }}
              thumbColor="#ffffff"
            />
            <View style={styles.rightContent}>
              <Clock size={20} color={colors.textLight} style={{ marginLeft: 12 }} />
              <Text style={[styles.rowText, { color: colors.text }]}>حالت سکوت در روزهای تعطیل رسمی</Text>
            </View>
          </View>
        </View>

        {/* SECTION 4.5: SERVER CONNECTION */}
        <Text style={[styles.sectionTitle, { color: colors.textLight, marginTop: 24 }]}>
          ارتباط با سرور کیتایار
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => setServerModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.leftContent}>
              <Text style={[styles.actionLinkText, { color: colors.primary }]}>تغییر</Text>
            </View>
            <View style={styles.rightContent}>
              <Server size={20} color={colors.textLight} style={{ marginLeft: 12 }} />
              <View>
                <Text style={[styles.rowText, { color: colors.text }]}>
                  {serverMode === 'server' ? 'سرور آنلاین (پروداکشن)' : 'سرور محلی توسعه (Local)'}
                </Text>
                <Text style={{ fontSize: 11, color: colors.textLight, marginTop: 2, textAlign: 'right' }}>
                  {activeServerUrl || 'https://class.kitayar.ir/api'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* SECTION 5: SUPPORT & ABOUT */}
        <Text style={[styles.sectionTitle, { color: colors.textLight, marginTop: 24 }]}>
          پشتیبانی و اطلاعات سامانه
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate('SupportTicketsScreen')}
          >
            <View style={styles.leftContent}>
              <Text style={[styles.actionLinkText, { color: colors.primary }]}>مشاهده تیکت‌ها</Text>
            </View>
            <View style={styles.rightContent}>
              <HelpCircle size={20} color={colors.textLight} style={{ marginLeft: 12 }} />
              <Text style={[styles.rowText, { color: colors.text }]}>پشتیبانی، تیکت و راهنما</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Text style={[styles.versionText, { color: colors.textLight }]}>نسخه ۲.۵.۰</Text>
            <View style={styles.rightContent}>
              <Info size={20} color={colors.textLight} style={{ marginLeft: 12 }} />
              <Text style={[styles.rowText, { color: colors.text }]}>نسخه اپلیکیشن کیتایار</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.row}
            onPress={() => Alert.alert('قوانین و حریم خصوصی', 'تمام حقوق مادی و معنوی سامانه متعلق به کیتایار است و اطلاعات معلمان و دانش‌آموزان با استانداردهای امنیتی رمزنگاری می‌شود.')}
          >
            <View style={styles.leftContent}>
              <Text style={[styles.actionLinkText, { color: colors.primary }]}>مطالعه</Text>
            </View>
            <View style={styles.rightContent}>
              <FileText size={20} color={colors.textLight} style={{ marginLeft: 12 }} />
              <Text style={[styles.rowText, { color: colors.text }]}>شرایط استفاده و حریم خصوصی</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* SECTION 6: LOGOUT */}
        <View style={{ marginTop: 32, marginBottom: 40 }}>
          <TouchableOpacity
            style={[
              styles.logoutButton,
              { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2', borderColor: '#ef4444' },
            ]}
            onPress={() => setLogoutModalVisible(true)}
          >
            <LogOut size={20} color="#dc2626" style={{ marginLeft: 8 }} />
            <Text style={styles.logoutButtonText}>خروج از حساب کاربری</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* PASSWORD MODAL */}
      <Modal visible={passwordModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>تغییر کلمه عبور</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <X color={colors.textLight} size={22} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.textLight }]}>کلمه عبور فعلی:</Text>
              <TextInput
                secureTextEntry
                value={oldPassword}
                onChangeText={setOldPassword}
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="کلمه عبور فعلی را وارد کنید"
                placeholderTextColor="#94a3b8"
              />

              <Text style={[styles.inputLabel, { color: colors.textLight, marginTop: 12 }]}>کلمه عبور جدید:</Text>
              <TextInput
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="حداقل ۶ کاراکتر"
                placeholderTextColor="#94a3b8"
              />

              <Text style={[styles.inputLabel, { color: colors.textLight, marginTop: 12 }]}>تکرار کلمه عبور جدید:</Text>
              <TextInput
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="تکرار کلمه عبور جدید"
                placeholderTextColor="#94a3b8"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                  onPress={handleChangePassword}
                >
                  <Text style={styles.modalSubmitText}>ثبت کلمه عبور جدید</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                  onPress={() => setPasswordModalVisible(false)}
                >
                  <Text style={[styles.modalCancelText, { color: colors.textLight }]}>انصراف</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* LOGOUT CONFIRMATION MODAL */}
      <Modal visible={logoutModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.logoutModalBody}>
              <View style={styles.logoutIconCircle}>
                <LogOut size={32} color="#dc2626" />
              </View>
              <Text style={[styles.logoutModalTitle, { color: colors.text }]}>خروج از حساب کاربری</Text>
              <Text style={[styles.logoutModalSub, { color: colors.textLight }]}>
                آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟ برای استفاده مجدد باید دوباره وارد شوید.
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.logoutConfirmBtn} onPress={handleConfirmLogout}>
                  <Text style={styles.logoutConfirmText}>بله، خروج</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                  onPress={() => setLogoutModalVisible(false)}
                >
                  <Text style={[styles.modalCancelText, { color: colors.textLight }]}>انصراف</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      {/* Server Switch Modal */}
      <ServerSwitchModal
        visible={serverModalVisible}
        onClose={() => setServerModalVisible(false)}
        onChanged={(url) => {
          getServerConfig().then(cfg => {
            setServerModeState(cfg.mode);
            setActiveServerUrl(cfg.url);
          });
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONT_FAMILY.bold,
  },
  backButton: { padding: 8 },
  content: { padding: 20 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
    marginBottom: 10,
    textAlign: 'right',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  leftContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  rowText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.medium,
  },
  actionLinkText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },
  versionText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  logoutButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  logoutButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.bold,
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.medium,
    marginBottom: 6,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    textAlign: 'right',
    fontFamily: FONT_FAMILY.regular,
  },
  modalActions: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginTop: 20,
  },
  modalSubmitBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#ffffff',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
  },
  modalCancelBtn: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalCancelText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
  },
  logoutModalBody: {
    padding: 24,
    alignItems: 'center',
  },
  logoutIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutModalTitle: {
    fontSize: 17,
    fontFamily: FONT_FAMILY.bold,
    marginBottom: 8,
  },
  logoutModalSub: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  logoutConfirmBtn: {
    flex: 1,
    backgroundColor: '#dc2626',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutConfirmText: {
    color: '#ffffff',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
  },
});

export default SettingsScreen;
