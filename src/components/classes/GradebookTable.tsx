import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  TextInput,
  Modal,
  ActivityIndicator
} from 'react-native';
import { 
  ChevronRight, ChevronLeft, Calendar as CalendarIcon, 
  FileText, Users, CheckSquare, MessageCircle, 
  X, User, Plus
} from 'lucide-react-native';
import { COLORS } from '../../theme/colors';
import { api } from '../../api/axiosConfig';
import { toJalaali, toGregorian } from 'jalaali-js';

const { width, height } = Dimensions.get('window');

// --- Mock Data & Dynamic Days ---
const MONTHS = ['مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی'];
const WEEKS = [
  { id: 1, title: 'هفته اول' },
  { id: 2, title: 'هفته دوم' },
  { id: 3, title: 'هفته سوم' },
  { id: 4, title: 'هفته چهارم' },
  { id: 5, title: 'هفته پنجم' },
];
const FILTERS = [
  { id: 'attendance', title: 'حضورغیاب', icon: User },
  { id: 'exam', title: 'آزمون', icon: FileText },
  { id: 'activity', title: 'فعالیت کلاس', icon: Users },
  { id: 'homework', title: 'بررسی تکالیف', icon: CheckSquare },
  { id: 'question', title: 'پرسش کلاسی', icon: MessageCircle },
];

const getWeekDays = (monthName: string, weekId: number) => {
  const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  const dayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']; 
  
  const today = new Date();
  const todayJ = toJalaali(today);
  const currentYear = todayJ.jy;
  
  const jm = monthNames.indexOf(monthName) + 1;
  if (jm === 0) return [];

  const firstDayG = toGregorian(currentYear, jm, 1);
  const firstDayDate = new Date(firstDayG.gy, firstDayG.gm - 1, firstDayG.gd);
  const firstDayOfWeek = firstDayDate.getDay(); 
  
  const diffToSaturday = (firstDayOfWeek + 1) % 7;
  
  const firstSaturday = new Date(firstDayDate);
  firstSaturday.setDate(firstSaturday.getDate() - diffToSaturday);
  
  const targetSaturday = new Date(firstSaturday);
  targetSaturday.setDate(targetSaturday.getDate() + (weekId - 1) * 7);
  
  const weekDays = [];
  const todayStr = `${todayJ.jy}/${todayJ.jm.toString().padStart(2, '0')}/${todayJ.jd.toString().padStart(2, '0')}`;

  for (let i = 0; i < 7; i++) {
    const d = new Date(targetSaturday);
    d.setDate(d.getDate() + i);
    const jDate = toJalaali(d);
    const fullDate = `${jDate.jy}/${jDate.jm.toString().padStart(2, '0')}/${jDate.jd.toString().padStart(2, '0')}`;
    const dow = d.getDay();
    const gregorianDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    weekDays.push({
      id: `day_${jDate.jm}_${jDate.jd}`,
      name: dayNames[dow],
      date: `${jDate.jd} ${monthNames[jDate.jm - 1]}`,
      fullDate,
      isToday: fullDate === todayStr,
      gregorianDate,
      dowJalali: dow
    });
  }
  return weekDays;
};

