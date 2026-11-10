import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, ChevronLeft, Minimize2, FileText, Image as ImageIcon } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import ToolIcon from '../common/ToolIcon';

interface CompressionHubModalProps {
  visible: boolean;
  onClose: () => void;
  navigation: any;
}

export const CompressionHubModal: React.FC<CompressionHubModalProps> = ({
  visible,
  onClose,
  navigation,
}) => {
  const { colors, isDark } = useTheme();

  const compressionTools = [
    {
      id: 'img-comp',
      toolId: 'imageCompress',
      title: 'کاهش حجم تصویر',
      subtitle: 'فشرده‌سازی عکس‌ها با حفظ حداکثر کیفیت',
      route: 'ImageCompressorScreen',
      params: {},
    },
    {
      id: 'pdf-comp',
      toolId: 'pdfCompress',
      title: 'فشرده‌سازی فایل PDF',
      subtitle: 'کاهش حجم اسناد پی‌دی‌اف جهت ارسال در شاد و پیام‌رسان‌ها',
      route: 'AdvancedPdfScreen',
      params: { toolId: 'COMPRESS_PDF' },
    },
  ];

  const handleSelect = (route: string, params: any) => {
    onClose();
    navigation.navigate(route, params);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color={colors.textLight} />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={[styles.title, { color: colors.text }]}>مرکز کاهش حجم و فشرده‌سازی</Text>
              <Text style={[styles.subtitle, { color: colors.textLight }]}>
                نوع فایلی که می‌خواهید فشرده کنید را انتخاب کنید
              </Text>
            </View>
            <ToolIcon toolId="fileCompression" size={38} />
          </View>

          {/* Options */}
          <ScrollView contentContainerStyle={styles.content}>
            {compressionTools.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                    borderColor: colors.border,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => handleSelect(item.route, item.params)}
              >
                <ChevronLeft size={20} color={colors.textLight} />
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textLight }]}>
                    {item.subtitle}
                  </Text>
                </View>
                <ToolIcon toolId={item.toolId} size={44} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Estedad-FD-Bold',
    fontWeight: '700',
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    textAlign: 'right',
    marginTop: 2,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  cardInfo: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'flex-end',
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Estedad-FD-Bold',
    fontWeight: '700',
    textAlign: 'right',
  },
  cardSubtitle: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    textAlign: 'right',
    marginTop: 2,
  },
});

export default CompressionHubModal;
