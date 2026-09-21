import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { X, CheckCircle2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PREDEFINED_HEADERS = [
  { id: 'none', label: 'بدون سربرگ (حذف)' },
  { id: 'header-std-1', label: 'قالب استاندارد ۱', layout: 'standard-1', standard1: { bismillah: 'بسمه تعالی', studentName: 'نام و نام خانوادگی:', centerText: 'اداره آموزش و پرورش\nآزمون هماهنگ', examDate: 'تاریخ:', stampText: 'محل مهر', schoolName: 'آموزشگاه:', examStartTime: 'ساعت شروع:', pageCount: 'تعداد صفحه:', examDuration: 'مدت آزمون:', pageNumber: 'صفحه:', questionCount: 'تعداد سوال:', scoreNumeric: 'نمره عدد:', examSubject: 'درس:', scoreWritten: 'نمره حروف:' } },
  { id: 'header-std-4', label: 'قالب مینیمال', layout: 'standard-4', standard4: { rightLabel1: 'نام و نام خانوادگی:', centerLine1: 'بسمه تعالی', centerLine2: 'آزمون پایان ترم', centerLine3: '', leftLabel1: 'تاریخ:', rightLabel2: 'پایه و کلاس:', leftLabel2: 'زمان:', rightLabel3: 'شماره داوطلب:', leftLabel3: 'نمره:', rightLabel4: 'نام درس:', questionCountLabel: 'تعداد سوال:', pageCountLabel: 'تعداد صفحه:', bottomSignLabel: 'امضای مصحح:', bottomScoreNumeric: 'نمره به عدد:', bottomScoreWritten: 'نمره به حروف:' } }
];

const OPTION_FORMATS = [{ value: 'fa-alphabet', label: 'الف، ب...' }, { value: 'fa-number', label: '۱، ۲...' }, { value: 'en-alphabet', label: 'a, b...' }];
const FONT_FAMILIES = [{ value: "'B Nazanin', Tahoma, sans-serif", label: 'بی‌نازنین' }, { value: "'B Mitra', Tahoma, sans-serif", label: 'میترا' }, { value: "'Vazirmatn', Tahoma, sans-serif", label: 'وزیر' }];

const QuestionSettingsScreen = ({ route, navigation }: any) => {
  const { type, currentSettings, currentHeader } = route.params;

  const [settings, setSettings] = useState(currentSettings);
  const [activeHeader, setActiveHeader] = useState(currentHeader);

  const toggleSetting = (key: string) => setSettings((p: any) => ({ ...p, [key]: !p[key] }));
  const updateSetting = (key: string, value: any) => setSettings((p: any) => ({ ...p, [key]: value }));

  const handleSave = () => {
    navigation.navigate({
      name: 'PreviewExamScreen',
      params: { updatedSettings: settings, updatedHeader: activeHeader },
      merge: true,
    });
  };

  const renderContent = () => {
    switch (type) {
      case 'headers':
        return (
          <View style={styles.sectionContainer}>
            {PREDEFINED_HEADERS.map((item) => (
              <TouchableOpacity key={item.id} style={[styles.headerOption, activeHeader?.id === item.id && styles.headerOptionActive]} onPress={() => setActiveHeader(item)}>
                <Text style={[styles.headerOptionText, activeHeader?.id === item.id && styles.headerOptionTextActive]}>{item.label}</Text>
                {activeHeader?.id === item.id && <CheckCircle2 size={18} color="#3b82f6" />}
              </TouchableOpacity>
            ))}
          </View>
        );
      case 'structure':
        return (
          <View style={styles.sectionContainer}>
            <View style={styles.settingRow}>
              <Text style={styles.settingText}>بخش‌بندی سوالات</Text>
              <TouchableOpacity style={[styles.toggleBtn, settings.groupingMode === 'grouped' && styles.toggleActive]} onPress={() => updateSetting('groupingMode', settings.groupingMode === 'individual' ? 'grouped' : 'individual')}>
                <Text style={[styles.toggleText, settings.groupingMode === 'grouped' && styles.toggleTextActive]}>{settings.groupingMode === 'grouped' ? 'گروهی' : 'پشت‌سرهم'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingText}>نمایش ستون ردیف</Text>
              <TouchableOpacity style={[styles.toggleBtn, settings.showQuestionNumber && styles.toggleActive]} onPress={() => toggleSetting('showQuestionNumber')}>
                <Text style={[styles.toggleText, settings.showQuestionNumber && styles.toggleTextActive]}>{settings.showQuestionNumber ? 'فعال' : 'غیرفعال'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingText}>نمایش ستون بارم</Text>
              <TouchableOpacity style={[styles.toggleBtn, settings.showScore && styles.toggleActive]} onPress={() => toggleSetting('showScore')}>
                <Text style={[styles.toggleText, settings.showScore && styles.toggleTextActive]}>{settings.showScore ? 'فعال' : 'غیرفعال'}</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.settingText}>خط جداکننده سوالات</Text>
              <TouchableOpacity style={[styles.toggleBtn, settings.questionDivider && styles.toggleActive]} onPress={() => toggleSetting('questionDivider')}>
                <Text style={[styles.toggleText, settings.questionDivider && styles.toggleTextActive]}>{settings.questionDivider ? 'فعال' : 'غیرفعال'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'lines':
        return (
          <View style={styles.sectionContainer}>
            <View style={styles.settingRow}>
              <Text style={styles.settingText}>خط‌چین تشریحی</Text>
              <TouchableOpacity style={[styles.toggleBtn, settings.essayAnswerLines && styles.toggleActive]} onPress={() => toggleSetting('essayAnswerLines')}>
                <Text style={[styles.toggleText, settings.essayAnswerLines && styles.toggleTextActive]}>{settings.essayAnswerLines ? 'نمایش' : 'مخفی'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingText}>خط‌چین کوتاه‌پاسخ</Text>
              <TouchableOpacity style={[styles.toggleBtn, settings.shortAnswerLine && styles.toggleActive]} onPress={() => toggleSetting('shortAnswerLine')}>
                <Text style={[styles.toggleText, settings.shortAnswerLine && styles.toggleTextActive]}>{settings.shortAnswerLine ? 'نمایش' : 'مخفی'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingText}>چیدمان گزینه‌ها</Text>
              <TouchableOpacity style={[styles.toggleBtn, settings.optionsLayout === 'grid' && styles.toggleActive]} onPress={() => updateSetting('optionsLayout', settings.optionsLayout === 'inline' ? 'grid' : 'inline')}>
                <Text style={[styles.toggleText, settings.optionsLayout === 'grid' && styles.toggleTextActive]}>{settings.optionsLayout === 'grid' ? 'دو ستونه' : 'خطی'}</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.settingRow, { flexDirection: 'column', alignItems: 'stretch', gap: 10, borderBottomWidth: 0 }]}>
              <Text style={styles.settingText}>فرمت گزینه‌های تستی</Text>
              <View style={styles.optionsRow}>
                {OPTION_FORMATS.map(o => (
                  <TouchableOpacity key={o.value} style={[styles.chipBtn, settings.optionLabelFormat === o.value && styles.chipActive]} onPress={() => updateSetting('optionLabelFormat', o.value)}>
                    <Text style={[styles.chipText, settings.optionLabelFormat === o.value && styles.chipTextActive]}>{o.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
      case 'fonts':
        return (
          <View style={styles.sectionContainer}>
            <View style={[styles.settingRow, { flexDirection: 'column', alignItems: 'stretch', gap: 10 }]}>
              <Text style={styles.settingText}>فونت اصلی سوالات</Text>
              <View style={styles.optionsRow}>
                {FONT_FAMILIES.map(f => (
                  <TouchableOpacity key={f.label} style={[styles.chipBtn, settings.questionsFontFamily === f.value && styles.chipActive]} onPress={() => updateSetting('questionsFontFamily', f.value)}>
                    <Text style={[styles.chipText, settings.questionsFontFamily === f.value && styles.chipTextActive]}>{f.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingText}>اندازه فونت (px)</Text>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity style={styles.circleBtn} onPress={() => updateSetting('baseFontSize', Math.min(24, settings.baseFontSize + 1))}><Text style={styles.circleBtnText}>+</Text></TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b' }}>{settings.baseFontSize}</Text>
                <TouchableOpacity style={styles.circleBtn} onPress={() => updateSetting('baseFontSize', Math.max(10, settings.baseFontSize - 1))}><Text style={styles.circleBtnText}>-</Text></TouchableOpacity>
              </View>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingText}>«بسمه تعالی» بالای برگه</Text>
              <TouchableOpacity style={[styles.toggleBtn, settings.showBismillah && styles.toggleActive]} onPress={() => toggleSetting('showBismillah')}>
                <Text style={[styles.toggleText, settings.showBismillah && styles.toggleTextActive]}>{settings.showBismillah ? 'نمایش' : 'مخفی'}</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.settingRow, { flexDirection: 'column', alignItems: 'stretch', gap: 8, borderBottomWidth: 0 }]}>
              <Text style={styles.settingText}>متن پایانی برگه (فوتر)</Text>
              <TextInput style={styles.textInput} value={settings.footerText} onChangeText={v => updateSetting('footerText', v)} placeholder="موفق و سرفراز باشید..." />
            </View>
          </View>
        );
      default: return null;
    }
  };

  const getTitle = () => {
    if (type === 'headers') return 'انتخاب و ویرایش سربرگ';
    if (type === 'structure') return 'ساختار کلی برگه';
    if (type === 'lines') return 'تنظیمات خط‌چین و قالب';
    if (type === 'fonts') return 'فونت و متون برگه';
    return 'تنظیمات';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSave} style={styles.backBtn}><X size={24} color="#334155" /></TouchableOpacity>
        <Text style={styles.title}>{getTitle()}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {renderContent()}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>ذخیره و مشاهده در برگه</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  backBtn: { padding: 4 },
  sectionContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  settingRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  settingText: { fontSize: 14, color: '#334155', fontWeight: '500' },
  toggleBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  toggleActive: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  toggleText: { fontSize: 13, color: '#64748b', fontWeight: 'bold' },
  toggleTextActive: { color: '#2563eb' },
  optionsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  chipBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  chipActive: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  chipText: { fontSize: 13, color: '#64748b', fontWeight: 'bold' },
  chipTextActive: { color: '#2563eb' },
  circleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  circleBtnText: { fontSize: 20, color: '#334155', marginTop: -2 },
  textInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, height: 48, textAlign: 'right', fontSize: 14 },
  headerOption: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  headerOptionActive: { backgroundColor: '#eff6ff', borderRadius: 8, paddingHorizontal: 12, borderColor: 'transparent' },
  headerOptionText: { fontSize: 15, color: '#334155', textAlign: 'right' },
  headerOptionTextActive: { color: '#3b82f6', fontWeight: 'bold' },
  footer: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderColor: '#e2e8f0' },
  saveBtn: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default QuestionSettingsScreen;