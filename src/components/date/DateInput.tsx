import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { NormalizedDate } from '../../utils/date/types';
import { FONT_FAMILY } from '../../theme/typography';
import { radius } from '../../theme/tokens';

interface DateInputProps {
  value: NormalizedDate;
  onChange: (value: NormalizedDate) => void;
  label?: string;
  error?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  label = 'تاریخ',
  error,
}) => {
  const { colors, isDark } = useTheme();

  const updateField = (field: 'year' | 'month' | 'day', text: string) => {
    const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
    onChange({
      ...value,
      [field]: isNaN(num) ? 0 : num,
    });
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}

      {/* Inputs laid out in Persian standard order: Year / Month / Day */}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: isDark ? colors.surfaceVariant : colors.surface,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
      >
        <TextInput
          style={[styles.input, styles.yearInput, { color: colors.text }]}
          value={value.year ? value.year.toString() : ''}
          onChangeText={t => updateField('year', t)}
          placeholder="سال"
          placeholderTextColor={colors.textLight}
          keyboardType="numeric"
          maxLength={4}
        />
        <Text style={[styles.separator, { color: colors.textLight }]}>/</Text>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value.month ? value.month.toString() : ''}
          onChangeText={t => updateField('month', t)}
          placeholder="ماه"
          placeholderTextColor={colors.textLight}
          keyboardType="numeric"
          maxLength={2}
        />
        <Text style={[styles.separator, { color: colors.textLight }]}>/</Text>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value.day ? value.day.toString() : ''}
          onChangeText={t => updateField('day', t)}
          placeholder="روز"
          placeholderTextColor={colors.textLight}
          keyboardType="numeric"
          maxLength={2}
        />
      </View>

      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 52,
  },
  input: {
    flex: 1,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 8,
  },
  yearInput: {
    flex: 1.8,
  },
  separator: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    marginHorizontal: 4,
  },
  errorText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
  },
});
