import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { ChevronLeft, RotateCcw } from 'lucide-react-native';
import { CalendarSelector } from '../../../components/date/CalendarSelector';
import { DateInput } from '../../../components/date/DateInput';
import { DateResultCard } from '../../../components/date/DateResultCard';
import { CalendarType, NormalizedDate, DateDifference } from '../../../utils/date/types';
import { getToday } from '../../../utils/date/dateConverter';
import { isValidDate } from '../../../utils/date/dateValidation';
import { getCalendarDifference } from '../../../utils/date/dateArithmetic';

const AgeCalculatorScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  
  const [calendar, setCalendar] = useState<CalendarType>('jalali');
  const [birthDate, setBirthDate] = useState<NormalizedDate>({ year: 0, month: 0, day: 0, calendar: 'jalali' });
  const [error, setError] = useState('');
  const [result, setResult] = useState<DateDifference | null>(null);

  const handleCalendarChange = (type: CalendarType) => {
    setCalendar(type);
    setBirthDate((prev) => ({ ...prev, calendar: type }));
    setError('');
    setResult(null);
  };

  const handleCalculate = () => {
    setError('');
    setResult(null);

    if (!birthDate.year || !birthDate.month || !birthDate.day) {
      setError('لطفاً تاریخ را به صورت کامل وارد کنید.');
      return;
    }

    if (!isValidDate(birthDate)) {
      setError('تاریخ تولد وارد شده نامعتبر است.');
      return;
    }

    const today = getToday(calendar);
    
    // Check if birthdate is in the future
    if (
      birthDate.year > today.year ||
      (birthDate.year === today.year && birthDate.month > today.month) ||
      (birthDate.year === today.year && birthDate.month === today.month && birthDate.day > today.day)
    ) {
      setError('تاریخ تولد نمی‌تواند در آینده باشد.');
      return;
    }

    try {
      const diff = getCalendarDifference(birthDate, today);
      setResult(diff);
    } catch (e) {
      setError('خطایی در محاسبه رخ داد.');
    }
  };

  const handleReset = () => {
    setBirthDate({ year: 0, month: 0, day: 0, calendar });
    setError('');
    setResult(null);
  };

  const setToday = () => {
    const today = getToday(calendar);
    setBirthDate(today);
    setError('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color={colors.textLight} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>محاسبه سن</Text>
        <TouchableOpacity onPress={handleReset} style={styles.backButton}>
          <RotateCcw color={colors.textLight} size={20} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <CalendarSelector selected={calendar} onChange={handleCalendarChange} />
            
            <View style={styles.inputHeader}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>تاریخ تولد</Text>
              <TouchableOpacity onPress={setToday}>
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: 'bold' }}>امروز</Text>
              </TouchableOpacity>
            </View>
            
            <DateInput 
              value={birthDate} 
              onChange={setBirthDate} 
              error={error} 
              label=""
            />

            <TouchableOpacity 
              style={[styles.calcButton, { backgroundColor: colors.primary }]}
              onPress={handleCalculate}
            >
              <Text style={styles.calcButtonText}>محاسبه سن</Text>
            </TouchableOpacity>
          </View>

          {result && (
            <DateResultCard
              title="سن شما"
              value={`${result.years} سال و ${result.months} ماه و ${result.days} روز`}
              secondaryValue={`شما تا امروز ${result.totalDays.toLocaleString('fa-IR')} روز زندگی کرده‌اید.`}
            />
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  backButton: { padding: 8 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  inputHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  calcButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  calcButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AgeCalculatorScreen;
