import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { Bell, HelpCircle, Settings, Wallet } from 'lucide-react-native';
import { FONT_FAMILY } from '../../theme/typography';
import { radius, shadows } from '../../theme/tokens';

interface GlobalHeaderProps {
  onNotificationPress?: () => void;
  title?: string;
  subtitle?: string;
  dateInfo?: string;
  notificationCount?: number;
  onProfilePress?: () => void;
  fullName?: string;
  userFullName?: string;
  avatarUrl?: string;
  walletBalance?: number;
  onWalletPress?: () => void;
  showHomeActions?: boolean;
  onSettingsPress?: () => void;
  onSupportPress?: () => void;
}

const GlobalHeader = ({
  onNotificationPress,
  title = 'کیتایار',
  subtitle,
  dateInfo = 'یار هوشمند معلم',
  notificationCount = 0,
  showHomeActions = false,
  onProfilePress,
  userFullName,
  fullName,
  avatarUrl,
  walletBalance,
  onWalletPress,
  onSettingsPress,
  onSupportPress,
}: GlobalHeaderProps) => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();

  const activeName = userFullName || fullName;

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      navigation.navigate('NotificationsScreen');
    }
  };

  const handleSettingsPress = () => {
    if (onSettingsPress) {
      onSettingsPress();
    } else {
      navigation.navigate('SettingsScreen');
    }
  };

  const handleSupportPress = () => {
    if (onSupportPress) {
      onSupportPress();
    } else {
      navigation.navigate('SupportTicketsScreen');
    }
  };

  const handleWalletPress = () => {
    if (onWalletPress) {
      onWalletPress();
    } else {
      navigation.navigate('TeacherWalletScreen');
    }
  };

  const displaySubtitle = subtitle || dateInfo;

  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.borderSubtle || colors.border,
        },
      ]}
    >
      {/* Right Side (Persian Start): User Profile & Balance OR Brand */}
      {activeName ? (
        <View style={styles.userSection}>
          <TouchableOpacity
            onPress={onProfilePress || (() => navigation.navigate('ProfileScreen'))}
            activeOpacity={0.8}
            style={styles.avatarWrapper}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarFallbackText}>
                  {activeName.trim().charAt(0) || 'م'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.nameAndWalletCol}>
            <Text style={[styles.userNameText, { color: colors.text }]} numberOfLines={1}>
              {activeName}
            </Text>
            <Text style={[styles.walletBalanceText, { color: colors.primary }]} numberOfLines={1}>
              موجودی کیف پول: {walletBalance !== undefined ? walletBalance.toLocaleString('fa-IR') : '۰'} تومان
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.brandSection}>
          <Text style={[styles.logoText, { color: colors.primary }]}>{title}</Text>
          {displaySubtitle ? (
            <Text style={[styles.dateText, { color: colors.textLight }]} numberOfLines={1}>
              {displaySubtitle}
            </Text>
          ) : null}
        </View>
      )}

      {/* Left Side (Persian End): Wallet Button & Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[
            styles.walletButton,
            {
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
              borderColor: isDark ? '#059669' : '#a7f3d0',
            },
          ]}
          onPress={handleWalletPress}
          activeOpacity={0.7}
        >
          <Wallet color="#10b981" size={16} strokeWidth={2.2} />
          <Text style={styles.walletBtnText}>کیف پول</Text>
        </TouchableOpacity>

        {showHomeActions && (
          <>
            <TouchableOpacity
              style={styles.actionBtnWrapper}
              onPress={handleSupportPress}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.headerBtn,
                  { backgroundColor: isDark ? colors.surfaceVariant : '#f8fafc' },
                ]}
              >
                <HelpCircle color={colors.text} size={19} strokeWidth={1.8} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnWrapper}
              onPress={handleSettingsPress}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.headerBtn,
                  { backgroundColor: isDark ? colors.surfaceVariant : '#f8fafc' },
                ]}
              >
                <Settings color={colors.text} size={19} strokeWidth={1.8} />
              </View>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.actionBtnWrapper}
          onPress={handleNotificationPress}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.headerBtn,
              { backgroundColor: isDark ? colors.surfaceVariant : '#f8fafc' },
            ]}
          >
            <Bell color={colors.text} size={20} strokeWidth={1.8} />
            {notificationCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{notificationCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    minHeight: 64,
    ...shadows.sm,
  },
  userSection: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: FONT_FAMILY.bold,
  },
  nameAndWalletCol: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
  },
  walletBalanceText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.medium,
    marginTop: 2,
    textAlign: 'right',
  },
  walletButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  walletBtnText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bold,
    color: '#059669',
  },
  actionsContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  brandSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontFamily: FONT_FAMILY.black,
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 2,
    textAlign: 'right',
  },
  notificationSection: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: FONT_FAMILY.bold,
  },
});

export default GlobalHeader;
