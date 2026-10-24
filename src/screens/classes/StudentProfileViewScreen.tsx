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
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { showError, showSuccess } from '../../components/feedback';
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
  StickyNote,
  BadgeCheck,
  CheckSquare,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react-native';
import { api } from '../../api/axiosConfig';
import { PlanningService } from '../../api/planningService';
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

  const [activeTab, setActiveTab] = useState<'general' | 'attendance' | 'exams' | 'notes' | 'homework'>('attendance');
  const [loading, setLoading] = useState(true);

  // Data states
  const [membership, setMembership] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [studentHomeworks, setStudentHomeworks] = useState<any[]>([]);

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
      const [res, hwRes] = await Promise.all([
        api.get(`/teacher/classrooms/${classId}/students/${studentPhone}/profile`),
        PlanningService.getHomeworks({ classId, studentPhone }).catch(() => ({ success: false, data: [] }))
      ]);
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
      if (hwRes?.success && hwRes.data) {
        setStudentHomeworks(hwRes.data);
      }
    } catch (error) {
      console.warn('Error fetching profile', error);
      showError('مشکلی در دریافت اطلاعات پیش آمد.');
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
        showSuccess('اطلاعات با موفقیت بروزرسانی شد.');
      }
    } catch (error) {
      showError('مشکلی در ذخیره اطلاعات رخ داد.');
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
      showError('مشکلی در ثبت یادداشت رخ داد.');
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

  const handleUpdateStudentHwStatus = async (hwId: string, newStatus: 'DONE' | 'NOT_DONE' | 'PENDING') => {
    try {
      await PlanningService.updateStudentHomeworkStatus(hwId, studentPhone, newStatus);
      setStudentHomeworks(prev => prev.map(hw => {
        if (hw._id !== hwId) return hw;
        const subIndex = (hw.studentSubmissions || []).findIndex((s: any) => s.studentPhone === studentPhone);
        let newSubs = [...(hw.studentSubmissions || [])];
        if (subIndex >= 0) {
          newSubs[subIndex] = { ...newSubs[subIndex], status: newStatus };
        } else {
          newSubs.push({ studentPhone, status: newStatus });
        }
        return { ...hw, studentSubmissions: newSubs };
      }));
    } catch (e) {
      showError('ثبت وضعیت با خطا مواجه شد');
    }
  };

  const renderTabHeader = () => (
    <View style={styles.tabsContainer}>
      {[
        { id: 'attendance', label: 'حضور و غیاب' },
        { id: 'homework', label: 'تکالیف' },
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
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={styles.headerTitle}>
              {editForm.firstName || editForm.lastName ? `${editForm.firstName} ${editForm.lastName}` : 'بدون نام'}
            </Text>
            {(membership?.isVerified || route.params?.isVerified) ? (
              <BadgeCheck size={18} color="#0284c7" fill="#0284c7" style={{ marginRight: 6 }} />
            ) : null}
          </View>
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

          {activeTab === 'homework' && (
            <ScrollView contentContainerStyle={styles.tabContent}>
              {studentHomeworks.length === 0 ? (
                <Text style={styles.emptyText}>تکلیفی برای این دانش‌آموز ثبت نشده است.</Text>
              ) : (
                studentHomeworks.map((hw) => {
                  const sub = hw.studentSubmissions?.find((s: any) => s.studentPhone === studentPhone);
                  const currentSt = sub?.status || 'PENDING';
                  const stLabel = currentSt === 'DONE' ? 'انجام شده است' : currentSt === 'NOT_DONE' ? 'انجام نشده' : 'در انتظار بررسی';
                  const stColor = currentSt === 'DONE' ? '#166534' : currentSt === 'NOT_DONE' ? '#991b1b' : '#92400e';
                  const stBg = currentSt === 'DONE' ? '#dcfce7' : currentSt === 'NOT_DONE' ? '#fee2e2' : '#fef3c7';

                  return (
                    <View key={hw._id} style={styles.card}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={styles.cardTitle}>{hw.title}</Text>
                          <View style={{ backgroundColor: stBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                            <Text style={{ fontSize: 11, color: stColor, fontFamily: 'IRANSansX', fontWeight: 'bold' }}>
                              {stLabel}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.cardSubtitle}>
                          درس: {hw.subject} • موعد: {hw.dueDateJalali || hw.dueDate}
                        </Text>

                        {/* Items preview */}
                        {hw.items && hw.items.length > 0 && (
                          <View style={{ backgroundColor: '#f8fafc', padding: 8, borderRadius: 8, marginTop: 8 }}>
                            {hw.items.slice(0, 3).map((it: any, i: number) => (
                              <Text key={i} style={{ fontSize: 11.5, fontFamily: 'IRANSansX', color: '#475569', marginBottom: 2, textAlign: 'right' }}>
                                • {it.title}
                              </Text>
                            ))}
                          </View>
                        )}

                        {/* Quick Status Buttons */}
                        <View style={{ flexDirection: 'row-reverse', gap: 6, marginTop: 10 }}>
                          <TouchableOpacity
                            style={[
                              styles.hwQuickBtn,
                              currentSt === 'DONE' && { backgroundColor: '#16a34a', borderColor: '#16a34a' }
                            ]}
                            onPress={() => handleUpdateStudentHwStatus(hw._id, 'DONE')}
                          >
                            <Text style={[styles.hwQuickBtnText, { color: currentSt === 'DONE' ? '#fff' : '#166534' }]}>
                              انجام شده
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.hwQuickBtn,
                              currentSt === 'NOT_DONE' && { backgroundColor: '#dc2626', borderColor: '#dc2626' }
                            ]}
                            onPress={() => handleUpdateStudentHwStatus(hw._id, 'NOT_DONE')}
                          >
                            <Text style={[styles.hwQuickBtnText, { color: currentSt === 'NOT_DONE' ? '#fff' : '#991b1b' }]}>
                              انجام نشده
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.hwQuickBtn,
                              currentSt === 'PENDING' && { backgroundColor: '#d97706', borderColor: '#d97706' }
                            ]}
                            onPress={() => handleUpdateStudentHwStatus(hw._id, 'PENDING')}
                          >
                            <Text style={[styles.hwQuickBtnText, { color: currentSt === 'PENDING' ? '#fff' : '#92400e' }]}>
                              در انتظار
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })
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
              {(membership?.isVerified || route.params?.isVerified) ? (
                <View style={styles.verifiedStatusCard}>
                  <BadgeCheck size={22} color="#0284c7" fill="#0284c7" style={{ marginLeft: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.verifiedStatusTitle}>عضویت معتبر (دارای نشان تیک آبی)</Text>
                    <Text style={styles.verifiedStatusDesc}>
                      مشخصات این دانش‌آموز از طریق فرم ثبت‌نام اینترنتی احراز هویت شده و تایید معلم را داراست.
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.manualStatusCard}>
                  <User size={20} color="#64748b" style={{ marginLeft: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.manualStatusTitle}>ثبت دستی توسط معلم (فاقد تیک آبی)</Text>
                    <Text style={styles.manualStatusDesc}>
                      این پرونده به صورت دستی ایجاد شده و هنوز احراز هویت پیامکی نشده است.
                    </Text>
                  </View>
                </View>
              )}

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

  // Status Cards
  verifiedStatusCard: {
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  verifiedStatusTitle: {
    fontSize: 13.5,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
    color: '#0369a1',
    textAlign: 'left',
  },
  verifiedStatusDesc: {
    fontSize: 11.5,
    fontFamily: 'IRANSansX',
    color: '#0284c7',
    marginTop: 2,
    lineHeight: 18,
    textAlign: 'left',
  },
  manualStatusCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  manualStatusTitle: {
    fontSize: 13.5,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
    color: '#475569',
    textAlign: 'left',
  },
  manualStatusDesc: {
    fontSize: 11.5,
    fontFamily: 'IRANSansX',
    color: '#64748b',
    marginTop: 2,
    lineHeight: 18,
    textAlign: 'left',
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

  hwQuickBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  hwQuickBtnText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
  },
  emptyText: { textAlign: 'center', color: COLORS.textLight, fontFamily: 'IRANSansX', marginTop: 40, fontSize: 14 }
});

export default StudentProfileViewScreen;
