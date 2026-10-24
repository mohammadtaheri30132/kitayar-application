import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  Trash2,
  LogOut,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { FONT_FAMILY, radius } from '../../theme';
import { ToastMessage, FeedbackType } from './ToastMessage';
import { PersianBottomSheet } from '../common/PersianBottomSheet';

export type { FeedbackType };

export interface ToastOptions {
  title?: string;
  message: string;
  type?: FeedbackType;
  duration?: number;
}

export interface DialogButton {
  text: string;
  onPress?: () => void | Promise<void>;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface DialogOptions {
  title: string;
  message: string;
  type?: FeedbackType | 'destructive';
  buttons?: DialogButton[];
  onDismiss?: () => void;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  type?: 'danger' | 'warning' | 'info' | FeedbackType;
  icon?: 'delete' | 'logout' | 'warning' | 'info' | 'help';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface FeedbackContextType {
  showToast: (options: ToastOptions | string, type?: FeedbackType) => void;
  showDialog: (options: DialogOptions) => void;
  showConfirm: (options: ConfirmOptions) => void;
  showError: (message: string, title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
}

const FeedbackContext = createContext<FeedbackContextType | null>(null);

// Global imperative ref for calling feedback from anywhere without hook requirement
let globalFeedbackHandler: FeedbackContextType | null = null;

export const showToast = (options: ToastOptions | string, type?: FeedbackType) => {
  if (globalFeedbackHandler) {
    globalFeedbackHandler.showToast(options, type);
  } else {
    console.warn('[FeedbackContext] showToast called before FeedbackProvider mounted');
  }
};

export const showError = (message: string, title?: string) => {
  if (globalFeedbackHandler) {
    globalFeedbackHandler.showError(message, title);
  } else {
    console.warn('[FeedbackContext] showError called before FeedbackProvider mounted');
  }
};

export const showSuccess = (message: string, title?: string) => {
  if (globalFeedbackHandler) {
    globalFeedbackHandler.showSuccess(message, title);
  } else {
    console.warn('[FeedbackContext] showSuccess called before FeedbackProvider mounted');
  }
};

export const showWarning = (message: string, title?: string) => {
  if (globalFeedbackHandler) {
    globalFeedbackHandler.showWarning(message, title);
  } else {
    console.warn('[FeedbackContext] showWarning called before FeedbackProvider mounted');
  }
};

export const showInfo = (message: string, title?: string) => {
  if (globalFeedbackHandler) {
    globalFeedbackHandler.showInfo(message, title);
  } else {
    console.warn('[FeedbackContext] showInfo called before FeedbackProvider mounted');
  }
};

export const showConfirm = (options: ConfirmOptions) => {
  if (globalFeedbackHandler) {
    globalFeedbackHandler.showConfirm(options);
  } else {
    console.warn('[FeedbackContext] showConfirm called before FeedbackProvider mounted');
  }
};

export const showDialog = (options: DialogOptions) => {
  if (globalFeedbackHandler) {
    globalFeedbackHandler.showDialog(options);
  } else {
    console.warn('[FeedbackContext] showDialog called before FeedbackProvider mounted');
  }
};

interface ActiveToastItem {
  id: string;
  type: FeedbackType;
  title?: string;
  message: string;
  duration?: number;
}

export const FeedbackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { colors, isDark } = useTheme();

  // Active toast item (single active toast with deduplication / immediate replacement)
  const [currentToast, setCurrentToast] = useState<ActiveToastItem | null>(null);
  const lastToastMessageRef = useRef<string>('');
  const lastToastTimeRef = useRef<number>(0);

  // Bottom Sheet Confirmation State
  const [sheetState, setSheetState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: FeedbackType | 'destructive';
    iconType: 'delete' | 'logout' | 'warning' | 'info' | 'help';
    buttons: DialogButton[];
    onDismiss?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    iconType: 'info',
    buttons: [],
  });

  const [isConfirming, setIsConfirming] = useState(false);

  const handleDismissToast = useCallback((id: string) => {
    setCurrentToast(prev => (prev?.id === id ? null : prev));
  }, []);

  const showToastFn = useCallback(
    (options: ToastOptions | string, typeOverride?: FeedbackType) => {
      const opts: ToastOptions =
        typeof options === 'string'
          ? { message: options, type: typeOverride || 'info' }
          : { ...options, type: options.type || typeOverride || 'info' };

      const now = Date.now();
      // Deduplicate rapid repeat of exact same message within 1.5s
      if (
        opts.message === lastToastMessageRef.current &&
        now - lastToastTimeRef.current < 1500
      ) {
        return;
      }

      lastToastMessageRef.current = opts.message;
      lastToastTimeRef.current = now;

      const newId = `toast_${now}_${Math.random().toString(36).substring(2, 7)}`;
      setCurrentToast({
        id: newId,
        title: opts.title,
        message: opts.message,
        type: opts.type || 'info',
        duration: opts.duration || 3500,
      });
    },
    []
  );

  const showSuccessFn = useCallback(
    (message: string, title?: string) => {
      showToastFn({ message, title, type: 'success' });
    },
    [showToastFn]
  );

  const showErrorFn = useCallback(
    (message: string, title?: string) => {
      showToastFn({ message, title, type: 'error' });
    },
    [showToastFn]
  );

  const showWarningFn = useCallback(
    (message: string, title?: string) => {
      showToastFn({ message, title, type: 'warning' });
    },
    [showToastFn]
  );

  const showInfoFn = useCallback(
    (message: string, title?: string) => {
      showToastFn({ message, title, type: 'info' });
    },
    [showToastFn]
  );

  // Close Bottom Sheet
  const closeSheet = useCallback(() => {
    if (isConfirming) return; // Prevent dismiss while async action executes
    if (sheetState.onDismiss) {
      sheetState.onDismiss();
    }
    setSheetState(prev => ({ ...prev, visible: false }));
  }, [sheetState, isConfirming]);

  // Show generic dialog in bottom sheet
  const showDialogFn = useCallback((options: DialogOptions) => {
    setIsConfirming(false);
    setSheetState({
      visible: true,
      title: options.title,
      message: options.message,
      type: options.type,
      iconType:
        options.type === 'destructive'
          ? 'delete'
          : options.type === 'warning'
          ? 'warning'
          : options.type === 'error'
          ? 'warning'
          : 'info',
      buttons:
        options.buttons && options.buttons.length > 0
          ? options.buttons
          : [{ text: 'متوجه شدم', style: 'default' }],
      onDismiss: options.onDismiss,
    });
  }, []);

  // Show Confirmation in bottom sheet
  const showConfirmFn = useCallback(
    (options: ConfirmOptions) => {
      setIsConfirming(false);

      const isDestructive = options.isDestructive || options.type === 'danger';

      // Determine appropriate Persian icon
      let detectedIcon: 'delete' | 'logout' | 'warning' | 'info' | 'help' =
        options.icon || (isDestructive ? 'delete' : 'warning');

      if (!options.icon) {
        const fullText = `${options.title} ${options.message}`.toLowerCase();
        if (fullText.includes('خروج') || fullText.includes('logout') || fullText.includes('حساب')) {
          detectedIcon = 'logout';
        } else if (fullText.includes('حذف') || fullText.includes('delete') || fullText.includes('پاک')) {
          detectedIcon = 'delete';
        } else if (fullText.includes('انصراف') || fullText.includes('صرف نظر') || fullText.includes('تغییرات')) {
          detectedIcon = 'warning';
        }
      }

      setSheetState({
        visible: true,
        title: options.title,
        message: options.message,
        type: isDestructive ? 'destructive' : 'warning',
        iconType: detectedIcon,
        buttons: [
          {
            text: options.cancelText || 'انصراف',
            style: 'cancel',
            onPress: options.onCancel,
          },
          {
            text: options.confirmText || (isDestructive ? 'بله، حذف شود' : 'تایید'),
            style: isDestructive ? 'destructive' : 'default',
            onPress: options.onConfirm,
          },
        ],
      });
    },
    []
  );

  // Sync global ref
  useEffect(() => {
    globalFeedbackHandler = {
      showToast: showToastFn,
      showDialog: showDialogFn,
      showConfirm: showConfirmFn,
      showError: showErrorFn,
      showSuccess: showSuccessFn,
      showWarning: showWarningFn,
      showInfo: showInfoFn,
    };
    return () => {
      globalFeedbackHandler = null;
    };
  }, [
    showToastFn,
    showDialogFn,
    showConfirmFn,
    showErrorFn,
    showSuccessFn,
    showWarningFn,
    showInfoFn,
  ]);

  // Render Confirmation Icon
  const renderConfirmIcon = () => {
    switch (sheetState.iconType) {
      case 'delete':
        return (
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
            <Trash2 size={28} color="#ef4444" />
          </View>
        );
      case 'logout':
        return (
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(249, 115, 22, 0.12)' }]}>
            <LogOut size={28} color="#f97316" />
          </View>
        );
      case 'warning':
        return (
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
            <AlertTriangle size={28} color="#f59e0b" />
          </View>
        );
      case 'help':
        return (
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
            <HelpCircle size={28} color="#3b82f6" />
          </View>
        );
      case 'info':
      default:
        return (
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(14, 165, 233, 0.12)' }]}>
            <Info size={28} color="#0ea5e9" />
          </View>
        );
    }
  };

  return (
    <FeedbackContext.Provider
      value={{
        showToast: showToastFn,
        showDialog: showDialogFn,
        showConfirm: showConfirmFn,
        showError: showErrorFn,
        showSuccess: showSuccessFn,
        showWarning: showWarningFn,
        showInfo: showInfoFn,
      }}
    >
      {children}

      {/* Centralized Toast Notification */}
      {currentToast && (
        <ToastMessage
          key={currentToast.id}
          id={currentToast.id}
          type={currentToast.type}
          title={currentToast.title}
          message={currentToast.message}
          duration={currentToast.duration}
          onDismiss={handleDismissToast}
        />
      )}

      {/* Reusable Persian Bottom Sheet for Confirmations & Prompts */}
      <PersianBottomSheet
        visible={sheetState.visible}
        onClose={closeSheet}
        closeOnBackdrop={!isConfirming}
        showCloseButton={false}
        showHandle={true}
      >
        <View style={styles.sheetContent}>
          {/* Prominent Action Icon */}
          <View style={styles.iconContainer}>{renderConfirmIcon()}</View>

          {/* Title */}
          <Text
            style={[
              styles.sheetTitle,
              { color: isDark ? '#f8fafc' : '#0f172a' },
            ]}
          >
            {sheetState.title}
          </Text>

          {/* Descriptive Message */}
          <Text
            style={[
              styles.sheetMessage,
              { color: isDark ? '#94a3b8' : '#64748b' },
            ]}
          >
            {sheetState.message}
          </Text>

          {/* Action Buttons Row */}
          <View style={styles.buttonRow}>
            {sheetState.buttons.map((btn, index) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';

              return (
                <TouchableOpacity
                  key={index}
                  disabled={isConfirming}
                  activeOpacity={0.8}
                  style={[
                    styles.button,
                    isDestructive
                      ? styles.buttonDestructive
                      : isCancel
                      ? [styles.buttonCancel, { borderColor: isDark ? '#334155' : '#e2e8f0' }]
                      : [styles.buttonPrimary, { backgroundColor: colors.primary || '#3b82f6' }],
                  ]}
                  onPress={async () => {
                    if (isCancel) {
                      closeSheet();
                      if (btn.onPress) {
                        btn.onPress();
                      }
                      return;
                    }

                    if (btn.onPress) {
                      try {
                        setIsConfirming(true);
                        const result = btn.onPress();
                        if (result instanceof Promise) {
                          await result;
                        }
                      } catch (err) {
                        console.error('[FeedbackContext] Button action error:', err);
                      } finally {
                        setIsConfirming(false);
                        closeSheet();
                      }
                    } else {
                      closeSheet();
                    }
                  }}
                >
                  {isConfirming && !isCancel ? (
                    <ActivityIndicator
                      size="small"
                      color={isDestructive ? '#ffffff' : '#ffffff'}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.buttonText,
                        isDestructive
                          ? styles.buttonTextDestructive
                          : isCancel
                          ? [styles.buttonTextCancel, { color: isDark ? '#94a3b8' : '#64748b' }]
                          : styles.buttonTextPrimary,
                      ]}
                    >
                      {btn.text}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </PersianBottomSheet>
    </FeedbackContext.Provider>
  );
};

export const useFeedback = (): FeedbackContextType => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  sheetContent: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 8,
    writingDirection: 'rtl',
  },
  sheetMessage: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    writingDirection: 'rtl',
    paddingHorizontal: 8,
  },
  buttonRow: {
    flexDirection: 'row-reverse',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonPrimary: {},
  buttonCancel: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  buttonDestructive: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
  },
  buttonTextPrimary: {
    color: '#ffffff',
  },
  buttonTextCancel: {},
  buttonTextDestructive: {
    color: '#ffffff',
  },
});
