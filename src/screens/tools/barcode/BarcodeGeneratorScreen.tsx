import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  ActivityIndicator,
  ToastAndroid,
  Clipboard,
  Switch,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  QrCode,
  Barcode as BarcodeIcon,
  Download,
  Share2,
  Copy,
  Check,
  History,
  Link,
  Wifi,
  Phone,
  FileText,
  Palette,
  Sparkles,
  Trash2,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Share from 'react-native-share';
import {
  barcodeService,
  BarcodeFormat,
  GeneratedBarcodeResult,
  BarcodeHistoryItem,
} from '../../../services/barcodeService';

const { width } = Dimensions.get('window');

type BarcodeCategory = 'TEXT' | 'URL' | 'WIFI' | 'PHONE' | 'BARCODE_1D';

interface ColorPreset {
  name: string;
  fg: string;
}

const COLOR_PRESETS: ColorPreset[] = [
  { name: 'مشکی کلاسیک', fg: '#000000' },
  { name: 'نیلی تیره', fg: '#4338ca' },
  { name: 'سرمه‌ای', fg: '#0369a1' },
  { name: 'سبز زمردی', fg: '#047857' },
  { name: 'بنفش رویال', fg: '#7c3aed' },
  { name: 'زرشکی', fg: '#b91c1c' },
];

