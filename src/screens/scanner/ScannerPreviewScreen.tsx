import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { showError, showSuccess, showConfirm } from '../../components/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  RotateCw,
  Crop,
  Download,
  Share2,
  FileText,
  Sparkles,
  Camera,
  Check,
} from 'lucide-react-native';
import Share from 'react-native-share';
import { scannerService, CornerPoint } from '../../services/scanner/scannerService';
import { saveToolHistory } from '../../services/ToolHistoryManager';
import { COLORS } from '../../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FilterTab {
  id: string;
  title: string;
  desc: string;
  icon: any;
}

const FILTERS: FilterTab[] = [
  { id: 'AUTO_ENHANCE', title: 'بهینه‌سازی هوشمند', desc: 'کنتراست و وضوح خودکار', icon: Sparkles },
  { id: 'ORIGINAL', title: 'رنگ اصلی', desc: 'رنگ طبیعی بدون تغییر', icon: Sparkles },
  { id: 'BW_DOCUMENT', title: 'سند سیاه و سفید', desc: 'مناسب برگه آزمون و متن', icon: FileText },
  { id: 'COLOR_DOCUMENT', title: 'سند رنگی', desc: 'تقویت نمودار و امضا', icon: Sparkles },
  { id: 'GRAYSCALE', title: 'طیف خاکستری', desc: 'خاکستری یکنواخت', icon: FileText },
];

interface ScannerPreviewScreenProps {
  route: any;
  navigation: any;
}

