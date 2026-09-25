import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { ChevronLeft, RotateCcw } from 'lucide-react-native';
import { CalendarSelector } from '../../../components/date/CalendarSelector';
import { DateInput } from '../../../components/date/DateInput';
import { DateResultCard } from '../../../components/date/DateResultCard';
import { CalendarType, NormalizedDate } from '../../../utils/date/types';
import { isValidDate } from '../../../utils/date/dateValidation';
import { getExactDaysBetween } from '../../../utils/date/dateArithmetic';

const DaysBetweenScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  
  const [calendar, setCalendar] = useState<CalendarType>('jalali');
  const [startDate, setStartDate] = useState<NormalizedDate>({ year: 0, month: 0, day: 0, calendar: 'jalali' });
  const [endDate, setEndDate] = useState<NormalizedDate>({ year: 0, month: 0, day: 0, calendar: 'jalali' });
  const [error, setError] = useState('');
  const [result, setResult] = useState<number | null>(null);

  const handleCalendarChange = (type: CalendarType) => {
    setCalendar(type);
    setStartDate((prev) => ({ ...prev, calendar: type }));
    setEndDate((prev) => ({ ...prev, calendar: type }));
    setError('');
    setResult(null);
  };

  const handleCalculate = () => {
    setError('');
    setResult(null);

    if (!startDate.year || !startDate.month || !startDate.day) {
      setError('لطفاً تاریخ شروع را کامل وارد کنید.');
      return;
    }

    if (!endDate.year || !endDate.month || !endDate.day) {
      setError('لطفاً تاریخ پایان را کامل وارد کنید.');
      return;
    }

    if (!isValidDate(startDate)) {
      setError('تاریخ شروع نامعتبر است.');
      return;
    }

    if (!isValidDate(endDate)) {
      setError('تاریخ پایان نامعتبر است.');
      return;
    }

    try {
      const days = getExactDaysBetween(startDate, endDate);
      setResult(Math.abs(days));
    } catch (e) {
      setError('خطایی در محاسبه رخ داد.');
    }
  };

  const handleReset = () => {
    setStartDate({ year: 0, month: 0, day: 0, calendar });
    setEndDate({ year: 0, month: 0, day: 0, calendar });
    setError('');
    setResult(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color={colors.textLight} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>فاصله روز بین دو تاریخ</Text>
        <TouchableOpacity onPress={handleReset} style={styles.backButton}>
          <RotateCcw color={colors.textLight} size={20} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <CalendarSelector selected={calendar} onChange={handleCalendarChange} />
            
            <View style={{ marginTop: 8 }} />
            <DateInput 
              value={startDate} 
              onChange={setStartDate} 
              label="تاریخ شروع"
            />
            
            <View style={{ marginTop: 8 }} />
            <DateInput 
              value={endDate} 
              onChange={setEndDate} 
              label="تاریخ پایان"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity 
              style={[styles.calcButton, { backgroundColor: colors.primary }]}
              onPress={handleCalculate}
            >
              <Text style={styles.calcButtonText}>محاسبه تعداد روز</Text>
            </TouchableOpacity>
          </View>

          {result !== null && (
            <DateResultCard
              title="تعداد روزهای فاصله"
              value={`${result.toLocaleString('fa-IR')} روز`}
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
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  }
});

export default DaysBetweenScreen;
