import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import ToolIcon from '../common/ToolIcon';

interface ConversionHubModalProps {
  visible: boolean;
  onClose: () => void;
  navigation: any;
}

export const ConversionHubModal: React.FC<ConversionHubModalProps> = ({
  visible,
  onClose,
  navigation,
}) => {
  const { colors, isDark } = useTheme();

  const conversionTools = [
    {
      id: 'img-conv',
      toolId: 'imageConverter',
      title: 'تبدیل فرمت عکس (PNG, JPG, WebP)',
      subtitle: 'تغییر پسوند و فرمت انواع تصاویر',
      route: 'ImageConverterScreen',
      params: {},
    },
    {
      id: 'img-to-pdf',
      toolId: 'imgToPdf',
      title: 'تبدیل عکس به PDF',
      subtitle: 'ترکیب و تبدیل تصاویر جزوه و برگه به فایل پی‌دی‌اف',
      route: 'ConverterScreen',
      params: { toolType: 'IMAGE_TO_PDF', title: 'تبدیل عکس به PDF' },
    },
    {
      id: 'pdf-to-img',
      toolId: 'pdfToImg',
      title: 'تبدیل PDF به عکس',
      subtitle: 'استخراج صفحات کتاب و فایل PDF به صورت عکس باکیفیت',
      route: 'ConverterScreen',
      params: { toolType: 'PDF_TO_IMAGE', title: 'تبدیل PDF به عکس' },
    },
    {
      id: 'word-to-pdf',
      toolId: 'wordToPdf',
      title: 'تبدیل Word به PDF',
      subtitle: 'تبدیل اسناد مایکروسافت ورد (DOCX) به PDF',
      route: 'DocumentToPdfScreen',
      params: { type: 'WORD' },
    },
    {
      id: 'excel-to-pdf',
      toolId: 'excelToPdf',
      title: 'تبدیل Excel به PDF',
      subtitle: 'تبدیل شیت‌های اکسل به جدول مرتب PDF',
      route: 'DocumentToPdfScreen',
      params: { type: 'EXCEL' },
    },
    {
      id: 'ppt-to-pdf',
      toolId: 'pptToPdf',
      title: 'تبدیل PowerPoint به PDF',
      subtitle: 'تبدیل اسلایدهای پاورپوینت به فایل پی‌دی‌اف',
      route: 'DocumentToPdfScreen',
      params: { type: 'POWERPOINT' },
    },
    {
      id: 'text-to-pdf',
      toolId: 'textToPdf',
      title: 'تبدیل متن به PDF',
      subtitle: 'تبدیل نوشته‌ها و متون تایپ‌شده به سند PDF',
      route: 'DocumentToPdfScreen',
      params: { type: 'TEXT' },
    },
    {
      id: 'vid-to-audio',
      toolId: 'videoToAudio',
      title: 'تبدیل ویدیو به صوت (MP3)',
      subtitle: 'استخراج صدای تدریس از ویدیو و فیلم‌ها',
      route: 'VideoToAudioScreen',
      params: {},
    },
    {
      id: 'aud-to-text',
      toolId: 'audioToText',
      title: 'تایپ صوتی (صوت به متن فارسی)',
      subtitle: 'تبدیل گفتار و ویس معلم به متن تایپی',
      route: 'AudioToTextScreen',
      params: {},
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
              <Text style={[styles.title, { color: colors.text }]}>مرکز تبدیل فرمت فایل‌ها</Text>
              <Text style={[styles.subtitle, { color: colors.textLight }]}>
                نوع تبدیل مورد نظر خود را انتخاب کنید
              </Text>
            </View>
            <ToolIcon toolId="formatConversion" size={38} />
          </View>

          {/* Options List */}
          <ScrollView contentContainerStyle={styles.content}>
            {conversionTools.map((item) => (
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
    maxHeight: '85%',
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

export default ConversionHubModal;
