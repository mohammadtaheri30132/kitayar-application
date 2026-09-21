import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PenTool, CheckCircle2 } from 'lucide-react-native';
import BottomSheetBase from './BottomSheetBase';
import SettingGridButton from './SettingGridButton';

const OPTION_FORMATS = [
  { value: 'fa-alphabet', label: 'الف، ب...' },
  { value: 'fa-number', label: '۱، ۲...' },
  { value: 'en-alphabet', label: 'a, b...' },
];

interface Props {
  settings: any;
  onChange: (updater: (prev: any) => any) => void;
}

// 👈 این آیتم دو باتم‌شیت مستقل دارد: یکی برای خط‌چین/چیدمان، یکی برای فرمت گزینه‌ها
const LinesSettingItem: React.FC<Props> = ({ settings, onChange }) => {
  const [visible, setVisible] = useState(false);
  const [formatSheetVisible, setFormatSheetVisible] = useState(false);
  const toggle = (key: string) => onChange((p: any) => ({ ...p, [key]: !p[key] }));
  const update = (key: string, value: any) => onChange((p: any) => ({ ...p, [key]: value }));

  const currentFormatLabel = OPTION_FORMATS.find((f) => f.value === settings.optionLabelFormat)?.label || '';

  return (
    <>
      <SettingGridButton
        icon={<PenTool size={18} color="#10b981" />}
        iconBg="#ecfdf5"
        label="خط‌چین و قالب"
        onPress={() => setVisible(true)}
      />

      {/* باتم‌شیت اول */}
      <BottomSheetBase visible={visible} title="تنظیمات خط‌چین و قالب" onClose={() => setVisible(false)}>
        <View style={styles.row}>
          <Text style={styles.label}>خط‌چین تشریحی</Text>
          <TouchableOpacity style={[styles.toggle, settings.essayAnswerLines && styles.toggleActive]} onPress={() => toggle('essayAnswerLines')}>
            <Text style={[styles.toggleText, settings.essayAnswerLines && styles.toggleTextActive]}>
              {settings.essayAnswerLines ? 'نمایش' : 'مخفی'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>خط‌چین کوتاه‌پاسخ</Text>
          <TouchableOpacity style={[styles.toggle, settings.shortAnswerLine && styles.toggleActive]} onPress={() => toggle('shortAnswerLine')}>
            <Text style={[styles.toggleText, settings.shortAnswerLine && styles.toggleTextActive]}>
              {settings.shortAnswerLine ? 'نمایش' : 'مخفی'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>چیدمان گزینه‌ها</Text>
          <TouchableOpacity
            style={[styles.toggle, settings.optionsLayout === 'grid' && styles.toggleActive]}
            onPress={() => update('optionsLayout', settings.optionsLayout === 'inline' ? 'grid' : 'inline')}
          >
            <Text style={[styles.toggleText, settings.optionsLayout === 'grid' && styles.toggleTextActive]}>
              {settings.optionsLayout === 'grid' ? 'دو ستونه' : 'خطی'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* این ردیف باتم‌شیت مخصوص به خودش را باز می‌کند */}
        <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} onPress={() => setFormatSheetVisible(true)}>
          <Text style={styles.label}>فرمت گزینه‌های تستی</Text>
          <View style={styles.valuePill}>
            <Text style={styles.valuePillText}>{currentFormatLabel}</Text>
          </View>
        </TouchableOpacity>
      </BottomSheetBase>

      {/* باتم‌شیت دوم، مخصوص انتخاب فرمت گزینه‌ها */}
      <BottomSheetBase visible={formatSheetVisible} title="فرمت گزینه‌های تستی" onClose={() => setFormatSheetVisible(false)}>
        {OPTION_FORMATS.map((o) => {
          const active = settings.optionLabelFormat === o.value;
          return (
            <TouchableOpacity
              key={o.value}
              style={[styles.optionRow, active && styles.optionRowActive]}
              onPress={() => {
                update('optionLabelFormat', o.value);
                setFormatSheetVisible(false);
              }}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{o.label}</Text>
              {active && <CheckCircle2 size={18} color="#3b82f6" />}
            </TouchableOpacity>
          );
        })}
      </BottomSheetBase>
    </>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  label: { fontSize: 14, color: '#334155', fontWeight: '500' },
  toggle: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  toggleActive: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  toggleText: { fontSize: 13, color: '#64748b', fontWeight: 'bold' },
  toggleTextActive: { color: '#2563eb' },
  valuePill: { backgroundColor: '#eff6ff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  valuePillText: { color: '#2563eb', fontWeight: 'bold', fontSize: 13 },
  optionRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  optionRowActive: { backgroundColor: '#eff6ff', borderRadius: 8, paddingHorizontal: 12, borderColor: 'transparent' },
  optionText: { fontSize: 15, color: '#334155', textAlign: 'right' },
  optionTextActive: { color: '#3b82f6', fontWeight: 'bold' },
});

export default LinesSettingItem;