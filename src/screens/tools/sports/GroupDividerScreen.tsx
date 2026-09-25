import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, I18nManager, ScrollView } from 'react-native';
import { Users, LayoutGrid } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';

const GroupDividerScreen = () => {
  const { colors } = useTheme();
  
  const [namesText, setNamesText] = useState('');
  const [groupCount, setGroupCount] = useState('2');
  const [groups, setGroups] = useState<string[][]>([]);

  const handleDivide = () => {
    const names = namesText.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    const count = parseInt(groupCount, 10);
    
    if (names.length === 0 || isNaN(count) || count < 1) return;
    
    // Shuffle names array (Fisher-Yates)
    const shuffled = [...names];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Distribute into groups
    const newGroups: string[][] = Array.from({ length: count }, () => []);
    shuffled.forEach((name, index) => {
      newGroups[index % count].push(name);
    });
    
    setGroups(newGroups);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.inputHeader}>
            <Users color={colors.textLight} size={20} />
            <Text style={[styles.inputLabel, { color: colors.textLight }]}>
              اسامی را وارد کنید (هر خط یک نفر)
            </Text>
          </View>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            multiline
            numberOfLines={5}
            placeholder="مثال:&#10;علی&#10;رضا&#10;سارا"
            placeholderTextColor={colors.textLight}
            value={namesText}
            onChangeText={setNamesText}
            textAlignVertical="top"
          />
          
          <View style={styles.groupCountRow}>
            <Text style={[styles.inputLabel, { color: colors.textLight }]}>تعداد گروه‌ها:</Text>
            <TextInput
              style={[styles.countInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              keyboardType="numeric"
              value={groupCount}
              onChangeText={setGroupCount}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: colors.primary, opacity: namesText.trim().length === 0 ? 0.7 : 1 }]} 
          onPress={handleDivide}
          disabled={namesText.trim().length === 0}
        >
          <LayoutGrid color="#fff" size={24} />
          <Text style={styles.btnText}>تقسیم‌بندی گروه‌ها</Text>
        </TouchableOpacity>

        {groups.length > 0 && (
          <View style={styles.resultsContainer}>
            {groups.map((group, index) => (
              <View key={index} style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.groupTitle, { color: colors.primary }]}>گروه {index + 1}</Text>
                {group.length > 0 ? (
                  group.map((member, mIndex) => (
                    <Text key={mIndex} style={[styles.memberText, { color: colors.text }]}>
                      {mIndex + 1}. {member}
                    </Text>
                  ))
                ) : (
                  <Text style={[styles.memberText, { color: colors.textLight }]}>بدون عضو</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, flexGrow: 1 },
  inputContainer: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  inputHeader: { flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse', alignItems: 'center', marginBottom: 12 },
  inputLabel: { marginHorizontal: 8, fontFamily: 'IRANSansX', fontSize: 14 },
  input: { 
    height: 120, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16,
    fontFamily: 'IRANSansX', textAlign: I18nManager.isRTL ? 'right' : 'left' 
  },
  groupCountRow: { 
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse', 
    alignItems: 'center', justifyContent: 'space-between'
  },
  countInput: {
    width: 80, height: 40, borderRadius: 8, borderWidth: 1, textAlign: 'center',
    fontFamily: 'monospace', fontSize: 16
  },
  btn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    padding: 16, borderRadius: 16, marginBottom: 24 
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', fontFamily: 'IRANSansX', marginHorizontal: 8 },
  resultsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  groupCard: { 
    width: '48%', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 
  },
  groupTitle: { fontSize: 16, fontWeight: 'bold', fontFamily: 'IRANSansX', marginBottom: 12, textAlign: 'center' },
  memberText: { fontSize: 14, fontFamily: 'IRANSansX', marginBottom: 4, textAlign: I18nManager.isRTL ? 'right' : 'left' }
});

export default GroupDividerScreen;
