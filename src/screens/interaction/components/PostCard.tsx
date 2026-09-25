import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, I18nManager } from 'react-native';
import { MoreVertical, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { Post } from '../mockData';

interface Props {
  post: Post;
  onPress: () => void;
  onMenuPress?: () => void;
}

const PostCard = ({ post, onPress, onMenuPress }: Props) => {
  const { colors } = useTheme();
  
  // Local state for fake interaction
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [isSaved, setIsSaved] = useState(post.isSaved);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          <Image source={{ uri: post.author.avatar }} style={styles.avatar} />
          <View>
            <Text style={[styles.authorName, { color: colors.text }]}>{post.author.name}</Text>
            <Text style={[styles.authorRole, { color: colors.textLight }]}>
              {post.author.role} • {post.createdAt}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.menuBtn} onPress={onMenuPress}>
          <MoreVertical color={colors.textLight} size={20} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Text style={[styles.body, { color: colors.text }]} numberOfLines={4}>
          {post.text}
        </Text>

        {post.image && (
          <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
        )}
      </TouchableOpacity>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
            <Heart color={isLiked ? '#ef4444' : colors.textLight} fill={isLiked ? '#ef4444' : 'transparent'} size={20} />
            <Text style={[styles.actionText, { color: isLiked ? '#ef4444' : colors.textLight }]}>{likeCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
            <MessageCircle color={colors.textLight} size={20} />
            <Text style={[styles.actionText, { color: colors.textLight }]}>{post.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <Share2 color={colors.textLight} size={20} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
          <Bookmark color={isSaved ? colors.primary : colors.textLight} fill={isSaved ? colors.primary : 'transparent'} size={20} />
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginHorizontal: 12,
    backgroundColor: '#eee'
  },
  authorName: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },
  authorRole: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    marginTop: 2,
  },
  menuBtn: {
    padding: 4,
  },
  body: {
    fontSize: 14,
    fontFamily: 'IRANSansX',
    lineHeight: 24,
    paddingHorizontal: 16,
    marginBottom: 12,
    textAlign: I18nManager.isRTL ? 'right' : 'left'
  },
  postImage: {
    width: '100%',
    height: 200,
    marginBottom: 12,
  },
  footer: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  actionsLeft: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    marginHorizontal: 8,
    padding: 4,
  },
  actionText: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    marginHorizontal: 6,
  }
});

export default PostCard;
