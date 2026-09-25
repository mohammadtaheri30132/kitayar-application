import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, I18nManager } from 'react-native';
import { Settings } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import NewsCard from '../components/NewsCard';
import { MOCK_NEWS } from '../mockData';

const NewsTab = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity 
          style={[styles.settingsBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('NewsSettingsScreen')}
        >
          <Settings color={colors.textLight} size={20} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_NEWS}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <NewsCard 
            news={item} 
            onPress={() => navigation.navigate('NewsDetailScreen', { newsId: item.id })}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingsBtn: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  }
});

export default NewsTab;
