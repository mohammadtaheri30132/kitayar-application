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
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';

const ClassReportsScreen = ({ route, navigation }: any) => {
  const { currentClassId, currentClassName } = route.params;
  const insets = useSafeAreaInsets();

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [currentClassId]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/teacher/classrooms/${currentClassId}/reports`);
      if (response.data.success) {
        setReportData(response.data.data);
      }
    } catch (error) {
      console.warn(error);
      Alert.alert('خطا', 'مشکلی در دریافت گزارشات رخ داد.');
    } finally {
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
          <Text style={styles.headerTitle}>گزارشات کلاس</Text>
          <Text style={styles.headerSubtitle}>{currentClassName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
            {reportData ? (
              <View>
                <View style={styles.reportCardsContainer}>
                  <View style={styles.reportCard}>
                    <Text style={styles.reportCardTitle}>میانگین کلاس</Text>
                    <Text style={styles.reportCardValue}>{reportData.averageClassScore || 0}</Text>
                  </View>
                  <View style={styles.reportCard}>
                    <Text style={styles.reportCardTitle}>تعداد آزمون‌ها</Text>
                    <Text style={styles.reportCardValue}>{reportData.totalExams || 0}</Text>
                  </View>
                </View>
                
                <Text style={styles.sectionTitle}>آزمون‌های اخیر</Text>
                {reportData.examAverages?.length > 0 ? (
                  reportData.examAverages.map((exam: any) => (
                    <View key={exam._id} style={styles.statCard}>
                      <Text style={styles.statTitle}>{exam.title}</Text>
                      <View style={styles.statRow}>
                        <Text style={styles.statLabel}>میانگین: {exam.averageScore} از {exam.maxScore}</Text>
                        <Text style={styles.statLabel}>شرکت‌کننده: {exam.participantsCount} نفر</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>آزمونی برگزار نشده است.</Text>
                )}

                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>نفرات برتر کلاس</Text>
                {reportData.topStudents?.length > 0 ? (
                  reportData.topStudents.map((student: any, index: number) => (
                    <View key={index} style={styles.topStudentCard}>
                      <View style={styles.topStudentRank}><Text style={styles.topStudentRankText}>{index + 1}</Text></View>
                      <Text style={styles.topStudentName}>{student.name}</Text>
                      <Text style={styles.topStudentScore}>{student.averageScore}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>دیتایی موجود نیست.</Text>
                )}
              </View>
            ) : (
              <Text style={styles.emptyText}>گزارشی در دسترس نیست.</Text>
            )}
          </ScrollView>
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
  
  reportCardsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  reportCard: { flex: 1, backgroundColor: COLORS.surface, padding: 16, borderRadius: 16, marginHorizontal: 4, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  reportCardTitle: { fontSize: 13, color: COLORS.textLight, marginBottom: 8 },
  reportCardValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12, textAlign: 'left' },
  statCard: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  statTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 8, textAlign: 'left' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: 13, color: COLORS.textLight },
  topStudentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  topStudentRank: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  topStudentRankText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 14 },
  topStudentName: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: 'bold', textAlign: 'left', paddingRight: 10 },
  topStudentScore: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
  
  emptyText: { color: COLORS.textLight, fontSize: 15, textAlign: 'center', marginTop: 20 },
});

export default ClassReportsScreen;
