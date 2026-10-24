import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Switch,
  NativeModules,
} from 'react-native';
import { showWarning, showError, showInfo } from '../../components/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import {
  ChevronRight,
  BookOpen,
  Calendar,
  CheckSquare,
  Users,
  FileText,
  Sparkles,
  HelpCircle,
  Award,
  Layers,
  School,
} from 'lucide-react-native';
import { api } from '../../api/axiosConfig';
import { smartSheetService } from '../../services/smartSheetService';
import { PlanningService } from '../../api/planningService';
import { toPersianNumbers, getTodayJalali } from '../../utils/date/jalaliHelper';

const { PersianDatePicker } = NativeModules;

export const CreateSmartExamScreen = ({ route, navigation }: any) => {
  const { colors, isDark } = useTheme();
  const passedClassId = route?.params?.classId || route?.params?.currentClassId || route?.params?.classroom?._id;
  const passedClassName = route?.params?.className || route?.params?.currentClassName || route?.params?.classroom?.name;
  const passedSchoolName =
    route?.params?.schoolName ||
    route?.params?.classroom?.school?.name ||
    route?.params?.classroom?.schoolName ||
    '';

  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(passedClassId || '');
  const [schoolName, setSchoolName] = useState<string>(passedSchoolName || '');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentPhones, setSelectedStudentPhones] = useState<string[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Form Fields
  const [examTitle, setExamTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [totalQuestions, setTotalQuestions] = useState(20);
  const [optionsCount, setOptionsCount] = useState(4); // 3, 4, 5
  const [maxScore, setMaxScore] = useState(20);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [negativeFactor, setNegativeFactor] = useState(0.33);
  const [selectedTemplate, setSelectedTemplate] = useState<'MODEL_1' | 'MODEL_2' | 'MODEL_3'>('MODEL_1');
  const [optionLabelType, setOptionLabelType] = useState<'ALPHABETIC' | 'NUMERIC'>('ALPHABETIC');

  // Answer Key: Array of numbers (1-indexed), e.g. [1, 2, 4, ...]
  const [answerKey, setAnswerKey] = useState<number[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const today = getTodayJalali();
    setExamDate(`${today.jy}/${today.jm.toString().padStart(2, '0')}/${today.jd.toString().padStart(2, '0')}`);
    loadClassroomsAndSchools();
  }, []);

  useEffect(() => {
    // Resize answerKey array when totalQuestions changes
    setAnswerKey((prev) => {
      const next = [...prev];
      if (next.length < totalQuestions) {
        while (next.length < totalQuestions) next.push(1);
      } else if (next.length > totalQuestions) {
        return next.slice(0, totalQuestions);
      }
      return next;
    });
  }, [totalQuestions]);

  const loadClassroomsAndSchools = async () => {
    try {
      const [classRes, schoolRes] = await Promise.all([
        api.get('/teacher/classrooms'),
        PlanningService.getSchools().catch(() => ({ success: false, data: [] })),
      ]);

      if (schoolRes?.success && schoolRes.data) {
        setSchools(schoolRes.data);
      }

      if (classRes.data?.success) {
        const list = classRes.data.data || [];
        setClassrooms(list);

        let targetClassId = passedClassId || selectedClassId;
        if (!targetClassId || !list.some((c: any) => c._id === targetClassId)) {
          if (list.length > 0) {
            targetClassId = list[0]._id;
          }
        }

        if (targetClassId) {
          setSelectedClassId(targetClassId);
          const targetClass = list.find((c: any) => c._id === targetClassId);
          const resolvedSchool =
            targetClass?.school?.name || targetClass?.schoolName || passedSchoolName || '';
          if (resolvedSchool && !schoolName) {
            setSchoolName(resolvedSchool);
          }
          loadClassStudents(targetClassId);
        }
      }
    } catch (e) {
      console.warn('Error loading classrooms/schools:', e);
    }
  };

  const loadClassStudents = async (classId: string) => {
    if (!classId) return;
    setLoadingStudents(true);
    try {
      let res: any;
      try {
        res = await api.get(`/teacher/classrooms/${classId}/students/list`);
      } catch (err) {
        res = await api.get(`/teacher/classrooms/${classId}/students`);
      }

      if (res?.data?.success) {
        const rawList = res.data.data || [];
        const stList = rawList.map((item: any, idx: number) => {
          const phone =
            item.studentPhone ||
            item.phoneNumber ||
            item.phone ||
            item.studentId?.user?.phone ||
            item.studentId?.phone ||
            `st_${idx}`;
          const firstName = item.firstName || '';
          const lastName = item.lastName || '';
          const fullName =
            (firstName || lastName)
              ? `${firstName} ${lastName}`.trim()
              : item.studentId?.user?.fullName || item.name || 'دانش‌آموز';

          return {
            ...item,
            _id: item._id || item.studentId?._id || `s_${idx}`,
            studentPhone: phone,
            phoneNumber: phone,
            phone: phone,
            firstName,
            lastName,
            fullName,
            displayName: fullName,
          };
        });

        setStudents(stList);
        // Select all by default
        const allPhones = stList.map((s: any) => s.studentPhone).filter(Boolean);
        setSelectedStudentPhones(allPhones);
      } else {
        setStudents([]);
        setSelectedStudentPhones([]);
      }
    } catch (e) {
      console.warn('Error loading students:', e);
      setStudents([]);
      setSelectedStudentPhones([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    const cls = classrooms.find((c) => c._id === classId);
    if (cls) {
      const sName = cls.school?.name || cls.schoolName || '';
      if (sName) {
        setSchoolName(sName);
      }
    }
    loadClassStudents(classId);
  };

  const handleSelectSchool = (name: string) => {
    setSchoolName(name);
  };

  const openDatePicker = async () => {
    try {
      let y = 1403;
      let m = 7;
      let d = 1;

      if (examDate && examDate.includes('/')) {
        const parts = examDate.split('/');
        if (parts.length === 3) {
          y = parseInt(parts[0], 10) || y;
          m = parseInt(parts[1], 10) || m;
          d = parseInt(parts[2], 10) || d;
        }
      } else {
        const today = getTodayJalali();
        y = today.jy;
        m = today.jm;
        d = today.jd;
      }

      if (PersianDatePicker && PersianDatePicker.show) {
        const res = await PersianDatePicker.show({ year: y, month: m, day: d });
        if (res && res.year && res.month && res.day) {
          const formatted = `${res.year}/${res.month.toString().padStart(2, '0')}/${res.day.toString().padStart(2, '0')}`;
          setExamDate(formatted);
        }
      } else {
        showInfo('ماژول انتخاب تاریخ شمسی در این پلتفرم در دسترس نیست');
      }
    } catch (e: any) {
      // User cancelled
      console.log('Date picker dismissed or cancelled:', e?.message);
    }
  };

  const toggleStudentSelection = (phone: string) => {
    setSelectedStudentPhones((prev) =>
      prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone]
    );
  };

  const selectAllStudents = () => {
    const allPhones = students.map((s) => s.studentPhone || s.phoneNumber || s.phone).filter(Boolean);
    setSelectedStudentPhones(allPhones);
  };

  const clearAllStudents = () => {
    setSelectedStudentPhones([]);
  };

  const setOptionForQuestion = (qIndex: number, opt: number) => {
    setAnswerKey((prev) => {
      const copy = [...prev];
      copy[qIndex] = opt;
      return copy;
    });
  };

  const handleGenerate = async () => {
    if (!examTitle.trim()) {
      showWarning('لطفاً عنوان آزمون را وارد فرمایید.');
      return;
    }
    if (!selectedClassId) {
      showWarning('لطفاً کلاس مربوطه را انتخاب کنید.');
      return;
    }
    if (selectedStudentPhones.length === 0) {
      showWarning('حداقل یک دانش‌آموز باید انتخاب شود.');
      return;
    }

    setIsGenerating(true);
    try {
      const selectedClass = classrooms.find((c) => c._id === selectedClassId);
      const chosenStudents = students
        .filter((s) => selectedStudentPhones.includes(s.studentPhone || s.phoneNumber || s.phone))
        .map((s) => ({
          studentPhone: s.studentPhone || s.phoneNumber || s.phone,
          studentName: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.fullName || 'دانش‌آموز',
        }));

      // 1. Create or register sheets in Backend
      const backendRes = await smartSheetService.generateSheetsInBackend({
        classId: selectedClassId,
        className: selectedClass?.name || passedClassName || 'کلاس',
        schoolName: schoolName.trim(),
        examTitle: examTitle.trim(),
        subject: subject.trim() || selectedClass?.subjectName || '',
        examDate,
        totalQuestions,
        optionsPerQuestion: optionsCount,
        pointsPerQuestion: maxScore / totalQuestions,
        negativeMarking,
        negativeFactor,
        maxScore,
        templateId: selectedTemplate,
        optionLabelType,
        answerKey,
        selectedStudents: chosenStudents,
      });

      if (!backendRes.success || !backendRes.data) {
        throw new Error(backendRes.message || 'خطا در ثبت پاسخ‌برگ‌ها در سرور');
      }

      const generatedList = backendRes.data.sheets || [];

      // 2. Generate the PDF natively on device
      const pdfStudents = generatedList.map((g: any) => ({
        studentName: g.studentName,
        sheetCode: g.sheetCode,
      }));

      const pdfResult = await smartSheetService.generatePdf({
        examTitle: examTitle.trim(),
        subject: subject.trim() || selectedClass?.subjectName || '',
        className: selectedClass?.name || passedClassName || 'کلاس',
        schoolName: schoolName.trim(),
        examDate,
        totalQuestions,
        optionsCount,
        templateId: selectedTemplate,
        optionLabelType,
        students: pdfStudents,
      });

      // 3. Navigate to preview screen
      navigation.navigate('GeneratedSheetsPreviewScreen', {
        pdfUri: pdfResult.uri,
        fileName: pdfResult.fileName,
        pageCount: pdfResult.pageCount,
        examTitle: examTitle.trim(),
        subject: subject.trim() || selectedClass?.subjectName || '',
        className: selectedClass?.name || passedClassName || 'کلاس',
        schoolName: schoolName.trim(),
        classId: selectedClassId,
        examId: backendRes.data.examId,
        sheets: generatedList,
        optionLabelType,
      });
    } catch (e: any) {
      showError(e?.message || 'مشکلی در تولید فایل پیش آمد');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentClass = classrooms.find((c) => c._id === selectedClassId);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronRight color={colors.text} size={26} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>تنظیم و صدور پاسخ‌برگ تستی</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ۱. انتخاب کلاس و مدرسه */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>۱. انتخاب کلاس و مدرسه</Text>
            {currentClass?.code ? (
              <Text style={{ fontSize: 11, fontFamily: 'IRANSansX', color: '#6366f1' }}>
                شناسه کلاس: {toPersianNumbers(currentClass.code)}
              </Text>
            ) : null}
          </View>

          <Text style={[styles.inputLabel, { color: colors.text, marginTop: 4 }]}>کلاس مربوطه *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {classrooms.map((cls) => {
              const isSelected = selectedClassId === cls._id;
              return (
                <TouchableOpacity
                  key={cls._id}
                  style={[
                    styles.classChip,
                    {
                      backgroundColor: isSelected ? '#4f46e5' : colors.background,
                      borderColor: isSelected ? '#4f46e5' : colors.border,
                    },
                  ]}
                  onPress={() => handleClassChange(cls._id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.classChipText,
                      { color: isSelected ? '#ffffff' : colors.text, fontWeight: isSelected ? 'bold' : 'normal' },
                    ]}
                  >
                    {cls.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* نام مدرسه */}
          <View style={styles.schoolContainer}>
            <View style={styles.schoolLabelRow}>
              <School size={16} color="#4f46e5" />
              <Text style={[styles.schoolLabelText, { color: colors.text }]}>نام مدرسه (انتخاب پیش‌فرض / ویرایش):</Text>
            </View>

            {/* در صورت وجود لیست مدارس ثبت‌شده، انتخاب سریع با چیپ‌ها */}
            {schools.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.schoolChipsScroll}>
                {schools.map((sch) => {
                  const isSelected = schoolName === sch.name;
                  return (
                    <TouchableOpacity
                      key={sch._id || sch.name}
                      style={[
                        styles.schoolChip,
                        {
                          backgroundColor: isSelected ? '#ede9fe' : colors.background,
                          borderColor: isSelected ? '#8b5cf6' : colors.border,
                        },
                      ]}
                      onPress={() => handleSelectSchool(sch.name)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.schoolChipText,
                          { color: isSelected ? '#6d28d9' : colors.text, fontWeight: isSelected ? 'bold' : 'normal' },
                        ]}
                      >
                        {sch.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, marginBottom: 0 }]}
              placeholder="مثال: دبیرستان شاهد، دبستان نور..."
              placeholderTextColor={colors.textLight}
              value={schoolName}
              onChangeText={setSchoolName}
            />
          </View>
        </View>

        {/* ۲. مشخصات آزمون */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>۲. اطلاعات و مشخصات آزمون</Text>

          <Text style={[styles.inputLabel, { color: colors.text }]}>عنوان آزمون *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="مثال: آزمون میان‌ترم فصل سوم ریاضی"
            placeholderTextColor={colors.textLight}
            value={examTitle}
            onChangeText={setExamTitle}
          />

          <View style={styles.rowInputs}>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>درس</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="مثال: ریاضی، فیزیک..."
                placeholderTextColor={colors.textLight}
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>تاریخ آزمون</Text>
              <TouchableOpacity
                style={[
                  styles.datePickerBtn,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
                onPress={openDatePicker}
                activeOpacity={0.7}
              >
                <Calendar size={18} color="#4f46e5" style={{ marginLeft: 8 }} />
                <Text style={[styles.datePickerText, { color: colors.text }]}>
                  {examDate ? toPersianNumbers(examDate) : 'انتخاب تاریخ...'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* تعداد سوالات */}
          <Text style={[styles.inputLabel, { color: colors.text, marginTop: 10 }]}>تعداد سوالات تستی:</Text>
          <View style={styles.presetRow}>
            {[10, 20, 30, 40, 60].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.presetBtn,
                  totalQuestions === num && styles.presetBtnActive,
                  { borderColor: totalQuestions === num ? '#4f46e5' : colors.border },
                ]}
                onPress={() => setTotalQuestions(num)}
              >
                <Text style={[styles.presetBtnText, { color: totalQuestions === num ? '#fff' : colors.text }]}>
                  {toPersianNumbers(num)} سوال
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* تعداد گزینه‌ها */}
          <Text style={[styles.inputLabel, { color: colors.text, marginTop: 10 }]}>تعداد گزینه‌ها در هر سوال:</Text>
          <View style={styles.presetRow}>
            {[3, 4, 5].map((optNum) => (
              <TouchableOpacity
                key={optNum}
                style={[
                  styles.presetBtn,
                  optionsCount === optNum && styles.presetBtnActive,
                  { borderColor: optionsCount === optNum ? '#4f46e5' : colors.border },
                ]}
                onPress={() => setOptionsCount(optNum)}
              >
                <Text style={[styles.presetBtnText, { color: optionsCount === optNum ? '#fff' : colors.text }]}>
                  {toPersianNumbers(optNum)} گزینه‌ای
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* نوع برچسب ستون‌ها و گزینه‌ها */}
          <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>
            نام‌گذاری ستون‌ها و گزینه‌ها:
          </Text>
          <View style={styles.presetRow}>
            <TouchableOpacity
              style={[
                styles.presetBtn,
                optionLabelType === 'ALPHABETIC' && styles.presetBtnActive,
                { borderColor: optionLabelType === 'ALPHABETIC' ? '#4f46e5' : colors.border, flex: 1 },
              ]}
              onPress={() => setOptionLabelType('ALPHABETIC')}
            >
              <Text
                style={[
                  styles.presetBtnText,
                  { color: optionLabelType === 'ALPHABETIC' ? '#fff' : colors.text },
                ]}
              >
                الف، ب، ج، د (الفبایی)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.presetBtn,
                optionLabelType === 'NUMERIC' && styles.presetBtnActive,
                { borderColor: optionLabelType === 'NUMERIC' ? '#4f46e5' : colors.border, flex: 1 },
              ]}
              onPress={() => setOptionLabelType('NUMERIC')}
            >
              <Text
                style={[
                  styles.presetBtnText,
                  { color: optionLabelType === 'NUMERIC' ? '#fff' : colors.text },
                ]}
              >
                ۱، ۲، ۳، ۴ (عددی)
              </Text>
            </TouchableOpacity>
          </View>

          {/* نمره منفی */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.switchTitle, { color: colors.text }]}>محاسبه نمره منفی</Text>
              <Text style={styles.switchDesc}>هر ۳ پاسخ نادرست یک پاسخ درست را خنثی کند (یک‌سوم منفی)</Text>
            </View>
            <Switch
              value={negativeMarking}
              onValueChange={setNegativeMarking}
              trackColor={{ false: '#cbd5e1', true: '#c7d2fe' }}
              thumbColor={negativeMarking ? '#4f46e5' : '#f1f5f9'}
            />
          </View>
        </View>

        {/* ۳. انتخاب دیزاین و قالب پاسخ‌برگ (۳ مدل اختصاصی جهت تست) */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>۳. انتخاب قالب و دیزاین پاسخ‌برگ</Text>
            <View style={{ backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
              <Text style={{ fontSize: 10.5, fontFamily: 'IRANSansX', color: '#4f46e5', fontWeight: 'bold' }}>
                ۳ مدل دقیق
              </Text>
            </View>
          </View>
          <Text style={[styles.cardSubtitle, { color: colors.textLight, marginBottom: 12 }]}>
            جهت تست و دستیابی به بالاترین دقت اسکن بدون تداخل هدر و شماره سوال، قالب مورد نظر را انتخاب کنید:
          </Text>

          {/* Model 1 Card */}
          <TouchableOpacity
            style={[
              styles.templateCard,
              selectedTemplate === 'MODEL_1' && styles.templateCardActive,
              { borderColor: selectedTemplate === 'MODEL_1' ? '#4f46e5' : colors.border, backgroundColor: selectedTemplate === 'MODEL_1' ? (isDark ? '#1e1b4b' : '#f5f3ff') : colors.surface }
            ]}
            onPress={() => setSelectedTemplate('MODEL_1')}
            activeOpacity={0.8}
          >
            <View style={styles.templateCardHeader}>
              <View style={[styles.templateRadio, selectedTemplate === 'MODEL_1' && styles.templateRadioActive]}>
                {selectedTemplate === 'MODEL_1' && <View style={styles.templateRadioInner} />}
              </View>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.templateCardTitle, { color: colors.text }]}>مدل ۱: شبکه‌ای با کادربندی تفکیک‌شده</Text>
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedBadgeText}>پیشنهادی</Text>
                  </View>
                </View>
                <Text style={[styles.templateCardDesc, { color: colors.textLight }]}>
                  کادر اختصاصی برای هر ردیف سوال • شماره سوال در باکس خاکستری مستقل و حاشیه امن ۲۰ پوینت • بدون تداخل هدر
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Model 2 Card */}
          <TouchableOpacity
            style={[
              styles.templateCard,
              selectedTemplate === 'MODEL_2' && styles.templateCardActive,
              { borderColor: selectedTemplate === 'MODEL_2' ? '#4f46e5' : colors.border, backgroundColor: selectedTemplate === 'MODEL_2' ? (isDark ? '#1e1b4b' : '#f5f3ff') : colors.surface, marginTop: 8 }
            ]}
            onPress={() => setSelectedTemplate('MODEL_2')}
            activeOpacity={0.8}
          >
            <View style={styles.templateCardHeader}>
              <View style={[styles.templateRadio, selectedTemplate === 'MODEL_2' && styles.templateRadioActive]}>
                {selectedTemplate === 'MODEL_2' && <View style={styles.templateRadioInner} />}
              </View>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.templateCardTitle, { color: colors.text }]}>مدل ۲: ماتریسی با نشانگرهای تراز ردیف</Text>
                  <View style={[styles.recommendedBadge, { backgroundColor: '#ecfdf5' }]}>
                    <Text style={[styles.recommendedBadgeText, { color: '#059669' }]}>تراز اتوماتیک</Text>
                  </View>
                </View>
                <Text style={[styles.templateCardDesc, { color: colors.textLight }]}>
                  نشانگرهای مشکی همگام‌ساز ردیف در طرفین • ردیف‌های دورنگ (Zebra) • دایره‌های با کنتراست بالا
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Model 3 Card */}
          <TouchableOpacity
            style={[
              styles.templateCard,
              selectedTemplate === 'MODEL_3' && styles.templateCardActive,
              { borderColor: selectedTemplate === 'MODEL_3' ? '#4f46e5' : colors.border, backgroundColor: selectedTemplate === 'MODEL_3' ? (isDark ? '#1e1b4b' : '#f5f3ff') : colors.surface, marginTop: 8 }
            ]}
            onPress={() => setSelectedTemplate('MODEL_3')}
            activeOpacity={0.8}
          >
            <View style={styles.templateCardHeader}>
              <View style={[styles.templateRadio, selectedTemplate === 'MODEL_3' && styles.templateRadioActive]}>
                {selectedTemplate === 'MODEL_3' && <View style={styles.templateRadioInner} />}
              </View>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.templateCardTitle, { color: colors.text }]}>مدل ۳: الفبایی مدرن [الف | ب | ج | د]</Text>
                  <View style={[styles.recommendedBadge, { backgroundColor: '#fef3c7' }]}>
                    <Text style={[styles.recommendedBadgeText, { color: '#d97706' }]}>عدم تداخل عدد</Text>
                  </View>
                </View>
                <Text style={[styles.templateCardDesc, { color: colors.textLight }]}>
                  گزینه‌ها با حروف فارسی به جای عدد • برچسب دایره‌ای مشکی شماره سوال • حذف ۱۰۰٪ اشتباه عدد با گزینه
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ۴. کلید پاسخ‌نامه (اختیاری یا هنگام ایجاد) */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>۴. کلید سوالات (گزینه صحیح)</Text>
            <Text style={{ fontSize: 11, fontFamily: 'IRANSansX', color: '#6366f1' }}>
              {toPersianNumbers(totalQuestions)} سوال
            </Text>
          </View>
          <Text style={[styles.cardSubtitle, { color: colors.textLight }]}>
            گزینه صحیح هر سوال را برای تصحیح خودکار مشخص نمایید:
          </Text>

          <View style={styles.answerKeyGrid}>
            {Array.from({ length: totalQuestions }).map((_, qIdx) => {
              const currentAns = answerKey[qIdx] || 1;
              const OPTION_LETTERS = ['الف', 'ب', 'ج', 'د', 'هـ'];
              return (
                <View key={qIdx} style={[styles.keyRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.keyQuestionNum, { color: colors.text }]}>
                    سوال {toPersianNumbers(qIdx + 1)}:
                  </Text>
                  <View style={styles.keyOptionsRow}>
                    {Array.from({ length: optionsCount }).map((__, optIdx) => {
                      const optNum = optIdx + 1;
                      const isSelected = currentAns === optNum;
                      const label =
                        optionLabelType === 'ALPHABETIC'
                          ? OPTION_LETTERS[optIdx] || toPersianNumbers(optNum)
                          : toPersianNumbers(optNum);
                      return (
                        <TouchableOpacity
                          key={optNum}
                          style={[
                            styles.keyBubbleBtn,
                            isSelected && styles.keyBubbleBtnSelected,
                            { borderColor: isSelected ? '#16a34a' : colors.border },
                          ]}
                          onPress={() => setOptionForQuestion(qIdx, optNum)}
                        >
                          <Text
                            style={[
                              styles.keyBubbleText,
                              { color: isSelected ? '#ffffff' : colors.text },
                            ]}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ۵. انتخاب دانش‌آموزان کلاس */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>۵. انتخاب دانش‌آموزان</Text>
            <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
              <TouchableOpacity onPress={selectAllStudents}>
                <Text style={styles.linkActionText}>انتخاب همه</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.border }}>|</Text>
              <TouchableOpacity onPress={clearAllStudents}>
                <Text style={styles.linkActionText}>لغو انتخاب</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.cardSubtitle, { color: colors.textLight }]}>
            برای هر دانش‌آموز انتخاب‌شده، یک برگه با نام و بارکد یکتا در فایل PDF درج می‌شود (تعداد انتخاب‌شده:{' '}
            {toPersianNumbers(selectedStudentPhones.length)} نفر).
          </Text>

          {loadingStudents ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 14 }} />
          ) : students.length === 0 ? (
            <Text style={[styles.emptyStudentText, { color: colors.textLight }]}>دانش‌آموزی در این کلاس یافت نشد.</Text>
          ) : (
            <View style={styles.studentsListWrapper}>
              {students.map((st, idx) => {
                const phone = st.studentPhone || st.phoneNumber || st.phone;
                const isSelected = selectedStudentPhones.includes(phone);
                const fullName = st.fullName || `${st.firstName || ''} ${st.lastName || ''}`.trim() || 'دانش‌آموز';

                return (
                  <TouchableOpacity
                    key={phone || idx}
                    style={[
                      styles.studentSelectRow,
                      {
                        backgroundColor: isSelected ? '#f5f3ff' : colors.background,
                        borderColor: isSelected ? '#a855f7' : colors.border,
                      },
                    ]}
                    onPress={() => toggleStudentSelection(phone)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.checkboxCircle}>
                      {isSelected ? (
                        <View style={styles.checkboxInnerFill} />
                      ) : null}
                    </View>
                    <Text style={[styles.studentSelectName, { color: colors.text }]}>
                      {toPersianNumbers(idx + 1)}. {fullName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* دکمه تولید نهایی */}
        <TouchableOpacity
          style={[styles.generateSubmitBtn, isGenerating && { opacity: 0.7 }]}
          onPress={handleGenerate}
          disabled={isGenerating}
          activeOpacity={0.85}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Sparkles size={18} color="#fff" style={{ marginLeft: 8 }} />
              <Text style={styles.generateSubmitBtnText}>
                تولید پاسخ‌برگ‌ها و ایجاد فایل PDF چاپی ({toPersianNumbers(selectedStudentPhones.length)} برگه)
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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16.5, fontWeight: 'bold', fontFamily: 'IRANSansX' },
  content: { padding: 16, paddingBottom: 60 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    textAlign: 'right',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 11.5,
    fontFamily: 'IRANSansX',
    textAlign: 'right',
    marginBottom: 10,
    lineHeight: 18,
  },
  chipsScroll: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingVertical: 4,
  },
  classChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  classChipText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
  },
  schoolContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  schoolLabelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  schoolLabelText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    fontWeight: '600',
  },
  schoolChipsScroll: {
    flexDirection: 'row-reverse',
    gap: 6,
    marginBottom: 8,
  },
  schoolChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  schoolChipText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 6,
  },
  input: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: 'IRANSansX',
    fontSize: 12.5,
    textAlign: 'right',
    marginBottom: 10,
  },
  datePickerBtn: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 10,
  },
  datePickerText: {
    fontFamily: 'IRANSansX',
    fontSize: 12.5,
    textAlign: 'right',
  },
  rowInputs: {
    flexDirection: 'row-reverse',
  },
  presetRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  presetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#f8fafc',
  },
  presetBtnActive: {
    backgroundColor: '#4f46e5',
  },
  presetBtnText: {
    fontSize: 11.5,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  switchTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    textAlign: 'right',
  },
  switchDesc: {
    fontSize: 10,
    fontFamily: 'IRANSansX',
    color: '#64748b',
    textAlign: 'right',
    marginTop: 2,
  },
  answerKeyGrid: {
    marginTop: 4,
  },
  keyRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  keyQuestionNum: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    fontWeight: '600',
    width: 60,
    textAlign: 'right',
  },
  keyOptionsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  keyBubbleBtn: {
    width: 34,
    height: 24,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  keyBubbleBtnSelected: {
    backgroundColor: '#16a34a',
  },
  keyBubbleText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
  },
  linkActionText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    color: '#4f46e5',
    fontWeight: 'bold',
  },
  emptyStudentText: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    textAlign: 'center',
    marginVertical: 10,
  },
  studentsListWrapper: {
    gap: 6,
    marginTop: 6,
  },
  studentSelectRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  checkboxCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  checkboxInnerFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7c3aed',
  },
  studentSelectName: {
    fontSize: 12.5,
    fontFamily: 'IRANSansX',
    fontWeight: '600',
  },
  generateSubmitBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 10,
    elevation: 3,
  },
  generateSubmitBtnText: {
    fontSize: 13.5,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  templateCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  templateCardActive: {
    borderColor: '#4f46e5',
  },
  templateCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
  },
  templateRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  templateRadioActive: {
    borderColor: '#4f46e5',
  },
  templateRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4f46e5',
  },
  templateCardTitle: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
  },
  templateCardDesc: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    marginTop: 4,
    lineHeight: 18,
  },
  recommendedBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  recommendedBadgeText: {
    fontSize: 10,
    fontFamily: 'IRANSansX',
    color: '#4338ca',
    fontWeight: 'bold',
  },
});

export default CreateSmartExamScreen;
