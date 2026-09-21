import React, { useState, useCallback } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';

const ExamDashboardScreen = ({ route, navigation }: any) => {
  const { examId, examTitle } = route.params;

  const [participants, setParticipants] = useState<any[]>([]);
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'participants' | 'questions'>('participants');

  // استیت‌های مربوط به مودال افزودن دانش‌آموز
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const dashResponse = await api.get(`/teacher/exams/${examId}/dashboard`);
      if (dashResponse.data.success) setParticipants(dashResponse.data.data.participantsStatus || []);
      
      const examResponse = await api.get(`/teacher/exams/${examId}`);
      if (examResponse.data.success) setExamQuestions(examResponse.data.data.questions || []);
    } catch (error) {
      Alert.alert('خطا', 'مشکلی در دریافت اطلاعات رخ داد.');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDashboardData(); }, []));

  // تابع افزودن دستی دانش‌آموز به آزمون
  const handleAddCustomStudent = async () => {
    if (!newPhoneNumber || newPhoneNumber.length !== 11) {
      Alert.alert('توجه', 'شماره موبایل باید ۱۱ رقمی باشد');
      return;
    }
    setIsAddingStudent(true);
    try {
      // فراخوانی روت جدیدی که در بک‌اند ساختیم
      const response = await api.post(`/teacher/exams/${examId}/participants`, {
        phoneNumbers: [newPhoneNumber]
      });
      if (response.data.success) {
        Alert.alert('موفقیت', 'دانش‌آموز به لیست مجاز اضافه شد');
        setIsAddModalVisible(false);
        setNewPhoneNumber('');
        fetchDashboardData(); // رفرش کردن لیست
      }
    } catch (error) {
      Alert.alert('خطا', 'مشکلی در افزودن دانش‌آموز رخ داد');
    } finally {
      setIsAddingStudent(false);
    }
  };

  const getStatusDisplay = (status: string, gradingStatus: string) => {
    if (status === 'تمام کرده') {
      if (gradingStatus === 'graded') return { text: 'تصحیح شده', bg: '#dcfce7', color: '#166534' };
      return { text: 'در انتظار تصحیح', bg: '#eff6ff', color: '#1e40af' };
    }
    if (status === 'در حال آزمون') return { text: 'در حال آزمون', bg: '#fef3c7', color: '#92400e' };
    return { text: 'شروع نکرده', bg: '#f1f5f9', color: '#475569' }; // افراد مجاز که هنوز وارد نشده‌اند
  };

  const renderStudentItem = ({ item, index }: { item: any, index: number }) => {
    const statusDisplay = getStatusDisplay(item.status, item.gradingStatus);
    const isClickable = item.status === 'تمام کرده';

    return (
      <TouchableOpacity 
        style={[styles.card, !isClickable && styles.cardDisabled]}
        activeOpacity={isClickable ? 0.7 : 1}
        onPress={() => {
          if (isClickable) {
            navigation.navigate('GradeStudentScreen', { examId, sessionId: item.sessionId, studentIdentifier: item.identifier });
          }
        }}
      >
        <View style={styles.cardLeft}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{index + 1}</Text></View>
          <View>
            <Text style={styles.studentPhone}>{item.identifier}</Text>
            {item.gradingStatus === 'graded' && <Text style={styles.scoreText}>نمره: {item.score}</Text>}
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: statusDisplay.bg }]}>
          <Text style={[styles.badgeText, { color: statusDisplay.color }]}>{statusDisplay.text}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>🔙 بازگشت</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>داشبورد آزمون</Text>
          <Text style={styles.headerSubtitle}>{examTitle}</Text>
        </View>
        {/* دکمه تنظیمات در هدر */}
        <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('ExamSettingsScreen', { examId })}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'participants' && styles.activeTab]} onPress={() => setActiveTab('participants')}>
          <Text style={[styles.tabText, activeTab === 'participants' && styles.activeTabText]}>👥 لیست مجاز ({participants.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'questions' && styles.activeTab]} onPress={() => setActiveTab('questions')}>
          <Text style={[styles.tabText, activeTab === 'questions' && styles.activeTabText]}>📝 سوالات</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : activeTab === 'participants' ? (
        <View style={{ flex: 1 }}>
          <FlatList
            data={participants}
            keyExtractor={(item) => item.identifier}
            renderItem={renderStudentItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
          {/* دکمه افزودن دانش‌آموز چسبیده به پایین صفحه */}
          <TouchableOpacity style={styles.addParticipantBtn} onPress={() => setIsAddModalVisible(true)}>
            <Text style={styles.addParticipantText}>➕ افزودن دانش‌آموز جدید</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={examQuestions}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.questionCard}>
              <Text style={styles.questionNumber}>سوال {index + 1}</Text>
              <Text style={styles.questionText}>{item.question}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* مودال افزودن دستی دانش‌آموز */}
      <Modal visible={isAddModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>افزودن به لیست مجاز</Text>
            <Text style={styles.modalDesc}>شماره موبایل دانش‌آموز را برای صدور مجوز ورود به این آزمون وارد کنید.</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="0912..."
              keyboardType="numeric"
              maxLength={11}
              value={newPhoneNumber}
              onChangeText={setNewPhoneNumber}
              textAlign="center"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsAddModalVisible(false)}>
                <Text style={styles.modalCancelText}>انصراف</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalAddBtn} onPress={handleAddCustomStudent} disabled={isAddingStudent}>
                {isAddingStudent ? <ActivityIndicator color={COLORS.surface} /> : <Text style={styles.modalAddText}>افزودن</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

// ... استایل‌های قبلی را نگه دارید و این موارد را به آن اضافه کنید:
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40, backgroundColor: COLORS.surface, elevation: 2 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.primary, marginTop: 2 },
  backButton: { padding: 8, width: 60 },
  backButtonText: { color: COLORS.textLight, fontSize: 14 },
  settingsButton: { padding: 8, width: 60, alignItems: 'flex-start' },
  settingsIcon: { fontSize: 24 },
  
  tabsContainer: { flexDirection: 'row-reverse', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 15, color: COLORS.textLight, fontWeight: 'bold' },
  activeTabText: { color: COLORS.primary },
  
  listContainer: { padding: 20, paddingBottom: 100 },
  card: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardDisabled: { backgroundColor: '#fafafa' },
  cardLeft: { flexDirection: 'row-reverse', alignItems: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  avatarText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 },
  studentPhone: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  scoreText: { fontSize: 13, color: '#166534', fontWeight: 'bold', marginTop: 4, textAlign: 'right' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  addParticipantBtn: { backgroundColor: COLORS.primary, margin: 20, padding: 16, borderRadius: 12, alignItems: 'center', position: 'absolute', bottom: 10, left: 0, right: 0, elevation: 5 },
  addParticipantText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 16 },

  questionCard: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  questionNumber: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8, textAlign: 'right' },
  questionText: { fontSize: 15, color: COLORS.text, textAlign: 'right' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 24, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 8, textAlign: 'right' },
  modalDesc: { fontSize: 14, color: COLORS.textLight, marginBottom: 20, textAlign: 'right', lineHeight: 22 },
  modalInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, fontSize: 18, letterSpacing: 2, backgroundColor: '#f8fafc', marginBottom: 24 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  modalCancelBtn: { flex: 1, padding: 14, alignItems: 'center', marginRight: 10 },
  modalCancelText: { color: COLORS.textLight, fontWeight: 'bold', fontSize: 16 },
  modalAddBtn: { flex: 1, backgroundColor: COLORS.primary, padding: 14, borderRadius: 10, alignItems: 'center' },
  modalAddText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 16 },
});

export default ExamDashboardScreen;