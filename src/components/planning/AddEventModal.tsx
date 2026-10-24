import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { X, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react-native';
import { toPersianNumbers, formatJalaliStandard } from '../../utils/date/jalaliHelper';

interface AddEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (eventData: any) => Promise<void>;
  selectedDateStr?: string; // YYYY-MM-DD
}

export default function AddEventModal({ visible, onClose, onSave, selectedDateStr }: AddEventModalProps) {
  const { colors } = useTheme();
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState('meeting');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const displayDate = selectedDateStr || 'امروز';

  const handleSave = async () => {
    if (!title) return;
    setIsLoading(true);
    try {
      await onSave({
        title,
        type,
        date: selectedDateStr,
        time: time || undefined,
        location: location || undefined,
        description: description || undefined,
      });
      setTitle('');
      setType('meeting');
      setTime('');
      setLocation('');
      setDescription('');
      onClose();
    } catch (e) {
      console.warn('Failed to save event', e);
    } finally {
      setIsLoading(false);
    }
  };

  const types = [
    { value: 'meeting', label: 'جلسه' },
    { value: 'exam', label: 'امتحان' },
    { value: 'workshop', label: 'کارگاه' },
    { value: 'personal', label: 'شخصی' },
    { value: 'school_event', label: 'مدرسه' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Backdrop Tap to Close */}
        <TouchableOpacity 
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <TouchableOpacity 
          style={{ flex: 1, width: '100%' }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: 80 }]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>افزودن رویداد جدید</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={colors.textLight} size={24} />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={[styles.dateBox, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
              <CalendarIcon color="#3b82f6" size={20} />
              <Text style={styles.dateText}>{toPersianNumbers(displayDate)}</Text>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>عنوان رویداد</Text>
            <TextInput 
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} 
              placeholder="مثال: جلسه اولیا و مربیان"
              placeholderTextColor={colors.textLight}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.label, { color: colors.text }]}>نوع رویداد</Text>
            <View style={styles.typesGrid}>
              {types.map(t => (
                <TouchableOpacity 
                  key={t.value}
                  style={[
                    styles.typeChip, 
                    { borderColor: colors.border, backgroundColor: colors.surface },
                    type === t.value && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => setType(t.value)}
                >
                  <Text style={[styles.typeText, { color: type === t.value ? '#fff' : colors.textLight }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={[styles.label, { color: colors.text }]}>ساعت (اختیاری)</Text>
                <TextInput 
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} 
                  placeholder="مثلاً 10:30"
                  placeholderTextColor={colors.textLight}
                  keyboardType="number-pad"
                  value={time}
                  onChangeText={setTime}
                />
              </View>
              <View style={{ width: 16 }} />
              <View style={styles.flex1}>
                <Text style={[styles.label, { color: colors.text }]}>مکان (اختیاری)</Text>
                <TextInput 
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} 
                  placeholder="اتاق جلسات"
                  placeholderTextColor={colors.textLight}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>توضیحات (اختیاری)</Text>
            <TextInput 
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface, minHeight: 80, textAlignVertical: 'top' }]} 
              placeholder="توضیحات تکمیلی..."
              placeholderTextColor={colors.textLight}
              multiline
              value={description}
              onChangeText={setDescription}
            />

          </ScrollView>
          
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: title ? colors.primary : '#94a3b8' }]} 
              onPress={handleSave}
              disabled={!title || isLoading}
            >
              {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>ذخیره رویداد</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={[styles.cancelBtnText, { color: colors.textLight }]}>انصراف</Text>
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
    flexDirection: 'row-reverse',
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
    textAlign: 'right',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  dateBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  dateText: {
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginRight: 8,
    fontSize: 14,
    textAlign: 'right',
  },
  label: {
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontFamily: 'IRANSansX',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'right',
  },
  typesGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeText: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
  },
  row: {
    flexDirection: 'row-reverse',
  },
  flex1: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row-reverse',
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
