import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, I18nManager } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

interface Props {
  categories: string[];
  selectedCategory: string;
  onSelect: (category: string) => void;
}

const CategoryChips = ({ categories, selectedCategory, onSelect }: Props) => {
  const { colors } = useTheme();

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {categories.map((category) => {
        const isSelected = selectedCategory === category;
        return (
          <TouchableOpacity
            key={category}
            style={[
              styles.chip,
              { backgroundColor: isSelected ? colors.primary : colors.surface,
                borderColor: isSelected ? colors.primary : colors.border
              }
            ]}
            onPress={() => onSelect(category)}
          >
            <Text style={[
              styles.text, 
              { color: isSelected ? '#fff' : colors.textLight }
            ]}>
              {category}
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
