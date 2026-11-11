import React, { useState, useEffect, useContext, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator, 
  Modal,
  I18nManager 
} from 'react-native';
import { showError, showSuccess, showConfirm, showWarning } from '../../../components/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, ChevronRight, ChevronLeft, Flag, Trash2, Edit3, X } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { AuthContext } from '../../../context/AuthContext';
import PostCard from '../components/PostCard';
import CommentCard from '../components/CommentCard';
import { 
  communityService, 
  CommunityPostItem, 
  CommunityCommentItem 
} from '../../../services/community/communityService';

import { getUserIdFromToken } from '../../../utils/storage';

const PostDetailScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const { postId } = route.params;

  const [post, setPost] = useState<CommunityPostItem | null>(null);
  const [comments, setComments] = useState<CommunityCommentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleDeletePost = () => {
    showConfirm({
      title: 'حذف پست',
      message: 'آیا از حذف این پست اطمینان دارید؟ این عملیات غیرقابل بازگشت است.',
      confirmText: 'حذف پست',
      cancelText: 'انصراف',
      isDestructive: true,
      icon: 'delete',
      onConfirm: async () => {
        try {
          await communityService.deletePost(postId);
          showSuccess('پست با موفقیت حذف شد.');
          navigation.goBack();
        } catch {
          showError('امکان حذف پست وجود ندارد.');
        }
      },
    });
  };

  const handleOpenEditPost = () => {
    if (!post) return;
    setEditContent(post.content || '');
    setIsEditModalVisible(true);
  };

  const handleSaveEditPost = async () => {
    if (!editContent.trim()) {
      showWarning('توضیحات پست نمی‌تواند خالی باشد.');
      return;
    }
    try {
      setIsSavingEdit(true);
      await communityService.updatePost(postId, { content: editContent.trim() });
      setPost(prev => prev ? { ...prev, content: editContent.trim() } : prev);
      setIsEditModalVisible(false);
      showSuccess('توضیحات پست با موفقیت ویرایش شد.');
    } catch {
      showError('خطا در ویرایش توضیحات پست.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  useEffect(() => {
    getUserIdFromToken().then(id => setCurrentUserId(id));
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await communityService.getPostById(postId);
      setPost(res.post);
      setComments(res.comments);
    } catch (err: any) {
      showError('امکان دریافت جزئیات پست وجود ندارد.');
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendComment = async () => {
    if (!inputText.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const text = replyTo ? `در پاسخ به ${replyTo}:\n${inputText.trim()}` : inputText.trim();
      const newComment = await communityService.createComment(postId, { content: text });

      setComments(prev => [...prev, newComment]);
      setInputText('');
      setReplyTo(null);

      if (post) {
        setPost({
          ...post,
          commentCount: (post.commentCount || 0) + 1,
        });
      }
    } catch (err: any) {
      showError('ثبت نظر انجام نشد.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    showConfirm({
      title: 'حذف نظر',
      message: 'آیا از حذف این نظر اطمینان دارید؟',
      confirmText: 'حذف',
      cancelText: 'انصراف',
      isDestructive: true,
      icon: 'delete',
      onConfirm: async () => {
        try {
          await communityService.deleteComment(commentId);
          setComments(prev => prev.filter(c => c._id !== commentId));
          if (post) {
            setPost({
              ...post,
              commentCount: Math.max(0, (post.commentCount || 1) - 1),
            });
          }
          showSuccess('نظر با موفقیت حذف شد.');
        } catch {
          showError('امکان حذف نظر وجود ندارد.');
        }
      },
    });
  };

  const handleReport = (targetType: 'post' | 'comment', targetId: string) => {
    showConfirm({
      title: 'گزارش تخلف',
      message: 'آیا مایل به گزارش این مورد به تیم پشتیبانی هستید؟',
      confirmText: 'ارسال گزارش',
      cancelText: 'انصراف',
      isDestructive: false,
      icon: 'warning',
      onConfirm: async () => {
        try {
          await communityService.reportContent({
            targetType,
            targetId,
            reason: 'inappropriate',
            description: 'گزارش محتوای نامناسب توسط کاربر',
          });
          showSuccess('گزارش شما با موفقیت برای مدیریت ارسال شد.');
        } catch {
          showError('ارسال گزارش ناموفق بود.');
        }
      },
    });
  };

  const renderHeader = () => {
    if (!post) return null;
    return (
      <View style={styles.headerComponent}>
        <PostCard 
          post={post} 
          currentUserId={currentUserId || undefined}
          onPress={() => {}} 
          onDeletePress={handleDeletePost}
          onEditPress={handleOpenEditPost}
          onReportPress={() => handleReport('post', post._id)}
        />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          نظرات ({comments.length})
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            {I18nManager.isRTL ? <ChevronRight color={colors.text} size={28} /> : <ChevronLeft color={colors.text} size={28} />}
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>پست و نظرات</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textLight }]}>در حال بارگذاری...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            {I18nManager.isRTL ? <ChevronRight color={colors.text} size={28} /> : <ChevronLeft color={colors.text} size={28} />}
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>پست و نظرات</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={{ color: colors.text, fontFamily: 'IRANSansX' }}>پست یافت نشد یا حذف شده است.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Bar */}
      <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          {I18nManager.isRTL ? <ChevronRight color={colors.text} size={28} /> : <ChevronLeft color={colors.text} size={28} />}
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>پست و نظرات</Text>
        <TouchableOpacity onPress={() => handleReport('post', post._id)}>
          <Flag color={colors.textLight} size={20} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={comments}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <CommentCard 
              data={item} 
              currentUserId={currentUserId || undefined}
              onReplyPress={() => setReplyTo(item.author?.name || 'کاربر')}
              onDeletePress={() => handleDeleteComment(item._id)}
              onReportPress={() => handleReport('comment', item._id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textLight }]}>
                هنوز نظری برای این پست ثبت نشده است. اولین نظر را بنویسید!
              </Text>
            </View>
          }
        />

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          {replyTo && (
            <View style={[styles.replyBadge, { backgroundColor: colors.background }]}>
              <Text style={[styles.replyText, { color: colors.textLight }]}>در پاسخ به {replyTo}</Text>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <Text style={{ color: colors.error, marginHorizontal: 8 }}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input, 
                { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }
              ]}
              placeholder="نظر خود را بنویسید..."
              placeholderTextColor={colors.textLight}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[
                styles.sendBtn, 
                { backgroundColor: inputText.trim() && !isSubmitting ? colors.primary : colors.border }
              ]}
              onPress={handleSendComment}
              disabled={!inputText.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Send color="#fff" size={18} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Edit Post Caption Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>ویرایش متن و توضیحات پست</Text>
                <TouchableOpacity onPress={() => setIsEditModalVisible(false)} disabled={isSavingEdit}>
                  <X size={20} color={colors.textLight} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <TextInput
                  style={[
                    styles.editTextInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                  value={editContent}
                  onChangeText={setEditContent}
                  multiline
                  textAlignVertical="top"
                  placeholder="توضیحات پست خود را بنویسید..."
                  placeholderTextColor={colors.textLight}
                  editable={!isSavingEdit}
                />

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity
                    style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
                    onPress={handleSaveEditPost}
                    disabled={isSavingEdit}
                    activeOpacity={0.85}
                  >
                    {isSavingEdit ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.modalSaveBtnText}>ذخیره تغییرات</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                    onPress={() => setIsEditModalVisible(false)}
                    disabled={isSavingEdit}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.modalCancelBtnText, { color: colors.textLight }]}>انصراف</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  navBar: {
    height: 56,
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: 'IRANSansX',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  headerComponent: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    marginTop: 8,
    marginBottom: 12,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
  },
  inputContainer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  replyBadge: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  replyText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
  },
  inputRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: 'IRANSansX',
    maxHeight: 100,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },
  modalBody: {
    padding: 16,
  },
  editTextInput: {
    height: 120,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    textAlign: 'right',
    fontFamily: 'IRANSansX',
    fontSize: 13,
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
  },
});

export default PostDetailScreen;
