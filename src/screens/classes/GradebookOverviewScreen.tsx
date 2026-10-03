import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, BookOpen, AlertTriangle, Users, FileText, Activity } from 'lucide-react-native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';

const GradebookOverviewScreen = ({ route, navigation }: any) => {
  const { classroom, currentClassId, currentClassName } = route.params;
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    average: 0,
    students: 0,
    assessments: 0,
    missingGrades: 0,
    needsAttention: 0,
  });

  useEffect(() => {
    fetchGradebookData();
  }, [currentClassId]);

  const fetchGradebookData = async () => {
    setLoading(true);
    try {
      // Mocking data for now as API might not exist yet
      // const response = await api.get(`/teacher/gradebook/${currentClassId}/overview`);
      setTimeout(() => {
        setStats({
          average: 17.5,
          students: classroom?.students?.length || 24,
          assessments: 8,
          missingGrades: 3,
          needsAttention: 2,
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.warn(error);
      Alert.alert('خطا', 'مشکلی در دریافت اطلاعات دفتر نمره رخ داد.');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronRight size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>دفتر نمره</Text>
          <Text style={styles.headerSubtitle}>{currentClassName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{stats.average}</Text>
              <Text style={styles.summaryLabel}>میانگین کلاس</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{stats.students}</Text>
              <Text style={styles.summaryLabel}>دانش‌آموزان</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{stats.assessments}</Text>
              <Text style={styles.summaryLabel}>ارزیابی‌ها</Text>
            </View>
          </View>

          <View style={styles.alertsContainer}>
            {stats.missingGrades > 0 && (
              <TouchableOpacity style={styles.alertCard}>
                <View style={styles.alertIcon}>
                  <AlertTriangle size={24} color="#ca8a04" />
                </View>
                <View style={styles.alertTextContainer}>
                  <Text style={styles.alertTitle}>نمرات ثبت نشده</Text>
                  <Text style={styles.alertSubtitle}>{stats.missingGrades} مورد نمره وارد نشده وجود دارد</Text>
                </View>
                <ChevronRight size={20} color={COLORS.textLight} style={{ transform: [{ rotate: '180deg' }] }} />
              </TouchableOpacity>
            )}
            
            {stats.needsAttention > 0 && (
              <TouchableOpacity style={styles.alertCard}>
                <View style={[styles.alertIcon, { backgroundColor: '#fee2e2' }]}>
                  <AlertTriangle size={24} color="#ef4444" />
                </View>
                <View style={styles.alertTextContainer}>
                  <Text style={styles.alertTitle}>نیاز به توجه</Text>
                  <Text style={styles.alertSubtitle}>{stats.needsAttention} دانش‌آموز افت تحصیلی داشته‌اند</Text>
                </View>
                <ChevronRight size={20} color={COLORS.textLight} style={{ transform: [{ rotate: '180deg' }] }} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.actionsContainer}>
             <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('GradebookTableScreen', { currentClassId, currentClassName })}>
               <BookOpen size={24} color={COLORS.primary} />
               <Text style={styles.actionText}>لیست نمرات</Text>
             </TouchableOpacity>
             
             <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('GradebookAssessmentsScreen', { currentClassId, currentClassName })}>
               <FileText size={24} color={COLORS.primary} />
               <Text style={styles.actionText}>ارزیابی‌ها</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('GradebookSessionsScreen', { currentClassId, currentClassName })}>
               <Activity size={24} color={COLORS.primary} />
               <Text style={styles.actionText}>جلسات</Text>
             </TouchableOpacity>
          </View>

        </ScrollView>
      )}
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
  
  content: { flex: 1, padding: 16 },
  
  summaryContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textLight
  },
  
  alertsContainer: {
    marginBottom: 20
  },
  alertCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef9c3',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12
  },
  alertTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 8
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4
  },
  alertSubtitle: {
    fontSize: 13,
    color: COLORS.textLight
  },

  actionsContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '31%',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10
  },
  actionText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.text,
    fontWeight: 'bold'
  }
});

export default GradebookOverviewScreen;
