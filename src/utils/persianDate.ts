import { toJalaali } from 'jalaali-js';

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

const PERSIAN_WEEKDAYS = [
  'یکشنبه', // 0
  'دوشنبه', // 1
  'سه‌شنبه', // 2
  'چهارشنبه', // 3
  'پنج‌شنبه', // 4
  'جمعه', // 5
  'شنبه', // 6
];

export function toPersianDigits(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  return value
    .toString()
    .replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[parseInt(digit, 10)] || digit);
}

export function formatPersianDate(dateInput: Date | string | number | undefined | null): {
  date: string;
  shortDate: string;
  monthDay: string;
  time: string;
  fullDateTime: string;
  jYear: number;
  jMonth: number;
  jDay: number;
} {
  if (!dateInput) {
    return {
      date: 'نامشخص',
      shortDate: 'نامشخص',
      monthDay: 'نامشخص',
      time: 'نامشخص',
      fullDateTime: 'نامشخص',
      jYear: 1403,
      jMonth: 1,
      jDay: 1,
    };
  }

  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) {
    return {
      date: 'نامشخص',
      shortDate: 'نامشخص',
      monthDay: 'نامشخص',
      time: 'نامشخص',
      fullDateTime: 'نامشخص',
      jYear: 1403,
      jMonth: 1,
      jDay: 1,
    };
  }

  const jDate = toJalaali(d);
  const weekdayName = PERSIAN_WEEKDAYS[d.getDay()];
  const monthName = PERSIAN_MONTHS[jDate.jm - 1] || '';

  const dayPersian = toPersianDigits(jDate.jd);
  const yearPersian = toPersianDigits(jDate.jy);

  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const timePersian = `${toPersianDigits(hours)}:${toPersianDigits(minutes)}`;

  const shortDate = `${weekdayName} ${dayPersian} ${monthName}`;
  const date = `${weekdayName} ${dayPersian} ${monthName} ${yearPersian}`;
  const monthDay = `${dayPersian} ${monthName}`;
  const fullDateTime = `${date} - ساعت ${timePersian}`;

  return {
    date,
    shortDate,
    monthDay,
    time: timePersian,
    fullDateTime,
    jYear: jDate.jy,
    jMonth: jDate.jm,
    jDay: jDate.jd,
  };
}
