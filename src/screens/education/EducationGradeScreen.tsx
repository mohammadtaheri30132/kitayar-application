import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import GlobalHeader from '../../components/common/GlobalHeader';
import { ChevronLeft, GraduationCap } from 'lucide-react-native';

const EducationGradeScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  
  // Params passed from Field Screen
  const { subject = 'دبیر ریاضی', level = 'متوسطه دوم', field = 'ریاضی و فیزیک' } = route.params || {};

  // Mock Grades
  const grades = ['دهم', 'یازدهم', 'دوازدهم'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <GlobalHeader onProfilePress={() => navigation.navigate('ProfileScreen')} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <Text style={[styles.breadcrumbText, { color: colors.textLight }]}>{subject}</Text>
          <ChevronLeft color={colors.textLight} size={14} style={styles.breadcrumbIcon} />
          <Text style={[styles.breadcrumbText, { color: colors.textLight }]}>{level}</Text>
          <ChevronLeft color={colors.textLight} size={14} style={styles.breadcrumbIcon} />
          <Text style={[styles.breadcrumbText, { color: colors.primary, fontWeight: 'bold' }]}>{field}</Text>
        </View>

        {/* Page Title */}
        <View style={styles.pageTitleContainer}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>انتخاب پایه</Text>
        </View>

        {/* Grades List */}
        <View style={styles.gradesList}>
          {grades.map((gradeTitle, idx) => {
            return (
              <TouchableOpacity 
                key={idx} 
                style={[styles.gradeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('EducationBooksScreen', { subject, level, field, grade: gradeTitle })}
              >
                <View style={[styles.iconBox, { backgroundColor: `${colors.primary}15` }]}>
                  <GraduationCap color={colors.primary} size={28} />
                </View>
                <Text style={[styles.gradeTitle, { color: colors.text }]}>پایه {gradeTitle}</Text>
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
  breadcrumbText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
  },
  breadcrumbIcon: {
    marginHorizontal: 4,
  },

  pageTitleContainer: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },

  gradesList: {
    gap: 16,
  },
  gradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  gradeTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  }
});

export default EducationGradeScreen;
