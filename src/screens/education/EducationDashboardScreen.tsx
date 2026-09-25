import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import GlobalHeader from '../../components/common/GlobalHeader';
import { BookOpen, Calculator, Beaker, Zap, TestTube, Languages, Globe, Palette, BookText, FileText, FlaskConical, PenTool, Brain, Dumbbell, Monitor, Microscope } from 'lucide-react-native';

const { width } = Dimensions.get('window');

// --- MOCK DATA ---
const subjects = [
  { id: '1', title: 'آموزگار', icon: BookOpen, color: '#3b82f6', isElementary: true },
  { id: '2', title: 'دبیر ریاضی', icon: Calculator, color: '#f59e0b', isElementary: false },
  { id: '3', title: 'دبیر علوم', icon: Microscope, color: '#10b981', isElementary: false },
  { id: '4', title: 'دبیر فیزیک', icon: Zap, color: '#8b5cf6', isElementary: false },
  { id: '5', title: 'دبیر شیمی', icon: FlaskConical, color: '#ec4899', isElementary: false },
  { id: '6', title: 'دبیر زیست', icon: Brain, color: '#84cc16', isElementary: false },
  { id: '7', title: 'دبیر فارسی', icon: PenTool, color: '#06b6d4', isElementary: false },
  { id: '8', title: 'دبیر عربی', icon: Languages, color: '#14b8a6', isElementary: false },
  { id: '9', title: 'دبیر انگلیسی', icon: Globe, color: '#6366f1', isElementary: false },
  { id: '10', title: 'مطالعات', icon: BookText, color: '#d946ef', isElementary: false },
  { id: '11', title: 'دبیر تاریخ', icon: FileText, color: '#f97316', isElementary: false },
  { id: '12', title: 'دبیر جغرافیا', icon: Globe, color: '#0ea5e9', isElementary: false },
  { id: '13', title: 'دینی و قرآن', icon: BookOpen, color: '#10b981', isElementary: false },
  { id: '14', title: 'کار و فناوری', icon: Monitor, color: '#64748b', isElementary: false },
  { id: '15', title: 'دبیر هنر', icon: Palette, color: '#f43f5e', isElementary: false },
  { id: '16', title: 'تربیت بدنی', icon: Dumbbell, color: '#eab308', isElementary: false },
];

const EducationDashboardScreen = ({ navigation }: any) => {
  const { colors } = useTheme();

  const handleSubjectPress = (subject: typeof subjects[0]) => {
    if (subject.isElementary) {
      navigation.navigate('EducationElementaryScreen', { subjectTitle: subject.title, subjectColor: subject.color });
    } else {
      navigation.navigate('EducationSubjectScreen', { subjectTitle: subject.title, subjectColor: subject.color });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <GlobalHeader onProfilePress={() => navigation.navigate('ProfileScreen')} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Page Title */}
        <View style={styles.pageTitleContainer}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>آموزشیار</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textLight }]}>محتوای آموزشی و ابزارهای کمک‌آموزشی</Text>
        </View>

        {/* 3-COLUMN SUBJECT GRID */}
        <View style={styles.gridContainer}>
          {subjects.map((subject) => {
            const IconComponent = subject.icon;
            return (
              <TouchableOpacity
                key={subject.id}
                style={[styles.subjectCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={() => handleSubjectPress(subject)}
              >
                <View style={[styles.iconBox, { backgroundColor: `${subject.color}15` }]}>
                  <IconComponent color={subject.color} size={36} strokeWidth={1.5} />
                </View>
                <Text style={[styles.subjectText, { color: colors.text }]} numberOfLines={2}>
                  {subject.title}
                </Text>
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
  
  pageTitleContainer: {
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    fontFamily: 'IRANSansX',
  },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  subjectCard: {
    width: (width - 32 - 32) / 3, // 3 columns, padding 16*2, gap 16*2
    aspectRatio: 0.85,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectText: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 20,
  }
});

export default EducationDashboardScreen;
