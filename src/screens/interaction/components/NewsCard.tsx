import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, I18nManager } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { News } from '../mockData';

interface Props {
  news: News;
  onPress: () => void;
}

const NewsCard = ({ news, onPress }: Props) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.sourceBadge, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sourceText, { color: colors.primary }]}>{news.source}</Text>
        </View>
        <Text style={[styles.timeText, { color: colors.textLight }]}>{news.createdAt}</Text>
      </View>

      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {news.title}
      </Text>

      <View style={styles.contentRow}>
        <Text style={[styles.summary, { color: colors.text }]} numberOfLines={2}>
          {news.summary}
        </Text>
        
        {/* Placeholder for news image if it had one, or just an arrow icon for navigation */}
        <View style={[styles.actionBtn, { backgroundColor: colors.surface }]}>
          {I18nManager.isRTL ? <ChevronLeft color={colors.primary} size={20} /> : <ChevronRight color={colors.primary} size={20} />}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  header: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sourceText: {
    fontSize: 10,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    marginBottom: 8,
    textAlign: I18nManager.isRTL ? 'right' : 'left'
  },
  contentRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summary: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'IRANSansX',
    lineHeight: 20,
    marginRight: I18nManager.isRTL ? 0 : 12,
    marginLeft: I18nManager.isRTL ? 12 : 0,
    textAlign: I18nManager.isRTL ? 'right' : 'left'
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default NewsCard;
