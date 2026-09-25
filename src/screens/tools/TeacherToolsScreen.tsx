import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { ChevronLeft, ListFilter } from 'lucide-react-native';
import { teacherToolsHierarchy, ToolItem } from '../../data/teacherTools';
import GlobalHeader from '../../components/common/GlobalHeader';

const TeacherToolsScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();

  const handlePress = (item: ToolItem) => {
    // If the item routes to GenericCategoryScreen, we pass the title and children
    if (item.route === 'GenericCategoryScreen') {
      navigation.navigate('GenericCategoryScreen', { 
        title: item.title, 
        children: item.children 
      });
    } else {
      // Otherwise navigate to the specific existing screen (or Placeholder)
      navigation.navigate(item.route, item.params);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <GlobalHeader 
        onProfilePress={() => navigation.navigate('ProfileScreen')} 
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.listContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {teacherToolsHierarchy.map((item, index) => {
            const Icon = item.icon || ListFilter;
            const isLast = index === teacherToolsHierarchy.length - 1;
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    flexDirection: 'row',
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
});

export default TeacherToolsScreen;
