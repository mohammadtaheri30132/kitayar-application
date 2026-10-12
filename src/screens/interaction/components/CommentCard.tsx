import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, I18nManager } from 'react-native';
import { Heart, Reply, CheckCircle2, Check, Trash2, Flag } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { formatRelativeTime, toPersianDigits } from '../../../utils/communityHelpers';

interface Props {
  data: any;
  isQuestionAuthor?: boolean;
  canAccept?: boolean;
  currentUserId?: string;
  onReplyPress?: () => void;
  onLikePress?: () => void;
  onAcceptPress?: () => void;
  onDeletePress?: () => void;
  onReportPress?: () => void;
}

const CommentCard = ({ 
  data, 
  isQuestionAuthor = false,
  canAccept = false,
  currentUserId,
  onReplyPress,
  onLikePress,
  onAcceptPress,
  onDeletePress,
  onReportPress
}: Props) => {
  const { colors } = useTheme();

  const authorName = data.author?.name || 'کاربر';
  const authorAvatar = data.author?.avatar;
  const authorRole = data.author?.role || 'معلم';
  const isAccepted = !!data.isAccepted;
  const isLiked = !!data.isLiked;
  const likeCount = data.likeCount || data.likes || 0;
  const textContent = data.body || data.content || data.text || '';
  const isOwnContent = currentUserId && (data.author?._id === currentUserId || data.author?.id === currentUserId);

  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: colors.surface, 
        borderColor: isAccepted ? '#10b981' : colors.border,
        borderWidth: isAccepted ? 2 : 1 
      }
    ]}>
      {/* Accepted Badge */}
      {isAccepted && (
        <View style={styles.acceptedHeader}>
          <CheckCircle2 color="#10b981" size={16} />
          <Text style={styles.acceptedHeaderText}>پاسخ منتخب و تاییدشده نویسنده</Text>
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
              {authorRole ? `${authorRole} • ` : ''}{formatRelativeTime(data.createdAt)}
            </Text>
          </View>
        </View>

        {/* Delete or Report button */}
        <View style={styles.headerActions}>
          {isOwnContent && onDeletePress ? (
            <TouchableOpacity onPress={onDeletePress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Trash2 color={colors.textLight} size={16} />
            </TouchableOpacity>
          ) : onReportPress ? (
            <TouchableOpacity onPress={onReportPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Flag color={colors.textLight} size={15} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Content */}
      <Text style={[styles.body, { color: colors.text }]}>
        {textContent}
      </Text>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.leftActions}>
          {onReplyPress && (
            <TouchableOpacity style={styles.actionBtn} onPress={onReplyPress}>
              <Reply color={colors.textLight} size={16} />
              <Text style={[styles.actionText, { color: colors.textLight }]}>پاسخ</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Mark as Accepted Action for Question Author */}
        {canAccept && onAcceptPress && (
          <TouchableOpacity 
            style={[
              styles.acceptBtn, 
              { 
                backgroundColor: isAccepted ? '#10b98120' : colors.surface,
                borderColor: isAccepted ? '#10b981' : colors.border
              }
            ]} 
            onPress={onAcceptPress}
          >
            <Check color={isAccepted ? '#10b981' : colors.textLight} size={14} />
            <Text style={[styles.acceptBtnText, { color: isAccepted ? '#10b981' : colors.textLight }]}>
              {isAccepted ? 'لغو انتخاب' : 'تایید به عنوان پاسخ'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  acceptedHeader: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b98115',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 10,
  },
  acceptedHeaderText: {
    fontSize: 12,
    color: '#059669',
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  authorInfo: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginHorizontal: 10,
    backgroundColor: '#eee'
  },
  avatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },
  authorName: {
    fontSize: 13,
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
  headerActions: {
    padding: 4,
  },
  body: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    lineHeight: 22,
    marginBottom: 12,
    textAlign: I18nManager.isRTL ? 'right' : 'left'
  },
  footer: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 0.5,
  },
  leftActions: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
  },
  acceptBtn: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  acceptBtnText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
  }
});

export default CommentCard;
