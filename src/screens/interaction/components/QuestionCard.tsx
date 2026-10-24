import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, I18nManager } from 'react-native';
import { MoreVertical, MessageCircle, Heart, Pin, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { CommunityQuestionItem } from '../../../services/community/communityService';
import { formatRelativeTime, toPersianDigits } from '../../../utils/communityHelpers';

interface Props {
  question: CommunityQuestionItem | any;
  onPress: () => void;
  onMenuPress?: () => void;
}

const QuestionCard = ({ question, onPress, onMenuPress }: Props) => {
  const { colors, isDark } = useTheme();

  const authorName = question.author?.name || 'کاربر کیتایار';
  const authorAvatar = question.author?.avatar;
  const authorRole = question.author?.role || 'معلم';
  const timeText = question.createdAt ? formatRelativeTime(question.createdAt) : '';
  const answerCount = question.answerCount || 0;
  const likeCount = question.likeCount || 0;
  const isResolved = !!question.isResolved;
  const isPinned = !!question.isPinned;
  const categoryName = question.category?.name;
  const categoryColor = question.category?.color || colors.primary;

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          backgroundColor: colors.surface, 
          borderColor: isPinned ? colors.primary : colors.border,
          borderWidth: isPinned ? 1.5 : 1
        }
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Top badges: Pinned / Review Status */}
      {(isPinned || question.status === 'pending_review') && (
        <View style={styles.badgeRow}>
          {isPinned && (
            <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(217,119,6,0.2)' : '#fef3c7' }]}>
              <Pin color={isDark ? '#fbbf24' : '#d97706'} size={12} />
              <Text style={[styles.statusBadgeText, { color: isDark ? '#fbbf24' : '#b45309' }]}>سنجاق شده</Text>
            </View>
          )}
          {question.status === 'pending_review' && (
            <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(217,119,6,0.2)' : '#fef3c7' }]}>
              <Text style={[styles.statusBadgeText, { color: isDark ? '#fbbf24' : '#b45309' }]}>⏳ در حال بررسی توسط ناظر</Text>
            </View>
          )}
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          {authorAvatar ? (
            <Image source={{ uri: authorAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarInitial}>{authorName.charAt(0)}</Text>
            </View>
          )}
          <View>
            <Text style={[styles.authorName, { color: colors.text }]}>{authorName}</Text>
            <Text style={[styles.timeText, { color: colors.textLight }]}>
              {authorRole ? `${authorRole} • ` : ''}{timeText}
            </Text>
          </View>
        </View>

        {onMenuPress && (
          <TouchableOpacity style={styles.menuBtn} onPress={onMenuPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MoreVertical color={colors.textLight} size={20} />
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {question.title}
      </Text>
      
      {/* Body preview */}
      <Text style={[styles.body, { color: colors.text }]} numberOfLines={3}>
        {question.body}
      </Text>

      {/* Category and Tags */}
      <View style={styles.tagsContainer}>
        {categoryName && (
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '18', borderColor: categoryColor }]}>
            <Text style={[styles.categoryBadgeText, { color: categoryColor }]}>
              {categoryName}
            </Text>
          </View>
        )}
        {Array.isArray(question.tags) && question.tags.map((tag: string, index: number) => (
          <View key={index} style={[styles.tag, { backgroundColor: colors.surface }]}>
            <Text style={[styles.tagText, { color: colors.textLight }]}>#{tag}</Text>
          </View>
        ))}
      </View>

      {/* Footer Stats */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.statsLeft}>
          <View style={styles.statItem}>
            <MessageCircle color={colors.textLight} size={15} />
            <Text style={[styles.statText, { color: colors.textLight }]}>
              {toPersianDigits(answerCount)} پاسخ
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  statusBadge: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
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
    width: 38,
    height: 38,
    borderRadius: 19,
    marginHorizontal: 10,
    backgroundColor: '#eee'
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },
  authorName: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    marginTop: 2,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  menuBtn: {
    padding: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    marginBottom: 8,
    lineHeight: 22,
    textAlign: I18nManager.isRTL ? 'right' : 'left'
  },
  body: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    lineHeight: 21,
    marginBottom: 12,
    textAlign: I18nManager.isRTL ? 'right' : 'left'
  },
  tagsContainer: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
  },
  footer: {
    borderTopWidth: 0.5,
    paddingTop: 10,
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsLeft: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
  }
});

export default QuestionCard;
