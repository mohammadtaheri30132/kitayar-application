import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';
import { ChevronRight, Settings, Plus, Trash2, UserPlus, Users, FileText, BarChart2, BookOpen } from 'lucide-react-native';

const MOCK_COURSES = [
  { _id: '64f1a2b3c4d5e6f7a8b9c001', name: 'ریاضیات' },
  { _id: '64f1a2b3c4d5e6f7a8b9c002', name: 'علوم تجربی' },
  { _id: '64f1a2b3c4d5e6f7a8b9c003', name: 'ادبیات فارسی' },
  { _id: '64f1a2b3c4d5e6f7a8b9c004', name: 'زبان انگلیسی' },
];

const MOCK_GRADES = [
  { _id: '64f1a2b3c4d5e6f7a8b9c011', name: 'هفتم' },
  { _id: '64f1a2b3c4d5e6f7a8b9c012', name: 'هشتم' },
  { _id: '64f1a2b3c4d5e6f7a8b9c013', name: 'نهم' },
  { _id: '64f1a2b3c4d5e6f7a8b9c014', name: 'دهم' },
];

const ClassDetailsScreen = ({ route, navigation }: any) => {
  const { classroom, classId, className } = route.params;
  const currentClassId = classId || classroom?._id;
  const currentClassName = className || classroom?.name;

  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'EXAMS' | 'REPORTS'>('STUDENTS');
  const [memberships, setMemberships] = useState<any[]>([]);
  const [classExams, setClassExams] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Add Student Form State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newFatherName, setNewFatherName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Settings Form State
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [editClassName, setEditClassName] = useState(currentClassName);
  const [editCourse, setEditCourse] = useState<string | null>(classroom?.course?._id || null);
  const [editGrade, setEditGrade] = useState<string | null>(classroom?.grade?._id || null);
  const [editNote, setEditNote] = useState(classroom?.note || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [currentClassId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersRes, examsRes, reportRes] = await Promise.all([
        api.get(`/teacher/classrooms/${currentClassId}/students/list`),
        api.get(`/teacher/exams?classroomId=${currentClassId}`),
        api.get(`/teacher/classrooms/${currentClassId}/reports`)
      ]);
      
      if (membersRes.data.success) setMemberships(membersRes.data.data);
      if (examsRes.data.success) setClassExams(examsRes.data.data || []);
      if (reportRes.data.success) setReportData(reportRes.data.data);
    } catch (error) {
      console.warn(error);
      Alert.alert('خطا', 'مشکلی در دریافت اطلاعات کلاس رخ داد.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    if (!newFirstName || !newLastName) {
      Alert.alert('خطا', 'لطفاً نام و نام خانوادگی را وارد کنید.');
      return;
    }
    
    let phoneToUse = newPhone;
    if (!phoneToUse) {
      phoneToUse = `0900${Math.floor(1000000 + Math.random() * 9000000)}`; // ساخت یک شماره فرضی برای ثبت در سیستم
    } else if (phoneToUse.length !== 11 || !phoneToUse.startsWith('09')) {
      Alert.alert('خطا', 'شماره موبایل نامعتبر است (مثال: 09123456789)');
      return;
    }

    setIsAdding(true);
    try {
      const studentObj = {
        phone: phoneToUse,
        firstName: newFirstName,
        lastName: newLastName,
        fatherName: newFatherName
      };

      const response = await api.post(`/teacher/classrooms/${currentClassId}/students`, {
        students: [studentObj] 
      });
      if (response.data.success) {
        setNewFirstName('');
        setNewLastName('');
        setNewFatherName('');
        setNewPhone('');
        setAddModalVisible(false);
        fetchData();
      }
    } catch (error: any) {
      Alert.alert('خطا', error.response?.data?.message || 'خطا در افزودن دانش‌آموز');
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateClass = async () => {
    if (!editClassName.trim()) {
      Alert.alert('خطا', 'نام کلاس نمی‌تواند خالی باشد.');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await api.put(`/teacher/classrooms/${currentClassId}`, {
        name: editClassName,
        courseId: editCourse,
        gradeId: editGrade,
        note: editNote
      });
      if (response.data.success) {
        setSettingsModalVisible(false);
        // بروزرسانی اسم کلاس در UI در صورت نیاز (می‌توانید title را در state نگه دارید)
        fetchData();
        Alert.alert('موفقیت', 'تنظیمات کلاس با موفقیت بروزرسانی شد.');
      }
    } catch (error: any) {
      Alert.alert('خطا', error.response?.data?.message || 'خطا در بروزرسانی کلاس');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveStudent = (phone: string) => {
    Alert.alert(
      'حذف دانش‌آموز',
      `آیا از حذف شماره ${phone} از این کلاس مطمئن هستید؟`,
      [
        { text: 'انصراف', style: 'cancel' },
        { 
          text: 'حذف', 
          style: 'destructive',
          onPress: async () => {
            setIsRemoving(phone);
            try {
              const response = await api.delete(`/teacher/classrooms/${currentClassId}/students/${phone}`);
              if (response.data.success) {
                fetchData();
              }
            } catch (error: any) {
              Alert.alert('خطا', 'مشکلی در حذف دانش‌آموز رخ داد.');
            } finally {
              setIsRemoving(null);
            }
          }
        }
      ]
    );
  };

  const renderStudentItem = ({ item, index }: { item: any, index: number }) => {
    const displayName = item.firstName 
      ? `${item.firstName} ${item.lastName}` 
      : (item.studentId?.user?.fullName || 'بدون نام');
      
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('StudentProfileViewScreen', {
          studentPhone: item.studentPhone,
          classId: currentClassId,
          className: currentClassName,
          firstName: item.firstName,
          lastName: item.lastName,
          fatherName: item.fatherName
        })}
      >
        <View style={styles.cardInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{index + 1}</Text>
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.studentName}>{displayName}</Text>
            <Text style={styles.studentPhone}>{item.studentPhone}</Text>
            <Text style={styles.statusText}>
              وضعیت: {item.status === 'ACTIVE' ? 'فعال' : item.status}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => handleRemoveStudent(item.studentPhone)}
          disabled={isRemoving === item.studentPhone}
        >
          {isRemoving === item.studentPhone ? (
            <ActivityIndicator size="small" color={COLORS.error} />
          ) : (
            <Trash2 size={20} color={COLORS.error} />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderExamItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('ExamDashboardScreen', { examId: item.id })}
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronRight size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{currentClassName}</Text>
          <Text style={styles.headerSubtitle}>{memberships.length} دانش‌آموز</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton} onPress={() => setSettingsModalVisible(true)}>
          <Settings size={24} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'STUDENTS' && styles.activeTab]}
          onPress={() => setActiveTab('STUDENTS')}
        >
          <Users size={20} color={activeTab === 'STUDENTS' ? COLORS.primary : COLORS.textLight} />
          <Text style={[styles.tabText, activeTab === 'STUDENTS' && styles.activeTabText]}>دانش‌آموزان</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'EXAMS' && styles.activeTab]}
          onPress={() => setActiveTab('EXAMS')}
        >
          <BookOpen size={20} color={activeTab === 'EXAMS' ? COLORS.primary : COLORS.textLight} />
          <Text style={[styles.tabText, activeTab === 'EXAMS' && styles.activeTabText]}>آزمون‌ها</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'REPORTS' && styles.activeTab]}
          onPress={() => setActiveTab('REPORTS')}
        >
          <BarChart2 size={20} color={activeTab === 'REPORTS' ? COLORS.primary : COLORS.textLight} />
          <Text style={[styles.tabText, activeTab === 'REPORTS' && styles.activeTabText]}>گزارشات</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : activeTab === 'STUDENTS' ? (
          <>
            <TouchableOpacity style={styles.addBtnContainer} onPress={() => setAddModalVisible(true)}>
              <UserPlus size={20} color={COLORS.surface} />
              <Text style={styles.addBtnText}>افزودن دانش‌آموز جدید</Text>
            </TouchableOpacity>
            {memberships.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>هیچ دانش‌آموزی در این کلاس وجود ندارد.</Text>
              </View>
            ) : (
              <FlatList
                data={memberships}
                keyExtractor={(item) => item._id}
                renderItem={renderStudentItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
              />
            )}
          </>
        ) : activeTab === 'EXAMS' ? (
          <View style={{ flex: 1 }}>
            {classExams.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>هیچ آزمونی برای این کلاس تعریف نشده است.</Text>
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

      {/* Add Student Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>افزودن دانش‌آموز جدید</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Text style={{ fontSize: 18, color: COLORS.textLight }}>✖</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>نام <Text style={{ color: COLORS.error }}>*</Text></Text>
              <TextInput style={styles.input} value={newFirstName} onChangeText={setNewFirstName} placeholder="مثال: علی" />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>نام خانوادگی <Text style={{ color: COLORS.error }}>*</Text></Text>
              <TextInput style={styles.input} value={newLastName} onChangeText={setNewLastName} placeholder="مثال: احمدی" />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>نام پدر</Text>
              <TextInput style={styles.input} value={newFatherName} onChangeText={setNewFatherName} placeholder="مثال: رضا (اختیاری)" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>شماره موبایل (اختیاری)</Text>
              <TextInput style={styles.input} value={newPhone} onChangeText={setNewPhone} placeholder="مثال: 09123456789" keyboardType="numeric" maxLength={11} />
              <Text style={styles.inputHint}>وارد کردن شماره موبایل به بهبود خودکارسازی کارها و اتصال نتایج کمک می‌کند.</Text>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleAddStudent} disabled={isAdding}>
              {isAdding ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>ثبت دانش‌آموز</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={settingsModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تنظیمات کلاس</Text>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                <Text style={{ fontSize: 18, color: COLORS.textLight }}>✖</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>نام کلاس</Text>
                <TextInput style={styles.input} value={editClassName} onChangeText={setEditClassName} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>دوره تحصیلی</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipContainer}>
                  {MOCK_COURSES.map(course => (
                    <TouchableOpacity 
                      key={course._id} 
                      style={[styles.chip, editCourse === course._id && styles.chipSelected]} 
                      onPress={() => setEditCourse(course._id)}
                    >
                      <Text style={[styles.chipText, editCourse === course._id && styles.chipTextSelected]}>{course.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>پایه تحصیلی</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipContainer}>
                  {MOCK_GRADES.map(grade => (
                    <TouchableOpacity 
                      key={grade._id} 
                      style={[styles.chip, editGrade === grade._id && styles.chipSelected]} 
                      onPress={() => setEditGrade(grade._id)}
                    >
                      <Text style={[styles.chipText, editGrade === grade._id && styles.chipTextSelected]}>{grade.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>یادداشت کلاس</Text>
                <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={editNote} onChangeText={setEditNote} multiline placeholder="نکته‌ای درباره این کلاس بنویسید..." />
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleUpdateClass} disabled={isUpdating}>
                {isUpdating ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>ذخیره تغییرات</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 40, backgroundColor: COLORS.surface, elevation: 2 },
  backButton: { padding: 8 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  
  tabContainer: { flexDirection: 'row', backgroundColor: COLORS.surface, elevation: 1 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', flexDirection: 'row', justifyContent: 'center' },
  activeTab: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 14, color: COLORS.textLight, fontWeight: 'bold', marginLeft: 6 },
  activeTabText: { color: COLORS.primary },
  
  content: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 100 },
  
  addBtnContainer: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, margin: 16, marginBottom: 8, elevation: 2 },
  addBtnText: { color: COLORS.surface, fontSize: 15, fontWeight: 'bold', marginLeft: 8 },
  
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textLight },
  cardTextContainer: { flex: 1, marginRight: 10 },
  studentName: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 4, textAlign: 'right' },
  studentPhone: { fontSize: 13, color: COLORS.textLight, marginBottom: 4, textAlign: 'right' },
  statusText: { fontSize: 12, color: COLORS.textLight, textAlign: 'right' },
  iconButton: { padding: 8 },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.textLight, fontSize: 15 },
  
  // Reports
  reportCardsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  reportCard: { flex: 1, backgroundColor: COLORS.surface, padding: 16, borderRadius: 16, marginHorizontal: 4, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  reportCardTitle: { fontSize: 13, color: COLORS.textLight, marginBottom: 8 },
  reportCardValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12, textAlign: 'right' },
  statCard: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  statTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 8, textAlign: 'right' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: 13, color: COLORS.textLight },
  topStudentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  topStudentRank: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  topStudentRankText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 14 },
  topStudentName: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: 'bold', textAlign: 'right', paddingRight: 10 },
  topStudentScore: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, color: COLORS.text, marginBottom: 8, textAlign: 'right' },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 14, textAlign: 'right', color: COLORS.text },
  inputHint: { fontSize: 11, color: COLORS.textLight, marginTop: 6, textAlign: 'right' },
  submitBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: COLORS.surface, fontSize: 16, fontWeight: 'bold' },
  settingsButton: { padding: 8 },
  chipContainer: { flexDirection: 'row', paddingVertical: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8 },
  chipSelected: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.text },
  chipTextSelected: { color: COLORS.surface, fontWeight: 'bold' }
});

export default ClassDetailsScreen;