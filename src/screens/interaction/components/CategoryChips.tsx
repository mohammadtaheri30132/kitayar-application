import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, I18nManager } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

export interface CategoryChipItem {
  id: string;
  name: string;
  color?: string;
}

interface Props {
  categories: (string | CategoryChipItem)[];
  selectedCategoryId: string;
  onSelect: (categoryId: string) => void;
}

const CategoryChips = ({ categories, selectedCategoryId, onSelect }: Props) => {
  const { colors } = useTheme();

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {categories.map((item) => {
        const id = typeof item === 'string' ? item : item.id;
        const name = typeof item === 'string' ? item : item.name;
        const isSelected = selectedCategoryId === id;
        return (
          <TouchableOpacity
            key={id}
            style={[
              styles.chip,
              { 
                backgroundColor: isSelected ? colors.primary : colors.surface,
                borderColor: isSelected ? colors.primary : colors.border
              }
            ]}
            onPress={() => onSelect(id)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.text, 
              { color: isSelected ? '#fff' : colors.textLight }
            ]}>
              {name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
    marginBottom: 8,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  text: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    fontWeight: '500',
  }
});

export default CategoryChips;
