import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, 
  Alert, ScrollView, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../api/axiosConfig';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Settings, Phone, MessageCircle, Info, LogOut, ChevronLeft } from 'lucide-react-native';

const ProfileScreen = ({ navigation }: any) => {
  const { logout } = useContext(AuthContext);
  const { colors, isDark } = useTheme();

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/teacher/profile');
        if (response.data.success) {
          setFullName(response.data.data.fullName || 'محمد طاهری'); // Mock fallback
          setPhoneNumber(response.data.data.username || '09123456789');
        }
      } catch (error) {
        setFullName('محمد طاهری'); // Fallback if no backend
        setPhoneNumber('09123456789');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

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
            await logout(); 
          }
        }
      ]
    );
  };

  const menuItems = [
    { title: 'تنظیمات', icon: Settings, route: 'SettingsScreen', color: colors.primary },
    { title: 'تماس با ما', icon: Phone, route: 'PlaceholderScreen', params: { title: 'تماس با ما' }, color: '#10b981' },
    { title: 'ارتباط با ما', icon: MessageCircle, route: 'PlaceholderScreen', params: { title: 'ارتباط با ما' }, color: '#8b5cf6' },
    { title: 'درباره ما', icon: Info, route: 'PlaceholderScreen', params: { title: 'درباره ما' }, color: '#f59e0b' },
  ];

  if (isLoading) {
    return (
      <View style={[styles.centerBox, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color={colors.textLight} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>حساب کاربری</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarWrapper, { borderColor: colors.primary, shadowColor: colors.primary }]}>
            <Image 
              source={{ uri: 'https://i.pravatar.cc/150?u=fake@pravatar.com' }} 
              style={styles.avatarImage} 
            />
          </View>
          <Text style={[styles.avatarName, { color: colors.text }]}>{fullName}</Text>
          <Text style={[styles.avatarPhone, { color: colors.textLight }]}>{phoneNumber}</Text>
          <Text style={[styles.bio, { color: colors.textLight }]}>
            معلم پایه ششم ابتدایی | علاقه‌مند به تکنولوژی در آموزش
          </Text>
        </View>

        {/* Menu Section */}
        <View style={[styles.menuContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === menuItems.length - 1;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }
                ]}
                onPress={() => navigation.navigate(item.route, item.params)}
              >
                <View style={[styles.iconBox, { backgroundColor: `${item.color}20` }]}>
                  <Icon size={20} color={item.color} />
                </View>
                <Text style={[styles.menuItemText, { color: colors.text }]}>{item.title}</Text>
                <ChevronLeft size={20} color={colors.textLight} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Logout */}
        <TouchableOpacity 
          style={[styles.logoutButton, { borderColor: colors.error, backgroundColor: isDark ? 'rgba(248, 113, 113, 0.1)' : '#fee2e2' }]} 
          onPress={handleLogout}
        >
          <LogOut size={20} color={colors.error} style={{ marginLeft: 8 }} />
          <Text style={[styles.logoutButtonText, { color: colors.error }]}>خروج از حساب کاربری</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  backButton: { padding: 8 },
  
  scrollContainer: { padding: 20, paddingBottom: 40 },
  
  avatarSection: { alignItems: 'center', marginBottom: 32, marginTop: 16 },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    padding: 2,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarName: { fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  avatarPhone: { fontSize: 14, letterSpacing: 1, marginBottom: 12 },
  bio: { fontSize: 14, textAlign: 'center', paddingHorizontal: 20, lineHeight: 22 },

  menuContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },

  logoutButton: { 
    flexDirection: 'row-reverse',
    padding: 16, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1, 
  },
  logoutButtonText: { fontWeight: 'bold', fontSize: 16 },
});

export default ProfileScreen;