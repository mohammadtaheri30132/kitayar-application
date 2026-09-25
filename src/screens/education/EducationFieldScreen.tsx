import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import GlobalHeader from '../../components/common/GlobalHeader';
import { ChevronLeft, ChevronRight, BookOpen, Calculator, Beaker, Library } from 'lucide-react-native';

const getFieldIcon = (fieldName: string) => {
  if (fieldName.includes('ریاضی')) return Calculator;
  if (fieldName.includes('تجربی')) return Beaker;
  if (fieldName.includes('انسانی')) return Library;
  return BookOpen;
};

const EducationFieldScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  
  // Params passed from Dashboard
  const { subject = 'دبیر ریاضی', level = 'متوسطه دوم' } = route.params || {};

  // Mock fields based on subject
  const getFields = () => {
    if (subject === 'دبیر شیمی' || subject === 'دبیر زیست') {
      return ['علوم تجربی', 'ریاضی و فیزیک'];
    }
    return ['ریاضی و فیزیک', 'علوم تجربی', 'ادبیات و علوم انسانی'];
  };

  const fields = getFields();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <GlobalHeader onProfilePress={() => navigation.navigate('ProfileScreen')} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <Text style={[styles.breadcrumbText, { color: colors.textLight }]}>{subject}</Text>
          <ChevronLeft color={colors.textLight} size={14} style={styles.breadcrumbIcon} />
          <Text style={[styles.breadcrumbText, { color: colors.primary, fontWeight: 'bold' }]}>{level}</Text>
        </View>

        {/* Page Title */}
        <View style={styles.pageTitleContainer}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>انتخاب رشته تحصیلی</Text>
        </View>

        {/* Fields List */}
        <View style={styles.fieldsList}>
          {fields.map((field, idx) => {
            const Icon = getFieldIcon(field);
            // Some subtle color differentiation
            const iconColor = idx === 0 ? '#3b82f6' : idx === 1 ? '#10b981' : '#f59e0b';
            const bgColor = idx === 0 ? '#eff6ff' : idx === 1 ? '#ecfdf5' : '#fffbeb';

            return (
              <TouchableOpacity 
                key={idx} 
                style={[styles.fieldCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('EducationGradeScreen', { subject, level, field })}
              >
                <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
                  <Icon color={iconColor} size={28} />
                </View>
                <Text style={[styles.fieldTitle, { color: colors.text }]}>{field}</Text>
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
  },
  breadcrumbText: {
    fontSize: 12,
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

  fieldsList: {
    gap: 16,
  },
  fieldCard: {
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
  fieldTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  }
});

export default EducationFieldScreen;
