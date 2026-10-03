import React, { useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Dimensions,
  SafeAreaView,
  LayoutAnimation,
  Platform,
  UIManager,
  I18nManager,
  Animated,
  FlatList,
  TextInput,
  Modal
} from 'react-native';
import { 
  ChevronRight, ChevronLeft, Calendar as CalendarIcon, 
  FileText, Users, CheckSquare, MessageCircle, 
  X, User, Plus
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';

const { width } = Dimensions.get('window');

// --- Mock Data ---
const MONTHS = ['مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی'];
const WEEKS = [
  { id: 1, title: 'هفته اول', subtitle: '۱ تا ۵ مهر' },
  { id: 2, title: 'هفته دوم', subtitle: '۶ تا ۱۲ مهر' },
  { id: 3, title: 'هفته سوم', subtitle: '۱۳ تا ۱۹ مهر' },
  { id: 4, title: 'هفته چهارم', subtitle: '۲۰ تا ۲۶ مهر' },
];
const FILTERS = [
  { id: 'exam', title: 'آزمون', icon: FileText },
  { id: 'activity', title: 'فعالیت کلاس', icon: Users },
  { id: 'homework', title: 'بررسی تکالیف', icon: CheckSquare },
  { id: 'question', title: 'پرسش کلاسی', icon: MessageCircle },
  { id: 'attendance', title: 'حضورغیاب', icon: User },
];
const DAYS = [
  { id: 'sat', name: 'شنبه', date: '۶ مهر' },
  { id: 'sun', name: 'یکشنبه', date: '۷ مهر', isToday: true },
  { id: 'mon', name: 'دوشنبه', date: '۸ مهر' },
  { id: 'tue', name: 'سه‌شنبه', date: '۹ مهر' },
  { id: 'wed', name: 'چهارشنبه', date: '۱۰ مهر' },
  { id: 'thu', name: 'پنجشنبه', date: '۱۱ مهر' },
  { id: 'fri', name: 'جمعه', date: '۱۲ مهر' },
];

const MOCK_STUDENTS = Array.from({ length: 25 }).map((_, index) => {
  const id = (index + 1).toString();
  const names = ['علی احمدی', 'زهرا محمدی', 'امیرحسین رضایی', 'نرگس کریمی', 'محمد حسینی', 'سارا نادری', 'ابوالفضل مرادی', 'فاطمه کاظمی', 'حسین شریفی', 'یلدا محمدی وکیلی نیا'];
  const name = names[index % names.length] + (index >= names.length ? ` (${index + 1})` : '');
  
  return {
    id,
    name,
    avatar: null,
    events: {
      'sat': [{ id: `e1_${id}`, type: 'good', title: 'خیلی خوب' }],
      'sun': index === 0 ? [
          { id: `e2_${id}_1`, type: 'good', title: 'عالی' },
          { id: `e2_${id}_2`, type: 'warning', title: '۱۵' },
          { id: `e2_${id}_3`, type: 'note', title: 'در کار گروهی بسیار مشارکت خوبی داشت و به دوستانش کمک کرد' },
        ] : [{ id: `e2_${id}`, type: 'warning', title: '۱۵' }],
      'mon': [{ id: `e3_${id}`, type: 'good', title: '۱۸' }],
      'tue': index % 3 === 0 ? [
          { id: `e4_${id}_1`, type: 'danger', title: 'نیاز به توجه' },
          { id: `e4_${id}_2`, type: 'note', title: 'غیبت موجه' }
        ] : [{ id: `e4_${id}`, type: 'danger', title: 'نیاز به توجه' }],
      'wed': [{ id: `e5_${id}`, type: 'neutral', title: '۱۵' }],
      'thu': [{ id: `e6_${id}`, type: 'good', title: 'عالی' }],
      'fri': [{ id: `e7_${id}`, type: 'note', title: 'در کار گروهی مشورت مفید داد' }]
    }
  };
});

// --- Helpers ---
const getEventStyles = (type: string) => {
  switch(type) {
    case 'good': return { bg: '#dcfce7', text: '#166534' }; 
    case 'warning': return { bg: '#fef9c3', text: '#854d0e' }; 
    case 'danger': return { bg: '#fee2e2', text: '#991b1b' }; 
    case 'note': return { bg: '#e0e7ff', text: '#3730a3' }; 
    default: return { bg: '#f1f5f9', text: '#475569' }; 
  }
};

const renderEventChip = (event: any, isDetailed = false) => {
  const styles = getEventStyles(event.type);
  return (
    <View key={event.id} style={[chipStyles.container, { backgroundColor: styles.bg, padding: isDetailed ? 8 : 6 }]}>
      <Text 
        style={[chipStyles.text, { color: styles.text, fontSize: isDetailed ? 12 : 10 }]} 
        numberOfLines={isDetailed ? undefined : 3}
      >
        {event.title}
      </Text>
    </View>
  );
};

const GradebookTableScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  
  React.useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const [activeMonth, setActiveMonth] = useState('مهر');
  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [activeWeek, setActiveWeek] = useState(2);
  const [activeFilter, setActiveFilter] = useState('exam');
  
  const [selectedDay, setSelectedDay] = useState<{student: any, day: any} | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState('good');
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});

  const handleRowLayout = useCallback((id: string, height: number) => {
    setRowHeights(prev => {
      if (Math.abs((prev[id] || 0) - height) < 1) return prev;
      return { ...prev, [id]: height };
    });
  }, []);

  const handleCellPress = useCallback((student: any, day: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDay({ student, day });
    setIsAddingNew(false);
  }, []);

  const handleCloseSheet = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDay(null);
    setIsAddingNew(false);
  }, []);

  const handleSaveNewDesc = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsAddingNew(false);
    setNewDesc('');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* --- Top Controls --- */}
      <View style={styles.topControls}>
        {/* Header / Back */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronRight size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
             <CalendarIcon size={18} color={COLORS.textLight} style={{marginLeft: 8}} />
             <Text style={styles.headerTitle}>دفتر نمره دیجیتال</Text>
          </View>
        </View>

        {/* Compact Month & Week Selector */}
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

        {/* Filters */}
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

      {/* --- Main Table Area (Dual View Architecture) --- */}
      <View style={{ flex: 1, backgroundColor: '#fff', flexDirection: 'row' }}>
        
        {/* Fixed Student Column */}
        <View style={{ width: 100, zIndex: 10, elevation: 10, backgroundColor: '#fff', borderLeftWidth: 1, borderLeftColor: COLORS.border }}>
           <View style={[styles.tableHeaderCell, { width: 100, borderLeftWidth: 0 }]}>
              <Text style={styles.tableHeaderText}>نام و نام خانوادگی</Text>
           </View>
           
           <View style={{ flex: 1, overflow: 'hidden' }}>
              <Animated.View style={{ transform: [{ translateY: Animated.multiply(scrollY, -1) }] }}>
                 {MOCK_STUDENTS.map((student, index) => (
                    <View 
                      key={student.id} 
                      style={[
                        styles.studentCell, 
                        { height: rowHeights[student.id] || 60, width: 100, borderLeftWidth: 0, justifyContent: 'center' }
                      ]}
                    >
                       <Text style={styles.studentName} numberOfLines={2}>{index + 1}- {student.name}</Text>
                    </View>
                 ))}
              </Animated.View>
           </View>
        </View>

        {/* Horizontally Scrollable Days Grid */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} bounces={false}>
           <View>
              {/* Days Header */}
              <View style={styles.daysHeaderRow}>
                 {DAYS.map(day => (
                    <View key={day.id} style={[styles.dayHeaderCell, day.isToday && styles.dayHeaderCellToday]}>
                      {day.isToday && <View style={styles.todayBadge}><Text style={styles.todayBadgeText}>امروز</Text></View>}
                      <Text style={[styles.dayName, day.isToday && styles.dayNameToday]}>{day.name}</Text>
                      <Text style={styles.dayDate}>{day.date}</Text>
                    </View>
                 ))}
              </View>

              {/* Days Body */}
              <Animated.FlatList
                 data={MOCK_STUDENTS}
                 keyExtractor={item => item.id}
                 showsVerticalScrollIndicator={false}
                 onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
                 scrollEventThrottle={16}
                 removeClippedSubviews={false}
                 initialNumToRender={10}
                 maxToRenderPerBatch={10}
                 windowSize={5}
                 renderItem={({ item: student }: any) => (
                    <View 
                       style={styles.dataRow} 
                       onLayout={(e) => handleRowLayout(student.id, e.nativeEvent.layout.height)}
                    >
                       {DAYS.map(day => {
                          const events = student.events[day.id] || [];
                          return (
                             <TouchableOpacity 
                                key={day.id}
                                style={[styles.dataCell, day.isToday && styles.dataCellToday]}
                                onPress={() => handleCellPress(student, day)}
                                activeOpacity={0.7}
                             >
                                {events.map((ev: any) => renderEventChip(ev))}
                             </TouchableOpacity>
                          )
                       })}
                    </View>
                 )}
              />
           </View>
        </ScrollView>
      </View>

      {/* --- Bottom Detail View (Sheet) --- */}
      {selectedDay && (
        <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
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
              
              <View style={styles.sheetEventsList}>
                 {selectedDay.student.events[selectedDay.day.id]?.map((ev: any) => (
                    <View key={'det-'+ev.id} style={{width: 120, marginLeft: 10}}>
                      {renderEventChip(ev, true)}
                    </View>
                 )) || (!isAddingNew && <Text style={styles.sheetEmpty}>موردی ثبت نشده است.</Text>)}
              </View>
           </View>

           {/* Add New Description Section */}
           {isAddingNew ? (
             <View style={styles.addNewContainer}>
                <Text style={styles.addNewTitle}>افزودن توصیف جدید</Text>
                <TextInput 
                  style={styles.addInput}
                  placeholder="متن توصیف را بنویسید..."
                  placeholderTextColor={COLORS.textLight}
                  value={newDesc}
                  onChangeText={setNewDesc}
                  multiline
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
                   <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNewDesc}>
                      <Text style={styles.saveBtnText}>ثبت</Text>
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  topControls: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingTop: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 },
  backBtn: { padding: 4 },
  headerTitleContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginRight: -28 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  
  compactSelectorRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 },
  compactMonthBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  compactMonthText: { marginHorizontal: 8, fontSize: 13, fontWeight: 'bold', color: COLORS.text },
  compactWeekBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, marginLeft: 8 },
  compactWeekBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  compactWeekText: { fontSize: 13, color: COLORS.textLight, fontWeight: 'bold' },
  compactWeekTextActive: { color: '#fff' },

  filterScroll: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 },
  filterPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginLeft: 8 },
  filterPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 13, color: COLORS.textLight, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  
  // Table 
  daysHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tableHeaderCell: { height: 60, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: '#f8fafc' },
  tableHeaderText: { fontSize: 12, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
  
  dayHeaderCell: { width: 100, minHeight: 60, paddingVertical: 6, justifyContent: 'center', alignItems: 'center', borderLeftWidth: 1, borderLeftColor: COLORS.border, backgroundColor: '#fff' },
  dayHeaderCellToday: { backgroundColor: '#eff6ff' },
  todayBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginBottom: 4 },
  todayBadgeText: { fontSize: 9, color: '#fff', fontWeight: 'bold' },
  dayName: { fontSize: 13, fontWeight: 'bold', color: COLORS.text, marginBottom: 2 },
  dayNameToday: { color: COLORS.primary },
  dayDate: { fontSize: 11, color: COLORS.textLight },
  
  dataRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  studentCell: { justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: COLORS.border, paddingHorizontal: 6, backgroundColor: '#fff' },
  studentName: { width: '100%', fontSize: 11, fontWeight: 'bold', color: COLORS.text, textAlign: 'left', writingDirection: 'rtl', lineHeight: 18 },
  
  dataCell: { width: 100, padding: 6, borderLeftWidth: 1, borderLeftColor: COLORS.border, backgroundColor: '#fff', justifyContent: 'center' },
  dataCellToday: { backgroundColor: '#f8fafc' },

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
  addInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10, fontFamily: 'IRANSansX', fontSize: 13, minHeight: 60, textAlignVertical: 'top' },
  colorPicker: { flexDirection: 'row', marginTop: 10, marginBottom: 16 },
  colorCircle: { width: 24, height: 24, borderRadius: 12, marginLeft: 8, borderWidth: 2 },
  addActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 8, marginLeft: 8 },
  cancelBtnText: { color: COLORS.textLight, fontSize: 13 },
  saveBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  
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

export default GradebookTableScreen;
