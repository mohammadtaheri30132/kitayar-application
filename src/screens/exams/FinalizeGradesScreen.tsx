import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Modal 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';

const FinalizeGradesScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { examId, examTitle } = route.params;

  const [matched, setMatched] = useState<any[]>([]);
  const [unmatched, setUnmatched] = useState<any[]>([]);
  const [classMembers, setClassMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [actions, setActions] = useState<Record<string, { action: string, targetPhone?: string }>>({});
  
  const [activeModalId, setActiveModalId] = useState<string | null>(null);

  const fetchPreview = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/teacher/exams/${examId}/finalize-preview`);
      if (response.data.success) {
        setMatched(response.data.data.matched);
        setUnmatched(response.data.data.unmatched);
        setClassMembers(response.data.data.classMembers);
        
        // Default action for unmatched is 'NEW'
        const initialActions: Record<string, { action: string }> = {};
        response.data.data.unmatched.forEach((u: any) => {
          initialActions[u._id] = { action: 'NEW' };
        });
        setActions(initialActions);
      }
    } catch (error) {
      Alert.alert('خطا', 'مشکلی در دریافت اطلاعات پیش‌نمایش رخ داد.');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchPreview(); }, []));

  const handleFinalize = async () => {
    setIsFinalizing(true);
    try {
      const actionPayload = Object.keys(actions).map(sessionId => ({
        sessionId,
        ...actions[sessionId]
      }));

      const response = await api.post(`/teacher/exams/${examId}/finalize`, { actions: actionPayload });
      if (response.data.success) {
        Alert.alert('موفقیت', 'نمرات با موفقیت ثبت و وضعیت دانش‌آموزان به‌روز شد.', [
          { text: 'متوجه شدم', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('خطا', 'مشکلی در ثبت نهایی رخ داد.');
    } finally {
      setIsFinalizing(false);
    }
  };

  if (isLoading) {
    return <View style={styles.centerBox}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>🔙 بازگشت</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>ثبت نهایی نمرات در دفتر کلاسی</Text>
          <Text style={styles.headerSubtitle}>{examTitle}</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.sectionTitle}>✅ دانش‌آموزان هماهنگ شده ({matched.length})</Text>
        <Text style={styles.descText}>
          این دانش‌آموزان در کلاس شما وجود دارند و نمراتشان مستقیماً ثبت خواهد شد.
        </Text>
        {matched.length === 0 && <Text style={styles.emptyText}>موردی یافت نشد.</Text>}
        {matched.map(m => (
          <View key={m._id} style={styles.matchedCard}>
            <Text style={styles.nameText}>{m.firstNameSnapshot || ''} {m.lastNameSnapshot || 'کاربر بدون نام'}</Text>
            <Text style={styles.phoneText}>{m.participantIdentifier}</Text>
            <Text style={styles.scoreText}>نمره: {m.totalEarnedScore}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        <Text style={[styles.sectionTitle, { color: '#b91c1c' }]}>⚠️ دانش‌آموزان ناشناس ({unmatched.length})</Text>
        <Text style={styles.descText}>
          شماره موبایل این دانش‌آموزان در لیست کلاس شما نیست. لطفاً تعیین تکلیف کنید:
        </Text>
        {unmatched.length === 0 && <Text style={styles.emptyText}>موردی یافت نشد.</Text>}
        
        {unmatched.map(u => {
          const currentAction = actions[u._id];
          let actionDisplay = '➕ ثبت به عنوان دانش‌آموز جدید';
          if (currentAction?.action === 'LINK') {
            const targetStudent = classMembers.find(c => c.studentPhone === currentAction.targetPhone);
            actionDisplay = `🔗 اتصال به: ${targetStudent?.studentPhone}`;
          }

          return (
            <View key={u._id} style={styles.unmatchedCard}>
              <View style={styles.unmatchedHeader}>
                <Text style={styles.nameText}>{u.firstNameSnapshot || ''} {u.lastNameSnapshot || 'کاربر بدون نام'}</Text>
                <Text style={styles.phoneText}>{u.participantIdentifier}</Text>
                <Text style={styles.scoreText}>نمره: {u.totalEarnedScore}</Text>
              </View>
              <TouchableOpacity 
                style={styles.actionSelector}
                onPress={() => setActiveModalId(u._id)}
              >
                <Text style={styles.actionSelectorText}>{actionDisplay}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity 
          style={[styles.finalizeButton, isFinalizing && { opacity: 0.7 }]} 
          onPress={handleFinalize}
          disabled={isFinalizing}
        >
          {isFinalizing ? <ActivityIndicator color="#fff" /> : <Text style={styles.finalizeButtonText}>ثبت نهایی و ذخیره در دفتر کلاسی</Text>}
        </TouchableOpacity>
      </View>

      {/* Modal for selecting action */}
      <Modal visible={!!activeModalId} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>تعیین تکلیف دانش‌آموز ناشناس</Text>
            
            <TouchableOpacity 
              style={styles.modalOptionBtn}
              onPress={() => {
                setActions(prev => ({ ...prev, [activeModalId!]: { action: 'NEW' } }));
                setActiveModalId(null);
              }}
            >
              <Text style={styles.modalOptionText}>➕ ثبت به عنوان دانش‌آموز جدید در این کلاس</Text>
            </TouchableOpacity>
            
            <View style={styles.modalDivider} />
            <Text style={styles.modalSubtitle}>یا اتصال به یکی از دانش‌آموزان فعلی کلاس:</Text>
            
            <ScrollView style={{ maxHeight: 200 }}>
              {classMembers.length === 0 && <Text style={styles.emptyText}>هیچ دانش‌آموزی در کلاس ثبت نشده است.</Text>}
              {classMembers.map(member => (
                <TouchableOpacity 
                  key={member._id}
                  style={styles.memberSelectBtn}
                  onPress={() => {
                    setActions(prev => ({ ...prev, [activeModalId!]: { action: 'LINK', targetPhone: member.studentPhone } }));
                    setActiveModalId(null);
                  }}
                >
                  <Text style={styles.memberSelectText}>{member.studentPhone}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setActiveModalId(null)}>
              <Text style={styles.modalCancelText}>انصراف</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40, backgroundColor: COLORS.surface, elevation: 2 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  headerSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  backButton: { padding: 8 },
  backButtonText: { color: COLORS.textLight, fontSize: 14 },
  
  scrollContainer: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#166534', textAlign: 'right', marginBottom: 8 },
  descText: { fontSize: 13, color: COLORS.textLight, textAlign: 'right', marginBottom: 16 },
  emptyText: { textAlign: 'center', color: COLORS.textLight, marginVertical: 10 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 24 },
  
  matchedCard: { backgroundColor: '#dcfce7', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#bbf7d0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nameText: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  phoneText: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  scoreText: { fontSize: 14, fontWeight: 'bold', color: '#166534' },
  
  unmatchedCard: { backgroundColor: '#fee2e2', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#fecaca' },
  unmatchedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  actionSelector: { backgroundColor: '#fff', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#f87171' },
  actionSelectorText: { color: '#b91c1c', fontWeight: 'bold', fontSize: 13 },
  
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  finalizeButton: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  finalizeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 20, textAlign: 'right' },
  modalOptionBtn: { backgroundColor: '#eff6ff', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#bfdbfe' },
  modalOptionText: { color: '#1d4ed8', fontWeight: 'bold', fontSize: 14 },
  modalDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20 },
  modalSubtitle: { fontSize: 14, color: COLORS.text, textAlign: 'right', marginBottom: 12, fontWeight: 'bold' },
  memberSelectBtn: { padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, alignItems: 'center' },
  memberSelectText: { fontSize: 16, color: COLORS.text },
  modalCancelBtn: { marginTop: 20, padding: 16, alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12 },
  modalCancelText: { color: COLORS.text, fontWeight: 'bold', fontSize: 15 },
});

export default FinalizeGradesScreen;
