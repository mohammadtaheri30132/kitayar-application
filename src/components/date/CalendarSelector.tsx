import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { CalendarType } from '../../utils/date/types';
import { FONT_FAMILY } from '../../theme/typography';
import { radius } from '../../theme/tokens';

interface CalendarSelectorProps {
  selected: CalendarType;
  onChange: (type: CalendarType) => void;
  label?: string;
}

const options: { label: string; value: CalendarType }[] = [
  { label: 'شمسی', value: 'jalali' },
  { label: 'میلادی', value: 'gregorian' },
  { label: 'قمری', value: 'hijri' },
];

export const CalendarSelector: React.FC<CalendarSelectorProps> = ({
  selected,
  onChange,
  label = 'نوع گاه‌شمار',
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <View
        style={[
          styles.selector,
          {
            backgroundColor: isDark ? colors.surfaceVariant : '#f1f5f9',
            borderColor: colors.border,
          },
        ]}
      >
        {options.map(opt => {
          const isActive = selected === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={[
                styles.option,
                isActive && {
                  backgroundColor: colors.primary,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color: isActive ? '#ffffff' : colors.textLight,
                    fontFamily: isActive ? FONT_FAMILY.bold : FONT_FAMILY.medium,
                  },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'right',
  },
  selector: {
    flexDirection: 'row-reverse',
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  optionText: {
    fontSize: 14,
  },
});
