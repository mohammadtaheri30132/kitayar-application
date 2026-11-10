import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  getServerConfig,
  setServerMode,
  checkServerHealth,
  PROD_SERVER_URL,
  DEFAULT_LOCAL_SERVER_URL,
  ServerMode,
} from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { showSuccess, showError, showWarning } from '../feedback';

interface ServerSwitchModalProps {
  visible: boolean;
  onClose: () => void;
  onChanged?: (newUrl: string) => void;
}

export const ServerSwitchModal: React.FC<ServerSwitchModalProps> = ({
  visible,
  onClose,
  onChanged,
}) => {
  const [selectedMode, setSelectedMode] = useState<ServerMode>('server');
  const [localUrl, setLocalUrl] = useState(DEFAULT_LOCAL_SERVER_URL);
  const [testing, setTesting] = useState(false);
  const [pingResult, setPingResult] = useState<{ ok: boolean; message: string; ms?: number } | null>(null);

  useEffect(() => {
    if (visible) {
      loadConfig();
    }
  }, [visible]);

  const loadConfig = async () => {
    const cfg = await getServerConfig();
    setSelectedMode(cfg.mode);
    if (cfg.mode === 'local') {
      setLocalUrl(cfg.url);
    }
    setPingResult(null);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setPingResult(null);
    const targetUrl = selectedMode === 'server' ? PROD_SERVER_URL : localUrl;
    const res = await checkServerHealth(targetUrl);
    setPingResult(res);
    setTesting(false);
  };

  const handleSave = async () => {
    try {
      const newUrl = await setServerMode(selectedMode, localUrl);
      showSuccess(
        selectedMode === 'server'
          ? 'اتصال به سرور آنلاین کیتایار برقرار شد'
          : 'اتصال به سرور محلی توسعه تنظیم شد'
      );
      if (onChanged) {
        onChanged(newUrl);
      }
      onClose();
    } catch (e: any) {
      showError('خطا در ذخیره تنظیمات سرور');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>تنظیم سرور ارتباطی اپلیکیشن</Text>
            <Text style={styles.subtitle}>
              انتخاب میان سرور آنلاین پروداکشن یا سرور محلی توسعه
            </Text>
          </View>

          {/* Mode 1: Online Server (Default) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setSelectedMode('server');
              setPingResult(null);
            }}
            style={[
              styles.optionCard,
              selectedMode === 'server' && styles.optionCardActive,
            ]}
          >
            <View style={styles.radioRow}>
              <View style={[styles.radio, selectedMode === 'server' && styles.radioSelected]}>
                {selectedMode === 'server' && <View style={styles.radioInner} />}
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.labelRow}>
                  <Text style={styles.optionTitle}>سرور اصلی کیتایار (آنلاین)</Text>
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedBadgeText}>پیش‌فرض</Text>
                  </View>
                </View>
                <Text style={styles.optionDesc} numberOfLines={1}>
                  {PROD_SERVER_URL}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Mode 2: Local Dev Server */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setSelectedMode('local');
              setPingResult(null);
            }}
            style={[
              styles.optionCard,
              selectedMode === 'local' && styles.optionCardActive,
            ]}
          >
            <View style={styles.radioRow}>
              <View style={[styles.radio, selectedMode === 'local' && styles.radioSelected]}>
                {selectedMode === 'local' && <View style={styles.radioInner} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>سرور محلی توسعه (Local / Dev)</Text>
                <Text style={styles.optionDesc}>ویژه برنامه‌نویسی و تست محلی</Text>
              </View>
            </View>

            {selectedMode === 'local' && (
              <View style={styles.localInputContainer}>
                <Text style={styles.inputLabel}>آدرس API محلی:</Text>
                <TextInput
                  style={styles.input}
                  value={localUrl}
                  onChangeText={setLocalUrl}
                  placeholder="مثال: http://10.0.2.2:5001/api یا IP سیستم"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}
          </TouchableOpacity>

          {/* Ping / Test Connection Result */}
          {pingResult && (
            <View
              style={[
                styles.pingBox,
                pingResult.ok ? styles.pingBoxSuccess : styles.pingBoxError,
              ]}
            >
              <Text
                style={[
                  styles.pingText,
                  pingResult.ok ? styles.pingTextSuccess : styles.pingTextError,
                ]}
              >
                {pingResult.ok
                  ? `✅ اتصال موفق (${pingResult.ms} میلی‌ثانیه)`
                  : `❌ عدم دسترسی: ${pingResult.message}`}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleTestConnection}
              disabled={testing}
            >
              {testing ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <Text style={styles.testBtnText}>تست اتصال</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>ذخیره و اعمال</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>انصراف</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontFamily: FONT_FAMILY?.bold || 'System',
    fontSize: 16,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  subtitle: {
    fontFamily: FONT_FAMILY?.regular || 'System',
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  optionCard: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
  },
  optionCardActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  radioRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#2563eb',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563eb',
  },
  labelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionTitle: {
    fontFamily: FONT_FAMILY?.bold || 'System',
    fontSize: 13,
    color: '#1e293b',
    fontWeight: 'bold',
  },
  recommendedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recommendedBadgeText: {
    fontSize: 10,
    color: '#15803d',
    fontWeight: 'bold',
  },
  optionDesc: {
    fontFamily: FONT_FAMILY?.regular || 'System',
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
  },
  localInputContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  inputLabel: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 4,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0f172a',
    textAlign: 'left',
  },
  pingBox: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    alignItems: 'center',
  },
  pingBoxSuccess: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  pingBoxError: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  pingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pingTextSuccess: {
    color: '#166534',
  },
  pingTextError: {
    color: '#991b1b',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  testBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  testBtnText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: 'bold',
  },
  saveBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  closeBtn: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 12,
    color: '#64748b',
  },
});

