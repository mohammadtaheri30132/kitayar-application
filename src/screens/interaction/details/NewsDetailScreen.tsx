import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, I18nManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import NewsCard from '../components/NewsCard';
import { MOCK_NEWS } from '../mockData';

const NewsDetailScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const { newsId } = route.params;

  const news = MOCK_NEWS.find(n => n.id === newsId);

  // Take 2 other news for related news
  const relatedNews = MOCK_NEWS.filter(n => n.id !== newsId).slice(0, 2);

  if (!news) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>خبر یافت نشد.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          {I18nManager.isRTL ? <ChevronRight color={colors.text} size={28} /> : <ChevronLeft color={colors.text} size={28} />}
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>جزئیات خبر</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: colors.surface }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>{news.source}</Text>
          </View>
          <Text style={[styles.timeText, { color: colors.textLight }]}>{news.createdAt}</Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{news.title}</Text>

        {news.image && (
          <Image source={{ uri: news.image }} style={styles.newsImage} resizeMode="cover" />
        )}

        <Text style={[styles.body, { color: colors.text }]}>
          {news.summary}
          {'\n\n'}
          {news.body}
        </Text>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[styles.relatedTitle, { color: colors.text }]}>اخبار مرتبط</Text>
        
        {relatedNews.map(item => (
          <NewsCard 
            key={item.id} 
            news={item} 
            onPress={() => navigation.push('NewsDetailScreen', { newsId: item.id })} 
          />
        ))}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'IRANSansX' },
  content: { padding: 20 },
  badgeRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: 'bold', fontFamily: 'IRANSansX' },
  timeText: { fontSize: 13, fontFamily: 'IRANSansX' },
  title: {
    fontSize: 22, fontWeight: 'bold', fontFamily: 'IRANSansX',
    lineHeight: 34, marginBottom: 20,
    textAlign: I18nManager.isRTL ? 'right' : 'left'
  },
  newsImage: {
    width: '100%', height: 200, borderRadius: 16, marginBottom: 20
  },
  body: {
    fontSize: 16, fontFamily: 'IRANSansX', lineHeight: 28,
    textAlign: I18nManager.isRTL ? 'right' : 'left'
  },
  divider: {
    height: 1, width: '100%', marginVertical: 32
  },
  relatedTitle: {
    fontSize: 18, fontWeight: 'bold', fontFamily: 'IRANSansX', marginBottom: 16,
    textAlign: I18nManager.isRTL ? 'right' : 'left'
  }
});

export default NewsDetailScreen;
