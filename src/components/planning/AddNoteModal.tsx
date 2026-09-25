import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { toPersianNumbers } from '../../utils/date/jalaliHelper';

interface AddNoteModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (noteData: any) => Promise<void>;
  initialDate?: string; // Standard Jalali string
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

const AddNoteModal = ({ visible, onClose, onSave, initialDate }: AddNoteModalProps) => {
  const { colors } = useTheme();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(initialDate || '');
  const [color, setColor] = useState(PASTEL_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize date when modal opens if empty
  React.useEffect(() => {
    if (visible && !date && initialDate) {
      setDate(initialDate);
    }
  }, [visible, initialDate]);

  const handleSave = async () => {
    if (!content.trim() || !date.trim()) return;

    setIsLoading(true);
    try {
      await onSave({
        title: title || undefined,
        content,
        date,
        color
      });
      // Reset
      setTitle('');
      setContent('');
      setDate(initialDate || '');
      setColor(PASTEL_COLORS[0]);
      onClose();
    } catch (e) {
      console.warn('Failed to save note', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>یادداشت جدید</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            
            <Text style={[styles.label, { color: colors.text }]}>عنوان یادداشت (اختیاری)</Text>
            <TextInput 
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} 
              placeholder="مثال: ایده تدریس"
              placeholderTextColor={colors.textLight}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.label, { color: colors.text }]}>تاریخ (مثال: 1403-07-25)</Text>
            <TextInput 
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface, textAlign: 'left' }]} 
              placeholder="1403-07-25"
              placeholderTextColor={colors.textLight}
              value={date}
              onChangeText={setDate}
              keyboardType="number-pad"
            />

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
                (!content.trim() || !date.trim()) && { opacity: 0.5 }
              ]} 
              onPress={handleSave}
              disabled={!content.trim() || !date.trim() || isLoading}
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
    height: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
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
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'IRANSansX',
  },
  colorsRow: {
    flexDirection: 'row',
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
    borderTopWidth: 1,
    backgroundColor: '#fff',
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
