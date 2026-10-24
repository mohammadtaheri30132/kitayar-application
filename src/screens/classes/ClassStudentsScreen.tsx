import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  FlatList,
  Share
} from 'react-native';
import { showError, showWarning } from '../../components/feedback';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, UserPlus, Share2, BadgeCheck, Bell, Users } from 'lucide-react-native';
import { JoinRequestsModal } from '../../components/classes/JoinRequestsModal';

const ClassStudentsScreen = ({ route, navigation }: any) => {
  const { currentClassId, currentClassName, classroom } = route.params;
  const insets = useSafeAreaInsets();

  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinRequestsCount, setJoinRequestsCount] = useState(0);
  const [isJoinRequestsModalVisible, setIsJoinRequestsModalVisible] = useState(false);

  const handleShareInvite = async () => {
    try {
      let code = classroom?.code;
      if (!code) {
        const res = await api.get(`/teacher/classrooms/${currentClassId}`);
        code = res.data?.data?.code;
      }
      if (!code) {
        showWarning('شناسه کلاس هنوز تولید نشده است.');
        return;
      }
      const serverBaseUrl = (api.defaults.baseURL || 'http://192.168.1.128:5001/api').replace(/\/api\/?$/, '');
      const registrationUrl = `${serverBaseUrl}/c/${code}`;
      const message = `دانش‌آموز گرامی،\nبرای ثبت‌نام در کلاس «${currentClassName}»، لطفاً از طریق لینک زیر مشخصات خود را تکمیل نمایید:\n\n🔗 لینک ثبت‌نام:\n${registrationUrl}\n\n🔢 کد اختصاصی کلاس: ${code}\n\nپس از ثبت‌نام، می‌توانید اپلیکیشن «نوکیتا» را برای دریافت تکالیف و نمرات دانلود کنید.`;
      await Share.share({
        title: `ثبت‌نام در کلاس ${currentClassName}`,
        message,
        url: registrationUrl,
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const [listRes, requestsRes] = await Promise.all([
        api.get(`/teacher/classrooms/${currentClassId}/students/list`),
        api.get(`/teacher/classrooms/${currentClassId}/join-requests`).catch(() => ({ data: { success: false, data: [] } }))
      ]);
      if (listRes.data.success) {
        setMemberships(listRes.data.data);
      }
      if (requestsRes?.data?.success) {
        setJoinRequestsCount(requestsRes.data.data?.length || 0);
      }
    } catch (error) {
      console.warn(error);
      showError('مشکلی در دریافت اطلاعات دانش‌آموزان رخ داد.');
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
          fatherName: item.fatherName,
          isVerified: item.isVerified
        })}
      >
        <Text style={styles.studentIndex}>{index + 1}</Text>
        <View style={styles.cardTextContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.studentName}>{displayName}</Text>
            {item.isVerified ? (
              <BadgeCheck size={16} color="#0284c7" fill="#0284c7" style={{ marginRight: 6 }} />
            ) : null}
          </View>
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
            {joinRequestsCount > 0 ? (
              <TouchableOpacity
                style={styles.pendingBanner}
                onPress={() => setIsJoinRequestsModalVisible(true)}
                activeOpacity={0.85}
              >
                <View style={styles.pendingBannerLeft}>
                  <View style={styles.pendingBadgeIcon}>
                    <Bell size={16} color="#ffffff" />
                  </View>
                  <View style={{ marginRight: 10, flex: 1 }}>
                    <Text style={styles.pendingBannerTitle}>
                      {joinRequestsCount} درخواست جدید عضویت
                    </Text>
                    <Text style={styles.pendingBannerSub}>
                      دانش‌آموزان از طریق فرم وب ثبت‌نام کرده‌اند
                    </Text>
                  </View>
                </View>
                <View style={styles.reviewBtn}>
                  <Text style={styles.reviewBtnText}>بررسی</Text>
                </View>
              </TouchableOpacity>
            ) : null}

            <View style={styles.topActionsRow}>
              <TouchableOpacity 
                style={styles.addBtnContainer} 
                onPress={() => navigation.navigate('AddStudentToClassScreen', { currentClassId, currentClassName })}
                activeOpacity={0.8}
              >
                <UserPlus size={18} color={COLORS.primary} />
                <Text style={styles.addBtnText}>افزودن دستی</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.shareBtnContainer} 
                onPress={handleShareInvite}
                activeOpacity={0.8}
              >
                <Share2 size={18} color="#ffffff" />
                <Text style={styles.shareBtnText}>ارسال لینک ثبت‌نام</Text>
              </TouchableOpacity>
            </View>

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

      <JoinRequestsModal
        visible={isJoinRequestsModalVisible}
        onClose={() => setIsJoinRequestsModalVisible(false)}
        classroomId={currentClassId}
        classroomName={currentClassName}
        onRequestsUpdated={fetchStudents}
      />
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
  
  topActionsRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  addBtnContainer: { 
    flex: 1,
    backgroundColor: '#eff6ff', 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 12, 
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 6,
  },
  addBtnText: { color: COLORS.primary, fontSize: 13, fontFamily: 'IRANSansX', fontWeight: 'bold' },
  shareBtnContainer: {
    flex: 1.3,
    backgroundColor: COLORS.primary,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    gap: 6,
  },
  shareBtnText: { color: '#ffffff', fontSize: 13, fontFamily: 'IRANSansX', fontWeight: 'bold' },
  
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

  pendingBanner: {
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pendingBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pendingBadgeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  pendingBannerTitle: {
    fontSize: 13.5,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
    color: '#1e3a8a',
    textAlign: 'left',
  },
  pendingBannerSub: {
    fontSize: 11.5,
    fontFamily: 'IRANSansX',
    color: '#3b82f6',
    marginTop: 2,
    textAlign: 'left',
  },
  reviewBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reviewBtnText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default ClassStudentsScreen;
