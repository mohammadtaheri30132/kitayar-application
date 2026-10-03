import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  FlatList,
  Alert,
  TextInput
} from 'react-native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Save } from 'lucide-react-native';

const TakeAttendanceScreen = ({ route, navigation }: any) => {
  const { sessionId, currentClassId, sessionDate, subject } = route.params;
  const insets = useSafeAreaInsets();

  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, [sessionId]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/teacher/classrooms/${currentClassId}/sessions/${sessionId}/attendance`);
      if (response.data.success) {
        setAttendance(response.data.data || []);
      }
    } catch (error) {
      console.warn(error);
      Alert.alert('خطا', 'مشکلی در دریافت لیست دانش‌آموزان رخ داد.');
    } finally {
      setLoading(false);
    }
  };

  const updateStudentStatus = (phone: string, status: string) => {
    setAttendance(prev => prev.map(a => {
      if (a.studentPhone === phone) {
        return { ...a, status, reason: status === 'ABSENT_EXCUSED' ? a.reason : '' };
      }
      return a;
    }));
  };

  const updateStudentReason = (phone: string, reason: string) => {
    setAttendance(prev => prev.map(a => a.studentPhone === phone ? { ...a, reason } : a));
  };

  const saveAttendance = async () => {
    setIsSaving(true);
    try {
      const response = await api.post(`/teacher/classrooms/${currentClassId}/sessions/${sessionId}/attendance`, {
        attendanceData: attendance
      });
      if (response.data.success) {
        Alert.alert('موفق', 'حضور و غیاب با موفقیت ثبت شد', [
          { text: 'باشه', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.warn(error);
      Alert.alert('خطا', 'مشکلی در ذخیره حضور غیاب رخ داد.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderStudentItem = ({ item }: { item: any }) => {
    const isPresent = item.status === 'PRESENT';
    const isAbsentUnexcused = item.status === 'ABSENT_UNEXCUSED';
    const isAbsentExcused = item.status === 'ABSENT_EXCUSED';
    const isLate = item.status === 'LATE';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.studentName}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.studentPhone}>{item.studentPhone}</Text>
        </View>

        <View style={styles.optionsRow}>
          <TouchableOpacity 
            style={[styles.optionBtn, isPresent && styles.optionBtnSelected, isPresent && { borderColor: '#16a34a' }]}
            onPress={() => updateStudentStatus(item.studentPhone, 'PRESENT')}
          >
            <Text style={[styles.optionText, isPresent && { color: '#16a34a', fontWeight: 'bold' }]}>حضور</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.optionBtn, isAbsentUnexcused && styles.optionBtnSelected, isAbsentUnexcused && { borderColor: '#dc2626' }]}
            onPress={() => updateStudentStatus(item.studentPhone, 'ABSENT_UNEXCUSED')}
          >
            <Text style={[styles.optionText, isAbsentUnexcused && { color: '#dc2626', fontWeight: 'bold' }]}>غیبت غیر موجه</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.optionBtn, isAbsentExcused && styles.optionBtnSelected, isAbsentExcused && { borderColor: '#ca8a04' }]}
            onPress={() => updateStudentStatus(item.studentPhone, 'ABSENT_EXCUSED')}
          >
            <Text style={[styles.optionText, isAbsentExcused && { color: '#ca8a04', fontWeight: 'bold' }]}>غیبت موجه</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.optionBtn, isLate && styles.optionBtnSelected, isLate && { borderColor: '#0284c7' }]}
            onPress={() => updateStudentStatus(item.studentPhone, 'LATE')}
          >
            <Text style={[styles.optionText, isLate && { color: '#0284c7', fontWeight: 'bold' }]}>تاخیر</Text>
          </TouchableOpacity>
        </View>

        {isAbsentExcused && (
          <TextInput
            style={styles.reasonInput}
            placeholder="دلیل غیبت موجه را بنویسید..."
            value={item.reason}
            onChangeText={(text) => updateStudentReason(item.studentPhone, text)}
            textAlign="right"
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronRight size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>ثبت حضور و غیاب</Text>
          <Text style={styles.headerSubtitle}>{subject} - {sessionDate}</Text>
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={saveAttendance} disabled={isSaving || loading}>
          {isSaving ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Save size={24} color={COLORS.primary} />}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : attendance.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>هیچ دانش‌آموزی در این کلاس ثبت نشده است.</Text>
          </View>
        ) : (
          <FlatList
            data={attendance}
            keyExtractor={(item) => item.studentPhone}
            renderItem={renderStudentItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {!loading && attendance.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.submitBtn} onPress={saveAttendance} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>ثبت نهایی همگی</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: COLORS.surface, elevation: 2 },
  backButton: { padding: 8 },
  saveButton: { padding: 8 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  
  content: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 100 },

  card: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  studentName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  studentPhone: { fontSize: 12, color: COLORS.textLight },
  
  optionsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  optionBtn: { flex: 1, paddingVertical: 8, marginHorizontal: 2, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: '#f8fafc' },
  optionBtnSelected: { backgroundColor: '#fff', borderWidth: 2 },
  optionText: { fontSize: 10, color: COLORS.textLight, textAlign: 'center' },

  reasonInput: { marginTop: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10, fontSize: 13, textAlign: 'left', color: COLORS.text },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.textLight, fontSize: 15 },
  
  footer: { padding: 16, backgroundColor: COLORS.surface, borderTopWidth: 1, borderColor: COLORS.border },
  submitBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: COLORS.surface, fontSize: 16, fontWeight: 'bold' },
});

export default TakeAttendanceScreen;
