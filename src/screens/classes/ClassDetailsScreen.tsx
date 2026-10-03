import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Settings, Users, BookOpen, BarChart2, Gift, Calendar, CheckSquare } from 'lucide-react-native';

const ClassDetailsScreen = ({ route, navigation }: any) => {
  const { classroom, classId, className } = route.params;
  const currentClassId = classId || classroom?._id;
  const currentClassName = className || classroom?.name;
  const insets = useSafeAreaInsets();

  const menuItems = [
    {
      id: 'GRADEBOOK',
      title: 'دفتر نمره',
      icon: <BookOpen size={32} color={COLORS.primary} />,
      route: 'GradebookOverviewScreen'
    },
    {
      id: 'STUDENTS',
      title: 'دانش‌آموزان',
      icon: <Users size={32} color={COLORS.primary} />,
      route: 'ClassStudentsScreen'
    },
    {
      id: 'EXAMS',
      title: 'آزمون‌ها',
      icon: <BookOpen size={32} color={COLORS.primary} />,
      route: 'ClassExamsScreen'
    },
    {
      id: 'REPORTS',
      title: 'گزارشات',
      icon: <BarChart2 size={32} color={COLORS.primary} />,
      route: 'ClassReportsScreen'
    },
    {
      id: 'BIRTHDAYS',
      title: 'تولدها',
      icon: <Gift size={32} color={COLORS.primary} />,
      route: 'ClassBirthdaysScreen'
    },
    {
      id: 'SCHEDULE',
      title: 'برنامه هفتگی',
      icon: <Calendar size={32} color={COLORS.primary} />,
      route: 'WeeklyScheduleBuilderScreen'
    },
    {
      id: 'ATTENDANCE',
      title: 'حضور و غیاب',
      icon: <CheckSquare size={32} color={COLORS.primary} />,
      route: 'ClassAttendanceScreen'
    }
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronRight size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{currentClassName}</Text>
          <Text style={styles.headerSubtitle}>داشبورد کلاس</Text>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => navigation.navigate('ClassSettingsScreen', { classroom, classId: currentClassId, className: currentClassName })}
        >
          <Settings size={24} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.gridContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.gridItem}
              onPress={() => {
                if (item.route === 'WeeklyScheduleBuilderScreen') {
                  navigation.navigate(item.route, { 
                    classId: currentClassId, 
                    className: currentClassName,
                    schoolName: classroom?.school?.name || ''
                  });
                } else {
                  navigation.navigate(item.route, { classroom, currentClassId, currentClassName });
                }
              }}
            >
              <View style={styles.iconContainer}>
                {item.icon}
              </View>
              <Text style={styles.gridItemTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: COLORS.surface, elevation: 2 },
  backButton: { padding: 8 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  settingsButton: { padding: 8 },
  
  content: { flexGrow: 1, padding: 20 },
  gridContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '31%', // 3 columns
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridItemTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  }
});

export default ClassDetailsScreen;
