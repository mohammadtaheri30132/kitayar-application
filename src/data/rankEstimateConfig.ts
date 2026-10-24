export interface LessonDefinition {
  title: string;
  id: string;
}

export interface FieldDefinition {
  key: 'tajrobi' | 'riazi' | 'ensani';
  title: string;
  fieldId: string;
  gradeId: string;
  exams: Record<string, string>;
  lessons: LessonDefinition[];
}

export const REGIONS: Record<string, string> = {
  first_region: 'منطقه ۱',
  second_region: 'منطقه ۲',
  third_region: 'منطقه ۳',
};

export const FIELDS: Record<'tajrobi' | 'riazi' | 'ensani', FieldDefinition> = {
  tajrobi: {
    key: 'tajrobi',
    title: 'تجربی',
    fieldId: '9c2a9659-5a7d-441a-8518-7d2e50a88928',
    gradeId: '84093f4c-03b0-4cbf-8297-160a9b6b8948',
    exams: {
      '1404': '028857db-9834-4bc7-9aa3-ba0b34e0d696',
      '1403': '01943e20-3b1d-417d-8e83-c154ff19edfb',
      '1402': '243f9890-b3f3-493c-a433-dd1fb0351e69',
      '1401': 'b539a2a5-99e8-4c49-bfea-341c5c124c37',
      '1400': '874f18c7-9686-4b76-abdb-77ec7288c3c1',
      '1399': '84d370df-c58d-45d6-9d4f-d533d9028232',
      '1398': '8a4b493c-9a0d-4049-9ae6-767f011df1e1',
    },
    lessons: [
      { title: 'زیست‌شناسی', id: '058870b2-de81-4432-aa0b-831d577e94f6' },
      { title: 'فیزیک', id: '1aed83c6-3e65-4578-9720-92e996f7a750' },
      { title: 'شیمی', id: 'ceab524c-88b7-47e9-9836-7478ea090277' },
      { title: 'ریاضی', id: '46ba0cc3-1fc8-4828-8ad5-c813f3d5a3ac' },
      { title: 'زمین‌شناسی', id: 'd83543a1-cf4b-4046-bdd6-78314e658a18' },
    ],
  },
  riazi: {
    key: 'riazi',
    title: 'ریاضی',
    fieldId: 'cc50d592-5821-4158-b08f-00a5c6054eb9',
    gradeId: 'fdf7eb4a-a394-435d-8cdf-6cf186aa53e1',
    exams: {
      '1404': '6fc1ebd7-3aea-4aeb-b576-6858d129d17b',
      '1403': 'a02feb87-2988-4796-bd77-60dfc7234ab4',
      '1402': '1c6677ab-ff5b-44c9-bdc9-21af4b01e3e9',
      '1401': '10812f12-d5fa-4991-8530-9d16f399ed63',
      '1400': 'a5ab5139-09da-4609-8b85-c67298daee88',
      '1399': '84d9efb0-e23a-4070-b473-a7240207e9fe',
      '1398': '496b3d8c-8e8e-4456-82f4-c233574ce8f7',
    },
    lessons: [
      { title: 'ریاضیات', id: 'd1a32a5e-53f9-42c0-9c34-12595b71412e' },
      { title: 'فیزیک', id: 'c68752e7-7e21-4c4c-8fe6-6bbb4034abbe' },
      { title: 'شیمی', id: 'b1755937-e1da-40ef-b79f-2714168a4087' },
    ],
  },
  ensani: {
    key: 'ensani',
    title: 'انسانی',
    fieldId: 'e6f48e03-e78c-4719-9438-1196e0cd566e',
    gradeId: 'e497819b-e84b-4b79-8240-1239c4a2e8fa',
    exams: {
      '1404': '18a76597-4ea1-413e-aef1-644a1312e0e8',
      '1403': '5ad9a547-b955-4b13-80da-e728bbb702d3',
      '1402': '3a416d13-f942-4d8e-8258-f577e3c2e132',
      '1401': '13ca63b0-e8c3-4a88-aec5-4953c6c61e70',
      '1400': '486f32eb-9bf4-4537-9f62-df7fb62a9a94',
      '1399': '4eb2de5a-228b-45f1-aa21-8ef6684d81c3',
      '1398': '8ddc612e-be48-4374-9291-7317ecdd133d',
    },
    lessons: [
      { title: 'ریاضی و آمار', id: '0db97a8b-cc7a-4995-baf5-ce9250d89fcb' },
      { title: 'علوم و فنون ادبی', id: '30f8c02a-3a3d-4d97-adb1-eeb1bb956ab1' },
      { title: 'جامعه‌شناسی', id: '4e73d9fa-2ac4-42ab-9729-bd36c32887e0' },
      { title: 'روان‌شناسی', id: 'd63b78b2-b4c1-48f4-b2b9-9144237af606' },
      { title: 'زبان عربی', id: 'f0591c6b-e427-4f81-8c28-3393ae6b5af1' },
      { title: 'تاریخ و جغرافیا', id: 'dffe878d-e0b0-471c-ba0b-72ed981eb9c6' },
      { title: 'فلسفه و منطق', id: '15e58f54-47a0-4a5c-ba8c-af0549473b4c' },
      { title: 'اقتصاد', id: '0ac282b3-b21a-44af-8c24-b3b82b22f7ee' },
    ],
  },
};

