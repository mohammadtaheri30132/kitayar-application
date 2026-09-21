import React, { useContext, useEffect } from 'react';
import { StatusBar, ActivityIndicator, View, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from './src/theme/colors';

import { AuthProvider, AuthContext } from './src/context/AuthContext';
import PhoneCheckScreen from './src/screens/auth/PhoneCheckScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import LoginPasswordScreen from './src/screens/auth/LoginPasswordScreen';
import DashboardScreen from './src/screens/main/DashboardScreen';
import ClassManagementScreen from './src/screens/classes/ClassManagementScreen';
import CreateClassScreen from './src/screens/classes/CreateClassScreen';
import ClassDetailsScreen from './src/screens/classes/ClassDetailsScreen';
import CreateExamStep1Screen from './src/screens/exams/CreateExamStep1Screen';
import CreateExamStep2Screen from './src/screens/exams/CreateExamStep2Screen';
import ExamListScreen from './src/screens/exams/ExamListScreen';
import ExamDashboardScreen from './src/screens/exams/ExamDashboardScreen';
import GradeStudentScreen from './src/screens/exams/GradeStudentScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import EditExamScreen from './src/screens/exams/EditExamScreen';
import ExamSettingsScreen from './src/screens/exams/ExamSettingsScreen';
import MobileQuestionBuilder from './src/screens/question/MobileQuestionBuilder';
import PreviewExamScreen from './src/screens/question/PreviewExamScreen'; // 👈 صفحه جدید اضافه شد
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
const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { isLoading, userToken } = useContext(AuthContext);

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
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar backgroundColor={COLORS.background} barStyle="dark-content" />
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {userToken == null ? (
          <Stack.Group>
            <Stack.Screen name="PhoneCheckScreen" component={PhoneCheckScreen} />
            <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
            <Stack.Screen name="LoginPasswordScreen" component={LoginPasswordScreen} />
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="DashboardScreen" component={DashboardScreen} />
            <Stack.Screen name="ClassManagementScreen" component={ClassManagementScreen} />
            <Stack.Screen name="CreateClassScreen" component={CreateClassScreen} />
            <Stack.Screen name="ClassDetailsScreen" component={ClassDetailsScreen} />
            <Stack.Screen name="CreateExamStep1Screen" component={CreateExamStep1Screen} />
            <Stack.Screen name="CreateExamStep2Screen" component={CreateExamStep2Screen} />
            <Stack.Screen name="ExamListScreen" component={ExamListScreen} />
            <Stack.Screen name="ExamDashboardScreen" component={ExamDashboardScreen} />
            <Stack.Screen name="GradeStudentScreen" component={GradeStudentScreen} />
            <Stack.Screen name="ExamSettingsScreen" component={ExamSettingsScreen} />
            <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
            <Stack.Screen name="EditExamScreen" component={EditExamScreen} />
            <Stack.Screen name="MobileQuestionBuilder" component={MobileQuestionBuilder} />
            <Stack.Screen name="PreviewExamScreen" component={PreviewExamScreen} />
            <Stack.Screen name="SwapQuestionScreen" component={SwapQuestionScreen} /> 
            <Stack.Screen name="ManageQuestionsScreen" component={ManageQuestionsScreen} />
            <Stack.Screen name="QuestionSettingsScreen" component={QuestionSettingsScreen} />
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
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
};

export default App;