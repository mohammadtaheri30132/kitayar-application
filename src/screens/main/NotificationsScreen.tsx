import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { ChevronRight, Bell, Info, CheckCircle, AlertTriangle, Megaphone, CheckCheck } from 'lucide-react-native';
import { api } from '../../api/axiosConfig';

export interface TeacherNotificationItem {
  _id: string;
  title: string;
  body: string;
  type: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  senderName?: string;
  senderRole?: string;
  isRead: boolean;
  createdAt: string;
}

const NotificationsScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<TeacherNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/teacher/notifications');
      if (res.data?.success) {
        setNotifications(res.data.data || []);
      }
    } catch (e) {
      console.warn('Error fetching teacher notifications:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleMarkAsRead = async (item: TeacherNotificationItem) => {
    if (item.isRead) return;
    try {
      await api.post('/teacher/notifications/mark-read', { notificationIds: [item._id] });
      setNotifications((prev) =>
        prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/teacher/notifications/mark-read', {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      // ignore
    }
  };

  const getIcon = (type: string, priority?: string) => {
    if (priority === 'urgent' || priority === 'high') {
      return <AlertTriangle color="#f59e0b" size={24} />;
    }
    switch (type) {
      case 'ADMIN_ANNOUNCEMENT':
        return <Megaphone color="#3b82f6" size={24} />;
      case 'HOMEWORK':
        return <CheckCircle color="#10b981" size={24} />;
      default:
        return <Bell color={colors.primary} size={24} />;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    if (priority === 'urgent') {
      return <Text style={[styles.priorityBadge, styles.priorityUrgent]}>فوری</Text>;
    }
    if (priority === 'high') {
      return <Text style={[styles.priorityBadge, styles.priorityHigh]}>مهم</Text>;
    }
    return null;
  };

  const handleNotificationPress = (item: any) => {
    handleMarkAsRead(item);
    if (
      item.data?.screen === 'SupportTicketsScreen' ||
      item.data?.ticketId ||
      item.type === 'SUPPORT_MESSAGE' ||
      (item.title && item.title.includes('پشتیبانی'))
    ) {
      const ticketId = item.data?.ticketId || item.targetId;
      navigation.navigate('SupportTicketsScreen', { ticketId });
    }
  };

  const renderItem = ({ item }: { item: TeacherNotificationItem }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => handleNotificationPress(item)}
      style={[
        styles.notificationCard,
        {
          backgroundColor: item.isRead ? colors.surface : '#1e293b',
          borderColor: item.isRead ? colors.border : '#38bdf8',
          borderWidth: item.isRead ? 1 : 1.5,
        },
      ]}
    >
      <View style={styles.iconContainer}>{getIcon(item.type, item.priority)}</View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <View style={styles.titleArea}>
            <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
            {getPriorityBadge(item.priority)}
          </View>
          <Text style={[styles.time, { color: colors.textLight }]}>
            {new Date(item.createdAt).toLocaleDateString('fa-IR')}
          </Text>
        </View>

        <Text style={[styles.message, { color: colors.text }]}>{item.body}</Text>

        {item.senderName ? (
          <Text style={styles.senderNote}>فرستنده: {item.senderName}</Text>
        ) : null}
      </View>

      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronRight color={colors.text} size={28} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>اعلان‌های کیتایار</Text>
        <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
          <CheckCheck size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Bell size={42} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>هیچ اعلانی ندارید</Text>
          <Text style={styles.emptySubtitle}>
            اعلان‌های ارسالی مدیریت و بخشنامه‌ها در این بخش نمایش داده می‌شوند.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchNotifications();
              }}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    elevation: 2,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  markAllBtn: {
    padding: 6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 16,
    alignItems: 'flex-start',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconContainer: {
    marginLeft: 12,
    paddingTop: 2,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  priorityBadge: {
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    overflow: 'hidden',
    fontWeight: 'bold',
  },
  priorityUrgent: {
    backgroundColor: '#fee2e2',
    color: '#ef4444',
  },
  priorityHigh: {
    backgroundColor: '#fef3c7',
    color: '#d97706',
  },
  time: {
    fontSize: 11,
  },
  message: {
    fontSize: 13,
    lineHeight: 20,
  },
  senderNote: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38bdf8',
    marginRight: 8,
    marginTop: 6,
  },
});

export default NotificationsScreen;
