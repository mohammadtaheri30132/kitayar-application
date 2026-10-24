import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Switch } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { PlanningService } from '../../api/planningService';
import { getTodayJalali } from '../../utils/date/jalaliHelper';

interface AddNoteModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (noteData: any) => Promise<void>;
  initialDate?: string; 
  initialClassId?: string;
}

const PASTEL_COLORS = [
  '#fef08a', // yellow
  '#bae6fd', // blue
  '#bbf7d0', // green
  '#fecdd3', // pink
  '#e9d5ff', // purple
  '#fed7aa', // orange
  '#e2e8f0', // gray
  '#ffffff', // white
];

const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const YEARS = [1402, 1403, 1404, 1405];

const AddNoteModal = ({ visible, onClose, onSave, initialDate, initialClassId }: AddNoteModalProps) => {
  const { colors } = useTheme();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState(PASTEL_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);

  // Date selection
  const { jy, jm, jd } = getTodayJalali();
  const [selectedYear, setSelectedYear] = useState(jy);
  const [selectedMonth, setSelectedMonth] = useState(jm);
  const [selectedDay, setSelectedDay] = useState(jd);

  // Class selection
  const [isClassRelated, setIsClassRelated] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      if (initialDate) {
        const parts = initialDate.split('-');
        if(parts.length === 3) {
          setSelectedYear(parseInt(parts[0], 10));
          setSelectedMonth(parseInt(parts[1], 10));
          setSelectedDay(parseInt(parts[2], 10));
        }
      } else {
        setSelectedYear(jy);
        setSelectedMonth(jm);
        setSelectedDay(jd);
      }
      
      if (initialClassId) {
        setIsClassRelated(true);
        setSelectedClassId(initialClassId);
      } else {
        setIsClassRelated(false);
        setSelectedClassId(null);
      }

      // Fetch classes
      PlanningService.getClasses().then((res) => {
        if (res.success) {
          setClasses(res.data);
        }
      }).catch(console.warn);
    }
  }, [visible, initialDate, initialClassId]);

  const handleSave = async () => {
    if (!content.trim()) return;

    const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;
    setIsLoading(true);
    try {
      await onSave({
        title: title || undefined,
        content,
        date: formattedDate,
        color,
        classId: isClassRelated ? selectedClassId : undefined
      });
      // Reset
      setTitle('');
      setContent('');
      setColor(PASTEL_COLORS[0]);
      onClose();
    } catch (e) {
      console.warn('Failed to save note', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysArray = () => {
    const daysInMonth = selectedMonth <= 6 ? 31 : (selectedMonth <= 11 ? 30 : 29); // Simplified
    return Array.from({length: daysInMonth}, (_, i) => i + 1);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
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
        <View style={[styles.modalContainer, { backgroundColor: colors.background, paddingBottom: 80 }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>یادداشت جدید</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            
            {/* Class Selection */}
            <View style={styles.switchRow}>
              <Text style={[styles.label, { color: colors.text, marginTop: 0, marginBottom: 0 }]}>مربوط به کلاس خاصی است؟</Text>
              <Switch 
                value={isClassRelated} 
                onValueChange={setIsClassRelated}
                trackColor={{ false: '#cbd5e1', true: colors.primary }}
              />
            </View>

            {isClassRelated && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
                {classes.map((cls) => (
                  <TouchableOpacity 
                    key={cls._id} 
                    style={[
                      styles.chip, 
                      { borderColor: colors.border },
                      selectedClassId === cls._id && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setSelectedClassId(cls._id)}
                  >
                    <Text style={[styles.chipText, { color: colors.text }, selectedClassId === cls._id && { color: '#fff' }]}>
                      {cls.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Text style={[styles.label, { color: colors.text }]}>عنوان یادداشت (اختیاری)</Text>
            <TextInput 
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} 
              placeholder="مثال: ایده تدریس"
              placeholderTextColor={colors.textLight}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.label, { color: colors.text }]}>تاریخ</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {/* Day */}
              <View style={{ flex: 1, height: 120 }}>
                <Text style={styles.pickerLabel}>روز</Text>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 40 }} snapToInterval={40} decelerationRate="fast">
                  {getDaysArray().map(d => (
                    <TouchableOpacity key={d} style={[styles.pickerItem, selectedDay === d && styles.pickerItemSelected]} onPress={() => setSelectedDay(d)}>
                      <Text style={[styles.pickerItemText, selectedDay === d && styles.pickerItemTextSelected]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              {/* Month */}
              <View style={{ flex: 1.5, height: 120 }}>
                <Text style={styles.pickerLabel}>ماه</Text>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 40 }} snapToInterval={40} decelerationRate="fast">
                  {MONTHS.map((m, i) => (
                    <TouchableOpacity key={i} style={[styles.pickerItem, selectedMonth === i+1 && styles.pickerItemSelected]} onPress={() => setSelectedMonth(i+1)}>
                      <Text style={[styles.pickerItemText, selectedMonth === i+1 && styles.pickerItemTextSelected]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              {/* Year */}
              <View style={{ flex: 1, height: 120 }}>
                <Text style={styles.pickerLabel}>سال</Text>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 40 }} snapToInterval={40} decelerationRate="fast">
                  {YEARS.map(y => (
                    <TouchableOpacity key={y} style={[styles.pickerItem, selectedYear === y && styles.pickerItemSelected]} onPress={() => setSelectedYear(y)}>
                      <Text style={[styles.pickerItemText, selectedYear === y && styles.pickerItemTextSelected]}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>متن یادداشت *</Text>
            <TextInput 
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface, minHeight: 120, textAlignVertical: 'top' }]} 
              placeholder="یادداشت خود را اینجا بنویسید..."
              placeholderTextColor={colors.textLight}
              multiline
              value={content}
              onChangeText={setContent}
            />

            <Text style={[styles.label, { color: colors.text }]}>رنگ پس‌زمینه</Text>
            <View style={styles.colorsRow}>
              {PASTEL_COLORS.map(c => (
                <TouchableOpacity 
                  key={c} 
                  style={[
                    styles.colorCircle, 
                    { backgroundColor: c },
                    color === c && styles.colorCircleSelected,
                    c === '#ffffff' && { borderWidth: 1, borderColor: '#e2e8f0' }
                  ]}
                  onPress={() => setColor(c)}
                >
                  {color === c && <Check color="#333" size={16} />}
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity 
              style={[
                styles.saveBtn, 
                { backgroundColor: colors.primary },
                (!content.trim()) && { opacity: 0.5 }
              ]} 
              onPress={handleSave}
              disabled={!content.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>ذخیره یادداشت</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    textAlign: 'right',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'IRANSansX',
    textAlign: 'right',
  },
  switchRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
  },
  pickerLabel: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'IRANSansX',
    color: '#64748b',
    marginBottom: 4
  },
  pickerItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8
  },
  pickerItemText: {
    fontSize: 14,
    fontFamily: 'IRANSansX',
    color: '#475569'
  },
  pickerItemTextSelected: {
    color: '#0f172a',
    fontWeight: 'bold'
  },
  colorsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleSelected: {
    borderWidth: 2,
    borderColor: '#333',
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  }
});

export default AddNoteModal;
