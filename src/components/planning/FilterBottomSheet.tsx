import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Check } from 'lucide-react-native';
import { PersianBottomSheet } from '../common/PersianBottomSheet';
import { FONT_FAMILY } from '../../theme/typography';
import { radius } from '../../theme/tokens';

export interface FilterOptions {
  classes: boolean;
  tasks: boolean;
  events: boolean;
  notes: boolean;
  homeworks: boolean;
}

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  activeFilters: FilterOptions;
  onSave: (filters: FilterOptions) => void;
}

export default function FilterBottomSheet({
  visible,
  onClose,
  activeFilters,
  onSave,
}: FilterBottomSheetProps) {
  const { colors, isDark } = useTheme();
  const [filters, setFilters] = useState<FilterOptions>(activeFilters);

  useEffect(() => {
    if (visible) {
      setFilters(activeFilters);
    }
  }, [visible, activeFilters]);

  const allSelected =
    filters.classes &&
    filters.tasks &&
    filters.events &&
    filters.notes &&
    filters.homeworks !== false;

  const toggleAll = () => {
    const newState = !allSelected;
    setFilters({
      classes: newState,
      tasks: newState,
      events: newState,
      notes: newState,
      homeworks: newState,
    });
  };

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    onSave(filters);
    onClose();
  };

  const CheckboxItem = ({
    label,
    checked,
    onPress,
  }: {
    label: string;
    checked: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.filterItem,
        {
          backgroundColor: isDark ? colors.surfaceVariant : colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.checkbox,
          { borderColor: colors.border },
          checked && { backgroundColor: colors.primary, borderColor: colors.primary },
        ]}
      >
        {checked && <Check color="#fff" size={14} strokeWidth={3} />}
      </View>
      <Text style={[styles.filterLabel, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <PersianBottomSheet
      visible={visible}
      onClose={onClose}
      title="فیلترهای نمایش تقویم و برنامه‌ها"
      subtitle="موارد دلخواه را جهت نمایش انتخاب کنید"
      footer={
        <View style={styles.footerRow}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>اعمال فیلترها</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <View style={styles.container}>
        <View style={styles.selectHeaderRow}>
          <TouchableOpacity onPress={toggleAll} style={styles.toggleAllBtn}>
            <Text style={[styles.toggleAllText, { color: colors.primary }]}>
              {allSelected ? 'لغو انتخاب همه' : 'انتخاب همه موارد'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterList}>
          <CheckboxItem
            label="کلاس‌ها و دوره‌ها"
            checked={filters.classes}
            onPress={() => toggleFilter('classes')}
          />
          <CheckboxItem
            label="کارها و وظایف (تسک‌ها)"
            checked={filters.tasks}
            onPress={() => toggleFilter('tasks')}
          />
          <CheckboxItem
            label="رویدادها و جلسات"
            checked={filters.events}
            onPress={() => toggleFilter('events')}
          />
          <CheckboxItem
            label="یادداشت‌های روزانه"
            checked={filters.notes}
            onPress={() => toggleFilter('notes')}
          />
          <CheckboxItem
            label="تکالیف و ارزیابی‌ها"
            checked={filters.homeworks}
            onPress={() => toggleFilter('homeworks')}
          />
        </View>
      </View>
    </PersianBottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  selectHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleAllBtn: {
    paddingVertical: 4,
  },
  toggleAllText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
  },
  filterList: {
    gap: 10,
  },
  filterItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  filterLabel: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
    textAlign: 'right',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerRow: {
    paddingVertical: 12,
  },
  saveButton: {
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    color: '#ffffff',
  },
});
