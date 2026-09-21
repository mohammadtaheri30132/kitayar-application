import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

// 👈 پوسته‌ی مشترک همه‌ی باتم‌شیت‌های تنظیمات.
// هر آیتم تنظیمات (سربرگ، ساختار، خط‌چین، فونت) از همین کامپوننت استفاده می‌کند
// و می‌تواند هر تعداد که لازم دارد از آن بسازد (چند باتم‌شیت مستقل).
const BottomSheetBase: React.FC<Props> = ({ visible, title, onClose, children, footer }) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
          <View>{children}</View>
          {footer}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 20,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
});

export default BottomSheetBase;