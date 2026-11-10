import React from 'react';
import TeacherAssistantScreen from './TeacherAssistantScreen';

/**
 * TeacherToolsScreen forwards directly to the redesigned TeacherAssistantScreen,
 * preserving existing route references while rendering the new UI.
 */
const TeacherToolsScreen = (props: any) => {
  return <TeacherAssistantScreen {...props} />;
};

export default TeacherToolsScreen;
