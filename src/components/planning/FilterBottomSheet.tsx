import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Check, X } from 'lucide-react-native';

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  activeFilters: {
    classes: boolean;
    tasks: boolean;
    events: boolean;
    notes: boolean;
  };
  onSave: (filters: { classes: boolean; tasks: boolean; events: boolean; notes: boolean }) => void;
}

export default function FilterBottomSheet({ visible, onClose, activeFilters, onSave }: FilterBottomSheetProps) {
  const { colors } = useTheme();
  const [filters, setFilters] = useState(activeFilters);

  useEffect(() => {
    if (visible) {
      setFilters(activeFilters);
    }
  }, [visible, activeFilters]);

  const allSelected = filters.classes && filters.tasks && filters.events && filters.notes;

  const toggleAll = () => {
    const newState = !allSelected;
    setFilters({ classes: newState, tasks: newState, events: newState, notes: newState });
  };

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    onSave(filters);
    onClose();
  };

  const CheckboxItem = ({ label, checked, onPress }: { label: string, checked: boolean, onPress: () => void }) => (
    <TouchableOpacity style={styles.filterItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.checkbox, checked && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
        {checked && <Check color="#fff" size={14} />}
      </View>
      <Text style={[styles.filterLabel, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        
        <View style={[styles.bottomSheet, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>فیلتر نمایش</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={colors.textLight} size={24} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <CheckboxItem label="نمایش همه" checked={allSelected} onPress={toggleAll} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <CheckboxItem label="برنامه‌های کلاسی" checked={filters.classes} onPress={() => toggleFilter('classes')} />
            <CheckboxItem label="کارهای امروز (تسک‌ها)" checked={filters.tasks} onPress={() => toggleFilter('tasks')} />
            <CheckboxItem label="رویدادها" checked={filters.events} onPress={() => toggleFilter('events')} />
            <CheckboxItem label="یادداشت‌ها" checked={filters.notes} onPress={() => toggleFilter('notes')} />
          </View>

          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>ذخیره و اعمال</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'IRANSansX',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    marginBottom: 24,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  filterLabel: {
    fontFamily: 'IRANSansX',
    fontSize: 15,
  },
  divider: {
    height: 1,
    marginVertical: 8,
    opacity: 0.5,
  },
  saveBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontFamily: 'IRANSansX',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
