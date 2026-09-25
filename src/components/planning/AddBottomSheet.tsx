import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { X, Calendar as CalendarIcon, BookOpen, CheckSquare, FileText } from 'lucide-react-native';

interface AddBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onAddClass: () => void;
  onAddTask: () => void;
  onAddNote: () => void;
}

export default function AddBottomSheet({ visible, onClose, onAddClass, onAddTask, onAddNote }: AddBottomSheetProps) {
  const { colors } = useTheme();

  const ActionItem = ({ icon: Icon, label, color, onPress }: any) => (
    <TouchableOpacity style={[styles.actionItem, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Icon color={color} size={24} />
      </View>
      <Text style={[styles.actionLabel, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        
        <View style={[styles.bottomSheet, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>افزودن برنامه جدید</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={colors.textLight} size={24} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <ActionItem 
              icon={BookOpen} 
              label="افزودن کلاس" 
              color="#3b82f6" 
              onPress={() => { onClose(); onAddClass(); }} 
            />
            <ActionItem 
              icon={CheckSquare} 
              label="افزودن کار و تسک" 
              color="#10b981" 
              onPress={() => { onClose(); onAddTask(); }} 
            />
            <ActionItem 
              icon={FileText} 
              label="افزودن یادداشت" 
              color="#8b5cf6" 
              onPress={() => { onClose(); onAddNote(); }} 
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'IRANSansX',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    gap: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionLabel: {
    fontFamily: 'IRANSansX',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
