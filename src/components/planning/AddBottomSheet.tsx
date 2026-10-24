import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { BookOpen, CheckSquare, FileText } from 'lucide-react-native';
import { PersianBottomSheet } from '../common/PersianBottomSheet';
import { FONT_FAMILY } from '../../theme/typography';
import { radius } from '../../theme/tokens';

interface AddBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onAddClass: () => void;
  onAddTask: () => void;
  onAddNote: () => void;
}

export default function AddBottomSheet({
  visible,
  onClose,
  onAddClass,
  onAddTask,
  onAddNote,
}: AddBottomSheetProps) {
  const { colors, isDark } = useTheme();

  const ActionItem = ({ icon: Icon, label, color, onPress }: any) => (
    <TouchableOpacity
      style={[
        styles.actionItem,
        {
          backgroundColor: isDark ? colors.surfaceVariant : colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}18` }]}>
        <Icon color={color} size={22} />
      </View>
      <Text style={[styles.actionLabel, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <PersianBottomSheet
      visible={visible}
      onClose={onClose}
      title="افزودن برنامه جدید"
      subtitle="یک بخش را جهت ایجاد فعالیت انتخاب کنید"
    >
      <View style={styles.content}>
        <ActionItem
          icon={BookOpen}
          label="افزودن کلاس جدید"
          color="#2563eb"
          onPress={() => {
            onClose();
            onAddClass();
          }}
        />
        <ActionItem
          icon={CheckSquare}
          label="افزودن کار و تسک روزانه"
          color="#10b981"
          onPress={() => {
            onClose();
            onAddTask();
          }}
        />
        <ActionItem
          icon={FileText}
          label="افزودن یادداشت جدید"
          color="#8b5cf6"
          onPress={() => {
            onClose();
            onAddNote();
          }}
        />
      </View>
    </PersianBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingTop: 8,
    paddingBottom: 16,
  },
  actionItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
  },
  actionLabel: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    textAlign: 'right',
  },
});
