import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { ChevronLeft, Sun, Moon } from 'lucide-react-native';

const SettingsScreen = ({ navigation }: any) => {
  const { theme, toggleTheme, colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color={colors.textLight} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>تنظیمات</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.textLight }]}>پوسته برنامه</Text>
        
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]} 
            onPress={() => toggleTheme('light')}
          >
            <View style={styles.leftContent}>
              <View style={[styles.radio, { borderColor: theme === 'light' ? colors.primary : colors.border }]}>
                {theme === 'light' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
              </View>
            </View>
            <View style={styles.rightContent}>
              <Text style={[styles.rowText, { color: colors.text }]}>حالت روشن</Text>
              <Sun size={20} color={colors.textLight} style={{ marginLeft: 12 }} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.row} 
            onPress={() => toggleTheme('dark')}
          >
            <View style={styles.leftContent}>
              <View style={[styles.radio, { borderColor: theme === 'dark' ? colors.primary : colors.border }]}>
                {theme === 'dark' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
              </View>
            </View>
            <View style={styles.rightContent}>
              <Text style={[styles.rowText, { color: colors.text }]}>حالت تاریک</Text>
              <Moon size={20} color={colors.textLight} style={{ marginLeft: 12 }} />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textLight, marginTop: 24 }]}>تنظیمات تقویم</Text>
        
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.row} 
            onPress={() => {}}
          >
            <View style={styles.leftContent}>
              <View style={[styles.radio, { borderColor: colors.primary }]}>
                <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
              </View>
            </View>
            <View style={styles.rightContent}>
              <Text style={[styles.rowText, { color: colors.text }]}>نمایش مناسبت‌های سیستمی</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  backButton: { padding: 8 },
  
  content: { padding: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'right',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  leftContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  rowText: {
    fontSize: 16,
    fontWeight: '500',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default SettingsScreen;
