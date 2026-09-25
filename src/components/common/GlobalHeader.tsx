import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, I18nManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { Bell } from 'lucide-react-native';

interface GlobalHeaderProps {
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  fullName?: string;
  dateInfo?: string;
  notificationCount?: number;
}

const GlobalHeader = ({ 
  onNotificationPress, 
  onProfilePress,
  fullName = 'آقای احمدی',
  dateInfo = '۱۸ مرداد ۱۴۰۴',
  notificationCount = 3
}: GlobalHeaderProps) => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      navigation.navigate('NotificationsScreen');
    }
  };

  return (
    <View style={[styles.headerContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      
      {/* Right Side: Profile Info */}
      <TouchableOpacity style={styles.profileSection} onPress={onProfilePress} activeOpacity={0.7}>
        <View style={styles.avatarWrapper}>
          <Image 
            source={{ uri: 'https://i.pravatar.cc/150?u=fake@pravatar.com' }} 
            style={styles.avatar} 
          />
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>{fullName}</Text>
          <Text style={[styles.dateText, { color: colors.textLight }]}>{dateInfo}</Text>
        </View>
      </TouchableOpacity>

      {/* Center: Logo */}
      <View style={styles.logoSection}>
        <Text style={[styles.logoText, { color: colors.primary }]}>کیتایار</Text>
      </View>

      {/* Left Side: Notification */}
      <TouchableOpacity style={styles.notificationSection} onPress={handleNotificationPress} activeOpacity={0.7}>
        <Bell color={colors.text} size={26} strokeWidth={1.8} />
        {notificationCount > 0 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{notificationCount}</Text>
          </View>
        )}
      </TouchableOpacity>
      
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    height: 72,
  },
  profileSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  avatarWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 10,
    backgroundColor: '#f1f5f9', // fallback
    borderWidth: 2,
    borderColor: '#e0e7ff',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
  },
  userInfo: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
  },
  logoSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'IRANSansX', // If there's a specific display font, it would go here
    letterSpacing: -0.5,
  },
  notificationSection: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    position: 'relative',
    paddingRight: 4,
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  }
});

export default GlobalHeader;
