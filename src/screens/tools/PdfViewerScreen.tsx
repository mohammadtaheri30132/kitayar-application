import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../../theme/colors';

const PdfViewerScreen = ({ route }) => {
  const { path } = route.params;
  const validUrl = path.startsWith('file://') ? path : `file://${path}`;

  return (
    <View style={styles.container}>
    
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  pdf: { flex: 1, width: '100%', height: '100%' }
});

export default PdfViewerScreen;