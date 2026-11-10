import {
  FileText,
  Printer,
  ClipboardList,
  Minimize2,
  Repeat,
  ScanLine,
  FileCheck,
  Camera,
  Layers,
  Palette,
  Clock,
  Sun,
  BookOpen,
  Music,
  Phone,
  QrCode,
  Tv,
  Compass,
  Navigation,
  Mic,
  Triangle,
  Activity,
  Calculator,
  Percent,
  Award,
  Shapes,
  Box,
  HeartPulse,
  Banknote,
  Hash,
  Calendar,
  Ruler,
  Weight,
  Thermometer,
  Zap,
  Microscope,
  FlaskConical,
  Sigma,
  Crop,
  Maximize,
  Grid,
  Scissors,
  Droplet,
  Lock,
  ArrowUpDown,
  RotateCw,
  Dices,
  Users,
  Bell,
  Gauge,
  CircleDot,
  Radio,
  FileSpreadsheet,
  Presentation,
  FileArchive,
  FileOutput,
  FileMinus,
  Sparkles,
  Volume2,
} from 'lucide-react-native';

export interface ToolIconConfig {
  /** Optional custom PNG icon asset path (will be populated when PNGs are provided) */
  image?: any;
  /** Background color for Samsung-style rounded square */
  backgroundColor: string;
  /** Foreground fallback vector icon from lucide-react-native */
  fallbackIcon: any;
  /** Optional icon label or badge */
  label?: string;
}

/**
 * Unified Central Icon Registry inspired by Samsung App Icons.
 * Every tool, subtool, and category has a dedicated colorful rounded square config.
 */