export const BarcodeGeneratorScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [activeCategory, setActiveCategory] = useState<BarcodeCategory>('URL');

  // Input states
  const [textContent, setTextContent] = useState<string>('سامانه آموزشی کیتایار');
  const [urlContent, setUrlContent] = useState<string>('https://kitayar.ir');
  const [wifiSsid, setWifiSsid] = useState<string>('');
  const [wifiPassword, setWifiPassword] = useState<string>('');
  const [wifiType, setWifiType] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [barcode1DContent, setBarcode1DContent] = useState<string>('KITAYAR-1403');
  const [barcode1DFormat, setBarcode1DFormat] = useState<BarcodeFormat>('CODE_128');
  const [includeTextBelow, setIncludeTextBelow] = useState<boolean>(true);

  // Styling options
  const [selectedColor, setSelectedColor] = useState<string>('#000000');

  // Generation result & states
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedBarcode, setGeneratedBarcode] = useState<GeneratedBarcodeResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [savingToGallery, setSavingToGallery] = useState<boolean>(false);

  // History modal
  const [isHistoryVisible, setIsHistoryVisible] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<BarcodeHistoryItem[]>([]);

  const loadHistory = async () => {
    const list = await barcodeService.getGeneratedHistory();
    setHistoryList(list);
  };

  const getPayload = (): { content: string; format: BarcodeFormat } => {
    switch (activeCategory) {
      case 'URL': {
        let clean = urlContent.trim();
        if (clean && !clean.startsWith('http://') && !clean.startsWith('https://')) {
          clean = `https://${clean}`;
        }
        return { content: clean || 'https://kitayar.ir', format: 'QR_CODE' };
      }
      case 'WIFI': {
        const ssid = wifiSsid.trim();
        const pwd = wifiPassword.trim();
        const type = wifiType;
        const payload = `WIFI:T:${type};S:${ssid};P:${pwd};;`;
        return { content: payload, format: 'QR_CODE' };
      }
      case 'PHONE': {
        const phone = phoneNumber.trim();
        return { content: `tel:${phone}`, format: 'QR_CODE' };
      }
      case 'BARCODE_1D': {
        return { content: barcode1DContent.trim() || '12345678', format: barcode1DFormat };
      }
      case 'TEXT':
      default:
        return { content: textContent.trim() || 'کیتایار', format: 'QR_CODE' };
    }
  };

  const handleGenerate = async () => {
    const { content, format } = getPayload();
    if (!content.trim()) {
      ToastAndroid.show('لطفاً محتوای موردنظر را وارد کنید', ToastAndroid.SHORT);
      return;
    }

    try {
      setLoading(true);
      const is1D = activeCategory === 'BARCODE_1D';
      const result = await barcodeService.generateBarcode({
        content,
        format,
        color: selectedColor,
        backgroundColor: '#FFFFFF',
        width: is1D ? 600 : 512,
        height: is1D ? 240 : 512,
        includeText: is1D && includeTextBelow,
      });

      setGeneratedBarcode(result);

      // Save to generated history
      barcodeService.addGeneratedItem({
        value: content,
        format,
        type: activeCategory,
        imageUri: result.uri,
      });
    } catch (err: any) {
      console.error('Generation error:', err);
      ToastAndroid.show('خطا در ساخت بارکد: ' + (err?.message || ''), ToastAndroid.LONG);
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate on first mount
  useEffect(() => {
    handleGenerate();
  }, []);

  const handleSaveToGallery = async () => {
    if (!generatedBarcode) return;
    try {
      setSavingToGallery(true);
      const fileName = `kitayar_barcode_${Date.now()}`;
      await barcodeService.saveToGallery(generatedBarcode.filePath || generatedBarcode.uri, fileName);
      ToastAndroid.show('بارکد در گالری ذخیره شد (پوشه Pictures/Kitayar)', ToastAndroid.LONG);
    } catch (err) {
      ToastAndroid.show('خطا در ذخیره تصویر', ToastAndroid.SHORT);
    } finally {
      setSavingToGallery(false);
    }
  };

  const handleShare = async () => {
    if (!generatedBarcode) return;
    try {
      await Share.open({
        url: generatedBarcode.uri,
        title: 'بارکد کیتایار',
        message: generatedBarcode.content,
      });
    } catch {}
  };

  const handleCopy = (text: string) => {
    Clipboard.setString(text);
    setCopied(true);
    ToastAndroid.show('متن کپی شد', ToastAndroid.SHORT);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearHistory = async () => {
    await barcodeService.clearGeneratedHistory();
    setHistoryList([]);
    ToastAndroid.show('تاریخچه پاک شد', ToastAndroid.SHORT);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowRight size={22} color="#1e293b" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>بارکدساز و ساخت QR کد</Text>
          <Text style={styles.headerSub}>تولید انواع کدهای QR و بارکدهای میله‌ای</Text>
        </View>

        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => {
            loadHistory();
            setIsHistoryVisible(true);
          }}
        >
          <History size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Category Selector Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabsRow}
        >
          <TouchableOpacity
            style={[styles.categoryTab, activeCategory === 'URL' && styles.categoryTabActive]}
            onPress={() => setActiveCategory('URL')}
          >
            <Link size={16} color={activeCategory === 'URL' ? '#ffffff' : '#64748b'} />
            <Text style={[styles.categoryTabText, activeCategory === 'URL' && styles.categoryTabTextActive]}>
              لینک وب‌سایت
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryTab, activeCategory === 'TEXT' && styles.categoryTabActive]}
            onPress={() => setActiveCategory('TEXT')}
          >
            <FileText size={16} color={activeCategory === 'TEXT' ? '#ffffff' : '#64748b'} />
            <Text style={[styles.categoryTabText, activeCategory === 'TEXT' && styles.categoryTabTextActive]}>
              متن آزاد
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryTab, activeCategory === 'WIFI' && styles.categoryTabActive]}
            onPress={() => setActiveCategory('WIFI')}
          >
            <Wifi size={16} color={activeCategory === 'WIFI' ? '#ffffff' : '#64748b'} />
            <Text style={[styles.categoryTabText, activeCategory === 'WIFI' && styles.categoryTabTextActive]}>
              وای‌فای
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryTab, activeCategory === 'PHONE' && styles.categoryTabActive]}
            onPress={() => setActiveCategory('PHONE')}
          >
            <Phone size={16} color={activeCategory === 'PHONE' ? '#ffffff' : '#64748b'} />
            <Text style={[styles.categoryTabText, activeCategory === 'PHONE' && styles.categoryTabTextActive]}>
              شماره تماس
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryTab, activeCategory === 'BARCODE_1D' && styles.categoryTabActive]}
            onPress={() => setActiveCategory('BARCODE_1D')}
          >
            <BarcodeIcon size={16} color={activeCategory === 'BARCODE_1D' ? '#ffffff' : '#64748b'} />
            <Text style={[styles.categoryTabText, activeCategory === 'BARCODE_1D' && styles.categoryTabTextActive]}>
              بارکد میله‌ای (کالا/دانش‌آموز)
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Input Form based on Category */}
        <View style={styles.formContainer}>
          {activeCategory === 'URL' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>آدرس اینترنتی (URL)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="https://example.com"
                placeholderTextColor="#94a3b8"
                value={urlContent}
                onChangeText={setUrlContent}
                autoCapitalize="none"
                keyboardType="url"
                textAlign="left"
              />
              <Text style={styles.inputHint}>
                لینک آزمون آنلاین، جزوه، کانال کلاس یا سایت مدرسه را وارد کنید.
              </Text>
            </View>
          )}

          {activeCategory === 'TEXT' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>متن یا یادداشت</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                placeholder="متن موردنظر خود را اینجا بنویسید..."
                placeholderTextColor="#94a3b8"
                value={textContent}
                onChangeText={setTextContent}
                multiline
                numberOfLines={3}
                textAlign="right"
              />
            </View>
          )}

          {activeCategory === 'WIFI' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>نام شبکه وای‌فای (SSID)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="مثال: School_Wi-Fi"
                placeholderTextColor="#94a3b8"
                value={wifiSsid}
                onChangeText={setWifiSsid}
                textAlign="right"
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>رمز عبور وای‌فای</Text>
              <TextInput
                style={styles.textInput}
                placeholder="رمز عبور شبکه"
                placeholderTextColor="#94a3b8"
                value={wifiPassword}
                onChangeText={setWifiPassword}
                secureTextEntry
                textAlign="right"
              />
            </View>
          )}

          {activeCategory === 'PHONE' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>شماره تلفن همراه یا ثابت</Text>
              <TextInput
                style={styles.textInput}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                placeholderTextColor="#94a3b8"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                textAlign="right"
              />
            </View>
          )}

          {activeCategory === 'BARCODE_1D' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>نوع استاندارد بارکد میله‌ای</Text>
              <View style={styles.barcodeFormatRow}>
                {(['CODE_128', 'CODE_39', 'EAN_13'] as BarcodeFormat[]).map(fmt => (
                  <TouchableOpacity
                    key={fmt}
                    style={[
                      styles.formatPill,
                      barcode1DFormat === fmt && styles.formatPillActive,
                    ]}
                    onPress={() => setBarcode1DFormat(fmt)}
                  >
                    <Text
                      style={[
                        styles.formatPillText,
                        barcode1DFormat === fmt && styles.formatPillTextActive,
                      ]}
                    >
                      {fmt.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>کد یا شماره</Text>
              <TextInput
                style={styles.textInput}
                placeholder="مثلاً: 14030101"
                placeholderTextColor="#94a3b8"
                value={barcode1DContent}
                onChangeText={setBarcode1DContent}
                textAlign="center"
              />

              <View style={styles.switchRow}>
                <Switch
                  value={includeTextBelow}
                  onValueChange={setIncludeTextBelow}
                  thumbColor={includeTextBelow ? '#6366f1' : '#f43f5e'}
                  trackColor={{ true: '#c7d2fe', false: '#e2e8f0' }}
                />
                <Text style={styles.switchLabel}>نمایش شماره/متن زیر خطوط بارکد</Text>
              </View>
            </View>
          )}

          {/* Color Palette Presets */}
          <View style={styles.paletteSection}>
            <View style={styles.paletteHeader}>
              <Palette size={16} color="#6366f1" />
              <Text style={styles.paletteTitle}>رنگ بارکد</Text>
            </View>

            <View style={styles.colorsGrid}>
              {COLOR_PRESETS.map(preset => (
                <TouchableOpacity
                  key={preset.fg}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: preset.fg },
                    selectedColor === preset.fg && styles.colorCircleActive,
                  ]}
                  onPress={() => setSelectedColor(preset.fg)}
                  activeOpacity={0.8}
                >
                  {selectedColor === preset.fg && <Check size={16} color="#ffffff" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Generate Button */}
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerate}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Sparkles size={18} color="#ffffff" />
                <Text style={styles.generateButtonText}>تولید مجدد بارکد</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Barcode Output Card */}
        {generatedBarcode && (
          <View style={styles.outputCard}>
            <View style={styles.barcodeImageFrame}>
              <Image
                source={{ uri: generatedBarcode.base64 }}
                style={[
                  styles.barcodeImage,
                  activeCategory === 'BARCODE_1D' ? styles.barcodeImage1D : styles.barcodeImage2D,
                ]}
                resizeMode="contain"
              />
            </View>

            <View style={styles.outputDetails}>
              <Text style={styles.outputFormatBadge}>{generatedBarcode.format}</Text>
              <Text style={styles.outputContentText} numberOfLines={2} selectable>
                {generatedBarcode.content}
              </Text>
            </View>

            {/* Action Buttons Row */}
            <View style={styles.outputActionsRow}>
              <TouchableOpacity
                style={[styles.outputActionBtn, styles.saveActionBtn]}
                onPress={handleSaveToGallery}
                disabled={savingToGallery}
              >
                {savingToGallery ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Download size={16} color="#ffffff" />
                    <Text style={styles.saveActionText}>ذخیره در گالری</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryActionBtn} onPress={handleShare}>
                <Share2 size={16} color="#475569" />
                <Text style={styles.secondaryActionText}>اشتراک‌گذاری</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={() => handleCopy(generatedBarcode.content)}
              >
                {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} color="#475569" />}
                <Text style={[styles.secondaryActionText, copied && { color: '#10b981' }]}>
                  {copied ? 'کپی شد' : 'کپی متن'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

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

            <Text style={styles.historyTitle}>تاریخچه بارکدهای ساخته‌شده</Text>

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
              <Text style={styles.emptyHistoryText}>هنوز بارکدی ساخته نشده است</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.historyList}>
              {historyList.map(item => (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <Text style={styles.historyFormat}>{item.format}</Text>
                    <Text style={styles.historyTime}>
                      {new Date(item.timestamp).toLocaleDateString('fa-IR')}
                    </Text>
                  </View>

                  <Text style={styles.historyValue} numberOfLines={2}>
                    {item.value}
                  </Text>

                  <View style={styles.historyCardFooter}>
                    <TouchableOpacity
                      style={styles.historyUseBtn}
                      onPress={() => {
                        setTextContent(item.value);
                        setUrlContent(item.value);
                        setBarcode1DContent(item.value);
                        setIsHistoryVisible(false);
                      }}
                    >
                      <Text style={styles.historyUseText}>استفاده مجدد</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.historyCopyBtn}
                      onPress={() => handleCopy(item.value)}
                    >
                      <Copy size={15} color="#64748b" />
                    </TouchableOpacity>
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
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'flex-end',
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'right',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'right',
  },
  historyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  categoryTabsRow: {
    flexDirection: 'row-reverse',
    paddingBottom: 14,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryTabActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryTabText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  categoryTabTextActive: {
    color: '#ffffff',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 6,
    textAlign: 'right',
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 6,
    textAlign: 'right',
  },
  barcodeFormatRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  formatPill: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatPillActive: {
    backgroundColor: '#6366f1',
  },
  formatPillText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
  },
  formatPillTextActive: {
    color: '#ffffff',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  switchLabel: {
    fontSize: 12,
    color: '#475569',
  },
  paletteSection: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    marginBottom: 16,
  },
  paletteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  paletteTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  colorsGrid: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  colorCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: '#c7d2fe',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    height: 46,
    borderRadius: 14,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  outputCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  barcodeImageFrame: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  barcodeImage: {
    borderRadius: 8,
  },
  barcodeImage2D: {
    width: 220,
    height: 220,
  },
  barcodeImage1D: {
    width: 260,
    height: 120,
  },
  outputDetails: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  outputFormatBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6366f1',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  outputContentText: {
    fontSize: 13,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  outputActionsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  outputActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 12,
  },
  saveActionBtn: {
    flex: 1.5,
    backgroundColor: '#10b981',
  },
  saveActionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 42,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  secondaryActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
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
    fontSize: 15,
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
    marginBottom: 6,
  },
  historyFormat: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  historyTime: {
    fontSize: 11,
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
  historyUseBtn: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  historyUseText: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  historyCopyBtn: {
    padding: 6,
  },
});
