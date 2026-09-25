import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, I18nManager, Animated, ScrollView } from 'react-native';
import { Dices, Users } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';

const RandomStudentScreen = () => {
  const { colors } = useTheme();
  
  const [namesText, setNamesText] = useState('');
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePickRandom = () => {
    const names = namesText.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    if (names.length === 0) return;

    setIsRolling(true);
    setSelectedName('...');
    
    // Animate
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0.5, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    // Fake rolling effect
    let count = 0;
    const interval = setInterval(() => {
      const randomFake = names[Math.floor(Math.random() * names.length)];
      setSelectedName(randomFake);
      count++;
      
      if (count > 15) {
        clearInterval(interval);
        const finalSelection = names[Math.floor(Math.random() * names.length)];
        setSelectedName(finalSelection);
        setIsRolling(false);
        
        // Final pop animation
        Animated.sequence([
          Animated.spring(scaleAnim, { toValue: 1.5, friction: 3, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true })
        ]).start();
      }
    }, 50);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.inputHeader}>
          <Users color={colors.textLight} size={20} />
          <Text style={[styles.inputLabel, { color: colors.textLight }]}>
            اسامی دانش‌آموزان را وارد کنید (هر خط یک نفر)
          </Text>
        </View>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
          multiline
          numberOfLines={6}
          placeholder="مثال:&#10;علی احمدی&#10;رضا حسینی&#10;محمد کریمی"
          placeholderTextColor={colors.textLight}
          value={namesText}
          onChangeText={setNamesText}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity 
        style={[styles.btn, { backgroundColor: colors.primary, opacity: isRolling || namesText.trim().length === 0 ? 0.7 : 1 }]} 
        onPress={handlePickRandom}
        disabled={isRolling || namesText.trim().length === 0}
      >
        <Dices color="#fff" size={24} />
        <Text style={styles.btnText}>انتخاب تصادفی</Text>
      </TouchableOpacity>

      <View style={[styles.resultContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.resultLabel, { color: colors.textLight }]}>شخص انتخاب شده:</Text>
        {selectedName ? (
          <Animated.Text style={[styles.resultName, { color: colors.primary, transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
            {selectedName}
          </Animated.Text>
        ) : (
          <Text style={[styles.resultPlaceholder, { color: colors.textLight }]}>هنوز کسی انتخاب نشده است</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, flexGrow: 1 },
  inputContainer: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
  inputHeader: { flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse', alignItems: 'center', marginBottom: 12 },
  inputLabel: { marginHorizontal: 8, fontFamily: 'IRANSansX', fontSize: 14 },
  input: { 
    height: 150, borderRadius: 12, borderWidth: 1, padding: 12, 
    fontFamily: 'IRANSansX', textAlign: I18nManager.isRTL ? 'right' : 'left' 
  },
  btn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    padding: 16, borderRadius: 16, marginBottom: 32 
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', fontFamily: 'IRANSansX', marginHorizontal: 8 },
  resultContainer: { 
    padding: 32, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', minHeight: 200
  },
  resultLabel: { fontSize: 14, fontFamily: 'IRANSansX', marginBottom: 24 },
  resultName: { fontSize: 32, fontWeight: 'bold', fontFamily: 'IRANSansX', textAlign: 'center' },
  resultPlaceholder: { fontSize: 16, fontFamily: 'IRANSansX', opacity: 0.5 }
});

export default RandomStudentScreen;
