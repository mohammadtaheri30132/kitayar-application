import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, I18nManager } from 'react-native';
import { Heart, Reply } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { Comment, Answer } from '../mockData';

interface Props {
  data: Comment | Answer;
  onReplyPress?: () => void;
}

const CommentCard = ({ data, onReplyPress }: Props) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          <Image source={{ uri: data.author.avatar }} style={styles.avatar} />
          <View>
            <Text style={[styles.authorName, { color: colors.text }]}>{data.author.name}</Text>
            <Text style={[styles.timeText, { color: colors.textLight }]}>{data.createdAt}</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.body, { color: colors.text }]}>
        {data.body || (data as any).text /* Support both Answer and Comment types */}
      </Text>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.actionBtn}>
          <Heart color={colors.textLight} size={16} />
          <Text style={[styles.actionText, { color: colors.textLight }]}>
            {(data as Answer).likes || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onReplyPress}>
          <Reply color={colors.textLight} size={16} />
          <Text style={[styles.actionText, { color: colors.textLight }]}>پاسخ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
  body: {
    fontSize: 14,
    fontFamily: 'IRANSansX',
    lineHeight: 22,
    marginBottom: 16,
    textAlign: I18nManager.isRTL ? 'right' : 'left'
  },
  footer: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#00000010'
  },
  actionBtn: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    marginRight: I18nManager.isRTL ? 0 : 20,
    marginLeft: I18nManager.isRTL ? 20 : 0,
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    marginHorizontal: 6,
  }
});

export default CommentCard;
