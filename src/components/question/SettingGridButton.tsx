import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

interface Props {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  onPress: () => void;
}

// 👈 دکمه‌ی مربعی هر آیتم در گرید تنظیمات؛ فقط مسئول باز کردن باتم‌شیت خودش است.
const SettingGridButton: React.FC<Props> = ({ icon, iconBg, label, onPress }) => (
  <TouchableOpacity style={styles.gridItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.gridIconBox, { backgroundColor: iconBg }]}>{icon}</View>
    <Text style={styles.gridItemText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  gridItem: {
    width: '48%',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  gridIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  gridItemText: { fontSize: 13, fontWeight: 'bold', color: '#334155', flex: 1, textAlign: 'right' },
});

export default SettingGridButton;