import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FileSliders } from 'lucide-react-native';
import BottomSheetBase from './BottomSheetBase';
import SettingGridButton from './SettingGridButton';

interface Props {
  settings: any;
  // 👈 همان امضای setState را می‌پذیرد، پس می‌توان مستقیماً setSettings را پاس داد
  onChange: (updater: (prev: any) => any) => void;
}

const StructureSettingItem: React.FC<Props> = ({ settings, onChange }) => {
  const [visible, setVisible] = useState(false);
  const toggle = (key: string) => onChange((p: any) => ({ ...p, [key]: !p[key] }));
  const update = (key: string, value: any) => onChange((p: any) => ({ ...p, [key]: value }));

  return (
    <>
      <SettingGridButton
        icon={<FileSliders size={18} color="#3b82f6" />}
        iconBg="#eff6ff"
        label="ساختار"
        onPress={() => setVisible(true)}
      />

      <BottomSheetBase visible={visible} title="ساختار کلی برگه" onClose={() => setVisible(false)}>
        <View style={styles.row}>
          <Text style={styles.label}>بخش‌بندی سوالات</Text>
          <TouchableOpacity
            style={[styles.toggle, settings.groupingMode === 'grouped' && styles.toggleActive]}
            onPress={() => update('groupingMode', settings.groupingMode === 'individual' ? 'grouped' : 'individual')}
          >
            <Text style={[styles.toggleText, settings.groupingMode === 'grouped' && styles.toggleTextActive]}>
              {settings.groupingMode === 'grouped' ? 'گروهی' : 'پشت‌سرهم'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>نمایش ستون ردیف</Text>
          <TouchableOpacity style={[styles.toggle, settings.showQuestionNumber && styles.toggleActive]} onPress={() => toggle('showQuestionNumber')}>
            <Text style={[styles.toggleText, settings.showQuestionNumber && styles.toggleTextActive]}>
              {settings.showQuestionNumber ? 'فعال' : 'غیرفعال'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>نمایش ستون بارم</Text>
          <TouchableOpacity style={[styles.toggle, settings.showScore && styles.toggleActive]} onPress={() => toggle('showScore')}>
            <Text style={[styles.toggleText, settings.showScore && styles.toggleTextActive]}>
              {settings.showScore ? 'فعال' : 'غیرفعال'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Text style={styles.label}>خط جداکننده سوالات</Text>
          <TouchableOpacity style={[styles.toggle, settings.questionDivider && styles.toggleActive]} onPress={() => toggle('questionDivider')}>
            <Text style={[styles.toggleText, settings.questionDivider && styles.toggleTextActive]}>
              {settings.questionDivider ? 'فعال' : 'غیرفعال'}
            </Text>
          </TouchableOpacity>
        </View>
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
});

export default StructureSettingItem;