import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  Modal,
  ScrollView,
  Linking,
  Vibration,
  ToastAndroid,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  Zap,
  ZapOff,
  SwitchCamera,
  Image as ImageIcon,
  History,
  Copy,
  ExternalLink,
  Share2,
  Search,
  Phone,
  MessageSquare,
  Wifi,
  FileText,
  Barcode as BarcodeIcon,
  QrCode,
  RotateCcw,
  Check,
  Trash2,
  X,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import ImagePicker from 'react-native-image-crop-picker';
import Share from 'react-native-share';
import { BarcodeCameraView } from '../../../components/barcode/BarcodeCameraView';
import {
  barcodeService,
  BarcodeDetectedData,
  BarcodeHistoryItem,
} from '../../../services/barcodeService';

const { width, height } = Dimensions.get('window');
const SCAN_FRAME_SIZE = Math.min(width * 0.72, 280);

export const BarcodeScannerScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [flashEnabled, setFlashEnabled] = useState<boolean>(false);
  const [lensFacing, setLensFacing] = useState<'back' | 'front'>('back');
  const [isScanningActive, setIsScanningActive] = useState<boolean>(true);
  const [detectedBarcode, setDetectedBarcode] = useState<BarcodeDetectedData | null>(null);
  const [isResultVisible, setIsResultVisible] = useState<boolean>(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<BarcodeHistoryItem[]>([]);
  const [analyzingImage, setAnalyzingImage] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Laser line animation
  const laserAnim = useRef(new Animated.Value(0)).current;
  const animLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isScanningActive && !isResultVisible && !isHistoryVisible) {
      laserAnim.setValue(0);
      animLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      animLoopRef.current.start();
    } else {
      if (animLoopRef.current) {
        animLoopRef.current.stop();
      }
    }

    return () => {
      if (animLoopRef.current) {
        animLoopRef.current.stop();
      }
    };
  }, [isScanningActive, isResultVisible, isHistoryVisible, laserAnim]);

  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_FRAME_SIZE - 4],
  });

  const loadHistory = async () => {
    const list = await barcodeService.getScannedHistory();
    setHistoryList(list);
  };

  const handleBarcodeDetected = (barcode: BarcodeDetectedData) => {
    if (!isScanningActive || isResultVisible) return;

    try {
      Vibration.vibrate(50);
    } catch {}

    setIsScanningActive(false);
    setDetectedBarcode(barcode);
    setIsResultVisible(true);

    barcodeService.addScannedItem({
      value: barcode.value,
      displayValue: barcode.displayValue,
      format: barcode.format,
      type: barcode.type,
    });
  };

  const handlePickFromGallery = async () => {
    try {
      setAnalyzingImage(true);
      const image = await ImagePicker.openPicker({
        mediaType: 'photo',
        cropping: false,
      });

      if (image && image.path) {
        const result = await barcodeService.scanFromImage(image.path);
        if (result.found && result.value) {
          handleBarcodeDetected(result as BarcodeDetectedData);
        } else {
          ToastAndroid.show('بارکدی در تصویر انتخابی یافت نشد.', ToastAndroid.SHORT);
        }
      }
    } catch (err: any) {
      if (err?.code !== 'E_PICKER_CANCELLED') {
        ToastAndroid.show('خطا در خواندن تصویر', ToastAndroid.SHORT);
      }
    } finally {
      setAnalyzingImage(false);
    }
  };

  const resumeScanning = () => {
    setIsResultVisible(false);
    setDetectedBarcode(null);
    setCopied(false);
    setIsScanningActive(true);
  };

  const handleCopy = (text: string) => {
    Clipboard.setString(text);
    setCopied(true);
    ToastAndroid.show('در حافظه کپی شد', ToastAndroid.SHORT);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (text: string) => {
    try {
      await Share.open({
        message: text,
      });
    } catch {}
  };

  const handleOpenUrl = (url: string) => {
    let target = url;
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }
    Linking.openURL(target).catch(() => {
      ToastAndroid.show('امکان باز کردن آدرس وجود ندارد', ToastAndroid.SHORT);
    });
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {});
  };

  const handleSms = (phone: string, msg = '') => {
    Linking.openURL(`sms:${phone}?body=${encodeURIComponent(msg)}`).catch(() => {});
  };

  const handleSearchGoogle = (query: string) => {
    Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(query)}`).catch(() => {});
  };

  const handleClearHistory = async () => {
    await barcodeService.clearScannedHistory();
    setHistoryList([]);
    ToastAndroid.show('تاریخچه اسکن‌ها پاک شد', ToastAndroid.SHORT);
  };

  const renderTypeIcon = (type: string, size = 20, color = '#6366f1') => {
    switch (type) {
      case 'URL':
        return <ExternalLink size={size} color={color} />;
      case 'WIFI':
        return <Wifi size={size} color={color} />;
      case 'PHONE':
        return <Phone size={size} color={color} />;
      case 'SMS':
        return <MessageSquare size={size} color={color} />;
      case 'CONTACT':
        return <FileText size={size} color={color} />;
      default:
        return <QrCode size={size} color={color} />;
    }
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'URL':
        return 'پیوند اینترنتی (وب‌سایت)';
      case 'WIFI':
        return 'اطلاعات شبکه وای‌فای';
      case 'PHONE':
        return 'شماره تلفن';
      case 'SMS':
        return 'پیامک';
      case 'CONTACT':
        return 'کارت ویزیت مخاطب';
      case 'PRODUCT':
        return 'بارکد کالا / محصول';
      case 'ISBN':
        return 'شابک کتاب (ISBN)';
      default:
        return 'متن / کد شناسایی';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Native Camera Scanner */}
      <BarcodeCameraView
        style={StyleSheet.absoluteFill}
        flashEnabled={flashEnabled}
        lensFacing={lensFacing}
        isScanningActive={isScanningActive && !isResultVisible && !isHistoryVisible}
        onBarcodeDetected={handleBarcodeDetected}
      />

      {/* Viewfinder Overlay with Darkened Cutout */}
      <View style={styles.overlayContainer}>
        {/* Top Dark Mask */}
        <View style={styles.maskTop}>
          {/* Header Controls */}
          <View style={styles.topControlBar}>
            <TouchableOpacity
              style={styles.controlIconBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowRight size={22} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.topActionsGroup}>
              {/* Flashlight toggle */}
              <TouchableOpacity
                style={[styles.controlIconBtn, flashEnabled && styles.activeControlBtn]}
                onPress={() => setFlashEnabled(prev => !prev)}
              >
                {flashEnabled ? <Zap size={20} color="#fbbf24" /> : <ZapOff size={20} color="#ffffff" />}
              </TouchableOpacity>

              {/* Camera flip */}
              <TouchableOpacity
                style={styles.controlIconBtn}
                onPress={() => setLensFacing(prev => (prev === 'back' ? 'front' : 'back'))}
              >
                <SwitchCamera size={20} color="#ffffff" />
              </TouchableOpacity>

              {/* Pick from gallery */}
              <TouchableOpacity
                style={styles.controlIconBtn}
                onPress={handlePickFromGallery}
                disabled={analyzingImage}
              >
                {analyzingImage ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <ImageIcon size={20} color="#ffffff" />
                )}
              </TouchableOpacity>

              {/* History */}
              <TouchableOpacity
                style={styles.controlIconBtn}
                onPress={() => {
                  loadHistory();
                  setIsHistoryVisible(true);
                }}
              >
                <History size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Center Target Box */}
        <View style={styles.centerRow}>
          <View style={styles.maskSide} />

          <View style={[styles.scanFrame, { width: SCAN_FRAME_SIZE, height: SCAN_FRAME_SIZE }]}>
            {/* 4 Corner Markers */}
            <View style={[styles.cornerMarker, styles.cornerTopLeft]} />
            <View style={[styles.cornerMarker, styles.cornerTopRight]} />
            <View style={[styles.cornerMarker, styles.cornerBottomLeft]} />
            <View style={[styles.cornerMarker, styles.cornerBottomRight]} />

            {/* Laser Line */}
            {isScanningActive && (
              <Animated.View
                style={[
                  styles.laserLine,
                  {
                    transform: [{ translateY: laserTranslateY }],
                  },
                ]}
              />
            )}
          </View>

          <View style={styles.maskSide} />
        </View>

        {/* Bottom Dark Mask with Instructions */}
        <View style={styles.maskBottom}>
          <Text style={styles.instructionTitle}>اسکن هوشمند بارکد و QR</Text>
          <Text style={styles.instructionSub}>
            بارکد را در کادر وسط تنظیم کنید تا به صورت خودکار شناسایی شود
          </Text>

          <TouchableOpacity
            style={styles.switchToGenBtn}
            onPress={() => navigation.navigate('BarcodeGeneratorScreen')}
          >
            <QrCode size={16} color="#6366f1" />
            <Text style={styles.switchToGenText}>رفتن به بخش ساخت بارکد</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scan Result Modal / Sheet */}
      <Modal
        visible={isResultVisible}
        transparent
        animationType="slide"
        onRequestClose={resumeScanning}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.resultSheet}>
            <View style={styles.sheetHandle} />

            {/* Type Header */}
            <View style={styles.resultHeader}>
              <View style={styles.resultTypeBadge}>
                {detectedBarcode && renderTypeIcon(detectedBarcode.type, 16, '#6366f1')}
                <Text style={styles.resultTypeText}>
                  {detectedBarcode ? getTypeLabel(detectedBarcode.type) : 'بارکد'}
                </Text>
              </View>

              <Text style={styles.resultFormatText}>
                {detectedBarcode?.format || 'QR_CODE'}
              </Text>
            </View>

            {/* Scanned Content Box */}
            <View style={styles.valueBox}>
              <ScrollView style={{ maxHeight: 130 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.valueText} selectable>
                  {detectedBarcode?.value}
                </Text>

                {/* Extra info for WiFi */}
                {detectedBarcode?.type === 'WIFI' && detectedBarcode.wifi && (
                  <View style={styles.wifiDetails}>
                    <Text style={styles.wifiDetailText}>
                      نام شبکه: {detectedBarcode.wifi.ssid}
                    </Text>
                    {detectedBarcode.wifi.password ? (
                      <Text style={styles.wifiDetailText}>
                        رمز عبور: {detectedBarcode.wifi.password}
                      </Text>
                    ) : null}
                  </View>
                )}
              </ScrollView>
            </View>

            {/* Contextual Actions */}
            <View style={styles.actionButtonsGrid}>
              {/* If URL */}
              {detectedBarcode?.type === 'URL' && (
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: '#6366f1' }]}
                  onPress={() => handleOpenUrl(detectedBarcode.value)}
                >
                  <ExternalLink size={18} color="#ffffff" />
                  <Text style={styles.primaryActionText}>باز کردن در مرورگر</Text>
                </TouchableOpacity>
              )}

              {/* If Phone */}
              {detectedBarcode?.type === 'PHONE' && (
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: '#10b981' }]}
                  onPress={() => handleCall(detectedBarcode.value)}
                >
                  <Phone size={18} color="#ffffff" />
                  <Text style={styles.primaryActionText}>تماس مستقیم</Text>
                </TouchableOpacity>
              )}

              {/* If SMS */}
              {detectedBarcode?.type === 'SMS' && detectedBarcode.sms && (
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: '#0ea5e9' }]}
                  onPress={() =>
                    handleSms(
                      detectedBarcode.sms?.phoneNumber || detectedBarcode.value,
                      detectedBarcode.sms?.message || ''
                    )
                  }
                >
                  <MessageSquare size={18} color="#ffffff" />
                  <Text style={styles.primaryActionText}>ارسال پیامک</Text>
                </TouchableOpacity>
              )}

              {/* Common Actions */}
              <View style={styles.standardActionsRow}>
                <TouchableOpacity
                  style={styles.standardActionBtn}
                  onPress={() => detectedBarcode && handleCopy(detectedBarcode.value)}
                >
                  {copied ? <Check size={18} color="#10b981" /> : <Copy size={18} color="#475569" />}
                  <Text style={[styles.standardActionText, copied && { color: '#10b981' }]}>
                    {copied ? 'کپی شد' : 'کپی متن'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.standardActionBtn}
                  onPress={() => detectedBarcode && handleShare(detectedBarcode.value)}
                >
                  <Share2 size={18} color="#475569" />
                  <Text style={styles.standardActionText}>اشتراک</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.standardActionBtn}
                  onPress={() => detectedBarcode && handleSearchGoogle(detectedBarcode.value)}
                >
                  <Search size={18} color="#475569" />
                  <Text style={styles.standardActionText}>جستجو وب</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Scan Next Button */}
            <TouchableOpacity style={styles.scanNextButton} onPress={resumeScanning}>
              <RotateCcw size={18} color="#ffffff" />
              <Text style={styles.scanNextText}>اسکن بعدی</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={isHistoryVisible}
        animationType="slide"
        onRequestClose={() => setIsHistoryVisible(false)}
      >
        <SafeAreaView style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <TouchableOpacity
              style={styles.historyBackBtn}
              onPress={() => setIsHistoryVisible(false)}
            >
              <ArrowRight size={22} color="#1e293b" />
            </TouchableOpacity>

            <Text style={styles.historyTitle}>تاریخچه اسکن‌ها</Text>

            {historyList.length > 0 ? (
              <TouchableOpacity style={styles.clearHistoryBtn} onPress={handleClearHistory}>
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>

          {historyList.length === 0 ? (
            <View style={styles.emptyHistory}>
              <History size={48} color="#cbd5e1" />
              <Text style={styles.emptyHistoryText}>هنوز بارکدی اسکن نشده است</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.historyList}>
              {historyList.map(item => (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <View style={styles.historyTypeBadge}>
                      {renderTypeIcon(item.type, 14, '#6366f1')}
                      <Text style={styles.historyTypeText}>{getTypeLabel(item.type)}</Text>
                    </View>
                    <Text style={styles.historyFormat}>{item.format}</Text>
                  </View>

                  <Text style={styles.historyValue} numberOfLines={2}>
                    {item.value}
                  </Text>

                  <View style={styles.historyCardFooter}>
                    <View style={styles.historyActionGroup}>
                      <TouchableOpacity
                        style={styles.historyActionBtn}
                        onPress={() => handleCopy(item.value)}
                      >
                        <Copy size={15} color="#64748b" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.historyActionBtn}
                        onPress={() => handleShare(item.value)}
                      >
                        <Share2 size={15} color="#64748b" />
                      </TouchableOpacity>
                      {item.type === 'URL' && (
                        <TouchableOpacity
                          style={styles.historyActionBtn}
                          onPress={() => handleOpenUrl(item.value)}
                        >
                          <ExternalLink size={15} color="#6366f1" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text style={styles.historyTime}>
                      {new Date(item.timestamp).toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  maskTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topControlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  controlIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeControlBtn: {
    backgroundColor: 'rgba(251, 191, 36, 0.3)',
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  topActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  maskSide: {
    flex: 1,
    height: SCAN_FRAME_SIZE,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  scanFrame: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  cornerMarker: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#38bdf8',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  laserLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 3,
    backgroundColor: '#38bdf8',
    borderRadius: 2,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  maskBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  instructionSub: {
    fontSize: 12,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  switchToGenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  switchToGenText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  resultSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  resultTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  resultTypeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  resultFormatText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  valueBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  valueText: {
    fontSize: 14,
    color: '#0f172a',
    lineHeight: 22,
    textAlign: 'right',
  },
  wifiDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 4,
  },
  wifiDetailText: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'right',
  },
  actionButtonsGrid: {
    gap: 10,
    marginBottom: 16,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 14,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  standardActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  standardActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  standardActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  scanNextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    backgroundColor: '#0f172a',
    borderRadius: 14,
  },
  scanNextText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  historyContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  historyBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  clearHistoryBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHistory: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  historyList: {
    padding: 16,
    gap: 12,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  historyTypeText: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '600',
  },
  historyFormat: {
    fontSize: 10,
    color: '#94a3b8',
  },
  historyValue: {
    fontSize: 13,
    color: '#1e293b',
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: 10,
  },
  historyCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 8,
  },
  historyActionGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  historyActionBtn: {
    padding: 6,
  },
  historyTime: {
    fontSize: 11,
    color: '#94a3b8',
  },
});
