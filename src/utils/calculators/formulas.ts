export interface FormulaInput {
  id: string;
  label: string;
  placeholder?: string;
  type?: 'number' | 'text';
}

export interface FormulaDefinition {
  id: string;
  title: string;
  inputs: FormulaInput[];
  calculate: (values: Record<string, any>) => string | number;
  resultLabel: string;
}

// A dictionary of all formulas in the app
export const formulas: Record<string, FormulaDefinition> = {
  // === PHYSICS ===
  'ph1-speed': {
    id: 'ph1-speed',
    title: 'سرعت',
    inputs: [
      { id: 'distance', label: 'مسافت (متر)', placeholder: '0' },
      { id: 'time', label: 'زمان (ثانیه)', placeholder: '0' },
    ],
    calculate: (v) => v.time ? v.distance / v.time : 0,
    resultLabel: 'سرعت (m/s)',
  },
  'ph2-acceleration': {
    id: 'ph2-acceleration',
    title: 'شتاب',
    inputs: [
      { id: 'v1', label: 'سرعت اولیه (m/s)', placeholder: '0' },
      { id: 'v2', label: 'سرعت ثانویه (m/s)', placeholder: '0' },
      { id: 'time', label: 'زمان (s)', placeholder: '0' },
    ],
    calculate: (v) => v.time ? (v.v2 - v.v1) / v.time : 0,
    resultLabel: 'شتاب (m/s²)',
  },
  'ph3-force': {
    id: 'ph3-force',
    title: 'نیرو',
    inputs: [
      { id: 'mass', label: 'جرم (kg)', placeholder: '0' },
      { id: 'acceleration', label: 'شتاب (m/s²)', placeholder: '0' },
    ],
    calculate: (v) => v.mass * v.acceleration,
    resultLabel: 'نیرو (نیوتن)',
  },
  'ph4-weight': {
    id: 'ph4-weight',
    title: 'وزن',
    inputs: [
      { id: 'mass', label: 'جرم (kg)', placeholder: '0' },
      { id: 'gravity', label: 'گرانش (m/s²)', placeholder: '9.8' },
    ],
    calculate: (v) => v.mass * (v.gravity || 9.8),
    resultLabel: 'وزن (نیوتن)',
  },
  'ph5-density': {
    id: 'ph5-density',
    title: 'چگالی',
    inputs: [
      { id: 'mass', label: 'جرم (kg)', placeholder: '0' },
      { id: 'volume', label: 'حجم (m³)', placeholder: '0' },
    ],
    calculate: (v) => v.volume ? v.mass / v.volume : 0,
    resultLabel: 'چگالی (kg/m³)',
  },
  'ph6-pressure': {
    id: 'ph6-pressure',
    title: 'فشار',
    inputs: [
      { id: 'force', label: 'نیرو (N)', placeholder: '0' },
      { id: 'area', label: 'مساحت (m²)', placeholder: '0' },
    ],
    calculate: (v) => v.area ? v.force / v.area : 0,
    resultLabel: 'فشار (پاسکال)',
  },
  'ph7-work': {
    id: 'ph7-work',
    title: 'کار',
    inputs: [
      { id: 'force', label: 'نیرو (N)', placeholder: '0' },
      { id: 'distance', label: 'جابجایی (m)', placeholder: '0' },
    ],
    calculate: (v) => v.force * v.distance,
    resultLabel: 'کار (ژول)',
  },
  'ph10-voltage': {
    id: 'ph10-voltage',
    title: 'ولتاژ (قانون اهم)',
    inputs: [
      { id: 'current', label: 'جریان (آمپر)', placeholder: '0' },
      { id: 'resistance', label: 'مقاومت (اهم)', placeholder: '0' },
    ],
    calculate: (v) => v.current * v.resistance,
    resultLabel: 'ولتاژ (ولت)',
  },

  // === CHEMISTRY ===
  'ch1-mole': {
    id: 'ch1-mole',
    title: 'مول',
    inputs: [
      { id: 'mass', label: 'جرم (گرم)', placeholder: '0' },
      { id: 'molarMass', label: 'جرم مولی (g/mol)', placeholder: '0' },
    ],
    calculate: (v) => v.molarMass ? v.mass / v.molarMass : 0,
    resultLabel: 'تعداد مول (mol)',
  },
  'ch5-molarity': {
    id: 'ch5-molarity',
    title: 'مولاریته',
    inputs: [
      { id: 'moles', label: 'تعداد مول', placeholder: '0' },
      { id: 'volume', label: 'حجم محلول (لیتر)', placeholder: '0' },
    ],
    calculate: (v) => v.volume ? v.moles / v.volume : 0,
    resultLabel: 'مولاریته (M)',
  },

  // === AREA & VOLUME ===
  'a1-square': {
    id: 'a1-square',
    title: 'مساحت و محیط مربع',
    inputs: [
      { id: 'side', label: 'طول ضلع', placeholder: '0' },
    ],
    calculate: (v) => `مساحت: ${v.side * v.side} | محیط: ${v.side * 4}`,
    resultLabel: 'نتیجه',
  },
  'a2-rectangle': {
    id: 'a2-rectangle',
    title: 'مساحت و محیط مستطیل',
    inputs: [
      { id: 'width', label: 'عرض', placeholder: '0' },
      { id: 'length', label: 'طول', placeholder: '0' },
    ],
    calculate: (v) => `مساحت: ${v.width * v.length} | محیط: ${(v.width + v.length) * 2}`,
    resultLabel: 'نتیجه',
  },
  'a4-circle': {
    id: 'a4-circle',
    title: 'مساحت و محیط دایره',
    inputs: [
      { id: 'radius', label: 'شعاع', placeholder: '0' },
    ],
    calculate: (v) => {
      const area = Math.PI * v.radius * v.radius;
      const perimeter = 2 * Math.PI * v.radius;
      return `مساحت: ${area.toFixed(2)} | محیط: ${perimeter.toFixed(2)}`;
    },
    resultLabel: 'نتیجه',
  },
  'v1-cube': {
    id: 'v1-cube',
    title: 'حجم مکعب',
    inputs: [
      { id: 'side', label: 'طول ضلع', placeholder: '0' },
    ],
    calculate: (v) => v.side * v.side * v.side,
    resultLabel: 'حجم',
  },
  
  // === GRADES & PERCENTAGES ===
  'p1-percent': {
    id: 'p1-percent',
    title: 'درصد یک عدد',
    inputs: [
      { id: 'number', label: 'عدد کل', placeholder: '0' },
      { id: 'percent', label: 'درصد (%)', placeholder: '0' },
    ],
    calculate: (v) => (v.number * v.percent) / 100,
    resultLabel: 'مقدار محاسبه شده',
  },
  'p4-discount': {
    id: 'p4-discount',
    title: 'قیمت بعد از تخفیف',
    inputs: [
      { id: 'price', label: 'قیمت اصلی', placeholder: '0' },
      { id: 'discount', label: 'درصد تخفیف (%)', placeholder: '0' },
    ],
    calculate: (v) => v.price - ((v.price * v.discount) / 100),
    resultLabel: 'قیمت نهایی',
  },
  'g1-average': {
    id: 'g1-average',
    title: 'میانگین نمرات',
    inputs: [
      { id: 'sum', label: 'جمع کل نمرات', placeholder: '0' },
      { id: 'count', label: 'تعداد دروس', placeholder: '0' },
    ],
    calculate: (v) => v.count ? v.sum / v.count : 0,
    resultLabel: 'میانگین',
  },

  // === SPORT ===
  's1-bmi': {
    id: 's1-bmi',
    title: 'محاسبه BMI',
    inputs: [
      { id: 'weight', label: 'وزن (کیلوگرم)', placeholder: '0' },
      { id: 'height', label: 'قد (سانتی‌متر)', placeholder: '0' },
    ],
    calculate: (v) => {
      if (!v.height) return 0;
      const hMeters = v.height / 100;
      const bmi = v.weight / (hMeters * hMeters);
      let status = '';
      if (bmi < 18.5) status = '(کمبود وزن)';
      else if (bmi < 25) status = '(وزن نرمال)';
      else if (bmi < 30) status = '(اضافه وزن)';
      else status = '(چاقی)';
      return `${bmi.toFixed(2)} ${status}`;
    },
    resultLabel: 'شاخص توده بدنی',
  },

  // === NEW FORMULAS ===
  'p2-percent-diff': {
    id: 'p2-percent-diff', title: 'درصد افزایش/کاهش',
    inputs: [ { id: 'oldVal', label: 'مقدار قدیم', placeholder: '0' }, { id: 'newVal', label: 'مقدار جدید', placeholder: '0' } ],
    calculate: (v) => v.oldVal ? ((v.newVal - v.oldVal) / v.oldVal) * 100 : 0,
    resultLabel: 'درصد تغییر (%)',
  },
  'p3-percent-change': {
    id: 'p3-percent-change', title: 'درصد تغییر بین دو عدد',
    inputs: [ { id: 'v1', label: 'عدد اول', placeholder: '0' }, { id: 'v2', label: 'عدد دوم', placeholder: '0' } ],
    calculate: (v) => v.v1 ? Math.abs((v.v2 - v.v1) / v.v1) * 100 : 0,
    resultLabel: 'درصد اختلاف (%)',
  },
  'p7-profit': {
    id: 'p7-profit', title: 'درصد سود',
    inputs: [ { id: 'buy', label: 'قیمت خرید', placeholder: '0' }, { id: 'sell', label: 'قیمت فروش', placeholder: '0' } ],
    calculate: (v) => v.buy ? ((v.sell - v.buy) / v.buy) * 100 : 0,
    resultLabel: 'درصد سود (%)',
  },
  'g2-gpa': {
    id: 'g2-gpa', title: 'محاسبه معدل',
    inputs: [ { id: 'totalScore', label: 'مجموع نمرات (ضرب در واحد)', placeholder: '0' }, { id: 'totalUnits', label: 'مجموع واحدها', placeholder: '0' } ],
    calculate: (v) => v.totalUnits ? v.totalScore / v.totalUnits : 0,
    resultLabel: 'معدل',
  },
  'g9-negative': {
    id: 'g9-negative', title: 'نمره با نمره منفی',
    inputs: [ { id: 'correct', label: 'تعداد پاسخ صحیح', placeholder: '0' }, { id: 'wrong', label: 'تعداد پاسخ غلط', placeholder: '0' }, { id: 'total', label: 'کل سوالات', placeholder: '0' } ],
    calculate: (v) => v.total ? ((v.correct * 3 - v.wrong) / (v.total * 3)) * 100 : 0,
    resultLabel: 'درصد خام (%)',
  },
  'a3-triangle': {
    id: 'a3-triangle', title: 'مساحت مثلث',
    inputs: [ { id: 'base', label: 'قاعده', placeholder: '0' }, { id: 'height', label: 'ارتفاع', placeholder: '0' } ],
    calculate: (v) => (v.base * v.height) / 2,
    resultLabel: 'مساحت',
  },
  'a5-trapezoid': {
    id: 'a5-trapezoid', title: 'مساحت ذوزنقه',
    inputs: [ { id: 'a', label: 'قاعده کوچک', placeholder: '0' }, { id: 'b', label: 'قاعده بزرگ', placeholder: '0' }, { id: 'h', label: 'ارتفاع', placeholder: '0' } ],
    calculate: (v) => ((v.a + v.b) / 2) * v.h,
    resultLabel: 'مساحت',
  },
  'a6-parallelogram': {
    id: 'a6-parallelogram', title: 'مساحت متوازی‌الاضلاع',
    inputs: [ { id: 'base', label: 'قاعده', placeholder: '0' }, { id: 'height', label: 'ارتفاع', placeholder: '0' } ],
    calculate: (v) => v.base * v.height,
    resultLabel: 'مساحت',
  },
  'a7-rhombus': {
    id: 'a7-rhombus', title: 'مساحت لوزی',
    inputs: [ { id: 'd1', label: 'قطر اول', placeholder: '0' }, { id: 'd2', label: 'قطر دوم', placeholder: '0' } ],
    calculate: (v) => (v.d1 * v.d2) / 2,
    resultLabel: 'مساحت',
  },
  'v2-cuboid': {
    id: 'v2-cuboid', title: 'حجم مکعب‌مستطیل',
    inputs: [ { id: 'l', label: 'طول', placeholder: '0' }, { id: 'w', label: 'عرض', placeholder: '0' }, { id: 'h', label: 'ارتفاع', placeholder: '0' } ],
    calculate: (v) => v.l * v.w * v.h,
    resultLabel: 'حجم',
  },
  'v3-cylinder': {
    id: 'v3-cylinder', title: 'حجم استوانه',
    inputs: [ { id: 'r', label: 'شعاع', placeholder: '0' }, { id: 'h', label: 'ارتفاع', placeholder: '0' } ],
    calculate: (v) => Math.PI * v.r * v.r * v.h,
    resultLabel: 'حجم',
  },
  'v4-cone': {
    id: 'v4-cone', title: 'حجم مخروط',
    inputs: [ { id: 'r', label: 'شعاع', placeholder: '0' }, { id: 'h', label: 'ارتفاع', placeholder: '0' } ],
    calculate: (v) => (1/3) * Math.PI * v.r * v.r * v.h,
    resultLabel: 'حجم',
  },
  'v5-sphere': {
    id: 'v5-sphere', title: 'حجم کره',
    inputs: [ { id: 'r', label: 'شعاع', placeholder: '0' } ],
    calculate: (v) => (4/3) * Math.PI * Math.pow(v.r, 3),
    resultLabel: 'حجم',
  },
  's3-speed-sport': {
    id: 's3-speed-sport', title: 'سرعت دویدن',
    inputs: [ { id: 'd', label: 'مسافت (متر)', placeholder: '0' }, { id: 't', label: 'زمان (دقیقه)', placeholder: '0' } ],
    calculate: (v) => v.t ? (v.d / 1000) / (v.t / 60) : 0,
    resultLabel: 'سرعت (km/h)',
  },
  's7-pace': {
    id: 's7-pace', title: 'Pace (گام دویدن)',
    inputs: [ { id: 'd', label: 'مسافت (کیلومتر)', placeholder: '0' }, { id: 't', label: 'زمان (دقیقه)', placeholder: '0' } ],
    calculate: (v) => v.d ? v.t / v.d : 0,
    resultLabel: 'Pace (دقیقه بر کیلومتر)',
  },
  's10-max-hr': {
    id: 's10-max-hr', title: 'حداکثر ضربان قلب',
    inputs: [ { id: 'age', label: 'سن', placeholder: '0' } ],
    calculate: (v) => 220 - v.age,
    resultLabel: 'حداکثر ضربان (BPM)',
  },
  'f8-simple-interest': {
    id: 'f8-simple-interest', title: 'سود ساده',
    inputs: [ { id: 'p', label: 'سرمایه اولیه', placeholder: '0' }, { id: 'r', label: 'نرخ سود سالانه (%)', placeholder: '0' }, { id: 't', label: 'زمان (سال)', placeholder: '0' } ],
    calculate: (v) => (v.p * v.r * v.t) / 100,
    resultLabel: 'سود بانکی',
  },
  'f9-compound-interest': {
    id: 'f9-compound-interest', title: 'سود مرکب',
    inputs: [ { id: 'p', label: 'سرمایه اولیه', placeholder: '0' }, { id: 'r', label: 'نرخ سود سالانه (%)', placeholder: '0' }, { id: 'n', label: 'تعداد دفعات پرداخت در سال', placeholder: '12' }, { id: 't', label: 'زمان (سال)', placeholder: '0' } ],
    calculate: (v) => {
      const n = v.n || 12;
      return v.p * Math.pow((1 + (v.r / 100) / n), n * v.t);
    },
    resultLabel: 'مبلغ نهایی',
  },
  'n1-num-to-text': {
    id: 'n1-num-to-text', title: 'عدد به حروف',
    inputs: [ { id: 'num', label: 'عدد', type: 'text', placeholder: '123' } ],
    calculate: (v) => v.num ? `برای اعداد بزرگ از ابزارهای فارسی‌ساز استفاده شود (فعلا دمو)` : '',
    resultLabel: 'حروف',
  },
  'n2-text-to-num': {
    id: 'n2-text-to-num', title: 'حروف به عدد',
    inputs: [ { id: 'text', label: 'حروف', type: 'text', placeholder: 'صد و بیست' } ],
    calculate: (v) => '120 (دمو)',
    resultLabel: 'عدد',
  },
  'n3-num-to-roman': {
    id: 'n3-num-to-roman', title: 'عدد به رومی',
    inputs: [ { id: 'num', label: 'عدد', placeholder: '10' } ],
    calculate: (v) => {
      const roman = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
      let str = '';
      let num = v.num;
      for (let i of Object.keys(roman)) {
        let q = Math.floor(num / roman[i as keyof typeof roman]);
        num -= q * roman[i as keyof typeof roman];
        str += i.repeat(q);
      }
      return str || '';
    },
    resultLabel: 'عدد رومی',
  },
  'n5-bin-to-dec': {
    id: 'n5-bin-to-dec', title: 'مبنای ۲ به ۱۰',
    inputs: [ { id: 'bin', label: 'عدد باینری', type: 'text', placeholder: '1010' } ],
    calculate: (v) => v.bin ? parseInt(v.bin, 2) : 0,
    resultLabel: 'ده‌دهی',
  },
  'n6-dec-to-bin': {
    id: 'n6-dec-to-bin', title: 'مبنای ۱۰ به ۲',
    inputs: [ { id: 'dec', label: 'عدد ده‌دهی', placeholder: '10' } ],
    calculate: (v) => v.dec ? (v.dec >>> 0).toString(2) : '0',
    resultLabel: 'باینری',
  },
  'n7-dec-to-oct': {
    id: 'n7-dec-to-oct', title: 'مبنای ۱۰ به ۸',
    inputs: [ { id: 'dec', label: 'عدد ده‌دهی', placeholder: '10' } ],
    calculate: (v) => v.dec ? (v.dec >>> 0).toString(8) : '0',
    resultLabel: 'هشت‌هشتی (Octal)',
  },
  'n8-dec-to-hex': {
    id: 'n8-dec-to-hex', title: 'مبنای ۱۰ به ۱۶',
    inputs: [ { id: 'dec', label: 'عدد ده‌دهی', placeholder: '10' } ],
    calculate: (v) => v.dec ? (v.dec >>> 0).toString(16).toUpperCase() : '0',
    resultLabel: 'شانزده‌شانزدهی (Hex)',
  },
  
  // Percentages remaining
  'p5-price-after-discount': {
    id: 'p5-price-after-discount', title: 'قیمت بعد از تخفیف',
    inputs: [ { id: 'price', label: 'قیمت اصلی', placeholder: '0' }, { id: 'discount', label: 'درصد تخفیف', placeholder: '0' } ],
    calculate: (v) => v.price - (v.price * (v.discount / 100)),
    resultLabel: 'قیمت پرداختی',
  },
  'p6-price-before-discount': {
    id: 'p6-price-before-discount', title: 'قیمت قبل از تخفیف',
    inputs: [ { id: 'price', label: 'قیمت پرداخت شده', placeholder: '0' }, { id: 'discount', label: 'درصد تخفیف', placeholder: '0' } ],
    calculate: (v) => v.price / (1 - (v.discount / 100)),
    resultLabel: 'قیمت اصلی',
  },
  
  // Grades remaining
  'g4-final-grade': {
    id: 'g4-final-grade', title: 'محاسبه نمره نهایی',
    inputs: [ { id: 'mid', label: 'نمره میان ترم', placeholder: '0' }, { id: 'final', label: 'نمره پایان ترم', placeholder: '0' }, { id: 'midWeight', label: 'درصد میان ترم', placeholder: '30' } ],
    calculate: (v) => (v.mid * (v.midWeight/100)) + (v.final * ((100-v.midWeight)/100)),
    resultLabel: 'نمره نهایی',
  },
  'g6-pass-percent': {
    id: 'g6-pass-percent', title: 'درصد قبولی کلاس',
    inputs: [ { id: 'pass', label: 'تعداد قبول شدگان', placeholder: '0' }, { id: 'total', label: 'کل دانش آموزان', placeholder: '0' } ],
    calculate: (v) => v.total ? (v.pass / v.total) * 100 : 0,
    resultLabel: 'درصد قبولی (%)',
  },
  
  // Sport remaining
  's4-distance': {
    id: 's4-distance', title: 'مسافت',
    inputs: [ { id: 'speed', label: 'سرعت (km/h)', placeholder: '0' }, { id: 'time', label: 'زمان (ساعت)', placeholder: '0' } ],
    calculate: (v) => v.speed * v.time,
    resultLabel: 'مسافت (km)',
  },
  's5-time': {
    id: 's5-time', title: 'زمان حرکت',
    inputs: [ { id: 'distance', label: 'مسافت (km)', placeholder: '0' }, { id: 'speed', label: 'سرعت (km/h)', placeholder: '0' } ],
    calculate: (v) => v.speed ? v.distance / v.speed : 0,
    resultLabel: 'زمان (ساعت)',
  },
  's9-target-hr': {
    id: 's9-target-hr', title: 'ضربان قلب هدف',
    inputs: [ { id: 'age', label: 'سن', placeholder: '0' }, { id: 'intensity', label: 'شدت تمرین (%)', placeholder: '70' } ],
    calculate: (v) => (220 - v.age) * (v.intensity / 100),
    resultLabel: 'ضربان هدف (BPM)',
  },
  
  // Finance remaining
  'f1-profit-loss': {
    id: 'f1-profit-loss', title: 'سود و زیان',
    inputs: [ { id: 'buy', label: 'قیمت خرید کل', placeholder: '0' }, { id: 'sell', label: 'قیمت فروش کل', placeholder: '0' }, { id: 'expenses', label: 'هزینه‌های جانبی', placeholder: '0' } ],
    calculate: (v) => v.sell - (v.buy + (v.expenses || 0)),
    resultLabel: 'میزان سود/زیان خالص',
  },
  'f10-installment': {
    id: 'f10-installment', title: 'مبلغ قسط',
    inputs: [ { id: 'loan', label: 'مبلغ وام', placeholder: '0' }, { id: 'rate', label: 'نرخ سود سالانه (%)', placeholder: '0' }, { id: 'months', label: 'تعداد ماه', placeholder: '0' } ],
    calculate: (v) => {
      if (!v.months) return 0;
      if (!v.rate) return v.loan / v.months;
      const r = (v.rate / 100) / 12;
      return (v.loan * r * Math.pow(1+r, v.months)) / (Math.pow(1+r, v.months) - 1);
    },
    resultLabel: 'مبلغ قسط ماهیانه',
  },
  
  // === SPECIALIZED: PHYSICS ===
  'ph8-power': {
    id: 'ph8-power', title: 'توان',
    inputs: [ { id: 'w', label: 'کار (ژول)', placeholder: '0' }, { id: 't', label: 'زمان (ثانیه)', placeholder: '0' } ],
    calculate: (v) => v.t ? v.w / v.t : 0,
    resultLabel: 'توان (وات)',
  },
  'ph9-energy': {
    id: 'ph9-energy', title: 'انرژی جنبشی',
    inputs: [ { id: 'm', label: 'جرم (kg)', placeholder: '0' }, { id: 'v', label: 'سرعت (m/s)', placeholder: '0' } ],
    calculate: (v) => 0.5 * v.m * Math.pow(v.v, 2),
    resultLabel: 'انرژی (ژول)',
  },
  'ph11-current': {
    id: 'ph11-current', title: 'جریان الکتریکی',
    inputs: [ { id: 'v', label: 'ولتاژ (V)', placeholder: '0' }, { id: 'r', label: 'مقاومت (Ω)', placeholder: '0' } ],
    calculate: (v) => v.r ? v.v / v.r : 0,
    resultLabel: 'جریان (آمپر)',
  },
  'ph12-resistance': {
    id: 'ph12-resistance', title: 'مقاومت الکتریکی',
    inputs: [ { id: 'v', label: 'ولتاژ (V)', placeholder: '0' }, { id: 'i', label: 'جریان (A)', placeholder: '0' } ],
    calculate: (v) => v.i ? v.v / v.i : 0,
    resultLabel: 'مقاومت (اهم)',
  },
  'ph14-electric-power': {
    id: 'ph14-electric-power', title: 'توان الکتریکی',
    inputs: [ { id: 'v', label: 'ولتاژ (V)', placeholder: '0' }, { id: 'i', label: 'جریان (A)', placeholder: '0' } ],
    calculate: (v) => v.v * v.i,
    resultLabel: 'توان (وات)',
  },

  // === SPECIALIZED: CHEMISTRY ===
  'ch2-molar-mass': {
    id: 'ch2-molar-mass', title: 'جرم مولی تقریبی',
    inputs: [ { id: 'm', label: 'جرم نمونه (g)', placeholder: '0' }, { id: 'n', label: 'تعداد مول', placeholder: '0' } ],
    calculate: (v) => v.n ? v.m / v.n : 0,
    resultLabel: 'جرم مولی (g/mol)',
  },
  'ch3-g-to-mol': {
    id: 'ch3-g-to-mol', title: 'گرم به مول',
    inputs: [ { id: 'm', label: 'جرم (g)', placeholder: '0' }, { id: 'mw', label: 'جرم مولی (g/mol)', placeholder: '0' } ],
    calculate: (v) => v.mw ? v.m / v.mw : 0,
    resultLabel: 'تعداد مول',
  },
  'ch4-mol-to-g': {
    id: 'ch4-mol-to-g', title: 'مول به گرم',
    inputs: [ { id: 'n', label: 'تعداد مول', placeholder: '0' }, { id: 'mw', label: 'جرم مولی (g/mol)', placeholder: '0' } ],
    calculate: (v) => v.n * v.mw,
    resultLabel: 'جرم (گرم)',
  },
  'ch7-mass-percent': {
    id: 'ch7-mass-percent', title: 'درصد جرمی',
    inputs: [ { id: 'mSolute', label: 'جرم حل‌شونده (g)', placeholder: '0' }, { id: 'mSolution', label: 'جرم محلول (g)', placeholder: '0' } ],
    calculate: (v) => v.mSolution ? (v.mSolute / v.mSolution) * 100 : 0,
    resultLabel: 'درصد جرمی (%)',
  },
  'ch8-ph': {
    id: 'ch8-ph', title: 'محاسبه pH',
    inputs: [ { id: 'h', label: 'غلظت یون هیدروژن [H+]', placeholder: '0.001' } ],
    calculate: (v) => v.h ? -Math.log10(v.h) : 0,
    resultLabel: 'pH',
  },

  // === SPECIALIZED: MATH ===
  'm2-logarithm': {
    id: 'm2-logarithm', title: 'لگاریتم',
    inputs: [ { id: 'num', label: 'عدد', placeholder: '100' }, { id: 'base', label: 'مبنا', placeholder: '10' } ],
    calculate: (v) => {
      const base = v.base || 10;
      return (v.num > 0 && base > 0 && base !== 1) ? Math.log(v.num) / Math.log(base) : 'نامعتبر';
    },
    resultLabel: 'حاصل',
  },
  'm3-factorial': {
    id: 'm3-factorial', title: 'فاکتوریل',
    inputs: [ { id: 'n', label: 'عدد (صحیح و مثبت)', placeholder: '5' } ],
    calculate: (v) => {
      if (v.n < 0 || v.n > 100) return 'خارج از محدوده';
      let f = 1;
      for (let i = 2; i <= Math.floor(v.n); i++) f *= i;
      return f;
    },
    resultLabel: 'فاکتوریل',
  },

  // === SPECIALIZED: BIOLOGY ===
  'b1-cardiac-output': {
    id: 'b1-cardiac-output', title: 'برون‌ده قلبی',
    inputs: [ { id: 'hr', label: 'ضربان قلب (bpm)', placeholder: '70' }, { id: 'sv', label: 'حجم ضربه‌ای (mL)', placeholder: '70' } ],
    calculate: (v) => (v.hr * v.sv) / 1000,
    resultLabel: 'برون‌ده (لیتر در دقیقه)',
  }
};
