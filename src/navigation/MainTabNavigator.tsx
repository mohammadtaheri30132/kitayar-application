import React from 'react';
import { View, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Home, Users, Wrench, MessageCircle } from 'lucide-react-native';

import DashboardScreen from '../screens/main/DashboardScreen';
import TeacherAssistantScreen from '../screens/tools/TeacherAssistantScreen';
import ClassManagementScreen from '../screens/classes/ClassManagementScreen';
import InteractionScreen from '../screens/interaction/InteractionScreen';
import TeacherCenterScreen from '../screens/teacherCenter/TeacherCenterScreen';

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
          fontSize: 11,
          fontFamily: 'Estedad-FD-Bold',
          marginTop: -2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'TeacherCenterTab') {
            return (
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  borderWidth: focused ? 2 : 1.2,
                  borderColor: focused ? colors.primary : (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)'),
                  overflow: 'hidden',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Image
                  source={{ uri: 'https://i.pravatar.cc/150?u=kitayar@teacher.com' }}
                  style={{
                    width: '100%',
                    height: '100%',
                    opacity: focused ? 1 : 0.75,
                  }}
                  resizeMode="cover"
                />
              </View>
            );
          }

          let IconComponent: any = Home;
          
          if (route.name === 'HomeTab') IconComponent = Home;
          else if (route.name === 'InteractionTab') IconComponent = MessageCircle;
          else if (route.name === 'ToolsTab') IconComponent = Wrench;
          else if (route.name === 'ClassTab') IconComponent = Users;
          
          return <IconComponent size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="ClassTab" 
        component={ClassManagementScreen} 
        options={{ title: 'مدیریت کلاس' }} 
      />
      <Tab.Screen 
        name="ToolsTab" 
        component={TeacherAssistantScreen} 
        options={{ 
          title: 'دستیار معلم',
          lazy: false,
        }} 
      />
      <Tab.Screen 
        name="HomeTab" 
        component={DashboardScreen} 
        options={{ title: 'خانه' }} 
      />
      <Tab.Screen 
        name="InteractionTab" 
        component={InteractionScreen} 
        options={{ title: 'تعامل' }} 
      />
      <Tab.Screen 
        name="TeacherCenterTab" 
        component={TeacherCenterScreen} 
        options={{ title: 'میز کار' }} 
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
