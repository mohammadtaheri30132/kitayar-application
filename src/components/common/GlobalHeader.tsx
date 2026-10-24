import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { Bell } from 'lucide-react-native';
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
}

const GlobalHeader = ({
  onNotificationPress,
  title = 'کیتایار',
  subtitle,
  dateInfo = 'یار هوشمند معلم',
  notificationCount = 0,
}: GlobalHeaderProps) => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      navigation.navigate('NotificationsScreen');
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
      {/* Right Side (Persian Start): Brand Logo & Subtitle / Date */}
      <View style={styles.brandSection}>
        <Text style={[styles.logoText, { color: colors.primary }]}>{title}</Text>
        {displaySubtitle ? (
          <Text style={[styles.dateText, { color: colors.textLight }]} numberOfLines={1}>
            {displaySubtitle}
          </Text>
        ) : null}
      </View>

      {/* Left Side (Persian End): Notification Action */}
      <TouchableOpacity
        style={styles.notificationSection}
        onPress={handleNotificationPress}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.notificationBtn,
            { backgroundColor: isDark ? colors.surfaceVariant : '#f8fafc' },
          ]}
        >
          <Bell color={colors.text} size={22} strokeWidth={1.8} />
          {notificationCount > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{notificationCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
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
    height: 64,
    ...shadows.sm,
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
