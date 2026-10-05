import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { 
  ChevronRight, 
  User, 
  Phone, 
  FileText, 
  CheckCircle, 
  XCircle,
  Clock,
  Calendar,
  Save,
  Plus,
  StickyNote
} from 'lucide-react-native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_COLORS: any = {
  PRESENT: '#10b981',
  ABSENT_UNEXCUSED: '#ef4444',
  ABSENT_EXCUSED: '#f59e0b',
  LATE: '#3b82f6'
};

const STATUS_LABELS: any = {
  PRESENT: 'حاضر',
  ABSENT_UNEXCUSED: 'غایب (غیرموجه)',
  ABSENT_EXCUSED: 'غایب (موجه)',
  LATE: 'تاخیر'
};

const NOTE_COLORS = [
  { id: 'neutral', hex: '#64748b' },
  { id: 'good', hex: '#10b981' },
  { id: 'warning', hex: '#f59e0b' },
  { id: 'danger', hex: '#ef4444' },
  { id: 'info', hex: '#3b82f6' }
];

const StudentProfileViewScreen = ({ route, navigation }: any) => {
  const { studentPhone, classId, className, firstName, lastName, fatherName } = route.params;
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'general' | 'attendance' | 'exams' | 'notes'>('attendance');
  const [loading, setLoading] = useState(true);

  // Data states
  const [membership, setMembership] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);

  // Edit states for general tab
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    fatherName: '',
    parentPhone: ''
  });
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);

  // Note states
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteColor, setNewNoteColor] = useState('neutral');
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    fetchProfileData();
    fetchExams();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/teacher/classrooms/${classId}/students/${studentPhone}/profile`);
      if (res.data.success) {
        setMembership(res.data.data.membership);
        setAttendance(res.data.data.attendance || []);
        setNotes(res.data.data.notes || []);

        const m = res.data.data.membership;
        setEditForm({
          firstName: m?.firstName || firstName || '',
          lastName: m?.lastName || lastName || '',
          fatherName: m?.fatherName || fatherName || '',
          parentPhone: m?.parentPhone || ''
        });
      }
    } catch (error) {
      console.warn('Error fetching profile', error);
      Alert.alert('خطا', 'مشکلی در دریافت اطلاعات پیش آمد.');
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      const examsRes = await api.get(`/teacher/exams?classroomId=${classId}`);
      if (examsRes.data.success) {
        const classExams = examsRes.data.data || [];
        const results = [];
        for (const exam of classExams) {
           const dashRes = await api.get(`/teacher/exams/${exam._id || exam.id}/dashboard`);
           if (dashRes.data.success) {
              const participants = dashRes.data.data.participantsStatus || [];
              const p = participants.find((x: any) => x.identifier === studentPhone);
              if (p) {
                 results.push({
                   examId: exam._id || exam.id,
                   examName: exam.title,
                   date: exam.date,
                   status: p.status,
                   score: p.score,
                 });
              } else {
                 results.push({
                   examId: exam._id || exam.id,
                   examName: exam.title,
                   date: exam.date,
                   status: 'شروع نکرده',
                   score: null,
                 });
              }
           }
        }
        setExams(results);
      }
    } catch (error) {
      console.warn('Error fetching exams', error);
    }
  };

  const handleSaveGeneral = async () => {
    setIsSavingGeneral(true);
    try {
      const res = await api.put(`/teacher/classrooms/${classId}/students/${studentPhone}/profile`, editForm);
      if (res.data.success) {
        setMembership({ ...membership, ...editForm });
        Alert.alert('موفق', 'اطلاعات با موفقیت بروزرسانی شد.');
      }
    } catch (error) {
      Alert.alert('خطا', 'مشکلی در ذخیره اطلاعات رخ داد.');
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const handleSaveNote = async () => {
    if (!newNoteTitle.trim()) return;
    setIsSavingNote(true);
    try {
      const res = await api.post(`/teacher/classrooms/${classId}/students/${studentPhone}/notes`, {
        title: newNoteTitle,
        color: newNoteColor
      });
      if (res.data.success) {
        setNotes([res.data.data, ...notes]);
        setNoteModalVisible(false);
        setNewNoteTitle('');
        setNewNoteColor('neutral');
      }
    } catch (error) {
      Alert.alert('خطا', 'مشکلی در ثبت یادداشت رخ داد.');
    } finally {
      setIsSavingNote(false);
    }
  };

  const getAttendanceStats = () => {
    let present = 0, absentUnexcused = 0, absentExcused = 0, late = 0;
    attendance.forEach(a => {
      if (a.status === 'PRESENT') present++;
      if (a.status === 'ABSENT_UNEXCUSED') absentUnexcused++;
      if (a.status === 'ABSENT_EXCUSED') absentExcused++;
      if (a.status === 'LATE') late++;
    });
    return { present, absentUnexcused, absentExcused, late };
  };

  const stats = getAttendanceStats();

  const renderTabHeader = () => (
    <View style={styles.tabsContainer}>
      {[
        { id: 'attendance', label: 'حضور و غیاب' },
        { id: 'exams', label: 'آزمون‌ها' },
        { id: 'notes', label: 'یادداشت‌ها' },
        { id: 'general', label: 'اطلاعات عمومی' },
      ].map(tab => (
        <TouchableOpacity 
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && styles.activeTab]}
          onPress={() => setActiveTab(tab.id as any)}
        >
          <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>{tab.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronRight size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {editForm.firstName || editForm.lastName ? `${editForm.firstName} ${editForm.lastName}` : 'بدون نام'}
          </Text>
          <Text style={styles.headerSubtitle}>{studentPhone}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {renderTabHeader()}

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <View style={{ flex: 1 }}>
          {activeTab === 'attendance' && (
            <ScrollView contentContainerStyle={styles.tabContent}>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: STATUS_COLORS.PRESENT }]}>{stats.present}</Text>
                  <Text style={styles.statLabel}>حاضر</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: STATUS_COLORS.ABSENT_UNEXCUSED }]}>{stats.absentUnexcused}</Text>
                  <Text style={styles.statLabel}>غیبت غیرموجه</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: STATUS_COLORS.ABSENT_EXCUSED }]}>{stats.absentExcused}</Text>
                  <Text style={styles.statLabel}>موجه</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: STATUS_COLORS.LATE }]}>{stats.late}</Text>
                  <Text style={styles.statLabel}>تاخیر</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>تایم‌لاین جلسات</Text>
              {attendance.length === 0 ? (
                <Text style={styles.emptyText}>تاریخچه‌ای یافت نشد.</Text>
              ) : (
                attendance.map((att: any) => (
                  <View key={att._id} style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: STATUS_COLORS[att.status] || '#cbd5e1' }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineDate}>{att.sessionId?.date || 'بدون تاریخ'}</Text>
                      <Text style={styles.timelineSubject}>{att.sessionId?.subject || 'بدون درس'}</Text>
                      <Text style={[styles.timelineStatus, { color: STATUS_COLORS[att.status] }]}>
                        {STATUS_LABELS[att.status]}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          {activeTab === 'exams' && (
            <FlatList
              data={exams}
              keyExtractor={(item, idx) => item.examId || idx.toString()}
              contentContainerStyle={styles.tabContent}
              ListEmptyComponent={<Text style={styles.emptyText}>هیچ آزمونی یافت نشد.</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.card}
                  onPress={() => navigation.navigate('ExamDashboardScreen', { examId: item.examId })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.examName}</Text>
                    <Text style={styles.cardSubtitle}>تاریخ: {item.date}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.statusBadge, item.status === 'تمام کرده' ? styles.statusGood : styles.statusNeutral]}>
                      {item.status}
                    </Text>
                    {item.score !== null && <Text style={styles.scoreText}>نمره: {item.score}</Text>}
                  </View>
                </TouchableOpacity>
              )}
            />
          )}

          {activeTab === 'notes' && (
            <View style={{ flex: 1 }}>
              <FlatList
                data={notes}
                keyExtractor={(item) => item._id}
                contentContainerStyle={[styles.tabContent, { paddingBottom: 100 }]}
                ListEmptyComponent={<Text style={styles.emptyText}>هیچ یادداشتی برای این دانش‌آموز ثبت نشده است.</Text>}
                renderItem={({ item }) => {
                  const colorObj = NOTE_COLORS.find(c => c.id === item.color) || NOTE_COLORS[0];
                  return (
                    <View style={[styles.noteCard, { borderRightColor: colorObj.hex }]}>
                      <Text style={styles.noteTitle}>{item.title}</Text>
                      <Text style={styles.noteDate}>{item.date}</Text>
                    </View>
                  );
                }}
              />
              <TouchableOpacity style={styles.fab} onPress={() => setNoteModalVisible(true)}>
                <Plus size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'general' && (
            <ScrollView contentContainerStyle={styles.tabContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>نام</Text>
                <TextInput 
                  style={styles.input} 
                  value={editForm.firstName} 
                  onChangeText={(t) => setEditForm({...editForm, firstName: t})}
                  placeholder="نام دانش‌آموز"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>نام خانوادگی</Text>
                <TextInput 
                  style={styles.input} 
                  value={editForm.lastName} 
                  onChangeText={(t) => setEditForm({...editForm, lastName: t})}
                  placeholder="نام خانوادگی"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>نام پدر</Text>
                <TextInput 
                  style={styles.input} 
                  value={editForm.fatherName} 
                  onChangeText={(t) => setEditForm({...editForm, fatherName: t})}
                  placeholder="نام پدر"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>شماره موبایل ولی</Text>
                <TextInput 
                  style={styles.input} 
                  value={editForm.parentPhone} 
                  onChangeText={(t) => setEditForm({...editForm, parentPhone: t})}
                  placeholder="شماره موبایل پدر یا مادر"
                  keyboardType="phone-pad"
                />
              </View>

              <TouchableOpacity 
                style={styles.saveBtn} 
                onPress={handleSaveGeneral}
                disabled={isSavingGeneral}
              >
                {isSavingGeneral ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Save size={20} color="#fff" />
                    <Text style={styles.saveBtnText}>ذخیره تغییرات</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      )}

      {/* Note Modal */}
      <Modal visible={noteModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>یادداشت جدید</Text>
              <TouchableOpacity onPress={() => setNoteModalVisible(false)}>
                <XCircle size={24} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>متن یادداشت</Text>
            <TextInput 
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
              multiline
              value={newNoteTitle}
              onChangeText={setNewNoteTitle}
              placeholder="مثال: این دانش‌آموز مشکل خانوادگی دارد..."
            />

            <Text style={styles.label}>رنگ یادداشت</Text>
            <View style={styles.colorsRow}>
              {NOTE_COLORS.map(c => (
                <TouchableOpacity 
                  key={c.id} 
                  style={[
                    styles.colorCircle, 
                    { backgroundColor: c.hex, borderWidth: newNoteColor === c.id ? 3 : 0, borderColor: '#0f172a' }
                  ]}
                  onPress={() => setNewNoteColor(c.id)}
                />
              ))}
            </View>

            <TouchableOpacity 
              style={styles.saveBtn} 
              onPress={handleSaveNote}
              disabled={isSavingNote || !newNoteTitle.trim()}
            >
              {isSavingNote ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>ثبت یادداشت</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  backButton: { padding: 8 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'IRANSansX', fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 12, fontFamily: 'IRANSansX', color: COLORS.textLight, marginTop: 4 },

  tabsContainer: {
    flexDirection: 'row-reverse',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 8
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  activeTab: {
    borderBottomColor: COLORS.primary
  },
  tabText: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
    color: COLORS.textLight
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: 'bold'
  },

  tabContent: {
    padding: 16
  },
  
  // Attendance Stats
  statsRow: {
    flexDirection: 'row-reverse',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontFamily: 'IRANSansX', fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 11, fontFamily: 'IRANSansX', color: COLORS.textLight, textAlign: 'center' },

  // Timeline
  sectionTitle: { fontSize: 16, fontFamily: 'IRANSansX', fontWeight: 'bold', color: COLORS.text, marginBottom: 16, textAlign: 'right' },
  timelineItem: {
    flexDirection: 'row-reverse',
    marginBottom: 16,
    alignItems: 'center'
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 12,
    zIndex: 2
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  timelineDate: { fontSize: 13, fontFamily: 'IRANSansX', color: COLORS.textLight },
  timelineSubject: { fontSize: 14, fontFamily: 'IRANSansX', color: COLORS.text, fontWeight: '600' },
  timelineStatus: { fontSize: 13, fontFamily: 'IRANSansX', fontWeight: 'bold' },

  // Cards
  card: {
    flexDirection: 'row-reverse',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  cardTitle: { fontSize: 15, fontFamily: 'IRANSansX', fontWeight: 'bold', color: COLORS.text, marginBottom: 4, textAlign: 'right' },
  cardSubtitle: { fontSize: 13, fontFamily: 'IRANSansX', color: COLORS.textLight, textAlign: 'right' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, fontSize: 12, fontFamily: 'IRANSansX', overflow: 'hidden' },
  statusGood: { backgroundColor: '#dcfce7', color: '#166534' },
  statusNeutral: { backgroundColor: '#f1f5f9', color: '#475569' },
  scoreText: { marginTop: 6, fontSize: 14, fontFamily: 'IRANSansX', fontWeight: 'bold', color: COLORS.primary },

  // Notes
  noteCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderRightWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 }
  },
  noteTitle: { fontSize: 14, fontFamily: 'IRANSansX', color: COLORS.text, textAlign: 'right', lineHeight: 22 },
  noteDate: { fontSize: 11, fontFamily: 'IRANSansX', color: COLORS.textLight, textAlign: 'left', marginTop: 8 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },

  // General Form
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontFamily: 'IRANSansX', color: COLORS.textLight, marginBottom: 8, textAlign: 'right' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    fontFamily: 'IRANSansX',
    textAlign: 'right'
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontFamily: 'IRANSansX', fontWeight: 'bold', marginLeft: 8 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'IRANSansX', fontWeight: 'bold', color: COLORS.text },
  colorsRow: { flexDirection: 'row-reverse', justifyContent: 'flex-start', marginBottom: 24, gap: 12 },
  colorCircle: { width: 40, height: 40, borderRadius: 20 },

  emptyText: { textAlign: 'center', color: COLORS.textLight, fontFamily: 'IRANSansX', marginTop: 40, fontSize: 14 }
});

export default StudentProfileViewScreen;
