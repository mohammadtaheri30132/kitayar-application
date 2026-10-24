import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, Modal, 
  FlatList, StyleSheet, TouchableWithoutFeedback 
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ChevronDown, Check } from 'lucide-react-native';

interface DropdownItem {
  id: string;
  label: string;
  value: any;
}

interface CustomDropdownProps {
  items: DropdownItem[];
  selectedValue: any;
  onSelect: (item: DropdownItem) => void;
  placeholder?: string;
  label?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  items,
  selectedValue,
  onSelect,
  placeholder = 'انتخاب کنید...',
  label
}) => {
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const selectedItem = items.find(i => i.value === selectedValue);

  const handleSelect = (item: DropdownItem) => {
    onSelect(item);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      
      <TouchableOpacity 
        style={[
          styles.dropdownButton, 
          { 
            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
            borderColor: colors.border 
          }
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[
          styles.buttonText, 
          { color: selectedItem ? colors.text : colors.textLight }
        ]}>
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <ChevronDown color={colors.textLight} size={20} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[
                styles.modalContent, 
                { backgroundColor: colors.surface }
              ]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {placeholder}
                </Text>
                
                <FlatList
                  data={items}
                  keyExtractor={(item) => item.id}
                  style={styles.list}
                  renderItem={({ item }) => {
                    const isSelected = item.value === selectedValue;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.listItem,
                          { borderBottomColor: colors.border },
                          isSelected && { backgroundColor: isDark ? '#334155' : '#f1f5f9' }
                        ]}
                        onPress={() => handleSelect(item)}
                      >
                        <Text style={[
                          styles.listItemText, 
                          { color: colors.text },
                          isSelected && { color: colors.primary, fontWeight: 'bold' }
                        ]}>
                          {item.label}
                        </Text>
                        {isSelected && <Check color={colors.primary} size={20} />}
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'right',
  },
  dropdownButton: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    textAlign: 'right',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '70%',
    borderRadius: 16,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  list: {
    maxHeight: '100%',
  },
  listItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderRadius: 8,
  },
  listItemText: {
    fontSize: 16,
    textAlign: 'right',
    flex: 1,
  }
});