export const ScannerPreviewScreen: React.FC<ScannerPreviewScreenProps> = ({ route, navigation }) => {
  const {
    processedUri: initialProcessedUri,
    rawImageUri,
    corners,
    originalWidth,
    originalHeight,
    currentFilter: initialFilter = 'AUTO_ENHANCE',
    rotation: initialRotation = 0,
  } = route.params;

  const [currentUri, setCurrentUri] = useState<string>(initialProcessedUri);
  const [activeFilter, setActiveFilter] = useState<string>(initialFilter);
  const [rotation, setRotation] = useState<number>(initialRotation);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Switch filter mode dynamically
  const handleSelectFilter = async (filterId: string) => {
    if (filterId === activeFilter || isProcessing) return;
    try {
      setIsProcessing(true);
      setActiveFilter(filterId);

      const result = await scannerService.processDocument(
        rawImageUri,
        corners as CornerPoint[],
        filterId,
        rotation
      );

      setCurrentUri(result.uri);
      setSavedSuccess(false);
    } catch (err: any) {
      showError(err?.message || 'اعمال فیلتر با خطا مواجه شد');
    } finally {
      setIsProcessing(false);
    }
  };

  // Rotate document 90 degrees clockwise
  const handleRotate = async () => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      const newRotation = (rotation + 90) % 360;
      setRotation(newRotation);

      const result = await scannerService.processDocument(
        rawImageUri,
        corners as CornerPoint[],
        activeFilter,
        newRotation
      );

      setCurrentUri(result.uri);
      setSavedSuccess(false);
    } catch (err: any) {
      showError('چرخش تصویر با خطا مواجه شد');
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-adjust corners
  const handleEditCorners = () => {
    navigation.navigate('CropAdjustmentScreen', {
      rawImageUri,
      initialCorners: corners,
      imageWidth: originalWidth,
      imageHeight: originalHeight,
      isFallback: false,
    });
  };

  // Save high-resolution scan to device gallery
  const handleSaveToGallery = async () => {
    try {
      setIsExporting(true);
      const fileName = `Kitayar_Doc_${Date.now()}`;
      await scannerService.saveToGallery(currentUri, fileName);

      try {
        await saveToolHistory('اسکن مدرک و اوراق', currentUri);
      } catch (_) {}

      setSavedSuccess(true);
      showSuccess('تصویر اسکن‌شده با کیفیت بالا در گالری ذخیره شد.');
    } catch (err: any) {
      showError(err?.message || 'امکان ذخیره فایل در گالری وجود ندارد');
    } finally {
      setIsExporting(false);
    }
  };

  // Export to high-quality PDF document
  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      const title = `سند_اسکن_شده_${Date.now()}`;
      const pdfResult = await scannerService.exportToPdf([currentUri], title);

      try {
        await saveToolHistory('تولید PDF از اسکن', pdfResult.uri);
      } catch (_) {}

      showConfirm({
        title: 'تولید فایل PDF',
        message: `فایل PDF با موفقیت آماده شد:\n${pdfResult.fileName}\nآیا مایل به اشتراک‌گذاری هستید؟`,
        confirmText: 'اشتراک‌گذاری PDF',
        cancelText: 'بستن',
        isDestructive: false,
        icon: Share2,
        onConfirm: () => {
          Share.open({
            url: pdfResult.uri,
            type: 'application/pdf',
            title: 'اشتراک‌گذاری سند اسکن‌شده',
          }).catch(() => {});
        },
      });
    } catch (err: any) {
      showError(err?.message || 'تولید فایل PDF با مشکل مواجه شد');
    } finally {
      setIsExporting(false);
    }
  };

  // Share processed image
  const handleShare = async () => {
    try {
      await Share.open({
        url: currentUri,
        type: 'image/jpeg',
        title: 'اشتراک‌گذاری تصویر اسکن‌شده',
      });
    } catch (_) {}
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <ArrowRight size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>پیش‌نمایش سند اسکن‌شده</Text>
          <Text style={styles.headerSubtitle}>پرسپکتیو اصلاح‌شده و خوانا</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleRotate} activeOpacity={0.7}>
            <RotateCw size={20} color="#60A5FA" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleEditCorners} activeOpacity={0.7}>
            <Crop size={20} color="#FBBF24" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Scanned Document View */}
      <View style={styles.previewContainer}>
        <View style={styles.imageCard}>
          <Image
            source={{ uri: currentUri }}
            style={styles.previewImage}
            resizeMode="contain"
          />

          {isProcessing && (
            <View style={styles.processingMask}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.processingText}>در حال اعمال فیلتر...</Text>
            </View>
          )}
        </View>
      </View>

      {/* Horizontal Filter Tabs */}
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>حالت‌های بهینه‌سازی و فیلتر مدرک:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map((f) => {
            const isSelected = activeFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => handleSelectFilter(f.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipTitle, isSelected && styles.filterChipTitleActive]}>
                  {f.title}
                </Text>
                <Text style={styles.filterChipDesc}>{f.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Direct Return Button to Form Builder */}
      {route.params?.returnScreen === 'CreateOrEditFormScreen' && (
        <View style={styles.attachDirectContainer}>
          <TouchableOpacity
            style={styles.attachDirectBtn}
            onPress={() => {
              navigation.navigate('CreateOrEditFormScreen', {
                scannedImageUri: currentUri,
              });
            }}
            activeOpacity={0.85}
          >
            <Check size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            <Text style={styles.attachDirectBtnText}>تایید و الحاق مستقیم به سوال فرم</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Action Buttons Toolbar */}
      <View style={styles.actionsBar}>
        <TouchableOpacity
          style={styles.retakeBtn}
          onPress={() => navigation.navigate('DocumentScannerScreen')}
          activeOpacity={0.7}
        >
          <Camera size={18} color="#94A3B8" style={{ marginLeft: 6 }} />
          <Text style={styles.retakeBtnText}>اسکن مجدد</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareBtn}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Share2 size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
          <Text style={styles.shareBtnText}>اشتراک</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.pdfBtn}
          onPress={handleExportPdf}
          activeOpacity={0.7}
          disabled={isExporting}
        >
          <FileText size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
          <Text style={styles.pdfBtnText}>خروجی PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, savedSuccess && styles.saveBtnSuccess]}
          onPress={handleSaveToGallery}
          activeOpacity={0.8}
          disabled={isExporting}
        >
          {savedSuccess ? (
            <>
              <Check size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              <Text style={styles.saveBtnText}>ذخیره شد</Text>
            </>
          ) : (
            <>
              <Download size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              <Text style={styles.saveBtnText}>ذخیره در گالری</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Exporting Loading Overlay */}
      {isExporting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingTitle}>در حال آماده‌سازی و ذخیره...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  previewContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  processingMask: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  filterSection: {
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  filterSectionTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 8,
    textAlign: 'left',
  },
  filterScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#334155',
    alignItems: 'center',
  },
  filterChipActive: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  filterChipTitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  filterChipTitleActive: {
    color: '#60A5FA',
  },
  filterChipDesc: {
    color: '#64748B',
    fontSize: 10,
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 8,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#1E293B',
  },
  retakeBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#334155',
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#D97706',
  },
  pdfBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  saveBtnSuccess: {
    backgroundColor: '#059669',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  loadingBox: {
    backgroundColor: '#1E293B',
    padding: 24,
    borderRadius: 18,
    alignItems: 'center',
    width: '80%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  loadingTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 16,
  },
  attachDirectContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0F172A',
  },
  attachDirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  attachDirectBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default ScannerPreviewScreen;
