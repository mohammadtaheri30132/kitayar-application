import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, I18nManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';

const ALL_CATEGORIES = [
  'آموزش و پرورش',
  'بخشنامه‌ها',
  'آزمون‌ها',
  'استخدام',
  'حقوق و مزایا',
  'تعطیلی مدارس',
  'آموزشی',
  'فناوری آموزشی',
  'ضمن خدمت',
  'تقویم آموزشی'
];

const NewsSettingsScreen = ({ navigation }: any) => {
  const { colors } = useTheme();

  // Pretend everything is selected by default
  const [selectedCats, setSelectedCats] = useState<string[]>(ALL_CATEGORIES);

  const toggleCategory = (cat: string) => {
    if (selectedCats.includes(cat)) {
      setSelectedCats(selectedCats.filter(c => c !== cat));
    } else {
      setSelectedCats([...selectedCats, cat]);
    }
  };

  const handleSave = () => {
    // In a real app, save to Context, Redux or AsyncStorage
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          {I18nManager.isRTL ? <ChevronRight color={colors.text} size={28} /> : <ChevronLeft color={colors.text} size={28} />}
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>تنظیمات اخبار</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.description, { color: colors.text }]}>
          دسته‌بندی‌های اخباری که مایل هستید در فید شما نمایش داده شوند را انتخاب کنید:
        </Text>

        <View style={styles.list}>
          {ALL_CATEGORIES.map((cat, index) => {
            const isSelected = selectedCats.includes(cat);
            return (
              <TouchableOpacity 
                key={index} 
                style={[styles.row, { borderBottomColor: colors.border }]}
                onPress={() => toggleCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.catName, { color: colors.text }]}>{cat}</Text>
                <View style={[
                  styles.checkbox, 
                  { 
                    borderColor: isSelected ? colors.primary : colors.textLight,
                    backgroundColor: isSelected ? colors.primary : 'transparent' 
                  }
                ]}>
                  {isSelected && <Check color="#fff" size={14} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
        >
          <Text style={styles.saveText}>ذخیره تنظیمات</Text>
        </TouchableOpacity>
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'IRANSansX' },
  content: { padding: 20 },
  description: {
    fontSize: 14, fontFamily: 'IRANSansX', lineHeight: 22, marginBottom: 24,
    textAlign: I18nManager.isRTL ? 'right' : 'left'
  },
  list: {
    marginBottom: 40,
  },
  row: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  catName: {
    fontSize: 15, fontFamily: 'IRANSansX'
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center'
  },
  saveBtn: {
    height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center'
  },
  saveText: {
    color: '#fff', fontSize: 16, fontWeight: 'bold', fontFamily: 'IRANSansX'
  }
});

export default NewsSettingsScreen;
