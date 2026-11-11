import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/axiosConfig';
import { showSuccess, showError } from '../../components/feedback';
import {
  ChevronRight,
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
} from 'lucide-react-native';

export const TeacherDailyAttendanceScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [records, setRecords] = useState<any[]>([]);

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [status, setStatus] = useState<'present' | 'absent' | 'leave' | 'remote'>('present');
  const [plannedHours, setPlannedHours] = useState('4');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAttendance = async () => {
    try {
      const response = await api.get('/teacher/center/attendance');
      if (response.data?.success) {
        setRecords(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching attendance records:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAttendance();
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await api.post('/teacher/center/attendance', {
        status,
        plannedHours: Number(plannedHours) || 4,
        notes,
      });
      if (response.data?.success) {
        showSuccess('وضعیت حضور ثبت شد');
        setModalVisible(false);
        fetchAttendance();
      }
    } catch (err: any) {
      showError('خطا در ثبت حضور');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'present':
        return { label: 'حاضر', color: '#10B981', bg: '#10B98115' };
      case 'leave':
        return { label: 'مرخصی', color: '#F59E0B', bg: '#F59E0B15' };
      case 'remote':
        return { label: 'آموزش مجازی', color: '#3B82F6', bg: '#3B82F615' };
      default:
        return { label: 'غایب', color: '#EF4444', bg: '#EF444415' };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ChevronRight size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>کارنامه حضور و غیاب معلم</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Plus size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
          }
        >
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>گزارش ماهانه حضور</Text>
            <Text style={[styles.summarySub, { color: colors.textLight }]}>
              سوابق ثبت شده در ۳۰ روز اخیر برای ارائه به مدیریت
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: '#10B981' }]}>
                  {records.filter((r) => r.status === 'present').length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textLight }]}>روزهای حضور</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: '#F59E0B' }]}>
                  {records.filter((r) => r.status === 'leave').length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textLight }]}>مرخصی</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: '#3B82F6' }]}>
                  {records.filter((r) => r.status === 'remote').length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textLight }]}>مجازی</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>سوابق روزانه</Text>

          {records.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <CalendarCheck size={40} color={colors.textLight} />
              <Text style={[styles.emptyText, { color: colors.textLight }]}>
                هنوز هیچ سابقه‌ای برای حضور و غیاب ثبت نشده است.
              </Text>
            </View>
          ) : (
            records.map((r) => {
              const badge = getStatusBadge(r.status);
              return (
                <View
                  key={r._id || r.date}
                  style={[styles.recordItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.recordRight}>
                    <Text style={[styles.recordDate, { color: colors.text }]}>{r.date}</Text>
                    <View style={styles.recordSubRow}>
                      <Clock size={14} color={colors.textLight} />
                      <Text style={[styles.recordHours, { color: colors.textLight }]}>
                        ساعت موظف: {r.plannedHours || 4} ساعت
                      </Text>
                    </View>
                    {r.notes ? (
                      <Text style={[styles.recordNotes, { color: colors.textLight }]}>
                        یادداشت: {r.notes}
                      </Text>
                    ) : null}
                  </View>

                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>ثبت حضور و غیاب امروز</Text>

            <View style={styles.statusSelectRow}>
              {(['present', 'leave', 'remote', 'absent'] as const).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.statusBtn,
                    status === st && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                  ]}
                  onPress={() => setStatus(st)}
                >
                  <Text
                    style={[
                      styles.statusBtnText,
                      { color: status === st ? colors.primary : colors.text },
                    ]}
                  >
                    {st === 'present' ? 'حاضر' : st === 'leave' ? 'مرخصی' : st === 'remote' ? 'مجازی' : 'غایب'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { color: colors.text }]}>ساعت کاری:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={plannedHours}
              onChangeText={setPlannedHours}
              keyboardType="numeric"
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>یادداشت:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, height: 60 }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="توضیحات اختیاری..."
              placeholderTextColor={colors.textLight}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: colors.textLight, fontFamily: 'Estedad-FD-Medium' }}>انصراف</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontFamily: 'Estedad-FD-Bold' }}>ثبت</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontFamily: 'Estedad-FD-Bold' },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  contentContainer: { padding: 16, gap: 14 },
  summaryCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
  summaryTitle: { fontSize: 14, fontFamily: 'Estedad-FD-Bold', textAlign: 'right' },
  summarySub: { fontSize: 11, fontFamily: 'Estedad-FD-Regular', textAlign: 'right', marginTop: 2, marginBottom: 14 },
  statsRow: { flexDirection: 'row-reverse', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 20, fontFamily: 'Estedad-FD-Black' },
  statLabel: { fontSize: 11, fontFamily: 'Estedad-FD-Regular', marginTop: 2 },
  sectionTitle: { fontSize: 14, fontFamily: 'Estedad-FD-Bold', textAlign: 'right', marginTop: 8 },
  emptyCard: { padding: 30, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 12, fontFamily: 'Estedad-FD-Regular', textAlign: 'center' },
  recordItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  recordRight: { flex: 1 },
  recordDate: { fontSize: 13, fontFamily: 'Estedad-FD-Bold', textAlign: 'right' },
  recordSubRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 4 },
  recordHours: { fontSize: 11, fontFamily: 'Estedad-FD-Regular' },
  recordNotes: { fontSize: 11, fontFamily: 'Estedad-FD-Regular', marginTop: 4, textAlign: 'right' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontFamily: 'Estedad-FD-Bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: { width: '100%', borderRadius: 18, padding: 18 },
  modalTitle: { fontSize: 15, fontFamily: 'Estedad-FD-Bold', textAlign: 'right', marginBottom: 12 },
  statusSelectRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 14 },
  statusBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  statusBtnText: { fontSize: 12, fontFamily: 'Estedad-FD-Medium' },
  inputLabel: { fontSize: 12, fontFamily: 'Estedad-FD-Medium', textAlign: 'right', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: 'Estedad-FD-Regular',
    fontSize: 13,
    textAlign: 'right',
    marginBottom: 10,
  },
  modalBtns: { flexDirection: 'row-reverse', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  submitBtn: { flex: 2, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
});

export default TeacherDailyAttendanceScreen;
