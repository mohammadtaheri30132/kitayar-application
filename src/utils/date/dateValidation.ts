import * as jalaali from 'jalaali-js';
import { CalendarType, NormalizedDate } from './types';

export const isLeapYear = (year: number, calendar: CalendarType): boolean => {
  if (calendar === 'gregorian') {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }
  if (calendar === 'jalali') {
    return jalaali.isLeapJalaaliYear(year);
  }
  if (calendar === 'hijri') {
    // Standard tabular Islamic calendar leap year rule
    // (11 leap years in a 30-year cycle)
    return (11 * year + 14) % 30 < 11;
  }
  return false;
};

export const getDaysInMonth = (year: number, month: number, calendar: CalendarType): number => {
  if (calendar === 'gregorian') {
    const days = [31, isLeapYear(year, 'gregorian') ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return days[month - 1] || 0;
  }
  if (calendar === 'jalali') {
    if (month <= 6) return 31;
    if (month <= 11) return 30;
    return isLeapYear(year, 'jalali') ? 30 : 29;
  }
  if (calendar === 'hijri') {
    // In tabular Islamic calendar, odd months have 30 days, even months have 29 days.
    // The 12th month has 30 days in a leap year.
    if (month % 2 !== 0) return 30;
    if (month === 12 && isLeapYear(year, 'hijri')) return 30;
    return 29;
  }
  return 0;
};

export const isValidDate = (date: NormalizedDate): boolean => {
  const { year, month, day, calendar } = date;
  
  if (!year || isNaN(year) || year < 1 || year > 9999) return false;
  if (!month || isNaN(month) || month < 1 || month > 12) return false;
  if (!day || isNaN(day) || day < 1 || day > 31) return false;

  const maxDays = getDaysInMonth(year, month, calendar);
  return day <= maxDays;
};
