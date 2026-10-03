import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  FlatList,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Calendar, CheckCircle, Clock } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';

const GradebookSessionsScreen = ({ route, navigation }: any) => {
  const { currentClassId, currentClassName } = route.params;
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    setTimeout(() => {
      setSessions([
        { id: '1', date: '۱۴۰۲/۰۷/۱۵', time: '۰۸:۰۰ - ۰۹:۳۰', topic: 'فصل اول - بخش اول', status: 'COMPLETED' },
        { id: '2', date: '۱۴۰۲/۰۷/۱۷', time: '۱۰:۰۰ - ۱۱:۳۰', topic: 'فصل اول - تمرینات', status: 'COMPLETED' },
        { id: '3', date: '۱۴۰۲/۰۷/۲۲', time: '۰۸:۰۰ - ۰۹:۳۰', topic: 'فصل دوم', status: 'PENDING' },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const renderSessionItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
       style={styles.card}
       activeOpacity={0.7}
       onPress={() => Alert.alert('جزئیات جلسه', 'قابلیت مدیریت کامل جلسه به زودی اضافه می‌شود.')}
    >
      <View style={styles.cardInfo}>
        <View style={[styles.avatar, { backgroundColor: item.status === 'COMPLETED' ? '#dcfce7' : '#fef9c3' }]}>
          {item.status === 'COMPLETED' ? (
            <CheckCircle size={20} color="#16a34a" />
          ) : (
            <Clock size={20} color="#ca8a04" />
          )}
        </View>
        <View style={styles.cardTextContainer}>
          <Text style={styles.sessionTopic}>{item.topic || 'بدون موضوع'}</Text>
          <Text style={styles.sessionDate}>{item.date} • {item.time}</Text>
          <Text style={[styles.statusText, { color: item.status === 'COMPLETED' ? '#16a34a' : '#ca8a04' }]}>
            {item.status === 'COMPLETED' ? 'برگزار شده' : 'پیش رو'}
          </Text>
        </View>
      </View>
      <ChevronRight size={20} color={COLORS.textLight} style={{ transform: [{ rotate: '180deg' }] }} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronRight size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>جلسات کلاس</Text>
          <Text style={styles.headerSubtitle}>{currentClassName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Calendar size={48} color={COLORS.border} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyText}>هیچ جلسه‌ای تولید نشده است.</Text>
            <Text style={styles.emptySubText}>ابتدا برنامه هفتگی کلاس را تنظیم کنید تا جلسات به صورت خودکار تولید شوند.</Text>
          </View>
        ) : (
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            renderItem={renderSessionItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: COLORS.surface, 
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  backButton: { padding: 8 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  
  content: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 100 },
  
  card: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: COLORS.surface, 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  cardInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  cardTextContainer: { flex: 1, marginRight: 10 },
  sessionTopic: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 4, textAlign: 'right' },
  sessionDate: { fontSize: 13, color: COLORS.textLight, marginBottom: 4, textAlign: 'right' },
  statusText: { fontSize: 12, color: COLORS.textLight, textAlign: 'right', fontWeight: 'bold' },
  
  emptyContainer: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
     padding: 20,
  },
  emptyText: {
     fontSize: 16,
     fontWeight: 'bold',
     color: COLORS.text,
     marginBottom: 8,
     textAlign: 'center',
  },
  emptySubText: {
     fontSize: 14,
     color: COLORS.textLight,
     textAlign: 'center',
     lineHeight: 22,
  }
});

export default GradebookSessionsScreen;
