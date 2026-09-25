import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { ChevronLeft, ListFilter } from 'lucide-react-native';
import { ToolItem } from '../../data/teacherTools';

const GenericCategoryScreen = ({ route, navigation }: any) => {
  const { colors, isDark } = useTheme();
  
  // The category title and its children are passed via route params
  const { title = 'ابزارها', children = [] } = route.params || {};

  const handlePress = (item: ToolItem) => {
    // If the item has children and targets GenericCategoryScreen, we nest deeper
    if (item.route === 'GenericCategoryScreen') {
      navigation.push('GenericCategoryScreen', { 
        title: item.title, 
        children: item.children 
      });
    } else {
      // Otherwise navigate to the specific tool / placeholder
      navigation.navigate(item.route, item.params);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color={colors.textLight} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {children.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textLight }]}>هیچ ابزاری در این دسته یافت نشد.</Text>
          </View>
        ) : (
          <View style={[styles.listContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {children.map((item: ToolItem, index: number) => {
              const Icon = item.icon || ListFilter;
              const isLast = index === children.length - 1;
              const isEven = index % 2 === 0;
              
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemContainer,
                    !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
                    isEven ? { backgroundColor: 'transparent' } : { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc' }
                  ]}
                  onPress={() => handlePress(item)}
                >
                  <View style={[styles.iconBox, { backgroundColor: `${item.color || colors.primary}20` }]}>
                    <Icon size={24} color={item.color || colors.primary} />
                  </View>
                  <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                  <ChevronLeft size={20} color={colors.textLight} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: { 
    padding: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  listContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
  }
});

export default GenericCategoryScreen;
