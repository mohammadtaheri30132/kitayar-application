import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { FONT_FAMILY } from '../../theme/typography';
import { shadows } from '../../theme/tokens';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PersianBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: number | string;
  closeOnBackdrop?: boolean;
  showHandle?: boolean;
  showCloseButton?: boolean;
}

export const PersianBottomSheet: React.FC<PersianBottomSheetProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxHeight = '85%',
  closeOnBackdrop = true,
  showHandle = true,
  showCloseButton = true,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Open & Close animations
  useEffect(() => {
    if (visible) {
      translateY.setValue(SCREEN_HEIGHT);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 24,
          stiffness: 220,
          mass: 0.8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, backdropOpacity, translateY]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Swipe-down pan responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.7) {
          handleDismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            damping: 24,
            stiffness: 220,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View style={styles.rootContainer}>
        {/* Full-screen backdrop touchable */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={closeOnBackdrop ? handleDismiss : undefined}
        >
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropOpacity,
                backgroundColor: colors.backdrop || 'rgba(15, 23, 42, 0.6)',
              },
            ]}
          />
        </Pressable>

        {/* Keyboard Avoidance wrapper */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
          pointerEvents="box-none"
        >
          {/* Dismiss touchable capturing space above sheet */}
          <Pressable
            style={styles.flexDismissArea}
            onPress={closeOnBackdrop ? handleDismiss : undefined}
          />

          <Animated.View
            style={[
              styles.sheetContainer,
              {
                transform: [{ translateY }],
                backgroundColor: colors.surface,
                paddingBottom: Math.max(insets.bottom, 16) + 80, // Always 80px extra bottom clearance
                maxHeight: maxHeight as any,
              },
            ]}
          >
            {/* Gesture Drag Bar Area */}
            {showHandle && (
              <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
                <View
                  style={[
                    styles.dragHandle,
                    { backgroundColor: isDark ? '#475569' : '#cbd5e1' },
                  ]}
                />
              </View>
            )}

            {/* Header */}
            {(title || showCloseButton) && (
              <View style={[styles.headerRow, { borderBottomColor: colors.borderSubtle || colors.border }]}>
                {/* RTL Start: Title & Subtitle */}
                <View style={styles.titleWrapper}>
                  {title && (
                    <Text style={[styles.titleText, { color: colors.text }]}>
                      {title}
                    </Text>
                  )}
                  {subtitle && (
                    <Text style={[styles.subtitleText, { color: colors.textLight }]}>
                      {subtitle}
                    </Text>
                  )}
                </View>

                {/* RTL End: Close Button */}
                {showCloseButton ? (
                  <TouchableOpacity
                    style={[styles.closeBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
                    onPress={handleDismiss}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={18} color={colors.textLight} />
                  </TouchableOpacity>
                ) : (
                  <View style={{ width: 32 }} />
                )}
              </View>
            )}

            {/* Sheet Body Content */}
            <View style={styles.bodyContent}>{children}</View>

            {/* Footer */}
            {footer && <View style={styles.footerContainer}>{footer}</View>}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  flexDismissArea: {
    flex: 1,
    width: '100%',
  },
  sheetContainer: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    ...shadows.sheet,
    overflow: 'hidden',
  },
  dragHandleArea: {
    width: '100%',
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  titleWrapper: {
    flex: 1,
    alignItems: 'flex-end',
    paddingLeft: 12,
  },
  titleText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    textAlign: 'right',
  },
  subtitleText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    marginTop: 2,
    textAlign: 'right',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
});
