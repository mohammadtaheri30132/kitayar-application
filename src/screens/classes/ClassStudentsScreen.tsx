import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  FlatList
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, UserPlus, Trash2 } from 'lucide-react-native';

const ClassStudentsScreen = ({ route, navigation }: any) => {
  const { currentClassId, currentClassName } = route.params;
  const insets = useSafeAreaInsets();

  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/teacher/classrooms/${currentClassId}/students/list`);
      if (response.data.success) {
        setMemberships(response.data.data);
      }
    } catch (error) {
      console.warn(error);
      Alert.alert('خطا', 'مشکلی در دریافت اطلاعات دانش‌آموزان رخ داد.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStudents();
    }, [currentClassId])
  );

  const handleRemoveStudent = (phone: string) => {
    Alert.alert(
      'حذف دانش‌آموز',
      `آیا از حذف این دانش‌آموز مطمئن هستید؟`,
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
                fetchStudents();
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

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronRight size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>لیست دانش‌آموزان</Text>
          <Text style={styles.headerSubtitle}>{currentClassName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            <TouchableOpacity 
              style={styles.addBtnContainer} 
              onPress={() => navigation.navigate('AddStudentToClassScreen', { currentClassId, currentClassName })}
              activeOpacity={0.8}
            >
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
        )}
      </View>
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
  
  content: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 100 },
  
  addBtnContainer: { 
    backgroundColor: COLORS.primary, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 14, 
    borderRadius: 12, 
    margin: 16, 
    marginBottom: 8, 
    elevation: 2 
  },
  addBtnText: { color: COLORS.surface, fontSize: 15, fontWeight: 'bold', marginLeft: 8 },
  
  card: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: COLORS.surface, 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  cardInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#f1f5f9', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: 12 
  },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textLight },
  cardTextContainer: { flex: 1, marginRight: 10 },
  studentName: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 4, textAlign: 'left' },
  studentPhone: { fontSize: 13, color: COLORS.textLight, marginBottom: 4, textAlign: 'left' },
  statusText: { fontSize: 12, color: COLORS.textLight, textAlign: 'left' },
  iconButton: { padding: 8 },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.textLight, fontSize: 15 },
});

export default ClassStudentsScreen;
