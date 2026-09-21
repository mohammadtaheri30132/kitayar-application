import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { LayoutTemplate, CheckCircle2 } from 'lucide-react-native';
import BottomSheetBase from './BottomSheetBase';
import SettingGridButton from './SettingGridButton';
import { PREDEFINED_HEADERS } from './predefinedHeaders';

interface Props {
  header: any;
  onChange: (header: any) => void;
}

// 👈 خودش state باتم‌شیتش را نگه می‌دارد و مستقیم روی activeHeader والد اثر می‌گذارد.
// هیچ navigation ای رخ نمی‌دهد، پس WebView هیچ‌وقت به خاطر این تنظیم ری‌لود نمی‌شود.
const HeaderSettingItem: React.FC<Props> = ({ header, onChange }) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <SettingGridButton
        icon={<LayoutTemplate size={18} color="#8b5cf6" />}
        iconBg="#ede9fe"
        label="سربرگ"
        onPress={() => setVisible(true)}
      />

      <BottomSheetBase visible={visible} title="انتخاب سربرگ آزمون" onClose={() => setVisible(false)}>
        <FlatList
          data={PREDEFINED_HEADERS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const active = header?.id === item.id;
            return (
              <TouchableOpacity
                style={[styles.option, active && styles.optionActive]}
                onPress={() => {
                  onChange(item);
                  setVisible(false);
                }}
              >
                <Text style={[styles.optionText, active && styles.optionTextActive]}>{item.label}</Text>
                {active && <CheckCircle2 size={18} color="#3b82f6" />}
              </TouchableOpacity>
            );
          }}
        />
      </BottomSheetBase>
    </>
  );
};

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  optionActive: { backgroundColor: '#eff6ff', borderRadius: 8, paddingHorizontal: 12, borderColor: 'transparent' },
  optionText: { fontSize: 15, color: '#334155', textAlign: 'right' },
  optionTextActive: { color: '#3b82f6', fontWeight: 'bold' },
});

export default HeaderSettingItem;