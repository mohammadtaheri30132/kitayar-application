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
  Alert,
  I18nManager 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, ChevronRight, ChevronLeft, MoreVertical, Flag, Trash2, Heart, MessageSquare } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { AuthContext } from '../../../context/AuthContext';
import QuestionCard from '../components/QuestionCard';
import CommentCard from '../components/CommentCard';
import { 
  communityService, 
  CommunityQuestionItem, 
  CommunityAnswerItem 
} from '../../../services/community/communityService';

import { getUserIdFromToken } from '../../../utils/storage';

const QuestionDetailScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const { questionId } = route.params;

  const [question, setQuestion] = useState<CommunityQuestionItem | null>(null);
  const [answers, setAnswers] = useState<CommunityAnswerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    getUserIdFromToken().then(id => setCurrentUserId(id));
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await communityService.getQuestionById(questionId);
      if (res && res.question) {
        setQuestion(res.question);
        setAnswers(res.answers || []);
      }
    } catch (err: any) {
      console.warn('Load question detail error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendAnswer = async () => {
    if (!inputText.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const text = replyTo ? `در پاسخ به ${replyTo}:\n${inputText.trim()}` : inputText.trim();
      const res = await communityService.createAnswer(questionId, { body: text });

      if (res.answer) {
        if (!res.isPending) {
          setAnswers(prev => [...prev, res.answer]);
          if (question) {
            setQuestion({
              ...question,
              answerCount: (question.answerCount || 0) + 1,
            });
          }
        }
      }
      setInputText('');
      setReplyTo(null);

      if (res.message) {
        Alert.alert(res.isPending ? 'در انتظار بررسی' : 'موفقیت', res.message);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'خطا در ثبت پاسخ';
      Alert.alert('خطا', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      const res = await communityService.acceptAnswer(questionId, answerId);
      setAnswers(prev =>
        prev.map(a =>
          a._id === answerId ? { ...a, isAccepted: res.isAccepted } : { ...a, isAccepted: false }
        )
      );
      if (question) {
        setQuestion({
          ...question,
          isResolved: res.isResolved,
          acceptedAnswer: res.isAccepted ? answerId : null,
        });
      }
    } catch (err: any) {
      Alert.alert('خطا', err.response?.data?.message || 'خطا در تغییر وضعیت پاسخ تاییدشده');
    }
  };

  const handleDeleteAnswer = (answerId: string) => {
    Alert.alert(
      'حذف پاسخ',
      'آیا از حذف این پاسخ اطمینان دارید؟',
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await communityService.deleteAnswer(answerId);
              setAnswers(prev => prev.filter(a => a._id !== answerId));
              if (question) {
                setQuestion({
                  ...question,
                  answerCount: Math.max(0, (question.answerCount || 1) - 1),
                });
              }
            } catch (err: any) {
              Alert.alert('خطا', 'حذف پاسخ ناموفق بود.');
            }
          },
        },
      ]
    );
  };

  const handleReport = (targetType: 'question' | 'answer', targetId: string) => {
    Alert.prompt
      ? Alert.prompt(
          'گزارش محتوا',
          'علت گزارش را وارد کنید (اسپم، نامناسب، و ...):',
          async (reasonText) => {
            if (!reasonText) return;
            try {
              await communityService.reportContent({
                targetType,
                targetId,
                reason: 'inappropriate',
                description: reasonText,
              });
              Alert.alert('سپاس', 'گزارش شما برای مدیران ارسال شد و بررسی خواهد شد.');
            } catch {
              Alert.alert('خطا', 'ثبت گزارش ناموفق بود.');
            }
          }
        )
      : Alert.alert(
          'گزارش تخلف',
          'آیا مایل به گزارش این محتوا به مدیران هستید؟',
          [
            { text: 'انصراف', style: 'cancel' },
            {
              text: 'ارسال گزارش',
              onPress: async () => {
                try {
                  await communityService.reportContent({
                    targetType,
                    targetId,
                    reason: 'inappropriate',
                    description: 'گزارش تخلف توسط کاربر',
                  });
                  Alert.alert('سپاس', 'گزارش شما برای مدیران ارسال شد.');
                } catch {
                  Alert.alert('خطا', 'ثبت گزارش ناموفق بود.');
                }
              },
            },
          ]
        );
  };

  const isQuestionAuthor = question && currentUserId && (
    question.author?._id === currentUserId || (question.author as any)?.id === currentUserId
  );

  const renderHeader = () => {
    if (!question) return null;
    return (
      <View style={styles.headerComponent}>
        {question.status === 'pending_review' && (
          <View style={styles.pendingReviewBanner}>
            <Text style={styles.pendingReviewBannerText}>
              ⏳ این پرسش در حال بررسی توسط ناظر است و پس از تأیید در تالار گفتگو به نمایش درخواهد آمد.
            </Text>
          </View>
        )}
        <QuestionCard 
          question={question} 
          onPress={() => {}} 
          onMenuPress={() => handleReport('question', question._id)}
        />
        
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            پاسخ‌ها ({answers.length})
          </Text>
        </View>
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>مباحثه سوال</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textLight }]}>در حال بارگذاری...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!question) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            {I18nManager.isRTL ? <ChevronRight color={colors.text} size={28} /> : <ChevronLeft color={colors.text} size={28} />}
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>مباحثه سوال</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={{ color: colors.text, fontFamily: 'IRANSansX' }}>سوال یافت نشد یا حذف شده است.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Navbar */}
      <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          {I18nManager.isRTL ? <ChevronRight color={colors.text} size={28} /> : <ChevronLeft color={colors.text} size={28} />}
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>مباحثه سوال</Text>
        <TouchableOpacity onPress={() => handleReport('question', question._id)}>
          <Flag color={colors.textLight} size={20} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={answers}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <CommentCard 
              data={item} 
              isQuestionAuthor={!!isQuestionAuthor}
              canAccept={!!isQuestionAuthor}
              currentUserId={currentUserId || undefined}
              onReplyPress={() => setReplyTo(item.author?.name || 'کاربر')}
              onAcceptPress={() => handleAcceptAnswer(item._id)}
              onDeletePress={() => handleDeleteAnswer(item._id)}
              onReportPress={() => handleReport('answer', item._id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textLight }]}>
                هنوز پاسخی ثبت نشده است. اولین پاسخ‌دهنده باشید!
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
              placeholder="پاسخ خود را بنویسید..."
              placeholderTextColor={colors.textLight}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity 
              style={[
                styles.sendBtn, 
                { backgroundColor: inputText.trim() && !isSubmitting ? colors.primary : colors.border }
              ]}
              onPress={handleSendAnswer}
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
  sectionTitleRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
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
  pendingReviewBanner: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  pendingReviewBannerText: {
    color: '#92400e',
    fontFamily: 'IRANSansX',
    fontSize: 13,
    lineHeight: 20,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
});

export default QuestionDetailScreen;
