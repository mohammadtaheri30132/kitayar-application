import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/axiosConfig';
import { ChevronRight, MessageCircle, User, ChevronLeft } from 'lucide-react-native';

export const TeacherConversationsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/chat/conversations');
      if (response.data?.success) {
        setConversations(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronRight size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>گفتگوهای آموزشی</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
          }
        >
          {conversations.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MessageCircle size={44} color={colors.textLight} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>هنوز گفتگویی ایجاد نشده است</Text>
              <Text style={[styles.emptySub, { color: colors.textLight }]}>
                به محض پاسخ به سوالات دانش‌آموزان یا آغاز گفتگو، پیام‌ها در این بخش نمایش داده می‌شوند.
              </Text>
            </View>
          ) : (
            conversations.map((c) => {
              // Find the other participant
              const otherUser = c.participants?.[0] || {};
              const title = c.questionRequestId?.title
                ? `پرسش: ${c.questionRequestId.title}`
                : otherUser.fullName || 'دانش‌آموز';

              return (
                <TouchableOpacity
                  key={c._id}
                  style={[styles.convItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() =>
                    navigation.navigate('TeacherChatScreen', {
                      conversationId: c._id,
                      title: otherUser.fullName || 'دانش‌آموز',
                    })
                  }
                  activeOpacity={0.75}
                >
                  <View style={styles.convRight}>
                    <View style={[styles.avatarWrap, { backgroundColor: colors.primary + '18' }]}>
                      {otherUser.avatar ? (
                        <Image source={{ uri: otherUser.avatar }} style={styles.avatarImg} />
                      ) : (
                        <User size={20} color={colors.primary} />
                      )}
                    </View>
                    <View style={styles.convDetails}>
                      <Text style={[styles.convTitle, { color: colors.text }]}>{title}</Text>
                      <Text style={[styles.convLastMsg, { color: colors.textLight }]} numberOfLines={1}>
                        {c.lastMessage || 'بدون پیام'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.convLeft}>
                    <Text style={[styles.timeText, { color: colors.textLight }]}>
                      {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString('fa-IR') : ''}
                    </Text>
                    <ChevronLeft size={16} color={colors.textLight} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontFamily: 'Estedad-FD-Bold' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  contentContainer: { padding: 16, gap: 10 },
  emptyCard: {
    padding: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  emptyTitle: { fontSize: 14, fontFamily: 'Estedad-FD-Bold', textAlign: 'center' },
  emptySub: { fontSize: 12, fontFamily: 'Estedad-FD-Regular', textAlign: 'center' },
  convItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  convRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  convDetails: { flex: 1 },
  convTitle: { fontSize: 13, fontFamily: 'Estedad-FD-Bold', textAlign: 'right' },
  convLastMsg: { fontSize: 11, fontFamily: 'Estedad-FD-Regular', textAlign: 'right', marginTop: 3 },
  convLeft: {
    alignItems: 'flex-end',
    gap: 6,
  },
  timeText: { fontSize: 10, fontFamily: 'Estedad-FD-Regular' },
});

export default TeacherConversationsScreen;
