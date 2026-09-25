import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Vibration, I18nManager, ScrollView, Animated } from 'react-native';
import { Play, Pause, Square, Repeat, BellRing } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
};

const IntervalTimerScreen = () => {
  const { colors, isDark } = useTheme();
  
  const [workTime, setWorkTime] = useState('30');
  const [restTime, setRestTime] = useState('10');
  const [sets, setSets] = useState('5');
  
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'IDLE' | 'WORK' | 'REST'>('IDLE');
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const bgAnim = useRef(new Animated.Value(0)).current;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const triggerBeep = () => {
    Vibration.vibrate([0, 500, 200, 500]);
    Animated.sequence([
      Animated.timing(bgAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.timing(bgAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            triggerBeep();
            
            // Switch phases
            if (currentPhase === 'WORK') {
              if (currentSet >= parseInt(sets || '1', 10)) {
                // Finished all sets
                setIsRunning(false);
                setCurrentPhase('IDLE');
                return 0;
              } else {
                setCurrentPhase('REST');
                return parseInt(restTime || '0', 10);
              }
            } else {
              // From Rest to Work
              setCurrentSet(s => s + 1);
              setCurrentPhase('WORK');
              return parseInt(workTime || '0', 10);
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isRunning, currentPhase, currentSet, sets, restTime, workTime]);

  const handleStart = () => {
    if (currentPhase === 'IDLE') {
      setCurrentPhase('WORK');
      setCurrentSet(1);
      setTimeLeft(parseInt(workTime || '0', 10));
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setCurrentPhase('IDLE');
    setCurrentSet(1);
    setTimeLeft(0);
  };

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.background, currentPhase === 'WORK' ? '#ef4444' : '#10b981'] // Red flash for work, Green for rest (or arbitrary visual cue)
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>تنظیمات تایمر</Text>
          
          <View style={styles.inputRow}>
            <Text style={[styles.label, { color: colors.textLight }]}>زمان کار (ثانیه):</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              keyboardType="numeric"
              value={workTime}
              onChangeText={setWorkTime}
              editable={!isRunning && currentPhase === 'IDLE'}
            />
          </View>
          
          <View style={styles.inputRow}>
            <Text style={[styles.label, { color: colors.textLight }]}>زمان استراحت (ثانیه):</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              keyboardType="numeric"
              value={restTime}
              onChangeText={setRestTime}
              editable={!isRunning && currentPhase === 'IDLE'}
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={[styles.label, { color: colors.textLight }]}>تعداد ست‌ها:</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              keyboardType="numeric"
              value={sets}
              onChangeText={setSets}
              editable={!isRunning && currentPhase === 'IDLE'}
            />
          </View>
        </View>

        <View style={styles.displayContainer}>
          <Text style={[styles.phaseText, { 
            color: currentPhase === 'IDLE' ? colors.textLight : currentPhase === 'WORK' ? '#ef4444' : '#10b981' 
          }]}>
            {currentPhase === 'IDLE' ? 'آماده' : currentPhase === 'WORK' ? 'تمرین' : 'استراحت'}
          </Text>
          <Text style={[styles.timerText, { color: colors.text }]}>
            {formatTime(currentPhase === 'IDLE' ? parseInt(workTime || '0', 10) : timeLeft)}
          </Text>
          <Text style={[styles.setText, { color: colors.textLight }]}>
            ست {currentSet} از {sets || '1'}
          </Text>
        </View>

        <View style={styles.controls}>
          {!isRunning ? (
            <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={handleStart}>
              <Play color="#fff" size={24} />
              <Text style={styles.btnText}>شروع</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.btn, { backgroundColor: colors.warning || '#f59e0b' }]} onPress={handlePause}>
              <Pause color="#fff" size={24} />
              <Text style={styles.btnText}>توقف</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.btn, { backgroundColor: colors.surface }]} onPress={handleReset}>
            <Square color={colors.text} size={24} />
            <Text style={[styles.btnText, { color: colors.text }]}>بازنشانی</Text>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <BellRing color={colors.primary} size={20} />
          <Text style={[styles.infoText, { color: colors.textLight }]}>هنگام اتمام زمان کار و استراحت، گوشی شما می‌لرزد.</Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, flexGrow: 1 },
  settingsCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, fontFamily: 'IRANSansX', textAlign: 'center' },
  inputRow: { 
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse', 
    justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 
  },
  label: { fontSize: 14, fontFamily: 'IRANSansX' },
  input: { 
    width: 80, height: 40, borderWidth: 1, borderRadius: 8, textAlign: 'center', fontFamily: 'monospace', fontSize: 16
  },
  displayContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 32 },
  phaseText: { fontSize: 24, fontWeight: 'bold', fontFamily: 'IRANSansX', marginBottom: 8 },
  timerText: { fontSize: 80, fontWeight: 'bold', fontFamily: 'monospace', marginVertical: 8 },
  setText: { fontSize: 16, fontFamily: 'IRANSansX' },
  controls: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  btn: {
    flex: 1, marginHorizontal: 8, paddingVertical: 16, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginHorizontal: 8 },
  infoBox: { flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1 },
  infoText: { fontSize: 12, fontFamily: 'IRANSansX', marginHorizontal: 12, flex: 1, textAlign: I18nManager.isRTL ? 'right' : 'left' }
});

export default IntervalTimerScreen;
