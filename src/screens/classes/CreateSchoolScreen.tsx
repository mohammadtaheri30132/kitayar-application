import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { api } from '../../api/axiosConfig';
import { COLORS } from '../../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, School, MapPin, Phone, Palette, Plus } from 'lucide-react-native';

const SCHOOL_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', 
  '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', 
  '#a855f7', '#ec4899'
];

const CreateSchoolScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(SCHOOL_COLORS[6]);
  const [address, setAddress] = useState('');
  const [schoolPhone, setSchoolPhone] = useState('');
  const [principalPhone, setPrincipalPhone] = useState('');
  const [extraPhone, setExtraPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('توجه', 'لطفاً نام مدرسه را وارد کنید.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        color: selectedColor,
      };

      if (address.trim()) payload.address = address.trim();
      if (schoolPhone.trim()) payload.schoolPhone = schoolPhone.trim();
      if (principalPhone.trim()) payload.principalPhone = principalPhone.trim();
      if (extraPhone.trim()) payload.extraPhone = extraPhone.trim();

      const res = await api.post('/teacher/schools', payload);
      if (res.data.success) {
        Alert.alert('موفقیت', 'مدرسه با موفقیت ثبت شد.', [
          {
            text: 'باشه',
            onPress: () => navigation.goBack()
          }
        ]);
      }
    } catch (error: any) {
      Alert.alert('خطا', error.response?.data?.message || 'مشکلی در ثبت مدرسه رخ داد.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronRight size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>ایجاد مدرسه جدید</Text>
          <Text style={styles.headerSubtitle}>مشخصات و نشانگر سازمانی</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <School size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>مشخصات پایه</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>نام مدرسه <Text style={styles.required}>*</Text></Text>
              <TextInput 
                style={styles.input} 
                value={name} 
                onChangeText={setName} 
                placeholder="مثال: دبیرستان البرز" 
                textAlign="right" 
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Palette size={16} color={COLORS.textLight} />
                <Text style={[styles.inputLabel, { marginBottom: 0, marginRight: 6 }]}>رنگ سازمانی مدرسه</Text>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.colorPalette}
              >
                {SCHOOL_COLORS.map(color => (
                  <TouchableOpacity 
                    key={color} 
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorCircleSelected
                    ]}
                    onPress={() => setSelectedColor(color)}
                    activeOpacity={0.8}
                  />
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MapPin size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>محل و اطلاعات تماس</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>آدرس مدرسه (اختیاری)</Text>
              <TextInput 
                style={styles.input} 
                value={address} 
                onChangeText={setAddress} 
                placeholder="خیابان، کوچه، پلاک..." 
                textAlign="right" 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>شماره تماس مدرسه (اختیاری)</Text>
              <TextInput 
                style={styles.input} 
                value={schoolPhone} 
                onChangeText={setSchoolPhone} 
                placeholder="مثال: 02122334455" 
                keyboardType="phone-pad"
                textAlign="right" 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>شماره تماس مدیر (اختیاری)</Text>
              <TextInput 
                style={styles.input} 
                value={principalPhone} 
                onChangeText={setPrincipalPhone} 
                placeholder="مثال: 09123456789" 
                keyboardType="phone-pad"
                textAlign="right" 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>شماره رابط یا یادداشت دیگر (اختیاری)</Text>
              <TextInput 
                style={styles.input} 
                value={extraPhone} 
                onChangeText={setExtraPhone} 
                placeholder="سایر اطلاعات..." 
                textAlign="right" 
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
            onPress={handleSubmit} 
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.surface} size="small" />
            ) : (
              <>
                <Plus size={20} color={COLORS.surface} style={{ marginLeft: 8 }} />
                <Text style={styles.submitBtnText}>ثبت و ایجاد مدرسه</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: COLORS.surface, 
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  backButton: { padding: 8 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },

  content: { padding: 16 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: 8
  },

  inputGroup: { marginBottom: 16 },
  labelRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 8 },
  inputLabel: { fontSize: 13, color: COLORS.text, marginBottom: 8, textAlign: 'left', fontWeight: '500' },
  required: { color: COLORS.error },
  input: { 
    backgroundColor: '#f8fafc', 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: 12, 
    padding: 12, 
    fontSize: 14, 
    textAlign: 'left', 
    color: COLORS.text 
  },

  colorPalette: {
    flexDirection: 'row-reverse',
    paddingVertical: 6,
    alignItems: 'center'
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginHorizontal: 5,
    borderWidth: 3,
    borderColor: 'transparent'
  },
  colorCircleSelected: {
    borderColor: '#0f172a',
    transform: [{ scale: 1.15 }]
  },

  submitBtn: { 
    backgroundColor: COLORS.primary, 
    padding: 16, 
    borderRadius: 14, 
    alignItems: 'center', 
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    marginTop: 8,
    elevation: 2
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: COLORS.surface, fontSize: 16, fontWeight: 'bold' }
});

export default CreateSchoolScreen;
