import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import GlobalHeader from '../../components/common/GlobalHeader';
import { ChevronLeft, Wrench, PenTool, Radio, GraduationCap } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const EducationElementaryScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const { subjectTitle = 'آموزگار', subjectColor = '#3b82f6' } = route.params || {};

  const tools = [
    { id: 1, title: 'کمک ابزار کلاسی', icon: Wrench, color: '#f59e0b' },
    { id: 2, title: 'ساخت آزمون', icon: PenTool, color: '#10b981' },
    { id: 3, title: 'برگزاری آزمون آنلاین', icon: Radio, color: '#8b5cf6' },
  ];

  const grades = ['اول', 'دوم', 'سوم', 'چهارم', 'پنجم', 'ششم'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <GlobalHeader onProfilePress={() => navigation.navigate('ProfileScreen')} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <Text style={[styles.breadcrumbText, { color: colors.primary, fontWeight: 'bold' }]}>{subjectTitle}</Text>
        </View>

        {/* Tools Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>ابزارهای کاربردی</Text>
        <View style={styles.toolsContainer}>
          {tools.map(tool => {
            const IconComponent = tool.icon;
            return (
              <TouchableOpacity 
                key={tool.id} 
                style={[styles.toolCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.8}
              >
                <View style={[styles.toolIconBox, { backgroundColor: `${tool.color}15` }]}>
                  <IconComponent color={tool.color} size={28} />
                </View>
                <Text style={[styles.toolTitle, { color: colors.text }]}>{tool.title}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Grades Section */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 32 }]}>پایه‌های تدریس</Text>
        <View style={styles.gradesList}>
          {grades.map((grade, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={[styles.gradeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('EducationBooksScreen', { subject: subjectTitle, level: 'ابتدایی', grade })}
            >
              <View style={[styles.iconBox, { backgroundColor: `${subjectColor}15` }]}>
                <GraduationCap color={subjectColor} size={28} />
              </View>
              <Text style={[styles.gradeTitle, { color: colors.text }]}>پایه {grade}</Text>
              <ChevronLeft color={colors.textLight} size={20} />
            </TouchableOpacity>
          ))}
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
  },
  breadcrumbText: {
    fontSize: 16,
    fontFamily: 'IRANSansX',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    marginBottom: 16,
  },

  toolsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toolCard: {
    width: (width - 32 - 16) / 3, // 3 columns
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  toolIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  toolTitle: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  gradesList: {
    gap: 12,
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
    width: 52,
    height: 52,
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

export default EducationElementaryScreen;
