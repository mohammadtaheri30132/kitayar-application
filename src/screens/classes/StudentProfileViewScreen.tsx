import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { ChevronRight, User, Phone, FileText, CheckCircle, XCircle } from 'lucide-react-native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';

const StudentProfileViewScreen = ({ route, navigation }: any) => {
  const { studentPhone, classId, className, firstName, lastName, fatherName } = route.params;

  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [examResults, setExamResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentDetails();
  }, []);

  const fetchStudentDetails = async () => {
    try {
      // برای دریافت اطلاعات کامل دانش‌آموز در این کلاس (شامل آزمون‌ها)
      // در صورتی که API خاصی برای این کار نداریم، از لیست آزمون‌ها فیلتر می‌کنیم
      // اما برای سرعت فعلاً نتایج را ماک می‌کنیم یا از API هایی که داریم استفاده می‌کنیم
      const response = await api.get(`/teacher/classrooms/${classId}/students/list`);
      if (response.data.success) {
        const student = response.data.data.find((m: any) => m.studentPhone === studentPhone);
        if (student) {
           setStudentInfo(student);
        }
      }

      // گرفتن لیست آزمون‌های کلاس
      const examsRes = await api.get(`/teacher/exams?classroomId=${classId}`);
      if (examsRes.data.success) {
        const classExams = examsRes.data.data || [];
        
        // حالا برای هر آزمون باید چک کنیم این دانش‌آموز شرکت کرده یا نه
        // این کار در حالت واقعی باید سمت بک‌اند باشد، اما برای الان با درخواست به داشبورد هر آزمون شبیه‌سازی می‌کنیم
        // یا به سادگی لیست آزمون‌ها را نشان می‌دهیم
        const results = [];
        for (const exam of classExams) {
           const dashRes = await api.get(`/teacher/exams/${exam._id || exam.id}/dashboard`);
           if (dashRes.data.success) {
              const participants = dashRes.data.data.participantsStatus;
              const p = participants.find((x: any) => x.identifier === studentPhone);
              if (p) {
                 results.push({
                   examName: exam.title,
                   status: p.status,
                   score: p.score,
                   gradingStatus: p.gradingStatus
                 });
              } else {
                 results.push({
                   examName: exam.title,
                   status: 'شروع نکرده',
                   score: null,
                   gradingStatus: null
                 });
              }
           }
        }
        setExamResults(results);
      }
    } catch (error) {
      console.warn('Error fetching student details', error);
    } finally {
      setLoading(false);
    }
  };

  const displayName = studentInfo?.firstName || firstName 
    ? `${studentInfo?.firstName || firstName || ''} ${studentInfo?.lastName || lastName || ''}`.trim()
    : studentInfo?.studentId?.user?.fullName || 'بدون نام';
    
  const displayFatherName = studentInfo?.fatherName || fatherName || 'ثبت نشده';

  const renderExamItem = ({ item }: { item: any }) => {
    const isFinished = item.status === 'تمام کرده';
    return (
      <View style={styles.examCard}>
        <View style={styles.examInfo}>
          <FileText size={20} color={COLORS.primary} />
          <Text style={styles.examTitle}>{item.examName}</Text>
        </View>
        <View style={styles.examStatus}>
          {isFinished ? (
            <View style={styles.scoreBadge}>
              <CheckCircle size={14} color="#16a34a" />
              <Text style={styles.scoreText}>نمره: {item.score ?? '؟'}</Text>
            </View>
          ) : (
            <View style={styles.pendingBadge}>
              <XCircle size={14} color="#dc2626" />
              <Text style={styles.pendingText}>{item.status}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronRight size={24} color={COLORS.textLight} />
          <Text style={styles.backButtonText}>بازگشت</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>پروفایل دانش‌آموز</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.centerBox}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={examResults}
          keyExtractor={(item, index) => index.toString()}
          ListHeaderComponent={
            <View style={styles.profileSection}>
              <View style={styles.avatarLarge}>
                <User size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.studentNameLarge}>{displayName}</Text>
              
              <View style={styles.infoBox}>
                <View style={styles.infoRow}>
                  <Phone size={16} color={COLORS.textLight} />
                  <Text style={styles.infoText}>{studentPhone}</Text>
                  <Text style={styles.infoLabel}>شماره موبایل:</Text>
                </View>
                <View style={styles.infoRow}>
                  <User size={16} color={COLORS.textLight} />
                  <Text style={styles.infoText}>{displayFatherName}</Text>
                  <Text style={styles.infoLabel}>نام پدر:</Text>
                </View>
                <View style={styles.infoRow}>
                  <CheckCircle size={16} color={COLORS.textLight} />
                  <Text style={styles.infoText}>{className}</Text>
                  <Text style={styles.infoLabel}>کلاس:</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>وضعیت در آزمون‌ها</Text>
            </View>
          }
          renderItem={renderExamItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>آزمونی برای این کلاس ثبت نشده است.</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 40, backgroundColor: COLORS.surface, elevation: 2 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  backButton: { flexDirection: 'row', alignItems: 'center', width: 60 },
  backButtonText: { color: COLORS.textLight, fontSize: 13 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  listContainer: { padding: 16 },
  
  profileSection: { alignItems: 'center', marginBottom: 24 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#bfdbfe' },
  studentNameLarge: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 20 },
  
  infoBox: { backgroundColor: COLORS.surface, width: '100%', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  infoLabel: { fontSize: 13, color: COLORS.textLight, marginLeft: 8, width: 80, textAlign: 'right' },
  infoText: { fontSize: 14, color: COLORS.text, fontWeight: 'bold', flex: 1, textAlign: 'right', marginRight: 12 },
  
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, alignSelf: 'flex-end', marginBottom: 12 },
  
  examCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  examInfo: { flexDirection: 'row', alignItems: 'center' },
  examTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginLeft: 10 },
  examStatus: { alignItems: 'flex-end' },
  scoreBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  scoreText: { color: '#166534', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  pendingText: { color: '#dc2626', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  emptyText: { textAlign: 'center', color: COLORS.textLight, marginTop: 20 }
});

export default StudentProfileViewScreen;
