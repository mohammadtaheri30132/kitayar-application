import React, { useContext, useEffect } from 'react';
import { StatusBar, ActivityIndicator, View, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { FeedbackProvider } from './src/components/feedback/FeedbackContext';

import PhoneCheckScreen from './src/screens/auth/PhoneCheckScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import LoginPasswordScreen from './src/screens/auth/LoginPasswordScreen';

import MainTabNavigator from './src/navigation/MainTabNavigator';
import ClassManagementScreen from './src/screens/classes/ClassManagementScreen';
import CreateClassScreen from './src/screens/classes/CreateClassScreen';
import ClassDetailsScreen from './src/screens/classes/ClassDetailsScreen';
import ClassChatScreen from './src/screens/classes/ClassChatScreen';
import ClassStudentsScreen from './src/screens/classes/ClassStudentsScreen';
import ClassExamsScreen from './src/screens/classes/ClassExamsScreen';
import ClassReportsScreen from './src/screens/classes/ClassReportsScreen';
import ClassBirthdaysScreen from './src/screens/classes/ClassBirthdaysScreen';
import ClassAttendanceScreen from './src/screens/classes/ClassAttendanceScreen';
import TakeAttendanceScreen from './src/screens/classes/TakeAttendanceScreen';
import ClassSettingsScreen from './src/screens/classes/ClassSettingsScreen';
import ManageSchoolsScreen from './src/screens/classes/ManageSchoolsScreen';
import ManageClassesScreen from './src/screens/classes/ManageClassesScreen';
import AddStudentToClassScreen from './src/screens/classes/AddStudentToClassScreen';
import CreateSchoolScreen from './src/screens/classes/CreateSchoolScreen';
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
import ToolsListScreen from './src/screens/tools/ToolsListScreen';
import AddNoteScreen from './src/screens/planning/AddNoteScreen';
import CreateHomeworkScreen from './src/screens/homework/CreateHomeworkScreen';
import HomeworkListScreen from './src/screens/homework/HomeworkListScreen';
import HomeworkDetailsScreen from './src/screens/homework/HomeworkDetailsScreen';
import ExamSettingsScreen from './src/screens/exams/ExamSettingsScreen';
import MobileQuestionBuilder from './src/screens/question/MobileQuestionBuilder';
import PreviewExamScreen from './src/screens/question/PreviewExamScreen';
import { initializeSslPinning } from 'react-native-ssl-public-key-pinning';
import SwapQuestionScreen from './src/screens/question/SwapQuestionScreen';
import ManageQuestionsScreen from './src/screens/question/ManageQuestionsScreen';
import QuestionSettingsScreen from './src/screens/question/QuestionSettingsScreen';
import PdfConverterScreen from './src/screens/tools/PdfConverterScreen';
import ConverterScreen from './src/screens/tools/ConverterScreen';
import PdfViewerScreen from './src/screens/tools/PdfViewerScreen';
import ImageViewerScreen from './src/screens/tools/ImageViewerScreen';
import ImageCompressorScreen from './src/screens/tools/ImageCompressorScreen';
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
import DocumentScannerScreen from './src/screens/scanner/DocumentScannerScreen';
import CropAdjustmentScreen from './src/screens/scanner/CropAdjustmentScreen';
import ScannerPreviewScreen from './src/screens/scanner/ScannerPreviewScreen';
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
import PrayerTimesScreen from './src/screens/tools/PrayerTimesScreen';
import InfiniteCanvasScreen from './src/screens/tools/canvas/InfiniteCanvasScreen';
import { MusicPlayerProvider } from './src/context/MusicPlayerContext';
import { MusicMainScreen } from './src/screens/tools/music/MusicMainScreen';
import { MusicCategoryTracksScreen } from './src/screens/tools/music/MusicCategoryTracksScreen';
import { MiniMusicPlayer } from './src/components/music/MiniMusicPlayer';
import { MusicPlayerScreen } from './src/screens/tools/music/MusicPlayerScreen';
import { BarcodeHubScreen } from './src/screens/tools/barcode/BarcodeHubScreen';
import { BarcodeScannerScreen } from './src/screens/tools/barcode/BarcodeScannerScreen';
import { BarcodeGeneratorScreen } from './src/screens/tools/barcode/BarcodeGeneratorScreen';
import { QiblaCompassScreen } from './src/screens/tools/sensors/QiblaCompassScreen';
import { CompassScreen } from './src/screens/tools/sensors/CompassScreen';
import { SoundMeterScreen } from './src/screens/tools/sensors/SoundMeterScreen';
import { LightMeterScreen } from './src/screens/tools/sensors/LightMeterScreen';
import { ProtractorScreen } from './src/screens/tools/sensors/ProtractorScreen';
import { SeismographScreen } from './src/screens/tools/sensors/SeismographScreen';
import { QuranSurahListScreen } from './src/screens/tools/quran/QuranSurahListScreen';
import { QuranReaderScreen } from './src/screens/tools/quran/QuranReaderScreen';
import { PhonebookScreen } from './src/screens/tools/phonebook/PhonebookScreen';
import { IrRemoteHubScreen } from './src/screens/tools/ir/IrRemoteHubScreen';
import { IrSetupWizardScreen } from './src/screens/tools/ir/IrSetupWizardScreen';
import { IrRemoteControlScreen } from './src/screens/tools/ir/IrRemoteControlScreen';
// Planning Screens
import CalendarScreen from './src/screens/main/CalendarScreen';
import CreateEventScreen from './src/screens/main/CreateEventScreen';
import TasksScreen from './src/screens/main/TasksScreen';
import DailyNotesScreen from './src/screens/main/DailyNotesScreen';
import WeeklyScheduleScreen from './src/screens/main/WeeklyScheduleScreen';
import NotificationsScreen from './src/screens/main/NotificationsScreen';


// Interaction Module
import QuestionDetailScreen from './src/screens/interaction/details/QuestionDetailScreen';
import PostDetailScreen from './src/screens/interaction/details/PostDetailScreen';
import NewsDetailScreen from './src/screens/interaction/details/NewsDetailScreen';
import NewQuestionScreen from './src/screens/interaction/create/NewQuestionScreen';
import NewPostScreen from './src/screens/interaction/create/NewPostScreen';
import NewsSettingsScreen from './src/screens/interaction/settings/NewsSettingsScreen';

import TeacherQuestionBankScreen from './src/screens/question/TeacherQuestionBankScreen';
import CreateTeacherQuestionScreen from './src/screens/question/CreateTeacherQuestionScreen';

// Form Builder & Survey Platform Screens
import FormDashboardScreen from './src/screens/forms/FormDashboardScreen';
import FormTemplateGalleryScreen from './src/screens/forms/FormTemplateGalleryScreen';
import CreateOrEditFormScreen from './src/screens/forms/CreateOrEditFormScreen';
import FormPreviewScreen from './src/screens/forms/FormPreviewScreen';
import FormResponsesScreen from './src/screens/forms/FormResponsesScreen';

// Smart Exam Sheets Screens
import SmartSheetHubScreen from './src/screens/smartsheet/SmartSheetHubScreen';
import CreateSmartExamScreen from './src/screens/smartsheet/CreateSmartExamScreen';
import GeneratedSheetsPreviewScreen from './src/screens/smartsheet/GeneratedSheetsPreviewScreen';
import SmartSheetScannerScreen from './src/screens/smartsheet/SmartSheetScannerScreen';
import GradingReviewScreen from './src/screens/smartsheet/GradingReviewScreen';
import ManualGradingScreen from './src/screens/smartsheet/ManualGradingScreen';
import ExamSheetsResultsScreen from './src/screens/smartsheet/ExamSheetsResultsScreen';
import SupportTicketsScreen from './src/screens/support/SupportTicketsScreen';

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
            <Stack.Screen name="PrayerTimesScreen" component={PrayerTimesScreen} />
            <Stack.Screen name="StopwatchScreen" component={StopwatchScreen} options={{ title: 'کرنومتر' }} />
            <Stack.Screen name="IntervalTimerScreen" component={IntervalTimerScreen} options={{ title: 'تایمر اینتروال' }} />
            <Stack.Screen name="RepCounterScreen" component={RepCounterScreen} options={{ title: 'شمارش ست و تکرار' }} />
            <Stack.Screen name="RandomStudentScreen" component={RandomStudentScreen} options={{ title: 'انتخاب تصادفی' }} />
            <Stack.Screen name="GroupDividerScreen" component={GroupDividerScreen} options={{ title: 'تقسیم گروه‌ها' }} />
            <Stack.Screen name="ClassManagementScreen" component={ClassManagementScreen} />
            <Stack.Screen name="CreateClassScreen" component={CreateClassScreen} />
            <Stack.Screen name="ClassDetailsScreen" component={ClassDetailsScreen} />
            <Stack.Screen name="ClassStudentsScreen" component={ClassStudentsScreen} />
            <Stack.Screen name="ClassExamsScreen" component={ClassExamsScreen} />
            <Stack.Screen name="ClassReportsScreen" component={ClassReportsScreen} />
            <Stack.Screen name="ClassBirthdaysScreen" component={ClassBirthdaysScreen} />
            <Stack.Screen name="ClassAttendanceScreen" component={ClassAttendanceScreen} />
            <Stack.Screen name="ClassChatScreen" component={ClassChatScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TakeAttendanceScreen" component={TakeAttendanceScreen} />
            <Stack.Screen name="ClassSettingsScreen" component={ClassSettingsScreen} />
            <Stack.Screen name="ManageSchoolsScreen" component={ManageSchoolsScreen} />
            <Stack.Screen name="ManageClassesScreen" component={ManageClassesScreen} />
            <Stack.Screen name="AddStudentToClassScreen" component={AddStudentToClassScreen} />
            <Stack.Screen name="CreateSchoolScreen" component={CreateSchoolScreen} />
            <Stack.Screen name="StudentProfileViewScreen" component={StudentProfileViewScreen} />
            <Stack.Screen name="AddNoteScreen" component={AddNoteScreen} />
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
            <Stack.Screen name="SupportTicketsScreen" component={SupportTicketsScreen} />
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
            <Stack.Screen name="DocumentScannerScreen" component={DocumentScannerScreen} />
            <Stack.Screen name="CropAdjustmentScreen" component={CropAdjustmentScreen} />
            <Stack.Screen name="ScannerPreviewScreen" component={ScannerPreviewScreen} />
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
            <Stack.Screen name="InfiniteCanvasScreen" component={InfiniteCanvasScreen} options={{ headerShown: false }} />
            <Stack.Screen name="MusicMainScreen" component={MusicMainScreen} options={{ headerShown: false }} />
            <Stack.Screen name="MusicCategoryTracksScreen" component={MusicCategoryTracksScreen} options={{ headerShown: false }} />
            <Stack.Screen name="BarcodeHubScreen" component={BarcodeHubScreen} options={{ headerShown: false }} />
            <Stack.Screen name="BarcodeScannerScreen" component={BarcodeScannerScreen} options={{ headerShown: false }} />
            <Stack.Screen name="BarcodeGeneratorScreen" component={BarcodeGeneratorScreen} options={{ headerShown: false }} />
            <Stack.Screen name="QiblaCompassScreen" component={QiblaCompassScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CompassScreen" component={CompassScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SoundMeterScreen" component={SoundMeterScreen} options={{ headerShown: false }} />
            <Stack.Screen name="LightMeterScreen" component={LightMeterScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ProtractorScreen" component={ProtractorScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SeismographScreen" component={SeismographScreen} options={{ headerShown: false }} />
            <Stack.Screen name="QuranSurahListScreen" component={QuranSurahListScreen} options={{ headerShown: false }} />
            <Stack.Screen name="QuranReaderScreen" component={QuranReaderScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PhonebookScreen" component={PhonebookScreen} options={{ headerShown: false }} />
            <Stack.Screen name="IrRemoteHubScreen" component={IrRemoteHubScreen} options={{ headerShown: false }} />
            <Stack.Screen name="IrSetupWizardScreen" component={IrSetupWizardScreen} options={{ headerShown: false }} />
            <Stack.Screen name="IrRemoteControlScreen" component={IrRemoteControlScreen} options={{ headerShown: false }} />
            
            {/* Teacher Planning System Screens */}
            <Stack.Screen name="CreateEventScreen" component={CreateEventScreen} />
            <Stack.Screen name="TasksScreen" component={TasksScreen} />
            <Stack.Screen name="DailyNotesScreen" component={DailyNotesScreen} />
            <Stack.Screen name="WeeklyScheduleScreen" component={WeeklyScheduleScreen} />

            {/* Homework Management Screens */}
            <Stack.Screen name="CreateHomeworkScreen" component={CreateHomeworkScreen} />
            <Stack.Screen name="HomeworkListScreen" component={HomeworkListScreen} />
            <Stack.Screen name="HomeworkDetailsScreen" component={HomeworkDetailsScreen} />

            {/* Interaction Module Screens */}
            <Stack.Screen name="QuestionDetailScreen" component={QuestionDetailScreen} />
            <Stack.Screen name="PostDetailScreen" component={PostDetailScreen} />
            <Stack.Screen name="NewsDetailScreen" component={NewsDetailScreen} />
            <Stack.Screen name="NewQuestionScreen" component={NewQuestionScreen} />
            <Stack.Screen name="NewPostScreen" component={NewPostScreen} />
            <Stack.Screen name="NewsSettingsScreen" component={NewsSettingsScreen} />
            <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
            <Stack.Screen name="CalendarScreen" component={CalendarScreen} />
            

            {/* Form Builder & Survey Platform Screens */}
            <Stack.Screen name="FormDashboardScreen" component={FormDashboardScreen} />
            <Stack.Screen name="FormTemplateGalleryScreen" component={FormTemplateGalleryScreen} />
            <Stack.Screen name="CreateOrEditFormScreen" component={CreateOrEditFormScreen} />
            <Stack.Screen name="FormPreviewScreen" component={FormPreviewScreen} />
            <Stack.Screen name="FormResponsesScreen" component={FormResponsesScreen} />

            {/* Smart Exam Sheets Screens */}
            <Stack.Screen name="SmartSheetHubScreen" component={SmartSheetHubScreen} />
            <Stack.Screen name="CreateSmartExamScreen" component={CreateSmartExamScreen} />
            <Stack.Screen name="GeneratedSheetsPreviewScreen" component={GeneratedSheetsPreviewScreen} />
            <Stack.Screen name="SmartSheetScannerScreen" component={SmartSheetScannerScreen} />
            <Stack.Screen name="GradingReviewScreen" component={GradingReviewScreen} />
            <Stack.Screen name="ManualGradingScreen" component={ManualGradingScreen} />
            <Stack.Screen name="ExamSheetsResultsScreen" component={ExamSheetsResultsScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>

      {/* Global Mini Music Player and Full Player Modal for continuous browsing */}
      {userToken != null && (
        <>
          <MiniMusicPlayer />
          <MusicPlayerScreen />
        </>
      )}
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <FeedbackProvider>
          <AuthProvider>
            <MusicPlayerProvider>
              <AppContent />
            </MusicPlayerProvider>
          </AuthProvider>
        </FeedbackProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;