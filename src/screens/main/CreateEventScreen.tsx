import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { ChevronRight, Calendar, Clock, MapPin, AlignLeft, Tag } from 'lucide-react-native';
import { toPersianNumbers } from '../../utils/date/jalaliHelper';

const CreateEventScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [eventType, setEventType] = useState('meeting');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronRight color={colors.text} size={28} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>ایجاد رویداد جدید</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>عنوان رویداد</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="مثلاً جلسه اولیا و مربیان"
            placeholderTextColor={colors.textLight}
          />
        </View>

        {/* Event Type */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>نوع رویداد</Text>
          <View style={styles.typeRow}>
            {[
              { id: 'meeting', label: 'جلسه', color: '#f59e0b' },
              { id: 'exam', label: 'آزمون', color: '#ef4444' },
              { id: 'workshop', label: 'کارگاه', color: '#10b981' },
              { id: 'other', label: 'سایر', color: '#6366f1' },
            ].map(type => {
              const isSelected = eventType === type.id;
              return (
                <TouchableOpacity 
                  key={type.id} 
                  style={[styles.typeBtn, isSelected && { backgroundColor: type.color, borderColor: type.color }]}
                  onPress={() => setEventType(type.id)}
                >
                  <Text style={[styles.typeBtnText, { color: isSelected ? '#fff' : colors.textLight }]}>{type.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.label, { color: colors.text }]}>تاریخ</Text>
            <TouchableOpacity style={[styles.iconInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Calendar color={colors.textLight} size={20} />
              <Text style={[styles.iconInputText, { color: colors.text }]}>{toPersianNumbers('1405/07/25')}</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.label, { color: colors.text }]}>زمان</Text>
            <TouchableOpacity style={[styles.iconInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Clock color={colors.textLight} size={20} />
              <Text style={[styles.iconInputText, { color: colors.text }]}>{toPersianNumbers('16:00 - 17:30')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Location & School */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>مکان / مدرسه (اختیاری)</Text>
          <View style={[styles.iconInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MapPin color={colors.textLight} size={20} />
            <TextInput 
              style={[styles.flexInput, { color: colors.text }]}
              placeholder="جستجو یا انتخاب مدرسه..."
              placeholderTextColor={colors.textLight}
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>توضیحات</Text>
          <View style={[styles.textAreaContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AlignLeft color={colors.textLight} size={20} style={styles.textAreaIcon} />
            <TextInput 
              style={[styles.textArea, { color: colors.text }]}
              placeholder="توضیحات تکمیلی..."
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.saveBtnText}>ذخیره رویداد</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'IRANSansX' },
  
  content: { padding: 16, paddingBottom: 40 },
  
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontFamily: 'IRANSansX', fontWeight: 'bold', marginBottom: 8 },
  input: {
    height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 14, fontFamily: 'IRANSansX'
  },
  
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#cbd5e1', 
    justifyContent: 'center', alignItems: 'center'
  },
  typeBtnText: { fontSize: 12, fontFamily: 'IRANSansX', fontWeight: 'bold' },

  row: { flexDirection: 'row' },
  iconInput: {
    flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12
  },
  iconInputText: { fontSize: 14, fontFamily: 'IRANSansX', marginLeft: 8 },
  flexInput: { flex: 1, height: '100%', marginLeft: 8, fontSize: 14, fontFamily: 'IRANSansX' },

  textAreaContainer: {
    flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 12, minHeight: 100
  },
  textAreaIcon: { marginTop: 4, marginRight: 8 },
  textArea: { flex: 1, fontSize: 14, fontFamily: 'IRANSansX', minHeight: 80 },

  footer: {
    padding: 16, borderTopWidth: 1,
  },
  saveBtn: {
    height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center'
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', fontFamily: 'IRANSansX' }
});

export default CreateEventScreen;
