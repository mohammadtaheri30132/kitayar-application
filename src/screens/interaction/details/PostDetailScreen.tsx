import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, I18nManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import PostCard from '../components/PostCard';
import CommentCard from '../components/CommentCard';
import { MOCK_POSTS, MOCK_COMMENTS, Comment } from '../mockData';

const PostDetailScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const { postId } = route.params;

  const post = MOCK_POSTS.find(p => p.id === postId);
  
  const [comments, setComments] = useState<Comment[]>(
    MOCK_COMMENTS.filter(c => c.postId === postId)
  );
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  if (!post) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>پست یافت نشد.</Text>
      </View>
    );
  }

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      postId,
      author: { id: 'me', name: 'محمد طاهری', role: 'معلم', avatar: 'https://i.pravatar.cc/150?u=fake' },
      createdAt: 'همین الان',
      text: replyTo ? `در پاسخ به ${replyTo}:\n${inputText}` : inputText,
    };

    setComments([...comments, newComment]);
    setInputText('');
    setReplyTo(null);
  };

  const renderHeader = () => (
    <View style={styles.headerComponent}>
      <PostCard post={post} onPress={() => {}} />
      <Text style={[styles.sectionTitle, { color: colors.text }]}>نظرات</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          {I18nManager.isRTL ? <ChevronRight color={colors.text} size={28} /> : <ChevronLeft color={colors.text} size={28} />}
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>پست کامل</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={comments}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <CommentCard 
              data={item} 
              onReplyPress={() => setReplyTo(item.author.name)}
            />
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textLight }]}>هنوز نظری ثبت نشده است.</Text>
          }
        />

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          {replyTo && (
            <View style={[styles.replyBadge, { backgroundColor: colors.background }]}>
              <Text style={[styles.replyText, { color: colors.textLight }]}>در پاسخ به {replyTo}</Text>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <Text style={{ color: colors.error, marginLeft: 8 }}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
              placeholder="نظر خود را بنویسید..."
              placeholderTextColor={colors.textLight}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendBtn, { backgroundColor: inputText.trim() ? colors.primary : colors.textLight }]} 
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Send color="#fff" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  keyboardAvoid: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 24 },
  headerComponent: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', fontFamily: 'IRANSansX', marginBottom: 12, textAlign: I18nManager.isRTL ? 'right' : 'left' },
  emptyText: { textAlign: 'center', marginTop: 24, fontFamily: 'IRANSansX', fontSize: 14 },
  inputContainer: { padding: 16, borderTopWidth: 1 },
  replyBadge: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center', alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 8
  },
  replyText: { fontSize: 12, fontFamily: 'IRANSansX' },
  inputRow: { flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse', alignItems: 'flex-end' },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22, borderWidth: 1,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    fontFamily: 'IRANSansX', textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    marginRight: I18nManager.isRTL ? 0 : 12,
    marginLeft: I18nManager.isRTL ? 12 : 0,
  }
});

export default PostDetailScreen;
