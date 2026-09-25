import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { CalendarType } from '../../utils/date/types';

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
  label = 'تقویم',
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <View style={[styles.selector, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
        {options.map((opt) => {
          const isActive = selected === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={[
                styles.option,
                isActive && {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: isActive ? '#fff' : colors.textLight },
                  isActive && { fontWeight: 'bold' }
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
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'right',
  },
  selector: {
    flexDirection: 'row-reverse',
    borderRadius: 12,
    padding: 4,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  optionText: {
    fontSize: 14,
  },
});
