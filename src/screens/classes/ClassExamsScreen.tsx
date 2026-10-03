import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  FlatList,
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, FileText, Plus } from 'lucide-react-native';

const ClassExamsScreen = ({ route, navigation }: any) => {
  const { currentClassId, currentClassName, classroom } = route.params;
  const insets = useSafeAreaInsets();

  const [classExams, setClassExams] = useState<any[]>([]);
  const [classroomData, setClassroomData] = useState<any>(classroom || null);
  const [loading, setLoading] = useState(true);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/teacher/exams?classroomId=${currentClassId}`);
      if (response.data.success) {
        setClassExams(response.data.data || []);
      }
    } catch (error) {
      console.warn(error);
      Alert.alert('خطا', 'مشکلی در دریافت اطلاعات آزمون‌ها رخ داد.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchExams();
    }, [currentClassId])
  );

  const renderExamItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('ExamDashboardScreen', { examId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardInfo}>
        <View style={[styles.avatar, { backgroundColor: '#e0e7ff' }]}>
          <FileText size={20} color={COLORS.primary} />
        </View>
        <View style={styles.cardTextContainer}>
          <Text style={styles.studentName}>{item.title}</Text>
          <Text style={styles.studentPhone}>{item.participantsCount} شرکت‌کننده مجاز</Text>
          <Text style={[styles.statusText, { color: COLORS.primary }]}>{item.status}</Text>
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
          <Text style={styles.headerTitle}>آزمون‌های کلاس</Text>
          <Text style={styles.headerSubtitle}>{currentClassName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* دکمه ساخت آزمون برای این کلاس با حاشیه نقطه‌چین و پس‌زمینه شفاف */}
        <TouchableOpacity 
          style={styles.createExamDashedBtn}
          onPress={() => navigation.navigate('CreateExamStep1Screen', {
            classId: currentClassId,
            className: currentClassName,
            classroom: classroomData
          })}
          activeOpacity={0.7}
        >
          <Plus size={20} color="#2563eb" style={{ marginLeft: 8 }} />
          <Text style={styles.createExamDashedText}>ساخت آزمون برای این کلاس</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : classExams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FileText size={48} color={COLORS.border} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>هیچ آزمونی برای این کلاس تعریف نشده است.</Text>
            <Text style={styles.emptySubText}>با زدن دکمه بالا می‌توانید اولین آزمون این کلاس را تعریف کنید.</Text>
          </View>
        ) : (
          <FlatList
            data={classExams}
            keyExtractor={(item) => item.id}
            renderItem={renderExamItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
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

  // دکمه با بوردر نقطه‌چین، پس‌زمینه شفاف و متن آبی
  createExamDashedBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#2563eb',
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createExamDashedText: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: 'bold',
  },

  listContent: { padding: 16, paddingTop: 8, paddingBottom: 100 },
  
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
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  cardTextContainer: { flex: 1, marginRight: 10 },
  studentName: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 4, textAlign: 'left' },
  studentPhone: { fontSize: 13, color: COLORS.textLight, marginBottom: 4, textAlign: 'left' },
  statusText: { fontSize: 12, color: COLORS.textLight, textAlign: 'left' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 40, paddingHorizontal: 20 },
  emptyText: { color: COLORS.text, fontSize: 15, fontWeight: 'bold', textAlign: 'center' },
  emptySubText: { color: COLORS.textLight, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});

export default ClassExamsScreen;
