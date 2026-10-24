import React from 'react';
import { FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
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
    <FlatList 
      horizontal 
      inverted
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
      data={categories}
      keyExtractor={(item) => (typeof item === 'string' ? item : item.id)}
      renderItem={({ item }) => {
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
      }}
    />
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
