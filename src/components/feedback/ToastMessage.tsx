import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { FONT_FAMILY, radius, shadows } from '../../theme';

export type FeedbackType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessageProps {
  id: string;
  type: FeedbackType;
  title?: string;
  message: string;
  duration?: number;
  onDismiss: (id: string) => void;
}

export const ToastMessage: React.FC<ToastMessageProps> = ({
  id,
  type,
  title,
  message,
  duration = 3500,
  onDismiss,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  const dismissTimer = useRef<any>(null);

  const handleDismiss = () => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -80,
        duration: 180,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.94,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(id);
    });
  };

  useEffect(() => {
    // Entrance Animation
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 18,
        stiffness: 240,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 16,
        stiffness: 240,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss countdown
    if (duration > 0) {
      dismissTimer.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    }

    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }
    };
  }, []);

  // Visual semantic tokens
  const getSemanticConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 size={22} color="#10b981" />,
          accentColor: '#10b981',
          bgLight: '#ecfdf5',
          bgDark: '#064e3b',
          badgeBg: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.12)',
        };
      case 'error':
        return {
          icon: <XCircle size={22} color="#ef4444" />,
          accentColor: '#ef4444',
          bgLight: '#fef2f2',
          bgDark: '#7f1d1d',
          badgeBg: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.12)',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={22} color="#f59e0b" />,
          accentColor: '#f59e0b',
          bgLight: '#fffbeb',
          bgDark: '#78350f',
          badgeBg: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.12)',
        };
      case 'info':
      default:
        return {
          icon: <Info size={22} color="#0284c7" />,
          accentColor: '#0284c7',
          bgLight: '#f0f9ff',
          bgDark: '#0c4a6e',
          badgeBg: isDark ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.12)',
        };
    }
  };

  const config = getSemanticConfig();

  // Position at top with safe-area spacing
  const topOffset = Math.max(insets.top, Platform.OS === 'android' ? 12 : 16) + 4;

  return (
    <Animated.View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.toastWrapper,
        {
          top: topOffset,
          opacity,
          transform: [{ translateY }, { scale }],
          backgroundColor: isDark ? (colors.surface || '#1e293b') : '#ffffff',
          borderRightColor: config.accentColor,
        },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Persian RTL: Right side is the icon */}
        <View style={[styles.iconContainer, { backgroundColor: config.badgeBg }]}>
          {config.icon}
        </View>

        {/* Middle: Persian title and message */}
        <View style={styles.textContainer}>
          {title ? (
            <Text
              style={[
                styles.titleText,
                { color: isDark ? '#f8fafc' : '#0f172a' },
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
          ) : null}
          <Text
            style={[
              styles.messageText,
              { color: isDark ? '#cbd5e1' : '#334155' },
            ]}
            numberOfLines={3}
          >
            {message}
          </Text>
        </View>

        {/* Left side: Close action button */}
        <TouchableOpacity
          onPress={handleDismiss}
          style={styles.closeButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="بستن پیام"
        >
          <X size={16} color={isDark ? '#94a3b8' : '#64748b'} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99999,
    borderRadius: radius.lg,
    borderRightWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    ...shadows.lg,
    elevation: 10,
  },
  contentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  titleText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 2,
    writingDirection: 'rtl',
  },
  messageText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  closeButton: {
    padding: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
