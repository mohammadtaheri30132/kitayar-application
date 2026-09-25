import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { ChevronRight, Save } from 'lucide-react-native';
import { api } from '../../api/axiosConfig';

import { PERSIAN_WEEKDAYS } from '../../utils/date/jalaliHelper';

const ORDERED_DAY_INDICES = [6, 0, 1, 2, 3, 4, 5];

const WeeklyScheduleBuilderScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  
  const initialDay = route.params?.initialDay ?? 6;
  
  const [subject, setSubject] = useState('');
  const [className, setClassName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(initialDay); 
  
  const [shift, setShift] = useState<'morning' | 'afternoon'>('morning');
  const [period, setPeriod] = useState(0); // 0 = بدون زمان, 1 to 6
  const [duration, setDuration] = useState<45 | 90>(90);
  
  const [schoolName, setSchoolName] = useState('');
  const [schools, setSchools] = useState<any[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await api.get('/teacher/schools');
      if (response.data.success) {
        setSchools(response.data.data);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoadingSchools(false);
    }
  };

  const computeTime = (s: 'morning' | 'afternoon', p: number, d: 45 | 90) => {
    if (p === 0) return { startTime: '', endTime: '' };
    
    let startHour = s === 'morning' ? 8 : 13;
    let startMinute = 0;
    
    const totalBreakMinutes = (p - 1) * 15;
    const totalClassMinutes = (p - 1) * d;
    const totalPassedMinutes = totalBreakMinutes + totalClassMinutes;
    
    startHour += Math.floor((startMinute + totalPassedMinutes) / 60);
    startMinute = (startMinute + totalPassedMinutes) % 60;
    
    const endTotalMinutes = startMinute + d;
    let endHour = startHour + Math.floor(endTotalMinutes / 60);
    let endMinute = endTotalMinutes % 60;
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    
    return {
      startTime: `${pad(startHour)}:${pad(startMinute)}`,
      endTime: `${pad(endHour)}:${pad(endMinute)}`
    };
  };
  
  const handleSave = async () => {
    if (!subject.trim()) {
      Alert.alert('خطا', 'نام درس را وارد کنید');
      return;
    }
    if (!schoolName.trim()) {
      Alert.alert('خطا', 'نام مدرسه را وارد کنید یا انتخاب کنید');
      return;
    }

    setIsSaving(true);
    try {
      let finalSchoolId = null;
      // Check if school already exists
      const existingSchool = schools.find(s => s.name === schoolName.trim());
      
      if (existingSchool) {
        finalSchoolId = existingSchool._id;
      } else {
        // Create new school
        const schoolRes = await api.post('/teacher/schools', { name: schoolName.trim() });
        if (schoolRes.data.success) {
          finalSchoolId = schoolRes.data.data._id;
        }
      }

      const { startTime, endTime } = computeTime(shift, period, duration);

      const data = {
        subject: subject.trim(),
        className: className.trim(),
        dayOfWeek,
        startTime,
        endTime,
        schoolId: finalSchoolId,
        schoolName: schoolName.trim()
      };
      
      const response = await api.post('/teacher/schedule', data);
      if (response.data.success) {
        Alert.alert('موفق', 'برنامه با موفقیت ذخیره شد', [
          { text: 'باشه', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (e: any) {
      console.warn(e);
      Alert.alert('خطا', e.response?.data?.message || 'خطا در ذخیره برنامه');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronRight color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>ثبت کلاس جدید</Text>
        <View style={{ width: 32 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        
        <Text style={[styles.label, { color: colors.text }]}>نام درس</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="مثلاً ریاضی"
          placeholderTextColor={colors.textLight}
          value={subject}
          onChangeText={setSubject}
        />

        <Text style={[styles.label, { color: colors.text }]}>پایه / کلاس</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="مثلاً پایه هفتم"
          placeholderTextColor={colors.textLight}
          value={className}
          onChangeText={setClassName}
        />
        
        <Text style={[styles.label, { color: colors.text }]}>روز هفته</Text>
        <View style={styles.wrapContainer}>
          {ORDERED_DAY_INDICES.map((dayIdx) => (
            <TouchableOpacity 
              key={dayIdx} 
              style={[styles.chipBtn, dayOfWeek === dayIdx && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setDayOfWeek(dayIdx)}
            >
              <Text style={[styles.chipText, dayOfWeek === dayIdx && { color: '#fff' }]}>{PERSIAN_WEEKDAYS[dayIdx]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>شیفت</Text>
        <View style={styles.row}>
          <TouchableOpacity 
            style={[styles.halfBtn, shift === 'afternoon' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setShift('afternoon')}
          >
            <Text style={[styles.chipText, shift === 'afternoon' && { color: '#fff' }]}>عصر</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.halfBtn, shift === 'morning' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setShift('morning')}
          >
            <Text style={[styles.chipText, shift === 'morning' && { color: '#fff' }]}>صبح</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>زنگ کلاس</Text>
        <View style={styles.wrapContainer}>
          {[0, 1, 2, 3, 4, 5, 6].map((p) => (
            <TouchableOpacity 
              key={p} 
              style={[styles.chipBtn, period === p && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.chipText, period === p && { color: '#fff' }]}>{p === 0 ? 'بدون زمان' : `زنگ ${p}`}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>زمان کلاس</Text>
        <View style={styles.row}>
          <TouchableOpacity 
            style={[styles.halfBtn, duration === 45 && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setDuration(45)}
          >
            <Text style={[styles.chipText, duration === 45 && { color: '#fff' }]}>۴۵ دقیقه</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.halfBtn, duration === 90 && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setDuration(90)}
          >
            <Text style={[styles.chipText, duration === 90 && { color: '#fff' }]}>۱ ساعت و نیم</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: colors.text, marginTop: 24 }]}>مدرسه</Text>
        {isLoadingSchools ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: 'flex-end', marginBottom: 8 }} />
        ) : schools.length > 0 ? (
          <View style={styles.wrapContainer}>
            {schools.map((sch) => (
              <TouchableOpacity 
                key={sch._id} 
                style={[styles.schoolChip, schoolName === sch.name && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                onPress={() => setSchoolName(sch.name)}
              >
                <Text style={[styles.schoolChipText, schoolName === sch.name && { color: '#fff' }]}>{sch.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="اگر مدرسه در لیست بالا نیست، اینجا تایپ کنید"
          placeholderTextColor={colors.textLight}
          value={schoolName}
          onChangeText={setSchoolName}
        />

        <TouchableOpacity 
          style={[styles.saveBtn, { backgroundColor: colors.primary }]} 
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Save color="#fff" size={20} />
              <Text style={styles.saveBtnText}>ذخیره کلاس</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'IRANSansX' },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontFamily: 'IRANSansX', marginBottom: 8, marginTop: 16, textAlign: 'right' },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontFamily: 'IRANSansX',
    textAlign: 'right'
  },
  wrapContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8
  },
  chipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff'
  },
  schoolChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc'
  },
  chipText: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
    color: '#64748b'
  },
  schoolChipText: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
    color: '#64748b'
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  halfBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    alignItems: 'center'
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 8,
    marginTop: 32,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', fontFamily: 'IRANSansX', marginRight: 8 },
});

export default WeeklyScheduleBuilderScreen;
