import React, { useContext, useEffect } from 'react';
import { StatusBar, ActivityIndicator, View, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

import PhoneCheckScreen from './src/screens/auth/PhoneCheckScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import LoginPasswordScreen from './src/screens/auth/LoginPasswordScreen';

import MainTabNavigator from './src/navigation/MainTabNavigator';
import ClassManagementScreen from './src/screens/classes/ClassManagementScreen';
import CreateClassScreen from './src/screens/classes/CreateClassScreen';
import ClassDetailsScreen from './src/screens/classes/ClassDetailsScreen';
import ManageSchoolsScreen from './src/screens/classes/ManageSchoolsScreen';
import ManageClassesScreen from './src/screens/classes/ManageClassesScreen';
import WeeklyScheduleBuilderScreen from './src/screens/main/WeeklyScheduleBuilderScreen';
import CreateExamStep1Screen from './src/screens/exams/CreateExamStep1Screen';
import CreateExamStep2Screen from './src/screens/exams/CreateExamStep2Screen';
import CreateCustomQuestionScreen from './src/screens/exams/CreateCustomQuestionScreen';
import ExamListScreen from './src/screens/exams/ExamListScreen';
import ExamDashboardScreen from './src/screens/exams/ExamDashboardScreen';
import FinalizeGradesScreen from './src/screens/exams/FinalizeGradesScreen';
import GradeStudentScreen from './src/screens/exams/GradeStudentScreen';
import StudentProfileViewScreen from './src/screens/classes/StudentProfileViewScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import SettingsScreen from './src/screens/profile/SettingsScreen';
import EditExamScreen from './src/screens/exams/EditExamScreen';
import ExamSettingsScreen from './src/screens/exams/ExamSettingsScreen';
import MobileQuestionBuilder from './src/screens/question/MobileQuestionBuilder';
import PreviewExamScreen from './src/screens/question/PreviewExamScreen'; 
import { initializeSslPinning } from 'react-native-ssl-public-key-pinning';
import SwapQuestionScreen from './src/screens/question/SwapQuestionScreen';
import ManageQuestionsScreen from './src/screens/question/ManageQuestionsScreen';
import QuestionSettingsScreen from './src/screens/question/QuestionSettingsScreen';
import ToolsListScreen from './src/screens/tools/ToolsListScreen';
import PdfConverterScreen from './src/screens/tools/PdfConverterScreen';
import ConverterScreen from './src/screens/tools/ConverterScreen';
import PdfViewerScreen from './src/screens/tools/PdfViewerScreen';
import ImageViewerScreen from './src/screens/tools/ImageViewerScreen';
import ImageCompressorScreen from './src/screens/tools/ImageCompressorScreen';
import PersianOcrScreen from './src/screens/tools/PersianOcrScreen';
import ImageConverterScreen from './src/screens/tools/Imageconverterscreen';
import CollageScreen from './src/screens/tools/CollageScreen';
import ImageResizeScreen from './src/screens/tools/ImageResizeScreen';
import ImageCropScreen from './src/screens/tools/ImageCropScreen';
import VideoTrimScreen from './src/screens/tools/VideoTrimScreen';
import VideoToAudioScreen from './src/screens/tools/VideoToAudioScreen';
import AudioToTextScreen from './src/screens/tools/AudioToTextScreen';
import DocumentToPdfScreen from './src/screens/tools/DocumentToPdfScreen';
import AdvancedPdfScreen from './src/screens/tools/AdvancedPdfScreen';
import PdfReaderScreen from './src/components/pdf/PdfReaderScreen';
import SplashScreen from './src/screens/SplashScreen';
import PlaceholderScreen from './src/components/common/PlaceholderScreen';
import GenericCategoryScreen from './src/screens/tools/GenericCategoryScreen';
import AgeCalculatorScreen from './src/screens/tools/date/AgeCalculatorScreen';
import DateDifferenceScreen from './src/screens/tools/date/DateDifferenceScreen';
import DateConverterScreen from './src/screens/tools/date/DateConverterScreen';
import DaysBetweenScreen from './src/screens/tools/date/DaysBetweenScreen';
import UnitConverterScreen from './src/screens/tools/conversion/UnitConverterScreen';
import DynamicCalculatorScreen from './src/screens/tools/DynamicCalculatorScreen';
import StopwatchScreen from './src/screens/tools/sports/StopwatchScreen';
import IntervalTimerScreen from './src/screens/tools/sports/IntervalTimerScreen';
import RepCounterScreen from './src/screens/tools/sports/RepCounterScreen';
import RandomStudentScreen from './src/screens/tools/sports/RandomStudentScreen';
import GroupDividerScreen from './src/screens/tools/sports/GroupDividerScreen';
// Planning Screens
import CalendarScreen from './src/screens/main/CalendarScreen';
import CreateEventScreen from './src/screens/main/CreateEventScreen';
import TasksScreen from './src/screens/main/TasksScreen';
import DailyNotesScreen from './src/screens/main/DailyNotesScreen';
import WeeklyScheduleScreen from './src/screens/main/WeeklyScheduleScreen';
import NotificationsScreen from './src/screens/main/NotificationsScreen';

// Education Redesign Screens (V2)
import EducationElementaryScreen from './src/screens/education/EducationElementaryScreen';
import EducationSubjectScreen from './src/screens/education/EducationSubjectScreen';
import EducationFieldScreen from './src/screens/education/EducationFieldScreen';
import EducationGradeScreen from './src/screens/education/EducationGradeScreen';
import EducationBooksScreen from './src/screens/education/EducationBooksScreen';
import EducationChaptersScreen from './src/screens/education/EducationChaptersScreen';
import EducationLessonsScreen from './src/screens/education/EducationLessonsScreen';
import EducationLessonContentScreen from './src/screens/education/EducationLessonContentScreen';

// Interaction Module
import QuestionDetailScreen from './src/screens/interaction/details/QuestionDetailScreen';
import PostDetailScreen from './src/screens/interaction/details/PostDetailScreen';
import NewsDetailScreen from './src/screens/interaction/details/NewsDetailScreen';
import NewQuestionScreen from './src/screens/interaction/create/NewQuestionScreen';
import NewPostScreen from './src/screens/interaction/create/NewPostScreen';
import NewsSettingsScreen from './src/screens/interaction/settings/NewsSettingsScreen';

import TeacherQuestionBankScreen from './src/screens/question/TeacherQuestionBankScreen';
import CreateTeacherQuestionScreen from './src/screens/question/CreateTeacherQuestionScreen';

const Stack = createNativeStackNavigator();

const AppContent = () => {
  const { isLoading, userToken } = useContext(AuthContext);
  const { colors, isDark } = useTheme();

  useEffect(() => {
    initializeSslPinning({
      '192.168.1.128': { 
        includeSubdomains: true,
        publicKeyHashes: [
          'HASH_KLID_ASLI_SHOMA', 
          'HASH_KLID_BACKUP_SHOMA' 
        ],
      },
    });
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar backgroundColor={colors.surface} barStyle={isDark ? "light-content" : "dark-content"} />
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {userToken == null ? (
          <Stack.Group>
            <Stack.Screen name="PhoneCheckScreen" component={PhoneCheckScreen} />
            <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
            <Stack.Screen name="LoginPasswordScreen" component={LoginPasswordScreen} />
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="MainTabNavigator" component={MainTabNavigator} />
            <Stack.Screen name="PlaceholderScreen" component={PlaceholderScreen} />
            <Stack.Screen name="GenericCategoryScreen" component={GenericCategoryScreen} />
            <Stack.Screen name="AgeCalculatorScreen" component={AgeCalculatorScreen} />
            <Stack.Screen name="DateDifferenceScreen" component={DateDifferenceScreen} />
            <Stack.Screen name="DateConverterScreen" component={DateConverterScreen} />
            <Stack.Screen name="DaysBetweenScreen" component={DaysBetweenScreen} />
            <Stack.Screen name="UnitConverterScreen" component={UnitConverterScreen} />
            <Stack.Screen name="DynamicCalculatorScreen" component={DynamicCalculatorScreen} />
            <Stack.Screen name="StopwatchScreen" component={StopwatchScreen} options={{ title: 'کرنومتر' }} />
            <Stack.Screen name="IntervalTimerScreen" component={IntervalTimerScreen} options={{ title: 'تایمر اینتروال' }} />
            <Stack.Screen name="RepCounterScreen" component={RepCounterScreen} options={{ title: 'شمارش ست و تکرار' }} />
            <Stack.Screen name="RandomStudentScreen" component={RandomStudentScreen} options={{ title: 'انتخاب تصادفی' }} />
            <Stack.Screen name="GroupDividerScreen" component={GroupDividerScreen} options={{ title: 'تقسیم گروه‌ها' }} />
            <Stack.Screen name="ClassManagementScreen" component={ClassManagementScreen} />
            <Stack.Screen name="CreateClassScreen" component={CreateClassScreen} />
            <Stack.Screen name="ClassDetailsScreen" component={ClassDetailsScreen} />
            <Stack.Screen name="ManageSchoolsScreen" component={ManageSchoolsScreen} />
            <Stack.Screen name="ManageClassesScreen" component={ManageClassesScreen} />
            <Stack.Screen name="StudentProfileViewScreen" component={StudentProfileViewScreen} />
            <Stack.Screen name="WeeklyScheduleBuilderScreen" component={WeeklyScheduleBuilderScreen} />
            <Stack.Screen name="CreateExamStep1Screen" component={CreateExamStep1Screen} />
            <Stack.Screen name="CreateExamStep2Screen" component={CreateExamStep2Screen} />
            <Stack.Screen name="CreateCustomQuestionScreen" component={CreateCustomQuestionScreen} />
            <Stack.Screen name="ExamListScreen" component={ExamListScreen} />
            <Stack.Screen name="ExamDashboardScreen" component={ExamDashboardScreen} />
            <Stack.Screen name="FinalizeGradesScreen" component={FinalizeGradesScreen} />
            <Stack.Screen name="GradeStudentScreen" component={GradeStudentScreen} />
            <Stack.Screen name="ExamSettingsScreen" component={ExamSettingsScreen} />
            <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
            <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
            <Stack.Screen name="EditExamScreen" component={EditExamScreen} />
            <Stack.Screen name="MobileQuestionBuilder" component={MobileQuestionBuilder} />
            <Stack.Screen name="PreviewExamScreen" component={PreviewExamScreen} />
            <Stack.Screen name="SwapQuestionScreen" component={SwapQuestionScreen} /> 
            <Stack.Screen name="ManageQuestionsScreen" component={ManageQuestionsScreen} />
            <Stack.Screen name="QuestionSettingsScreen" component={QuestionSettingsScreen} />
            
            <Stack.Screen name="TeacherQuestionBankScreen" component={TeacherQuestionBankScreen} />
            <Stack.Screen name="CreateTeacherQuestionScreen" component={CreateTeacherQuestionScreen} />

            <Stack.Screen name="ToolsListScreen" component={ToolsListScreen} />
            <Stack.Screen name="PdfConverterScreen" component={PdfConverterScreen} />
            <Stack.Screen name="ConverterScreen" component={ConverterScreen} />
            <Stack.Screen name="CollageScreen" component={CollageScreen} />
            <Stack.Screen name="PdfViewerScreen" component={PdfViewerScreen} />
            <Stack.Screen name="ImageViewerScreen" component={ImageViewerScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="ImageCompressorScreen" component={ImageCompressorScreen} />
            <Stack.Screen name="ImageConverterScreen" component={ImageConverterScreen} />
            <Stack.Screen name="ImageResizeScreen" component={ImageResizeScreen} />
            <Stack.Screen name="ImageCropScreen" component={ImageCropScreen} />
            <Stack.Screen name="VideoTrimScreen" component={VideoTrimScreen} />
            <Stack.Screen name="VideoToAudioScreen" component={VideoToAudioScreen} />
            <Stack.Screen name="DocumentToPdfScreen" component={DocumentToPdfScreen} />
            <Stack.Screen name="AudioToTextScreen" component={AudioToTextScreen} />
            <Stack.Screen name="AdvancedPdfScreen" component={AdvancedPdfScreen} />
            <Stack.Screen name="PdfReaderScreen" component={PdfReaderScreen} options={{ headerShown: false }} />
            
            {/* Teacher Planning System Screens */}
            <Stack.Screen name="CreateEventScreen" component={CreateEventScreen} />
            <Stack.Screen name="TasksScreen" component={TasksScreen} />
            <Stack.Screen name="DailyNotesScreen" component={DailyNotesScreen} />
            <Stack.Screen name="WeeklyScheduleScreen" component={WeeklyScheduleScreen} />

            {/* Interaction Module Screens */}
            <Stack.Screen name="QuestionDetailScreen" component={QuestionDetailScreen} />
            <Stack.Screen name="PostDetailScreen" component={PostDetailScreen} />
            <Stack.Screen name="NewsDetailScreen" component={NewsDetailScreen} />
            <Stack.Screen name="NewQuestionScreen" component={NewQuestionScreen} />
            <Stack.Screen name="NewPostScreen" component={NewPostScreen} />
            <Stack.Screen name="NewsSettingsScreen" component={NewsSettingsScreen} />
            <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
            <Stack.Screen name="CalendarScreen" component={CalendarScreen} />
            
            {/* Education Redesign Screens */}
            <Stack.Screen name="EducationElementaryScreen" component={EducationElementaryScreen} />
            <Stack.Screen name="EducationSubjectScreen" component={EducationSubjectScreen} />
            <Stack.Screen name="EducationFieldScreen" component={EducationFieldScreen} />
            <Stack.Screen name="EducationGradeScreen" component={EducationGradeScreen} />
            <Stack.Screen name="EducationBooksScreen" component={EducationBooksScreen} />
            <Stack.Screen name="EducationChaptersScreen" component={EducationChaptersScreen} />
            <Stack.Screen name="EducationLessonsScreen" component={EducationLessonsScreen} />
            <Stack.Screen name="EducationLessonContentScreen" component={EducationLessonContentScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;