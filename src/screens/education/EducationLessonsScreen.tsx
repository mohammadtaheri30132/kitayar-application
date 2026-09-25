import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import GlobalHeader from '../../components/common/GlobalHeader';
import { ChevronLeft, FileText } from 'lucide-react-native';

const EducationLessonsScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  
  // Params
  const { 
    subject, 
    level, 
    field, 
    grade,
    bookTitle,
    chapterTitle = 'مجموعه، الگو و دنباله',
    chapterId
  } = route.params || {};

  // Mock Lessons
  const lessons = [
    { id: 1, title: 'مجموعه‌های متناهی و نامتناهی' },
    { id: 2, title: 'متمم یک مجموعه' },
    { id: 3, title: 'الگو و دنباله' },
    { id: 4, title: 'دنباله‌های حسابی و هندسی' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <GlobalHeader onProfilePress={() => navigation.navigate('ProfileScreen')} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <Text style={[styles.breadcrumbText, { color: colors.textLight }]}>{bookTitle}</Text>
          <ChevronLeft color={colors.textLight} size={14} style={styles.breadcrumbIcon} />
          <Text style={[styles.breadcrumbText, { color: colors.primary, fontWeight: 'bold' }]}>فصل {chapterId}</Text>
        </View>

        {/* Page Title */}
        <View style={styles.pageTitleContainer}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>درس‌های فصل</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textLight }]}>{chapterTitle}</Text>
        </View>

        {/* Lessons List */}
        <View style={styles.lessonsList}>
          {lessons.map((lesson) => {
            return (
              <TouchableOpacity 
                key={lesson.id} 
                style={[styles.lessonCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('EducationLessonContentScreen', { subject, level, field, grade, bookTitle, chapterTitle, chapterId, lessonTitle: lesson.title, lessonId: lesson.id })}
              >
                <FileText color={colors.primary} size={20} style={styles.lessonIcon} />
                <View style={styles.lessonInfo}>
                  <Text style={[styles.lessonTitle, { color: colors.text }]}>درس {lesson.id}</Text>
                  <Text style={[styles.lessonSub, { color: colors.textLight }]}>{lesson.title}</Text>
                </View>
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
  pageTitle: { fontSize: 22, fontWeight: 'bold', fontFamily: 'IRANSansX', marginBottom: 4 },
  pageSubtitle: { fontSize: 14, fontFamily: 'IRANSansX' },

  lessonsList: { gap: 12 },
  lessonCard: {
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
  lessonIcon: { marginRight: 12 },
  lessonInfo: { flex: 1 },
  lessonTitle: { fontSize: 14, fontWeight: 'bold', fontFamily: 'IRANSansX', marginBottom: 2 },
  lessonSub: { fontSize: 12, fontFamily: 'IRANSansX' },
});

export default EducationLessonsScreen;
