import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, I18nManager } from 'react-native';
import { Play, Pause, Square, Flag, Users } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';

interface RecordItem {
  id: string;
  time: number;
  studentName: string;
}

const formatTime = (timeInMs: number) => {
  const ms = Math.floor((timeInMs % 1000) / 10);
  const s = Math.floor((timeInMs / 1000) % 60);
  const m = Math.floor((timeInMs / (1000 * 60)) % 60);
  
  const pad = (n: number) => (n < 10 ? '0' + n : n);
  return `${pad(m)}:${pad(s)}.${pad(ms)}`;
};

const StopwatchScreen = () => {
  const { colors, isDark } = useTheme();
  
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [studentName, setStudentName] = useState('');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prev => prev + 10);
      }, 10);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setRecords([]);
  };

  const handleRecord = () => {
    const name = studentName.trim() || `دانش‌آموز ${records.length + 1}`;
    setRecords(prev => [{ id: Date.now().toString(), time, studentName: name }, ...prev]);
    setStudentName('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.timerContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.timerText, { color: colors.text }]}>{formatTime(time)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: isRunning ? colors.error : colors.primary }]} 
          onPress={handleStartStop}
        >
          {isRunning ? <Pause color="#fff" size={24} /> : <Play color="#fff" size={24} />}
          <Text style={styles.btnText}>{isRunning ? 'توقف' : 'شروع'}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: colors.surface }]} 
          onPress={handleReset}
        >
          <Square color={colors.text} size={24} />
          <Text style={[styles.btnText, { color: colors.text }]}>بازنشانی</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.recordInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Users color={colors.textLight} size={20} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="نام دانش‌آموز برای ثبت رکورد (اختیاری)"
          placeholderTextColor={colors.textLight}
          value={studentName}
          onChangeText={setStudentName}
        />
        <TouchableOpacity 
          style={[styles.recordBtn, { backgroundColor: colors.secondary }]} 
          onPress={handleRecord}
          disabled={time === 0}
        >
          <Flag color="#fff" size={16} />
          <Text style={styles.recordBtnText}>ثبت</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.recordsList}>
        {records.map((r, index) => (
          <View key={r.id} style={[styles.recordItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.recordLeft}>
              <Text style={[styles.recordIndex, { color: colors.textLight }]}>#{records.length - index}</Text>
              <Text style={[styles.recordName, { color: colors.text }]}>{r.studentName}</Text>
            </View>
            <Text style={[styles.recordTime, { color: colors.primary }]}>{formatTime(r.time)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  timerContainer: {
    padding: 30, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 3
  },
  timerText: { fontSize: 64, fontWeight: '700', fontFamily: 'monospace' },
  controls: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  btn: {
    flex: 1, marginHorizontal: 8, paddingVertical: 16, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginHorizontal: 8 },
  recordInputContainer: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, marginBottom: 16
  },
  input: { flex: 1, paddingHorizontal: 12, fontFamily: 'IRANSansX', textAlign: I18nManager.isRTL ? 'right' : 'left' },
  recordBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8
  },
  recordBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginHorizontal: 4 },
  recordsList: { flex: 1 },
  recordItem: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8
  },
  recordLeft: { flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse', alignItems: 'center' },
  recordIndex: { fontSize: 14, marginHorizontal: 8, fontFamily: 'monospace' },
  recordName: { fontSize: 16, fontWeight: '500', fontFamily: 'IRANSansX' },
  recordTime: { fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace' },
});

export default StopwatchScreen;
