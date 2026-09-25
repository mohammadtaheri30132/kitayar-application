import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Plus, FolderOpen, Image as ImageIcon, Mic } from 'lucide-react-native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';

const TeacherQuestionBankScreen = ({ navigation }: any) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const res = await api.get('/teacher/questions');
      if (res.data.success) {
        setQuestions(res.data.data);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const renderQuestion = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.qType}>{item.type}</Text>
        <Text style={styles.qDate}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('fa-IR') : ''}
        </Text>
      </View>

      <Text style={styles.qText}>{item.question.replace(/<[^>]*>?/gm, '')}</Text>

      <View style={styles.mediaRow}>
        {item.has_image && (
          <View style={styles.badge}>
            <ImageIcon size={14} color={COLORS.primary} />
            <Text style={styles.badgeText}>تصویر دارد</Text>
          </View>
        )}
        {item.has_audio && (
          <View style={styles.badge}>
            <Mic size={14} color={COLORS.primary} />
            <Text style={styles.badgeText}>صوت دارد</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronRight color={COLORS.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>بانک سوالات من</Text>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => navigation.navigate('CreateTeacherQuestionScreen')}
        >
          <Plus color={COLORS.primary} size={24} />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : questions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FolderOpen size={48} color={COLORS.textLight} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyText}>هنوز هیچ سوالی ثبت نکرده‌اید.</Text>
          <TouchableOpacity 
            style={styles.createBtn}
            onPress={() => navigation.navigate('CreateTeacherQuestionScreen')}
          >
            <Text style={styles.createBtnText}>ایجاد اولین سوال</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={questions}
          renderItem={renderQuestion}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          onRefresh={fetchQuestions}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  addBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'IRANSansX', color: COLORS.text },
  listContent: { padding: 16 },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  qType: { fontSize: 11, backgroundColor: '#eff6ff', color: COLORS.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontWeight: 'bold', fontFamily: 'IRANSansX' },
  qDate: { fontSize: 12, color: COLORS.textLight, fontFamily: 'IRANSansX' },
  qText: { fontSize: 15, color: COLORS.text, textAlign: 'right', lineHeight: 26, fontFamily: 'IRANSansX' },
  mediaRow: { flexDirection: 'row-reverse', gap: 8, marginTop: 12 },
  badge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, color: COLORS.primary, fontFamily: 'IRANSansX' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', fontFamily: 'IRANSansX', fontSize: 15, color: COLORS.textLight, marginBottom: 20 },
  createBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  createBtnText: { color: COLORS.surface, fontFamily: 'IRANSansX', fontWeight: 'bold', fontSize: 15 },
});

export default TeacherQuestionBankScreen;
