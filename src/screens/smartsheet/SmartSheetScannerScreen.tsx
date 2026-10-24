import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
  Dimensions,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { showError, showWarning } from '../../components/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import {
  ChevronRight,
  Camera,
  Image as ImageIcon,
  KeyRound,
  ScanLine,
  X,
  AlertCircle,
  HelpCircle,
  Check,
  User,
  BookOpen,
} from 'lucide-react-native';
import {
  DocumentCameraView,
  scannerService,
} from '../../services/scanner/scannerService';
import { smartSheetService, LookupSheetResult, OmrScanResult } from '../../services/smartSheetService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const SmartSheetScannerScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const autoOpenManualModal = route?.params?.autoOpenManualModal || false;
  const expectedExamId = route?.params?.expectedExamId;

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState('در حال آماده‌سازی...');

  // Fallback Manual Code Entry Modal State
  const [showManualCodeModal, setShowManualCodeModal] = useState(autoOpenManualModal);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [isLookingUpCode, setIsLookingUpCode] = useState(false);
  const [lastProcessedOmrResult, setLastProcessedOmrResult] = useState<OmrScanResult | null>(null);
  const [lastProcessedImageUri, setLastProcessedImageUri] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<'MODEL_1' | 'MODEL_2' | 'MODEL_3'>('MODEL_1');

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'دسترسی دوربین برای تصحیح پاسخ‌برگ',
            message: 'برای عکاسی و اسکن پاسخ‌برگ آزمون، لطفاً دسترسی به دوربین را تایید نمایید.',
            buttonPositive: 'تایید',
            buttonNegative: 'انصراف',
          }
        );
        setHasCameraPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } catch (e) {
        setHasCameraPermission(false);
      }
    } else {
      setHasCameraPermission(true);
    }
  };

  // 1. Capture with Camera
  const handleCaptureCamera = async () => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      setProcessingStatusText('در حال عکس‌برداری از پاسخ‌برگ...');
      const photoUri = await smartSheetService.capturePhotoWithCamera();
      await processSheetImage(photoUri);
    } catch (e: any) {
      showError(e?.message || 'مشکلی در ثبت تصویر پیش آمد');
      setIsProcessing(false);
    }
  };

  // 2. Pick from Gallery (Reusing exact FilePickerModule)
  const handlePickFromGallery = async () => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      setProcessingStatusText('در حال بارگذاری تصویر از گالری...');
      const imageUri = await smartSheetService.pickImageFromGallery();
      if (!imageUri) {
        setIsProcessing(false);
        return;
      }
      await processSheetImage(imageUri);
    } catch (e: any) {
      showError(e?.message || 'مشکلی در خواندن تصویر پیش آمد');
      setIsProcessing(false);
    }
  };

  // 3. Process the sheet image with Kotlin & OpenCV
  const processSheetImage = async (imageUri: string, expectedCode?: string) => {
    try {
      setProcessingStatusText('در حال خواندن بارکد و تراز کردن برگه با OpenCV...');

      const omrResult = await smartSheetService.recognizeSheet({
        imageUri,
        totalQuestions: 20, // Initial estimate, adjusted upon sheet lookup
        optionsCount: 4,
        expectedSheetCode: expectedCode,
        templateId: selectedTemplate,
      });

      setLastProcessedOmrResult(omrResult);
      setLastProcessedImageUri(imageUri);

      const resolvedCode = omrResult.sheetCode || expectedCode;

      if (resolvedCode) {
        // Step 3a: Lookup sheet in backend by code
        setProcessingStatusText('در حال دریافت مشخصات دانش‌آموز و کلید آزمون...');
        const sheetDetails = await smartSheetService.lookupSheetByCode(resolvedCode);
        const resolvedTemplate = sheetDetails.templateId || (omrResult as any).templateId || selectedTemplate;

        if (resolvedTemplate && resolvedTemplate !== selectedTemplate) {
          setSelectedTemplate(resolvedTemplate as any);
        }

        // If totalQuestions or template differs, recalculate answers using sheet's actual configuration
        let finalizedAnswers = omrResult.answers;
        if (sheetDetails.totalQuestions !== omrResult.totalQuestions || resolvedTemplate !== selectedTemplate) {
          // Re-evaluate with exact question count and template
          const reResult = await smartSheetService.recognizeSheet({
            imageUri,
            totalQuestions: sheetDetails.totalQuestions,
            optionsCount: sheetDetails.optionsPerQuestion,
            expectedSheetCode: resolvedCode,
            templateId: resolvedTemplate as any,
            optionLabelType: sheetDetails.optionLabelType,
          });
          finalizedAnswers = reResult.answers;
        }

        setIsProcessing(false);

        // Navigate to grading review screen
        navigation.navigate('GradingReviewScreen', {
          sheetDetails,
          omrResult: {
            ...omrResult,
            answers: finalizedAnswers,
          },
          imageUri,
        });
      } else {
        // Step 3b: QR code detection failed!
        setIsProcessing(false);
        setShowManualCodeModal(true);
      }
    } catch (e: any) {
      setIsProcessing(false);
      showError(
        e?.message || 'تصویر قابل تراز شدن نبود. لطفاً مطمئن شوید برگه کاملاً صاف است و ۴ گوشه آن در تصویر قرار دارد.'
      );
    }
  };

  // 4. Handle Manual Sheet Code Entry Fallback
  const handleLookupManualCode = async () => {
    if (!manualCodeInput.trim()) {
      showWarning('لطفاً کد پاسخ‌برگ را وارد نمایید (مثال: KIT-8921-4732).');
      return;
    }

    setIsLookingUpCode(true);
    try {
      const cleanCode = manualCodeInput.trim().toUpperCase();
      const sheetDetails = await smartSheetService.lookupSheetByCode(cleanCode);

      setShowManualCodeModal(false);

      if (lastProcessedOmrResult && lastProcessedOmrResult.answers.length > 0) {
        // Continue with the already processed image
        navigation.navigate('GradingReviewScreen', {
          sheetDetails,
          omrResult: lastProcessedOmrResult,
          imageUri: lastProcessedImageUri || '',
        });
      } else {
        // Open manual grading mode directly for this student
        navigation.navigate('ManualGradingScreen', {
          sheetDetails,
        });
      }
    } catch (e: any) {
      showError(
        e?.response?.data?.message || e?.message || 'پاسخ‌برگی با این کد در آزمون‌های شما یافت نشد.'
      );
    } finally {
      setIsLookingUpCode(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#0f172a' }]} edges={['top', 'bottom']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronRight color="#ffffff" size={26} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>اسکنر پاسخ‌برگ هوشمند</Text>
        <TouchableOpacity
          style={styles.manualEntryHeaderBtn}
          onPress={() => setShowManualCodeModal(true)}
          activeOpacity={0.7}
        >
          <KeyRound size={20} color="#f59e0b" />
        </TouchableOpacity>
      </View>

      {/* Viewfinder / Camera View */}
      <View style={styles.viewfinderContainer}>
        {hasCameraPermission ? (
          <DocumentCameraView style={styles.cameraView} flashMode="AUTO" cameraType="BACK" />
        ) : (
          <View style={styles.noPermissionBox}>
            <AlertCircle size={40} color="#f59e0b" style={{ marginBottom: 10 }} />
            <Text style={styles.noPermissionText}>دسترسی به دوربین داده نشده است.</Text>
            <TouchableOpacity style={styles.reqPermissionBtn} onPress={checkCameraPermission}>
              <Text style={styles.reqPermissionBtnText}>درخواست مجدد دسترسی</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Framing Guide Overlay */}
        <View style={styles.overlayGuide}>
          <View style={styles.frameCornerTL} />
          <View style={styles.frameCornerTR} />
          <View style={styles.frameCornerBL} />
          <View style={styles.frameCornerBR} />
          <View style={styles.guideBadge}>
            <Text style={styles.guideBadgeText}>پاسخ‌برگ را داخل این کادر تنظیم فرمایید</Text>
          </View>
        </View>

        {/* Processing Spinner Overlay */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.processingText}>{processingStatusText}</Text>
          </View>
        )}
      </View>

      {/* Quick Template Selector Toggle for Testing */}
      <View style={styles.templateToggleContainer}>
        <Text style={styles.templateToggleLabel}>قالب فعال اسکن OMR:</Text>
        <View style={styles.templateToggleRow}>
          {[
            { id: 'MODEL_1', label: 'مدل ۱ (شبکه‌ای)' },
            { id: 'MODEL_2', label: 'مدل ۲ (ماتریسی)' },
            { id: 'MODEL_3', label: 'مدل ۳ (الفبایی)' },
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.templatePill,
                selectedTemplate === item.id && styles.templatePillActive,
              ]}
              onPress={() => setSelectedTemplate(item.id as any)}
            >
              <Text
                style={[
                  styles.templatePillText,
                  selectedTemplate === item.id && styles.templatePillTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bottom Controls Bar */}
      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.galleryButton} onPress={handlePickFromGallery} activeOpacity={0.8}>
          <ImageIcon size={24} color="#ffffff" />
          <Text style={styles.galleryButtonText}>انتخاب از گالری</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shutterButton} onPress={handleCaptureCamera} activeOpacity={0.85}>
          <View style={styles.shutterInner} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.galleryButton}
          onPress={() => setShowManualCodeModal(true)}
          activeOpacity={0.8}
        >
          <KeyRound size={24} color="#f59e0b" />
          <Text style={[styles.galleryButtonText, { color: '#f59e0b' }]}>ورود کد دستی</Text>
        </TouchableOpacity>
      </View>

      {/* ========================================================= */}
      {/* Fallback Modal: Manual Sheet Code Entry                   */}
      {/* ========================================================= */}
      <Modal visible={showManualCodeModal} animationType="slide" transparent onRequestClose={() => setShowManualCodeModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>شناسایی دستی پاسخ‌برگ</Text>
              <TouchableOpacity onPress={() => setShowManualCodeModal(false)}>
                <X size={20} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDesc, { color: colors.textLight }]}>
              در صورت عدم خواندن یا مخدوش بودن QR کد، کد چاپ‌شده روی پاسخ‌برگ دانش‌آموز (زیر بارکد) را وارد نمایید:
            </Text>

            <View style={styles.manualCodeInputWrapper}>
              <Text style={styles.inputPrefix}>کد برگه:</Text>
              <TextInput
                style={[styles.manualCodeInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="مثال: KIT-8921-4732"
                placeholderTextColor={colors.textLight}
                value={manualCodeInput}
                onChangeText={setManualCodeInput}
                autoCapitalize="characters"
              />
            </View>

            <TouchableOpacity
              style={styles.lookupCodeSubmitBtn}
              onPress={handleLookupManualCode}
              disabled={isLookingUpCode}
              activeOpacity={0.85}
            >
              {isLookingUpCode ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Check size={18} color="#fff" style={{ marginLeft: 6 }} />
                  <Text style={styles.lookupCodeSubmitBtnText}>تایید و دریافت اطلاعات برگه</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 4 },
  topBarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    color: '#ffffff',
  },
  manualEntryHeaderBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  viewfinderContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  cameraView: {
    width: '100%',
    height: '100%',
  },
  noPermissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noPermissionText: {
    fontSize: 14,
    fontFamily: 'IRANSansX',
    color: '#ffffff',
    marginBottom: 12,
  },
  reqPermissionBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reqPermissionBtnText: {
    fontSize: 12.5,
    fontFamily: 'IRANSansX',
    color: '#ffffff',
    fontWeight: 'bold',
  },
  overlayGuide: {
    position: 'absolute',
    top: 40,
    bottom: 40,
    left: 24,
    right: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
    justifyContent: 'space-between',
  },
  frameCornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 24,
    height: 24,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#10b981',
    borderTopLeftRadius: 14,
  },
  frameCornerTR: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 24,
    height: 24,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#10b981',
    borderTopRightRadius: 14,
  },
  frameCornerBL: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 24,
    height: 24,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#10b981',
    borderBottomLeftRadius: 14,
  },
  frameCornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#10b981',
    borderBottomRightRadius: 14,
  },
  guideBadge: {
    alignSelf: 'center',
    marginTop: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  guideBadgeText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    color: '#ffffff',
    fontWeight: '600',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  processingText: {
    fontSize: 13.5,
    fontFamily: 'IRANSansX',
    color: '#ffffff',
    fontWeight: 'bold',
    marginTop: 14,
    textAlign: 'center',
  },
  bottomControls: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: '#0f172a',
  },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#ffffff',
  },
  galleryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
  },
  galleryButtonText: {
    fontSize: 10.5,
    fontFamily: 'IRANSansX',
    color: '#ffffff',
    marginTop: 4,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },
  modalDesc: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    lineHeight: 18,
    textAlign: 'right',
    marginBottom: 14,
  },
  manualCodeInputWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputPrefix: {
    fontSize: 12.5,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    color: '#64748b',
    marginLeft: 8,
  },
  manualCodeInput: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  lookupCodeSubmitBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 13,
  },
  lookupCodeSubmitBtnText: {
    fontSize: 13.5,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    color: '#ffffff',
  },

  // Template toggle in scanner
  templateToggleContainer: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  templateToggleLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontFamily: 'IRANSansX',
    marginBottom: 6,
  },
  templateToggleRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  templatePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#475569',
  },
  templatePillActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#6366f1',
  },
  templatePillText: {
    color: '#94a3b8',
    fontSize: 11,
    fontFamily: 'IRANSansX',
  },
  templatePillTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default SmartSheetScannerScreen;
