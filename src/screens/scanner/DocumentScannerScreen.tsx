import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  Zap,
  ZapOff,
  SwitchCamera,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react-native';
import {
  DocumentCameraView,
  scannerService,
} from '../../services/scanner/scannerService';
import FilePickerModule from '../../native/FilePicker';
import { COLORS } from '../../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DocumentScannerScreenProps {
  route?: any;
  navigation: any;
}

export const DocumentScannerScreen: React.FC<DocumentScannerScreenProps> = ({ route, navigation }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [flashMode, setFlashMode] = useState<'OFF' | 'ON' | 'AUTO'>('OFF');
  const [cameraType, setCameraType] = useState<'BACK' | 'FRONT'>('BACK');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  useEffect(() => {
    checkAndRequestPermission();
  }, []);

  const checkAndRequestPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'دسترسی به دوربین برای اسکن مدارک',
            message: 'برای عکاسی و اسکن هوشمند برگه‌های امتحانی و جزوات، لطفا دسترسی به دوربین را تایید نمایید.',
            buttonPositive: 'تایید دسترسی',
            buttonNegative: 'انصراف',
          }
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } catch (err) {
        console.error('Permission error:', err);
        setHasPermission(false);
      }
    } else {
      setHasPermission(true);
    }
  };

  const toggleFlash = () => {
    if (flashMode === 'OFF') setFlashMode('ON');
    else if (flashMode === 'ON') setFlashMode('AUTO');
    else setFlashMode('OFF');
  };

  const toggleCameraType = () => {
    setCameraType((prev) => (prev === 'BACK' ? 'FRONT' : 'BACK'));
  };

  const handleCapture = async () => {
    if (isCapturing) return;
    try {
      setIsCapturing(true);
      const photoResult = await scannerService.captureCameraPhoto();
      await processRawPhoto(photoResult.uri);
    } catch (err: any) {
      Alert.alert('خطا در عکاسی', err?.message || 'ثبت تصویر با خطا مواجه شد');
      setIsCapturing(false);
    }
  };

  const handlePickFromGallery = async () => {
    if (isCapturing) return;
    try {
      setIsCapturing(true);
      const pickedResult = await FilePickerModule.pickImage();
      if (!pickedResult) {
        setIsCapturing(false);
        return;
      }

      let uri = '';
      if (Array.isArray(pickedResult)) {
        uri = pickedResult[0];
      } else if (typeof pickedResult === 'string') {
        uri = pickedResult;
      } else if (pickedResult && typeof pickedResult === 'object' && pickedResult.uri) {
        uri = pickedResult.uri;
      }

      if (!uri) {
        setIsCapturing(false);
        return;
      }

      await processRawPhoto(uri);
    } catch (err: any) {
      if (err?.code !== 'CANCELLED' && err !== 'CANCELLED') {
        Alert.alert('خطا', err?.message || 'خطا در بارگذاری عکس از گالری');
      }
      setIsCapturing(false);
    }
  };

  const processRawPhoto = async (imageUri: string) => {
    try {
      // Run native OpenCV contour detection and corner estimation
      const detection = await scannerService.detectDocument(imageUri);
      setIsCapturing(false);

      const validUri = detection.imageUri || imageUri;

      // Navigate to Corner Adjustment screen
      navigation.navigate('CropAdjustmentScreen', {
        rawImageUri: validUri,
        initialCorners: detection.corners,
        imageWidth: detection.width,
        imageHeight: detection.height,
        isFallback: detection.isFallback,
        returnScreen: route?.params?.returnScreen,
      });
    } catch (err: any) {
      setIsCapturing(false);
      Alert.alert('خطا در بررسی سند', err?.message || 'امکان تحلیل لبه‌های مدرک وجود ندارد');
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.permissionText}>در حال بررسی دسترسی به دوربین...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <AlertCircle size={64} color={COLORS.error} />
        <Text style={styles.permissionTitle}>دسترسی به دوربین داده نشد</Text>
        <Text style={styles.permissionSubtitle}>
          برای استفاده از اسکنر مدارک و اوراق، دسترسی به دوربین دستگاه الزامی است.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={checkAndRequestPermission}>
          <Text style={styles.permissionButtonText}>تلاش مجدد و تایید دسترسی</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.permissionButton, styles.galleryFallbackButton]} onPress={handlePickFromGallery}>
          <ImageIcon size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.permissionButtonText}>انتخاب عکس از گالری</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>بازگشت به ابزارها</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Native CameraX View */}
      <DocumentCameraView
        style={styles.cameraView}
        flashMode={flashMode}
        cameraType={cameraType}
      />

      {/* Center Document Alignment Frame Guide */}
      <View style={styles.guideContainer} pointerEvents="none">
        <View style={styles.guideFrame}>
          {/* Top Left */}
          <View style={[styles.cornerGuide, styles.guideTL]} />
          {/* Top Right */}
          <View style={[styles.cornerGuide, styles.guideTR]} />
          {/* Bottom Left */}
          <View style={[styles.cornerGuide, styles.guideBL]} />
          {/* Bottom Right */}
          <View style={[styles.cornerGuide, styles.guideBR]} />
        </View>
      </View>

      {/* Top Header Bar */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowRight size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>اسکنر هوشمند مدارک</Text>
            <Text style={styles.headerSubtitle}>CamScanner معلم</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} onPress={toggleFlash} activeOpacity={0.7}>
              {flashMode === 'OFF' ? (
                <ZapOff size={22} color="#FFFFFF" />
              ) : (
                <Zap size={22} color="#FBBF24" />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={toggleCameraType} activeOpacity={0.7}>
              <SwitchCamera size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Tip Badge */}
      <View style={styles.tipBadgeContainer}>
        <View style={styles.tipBadge}>
          <FileText size={16} color="#60A5FA" style={{ marginLeft: 6 }} />
          <Text style={styles.tipText}>برگه را درون کادر قرار دهید</Text>
        </View>
      </View>

      {/* Bottom Controls */}
      <SafeAreaView edges={['bottom']} style={styles.bottomSafeArea}>
        <View style={styles.bottomBar}>
          {/* Gallery Button */}
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={handlePickFromGallery}
            activeOpacity={0.7}
          >
            <View style={styles.galleryIconBox}>
              <ImageIcon size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.controlLabel}>گالری</Text>
          </TouchableOpacity>

          {/* Shutter Button */}
          <TouchableOpacity
            style={styles.shutterOuter}
            onPress={handleCapture}
            activeOpacity={0.8}
            disabled={isCapturing}
          >
            <View style={styles.shutterInner} />
          </TouchableOpacity>

          {/* Spacer */}
          <View style={styles.galleryButton}>
            <View style={[styles.galleryIconBox, { backgroundColor: 'transparent' }]} />
            <Text style={[styles.controlLabel, { opacity: 0 }]}>-</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Loading Overlay */}
      {isCapturing && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingTitle}>در حال عکاسی و تشخیص لبه‌ها...</Text>
            <Text style={styles.loadingSubtitle}>موتور پردازش تصویر OpenCV</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraView: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 24,
  },
  permissionText: {
    marginTop: 16,
    color: '#94a3b8',
    fontSize: 15,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  galleryFallbackButton: {
    backgroundColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  backLink: {
    marginTop: 12,
    padding: 10,
  },
  backLinkText: {
    color: '#60A5FA',
    fontSize: 14,
  },
  headerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideFrame: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_HEIGHT * 0.65,
    position: 'relative',
  },
  cornerGuide: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#38BDF8',
  },
  guideTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 6,
  },
  guideTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 6,
  },
  guideBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 6,
  },
  guideBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 6,
  },
  tipBadgeContainer: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  tipText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '500',
  },
  bottomSafeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  galleryButton: {
    alignItems: 'center',
    width: 60,
  },
  galleryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  controlLabel: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
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
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  loadingSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 6,
  },
});

export default DocumentScannerScreen;
