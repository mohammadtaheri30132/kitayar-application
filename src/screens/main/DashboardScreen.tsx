import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';

const DashboardScreen = ({ navigation }: any) => {
  const { logout } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>داشبورد معلم</Text>
        <Text style={styles.subtitle}>به کیتایار خوش آمدید</Text>
      </View>

      <View style={styles.menuGrid}>
        <TouchableOpacity 
          style={styles.menuCard}
          onPress={() => navigation.navigate('ClassManagementScreen')}
        >
          <Text style={styles.menuIcon}>🏫</Text>
          <Text style={styles.menuText}>مدیریت کلاس‌ها</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.menuCard}
          onPress={() => navigation.navigate('ToolsListScreen')}
        >
          <Text style={styles.menuIcon}>🏫</Text>
          <Text style={styles.menuText}>مدیریت ابزار ها</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.menuCard}
          onPress={() => navigation.navigate('MobileQuestionBuilder')}
        >
          <Text style={styles.menuIcon}>🏫</Text>
          <Text style={styles.menuText}>سوال ساز</Text>
        </TouchableOpacity>
<TouchableOpacity 
        style={[styles.logoutButton, { backgroundColor: '#f1f5f9' }]} 
        onPress={() => navigation.navigate('ProfileScreen')}
      >
        <Text style={[styles.logoutText, { color: COLORS.text }]}>👤 پروفایل و تنظیمات حساب</Text>
      </TouchableOpacity>
        <TouchableOpacity 
          style={styles.menuCard}
          onPress={() => navigation.navigate('ExamListScreen')}
        >
          <Text style={styles.menuIcon}>📝</Text>
          <Text style={styles.menuText}>آزمون‌ها</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>خروج از حساب</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 24, paddingTop: 60 },
  header: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 },
  subtitle: { fontSize: 16, color: COLORS.textLight },
  
  menuGrid: { flex: 1, flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
  },
  menuIcon: { fontSize: 40, marginBottom: 12 },
  menuText: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },

  logoutButton: { backgroundColor: '#fee2e2', padding: 16, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: COLORS.error, fontWeight: 'bold', fontSize: 16 },
});

export default DashboardScreen;