export interface RankEstimatePayload {
  region: string;
  field_id: string;
  entrance_exam_id: string;
  lesson_percents: Array<{ lesson_id: string; percent: number }>;
  grade_scores: Array<{ grade_id: string; score: number }>;
}

export interface RankEstimateResult {
  entrance_exam_level_from: number | null;
  entrance_exam_level_to: number | null;
  academic_record_level_from: number | null;
  academic_record_level_to: number | null;
  total_level_from: number | null;
  total_level_to: number | null;
  country_rank_from: number | null;
  country_rank_to: number | null;
  region_rank_from: number | null;
  region_rank_to: number | null;
}

/**
 * تبدیل ارقام انگلیسی و عربی به ارقام فارسی
 */
export function toPersianDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined || input === '') return '';
  const str = input.toString();
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  return str
    .replace(/[0-9]/g, (w) => persianDigits[+w])
    .replace(/[\u0660-\u0669]/g, (w) => persianDigits[arabicDigits.indexOf(w)]);
}

/**
 * تبدیل ارقام فارسی و عربی به انگلیسی و استانداردسازی اعشار
 */
export function normalizeNumberInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/[۰-۹]/g, (d) => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)])
    .replace(/[٠-٩]/g, (d) => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)])
    .replace(/٫/g, '.')
    .replace(/,/g, '.')
    .trim();
}

/**
 * فرمت عدد با جداکننده هزارگان و ارقام فارسی
 */
export function formatNumberWithCommas(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '-';
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
  return toPersianDigits(parts.join('.'));
}

/**
 * طبق مشخصات بخش ۶:
 * اگر from و to هر دو مقدار داشتند: «از {from} تا {to}»
 * اگر to برابر null بود: «از {from} به بعد» (یا «{from} به بعد»)
 */
export function formatRange(
  from: number | null | undefined,
  to: number | null | undefined
): string {
  const hasFrom = from !== null && from !== undefined && !isNaN(from);
  const hasTo = to !== null && to !== undefined && !isNaN(to);

  if (hasFrom && hasTo) {
    if (from === to) {
      return formatNumberWithCommas(from);
    }
    return `از ${formatNumberWithCommas(from)} تا ${formatNumberWithCommas(to)}`;
  }

  if (hasFrom && !hasTo) {
    return `${formatNumberWithCommas(from)} به بعد`;
  }

  if (!hasFrom && hasTo) {
    return `تا ${formatNumberWithCommas(to)}`;
  }

  return '-';
}
