import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Type, CheckCircle2 } from 'lucide-react-native';
import BottomSheetBase from './BottomSheetBase';
import SettingGridButton from './SettingGridButton';

const FONT_FAMILIES = [
  { value: "'B Nazanin', Tahoma, sans-serif", label: 'بی‌نازنین' },
  { value: "'B Mitra', Tahoma, sans-serif", label: 'میترا' },
  { value: "'Vazirmatn', Tahoma, sans-serif", label: 'وزیر' },
];

interface Props {
  settings: any;
  onChange: (updater: (prev: any) => any) => void;
}

// 👈 این آیتم هم دو باتم‌شیت مستقل دارد: تنظیمات کلی فونت/متن + انتخاب فونت
const FontsSettingItem: React.FC<Props> = ({ settings, onChange }) => {
  const [visible, setVisible] = useState(false);
  const [fontSheetVisible, setFontSheetVisible] = useState(false);
  const toggle = (key: string) => onChange((p: any) => ({ ...p, [key]: !p[key] }));
  const update = (key: string, value: any) => onChange((p: any) => ({ ...p, [key]: value }));

  const currentFontLabel = FONT_FAMILIES.find((f) => f.value === settings.questionsFontFamily)?.label || '';

  return (
    <>
      <SettingGridButton
        icon={<Type size={18} color="#f59e0b" />}
        iconBg="#fef3c7"
        label="فونت و متون"
        onPress={() => setVisible(true)}
      />

      <BottomSheetBase visible={visible} title="فونت و متون برگه" onClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.row} onPress={() => setFontSheetVisible(true)}>
          <Text style={styles.label}>فونت اصلی سوالات</Text>
          <View style={styles.valuePill}>
            <Text style={styles.valuePillText}>{currentFontLabel}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.row}>
          <Text style={styles.label}>اندازه فونت (px)</Text>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity style={styles.circleBtn} onPress={() => update('baseFontSize', Math.min(24, settings.baseFontSize + 1))}>
              <Text style={styles.circleBtnText}>+</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b' }}>{settings.baseFontSize}</Text>
            <TouchableOpacity style={styles.circleBtn} onPress={() => update('baseFontSize', Math.max(10, settings.baseFontSize - 1))}>
              <Text style={styles.circleBtnText}>-</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>«بسمه تعالی» بالای برگه</Text>
          <TouchableOpacity style={[styles.toggle, settings.showBismillah && styles.toggleActive]} onPress={() => toggle('showBismillah')}>
            <Text style={[styles.toggleText, settings.showBismillah && styles.toggleTextActive]}>
              {settings.showBismillah ? 'نمایش' : 'مخفی'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.row, { flexDirection: 'column', alignItems: 'stretch', gap: 8, borderBottomWidth: 0 }]}>
          <Text style={styles.label}>متن پایانی برگه (فوتر)</Text>
          <TextInput
            style={styles.textInput}
            value={settings.footerText}
            onChangeText={(v) => update('footerText', v)}
            placeholder="موفق و سرفراز باشید..."
          />
        </View>
      </BottomSheetBase>

      <BottomSheetBase visible={fontSheetVisible} title="انتخاب فونت اصلی" onClose={() => setFontSheetVisible(false)}>
        {FONT_FAMILIES.map((f) => {
          const active = settings.questionsFontFamily === f.value;
          return (
            <TouchableOpacity
              key={f.value}
              style={[styles.optionRow, active && styles.optionRowActive]}
              onPress={() => {
                update('questionsFontFamily', f.value);
                setFontSheetVisible(false);
              }}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{f.label}</Text>
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
  circleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  circleBtnText: { fontSize: 20, color: '#334155', marginTop: -2 },
  textInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, height: 48, textAlign: 'right', fontSize: 14 },
  optionRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  optionRowActive: { backgroundColor: '#eff6ff', borderRadius: 8, paddingHorizontal: 12, borderColor: 'transparent' },
  optionText: { fontSize: 15, color: '#334155', textAlign: 'right' },
  optionTextActive: { color: '#3b82f6', fontWeight: 'bold' },
});

export default FontsSettingItem;