export const toolIcons: Record<string, ToolIconConfig> = {
  // ==================== 1. POPULAR TOOLS (EXACTLY 6) ====================
  onlineExam: {
    backgroundColor: '#F45B78', // Coral / Rose
    fallbackIcon: FileCheck,
    label: 'آزمون آنلاین',
  },
  examPrint: {
    backgroundColor: '#A855E8', // Purple / Violet
    fallbackIcon: Printer,
    label: 'چاپ برگه امتحانی',
  },
  formBuilder: {
    backgroundColor: '#F59E0B', // Amber / Orange
    fallbackIcon: ClipboardList,
    label: 'فرم‌ساز',
  },
  fileCompression: {
    backgroundColor: '#19C995', // Mint / Emerald
    fallbackIcon: Minimize2,
    label: 'کاهش حجم',
  },
  formatConversion: {
    backgroundColor: '#38BDF8', // Cyan / Sky Blue
    fallbackIcon: Repeat,
    label: 'تبدیل فرمت',
  },
  scanner: {
    backgroundColor: '#438FF5', // Blue
    fallbackIcon: ScanLine,
    label: 'اسکنر',
  },

  // ==================== 2. RELIGIOUS & CULTURAL (فرهنگی و مذهبی) ====================
  prayerTimes: {
    backgroundColor: '#F43F5E',
    fallbackIcon: Sun,
    label: 'اوقات شرعی',
  },
  quran: {
    backgroundColor: '#059669',
    fallbackIcon: BookOpen,
    label: 'قرآن و تفسیر',
  },
  dhikr: {
    backgroundColor: '#A855E8',
    fallbackIcon: CircleDot,
    label: 'شمارش ذکر',
  },
  namaz: {
    backgroundColor: '#F59E0B',
    fallbackIcon: BookOpen,
    label: 'نماز و عبادات',
  },
  calendarEvents: {
    backgroundColor: '#3B82F6',
    fallbackIcon: Calendar,
    label: 'تقویم و مناسبت‌ها',
  },
  music: {
    backgroundColor: '#EC4899',
    fallbackIcon: Music,
    label: 'موزیک و نواها',
  },
  morning: {
    backgroundColor: '#F97316',
    fallbackIcon: Sun,
    label: 'مراسم صبحگاه',
  },

  // ==================== 3. DATE & TIME (تاریخ و زمان) ====================
  calendarAge: {
    backgroundColor: '#3B82F6',
    fallbackIcon: Calendar,
    label: 'تقویم و سن',
  },
  stopwatch: {
    backgroundColor: '#A855E8',
    fallbackIcon: Clock,
    label: 'کرونومتر و تایمر',
  },
  dailyNotes: {
    backgroundColor: '#0EA5E9',
    fallbackIcon: FileText,
    label: 'یادداشت و استاتوس',
  },
  reminder: {
    backgroundColor: '#EAB308',
    fallbackIcon: Bell,
    label: 'یادآور',
  },
  dateDiff: {
    backgroundColor: '#6366F1',
    fallbackIcon: Calendar,
    label: 'فاصله تاریخ‌ها',
  },
  dateConverter: {
    backgroundColor: '#14B8A6',
    fallbackIcon: Repeat,
    label: 'تبدیل تاریخ',
  },
  daysBetween: {
    backgroundColor: '#8B5CF6',
    fallbackIcon: Clock,
    label: 'محاسبه روزها',
  },

  // ==================== 4. FILES & DOCUMENTS (فایل و اسناد) ====================
  pdfMaker: {
    backgroundColor: '#EF4444',
    fallbackIcon: FileText,
    label: 'ساخت PDF',
  },
  imageResize: {
    backgroundColor: '#38BDF8',
    fallbackIcon: Maximize,
    label: 'تغییر ابعاد عکس',
  },
  imageCompress: {
    backgroundColor: '#19C995',
    fallbackIcon: Minimize2,
    label: 'کاهش حجم تصویر',
  },
  imageCrop: {
    backgroundColor: '#F59E0B',
    fallbackIcon: Crop,
    label: 'برش تصویر',
  },
  collage: {
    backgroundColor: '#6366F1',
    fallbackIcon: Grid,
    label: 'ترکیب عکس‌ها',
  },
  imageConverter: {
    backgroundColor: '#38BDF8',
    fallbackIcon: Repeat,
    label: 'تبدیل فرمت عکس',
  },
  imgToPdf: {
    backgroundColor: '#10B981',
    fallbackIcon: FileText,
    label: 'عکس به PDF',
  },
  pdfToImg: {
    backgroundColor: '#F97316',
    fallbackIcon: FileOutput,
    label: 'PDF به عکس',
  },
  wordToPdf: {
    backgroundColor: '#2563EB',
    fallbackIcon: FileArchive,
    label: 'Word به PDF',
  },
  excelToPdf: {
    backgroundColor: '#059669',
    fallbackIcon: FileSpreadsheet,
    label: 'Excel به PDF',
  },
  pptToPdf: {
    backgroundColor: '#EA580C',
    fallbackIcon: Presentation,
    label: 'PowerPoint به PDF',
  },
  textToPdf: {
    backgroundColor: '#475569',
    fallbackIcon: FileText,
    label: 'متن به PDF',
  },
  pdfMerge: {
    backgroundColor: '#3B82F6',
    fallbackIcon: Layers,
    label: 'ترکیب PDF',
  },
  pdfCompress: {
    backgroundColor: '#10B981',
    fallbackIcon: Minimize2,
    label: 'فشرده‌سازی PDF',
  },
  pdfSplit: {
    backgroundColor: '#EF4444',
    fallbackIcon: Scissors,
    label: 'تقسیم PDF',
  },
  pdfExtract: {
    backgroundColor: '#A855E8',
    fallbackIcon: FileOutput,
    label: 'جداسازی صفحات',
  },
  pdfDelete: {
    backgroundColor: '#F97316',
    fallbackIcon: FileMinus,
    label: 'حذف صفحات',
  },
  pdfReorder: {
    backgroundColor: '#14B8A6',
    fallbackIcon: ArrowUpDown,
    label: 'جابه‌جایی صفحات',
  },
  pdfRotate: {
    backgroundColor: '#EAB308',
    fallbackIcon: RotateCw,
    label: 'چرخش صفحات',
  },
  pdfWatermark: {
    backgroundColor: '#64748B',
    fallbackIcon: Droplet,
    label: 'واترمارک PDF',
  },
  pdfEncrypt: {
    backgroundColor: '#DC2626',
    fallbackIcon: Lock,
    label: 'رمزگذاری PDF',
  },
  videoTrim: {
    backgroundColor: '#EC4899',
    fallbackIcon: Scissors,
    label: 'برش ویدیو',
  },
  videoToAudio: {
    backgroundColor: '#9333EA',
    fallbackIcon: Music,
    label: 'ویدیو به صوت',
  },
  audioToText: {
    backgroundColor: '#F59E0B',
    fallbackIcon: Mic,
    label: 'صوت به متن',
  },
  advancedPdf: {
    backgroundColor: '#8B5CF6',
    fallbackIcon: Layers,
    label: 'ویرایشگر PDF',
  },

  // ==================== 5. EXAM & ASSESSMENT (آزمون و سنجش) ====================
  smartSheets: {
    backgroundColor: '#4F46E5',
    fallbackIcon: ScanLine,
    label: 'پاسخ‌برگ هوشمند OMR',
  },
  questionBank: {
    backgroundColor: '#0EA5E9',
    fallbackIcon: BookOpen,
    label: 'بانک سوالات',
  },
  examDashboard: {
    backgroundColor: '#3B82F6',
    fallbackIcon: FileText,
    label: 'داشبورد آزمون‌ها',
  },

  // ==================== 6. WHITEBOARD & CLASSROOM (وایت‌برد و تدریس) ====================
  whiteboard: {
    backgroundColor: '#6366F1',
    fallbackIcon: Palette,
    label: 'تخته وایت‌برد بی‌نهایت',
  },
  classroomNoiseMeter: {
    backgroundColor: '#10B981', // Emerald / Mint
    fallbackIcon: Volume2,
    label: 'صداسنج کلاس',
  },
  randomStudent: {
    backgroundColor: '#F97316',
    fallbackIcon: Dices,
    label: 'انتخاب تصادفی',
  },
  groupDivider: {
    backgroundColor: '#2563EB',
    fallbackIcon: Users,
    label: 'تقسیم گروه‌ها',
  },
  repCounter: {
    backgroundColor: '#EC4899',
    fallbackIcon: Activity,
    label: 'شمارش ست و تکرار',
  },
  intervalTimer: {
    backgroundColor: '#F43F5E',
    fallbackIcon: Clock,
    label: 'تایمر تمرین و اینتروال',
  },
  teachingTools: {
    backgroundColor: '#14B8A6',
    fallbackIcon: Sparkles,
    label: 'ابزار تدریس',
  },

  // ==================== 7. SENSORS & LAB (سنسورها و آزمایشگاه) ====================
  sensorLab: {
    backgroundColor: '#06B6D4',
    fallbackIcon: Gauge,
    label: 'سنسورهای آزمایشگاه',
  },
  qibla: {
    backgroundColor: '#059669',
    fallbackIcon: Compass,
    label: 'قبله‌نما',
  },
  compass: {
    backgroundColor: '#0284C7',
    fallbackIcon: Navigation,
    label: 'قطب‌نما و تراز',
  },
  soundMeter: {
    backgroundColor: '#EC4899',
    fallbackIcon: Mic,
    label: 'صداسنج',
  },
  lightMeter: {
    backgroundColor: '#EAB308',
    fallbackIcon: Sun,
    label: 'نورسنج',
  },
  protractor: {
    backgroundColor: '#8B5CF6',
    fallbackIcon: Triangle,
    label: 'نقاله و زاویه‌سنج',
  },
  seismograph: {
    backgroundColor: '#EF4444',
    fallbackIcon: Activity,
    label: 'لرزه‌نگار و زلزله‌سنج',
  },

  // ==================== 8. CALCULATORS (محاسبه‌گرها) ====================
  calculators: {
    backgroundColor: '#0EA5E9',
    fallbackIcon: Calculator,
    label: 'محاسبه‌گرها',
  },
  calcPercent: {
    backgroundColor: '#F43F5E',
    fallbackIcon: Percent,
    label: 'محاسبه‌گر درصد',
  },
  calcGrades: {
    backgroundColor: '#3B82F6',
    fallbackIcon: Award,
    label: 'محاسبه‌گر نمرات',
  },
  calcArea: {
    backgroundColor: '#8B5CF6',
    fallbackIcon: Shapes,
    label: 'محاسبه‌گر مساحت',
  },
  calcVolume: {
    backgroundColor: '#F59E0B',
    fallbackIcon: Box,
    label: 'محاسبه‌گر حجم',
  },
  calcSport: {
    backgroundColor: '#EC4899',
    fallbackIcon: HeartPulse,
    label: 'محاسبه‌گرهای ورزشی',
  },
  calcFinance: {
    backgroundColor: '#10B981',
    fallbackIcon: Banknote,
    label: 'محاسبه‌گرهای مالی',
  },
  calcNumeric: {
    backgroundColor: '#64748B',
    fallbackIcon: Hash,
    label: 'محاسبه‌گرهای عددی',
  },

  // ==================== 9. UNIT CONVERTERS (تبدیل واحد) ====================
  unitConverter: {
    backgroundColor: '#F97316',
    fallbackIcon: Ruler,
    label: 'تبدیل واحد',
  },
  unitLength: {
    backgroundColor: '#3B82F6',
    fallbackIcon: Ruler,
    label: 'طول',
  },
  unitWeight: {
    backgroundColor: '#10B981',
    fallbackIcon: Weight,
    label: 'وزن',
  },
  unitVolume: {
    backgroundColor: '#F59E0B',
    fallbackIcon: Box,
    label: 'حجم',
  },
  unitArea: {
    backgroundColor: '#8B5CF6',
    fallbackIcon: Shapes,
    label: 'مساحت',
  },
  unitTemp: {
    backgroundColor: '#EF4444',
    fallbackIcon: Thermometer,
    label: 'دما',
  },
  unitTime: {
    backgroundColor: '#6366F1',
    fallbackIcon: Clock,
    label: 'زمان',
  },
  unitSpeed: {
    backgroundColor: '#EC4899',
    fallbackIcon: Zap,
    label: 'سرعت',
  },
  unitPressure: {
    backgroundColor: '#14B8A6',
    fallbackIcon: Gauge,
    label: 'فشار',
  },
  unitEnergy: {
    backgroundColor: '#F97316',
    fallbackIcon: Zap,
    label: 'انرژی',
  },
  unitPower: {
    backgroundColor: '#0EA5E9',
    fallbackIcon: Activity,
    label: 'توان',
  },
  unitFrequency: {
    backgroundColor: '#8B5CF6',
    fallbackIcon: Radio,
    label: 'فرکانس',
  },
  unitAngle: {
    backgroundColor: '#EAB308',
    fallbackIcon: Triangle,
    label: 'زاویه',
  },

  // ==================== 10. SPECIALIZED SUBJECTS (دروس تخصصی) ====================
  specializedSubjects: {
    backgroundColor: '#059669',
    fallbackIcon: Microscope,
    label: 'ابزار دروس تخصصی',
  },
  physics: {
    backgroundColor: '#F59E0B',
    fallbackIcon: Zap,
    label: 'فیزیک',
  },
  chemistry: {
    backgroundColor: '#14B8A6',
    fallbackIcon: FlaskConical,
    label: 'شیمی',
  },
  math: {
    backgroundColor: '#3B82F6',
    fallbackIcon: Sigma,
    label: 'ریاضی',
  },
  biology: {
    backgroundColor: '#EF4444',
    fallbackIcon: HeartPulse,
    label: 'زیست‌شناسی',
  },

  // ==================== 11. HARDWARE, BARCODE & CONTACTS (سخت‌افزار، بارکد، ارتباطات) ====================
  irRemote: {
    backgroundColor: '#6366F1',
    fallbackIcon: Tv,
    label: 'ریموت کنترل کلاسی',
  },
  barcodeHub: {
    backgroundColor: '#0284C7',
    fallbackIcon: QrCode,
    label: 'بارکدساز و بارکدخوان',
  },
  phonebook: {
    backgroundColor: '#2563EB',
    fallbackIcon: Phone,
    label: 'دفترچه تلفن و مخاطبین',
  },

  // Default fallback entry
  defaultTool: {
    backgroundColor: '#3B82F6',
    fallbackIcon: Sparkles,
    label: 'ابزار',
  },
};

/**
 * Resolves tool icon configuration safely by tool key/id.
 */
export const getToolIconConfig = (toolKey: string): ToolIconConfig => {
  return toolIcons[toolKey] || toolIcons.defaultTool;
};
