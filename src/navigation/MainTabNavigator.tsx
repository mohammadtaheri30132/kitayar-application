import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Home, Users, Wrench, MessageCircle, BookOpen } from 'lucide-react-native';

import DashboardScreen from '../screens/main/DashboardScreen';
import TeacherToolsScreen from '../screens/tools/TeacherToolsScreen';
import ClassManagementScreen from '../screens/classes/ClassManagementScreen';
import InteractionScreen from '../screens/interaction/InteractionScreen';
import EducationDashboardScreen from '../screens/education/EducationDashboardScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          minHeight: 65 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
          fontFamily: 'IRANSansMobile', // Fallback if available
        },
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;
          
          if (route.name === 'HomeTab') IconComponent = Home;
          else if (route.name === 'EducationTab') IconComponent = BookOpen;
          else if (route.name === 'InteractionTab') IconComponent = MessageCircle;
          else if (route.name === 'ToolsTab') IconComponent = Wrench;
          else if (route.name === 'ClassTab') IconComponent = Users;
          
          return <IconComponent size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={DashboardScreen} 
        options={{ title: 'خانه' }} 
      />
      <Tab.Screen 
        name="EducationTab" 
        component={EducationDashboardScreen} 
        options={{ title: 'آموزشیار' }} 
      />
      <Tab.Screen 
        name="InteractionTab" 
        component={InteractionScreen} 
        options={{ title: 'تعامل' }} 
      />
      <Tab.Screen 
        name="ToolsTab" 
        component={TeacherToolsScreen} 
        options={{ title: 'ابزار معلم' }} 
      />
      <Tab.Screen 
        name="ClassTab" 
        component={ClassManagementScreen} 
        options={{ title: 'مدیریت کلاس' }} 
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
