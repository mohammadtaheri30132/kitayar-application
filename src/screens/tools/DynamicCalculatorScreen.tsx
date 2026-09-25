import React, { useState, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TextInput, ScrollView, 
  TouchableOpacity, KeyboardAvoidingView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { ChevronLeft } from 'lucide-react-native';
import { formulas } from '../../utils/calculators/formulas';

const DynamicCalculatorScreen = ({ route, navigation }: any) => {
  const { formulaId }: { formulaId: string } = route.params || {};
  const { colors, isDark } = useTheme();

  const definition = formulas[formulaId];
  
  // State to hold values for all dynamic inputs
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const result = useMemo(() => {
    if (!definition) return '-';
    
    const numericValues: Record<string, any> = {};
    for (const input of definition.inputs) {
      if (input.type === 'text') {
        numericValues[input.id] = inputValues[input.id] || '';
      } else {
        const val = parseFloat(inputValues[input.id]);
        numericValues[input.id] = isNaN(val) ? 0 : val;
      }
    }

    try {
      const res = definition.calculate(numericValues);
      if (typeof res === 'number') {
        // Clean up JS float weirdness, up to 4 decimal places
        return (Math.round(res * 10000) / 10000).toLocaleString('en-US', { maximumFractionDigits: 4 });
      }
      return res; // If formula returns string
    } catch (e) {
      return 'خطا در محاسبه';
    }
  }, [definition, inputValues]);

  if (!definition) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>فرمول یافت نشد</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleInputChange = (id: string, text: string, type?: string) => {
    if (type === 'text') {
      setInputValues(prev => ({ ...prev, [id]: text }));
      return;
    }
    
    // Only allow numbers and decimal points (Persian or English)
    const normalized = text.replace(/,/g, '.').replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]);
    if (/^[0-9.-]*$/.test(normalized) || normalized === '') {
      setInputValues(prev => ({ ...prev, [id]: normalized }));
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color={colors.textLight} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{definition.title}</Text>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            
            {definition.inputs.map((input) => (
              <View key={input.id} style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>{input.label}</Text>
                <TextInput
                  style={[
                    styles.input, 
                    { color: colors.primary, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }
                  ]}
                  value={inputValues[input.id] || ''}
                  onChangeText={(text) => handleInputChange(input.id, text, input.type)}
                  keyboardType={input.type === 'text' ? "default" : "numeric"}
                  placeholder={input.placeholder}
                  placeholderTextColor={colors.textLight}
                />
              </View>
            ))}

            <View style={[styles.resultContainer, { backgroundColor: isDark ? '#0f172a' : '#f0fdf4', borderColor: colors.border }]}>
              <Text style={[styles.resultLabel, { color: colors.textLight }]}>{definition.resultLabel}</Text>
              <Text style={[styles.resultValue, { color: colors.primary }]} numberOfLines={2} adjustsFontSizeToFit>
                {result}
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'right',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
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
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default DynamicCalculatorScreen;
