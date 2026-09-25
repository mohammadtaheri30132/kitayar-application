import React from 'react';
import { View, TextInput, StyleSheet, I18nManager } from 'react-native';
import { Search } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

const InteractionSearch = ({ value, onChangeText, placeholder = 'جستجو...' }: Props) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Search color={colors.textLight} size={20} />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
  },
  input: {
    flex: 1,
    fontFamily: 'IRANSansX',
    fontSize: 14,
    paddingHorizontal: 8,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  }
});

export default InteractionSearch;
