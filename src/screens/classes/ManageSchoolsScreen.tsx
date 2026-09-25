import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from './../../context/ThemeContext';
import { ChevronRight, Plus, MapPin } from 'lucide-react-native';
import { PlanningService } from './../../api/planningService';

const ManageSchoolsScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const res = await PlanningService.getSchools();
      if (res.success) setSchools(res.data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const renderSchool = ({ item }: { item: any }) => (
    <View style={[styles.schoolCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.schoolName, { color: colors.text }]}>{item.name}</Text>
      {item.address && (
        <View style={styles.detailRow}>
          <MapPin color={colors.textLight} size={14} />
          <Text style={[styles.detailText, { color: colors.textLight }]}>{item.address}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronRight color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>مدارس من</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Plus color={colors.primary} size={24} />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : schools.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textLight }]}>هیچ مدرسه‌ای ثبت نشده است.</Text>
      ) : (
        <FlatList
          data={schools}
          renderItem={renderSchool}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
        />
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
  addBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'IRANSansX' },
  listContent: { padding: 16 },
  schoolCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  schoolName: { fontSize: 16, fontWeight: 'bold', fontFamily: 'IRANSansX', marginBottom: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: 13, fontFamily: 'IRANSansX', marginLeft: 4 },
  emptyText: { textAlign: 'center', marginTop: 40, fontFamily: 'IRANSansX', fontSize: 14 },
});

export default ManageSchoolsScreen;
