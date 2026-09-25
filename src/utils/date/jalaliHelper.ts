import * as jalaali from 'jalaali-js';

export const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند'
];

export const PERSIAN_WEEKDAYS = [
  'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'
];

export const toPersianNumbers = (str: string | number): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.toString().replace(/\d/g, (x) => persianDigits[parseInt(x)]);
};

export const getTodayJalali = () => {
  const today = new Date();
  const { jy, jm, jd } = jalaali.toJalaali(today);
  return { jy, jm, jd, today };
};

export const formatJalaliDate = (jy: number, jm: number, jd: number, includeWeekday = true) => {
  const date = jalaali.toGregorian(jy, jm, jd);
  const jsDate = new Date(date.gy, date.gm - 1, date.gd);
  const weekday = PERSIAN_WEEKDAYS[jsDate.getDay()];
  
  const formatted = `${jd} ${PERSIAN_MONTHS[jm - 1]} ${jy}`;
  return includeWeekday ? `${weekday} ${formatted}` : formatted;
};

export const formatJalaliStandard = (jy: number, jm: number, jd: number) => {
  return `${jy}-${jm.toString().padStart(2, '0')}-${jd.toString().padStart(2, '0')}`;
};

export const getDaysInJalaliMonth = (jy: number, jm: number): number => {
  return jalaali.jalaaliMonthLength(jy, jm);
};

export const getFirstDayOfWeekInJalaliMonth = (jy: number, jm: number): number => {
  // Returns 0 (Saturday) to 6 (Friday)
  const gDate = jalaali.toGregorian(jy, jm, 1);
  const date = new Date(gDate.gy, gDate.gm - 1, gDate.gd);
  let day = date.getDay();
  // JS getDay(): Sunday=0, Monday=1, ..., Saturday=6
  // We want Saturday=0, Sunday=1, ..., Friday=6
  day = (day + 1) % 7; 
  return day;
};

export const getCalendarGrid = (jy: number, jm: number) => {
  const daysInMonth = getDaysInJalaliMonth(jy, jm);
  const firstDay = getFirstDayOfWeekInJalaliMonth(jy, jm);
  
  const grid = [];
  // Empty cells for first week
  for (let i = 0; i < firstDay; i++) {
    grid.push(null);
  }
  // Actual days
  for (let i = 1; i <= daysInMonth; i++) {
    grid.push(i);
  }
  return grid;
};
