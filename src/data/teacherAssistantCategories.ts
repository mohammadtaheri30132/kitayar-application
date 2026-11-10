import { teacherToolsHierarchy } from './teacherTools';

export interface ToolItemDef {
  id: string;
  title: string;
  subtitle?: string;
  toolId: string; // Key in toolIcons registry
  route: string;
  params?: any;
  children?: any[];
  isPopular?: boolean;
}

export interface ToolCategoryDef {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  tools: ToolItemDef[];
}

/**
 * Audit and reorganization of all Kitayar tools into structured categories,
 * preserving 100% of existing tool routes and params.
 */
export const teacherAssistantCategories: ToolCategoryDef[] = [
  // 1. فرهنگی و مذهبی
  {
    id: 'cultural-religious',
    title: 'فرهنگی و مذهبی',
    subtitle: 'ابزارهای مذهبی و فرهنگی',
    iconName: '🕌',
    tools: [
      {
        id: 'cr-namaz',
        toolId: 'namaz',
        title: 'نماز و عبادات',
        subtitle: 'احکام و اوقات نماز',
        route: 'PlaceholderScreen',
        params: { title: 'نماز و عبادات' },
      },
      {
        id: 'cr-quran',
        toolId: 'quran',
        title: 'قرآن و تفسیر',
        subtitle: 'متن و صوت ۱۱۴ سوره قرآن کریم',
        route: 'QuranSurahListScreen',
      },
      {
        id: 'cr-dhikr',
        toolId: 'dhikr',
        title: 'شمارش ذکر',
        subtitle: 'ذکرشمار و تسبیح هوشمند',
        route: 'RepCounterScreen',
        params: { mode: 'dhikr', title: 'شمارش ذکر و صلوات' },
      },
      {
        id: 'cr-calendar',
        toolId: 'calendarEvents',
        title: 'تقویم و مناسبت‌ها',
        subtitle: 'رویدادهای ملی و مذهبی تقویم رسمی',
        route: 'CalendarScreen',
      },
      {
        id: 'cr-prayer',
        toolId: 'prayerTimes',
        title: 'اوقات شرعی',
        subtitle: 'اذان و اوقات شرعی شهرهای ایران',
        route: 'PrayerTimesScreen',
      },
      {
        id: 'cr-music',
        toolId: 'music',
        title: 'موزیک و سرود',
        subtitle: 'سرود صبحگاه، ملی و زنگ مدرسه',
        route: 'MusicMainScreen',
      },
      {
        id: 'cr-morning',
        toolId: 'morning',
        title: 'مراسم صبحگاه',
        subtitle: 'برنامه‌ها و نیایش‌های صبحگاهی',
        route: 'PlaceholderScreen',
        params: { title: 'مراسم صبحگاه' },
      },
    ],
  },

  // 2. تاریخ و زمان
  {
    id: 'datetime-category',
    title: 'تاریخ و زمان',
    subtitle: 'ابزارهای مدیریت زمان',
    iconName: '⏱️',
    tools: [
      {
        id: 'dt-age',
        toolId: 'calendarAge',
        title: 'تقویم و سن',
        subtitle: 'محاسبه سن دقیق و مشخصات تولد',
        route: 'AgeCalculatorScreen',
      },
      {
        id: 'dt-stopwatch',
        toolId: 'stopwatch',
        title: 'کرنومتر و تایمر',
        subtitle: 'ثبت دورها و رکوردهای کلاسی',
        route: 'StopwatchScreen',
      },
      {
        id: 'dt-notes',
        toolId: 'dailyNotes',
        title: 'یادداشت و استاتوس',
        subtitle: 'یادداشت‌های روزانه و برنامه‌ها',
        route: 'DailyNotesScreen',
      },
      {
        id: 'dt-reminder',
        toolId: 'reminder',
        title: 'یادآور و وظایف',
        subtitle: 'تنظیم کارها و وظایف تدریس',
        route: 'TasksScreen',
      },
      {
        id: 'dt-diff',
        toolId: 'dateDiff',
        title: 'اختلاف تاریخ‌ها',
        subtitle: 'محاسبه فاصله بین دو تاریخ شمسی',
        route: 'DateDifferenceScreen',
      },
      {
        id: 'dt-convert',
        toolId: 'dateConverter',
        title: 'تبدیل تاریخ',
        subtitle: 'تبدیل تاریخ شمسی، میلادی و قمری',
        route: 'DateConverterScreen',
      },
      {
        id: 'dt-days',
        toolId: 'daysBetween',
        title: 'محاسبه روزها',
        subtitle: 'شمارش روزهای کاری و کل',
        route: 'DaysBetweenScreen',
      },
    ],
  },

  // 3. فایل و اسناد
  {
    id: 'files-documents',
    title: 'فایل و اسناد',
    subtitle: 'مدیریت و تبدیل فایل‌ها',
    iconName: '📄',
    tools: [
      {
        id: 'fd-convert',
        toolId: 'formatConversion',
        title: 'تبدیل فرمت',
        subtitle: 'تبدیل انواع فایل‌ها و اسناد',
        route: 'OPEN_CONVERSION_HUB',
      },
      {
        id: 'fd-compress',
        toolId: 'fileCompression',
        title: 'کاهش حجم',
        subtitle: 'فشرده‌سازی فایل و تصاویر',
        route: 'OPEN_COMPRESSION_HUB',
      },
      {
        id: 'fd-scanner',
        toolId: 'scanner',
        title: 'اسکنر اوراق',
        subtitle: 'اسکن سریع اسناد با دوربین',
        route: 'DocumentScannerScreen',
      },
      {
        id: 'fd-pdfmaker',
        toolId: 'pdfMaker',
        title: 'ساخت PDF',
        subtitle: 'تبدیل عکس‌ها به فایل PDF',
        route: 'ConverterScreen',
        params: { toolType: 'IMAGE_TO_PDF', title: 'تبدیل عکس به PDF' },
      },
      {
        id: 'fd-resize',
        toolId: 'imageResize',
        title: 'تغییر ابعاد عکس',
        subtitle: 'تغییر اندازه و رزولوشن عکس‌ها',
        route: 'ImageResizeScreen',
      },
      {
        id: 'fd-crop',
        toolId: 'imageCrop',
        title: 'برش تصویر',
        subtitle: 'برش دقیق کادر تصاویر',
        route: 'ImageCropScreen',
      },
      {
        id: 'fd-collage',
        toolId: 'collage',
        title: 'ترکیب عکس‌ها',
        subtitle: 'ساخت کلاژ و ترکیب عکس‌ها',
        route: 'CollageScreen',
      },
      {
        id: 'fd-advanced-pdf',
        toolId: 'advancedPdf',
        title: 'ویرایشگر PDF',
        subtitle: 'ادغام، تقسیم و واترمارک PDF',
        route: 'AdvancedPdfScreen',
        params: { toolId: 'MERGE_PDF' },
      },
      {
        id: 'fd-video-trim',
        toolId: 'videoTrim',
        title: 'برش ویدیو',
        subtitle: 'کات کردن فیلم‌های تدریس',
        route: 'VideoTrimScreen',
      },
      {
        id: 'fd-video-audio',
        toolId: 'videoToAudio',
        title: 'ویدیو به صوت',
        subtitle: 'استخراج صدا از فایل ویدیو',
        route: 'VideoToAudioScreen',
      },
      {
        id: 'fd-audio-text',
        toolId: 'audioToText',
        title: 'صوت به متن',
        subtitle: 'تایپ صوتی گفتار به متن',
        route: 'AudioToTextScreen',
      },
      {
        id: 'fd-all-tools',
        toolId: 'toolsList',
        title: 'همه ابزارهای فایل',
        subtitle: 'آرشیو جامع ابزارهای فایل و اسناد',
        route: 'ToolsListScreen',
      },
    ],
  },

  // 4. آزمون و سنجش هوشمند
  {
    id: 'exam-assessment',
    title: 'آزمون و ارزشیابی',
    subtitle: 'طراحی، برگزاری و تصحیح هوشمند',
    iconName: '📝',
    tools: [
      {
        id: 'ea-online',
        toolId: 'onlineExam',
        title: 'آزمون آنلاین',
        subtitle: 'برگزاری آزمون و ارزیابی دانش‌آموزان',
        route: 'ExamListScreen',
      },
      {
        id: 'ea-print',
        toolId: 'examPrint',
        title: 'چاپ برگه آزمون',
        subtitle: 'طراحی و آماده‌سازی برگه‌های امتحانی',
        route: 'MobileQuestionBuilder',
      },
      {
        id: 'ea-smart-sheet',
        toolId: 'smartSheets',
        title: 'پاسخ‌برگ OMR',
        subtitle: 'تصحیح خودکار با دوربین گوشی',
        route: 'SmartSheetHubScreen',
      },
      {
        id: 'ea-form',
        toolId: 'formBuilder',
        title: 'فرم‌ساز و نظرسنجی',
        subtitle: 'ساخت فرم‌های دلخواه و پرسش‌نامه',
        route: 'FormDashboardScreen',
      },
      {
        id: 'ea-bank',
        toolId: 'questionBank',
        title: 'بانک سوالات',
        subtitle: 'مدیریت و آرشیو سوالات درسی',
        route: 'ManageQuestionsScreen',
      },
      {
        id: 'ea-create-q',
        toolId: 'examPrint',
        title: 'طراحی سوال جدید',
        subtitle: 'ثبت سوال تستی و تشریحی جدید',
        route: 'CreateTeacherQuestionScreen',
      },
    ],
  },

  // 5. کلاس درس و وایت‌برد
  {
    id: 'whiteboard-classroom',
    title: 'کلاس درس و وایت‌برد',
    subtitle: 'ابزارهای تدریس تعاملی و پویایی کلاسی',
    iconName: '🎨',
    tools: [
      {
        id: 'wc-whiteboard',
        toolId: 'whiteboard',
        title: 'تخته وایت‌برد',
        subtitle: 'بوم بی‌نهایت با قلم‌ها و اشکال هندسی',
        route: 'InfiniteCanvasScreen',
      },
      {
        id: 'wc-noise-meter',
        toolId: 'classroomNoiseMeter',
        title: 'صداسنج کلاس',
        subtitle: 'نمایش زنده سروصدای کلاس با ایموجیهای متحرک و هشدار صوتی',
        route: 'ClassroomNoiseMeterScreen',
      },
      {
        id: 'wc-random',
        toolId: 'randomStudent',
        title: 'انتخاب تصادفی',
        subtitle: 'گردونه شانس پرسش کلاسی',
        route: 'RandomStudentScreen',
      },
      {
        id: 'wc-groups',
        toolId: 'groupDivider',
        title: 'تقسیم گروه‌ها',
        subtitle: 'تیم‌بندی و گروه‌بندی دانش‌آموزان',
        route: 'GroupDividerScreen',
      },
      {
        id: 'wc-rep',
        toolId: 'repCounter',
        title: 'شمارش ست و تکرار',
        subtitle: 'شمارش حرکات و تمرینات ورزشی',
        route: 'RepCounterScreen',
      },
      {
        id: 'wc-interval',
        toolId: 'intervalTimer',
        title: 'تایمر اینتروال',
        subtitle: 'تایمر چندمرحله‌ای تمرین کلاس',
        route: 'IntervalTimerScreen',
      },
      {
        id: 'wc-schedule',
        toolId: 'calendarEvents',
        title: 'برنامه هفتگی',
        subtitle: 'طراحی و ساخت جدول برنامه هفتگی',
        route: 'WeeklyScheduleBuilderScreen',
      },
    ],
  },

  // 6. سنسورها و آزمایشگاه
  {
    id: 'sensors-lab',
    title: 'سنسورها و آزمایشگاه',
    subtitle: 'حسگرهای اندازه‌گیری فیزیکی و آزمایشگاهی',
    iconName: '🧪',
    tools: [
      {
        id: 'sl-qibla',
        toolId: 'qibla',
        title: 'قبله‌نما',
        subtitle: 'جهت‌یاب دقیق ماهواره‌ای قبله',
        route: 'QiblaCompassScreen',
      },
      {
        id: 'sl-compass',
        toolId: 'compass',
        title: 'قطب‌نما و تراز',
        subtitle: 'قطب‌نمای مغناطیسی و تراز دیجیتال',
        route: 'CompassScreen',
      },
      {
        id: 'sl-sound',
        toolId: 'soundMeter',
        title: 'صداسنج (دسی‌بل)',
        subtitle: 'سنجش بلندی صدای محیط کلاس',
        route: 'SoundMeterScreen',
      },
      {
        id: 'sl-light',
        toolId: 'lightMeter',
        title: 'نورسنج (لوکس)',
        subtitle: 'سنجش روشنایی استاندارد محیط',
        route: 'LightMeterScreen',
      },
      {
        id: 'sl-protractor',
        toolId: 'protractor',
        title: 'نقاله و زاویه‌سنج',
        subtitle: 'اندازه‌گیری زاویه روی تصویر دوربین',
        route: 'ProtractorScreen',
      },
      {
        id: 'sl-seismo',
        toolId: 'seismograph',
        title: 'لرزه‌نگار',
        subtitle: 'زلزله‌سنج با سنسور شتاب‌سنج',
        route: 'SeismographScreen',
      },
      {
        id: 'sl-all',
        toolId: 'sensorLab',
        title: 'همه سنسورها',
        subtitle: 'آزمایشگاه کامل سنسورهای گوشی',
        route: 'GenericCategoryScreen',
        params: {
          title: 'سنسورها و ابزار آزمایشگاه',
          children: teacherToolsHierarchy.find(t => t.id === 'sensor-lab')?.children || [],
        },
      },
    ],
  },

  // 7. محاسبه‌گرها
  {
    id: 'calculators-category',
    title: 'محاسبه‌گرها',
    subtitle: 'بیش از ۵۰ فرمول محاسباتی آموزشی و عمومی',
    iconName: '🧮',
    tools: [
      {
        id: 'calc-percent',
        toolId: 'calcPercent',
        title: 'محاسبه‌گر درصد',
        subtitle: 'تخفیف، سود، درصد تغییر و افزایش',
        route: 'GenericCategoryScreen',
        params: {
          title: 'محاسبه‌گر درصد',
          children: (teacherToolsHierarchy.find(t => t.id === 'calcs')?.children || [])
            .find(c => c.id === 'calc-percent')?.children || [],
        },
      },
      {
        id: 'calc-grades',
        toolId: 'calcGrades',
        title: 'نمرات و معدل',
        subtitle: 'معدل وزنی، نمره نهایی و نمره منفی',
        route: 'GenericCategoryScreen',
        params: {
          title: 'محاسبه‌گر نمرات',
          children: (teacherToolsHierarchy.find(t => t.id === 'calcs')?.children || [])
            .find(c => c.id === 'calc-grades')?.children || [],
        },
      },
      {
        id: 'calc-area',
        toolId: 'calcArea',
        title: 'مساحت و محیط',
        subtitle: 'اشکال هندسی مربع، مثلث، دایره و...',
        route: 'GenericCategoryScreen',
        params: {
          title: 'محاسبه‌گر مساحت و محیط',
          children: (teacherToolsHierarchy.find(t => t.id === 'calcs')?.children || [])
            .find(c => c.id === 'calc-area')?.children || [],
        },
      },
      {
        id: 'calc-volume',
        toolId: 'calcVolume',
        title: 'محاسبه‌گر حجم',
        subtitle: 'مکعب، استوانه، مخروط و کره',
        route: 'GenericCategoryScreen',
        params: {
          title: 'محاسبه‌گر حجم',
          children: (teacherToolsHierarchy.find(t => t.id === 'calcs')?.children || [])
            .find(c => c.id === 'calc-volume')?.children || [],
        },
      },
      {
        id: 'calc-sport',
        toolId: 'calcSport',
        title: 'محاسبات ورزشی',
        subtitle: 'شاخص BMI، سرعت، مسافت و ضربان قلب',
        route: 'GenericCategoryScreen',
        params: {
          title: 'محاسبه‌گرهای ورزشی',
          children: (teacherToolsHierarchy.find(t => t.id === 'calcs')?.children || [])
            .find(c => c.id === 'calc-sport')?.children || [],
        },
      },
      {
        id: 'calc-finance',
        toolId: 'calcFinance',
        title: 'محاسبات مالی',
        subtitle: 'سود و زیان، اقساط وام و بهره',
        route: 'GenericCategoryScreen',
        params: {
          title: 'محاسبه‌گرهای مالی',
          children: (teacherToolsHierarchy.find(t => t.id === 'calcs')?.children || [])
            .find(c => c.id === 'calc-finance')?.children || [],
        },
      },
      {
        id: 'calc-numeric',
        toolId: 'calcNumeric',
        title: 'محاسبات عددی',
        subtitle: 'عدد به حروف، مبناهای ۲، ۸، ۱۰، ۱۶',
        route: 'GenericCategoryScreen',
        params: {
          title: 'محاسبه‌گرهای عددی',
          children: (teacherToolsHierarchy.find(t => t.id === 'calcs')?.children || [])
            .find(c => c.id === 'calc-numeric')?.children || [],
        },
      },
    ],
  },

  // 8. تبدیل واحد
  {
    id: 'unit-converters',
    title: 'تبدیل واحد',
    subtitle: 'تبدیل مقادیر و کمیت‌های فیزیکی و هندسی',
    iconName: '🔄',
    tools: [
      { id: 'u-len', toolId: 'unitLength', title: 'طول', subtitle: 'متر، اینچ، فوت، مایل', route: 'UnitConverterScreen', params: { category: 'length' } },
      { id: 'u-wgt', toolId: 'unitWeight', title: 'وزن', subtitle: 'کیلوگرم، گرم، پوند، اونس', route: 'UnitConverterScreen', params: { category: 'weight' } },
      { id: 'u-vol', toolId: 'unitVolume', title: 'حجم', subtitle: 'لیتر، میلی‌لیتر، گالن', route: 'UnitConverterScreen', params: { category: 'volume' } },
      { id: 'u-ara', toolId: 'unitArea', title: 'مساحت', subtitle: 'مترمربع، هکتار، جریب', route: 'UnitConverterScreen', params: { category: 'area' } },
      { id: 'u-tmp', toolId: 'unitTemp', title: 'دما', subtitle: 'سلسیوس، فارنهایت، کلوین', route: 'UnitConverterScreen', params: { category: 'temperature' } },
      { id: 'u-tim', toolId: 'unitTime', title: 'زمان', subtitle: 'ثانیه، دقیقه، ساعت، روز', route: 'UnitConverterScreen', params: { category: 'time' } },
      { id: 'u-spd', toolId: 'unitSpeed', title: 'سرعت', subtitle: 'کیلومتر بر ساعت، نات', route: 'UnitConverterScreen', params: { category: 'speed' } },
      { id: 'u-prs', toolId: 'unitPressure', title: 'فشار', subtitle: 'پاسکال، بار، اتمسفر', route: 'UnitConverterScreen', params: { category: 'pressure' } },
      { id: 'u-eng', toolId: 'unitEnergy', title: 'انرژی', subtitle: 'ژول، کالری، کیلووات ساعت', route: 'UnitConverterScreen', params: { category: 'energy' } },
      { id: 'u-pow', toolId: 'unitPower', title: 'توان', subtitle: 'وات، اسب بخار', route: 'UnitConverterScreen', params: { category: 'power' } },
      { id: 'u-frq', toolId: 'unitFrequency', title: 'فرکانس', subtitle: 'هرتز، کیلوهرتز، مگاهرتز', route: 'UnitConverterScreen', params: { category: 'frequency' } },
      { id: 'u-ang', toolId: 'unitAngle', title: 'زاویه', subtitle: 'درجه، رادیان، گراد', route: 'UnitConverterScreen', params: { category: 'angle' } },
    ],
  },

  // 9. دروس تخصصی
  {
    id: 'specialized-subjects',
    title: 'دروس تخصصی',
    subtitle: 'فرمول‌های کاربردی فیزیک، شیمی، ریاضی و زیست',
    iconName: '🔬',
    tools: [
      {
        id: 'sp-phy',
        toolId: 'physics',
        title: 'فیزیک',
        subtitle: 'شتاب، نیرو، توان، چگالی و قانون اهم',
        route: 'GenericCategoryScreen',
        params: {
          title: 'فرمول‌های فیزیک',
          children: (teacherToolsHierarchy.find(t => t.id === 'specialized')?.children || [])
            .find(c => c.id === 'sp-physics')?.children || [],
        },
      },
      {
        id: 'sp-chm',
        toolId: 'chemistry',
        title: 'شیمی',
        subtitle: 'مول، جرم مولی، مولاریته و pH',
        route: 'GenericCategoryScreen',
        params: {
          title: 'فرمول‌های شیمی',
          children: (teacherToolsHierarchy.find(t => t.id === 'specialized')?.children || [])
            .find(c => c.id === 'sp-chemistry')?.children || [],
        },
      },
      {
        id: 'sp-mth',
        toolId: 'math',
        title: 'ریاضیات',
        subtitle: 'لگاریتم، فاکتوریل و روابط ریاضی',
        route: 'GenericCategoryScreen',
        params: {
          title: 'فرمول‌های ریاضی',
          children: (teacherToolsHierarchy.find(t => t.id === 'specialized')?.children || [])
            .find(c => c.id === 'sp-math')?.children || [],
        },
      },
      {
        id: 'sp-bio',
        toolId: 'biology',
        title: 'زیست‌شناسی',
        subtitle: 'محاسبات برون‌ده قلبی و فیزیولوژی',
        route: 'GenericCategoryScreen',
        params: {
          title: 'فرمول‌های زیست‌شناسی',
          children: (teacherToolsHierarchy.find(t => t.id === 'specialized')?.children || [])
            .find(c => c.id === 'sp-biology')?.children || [],
        },
      },
    ],
  },

  // 10. سخت‌افزار، بارکد و ارتباطات
  {
    id: 'hardware-contacts',
    title: 'سخت‌افزار و ارتباطات',
    subtitle: 'ابزارهای تجهیزات کلاسی و دفترچه تلفن',
    iconName: '📱',
    tools: [
      {
        id: 'hc-remote',
        toolId: 'irRemote',
        title: 'ریموت کنترل کلاسی',
        subtitle: 'کنترل پروژکتور، کولر و تلویزیون کلاس با IR',
        route: 'IrRemoteHubScreen',
      },
      {
        id: 'hc-barcode',
        toolId: 'barcodeHub',
        title: 'بارکد و QR Code',
        subtitle: 'اسکن سریع و تولید بارکد و کیوآر',
        route: 'BarcodeHubScreen',
      },
      {
        id: 'hc-phone',
        toolId: 'phonebook',
        title: 'دفترچه تلفن مدارس',
        subtitle: 'شماره‌های ضروری، ادارات و مدارس',
        route: 'PhonebookScreen',
      },
    ],
  },
];
