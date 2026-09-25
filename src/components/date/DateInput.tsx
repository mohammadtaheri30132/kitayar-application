import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { CalendarType, NormalizedDate } from '../../utils/date/types';

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
      
      <View style={[
        styles.inputRow, 
        { borderColor: error ? colors.error || '#ef4444' : colors.border }
      ]}>
        <TextInput
          style={[styles.input, styles.yearInput, { color: colors.text }]}
          value={value.year ? value.year.toString() : ''}
          onChangeText={(t) => updateField('year', t)}
          placeholder="سال"
          placeholderTextColor={colors.textLight}
          keyboardType="numeric"
          maxLength={4}
        />
        <Text style={[styles.separator, { color: colors.textLight }]}>/</Text>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value.month ? value.month.toString() : ''}
          onChangeText={(t) => updateField('month', t)}
          placeholder="ماه"
          placeholderTextColor={colors.textLight}
          keyboardType="numeric"
          maxLength={2}
        />
        <Text style={[styles.separator, { color: colors.textLight }]}>/</Text>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value.day ? value.day.toString() : ''}
          onChangeText={(t) => updateField('day', t)}
          placeholder="روز"
          placeholderTextColor={colors.textLight}
          keyboardType="numeric"
          maxLength={2}
        />
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
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
  inputRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    textAlign: 'center',
  },
  yearInput: {
    flex: 2,
  },
  separator: {
    fontSize: 20,
    marginHorizontal: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  }
});
