import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, I18nManager } from 'react-native';
import { RefreshCcw, Plus, Minus } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';

const RepCounterScreen = () => {
  const { colors } = useTheme();
  
  const [sets, setSets] = useState(1);
  const [reps, setReps] = useState(0);

  const handleRep = () => {
    setReps(r => r + 1);
  };

  const handleNextSet = () => {
    setSets(s => s + 1);
    setReps(0);
  };

  const handleReset = () => {
    setSets(1);
    setReps(0);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>شمارنده ست و تکرار</Text>
        <TouchableOpacity style={[styles.resetBtn, { backgroundColor: colors.surface }]} onPress={handleReset}>
          <RefreshCcw color={colors.text} size={20} />
          <Text style={[styles.resetText, { color: colors.text }]}>بازنشانی کل</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.setContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.setLabel, { color: colors.textLight }]}>ست فعلی</Text>
        <View style={styles.setControl}>
          <TouchableOpacity 
            style={[styles.smallBtn, { backgroundColor: colors.surface }]} 
            onPress={() => setSets(s => Math.max(1, s - 1))}
          >
            <Minus color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.setValue, { color: colors.primary }]}>{sets}</Text>
          <TouchableOpacity 
            style={[styles.smallBtn, { backgroundColor: colors.surface }]} 
            onPress={() => setSets(s => s + 1)}
          >
            <Plus color={colors.text} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.mainTapArea, { backgroundColor: colors.primary }]} 
        activeOpacity={0.7}
        onPress={handleRep}
      >
        <Text style={styles.repLabel}>تکرار (Rep)</Text>
        <Text style={styles.repValue}>{reps}</Text>
        <Text style={styles.tapToCount}>برای شمارش ضربه بزنید</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.nextSetBtn, { backgroundColor: colors.secondary }]} onPress={handleNextSet}>
        <Text style={styles.nextSetText}>پایان ست {sets} و شروع ست جدید</Text>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { 
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse', 
    justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 
  },
  title: { fontSize: 20, fontWeight: 'bold', fontFamily: 'IRANSansX' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8 },
  resetText: { fontSize: 12, fontFamily: 'IRANSansX', marginHorizontal: 4 },
  
  setContainer: { 
    padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginBottom: 24 
  },
  setLabel: { fontSize: 16, fontFamily: 'IRANSansX', marginBottom: 12 },
  setControl: { flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse', alignItems: 'center', justifyContent: 'center' },
  smallBtn: { padding: 12, borderRadius: 12, marginHorizontal: 24 },
  setValue: { fontSize: 40, fontWeight: 'bold', fontFamily: 'monospace' },
  
  mainTapArea: {
    flex: 1, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5
  },
  repLabel: { fontSize: 24, color: '#fff', opacity: 0.8, fontFamily: 'IRANSansX', marginBottom: 16 },
  repValue: { fontSize: 120, fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' },
  tapToCount: { fontSize: 16, color: '#fff', opacity: 0.6, fontFamily: 'IRANSansX', marginTop: 16 },
  
  nextSetBtn: { paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  nextSetText: { color: '#fff', fontSize: 16, fontWeight: 'bold', fontFamily: 'IRANSansX' }
});

export default RepCounterScreen;
