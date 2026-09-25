import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { ChevronRight, Plus, Calendar, Clock, MapPin, Trash2 } from 'lucide-react-native';
import { toPersianNumbers, PERSIAN_WEEKDAYS } from '../../utils/date/jalaliHelper';
import { PlanningService } from '../../api/planningService';
import { useFocusEffect } from '@react-navigation/native';

const WeeklyScheduleScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  
  const [scheduleState, setScheduleState] = useState<any[]>([]);

  const fetchSchedule = async () => {
    try {
      const res = await PlanningService.getSchedule();
      if (res.success && res.data) {
        const ORDERED_DAY_INDICES = [6, 0, 1, 2, 3, 4, 5];
        
        const grouped = ORDERED_DAY_INDICES.map(idx => ({
          id: idx,
          day: PERSIAN_WEEKDAYS[idx],
          classes: res.data.filter((item: any) => item.dayOfWeek === idx).map((item: any) => ({
            id: item._id,
            title: item.subject || 'بدون نام',
            classStr: item.className || 'بدون کلاس',
            time: item.startTime ? `${item.startTime} - ${item.endTime}` : '',
            location: item.schoolName || item.room || 'نامشخص',
            color: item.color || '#3b82f6',
          }))
        }));
        setScheduleState(grouped);
      }
    } catch (err) {}
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchSchedule();
    }, [])
  );

  const handleAddClass = (dayIndex: number) => {
    navigation.navigate('WeeklyScheduleBuilderScreen', { initialDay: dayIndex });
  };

  const handleSaveClass = async (classData: any) => {
    await PlanningService.createSchedule(classData);
    await fetchSchedule();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronRight color={colors.text} size={28} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>برنامه هفتگی من</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.introBox}>
          <Text style={[styles.introText, { color: colors.textLight }]}>
            در این بخش می‌توانید برنامه ثابت کلاسی خود را در طول هفته تعریف کنید تا تقویم شما به صورت خودکار پر شود.
          </Text>
        </View>

        {scheduleState.map(dayInfo => (
          <View key={dayInfo.id} style={styles.dayGroup}>
            <View style={styles.dayHeader}>
              <Text style={[styles.dayTitle, { color: colors.text }]}>{dayInfo.day}</Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => handleAddClass(dayInfo.id)}>
                <Plus color={colors.primary} size={18} />
                <Text style={[styles.addBtnText, { color: colors.primary }]}>افزودن کلاس</Text>
              </TouchableOpacity>
            </View>

            {dayInfo.classes.length === 0 ? (
              <View style={[styles.emptyClassBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.emptyClassText, { color: colors.textLight }]}>کلاسی ثبت نشده است.</Text>
              </View>
            ) : (
              dayInfo.classes.map(cls => (
                <View key={cls.id} style={[styles.classCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[styles.classColorLine, { backgroundColor: cls.color }]} />
                  <View style={styles.classInfo}>
                    <Text style={[styles.classTitle, { color: colors.text }]}>{cls.title} - {cls.classStr}</Text>
                    <View style={styles.classMeta}>
                      {cls.time ? (
                        <View style={styles.metaRow}>
                          <Clock color={colors.textLight} size={14} />
                          <Text style={[styles.metaText, { color: colors.textLight }]}>{toPersianNumbers(cls.time)}</Text>
                        </View>
                      ) : null}
                      <View style={styles.metaRow}>
                        <MapPin color={colors.textLight} size={14} />
                        <Text style={[styles.metaText, { color: colors.textLight }]}>{cls.location}</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.deleteBtn}>
                    <Trash2 color="#ef4444" size={20} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ))}

      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'IRANSansX' },
  
  content: { padding: 16, paddingBottom: 40 },
  introBox: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  introText: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    lineHeight: 22,
    color: '#0369a1'
  },

  dayGroup: { marginBottom: 24 },
  dayHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12
  },
  dayTitle: { fontSize: 16, fontWeight: 'bold', fontFamily: 'IRANSansX' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addBtnText: { fontSize: 12, fontWeight: 'bold', fontFamily: 'IRANSansX', marginLeft: 4 },

  emptyClassBox: {
    padding: 16, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center'
  },
  emptyClassText: { fontSize: 13, fontFamily: 'IRANSansX' },

  classCard: {
    flexDirection: 'row', borderRadius: 12, borderWidth: 1, marginBottom: 12, overflow: 'hidden', alignItems: 'center'
  },
  classColorLine: { width: 6, height: '100%' },
  classInfo: { flex: 1, padding: 12 },
  classTitle: { fontSize: 15, fontWeight: 'bold', fontFamily: 'IRANSansX', marginBottom: 8 },
  classMeta: { gap: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, fontFamily: 'IRANSansX', marginLeft: 6 },
  
  deleteBtn: { padding: 12 }
});

export default WeeklyScheduleScreen;
