import { 
  FileEdit, FileText, Settings, Layers, MapPin, Activity, 
  Sun, Music, BookOpen, Scaling, Calculator, Calendar, 
  Percent, Hash, Banknote, Ruler, Weight, Thermometer, 
  Clock, Zap, Microscope, FlaskConical, Sigma, HeartPulse,
  Shapes, Box, PercentSquare, Award, Square, Plus, Dices, Users, Flag
} from 'lucide-react-native';

export interface ToolItem {
  id: string;
  title: string;
  icon?: any;
  color?: string;
  route: string;
  params?: any;
  children?: ToolItem[];
}

export const teacherToolsHierarchy: ToolItem[] = [

  {
    id: 'exam',
    title: 'مدیریت آزمون آنلاین',
    route: 'GenericCategoryScreen',
    icon: FileEdit,
    color: '#3b82f6',
    children: [
      { id: 'exam1', title: 'ایجاد آزمون جدید', route: 'CreateExamStep1Screen', icon: Plus },
      { id: 'exam2', title: 'آزمون‌های من (مدیریت و نتایج)', route: 'ExamListScreen', icon: FileText }
    ]
  },
  { id: '2', title: 'برگه آزمون‌ساز', route: 'MobileQuestionBuilder', icon: FileText, color: '#10b981' },
  { id: '3', title: 'فرم‌ساز', route: 'PlaceholderScreen', params: { title: 'فرم‌ساز' }, icon: Settings, color: '#8b5cf6' },
  { id: '4', title: 'ابزار فایل', route: 'ToolsListScreen', icon: Layers, color: '#f59e0b' },
  { id: '5', title: 'اطلاعات و آدرس', route: 'PlaceholderScreen', params: { title: 'اطلاعات و آدرس' }, icon: MapPin, color: '#ef4444' },
  {
    id: '6', title: 'ورزشی', route: 'GenericCategoryScreen', icon: Activity, color: '#ec4899',
    children: [
      { id: 'sp1', title: 'کرنومتر و رکوردگیری', route: 'StopwatchScreen', icon: Clock },
      { id: 'sp2', title: 'تایمر تمرین / اینتروال', route: 'IntervalTimerScreen', icon: Activity },
      { id: 'sp3', title: 'تایمر چندمرحله‌ای', route: 'IntervalTimerScreen', icon: Layers },
      { id: 'sp4', title: 'شمارش ست و تکرار', route: 'RepCounterScreen', icon: Plus },
      { id: 'sp5', title: 'انتخاب تصادفی دانش‌آموز', route: 'RandomStudentScreen', icon: Dices },
      { id: 'sp6', title: 'تقسیم گروه‌ها', route: 'GroupDividerScreen', icon: Users },
      { id: 'sp7', title: 'ثبت رکورد دانش‌آموزان', route: 'StopwatchScreen', icon: Flag },
    ]
  },
  { id: '7', title: 'صبحگاه', route: 'PlaceholderScreen', params: { title: 'صبحگاه' }, icon: Sun, color: '#f97316' },
  { id: '8', title: 'موزیک', route: 'PlaceholderScreen', params: { title: 'موزیک' }, icon: Music, color: '#6366f1' },
  { id: '9', title: 'ابزار تدریس', route: 'PlaceholderScreen', params: { title: 'ابزار تدریس' }, icon: BookOpen, color: '#14b8a6' },
  
  // 🧮 محاسبه‌گرها
  {
    id: 'calcs',
    title: 'محاسبه‌گرها',
    route: 'GenericCategoryScreen',
    icon: Calculator,
    color: '#0ea5e9',
    children: [
      {
        id: 'calc-percent', title: 'محاسبه‌گر درصد', icon: Percent, color: '#f43f5e', route: 'GenericCategoryScreen',
        children: [
          { id: 'p1', title: 'درصد یک عدد', icon: PercentSquare, route: 'DynamicCalculatorScreen', params: { formulaId: 'p1-percent' } },
          { id: 'p2', title: 'درصد افزایش یا کاهش', route: 'DynamicCalculatorScreen', params: { formulaId: 'p2-percent-diff' } },
          { id: 'p3', title: 'درصد تغییر بین دو عدد', route: 'DynamicCalculatorScreen', params: { formulaId: 'p3-percent-change' } },
          { id: 'p4', title: 'تخفیف', route: 'DynamicCalculatorScreen', params: { formulaId: 'p4-discount' } },
          { id: 'p5', title: 'قیمت بعد از تخفیف', route: 'DynamicCalculatorScreen', params: { formulaId: 'p5-price-after-discount' } },
          { id: 'p6', title: 'قیمت قبل از تخفیف', route: 'DynamicCalculatorScreen', params: { formulaId: 'p6-price-before-discount' } },
          { id: 'p7', title: 'محاسبه درصد سود', route: 'DynamicCalculatorScreen', params: { formulaId: 'p7-profit' } },
          { id: 'p8', title: 'محاسبه درصد افزایش قیمت', route: 'PlaceholderScreen', params: { title: 'محاسبه درصد افزایش قیمت' } },
          { id: 'p9', title: 'محاسبه درصد کاهش قیمت', route: 'PlaceholderScreen', params: { title: 'محاسبه درصد کاهش قیمت' } },
        ]
      },
      {
        id: 'calc-grades', title: 'محاسبه‌گر نمرات', icon: FileEdit, color: '#3b82f6', route: 'GenericCategoryScreen',
        children: [
          { id: 'g1', title: 'میانگین نمرات', icon: Award, route: 'DynamicCalculatorScreen', params: { formulaId: 'g1-average' } },
          { id: 'g2', title: 'محاسبه معدل', route: 'DynamicCalculatorScreen', params: { formulaId: 'g2-gpa' } },
          { id: 'g3', title: 'میانگین وزنی', route: 'DynamicCalculatorScreen', params: { formulaId: 'g2-gpa' } },
          { id: 'g4', title: 'محاسبه نمره نهایی', route: 'DynamicCalculatorScreen', params: { formulaId: 'g4-final-grade' } },
          { id: 'g5', title: 'نمره مستمر و پایانی', route: 'DynamicCalculatorScreen', params: { formulaId: 'g4-final-grade' } },
          { id: 'g6', title: 'درصد قبولی کلاس', route: 'DynamicCalculatorScreen', params: { formulaId: 'g6-pass-percent' } },
          { id: 'g7', title: 'تعداد قبول و مردود', route: 'DynamicCalculatorScreen', params: { formulaId: 'g6-pass-percent' } },
          { id: 'g8', title: 'نمره آزمون', route: 'DynamicCalculatorScreen', params: { formulaId: 'g9-negative' } },
          { id: 'g9', title: 'نمره با نمره منفی', route: 'DynamicCalculatorScreen', params: { formulaId: 'g9-negative' } },
          { id: 'g10', title: 'تعداد پاسخ صحیح موردنیاز', route: 'PlaceholderScreen', params: { title: 'تعداد پاسخ صحیح' } },
          { id: 'g11', title: 'محاسبه میانگین نمرات کلاس', route: 'DynamicCalculatorScreen', params: { formulaId: 'g1-average' } },
        ]
      },
      {
        id: 'calc-area', title: 'محاسبه‌گر مساحت و محیط', icon: Shapes, color: '#8b5cf6', route: 'GenericCategoryScreen',
        children: [
          { id: 'a1', title: 'مربع', icon: Square, route: 'DynamicCalculatorScreen', params: { formulaId: 'a1-square' } },
          { id: 'a2', title: 'مستطیل', route: 'DynamicCalculatorScreen', params: { formulaId: 'a2-rectangle' } },
          { id: 'a3', title: 'مثلث', route: 'DynamicCalculatorScreen', params: { formulaId: 'a3-triangle' } },
          { id: 'a4', title: 'دایره', route: 'DynamicCalculatorScreen', params: { formulaId: 'a4-circle' } },
          { id: 'a5', title: 'ذوزنقه', route: 'DynamicCalculatorScreen', params: { formulaId: 'a5-trapezoid' } },
          { id: 'a6', title: 'متوازی‌الاضلاع', route: 'DynamicCalculatorScreen', params: { formulaId: 'a6-parallelogram' } },
          { id: 'a7', title: 'لوزی', route: 'DynamicCalculatorScreen', params: { formulaId: 'a7-rhombus' } },
        ]
      },
      {
        id: 'calc-volume', title: 'محاسبه‌گر حجم', icon: Box, color: '#f59e0b', route: 'GenericCategoryScreen',
        children: [
          { id: 'v1', title: 'حجم مکعب', route: 'DynamicCalculatorScreen', params: { formulaId: 'v1-cube' } },
          { id: 'v2', title: 'حجم مکعب‌مستطیل', route: 'DynamicCalculatorScreen', params: { formulaId: 'v2-cuboid' } },
          { id: 'v3', title: 'حجم استوانه', route: 'DynamicCalculatorScreen', params: { formulaId: 'v3-cylinder' } },
          { id: 'v4', title: 'حجم مخروط', route: 'DynamicCalculatorScreen', params: { formulaId: 'v4-cone' } },
          { id: 'v5', title: 'حجم کره', route: 'DynamicCalculatorScreen', params: { formulaId: 'v5-sphere' } },
        ]
      },
      {
        id: 'calc-sport', title: 'محاسبه‌گرهای ورزشی', icon: Activity, color: '#ec4899', route: 'GenericCategoryScreen',
        children: [
          { id: 'c33', title: 'BMI (توده بدنی)', icon: Activity, route: 'DynamicCalculatorScreen', params: { formulaId: 's1-bmi' } },
          { id: 'c34', title: 'BMR (کالری پایه)', route: 'PlaceholderScreen', params: { title: 'BMR (کالری پایه)' } },
          { id: 's3', title: 'سرعت', route: 'DynamicCalculatorScreen', params: { formulaId: 's3-speed-sport' } },
          { id: 's4', title: 'مسافت', route: 'DynamicCalculatorScreen', params: { formulaId: 's4-distance' } },
          { id: 's5', title: 'زمان حرکت', route: 'DynamicCalculatorScreen', params: { formulaId: 's5-time' } },
          { id: 's6', title: 'سرعت متوسط', route: 'DynamicCalculatorScreen', params: { formulaId: 's3-speed-sport' } },
          { id: 's7', title: 'Pace دویدن', route: 'DynamicCalculatorScreen', params: { formulaId: 's7-pace' } },
          { id: 's8', title: 'تبدیل Pace به سرعت', route: 'DynamicCalculatorScreen', params: { formulaId: 's3-speed-sport' } },
          { id: 's9', title: 'ضربان قلب هدف', route: 'DynamicCalculatorScreen', params: { formulaId: 's9-target-hr' } },
          { id: 's10', title: 'حداکثر ضربان قلب', route: 'DynamicCalculatorScreen', params: { formulaId: 's10-max-hr' } },
          { id: 's11', title: 'زمان تمرین', route: 'PlaceholderScreen', params: { title: 'زمان تمرین' } },
          { id: 's12', title: 'تعداد دور و زمان هر دور', route: 'PlaceholderScreen', params: { title: 'تعداد دور و زمان هر دور' } },
        ]
      },
      {
        id: 'calc-finance', title: 'محاسبه‌گرهای مالی', icon: Banknote, color: '#10b981', route: 'GenericCategoryScreen',
        children: [
          { id: 'f1', title: 'سود و زیان', route: 'DynamicCalculatorScreen', params: { formulaId: 'f1-profit-loss' } },
          { id: 'f2', title: 'درصد سود', route: 'DynamicCalculatorScreen', params: { formulaId: 'p7-profit' } },
          { id: 'f3', title: 'درصد افزایش قیمت', route: 'DynamicCalculatorScreen', params: { formulaId: 'p2-percent-diff' } },
          { id: 'f4', title: 'درصد کاهش قیمت', route: 'DynamicCalculatorScreen', params: { formulaId: 'p2-percent-diff' } },
          { id: 'f7', title: 'اقساط', route: 'DynamicCalculatorScreen', params: { formulaId: 'f10-installment' } },
          { id: 'f8', title: 'سود ساده', route: 'DynamicCalculatorScreen', params: { formulaId: 'f8-simple-interest' } },
          { id: 'f9', title: 'سود مرکب', route: 'DynamicCalculatorScreen', params: { formulaId: 'f9-compound-interest' } },
          { id: 'f10', title: 'مبلغ قسط', route: 'DynamicCalculatorScreen', params: { formulaId: 'f10-installment' } },
        ]
      },
      {
        id: 'calc-numeric', title: 'محاسبه‌گرهای عددی', icon: Hash, color: '#64748b', route: 'GenericCategoryScreen',
        children: [
          { id: 'n1', title: 'عدد به حروف', route: 'DynamicCalculatorScreen', params: { formulaId: 'n1-num-to-text' } },
          { id: 'n2', title: 'حروف به عدد', route: 'DynamicCalculatorScreen', params: { formulaId: 'n2-text-to-num' } },
          { id: 'n3', title: 'عدد به اعداد رومی', route: 'DynamicCalculatorScreen', params: { formulaId: 'n3-num-to-roman' } },
          { id: 'n4', title: 'اعداد رومی به عدد', route: 'PlaceholderScreen', params: { title: 'اعداد رومی به عدد' } },
          { id: 'n5', title: 'تبدیل مبنای ۲ به ۱۰', route: 'DynamicCalculatorScreen', params: { formulaId: 'n5-bin-to-dec' } },
          { id: 'n6', title: 'تبدیل مبنای ۱۰ به ۲', route: 'DynamicCalculatorScreen', params: { formulaId: 'n6-dec-to-bin' } },
          { id: 'n7', title: 'تبدیل مبنای ۸', route: 'DynamicCalculatorScreen', params: { formulaId: 'n7-dec-to-oct' } },
          { id: 'n8', title: 'تبدیل مبنای ۱۶', route: 'DynamicCalculatorScreen', params: { formulaId: 'n8-dec-to-hex' } },
        ]
      },
    ]
  },

  // 📅 تاریخ و زمان
  {
    id: 'datetime',
    title: 'تاریخ و زمان',
    route: 'GenericCategoryScreen',
    icon: Calendar,
    color: '#a855f7',
    children: [
      { id: 'd1', title: 'محاسبه سن', route: 'AgeCalculatorScreen', icon: Calendar },
      { id: 'd2', title: 'فاصله بین دو تاریخ', route: 'DateDifferenceScreen', icon: Calendar },
      { id: 'd3', title: 'تبدیل تاریخ', route: 'DateConverterScreen', icon: Calendar },
      { id: 'd4', title: 'فاصله روز بین دو تاریخ', route: 'DaysBetweenScreen', icon: Calendar },
    ]
  },

  // 🔄 تبدیل واحد
  {
    id: 'units',
    title: 'تبدیل واحد',
    route: 'GenericCategoryScreen',
    icon: Scaling,
    color: '#f97316',
    children: [
      { id: 'u1', title: 'طول', icon: Ruler, route: 'UnitConverterScreen', params: { category: 'length' } },
      { id: 'u2', title: 'وزن', icon: Weight, route: 'UnitConverterScreen', params: { category: 'weight' } },
      { id: 'u3', title: 'حجم', icon: Box, route: 'UnitConverterScreen', params: { category: 'volume' } },
      { id: 'u4', title: 'مساحت', icon: Shapes, route: 'UnitConverterScreen', params: { category: 'area' } },
      { id: 'u5', title: 'دما', icon: Thermometer, route: 'UnitConverterScreen', params: { category: 'temperature' } },
      { id: 'u6', title: 'زمان', icon: Clock, route: 'UnitConverterScreen', params: { category: 'time' } },
      { id: 'u7', title: 'سرعت', icon: Zap, route: 'UnitConverterScreen', params: { category: 'speed' } },
      { id: 'u8', title: 'فشار', route: 'UnitConverterScreen', params: { category: 'pressure' } },
      { id: 'u9', title: 'انرژی', route: 'UnitConverterScreen', params: { category: 'energy' } },
      { id: 'u10', title: 'توان', route: 'UnitConverterScreen', params: { category: 'power' } },
      { id: 'u11', title: 'فرکانس', route: 'UnitConverterScreen', params: { category: 'frequency' } },
      { id: 'u12', title: 'زاویه', route: 'UnitConverterScreen', params: { category: 'angle' } },
    ]
  },

  // 🔬 ابزار دروس تخصصی
  {
    id: 'specialized',
    title: 'ابزار دروس تخصصی',
    route: 'GenericCategoryScreen',
    icon: Microscope,
    color: '#059669',
    children: [
      {
        id: 'sp-physics', title: 'فیزیک', icon: Zap, color: '#f59e0b', route: 'GenericCategoryScreen',
        children: [
          { id: 'ph1', title: 'سرعت', route: 'DynamicCalculatorScreen', params: { formulaId: 'ph1-speed' } },
          { id: 'ph2', title: 'شتاب', route: 'DynamicCalculatorScreen', params: { formulaId: 'ph2-acceleration' } },
          { id: 'ph3', title: 'نیرو', route: 'DynamicCalculatorScreen', params: { formulaId: 'ph3-force' } },
          { id: 'ph4', title: 'وزن', route: 'DynamicCalculatorScreen', params: { formulaId: 'ph4-weight' } },
          { id: 'ph5', title: 'چگالی', route: 'DynamicCalculatorScreen', params: { formulaId: 'ph5-density' } },
          { id: 'ph6', title: 'فشار', route: 'DynamicCalculatorScreen', params: { formulaId: 'ph6-pressure' } },
          { id: 'ph7', title: 'کار', route: 'DynamicCalculatorScreen', params: { formulaId: 'ph7-work' } },
          { id: 'ph8', title: 'توان', route: 'DynamicCalculatorScreen', params: { formulaId: 'ph8-power' } },
          { id: 'ph9', title: 'انرژی', route: 'DynamicCalculatorScreen', params: { formulaId: 'ph9-energy' } },
          { id: 'ph10', title: 'ولتاژ', route: 'DynamicCalculatorScreen', params: { formulaId: 'ph10-voltage' } },
          { id: 'ph11', title: 'جریان', route: 'DynamicCalculatorScreen', params: { formulaId: 'ph11-current' } },
          { id: 'ph12', title: 'مقاومت', route: 'DynamicCalculatorScreen', params: { formulaId: 'ph12-resistance' } },
          { id: 'ph13', title: 'قانون اهم', route: 'DynamicCalculatorScreen', params: { formulaId: 'ph11-current' } },
          { id: 'ph14', title: 'توان الکتریکی', route: 'DynamicCalculatorScreen', params: { formulaId: 'ph14-electric-power' } },
        ]
      },
      {
        id: 'sp-chemistry', title: 'شیمی', icon: FlaskConical, color: '#14b8a6', route: 'GenericCategoryScreen',
        children: [
          { id: 'ch1', title: 'مول', route: 'DynamicCalculatorScreen', params: { formulaId: 'ch1-mole' } },
          { id: 'ch2', title: 'جرم مولی', route: 'DynamicCalculatorScreen', params: { formulaId: 'ch2-molar-mass' } },
          { id: 'ch3', title: 'گرم به مول', route: 'DynamicCalculatorScreen', params: { formulaId: 'ch3-g-to-mol' } },
          { id: 'ch4', title: 'مول به گرم', route: 'DynamicCalculatorScreen', params: { formulaId: 'ch4-mol-to-g' } },
          { id: 'ch5', title: 'مولاریته', route: 'DynamicCalculatorScreen', params: { formulaId: 'ch5-molarity' } },
          { id: 'ch6', title: 'غلظت', route: 'DynamicCalculatorScreen', params: { formulaId: 'ch5-molarity' } },
          { id: 'ch7', title: 'درصد جرمی', route: 'DynamicCalculatorScreen', params: { formulaId: 'ch7-mass-percent' } },
          { id: 'ch8', title: 'pH', route: 'DynamicCalculatorScreen', params: { formulaId: 'ch8-ph' } },
        ]
      },
      {
        id: 'sp-math', title: 'ریاضی', icon: Sigma, color: '#3b82f6', route: 'GenericCategoryScreen',
        children: [
          { id: 'm2', title: 'لگاریتم', route: 'DynamicCalculatorScreen', params: { formulaId: 'm2-logarithm' } },
          { id: 'm3', title: 'فاکتوریل', route: 'DynamicCalculatorScreen', params: { formulaId: 'm3-factorial' } },
        ]
      },
      {
        id: 'sp-biology', title: 'زیست‌شناسی', icon: HeartPulse, color: '#ef4444', route: 'GenericCategoryScreen',
        children: [
          { id: 'b1', title: 'برون‌ده قلبی', route: 'DynamicCalculatorScreen', params: { formulaId: 'b1-cardiac-output' } },
        ]
      },
    ]
  },
];
