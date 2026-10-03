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
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Calendar, CheckCircle, Clock } from 'lucide-react-native';

const ClassAttendanceScreen = ({ route, navigation }: any) => {
  const { currentClassId, currentClassName } = route.params;
  const insets = useSafeAreaInsets();

  const [sessions, setSessions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalSessions: 0, completedSessions: 0, attendanceRate: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchSessions();
    });
    return unsubscribe;
  }, [navigation, currentClassId]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/teacher/classrooms/${currentClassId}/sessions`);
      if (response.data.success) {
        setSessions(response.data.data.sessions || []);
        setStats(response.data.data.stats || {});
      }
    } catch (error) {
      console.warn(error);
      Alert.alert('خطا', 'مشکلی در دریافت جلسات رخ داد.');
    } finally {
      setLoading(false);
    }
  };

  const renderSessionItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('TakeAttendanceScreen', { 
        sessionId: item._id, 
        currentClassId,
        sessionDate: item.date,
        subject: item.subject
      })}
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
          <Text style={styles.studentName}>{item.subject || 'عمومی'}</Text>
          <Text style={styles.studentPhone}>تاریخ: {item.date}</Text>
          <Text style={[styles.statusText, { color: item.status === 'COMPLETED' ? '#16a34a' : '#ca8a04' }]}>
            {item.status === 'COMPLETED' ? 'انجام شده' : 'نیاز به حضور غیاب'}
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
          <Text style={styles.headerTitle}>حضور و غیاب</Text>
          <Text style={styles.headerSubtitle}>{currentClassName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statTitle}>کل جلسات</Text>
                <Text style={styles.statValue}>{stats.totalSessions}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statTitle}>حضور غیاب شده</Text>
                <Text style={[styles.statValue, { color: '#16a34a' }]}>{stats.completedSessions}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statTitle}>درصد ثبت</Text>
                <Text style={[styles.statValue, { color: COLORS.primary }]}>%{stats.attendanceRate}</Text>
              </View>
            </View>

            {sessions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Calendar size={48} color={COLORS.border} />
                <Text style={styles.emptyText}>هیچ جلسه‌ای برای این کلاس طبق برنامه هفتگی یافت نشد.</Text>
              </View>
            ) : (
              <FlatList
                data={sessions}
                keyExtractor={(item) => item._id}
                renderItem={renderSessionItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
              />
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: COLORS.surface, elevation: 2 },
  backButton: { padding: 8 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  
  content: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 100 },
  
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, paddingBottom: 0 },
  statBox: { flex: 1, backgroundColor: COLORS.surface, marginHorizontal: 4, padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statTitle: { fontSize: 11, color: COLORS.textLight, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },

  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  cardTextContainer: { flex: 1, marginRight: 10 },
  studentName: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 4, textAlign: 'left' },
  studentPhone: { fontSize: 13, color: COLORS.textLight, marginBottom: 4, textAlign: 'left' },
  statusText: { fontSize: 12, color: COLORS.textLight, textAlign: 'left', fontWeight: 'bold' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 20 },
  emptyText: { color: COLORS.textLight, fontSize: 14, textAlign: 'center', marginTop: 12 },
});

export default ClassAttendanceScreen;
