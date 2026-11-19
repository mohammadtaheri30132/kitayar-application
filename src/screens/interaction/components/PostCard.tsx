import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Share, I18nManager } from 'react-native';
import { MoreVertical, Heart, MessageCircle, Share2, Bookmark, Pin, Flag, Trash2, Edit3, Play, Pause } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { CommunityPostItem, communityService } from '../../../services/community/communityService';
import {
  formatRelativeTime,
  toPersianDigits,
  resolveCommunityMediaUrl,
  isVideoUrl,
  getVideoThumbUrl,
} from '../../../utils/communityHelpers';
import KitayarVideo from '../../../components/KitayarVideo';

interface Props {
  post: CommunityPostItem | any;
  onPress: () => void;
  currentUserId?: string;
  onDeletePress?: () => void;
  onEditPress?: () => void;
  onReportPress?: () => void;
}

const PostCard = ({ post, onPress, currentUserId, onDeletePress, onEditPress, onReportPress }: Props) => {
  const { colors } = useTheme();
  
  const [isLiked, setIsLiked] = useState(!!post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount || post.likes || 0);
  const [isSaved, setIsSaved] = useState(!!post.isSaved);
  const [isPending, setIsPending] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  const authorName = post.author?.name || 'معلم کیتایار';
  const authorAvatar = resolveCommunityMediaUrl(post.author?.avatar);
  const authorRole = post.author?.role || 'دبیر';
  const postContent = post.content || post.text || '';
  const postImages = post.images || (post.image ? [post.image] : []);
  const primaryMediaUrl = postImages.length > 0 ? resolveCommunityMediaUrl(postImages[0]) : null;
  const mediaIsVideo = isVideoUrl(primaryMediaUrl);
  const videoThumbUrl = mediaIsVideo ? getVideoThumbUrl(primaryMediaUrl) : null;
  const isPinned = !!post.isPinned;
  const isOwnPost = currentUserId && (post.author?._id === currentUserId || post.author?.id === currentUserId);

  const handleLike = async () => {
    if (isPending) return;
    const prevLiked = isLiked;
    const prevCount = likeCount;

    // Optimistic UI update
    setIsLiked(!prevLiked);
    setLikeCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
    setIsPending(true);

    try {
      const res = await communityService.toggleLikePost(post._id || post.id);
      setIsLiked(res.liked);
      setLikeCount(res.likeCount);
    } catch {
      // Revert on failure
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setIsPending(false);
    }
  };

  const handleSave = async () => {
    if (isPending) return;
    const prevSaved = isSaved;
    setIsSaved(!prevSaved);
    setIsPending(true);

    try {
      const res = await communityService.toggleBookmarkPost(post._id || post.id);
      setIsSaved(res.saved);
    } catch {
      setIsSaved(prevSaved);
    } finally {
      setIsPending(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${postContent}\n\n(منتشر شده در کیتایار - جامعه معلمان)`,
      });
    } catch {
      // share dismissed
    }
  };

  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: colors.surface, 
        borderColor: isPinned ? colors.primary : colors.border,
        borderWidth: isPinned ? 1.5 : 1
      }
    ]}>
      {/* Pinned Badge */}
      {isPinned && (
        <View style={styles.pinnedRow}>
          <Pin color="#d97706" size={12} />
          <Text style={styles.pinnedText}>پست ویژه و سنجاق‌شده</Text>
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
            <Text style={[styles.authorRole, { color: colors.textLight }]}>
              {authorRole ? `${authorRole} • ` : ''}{formatRelativeTime(post.createdAt)}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {isOwnPost ? (
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
              {onEditPress ? (
                <TouchableOpacity onPress={onEditPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Edit3 color={colors.textLight} size={18} />
                </TouchableOpacity>
              ) : null}
              {onDeletePress ? (
                <TouchableOpacity onPress={onDeletePress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Trash2 color={colors.textLight} size={18} />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : onReportPress ? (
            <TouchableOpacity onPress={onReportPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Flag color={colors.textLight} size={16} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Post Text */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <Text style={[styles.body, { color: colors.text }]} numberOfLines={4}>
          {postContent}
        </Text>

        {/* Post Image or Video */}
        {primaryMediaUrl && !mediaIsVideo && (
          <Image
            source={{ uri: primaryMediaUrl }}
            style={styles.postImage}
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>

      {primaryMediaUrl && mediaIsVideo && (
        <TouchableOpacity
          style={styles.videoWrapper}
          onPress={() => setIsPlayingVideo((prev) => !prev)}
          activeOpacity={0.92}
        >
          {isPlayingVideo ? (
            <>
              <KitayarVideo
                src={primaryMediaUrl}
                paused={false}
                style={styles.postImage}
              />
              <View style={styles.videoStatePill}>
                <Pause size={13} color="#fff" />
                <Text style={styles.videoStateText}>توقف</Text>
              </View>
            </>
          ) : (
            <View style={styles.videoPosterBox}>
              {videoThumbUrl ? (
                <Image
                  source={{ uri: videoThumbUrl }}
                  style={styles.videoThumbBg}
                  resizeMode="cover"
                />
              ) : null}
              <View style={styles.videoPlayCircle}>
                <Play size={26} color="#fff" fill="#fff" />
              </View>
              <View style={styles.videoStatePill}>
                <Play size={12} color="#fff" fill="#fff" />
                <Text style={styles.videoStateText}>پخش ویدیوی آموزشی</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Footer Actions */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
            <Heart 
              color={isLiked ? '#ef4444' : colors.textLight} 
              fill={isLiked ? '#ef4444' : 'transparent'} 
              size={19} 
            />
            <Text style={[styles.actionText, { color: isLiked ? '#ef4444' : colors.textLight }]}>
              {toPersianDigits(likeCount)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.7}>
            <MessageCircle color={colors.textLight} size={19} />
            <Text style={[styles.actionText, { color: colors.textLight }]}>
              {toPersianDigits(post.commentCount || post.comments || 0)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.7}>
            <Share2 color={colors.textLight} size={18} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.actionBtn} onPress={handleSave} activeOpacity={0.7}>
          <Bookmark 
            color={isSaved ? colors.primary : colors.textLight} 
            fill={isSaved ? colors.primary : 'transparent'} 
            size={19} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingTop: 14,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  pinnedRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  pinnedText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    color: '#b45309',
    fontWeight: 'bold',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 10,
    backgroundColor: '#eee'
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },
  authorName: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  authorRole: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    marginTop: 2,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  headerActions: {
    padding: 4,
  },
  body: {
    fontSize: 14,
    fontFamily: 'IRANSansX',
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 12,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  postImage: {
    width: '100%',
    height: 220,
    marginBottom: 12,
    backgroundColor: '#f3f4f6',
  },
  videoWrapper: {
    width: '100%',
    height: 220,
    marginBottom: 12,
    backgroundColor: '#0f172a',
    position: 'relative',
    overflow: 'hidden',
  },
  videoPosterBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  videoThumbBg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    end: 0,
    opacity: 0.78,
  },
  videoPlayCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoStatePill: {
    position: 'absolute',
    bottom: 10,
    start: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  videoStateText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'IRANSansX',
  },
  footer: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
  },
  actionsLeft: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    gap: 18,
  },
  actionBtn: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
  }
});

export default PostCard;
