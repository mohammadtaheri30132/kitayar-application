import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, I18nManager } from 'react-native';
import { MoreVertical, MessageCircle } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { Question } from '../mockData';

interface Props {
  question: Question;
  onPress: () => void;
  onMenuPress?: () => void;
}

const QuestionCard = ({ question, onPress, onMenuPress }: Props) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          <Image source={{ uri: question.author.avatar }} style={styles.avatar} />
          <View>
            <Text style={[styles.authorName, { color: colors.text }]}>{question.author.name}</Text>
            <Text style={[styles.timeText, { color: colors.textLight }]}>{question.createdAt}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.menuBtn} onPress={onMenuPress}>
          <MoreVertical color={colors.textLight} size={20} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {question.title}
      </Text>
      
      <Text style={[styles.body, { color: colors.text }]} numberOfLines={3}>
        {question.body}
      </Text>

      <View style={styles.tagsContainer}>
        {question.tags.map((tag, index) => (
          <View key={index} style={[styles.tag, { backgroundColor: colors.surface }]}>
            <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.answerCount}>
          <MessageCircle color={colors.textLight} size={16} />
          <Text style={[styles.answerText, { color: colors.textLight }]}>
            {question.answerCount} پاسخ
          </Text>
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
  authorInfo: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 12,
    backgroundColor: '#eee'
  },
  authorName: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    marginTop: 2,
  },
  menuBtn: {
    padding: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    marginBottom: 8,
    textAlign: I18nManager.isRTL ? 'right' : 'left'
  },
  body: {
    fontSize: 14,
    fontFamily: 'IRANSansX',
    lineHeight: 22,
    marginBottom: 16,
    textAlign: I18nManager.isRTL ? 'right' : 'left'
  },
  tagsContainer: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
  },
  answerCount: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
  },
  answerText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    marginHorizontal: 6,
  }
});

export default QuestionCard;
