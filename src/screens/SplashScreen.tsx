import React, { useContext } from 'react';
import { View, Image, ActivityIndicator, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { AuthContext } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const { connectionError, retryConnection } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/image/logo/kitayar_typo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <View style={styles.loadingContainer}>
        {!connectionError ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : null}
      </View>

      {/* نمایش خطای اتصال به صورت باتم شیت / مدال */}
      {connectionError && (
        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetHandle} />
          <WifiOff size={64} color={COLORS.error || '#ef4444'} style={{ marginBottom: 16 }} />
          <Text style={styles.errorTitle}>خطا در ارتباط با سرور</Text>
          <Text style={styles.errorDesc}>اتصال اینترنت برقرار نیست یا سرور پاسخ نمی‌دهد.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={retryConnection}>
            <Text style={styles.retryBtnText}>تلاش مجدد</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f1f6',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 300,
    height: 130,
  },
  loadingContainer: {
    paddingBottom: 50,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: width,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  errorDesc: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  retryBtnText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default SplashScreen;
