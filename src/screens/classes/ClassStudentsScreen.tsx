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
import { ChevronRight, UserPlus } from 'lucide-react-native';

const ClassStudentsScreen = ({ route, navigation }: any) => {
  const { currentClassId, currentClassName } = route.params;
  const insets = useSafeAreaInsets();

  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const renderStudentItem = ({ item, index }: { item: any, index: number }) => {
    const displayName = item.firstName 
      ? `${item.firstName} ${item.lastName}` 
      : (item.studentId?.user?.fullName || 'بدون نام');
      
    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.6}
        onPress={() => navigation.navigate('StudentProfileViewScreen', {
          studentPhone: item.studentPhone,
          classId: currentClassId,
          className: currentClassName,
          firstName: item.firstName,
          lastName: item.lastName,
          fatherName: item.fatherName
        })}
      >
        <Text style={styles.studentIndex}>{index + 1}</Text>
        <View style={styles.cardTextContainer}>
          <Text style={styles.studentName}>{displayName}</Text>
          <Text style={styles.studentPhone}>{item.studentPhone}</Text>
        </View>
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
              <UserPlus size={20} color={COLORS.primary} />
              <Text style={styles.addBtnText}>افزودن دانش‌آموز جدید</Text>
            </TouchableOpacity>

            {memberships.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>هیچ دانش‌آموزی در این کلاس وجود ندارد.</Text>
              </View>
            ) : (
              <View style={styles.listWrapper}>
                <FlatList
                  data={memberships}
                  keyExtractor={(item) => item._id}
                  renderItem={renderStudentItem}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                />
              </View>
            )}
          </>
        )}
      </View>
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
  
  content: { flex: 1 },
  listWrapper: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flex: 1,
    marginBottom: 16
  },
  listContent: { paddingVertical: 8 },
  
  addBtnContainer: { 
    backgroundColor: '#E8F0FE', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 14, 
    borderRadius: 12, 
    margin: 16, 
    marginBottom: 16, 
  },
  addBtnText: { color: COLORS.primary, fontSize: 14, fontFamily: 'IRANSansX', fontWeight: 'bold', marginLeft: 8 },
  
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 14, 
    paddingHorizontal: 16,
    borderBottomWidth: 1, 
    borderBottomColor: '#F7F7F7' 
  },
  studentIndex: {
    fontSize: 14,
    fontFamily: 'IRANSansX',
    color: '#CBD5E1',
    fontWeight: 'bold',
    width: 30,
    textAlign: 'center'
  },
  cardTextContainer: { flex: 1, marginRight: 10, alignItems: 'flex-start' },
  studentName: { fontSize: 15, fontFamily: 'IRANSansX', fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  studentPhone: { fontSize: 13, fontFamily: 'IRANSansX', color: COLORS.textLight },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.textLight, fontSize: 14, fontFamily: 'IRANSansX' },
});

export default ClassStudentsScreen;
