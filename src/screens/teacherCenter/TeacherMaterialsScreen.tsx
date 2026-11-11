import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/axiosConfig';
import { showSuccess, showError } from '../../components/feedback';
import {
  ChevronRight,
  BookOpen,
  Plus,
  Trash2,
  FileText,
  DollarSign,
  TrendingUp,
  Download,
} from 'lucide-react-native';

export const TeacherMaterialsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);

  const fetchMaterials = async () => {
    try {
      const response = await api.get('/teacher/center/materials');
      if (response.data?.success) {
        setMaterials(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching materials:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMaterials();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMaterials();
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await api.delete(`/teacher/center/materials/${id}`);
      if (res.data?.success) {
        showSuccess('محتوا با موفقیت حذف شد');
        fetchMaterials();
      }
    } catch (err: any) {
      showError('خطا در حذف محتوا');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronRight size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>جزوات و منابع آموزشی من</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('UploadMaterialScreen')}
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
          {materials.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <BookOpen size={44} color={colors.textLight} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>هنوز جزوه‌ای منتشر نکرده‌اید</Text>
              <Text style={[styles.emptySub, { color: colors.textLight }]}>
                شما می‌توانید جزوات تالیفی، نمونه سوالات و فایل‌های درسی خود را برای استفاده و خرید دانش‌آموزان منتشر کنید.
              </Text>
              <TouchableOpacity
                style={[styles.createFirstBtn, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('UploadMaterialScreen')}
                activeOpacity={0.85}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.createFirstBtnText}>انتشار اولین جزوه</Text>
              </TouchableOpacity>
            </View>
          ) : (
            materials.map((m) => (
              <View
                key={m._id}
                style={[styles.materialCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.materialRight}>
                  <View style={[styles.iconBox, { backgroundColor: '#F59E0B18' }]}>
                    <FileText size={24} color="#D97706" />
                  </View>
                  <View style={styles.materialInfo}>
                    <Text style={[styles.materialTitle, { color: colors.text }]}>{m.title}</Text>
                    <Text style={[styles.materialDesc, { color: colors.textLight }]} numberOfLines={2}>
                      {m.description || 'بدون شرح'}
                    </Text>

                    <View style={styles.badgesRow}>
                      <View style={[styles.badgeItem, { backgroundColor: m.price > 0 ? '#10B98115' : '#64748B15' }]}>
                        <Text style={[styles.badgeText, { color: m.price > 0 ? '#059669' : colors.textLight }]}>
                          {m.price > 0 ? `${Number(m.price).toLocaleString()} تومان` : 'رایگان'}
                        </Text>
                      </View>

                      <View style={[styles.badgeItem, { backgroundColor: colors.background }]}>
                        <Text style={[styles.badgeText, { color: colors.textLight }]}>
                          {m.pageCount || 0} صفحه
                        </Text>
                      </View>

                      <View style={[styles.badgeItem, { backgroundColor: '#3B82F615' }]}>
                        <Text style={[styles.badgeText, { color: '#2563EB' }]}>
                          فروش: {m.salesCount || 0} عدد
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(m._id)}
                  activeOpacity={0.7}
                >
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}
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
  contentContainer: { padding: 16, gap: 12 },
  emptyCard: {
    padding: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  emptyTitle: { fontSize: 15, fontFamily: 'Estedad-FD-Bold', textAlign: 'center' },
  emptySub: { fontSize: 12, fontFamily: 'Estedad-FD-Regular', textAlign: 'center', lineHeight: 20 },
  createFirstBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 8,
  },
  createFirstBtnText: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Estedad-FD-Bold' },
  materialCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  materialRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  materialInfo: { flex: 1 },
  materialTitle: { fontSize: 13, fontFamily: 'Estedad-FD-Bold', textAlign: 'right' },
  materialDesc: { fontSize: 11, fontFamily: 'Estedad-FD-Regular', textAlign: 'right', marginTop: 2 },
  badgesRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  badgeItem: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontFamily: 'Estedad-FD-Medium' },
  deleteBtn: {
    padding: 8,
    marginLeft: 4,
  },
});

export default TeacherMaterialsScreen;