// --- Helpers ---
const getEventStyles = (type: string) => {
  switch(type) {
    case 'good': return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' }; 
    case 'warning': return { bg: '#fef9c3', text: '#854d0e', border: '#fef08a' }; 
    case 'danger': return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' }; 
    case 'note': return { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' }; 
    default: return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' }; 
  }
};

const renderEventChip = (event: any, isDetailed = false) => {
  const styles = getEventStyles(event.color || event.type);
  return (
    <View key={event._id || event.id} style={[chipStyles.container, { backgroundColor: styles.bg, borderColor: styles.border, padding: isDetailed ? 8 : 6 }]}>
      <Text 
        style={[chipStyles.text, { color: styles.text, fontSize: isDetailed ? 12 : 10 }]} 
        numberOfLines={isDetailed ? undefined : 3}
      >
        {event.title}
      </Text>
    </View>
  );
};

const GradebookTable = ({ classId, classroom }: any) => {
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const todayInit = new Date();
  const todayInitJ = toJalaali(todayInit);
  const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  const currentMonthName = monthNames[todayInitJ.jm - 1];

  const firstDayG = toGregorian(todayInitJ.jy, todayInitJ.jm, 1);
  const firstDayDate = new Date(firstDayG.gy, firstDayG.gm - 1, firstDayG.gd);
  const diffToSaturday = (firstDayDate.getDay() + 1) % 7;
  const firstSaturday = new Date(firstDayDate);
  firstSaturday.setDate(firstSaturday.getDate() - diffToSaturday);
  const daysDiff = Math.floor((todayInit.getTime() - firstSaturday.getTime()) / (1000 * 60 * 60 * 24));
  const currentWeekIndex = Math.floor(daysDiff / 7) + 1;

  const [activeMonth, setActiveMonth] = useState(currentMonthName);
  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [activeWeek, setActiveWeek] = useState(currentWeekIndex >= 1 && currentWeekIndex <= 5 ? currentWeekIndex : 1);
  const [activeFilter, setActiveFilter] = useState('attendance');

  const DAYS = React.useMemo(() => getWeekDays(activeMonth, activeWeek), [activeMonth, activeWeek]);
  
  const [students, setStudents] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<any[]>([]);
  const [classSessions, setClassSessions] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDay, setSelectedDay] = useState<{student: any, day: any} | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState('good');
  const [isSaving, setIsSaving] = useState(false);

  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});

  const fetchData = useCallback(async () => {
    if (!classId) return;
    setIsLoading(true);
    console.log(`[GradebookTable] fetching data for class: ${classId}, filter: ${activeFilter}`);
    try {
      const res = await api.get(`/teacher/classrooms/${classId}/gradebook`, {
        params: { filterType: activeFilter }
      });
      console.log('[GradebookTable] response success:', res.data.success, 'students count:', res.data.data?.students?.length);
      if (res.data.success) {
        setStudents(res.data.data.students || []);
        setRecords(res.data.data.records || []);
        setWeeklySchedule(res.data.data.weeklySchedule || []);
        setClassSessions(res.data.data.classSessions || []);
        setAttendanceRecords(res.data.data.attendanceRecords || []);
      }
    } catch (err) {
      console.log('Error fetching gradebook:', err);
    } finally {
      setIsLoading(false);
    }
  }, [classId, activeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRowLayout = useCallback((id: string, height: number) => {
    setRowHeights(prev => {
      if (Math.abs((prev[id] || 0) - height) < 1) return prev;
      return { ...prev, [id]: height };
    });
  }, []);

  const getEventsForStudentAndDay = (studentId: string, fullDate: string) => {
     return records.filter(r => r.student === studentId && r.date === fullDate);
  };

  const handleCellPress = useCallback((student: any, day: any, isEmpty: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDay({ student, day });
    setIsAddingNew(isEmpty);
    setNewDesc('');
    setNewColor('good');
  }, []);

  const handleCloseSheet = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDay(null);
    setIsAddingNew(false);
  }, []);

  const handleSaveAttendance = async (subject: string, status: string) => {
    if (!selectedAttendance) return;
    const { student, day } = selectedAttendance;
    try {
       const res = await api.post(`/teacher/classrooms/${classId}/gradebook/attendance`, {
           studentPhone: student.phone || student._id,
           date: day.gregorianDate,
           subject,
           status
       });
       if (res.data.success) {
          fetchData(); // refresh
       }
    } catch (err) {
       console.log('Error saving attendance', err);
    }
  };

  const handleSaveNewDesc = async () => {
    if (!selectedDay || !newDesc.trim()) return;
    setIsSaving(true);
    try {
      const res = await api.post(`/teacher/classrooms/${classId}/gradebook`, {
        studentId: selectedDay.student._id,
        date: selectedDay.day.fullDate,
        type: activeFilter,
        color: newColor,
        title: newDesc.trim()
      });
      if (res.data.success) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsAddingNew(false);
        setNewDesc('');
        fetchData();
      }
    } catch (err) {
      console.log('Error saving record:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { marginHorizontal: -20, marginTop: 24, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border }]}>
      {/* --- Top Controls --- */}
      <View style={styles.topControls}>
        <View style={styles.headerTitleContainer}>
           <Text style={styles.headerTitle}>دفتر نمره کلاس</Text>
        </View>

        <View style={styles.compactSelectorRow}>
           <TouchableOpacity style={styles.compactMonthBtn} onPress={() => setMonthModalVisible(true)}>
             <ChevronRight size={18} color={COLORS.textLight} />
             <Text style={styles.compactMonthText}>{activeMonth}</Text>
             <ChevronLeft size={18} color={COLORS.textLight} />
           </TouchableOpacity>
           
           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
             <View style={{ flexDirection: 'row', paddingRight: 8 }}>
               {WEEKS.map(w => (
                 <TouchableOpacity 
                   key={w.id} 
                   style={[styles.compactWeekBtn, activeWeek === w.id && styles.compactWeekBtnActive]}
                   onPress={() => setActiveWeek(w.id)}
                 >
                   <Text style={[styles.compactWeekText, activeWeek === w.id && styles.compactWeekTextActive]}>{w.title}</Text>
                 </TouchableOpacity>
               ))}
             </View>
           </ScrollView>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map(f => {
            const Icon = f.icon;
            const isActive = activeFilter === f.id;
            return (
              <TouchableOpacity 
                key={f.id} 
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveFilter(f.id)} 
              >
                <Icon size={16} color={isActive ? '#fff' : COLORS.textLight} style={{marginLeft: 6}} />
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{f.title}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* --- Main Table Area --- */}
      {isLoading ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : students.length === 0 ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <Text style={{ fontFamily: 'IRANSansX', color: COLORS.textLight }}>هیچ دانش‌آموزی در این کلاس یافت نشد.</Text>
        </View>
      ) : (
        <View style={{ backgroundColor: '#fff', flexDirection: 'row' }}>
          
          <View style={{ width: 100, zIndex: 10, elevation: 10, backgroundColor: '#fff', borderLeftWidth: 1, borderLeftColor: COLORS.border }}>
             <View style={[styles.tableHeaderCell, { width: 100, borderLeftWidth: 0 }]}>
                <Text style={styles.tableHeaderText}>نام و نام خانوادگی</Text>
             </View>
             
             <View style={{ overflow: 'hidden' }}>
                {students.map((student, index) => (
                   <View 
                     key={student._id} 
                     style={[
                       styles.studentCell, 
                       { height: rowHeights[student._id] || 60, width: 100, borderLeftWidth: 0, justifyContent: 'center' }
                     ]}
                   >
                      <Text style={styles.studentName} numberOfLines={2}>{index + 1}- {student.name}</Text>
                   </View>
                ))}
             </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} bounces={false}>
             <View>
                <View style={styles.daysHeaderRow}>
                   {DAYS.map(day => (
                      <View key={day.id} style={[styles.dayHeaderCell, day.isToday && styles.dayHeaderCellToday]}>
                        {day.isToday && <View style={styles.todayBadge}><Text style={styles.todayBadgeText}>امروز</Text></View>}
                        <Text style={[styles.dayName, day.isToday && styles.dayNameToday]}>{day.name}</Text>
                        <Text style={styles.dayDate}>{day.date}</Text>
                      </View>
                   ))}
                </View>

                <View>
                   {students.map((student: any) => (
                      <View 
                         key={student._id}
                         style={styles.dataRow} 
                         onLayout={(e) => handleRowLayout(student._id, e.nativeEvent.layout.height)}
                      >
                         {DAYS.map(day => {
                            if (activeFilter === 'attendance') {
                               const isFuture = new Date(`${day.gregorianDate}T00:00:00`).getTime() > new Date().setHours(0,0,0,0);
                               if (isFuture) {
                                  return (
                                     <View key={day.id} style={[styles.dataCell, day.isToday && styles.dataCellToday]}>
                                        <Text style={{ fontSize: 10, color: COLORS.textLight, textAlign: 'center', fontFamily: 'IRANSansX' }}>برگزار نشده</Text>
                                     </View>
                                  )
                               }
                               const subjects = weeklySchedule.filter((s: any) => s.dayOfWeek === day.dowJalali);
                               if (subjects.length > 0) {
                                  console.log(`[GradebookTable] dowJalali for ${day.name} is ${day.dowJalali}. Found subjects:`, subjects.map((s:any)=>({subj: s.subject, dow: s.dayOfWeek})));
                               }
                               if (subjects.length === 0) {
                                  return <View key={day.id} style={[styles.dataCell, day.isToday && styles.dataCellToday]} />
                               }
                               
                               return (
                                  <TouchableOpacity 
                                     key={day.id}
                                     style={[styles.dataCell, day.isToday && styles.dataCellToday, { paddingVertical: 4 }]}
                                     onPress={() => {
                                        setSelectedAttendance({ student, day, subjects });
                                        setAttendanceModalVisible(true);
                                     }}
                                     activeOpacity={0.7}
                                  >
                                     {subjects.map((subj: any) => {
                                        const session = classSessions.find((s: any) => s.date === day.gregorianDate && s.subject === subj.subject);
                                        const record = session ? attendanceRecords.find((a: any) => a.studentPhone === (student.phone || student._id) && a.sessionId === session._id) : null;
                                        const status = record ? record.status : 'PRESENT';
                                        const statusText = status === 'PRESENT' ? 'حاضر' : status === 'LATE' ? 'تاخیر' : status === 'ABSENT_EXCUSED' ? 'غ موجه' : 'غ غیرموجه';
                                        const statusColor = status === 'PRESENT' ? '#166534' : status === 'LATE' ? '#854d0e' : status === 'ABSENT_EXCUSED' ? '#ca8a04' : '#991b1b';
                                        const bg = status === 'PRESENT' ? '#dcfce7' : status === 'LATE' ? '#fef9c3' : status === 'ABSENT_EXCUSED' ? '#fef08a' : '#fee2e2';
                                        
                                        return (
                                           <View key={subj._id} style={{ backgroundColor: bg, padding: 4, borderRadius: 4, marginBottom: 4 }}>
                                              <Text style={{ fontSize: 9, color: statusColor, textAlign: 'center', fontWeight: 'bold', fontFamily: 'IRANSansX' }}>{subj.subject} - {statusText}</Text>
                                           </View>
                                        )
                                     })}
                                  </TouchableOpacity>
                               )
                            }
                            
                            const events = getEventsForStudentAndDay(student._id, day.fullDate);
                            const isEmpty = events.length === 0;
                            return (
                               <TouchableOpacity 
                                  key={day.id}
                                  style={[styles.dataCell, day.isToday && styles.dataCellToday]}
                                  onPress={() => handleCellPress(student, day, isEmpty)}
                                  activeOpacity={0.7}
                               >
                                  {isEmpty ? (
                                    <View style={styles.emptyCellBtn}>
                                       <Plus size={14} color={COLORS.primary} />
                                       <Text style={styles.emptyCellText}>افزودن فعالیت</Text>
                                    </View>
                                  ) : (
                                    events.map((ev: any) => renderEventChip(ev))
                                  )}
                               </TouchableOpacity>
                            )
                         })}
                      </View>
                   ))}
                </View>
             </View>
          </ScrollView>
        </View>
      )}

      {/* --- Bottom Detail View (Sheet) --- */}
      <Modal visible={!!selectedDay} transparent animationType="slide" onRequestClose={handleCloseSheet}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleCloseSheet} />
          {selectedDay && (
            <View style={[styles.bottomSheet, { position: 'relative', paddingBottom: 24, borderTopWidth: 0, elevation: 0 }]}>
           <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={handleCloseSheet}>
                 <X size={20} color={COLORS.textLight} />
              </TouchableOpacity>
              <View style={styles.sheetHeaderRight}>
                 <CalendarIcon size={16} color={COLORS.textLight} style={{marginLeft: 6}} />
                 <Text style={styles.sheetDateText}>جزئیات روز: {selectedDay.day.name} {selectedDay.day.date}</Text>
              </View>
           </View>
           <View style={styles.sheetBody}>
              <View style={styles.sheetStudentInfo}>
                 <View style={styles.sheetAvatar}><User size={20} color={COLORS.textLight}/></View>
                 <Text style={styles.sheetStudentName}>{selectedDay.student.name}</Text>
              </View>
              
              {!isAddingNew && (
                <View style={styles.sheetEventsList}>
                   {getEventsForStudentAndDay(selectedDay.student._id, selectedDay.day.fullDate).map((ev: any) => (
                      <View key={'det-'+ev._id} style={{width: 120, marginLeft: 10}}>
                        {renderEventChip(ev, true)}
                      </View>
                   ))}
                   {getEventsForStudentAndDay(selectedDay.student._id, selectedDay.day.fullDate).length === 0 && (
                     <Text style={styles.sheetEmpty}>موردی ثبت نشده است.</Text>
                   )}
                </View>
              )}
           </View>

           {/* Add New Description Section */}
           {isAddingNew ? (
             <View style={styles.addNewContainer}>
                <Text style={styles.addNewTitle}>افزودن توصیف جدید</Text>
                <TextInput 
                  style={styles.addInput}
                  placeholder="متن توصیف یا نمره را بنویسید..."
                  placeholderTextColor={COLORS.textLight}
                  multiline
                  value={newDesc}
                  onChangeText={setNewDesc}
                />
                <View style={styles.colorPicker}>
                   {['good', 'warning', 'danger', 'note'].map(color => (
                     <TouchableOpacity 
                       key={color}
                       style={[
                         styles.colorCircle, 
                         { backgroundColor: getEventStyles(color).bg, borderColor: newColor === color ? getEventStyles(color).text : 'transparent' }
                       ]}
                       onPress={() => setNewColor(color)}
                     />
                   ))}
                </View>
                <View style={styles.addActions}>
                   <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAddingNew(false)}>
                     <Text style={styles.cancelBtnText}>انصراف</Text>
                   </TouchableOpacity>
                   <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNewDesc} disabled={isSaving}>
                     {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>ثبت توصیف</Text>}
                   </TouchableOpacity>
                </View>
             </View>
           ) : (
             <TouchableOpacity style={styles.addNewBtn} onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setIsAddingNew(true);
             }}>
                <Plus size={16} color={COLORS.primary} style={{marginLeft: 6}} />
                <Text style={styles.addNewBtnText}>افزودن توصیف</Text>
             </TouchableOpacity>
           )}
            </View>
          )}
        </View>
      </Modal>

      {/* Month Selection Modal */}
      <Modal visible={monthModalVisible} transparent animationType="fade">
         <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMonthModalVisible(false)}>
            <View style={styles.modalContent}>
               <Text style={styles.modalTitle}>انتخاب ماه</Text>
               <View style={styles.modalMonthsGrid}>
                  {MONTHS.map(m => (
                    <TouchableOpacity 
                      key={m} 
                      style={[styles.modalMonthBtn, activeMonth === m && styles.modalMonthBtnActive]}
                      onPress={() => {
                        setActiveMonth(m);
                        setMonthModalVisible(false);
                      }}
                    >
                      <Text style={[styles.modalMonthText, activeMonth === m && styles.modalMonthTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
               </View>
            </View>
         </TouchableOpacity>
      </Modal>


      {/* --- Attendance Bottom Sheet --- */}
      <Modal visible={attendanceModalVisible} transparent animationType="slide" onRequestClose={() => setAttendanceModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setAttendanceModalVisible(false)} />
          {selectedAttendance && (
            <View style={[styles.bottomSheet, { position: 'relative', paddingBottom: 24, borderTopWidth: 0, elevation: 0 }]}>
               <View style={styles.sheetHeader}>
                  <TouchableOpacity onPress={() => setAttendanceModalVisible(false)}>
                     <X size={20} color={COLORS.textLight} />
                  </TouchableOpacity>
                  <View style={styles.sheetHeaderRight}>
                     <CalendarIcon size={16} color={COLORS.textLight} style={{marginLeft: 6}} />
                     <Text style={styles.sheetDateText}>حضور غیاب: {selectedAttendance.day.name} {selectedAttendance.day.date}</Text>
                  </View>
               </View>
               <View style={styles.sheetBody}>
                  <View style={styles.sheetStudentInfo}>
                     <View style={styles.sheetAvatar}><User size={20} color={COLORS.textLight}/></View>
                     <Text style={styles.sheetStudentName}>{selectedAttendance.student.name}</Text>
                  </View>

                  <ScrollView style={{ marginTop: 16, maxHeight: height * 0.6 }}>
                     {selectedAttendance.subjects.map((subj: any) => {
                         const session = classSessions.find((s: any) => s.date === selectedAttendance.day.gregorianDate && s.subject === subj.subject);
                         const record = session ? attendanceRecords.find((a: any) => a.studentPhone === (selectedAttendance.student.phone || selectedAttendance.student._id) && a.sessionId === session._id) : null;
                         const currentStatus = record ? record.status : 'PRESENT';

                         return (
                            <View key={subj._id} style={{ marginBottom: 16, backgroundColor: '#f8fafc', padding: 12, borderRadius: 12 }}>
                               <Text style={{ fontFamily: 'IRANSansX', fontWeight: 'bold', fontSize: 14, color: COLORS.text, marginBottom: 12, textAlign: 'right' }}>
                                  درس {subj.subject}
                               </Text>
                               
                               <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                                  {[
                                     { id: 'PRESENT', label: 'حاضر', color: '#166534', bg: '#dcfce7' },
                                     { id: 'LATE', label: 'تاخیر', color: '#854d0e', bg: '#fef9c3' },
                                     { id: 'ABSENT_EXCUSED', label: 'غ موجه', color: '#ca8a04', bg: '#fef08a' },
                                     { id: 'ABSENT_UNEXCUSED', label: 'غ غیرموجه', color: '#991b1b', bg: '#fee2e2' },
                                  ].map(statusOpt => (
                                     <TouchableOpacity 
                                        key={statusOpt.id}
                                        style={{
                                           paddingVertical: 8,
                                           paddingHorizontal: 12,
                                           borderRadius: 8,
                                           backgroundColor: currentStatus === statusOpt.id ? statusOpt.bg : '#fff',
                                           borderWidth: 1,
                                           borderColor: currentStatus === statusOpt.id ? statusOpt.color : COLORS.border,
                                           marginBottom: 8,
                                           minWidth: '48%',
                                           alignItems: 'center'
                                        }}
                                        onPress={() => handleSaveAttendance(subj.subject, statusOpt.id)}
                                     >
                                        <Text style={{ fontFamily: 'IRANSansX', fontSize: 12, color: currentStatus === statusOpt.id ? statusOpt.color : COLORS.textLight, fontWeight: currentStatus === statusOpt.id ? 'bold' : 'normal' }}>
                                           {statusOpt.label}
                                        </Text>
                                     </TouchableOpacity>
                                  ))}
                               </View>
                            </View>
                         )
                     })}
                  </ScrollView>
               </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const chipStyles = StyleSheet.create({
  container: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  text: {
    fontFamily: 'IRANSansX',
    textAlign: 'center',
    lineHeight: 16,
  }
});

const styles = StyleSheet.create({
  container: { backgroundColor: '#f8fafc' },
  topControls: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingTop: 16 },
  headerTitleContainer: { alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 16 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, textAlign: 'right', width: '100%' },
  
  compactSelectorRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  compactMonthBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  compactMonthText: { marginHorizontal: 8, fontSize: 13, fontWeight: 'bold', color: COLORS.text },
  compactWeekBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, marginLeft: 8 },
  compactWeekBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  compactWeekText: { fontSize: 13, color: COLORS.textLight, fontWeight: 'bold' },
  compactWeekTextActive: { color: '#fff' },

  filterScroll: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16 },
  filterPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginLeft: 8 },
  filterPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 13, color: COLORS.textLight, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  
  // Table 
  daysHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tableHeaderCell: { height: 70, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: '#f8fafc' },
  tableHeaderText: { fontSize: 12, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
  
  dayHeaderCell: { width: 100, height: 70, paddingVertical: 6, justifyContent: 'center', alignItems: 'center', borderLeftWidth: 1, borderLeftColor: COLORS.border, backgroundColor: '#fff' },
  dayHeaderCellToday: { backgroundColor: '#eff6ff' },
  todayBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginBottom: 4 },
  todayBadgeText: { fontSize: 9, color: '#fff', fontWeight: 'bold' },
  dayName: { fontSize: 13, fontWeight: 'bold', color: COLORS.text, marginBottom: 2 },
  dayNameToday: { color: COLORS.primary },
  dayDate: { fontSize: 11, color: COLORS.textLight },
  
  dataRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border, minHeight: 60 },
  studentCell: { justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: COLORS.border, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingHorizontal: 6, backgroundColor: '#fff', minHeight: 60 },
  studentName: { width: '100%', fontSize: 11, fontWeight: 'bold', color: COLORS.text, textAlign: 'left', writingDirection: 'rtl', lineHeight: 18 },
  
  dataCell: { width: 100, minHeight: 60, padding: 6, borderLeftWidth: 1, borderLeftColor: COLORS.border, backgroundColor: '#fff', justifyContent: 'center' },
  dataCellToday: { backgroundColor: '#f8fafc' },
  emptyCellBtn: { flex: 1, borderWidth: 1, borderColor: '#bfdbfe', borderStyle: 'dashed', borderRadius: 8, justifyContent: 'center', alignItems: 'center', padding: 4, minHeight: 40 },
  emptyCellText: { color: COLORS.primary, fontSize: 9, marginTop: 2, fontWeight: 'bold', textAlign: 'center' },

  // Bottom Sheet
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, zIndex: 100, elevation: 100, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10, borderTopWidth: 1, borderColor: COLORS.border },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 12 },
  sheetHeaderRight: { flexDirection: 'row', alignItems: 'center' },
  sheetDateText: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  sheetBody: { flexDirection: 'column', alignItems: 'flex-start', marginBottom: 10 },
  sheetStudentInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, width: '100%', backgroundColor: '#f8fafc', padding: 8, borderRadius: 10 },
  sheetAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  sheetStudentName: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  sheetEventsList: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
  sheetEmpty: { fontSize: 13, color: COLORS.textLight, marginTop: 4, marginRight: 4 },
  
  // Add New
  addNewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff', paddingVertical: 12, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: '#bfdbfe', borderStyle: 'dashed' },
  addNewBtnText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 },
  addNewContainer: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: COLORS.border },
  addNewTitle: { fontSize: 13, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  addInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10, fontFamily: 'IRANSansX', fontSize: 13, minHeight: 60, textAlignVertical: 'top', textAlign: 'right' },
  colorPicker: { flexDirection: 'row', marginTop: 10, marginBottom: 16 },
  colorCircle: { width: 24, height: 24, borderRadius: 12, marginLeft: 8, borderWidth: 2 },
  addActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 8, marginLeft: 8 },
  cancelBtnText: { color: COLORS.textLight, fontSize: 13, fontFamily: 'IRANSansX' },
  saveBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold', fontFamily: 'IRANSansX' },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 10 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginBottom: 16 },
  modalMonthsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  modalMonthBtn: { width: '30%', paddingVertical: 12, margin: '1.5%', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 10 },
  modalMonthBtnActive: { backgroundColor: COLORS.primary },
  modalMonthText: { fontSize: 13, color: COLORS.text },
  modalMonthTextActive: { color: '#fff', fontWeight: 'bold' }
});

export default GradebookTable;
