import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Info } from 'lucide-react-native';
import GlobalHeader from './GlobalHeader';

const PlaceholderScreen = ({ route }: any) => {
  const { colors } = useTheme();
  
  // Try to get title from params, otherwise use a generic one
  const title = route?.params?.title || route?.name || 'صفحه در حال ساخت';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <GlobalHeader />
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.iconBackground }]}>
          <Info size={48} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.textLight }]}>
          این بخش به‌زودی آماده می‌شود.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default PlaceholderScreen;
