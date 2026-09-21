import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const ImageViewerScreen = ({ route }) => {
  const { path } = route.params;
  const validUrl = path.startsWith('file://') ? path : `file://${path}`;

  return (
    <View style={styles.container}>
      <Image source={{ uri: validUrl }} style={styles.image} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%', resizeMode: 'contain' }
});

export default ImageViewerScreen;