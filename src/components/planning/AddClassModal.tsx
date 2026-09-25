import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { X } from 'lucide-react-native';
import { PERSIAN_WEEKDAYS } from '../../utils/date/jalaliHelper';

interface AddClassModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (classData: any) => Promise<void>;
  initialDay?: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AddClassModal({ visible, onClose, onSave, initialDay = 0 }: AddClassModalProps) {
  const { colors } = useTheme();
  
  const [subject, setSubject] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [className, setClassName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [room, setRoom] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(initialDay);
  const [color, setColor] = useState(COLORS[0]);
  
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!subject || !startTime || !endTime) return;
    setIsLoading(true);
    try {
      await onSave({
        subject,
        schoolName,
        className,
        startTime,
        endTime,
        room,
        dayOfWeek,
        color
      });
      // reset
      setSubject('');
      setSchoolName('');
      setClassName('');
      setStartTime('');
      setEndTime('');
      setRoom('');
      onClose();
    } catch (e) {
      console.warn('Failed to save class', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>افزودن برنامه کلاسی</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={colors.textLight} size={24} />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            
            <View style={{ marginBottom: 20 }}>
              <Text style={[styles.label, { color: colors.text }]}>روز هفته</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {PERSIAN_WEEKDAYS.map((day, idx) => (
                  <TouchableOpacity 
                    key={idx}
                    style={[
                      styles.dayChip, 
                      { borderColor: colors.border, backgroundColor: colors.surface },
                      dayOfWeek === idx && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setDayOfWeek(idx)}
                  >
                    <Text style={[styles.dayText, { color: dayOfWeek === idx ? '#fff' : colors.textLight }]}>{day}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>نام درس (الزامی)</Text>
            <TextInput 
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} 
              placeholder="مثال: ریاضی"
              placeholderTextColor={colors.textLight}
              value={subject}
              onChangeText={setSubject}
            />

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={[styles.label, { color: colors.text }]}>نام مدرسه</Text>
                <TextInput 
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} 
                  placeholder="مثال: شهید مطهری"
                  placeholderTextColor={colors.textLight}
                  value={schoolName}
                  onChangeText={setSchoolName}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={styles.flex1}>
                <Text style={[styles.label, { color: colors.text }]}>کلاس</Text>
                <TextInput 
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} 
                  placeholder="مثال: هفتم ۱"
                  placeholderTextColor={colors.textLight}
                  value={className}
                  onChangeText={setClassName}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={[styles.label, { color: colors.text }]}>شروع (الزامی)</Text>
                <TextInput 
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface, textAlign: 'left' }]} 
                  placeholder="08:00"
                  placeholderTextColor={colors.textLight}
                  keyboardType="number-pad"
                  value={startTime}
                  onChangeText={setStartTime}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={styles.flex1}>
                <Text style={[styles.label, { color: colors.text }]}>پایان (الزامی)</Text>
                <TextInput 
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface, textAlign: 'left' }]} 
                  placeholder="09:30"
                  placeholderTextColor={colors.textLight}
                  keyboardType="number-pad"
                  value={endTime}
                  onChangeText={setEndTime}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={styles.flex1}>
                <Text style={[styles.label, { color: colors.text }]}>شماره اتاق</Text>
                <TextInput 
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} 
                  placeholder="آزمایشگاه"
                  placeholderTextColor={colors.textLight}
                  value={room}
                  onChangeText={setRoom}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>رنگ نمایشی</Text>
            <View style={styles.colorsGrid}>
              {COLORS.map(c => (
                <TouchableOpacity 
                  key={c}
                  style={[
                    styles.colorCircle, 
                    { backgroundColor: c },
                    color === c && styles.colorSelected
                  ]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>

          </ScrollView>
          
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={[styles.cancelBtnText, { color: colors.textLight }]}>انصراف</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: (subject && startTime && endTime) ? colors.primary : '#94a3b8' }]} 
              onPress={handleSave}
              disabled={!subject || !startTime || !endTime || isLoading}
            >
              {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>ذخیره برنامه</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  label: {
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontFamily: 'IRANSansX',
    fontSize: 14,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  dayText: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
  },
  colorsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  cancelBtnText: {
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    fontSize: 15,
  },
  saveBtn: {
    flex: 2,
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  saveBtnText: {
    color: '#fff',
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    fontSize: 15,
  }
});
