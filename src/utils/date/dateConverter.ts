import * as jalaali from 'jalaali-js';
import hijri from 'hijri-converter';
import { CalendarType, NormalizedDate } from './types';

export const toGregorian = (date: NormalizedDate): NormalizedDate => {
  if (date.calendar === 'gregorian') return { ...date };

  if (date.calendar === 'jalali') {
    const { gy, gm, gd } = jalaali.toGregorian(date.year, date.month, date.day);
    return { year: gy, month: gm, day: gd, calendar: 'gregorian' };
  }

  if (date.calendar === 'hijri') {
    const { gy, gm, gd } = hijri.toGregorian(date.year, date.month, date.day);
    return { year: gy, month: gm, day: gd, calendar: 'gregorian' };
  }

  return date;
};

export const fromGregorian = (
  gregorianDate: NormalizedDate,
  targetCalendar: CalendarType
): NormalizedDate => {
  if (targetCalendar === 'gregorian') return { ...gregorianDate };

  if (targetCalendar === 'jalali') {
    const { jy, jm, jd } = jalaali.toJalaali(gregorianDate.year, gregorianDate.month, gregorianDate.day);
    return { year: jy, month: jm, day: jd, calendar: 'jalali' };
  }

  if (targetCalendar === 'hijri') {
    const { hy, hm, hd } = hijri.toHijri(gregorianDate.year, gregorianDate.month, gregorianDate.day);
    return { year: hy, month: hm, day: hd, calendar: 'hijri' };
  }

  return gregorianDate;
};

export const convertDate = (date: NormalizedDate, targetCalendar: CalendarType): NormalizedDate => {
  if (date.calendar === targetCalendar) return { ...date };
  const gregorian = toGregorian(date);
  return fromGregorian(gregorian, targetCalendar);
};

export const getToday = (calendar: CalendarType = 'gregorian'): NormalizedDate => {
  const now = new Date();
  const gregorian: NormalizedDate = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    calendar: 'gregorian',
  };
  return convertDate(gregorian, calendar);
};
