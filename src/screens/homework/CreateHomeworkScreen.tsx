import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { showWarning, showSuccess, showError } from '../../components/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import {
  ChevronRight,
  Save,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  Circle,
  Sparkles,
} from 'lucide-react-native';
import { api } from '../../api/axiosConfig';
import { PlanningService } from '../../api/planningService';
import { calculateNextSessionDate } from '../../utils/date/homeworkSessionHelper';
import { toPersianNumbers } from '../../utils/date/jalaliHelper';

const CreateHomeworkScreen = ({ route, navigation }: any) => {
  const { colors, isDark } = useTheme();

  const editHomework = route.params?.homework;
  const isEdit = !!editHomework;

  const initialClassId = route.params?.classId || editHomework?.classId?._id || editHomework?.classId || '';
  const initialClassName = route.params?.className || editHomework?.classId?.name || '';
  const initialSubject = route.params?.subject || editHomework?.subject || '';

  // Form states
  const [title, setTitle] = useState(editHomework?.title || '');
  const [description, setDescription] = useState(editHomework?.description || '');
  const [subject, setSubject] = useState(initialSubject);
  const [classId, setClassId] = useState(initialClassId);

  // Next Session Auto Setting
  const [isNextSessionAuto, setIsNextSessionAuto] = useState(!isEdit);
  const [customDueDateJalali, setCustomDueDateJalali] = useState(editHomework?.dueDateJalali || '');
  const [customDueDateGregorian, setCustomDueDateGregorian] = useState(editHomework?.dueDate || '');

  // Target Students
  const [isForAllStudents, setIsForAllStudents] = useState(editHomework ? editHomework.isForAllStudents : true);
  const [selectedStudentPhones, setSelectedStudentPhones] = useState<string[]>(
    editHomework?.targetStudentPhones || []
  );

  // Todo Items
  const [items, setItems] = useState<{ title: string }[]>(
    editHomework?.items?.map((it: any) => ({ title: it.title })) || []
  );
  const [newItemText, setNewItemText] = useState('');

  // Classrooms, students, schedules
  const [classes, setClasses] = useState<any[]>([]);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (classId) {
      loadClassStudents(classId);
    }
  }, [classId]);

  const loadInitialData = async () => {
    try {
      const [classRes, schedRes] = await Promise.allSettled([
        api.get('/teacher/classrooms'),
        api.get('/teacher/schedule'),
      ]);

      if (classRes.status === 'fulfilled' && classRes.value.data?.success) {
        const clsList = classRes.value.data.data || [];
        setClasses(clsList);
        if (!classId && clsList.length > 0) {
          setClassId(clsList[0]._id);
          if (!subject && clsList[0].subjectName) {
            setSubject(clsList[0].subjectName);
          }
        }
      }

      if (schedRes.status === 'fulfilled' && schedRes.value.data?.success) {
        setSchedules(schedRes.value.data.data || []);
      }
    } catch (e) {
      console.warn('Error loading initial data for homework:', e);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  const loadClassStudents = async (cid: string) => {
    try {
      const res = await api.get(`/teacher/classrooms/${cid}/students/list`);
      if (res.data?.success) {
        setClassStudents(res.data.data || []);
      }
    } catch (e) {
      console.warn('Error loading students for class:', e);
    }
  };

  // Calculate Next Session automatically
  const nextSessionInfo = useMemo(() => {
    return calculateNextSessionDate(schedules, subject, classId);
  }, [schedules, subject, classId]);

  // Handle Add Item to Checklist
  const handleAddItem = () => {
    const trimmed = newItemText.trim();
    if (!trimmed) return;
    setItems(prev => [...prev, { title: trimmed }]);
    setNewItemText('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Toggle student selection
  const handleToggleStudent = (phone: string) => {
    setSelectedStudentPhones(prev =>
      prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showWarning('لطفاً عنوان تکلیف را وارد کنید (مثلاً: فصل اول ریاضی)');
      return;
    }
    if (!classId) {
      showWarning('لطفاً کلاس مورد نظر را انتخاب کنید');
      return;
    }
    if (!isForAllStudents && selectedStudentPhones.length === 0) {
      showWarning('لطفاً حداقل یک دانش‌آموز را انتخاب کنید');
      return;
    }

    const finalDueDate = isNextSessionAuto
      ? nextSessionInfo.gregorianDate
      : customDueDateGregorian || nextSessionInfo.gregorianDate;

    const finalDueDateJalali = isNextSessionAuto
      ? nextSessionInfo.jalaliDate
      : customDueDateJalali || nextSessionInfo.jalaliDate;

    setIsSaving(true);
    try {
      const payload = {
        classId,
        subject: subject || 'عمومی',
        title: title.trim(),
        description: description.trim(),
        items: items.length > 0 ? items : [{ title: title.trim() }],
        dueDate: finalDueDate,
        dueDateJalali: finalDueDateJalali,
        isForAllStudents,
        targetStudentPhones: isForAllStudents ? [] : selectedStudentPhones,
      };

      if (isEdit) {
        await PlanningService.updateHomework(editHomework._id, payload);
        showSuccess('تکلیف با موفقیت به‌روزرسانی شد');
        navigation.goBack();
      } else {
        await PlanningService.createHomework(payload);
        showSuccess('تکلیف جدید با موفقیت ثبت شد');
        navigation.goBack();
      }
    } catch (e: any) {
      console.warn('Error saving homework:', e);
      showError(e.response?.data?.message || 'خطا در ثبت تکلیف');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronRight color={colors.text} size={26} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isEdit ? 'ویرایش تکلیف' : 'تعریف تکلیف جدید'}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ۱. عنوان تکلیف */}
        <Text style={[styles.label, { color: colors.text }]}>عنوان تکلیف *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="مثلاً: فصل اول ریاضی، تمرین‌های صفحه ۲۴"
          placeholderTextColor={colors.textLight}
          value={title}
          onChangeText={setTitle}
        />

        {/* ۲. درس و کلاس */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.text }]}>درس</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="مثلاً: ریاضی"
              placeholderTextColor={colors.textLight}
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          {classes.length > 0 && (
            <View style={{ flex: 1.2, marginRight: 10 }}>
              <Text style={[styles.label, { color: colors.text }]}>کلاس</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classChipsRow}>
                {classes.map(c => {
                  const isSelected = classId === c._id;
                  return (
                    <TouchableOpacity
                      key={c._id}
                      style={[
                        styles.classChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => {
                        setClassId(c._id);
                        if (c.subjectName && !subject) setSubject(c.subjectName);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.classChipText, { color: isSelected ? '#fff' : colors.text }]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* ۳. موعد تحویل و جلسه بعدی */}
        <View style={[styles.cardBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleGroup}>
              <Sparkles size={17} color={colors.primary} style={{ marginLeft: 6 }} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>تعیین برای جلسه بعد</Text>
            </View>
            <Switch
              value={isNextSessionAuto}
              onValueChange={setIsNextSessionAuto}
              trackColor={{ false: '#cbd5e1', true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          {isNextSessionAuto ? (
            <View style={styles.nextSessionInfoBox}>
              <View style={styles.nextSessionRow}>
                <Calendar size={15} color="#0284c7" style={{ marginLeft: 6 }} />
                <Text style={styles.nextSessionDateText}>
                  جلسه بعدی: {nextSessionInfo.jalaliFormattedText}
                </Text>
              </View>
              <View style={styles.remainingBadge}>
                <Clock size={13} color="#0369a1" style={{ marginLeft: 4 }} />
                <Text style={styles.remainingBadgeText}>{nextSessionInfo.remainingText}</Text>
              </View>
            </View>
          ) : (
            <View style={{ marginTop: 10 }}>
              <Text style={[styles.subLabel, { color: colors.textLight }]}>
                تاریخ موعد تحویل (شمسی مثلاً ۱۴۰۵/۰۷/۲۸):
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                ]}
                placeholder="۱۴۰۵/۰۷/۲۸"
                placeholderTextColor={colors.textLight}
                value={customDueDateJalali}
                onChangeText={setCustomDueDateJalali}
              />
            </View>
          )}
        </View>

        {/* ۴. آیتم‌های تکلیف (Checklist / To-Do) */}
        <View style={[styles.cardBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 10 }]}>
            آیتم‌های تکلیف (فهرست کارها)
          </Text>

          {items.map((item, idx) => (
            <View key={idx} style={[styles.todoItemRow, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => handleRemoveItem(idx)} style={styles.deleteItemBtn}>
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
              <Text style={[styles.todoItemText, { color: colors.text }]}>
                {toPersianNumbers(idx + 1)}. {item.title}
              </Text>
            </View>
          ))}

          <View style={styles.addItemRow}>
            <TextInput
              style={[
                styles.addItemInput,
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
              ]}
              placeholder="مثلاً: حل تمرین‌های شماره ۱ تا ۵..."
              placeholderTextColor={colors.textLight}
              value={newItemText}
              onChangeText={setNewItemText}
              onSubmitEditing={handleAddItem}
            />
            <TouchableOpacity style={[styles.addItemBtn, { backgroundColor: colors.primary }]} onPress={handleAddItem}>
              <Plus size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ۵. مخاطبان تکلیف (همه دانش‌آموزان یا انتخابی) */}
        <View style={[styles.cardBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 10 }]}>
            مخاطبان این تکلیف
          </Text>

          <View style={styles.targetTabsRow}>
            <TouchableOpacity
              style={[
                styles.targetTab,
                isForAllStudents && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setIsForAllStudents(true)}
            >
              <Text style={[styles.targetTabText, { color: isForAllStudents ? '#fff' : colors.text }]}>
                همه دانش‌آموزان کلاس
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.targetTab,
                !isForAllStudents && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setIsForAllStudents(false)}
            >
              <Text style={[styles.targetTabText, { color: !isForAllStudents ? '#fff' : colors.text }]}>
                دانش‌آموزان خاص ({toPersianNumbers(selectedStudentPhones.length)})
              </Text>
            </TouchableOpacity>
          </View>

          {!isForAllStudents && (
            <View style={styles.studentsListWrapper}>
              {classStudents.length === 0 ? (
                <Text style={[styles.hintText, { color: colors.textLight, textAlign: 'center', marginVertical: 12 }]}>
                  دانش‌آموزی در این کلاس یافت نشد.
                </Text>
              ) : (
                classStudents.map(st => {
                  const isChecked = selectedStudentPhones.includes(st.studentPhone);
                  const name = `${st.firstName || ''} ${st.lastName || ''}`.trim() || st.studentPhone;
                  return (
                    <TouchableOpacity
                      key={st._id || st.studentPhone}
                      style={[styles.studentSelectRow, { borderBottomColor: colors.border }]}
                      onPress={() => handleToggleStudent(st.studentPhone)}
                    >
                      <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                        {isChecked ? (
                          <CheckCircle size={18} color={colors.primary} style={{ marginLeft: 8 }} />
                        ) : (
                          <Circle size={18} color={colors.textLight} style={{ marginLeft: 8 }} />
                        )}
                        <Text style={[styles.studentSelectName, { color: colors.text }]}>{name}</Text>
                      </View>
                      <Text style={[styles.studentPhoneText, { color: colors.textLight }]}>
                        {st.studentPhone}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}
        </View>

        {/* دکمه ذخیره */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Save size={20} color="#fff" style={{ marginLeft: 8 }} />
              <Text style={styles.saveBtnText}>
                {isEdit ? 'به‌روزرسانی تکلیف' : 'ثبت و انتشار تکلیف'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: 'bold', fontFamily: 'IRANSansX' },
  content: { padding: 16, paddingBottom: 50 },
  label: {
    fontSize: 13.5,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 10,
    marginBottom: 6,
  },
  subLabel: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    textAlign: 'right',
    marginBottom: 6,
  },
  hintText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
  },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: 'IRANSansX',
    fontSize: 13.5,
    textAlign: 'right',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  classChipsRow: {
    flexDirection: 'row-reverse',
    gap: 6,
    paddingVertical: 4,
  },
  classChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  classChipText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    fontWeight: '600',
  },
  cardBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    textAlign: 'right',
  },
  nextSessionInfoBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextSessionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  nextSessionDateText: {
    fontSize: 12.5,
    fontFamily: 'IRANSansX',
    color: '#0369a1',
    fontWeight: '600',
  },
  remainingBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  remainingBadgeText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    color: '#0369a1',
    fontWeight: '700',
  },
  todoItemRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  todoItemText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'IRANSansX',
    textAlign: 'right',
  },
  deleteItemBtn: {
    padding: 4,
  },
  addItemRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  addItemInput: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: 'IRANSansX',
    fontSize: 12.5,
    textAlign: 'right',
  },
  addItemBtn: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetTabsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 10,
  },
  targetTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  targetTabText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    fontWeight: '600',
  },
  studentsListWrapper: {
    maxHeight: 200,
  },
  studentSelectRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  studentSelectName: {
    fontSize: 12.5,
    fontFamily: 'IRANSansX',
    fontWeight: '600',
  },
  studentPhoneText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
  },
  saveBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    marginTop: 26,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },
});

export default CreateHomeworkScreen;
