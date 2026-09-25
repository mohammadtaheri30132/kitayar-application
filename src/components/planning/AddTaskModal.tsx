import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { X, Calendar as CalendarIcon, Clock, MapPin, User } from 'lucide-react-native';
import { formatJalaliStandard, getTodayJalali } from '../../utils/date/jalaliHelper';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (taskData: any) => Promise<void>;
  initialDate?: string;
}

export default function AddTaskModal({ visible, onClose, onSave, initialDate }: AddTaskModalProps) {
  const { colors } = useTheme();
  const { jy, jm, jd } = getTodayJalali();
  const defaultDate = formatJalaliStandard(jy, jm, jd);
  
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('normal');
  const [dueDate, setDueDate] = useState(initialDate || defaultDate);
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('');
  const [forWhere, setForWhere] = useState('');
  const [forWhom, setForWhom] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!title) return;
    setIsLoading(true);
    try {
      await onSave({
        title,
        priority,
        dueDate: dueDate || undefined,
        time: time || undefined,
        category: category || undefined,
        forWhere: forWhere || undefined,
        forWhom: forWhom || undefined,
        description: description || undefined,
      });
      setTitle('');
      setPriority('normal');
      setDueDate(initialDate || defaultDate);
      setTime('');
      setCategory('');
      setForWhere('');
      setForWhom('');
      setDescription('');
      onClose();
    } catch (e) {
      console.warn('Failed to save task', e);
    } finally {
      setIsLoading(false);
    }
  };

  const priorities = [
    { value: 'normal', label: 'عادی', color: '#3b82f6' },
    { value: 'important', label: 'مهم', color: '#f59e0b' },
    { value: 'urgent', label: 'فوری', color: '#ef4444' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>افزودن کار جدید</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={colors.textLight} size={24} />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={[styles.label, { color: colors.text }]}>عنوان کار</Text>
            <TextInput 
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} 
              placeholder="مثال: تصحیح برگه‌های ریاضی"
              placeholderTextColor={colors.textLight}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.label, { color: colors.text }]}>توضیحات کوتاه (اختیاری)</Text>
            <TextInput 
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface, minHeight: 80, textAlignVertical: 'top' }]} 
              placeholder="توضیحات بیشتر درباره این کار..."
              placeholderTextColor={colors.textLight}
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <Text style={[styles.label, { color: colors.text }]}>اولویت</Text>
            <View style={styles.typesGrid}>
              {priorities.map(p => (
                <TouchableOpacity 
                  key={p.value}
                  style={[
                    styles.typeChip, 
                    { borderColor: colors.border, backgroundColor: colors.surface },
                    priority === p.value && { backgroundColor: p.color, borderColor: p.color }
                  ]}
                  onPress={() => setPriority(p.value)}
                >
                  <Text style={[styles.typeText, { color: priority === p.value ? '#fff' : colors.textLight }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>تگ / دسته‌بندی (اختیاری)</Text>
            <TextInput 
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} 
              placeholder="مثال: مدرسه، شخصی، تحصیلی..."
              placeholderTextColor={colors.textLight}
              value={category}
              onChangeText={setCategory}
            />

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={[styles.label, { color: colors.text }]}>تاریخ انجام</Text>
                <View style={[styles.inputWithIcon, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <CalendarIcon color={colors.textLight} size={16} />
                  <TextInput 
                    style={[styles.inputText, { color: colors.text, textAlign: 'left' }]} 
                    placeholder="1405-07-25"
                    placeholderTextColor={colors.textLight}
                    value={dueDate}
                    onChangeText={setDueDate}
                  />
                </View>
              </View>
              <View style={{ width: 16 }} />
              <View style={styles.flex1}>
                <Text style={[styles.label, { color: colors.text }]}>ساعت (اختیاری)</Text>
                <View style={[styles.inputWithIcon, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <Clock color={colors.textLight} size={16} />
                  <TextInput 
                    style={[styles.inputText, { color: colors.text, textAlign: 'left' }]} 
                    placeholder="مثلاً 10:30"
                    placeholderTextColor={colors.textLight}
                    keyboardType="number-pad"
                    value={time}
                    onChangeText={setTime}
                  />
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={[styles.label, { color: colors.text }]}>مربوط به کجا؟ (اختیاری)</Text>
                <View style={[styles.inputWithIcon, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <MapPin color={colors.textLight} size={16} />
                  <TextInput 
                    style={[styles.inputText, { color: colors.text }]} 
                    placeholder="مدرسه، کلاس..."
                    placeholderTextColor={colors.textLight}
                    value={forWhere}
                    onChangeText={setForWhere}
                  />
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={[styles.label, { color: colors.text }]}>مربوط به چه کسی؟ (اختیاری)</Text>
                <View style={[styles.inputWithIcon, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <User color={colors.textLight} size={16} />
                  <TextInput 
                    style={[styles.inputText, { color: colors.text }]} 
                    placeholder="دانش‌آموز، گروه..."
                    placeholderTextColor={colors.textLight}
                    value={forWhom}
                    onChangeText={setForWhom}
                  />
                </View>
              </View>
            </View>

          </ScrollView>
          
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={[styles.cancelBtnText, { color: colors.textLight }]}>انصراف</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: title ? colors.primary : '#94a3b8' }]} 
              onPress={handleSave}
              disabled={!title || isLoading}
            >
              {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>ذخیره کار</Text>}
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
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontFamily: 'IRANSansX',
    fontSize: 14,
    marginBottom: 16,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 48,
  },
  inputText: {
    flex: 1,
    fontFamily: 'IRANSansX',
    fontSize: 14,
    marginLeft: 8,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
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
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
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
