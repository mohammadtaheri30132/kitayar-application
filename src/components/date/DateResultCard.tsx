import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface DateResultCardProps {
  title?: string;
  subtitle?: string;
  value: string;
  secondaryValue?: string;
}

export const DateResultCard: React.FC<DateResultCardProps> = ({
  title,
  subtitle,
  value,
  secondaryValue,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}>
      {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
      {subtitle && <Text style={[styles.subtitle, { color: colors.textLight }]}>{subtitle}</Text>}
      
      <Text style={[styles.value, { color: colors.primary }]}>{value}</Text>
      
      {secondaryValue && (
        <Text style={[styles.secondary, { color: colors.text }]}>{secondaryValue}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  secondary: {
    fontSize: 16,
    marginTop: 8,
    fontWeight: '500',
  },
});
