import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, ArrowUpCircle, ArrowDownCircle, RefreshCcw, Trash2, Eye, EyeOff, Plus } from 'lucide-react-native';

const ManageQuestionsScreen = ({ route, navigation }: any) => {
  const { bookId } = route.params;
  const [questions, setQuestions] = useState<any[]>(route.params.questions || []);
  const [showAnswerFor, setShowAnswerFor] = useState<number | null>(null);

  // 👈 دریافت لیست کامل آپدیت شده از صفحه تعویض سوال
  useEffect(() => {
    if (route.params?.updatedQuestions) {
      setQuestions(route.params.updatedQuestions);
      navigation.setParams({ updatedQuestions: undefined }); // ریست کردن پارامتر
    }
  }, [route.params?.updatedQuestions]);

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions];
    if (direction === 'up' && index > 0) {
      [newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]];
    } else if (direction === 'down' && index < newQuestions.length - 1) {
      [newQuestions[index + 1], newQuestions[index]] = [newQuestions[index], newQuestions[index + 1]];
    }
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    Alert.alert('حذف سوال', 'آیا از حذف این سوال اطمینان دارید؟', [
      { text: 'انصراف', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => {
          const newQuestions = questions.filter((_, i) => i !== index);
          setQuestions(newQuestions);
      }}
    ]);
  };

  const handleSwap = (index: number) => {
    // 👈 ارسال کل آرایه به صفحه بعدی تا سوالات گم نشوند
    navigation.navigate('SwapQuestionScreen', { mode: 'swap', swapIndex: index, bookId, currentQuestions: questions });
  };

  const handleAdd = () => {
    navigation.navigate('SwapQuestionScreen', { mode: 'add', bookId, currentQuestions: questions });
  };

  const handleSaveAndReturn = () => {
    navigation.navigate({
      name: 'PreviewExamScreen',
      params: { updatedQuestions: questions },
      merge: true,
    });
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const isShowingAnswer = showAnswerFor === index;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.qType}>{item.type}</Text>
          <Text style={styles.qNumber}>سوال {index + 1}</Text>
        </View>

        <Text style={styles.qText}>{item.question.replace(/<[^>]*>?/gm, '')}</Text>

        {isShowingAnswer && (
          <View style={styles.answerBox}>
            <Text style={styles.answerLabel}>جواب:</Text>
            <Text style={styles.answerText}>{item.answer ? item.answer.replace(/<[^>]*>?/gm, '') : 'ندارد'}</Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          <View style={styles.moveActions}>
            <TouchableOpacity onPress={() => moveQuestion(index, 'up')} disabled={index === 0} style={{ opacity: index === 0 ? 0.3 : 1 }}>
              <ArrowUpCircle size={24} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => moveQuestion(index, 'down')} disabled={index === questions.length - 1} style={{ opacity: index === questions.length - 1 ? 0.3 : 1 }}>
              <ArrowDownCircle size={24} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          <View style={styles.mainActions}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f1f5f9' }]} onPress={() => setShowAnswerFor(isShowingAnswer ? null : index)}>
              {isShowingAnswer ? <EyeOff size={16} color="#475569" /> : <Eye size={16} color="#475569" />}
              <Text style={[styles.actionBtnText, { color: '#475569' }]}>جواب</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fef2f2' }]} onPress={() => removeQuestion(index)}>
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fffbeb', borderColor: '#f59e0b', borderWidth: 1 }]} onPress={() => handleSwap(index)}>
              <RefreshCcw size={16} color="#f59e0b" />
              <Text style={[styles.actionBtnText, { color: '#f59e0b' }]}>تعویض</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSaveAndReturn} style={styles.backBtn}>
          <X size={24} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.title}>مدیریت سوالات ({questions.length})</Text>
        <TouchableOpacity onPress={handleAdd} style={styles.addBtn}>
          <Plus size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={questions}
        keyExtractor={(item, index) => item._id + index}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAndReturn}>
          <Text style={styles.saveBtnText}>تایید و مشاهده در برگه</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  backBtn: { padding: 4 },
  addBtn: { backgroundColor: '#10b981', padding: 6, borderRadius: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  qType: { fontSize: 11, backgroundColor: '#eff6ff', color: '#3b82f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontWeight: 'bold' },
  qNumber: { fontSize: 13, color: '#64748b', fontWeight: 'bold' },
  qText: { fontSize: 15, color: '#1e293b', textAlign: 'right', lineHeight: 26, marginBottom: 16 },
  answerBox: { backgroundColor: '#f0fdf4', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#d1fae5' },
  answerLabel: { fontSize: 12, fontWeight: 'bold', color: '#059669', marginBottom: 4, textAlign: 'right' },
  answerText: { fontSize: 14, color: '#065f46', textAlign: 'right', lineHeight: 22 },
  actionsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderColor: '#f1f5f9' },
  moveActions: { flexDirection: 'row', gap: 12 },
  mainActions: { flexDirection: 'row-reverse', gap: 8 },
  actionBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { fontSize: 12, fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderColor: '#e2e8f0' },
  saveBtn: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default ManageQuestionsScreen;