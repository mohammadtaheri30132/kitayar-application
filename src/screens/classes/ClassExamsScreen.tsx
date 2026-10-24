import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  FlatList
} from 'react-native';
import { showError } from '../../components/feedback';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/axiosConfig';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, ChevronLeft, FileText, Plus, Users, Calendar } from 'lucide-react-native';

const ClassExamsScreen = ({ route, navigation }: any) => {
  const { currentClassId, currentClassName, classroom } = route.params;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

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
      showError('مشکلی در دریافت اطلاعات آزمون‌ها رخ داد.');
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
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => navigation.navigate('ExamDashboardScreen', { examId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardInfo}>
        <View style={[styles.avatar, { backgroundColor: isDark ? '#1e293b' : '#eff6ff' }]}>
          <FileText size={20} color={colors.primary} />
        </View>
        <View style={styles.cardTextContainer}>
          <Text style={[styles.examTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
          <View style={styles.metaRow}>
            <Users size={13} color={colors.textLight} />
            <Text style={[styles.metaText, { color: colors.textLight }]}>{item.participantsCount} شرکت‌کننده مجاز</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
            <Text style={[styles.statusText, { color: colors.primary }]}>{item.status}</Text>
          </View>
        </View>
      </View>
      <ChevronLeft size={20} color={colors.textLight} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[
        styles.header, 
        { 
          backgroundColor: colors.surface, 
          borderBottomColor: colors.border,
          paddingTop: Math.max(insets.top, 12) + 8
        }
      ]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <ArrowRight size={22} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>آزمون‌های کلاس</Text>
          <Text style={[styles.headerSubtitle, { color: colors.primary }]}>{currentClassName}</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* دکمه ساخت آزمون برای این کلاس */}
        <TouchableOpacity 
          style={[styles.createExamDashedBtn, { borderColor: colors.primary }]}
          onPress={() => navigation.navigate('CreateExamStep1Screen', {
            classId: currentClassId,
            className: currentClassName,
            classroom: classroomData
          })}
          activeOpacity={0.7}
        >
          <Plus size={20} color={colors.primary} style={{ marginLeft: 8 }} />
          <Text style={[styles.createExamDashedText, { color: colors.primary }]}>ساخت آزمون برای این کلاس</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : classExams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FileText size={48} color={colors.border} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyText, { color: colors.text }]}>هیچ آزمونی برای این کلاس تعریف نشده است.</Text>
            <Text style={[styles.emptySubText, { color: colors.textLight }]}>با زدن دکمه بالا می‌توانید اولین آزمون این کلاس را تعریف کنید.</Text>
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
  container: { flex: 1 },
  header: { 
    flexDirection: 'row-reverse', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: { 
    padding: 8,
    borderRadius: 10,
  },
  headerCenter: { 
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: { 
    fontSize: 17, 
    fontWeight: 'bold', 
  },
  headerSubtitle: { 
    fontSize: 12, 
    marginTop: 2, 
    fontWeight: '600' 
  },
  
  content: { flex: 1 },

  // دکمه با بوردر نقطه‌چین، پس‌زمینه شفاف و متن آبی
  createExamDashedBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
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
    fontSize: 15,
    fontWeight: 'bold',
  },

  listContent: { 
    padding: 16, 
    paddingTop: 8, 
    paddingBottom: 100 
  },
  
  card: { 
    flexDirection: 'row-reverse', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 14, 
    borderRadius: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardInfo: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    flex: 1 
  },
  avatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: 12 
  },
  cardTextContainer: { 
    flex: 1, 
    marginLeft: 8,
    alignItems: 'flex-end',
  },
  examTitle: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    marginBottom: 4, 
    textAlign: 'right' 
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: { 
    fontSize: 12, 
    marginRight: 4, 
    textAlign: 'right' 
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-end',
  },
  statusText: { 
    fontSize: 11, 
    fontWeight: 'bold', 
    textAlign: 'right' 
  },
  
  emptyContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingTop: 50, 
    paddingHorizontal: 20 
  },
  emptyText: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  emptySubText: { 
    fontSize: 13, 
    textAlign: 'center', 
    marginTop: 8, 
    lineHeight: 20 
  },
});

export default ClassExamsScreen;
