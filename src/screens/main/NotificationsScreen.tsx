import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { ChevronRight, Bell, Info, CheckCircle, AlertTriangle } from 'lucide-react-native';

const mockNotifications = [
  {
    id: '1',
    title: 'سیستم',
    message: 'به نسخه جدید کیتایار خوش آمدید!',
    time: '۱۰ دقیقه پیش',
    type: 'info',
    read: false,
  },
  {
    id: '2',
    title: 'آزمون',
    message: 'آزمون ریاضی پایه دهم با موفقیت پایان یافت.',
    time: '۱ ساعت پیش',
    type: 'success',
    read: false,
  },
  {
    id: '3',
    title: 'هشدار',
    message: 'تعداد سوالات آزمون علوم کمتر از حد مجاز است.',
    time: '۲ ساعت پیش',
    type: 'warning',
    read: true,
  },
  {
    id: '4',
    title: 'پشتیبانی',
    message: 'تیکت شما با موفقیت پاسخ داده شد.',
    time: 'دیروز',
    type: 'info',
    read: true,
  }
];

const NotificationsScreen = ({ navigation }: any) => {
  const { colors } = useTheme();

  const getIcon = (type: string) => {
    switch(type) {
      case 'info': return <Info color="#3b82f6" size={24} />;
      case 'success': return <CheckCircle color="#10b981" size={24} />;
      case 'warning': return <AlertTriangle color="#f59e0b" size={24} />;
      default: return <Bell color={colors.primary} size={24} />;
    }
  };

  const getBgColor = (type: string) => {
    switch(type) {
      case 'info': return '#eff6ff';
      case 'success': return '#ecfdf5';
      case 'warning': return '#fffbeb';
      default: return colors.surface;
    }
  };

  const renderItem = ({ item }: { item: typeof mockNotifications[0] }) => (
    <View style={[styles.notificationCard, { backgroundColor: item.read ? colors.surface : getBgColor(item.type) }, !item.read && { borderColor: '#bae6fd', borderWidth: 1 }]}>
      <View style={styles.iconContainer}>
        {getIcon(item.type)}
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.time, { color: colors.textLight }]}>{item.time}</Text>
        </View>
        <Text style={[styles.message, { color: colors.text }]}>{item.message}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronRight color={colors.text} size={28} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>اعلان‌ها</Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={mockNotifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    elevation: 2,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },
  listContent: {
    padding: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconContainer: {
    marginRight: 16,
    paddingTop: 2,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },
  time: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
  },
  message: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginLeft: 12,
    marginTop: 6,
  }
});

export default NotificationsScreen;
