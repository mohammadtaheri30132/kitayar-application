import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import GlobalHeader from '../../components/common/GlobalHeader';
import { ChevronLeft } from 'lucide-react-native';

const EducationChaptersScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  
  // Params
  const { 
    subject, 
    level, 
    field, 
    grade,
    bookTitle = 'ریاضی ۱'
  } = route.params || {};

  // Mock Chapters
  const chapters = [
    { id: 1, title: 'مجموعه، الگو و دنباله' },
    { id: 2, title: 'مثلثات' },
    { id: 3, title: 'توان‌های گویا و عبارت‌های جبری' },
    { id: 4, title: 'معادله‌ها و نامعادلات' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <GlobalHeader onProfilePress={() => navigation.navigate('ProfileScreen')} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <Text style={[styles.breadcrumbText, { color: colors.textLight }]}>پایه {grade}</Text>
          <ChevronLeft color={colors.textLight} size={14} style={styles.breadcrumbIcon} />
          <Text style={[styles.breadcrumbText, { color: colors.primary, fontWeight: 'bold' }]}>{bookTitle}</Text>
        </View>

        {/* Page Title */}
        <View style={styles.pageTitleContainer}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>فصل‌های کتاب</Text>
        </View>

        {/* Chapters List */}
        <View style={styles.chaptersList}>
          {chapters.map((chapter) => {
            return (
              <TouchableOpacity 
                key={chapter.id} 
                style={[styles.chapterCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('EducationLessonsScreen', { subject, level, field, grade, bookTitle, chapterTitle: chapter.title, chapterId: chapter.id })}
              >
                <View style={[styles.numberBox, { backgroundColor: `${colors.primary}15` }]}>
                  <Text style={[styles.numberText, { color: colors.primary }]}>{chapter.id}</Text>
                </View>
                <Text style={[styles.chapterTitle, { color: colors.text }]}>{chapter.title}</Text>
                <ChevronLeft color={colors.textLight} size={20} />
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  breadcrumbText: { fontSize: 11, fontFamily: 'IRANSansX' },
  breadcrumbIcon: { marginHorizontal: 4 },

  pageTitleContainer: { marginBottom: 24 },
  pageTitle: { fontSize: 22, fontWeight: 'bold', fontFamily: 'IRANSansX' },

  chaptersList: { gap: 12 },
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  numberBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberText: { fontSize: 16, fontWeight: 'bold', fontFamily: 'IRANSansX' },
  chapterTitle: { flex: 1, fontSize: 15, fontWeight: 'bold', fontFamily: 'IRANSansX' },
});

export default EducationChaptersScreen;
