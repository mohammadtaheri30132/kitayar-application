import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TextInput, ScrollView, 
  TouchableOpacity, KeyboardAvoidingView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { ChevronLeft, ArrowUpDown } from 'lucide-react-native';
import { conversionData, convertUnit, CategoryId, Unit } from '../../../utils/conversion/units';
import { CustomDropdown } from '../../../components/common/CustomDropdown';

const UnitConverterScreen = ({ route, navigation }: any) => {
  const { category }: { category: CategoryId } = route.params || {};
  const { colors, isDark } = useTheme();

  const data = conversionData[category];

  const [fromUnit, setFromUnit] = useState<string>('');
  const [toUnit, setToUnit] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('1');

  useEffect(() => {
    if (data && data.units.length >= 2) {
      setFromUnit(data.units[0].id);
      setToUnit(data.units[1].id);
    }
  }, [data]);

  const parsedValue = parseFloat(inputValue);
  
  const result = useMemo(() => {
    if (!data || !fromUnit || !toUnit || isNaN(parsedValue)) return '0';
    const res = convertUnit(parsedValue, category, fromUnit, toUnit);
    return res.toLocaleString('en-US', { maximumFractionDigits: 6 });
  }, [data, fromUnit, toUnit, parsedValue, category]);

  if (!data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>دسته‌بندی نامعتبر</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const dropdownItems = data ? data.units.map(u => ({
    id: u.id,
    label: `${u.name} (${u.symbol})`,
    value: u.id
  })) : [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color={colors.textLight} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>تبدیل {data.name}</Text>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { color: colors.primary, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                value={inputValue}
                onChangeText={setInputValue}
                keyboardType="numeric"
                selectTextOnFocus
              />
            </View>

            <CustomDropdown
              label="از واحد:"
              items={dropdownItems}
              selectedValue={fromUnit}
              onSelect={(item) => setFromUnit(item.value)}
            />

            <View style={styles.swapContainer}>
              <TouchableOpacity onPress={handleSwap} style={[styles.swapButton, { backgroundColor: colors.border }]}>
                <ArrowUpDown color={colors.text} size={20} />
              </TouchableOpacity>
            </View>

            <CustomDropdown
              label="به واحد:"
              items={dropdownItems}
              selectedValue={toUnit}
              onSelect={(item) => setToUnit(item.value)}
            />

            <View style={[styles.resultContainer, { backgroundColor: isDark ? '#0f172a' : '#f0fdf4', borderColor: colors.border }]}>
              <Text style={[styles.resultLabel, { color: colors.textLight }]}>نتیجه:</Text>
              <Text style={[styles.resultValue, { color: colors.primary }]} numberOfLines={1} adjustsFontSizeToFit>
                {result}
              </Text>
              <Text style={[styles.resultSymbol, { color: colors.text }]}>
                {data.units.find(u => u.id === toUnit)?.symbol}
              </Text>
            </View>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  backButton: { padding: 8, width: 40 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  swapContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  swapButton: {
    padding: 12,
    borderRadius: 30,
  },
  resultContainer: {
    marginTop: 24,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  resultSymbol: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 4,
  }
});

export default UnitConverterScreen;
