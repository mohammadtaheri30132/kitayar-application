import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { ChevronLeft, RotateCcw } from 'lucide-react-native';
import { CalendarSelector } from '../../../components/date/CalendarSelector';
import { DateInput } from '../../../components/date/DateInput';
import { DateResultCard } from '../../../components/date/DateResultCard';
import { CalendarType, NormalizedDate } from '../../../utils/date/types';
import { convertDate, getToday } from '../../../utils/date/dateConverter';
import { isValidDate } from '../../../utils/date/dateValidation';

const DateConverterScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  
  const [calendar, setCalendar] = useState<CalendarType>('jalali');
  const [inputDate, setInputDate] = useState<NormalizedDate>({ year: 0, month: 0, day: 0, calendar: 'jalali' });
  const [error, setError] = useState('');
  
  const [results, setResults] = useState<{ jalali: string; gregorian: string; hijri: string } | null>(null);

  const handleCalendarChange = (type: CalendarType) => {
    setCalendar(type);
    setInputDate((prev) => ({ ...prev, calendar: type }));
    setError('');
    setResults(null);
  };

  const setToday = () => {
    const today = getToday(calendar);
    setInputDate(today);
    setError('');
  };

  const handleCalculate = () => {
    setError('');
    setResults(null);

    if (!inputDate.year || !inputDate.month || !inputDate.day) {
      setError('لطفاً تاریخ را کامل وارد کنید.');
      return;
    }

    if (!isValidDate(inputDate)) {
      setError('تاریخ وارد شده نامعتبر است.');
      return;
    }

    try {
      const jalaliDate = convertDate(inputDate, 'jalali');
      const gregorianDate = convertDate(inputDate, 'gregorian');
      const hijriDate = convertDate(inputDate, 'hijri');

      setResults({
        jalali: `${jalaliDate.year}/${jalaliDate.month}/${jalaliDate.day}`,
        gregorian: `${gregorianDate.year}/${gregorianDate.month}/${gregorianDate.day}`,
        hijri: `${hijriDate.year}/${hijriDate.month}/${hijriDate.day}`
      });
    } catch (e) {
      setError('خطایی در محاسبه رخ داد.');
    }
  };

  const handleReset = () => {
    setInputDate({ year: 0, month: 0, day: 0, calendar });
    setError('');
    setResults(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color={colors.textLight} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>تبدیل تاریخ</Text>
        <TouchableOpacity onPress={handleReset} style={styles.backButton}>
          <RotateCcw color={colors.textLight} size={20} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <CalendarSelector selected={calendar} onChange={handleCalendarChange} label="تقویم مبدأ" />
            
            <View style={styles.inputHeader}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>تاریخ</Text>
              <TouchableOpacity onPress={setToday}>
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: 'bold' }}>امروز</Text>
              </TouchableOpacity>
            </View>
            <DateInput 
              value={inputDate} 
              onChange={setInputDate} 
              label=""
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity 
              style={[styles.calcButton, { backgroundColor: colors.primary }]}
              onPress={handleCalculate}
            >
              <Text style={styles.calcButtonText}>تبدیل تاریخ</Text>
            </TouchableOpacity>
          </View>

          {results && (
            <View style={[styles.resultContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.resultHeader, { color: colors.text }]}>نتایج تبدیل</Text>
              
              <View style={[styles.resultRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.resultLabel, { color: colors.textLight }]}>شمسی:</Text>
                <Text style={[styles.resultValue, { color: colors.text }]}>{results.jalali}</Text>
              </View>
              
              <View style={[styles.resultRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.resultLabel, { color: colors.textLight }]}>میلادی:</Text>
                <Text style={[styles.resultValue, { color: colors.text }]}>{results.gregorian}</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, { color: colors.textLight }]}>قمری:</Text>
                <Text style={[styles.resultValue, { color: colors.text }]}>{results.hijri}</Text>
              </View>
            </View>
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
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  resultContainer: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
  },
  resultHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  resultRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default DateConverterScreen;
