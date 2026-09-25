import { NormalizedDate, DateDifference, CalendarType } from './types';
import { toGregorian } from './dateConverter';
import { getDaysInMonth } from './dateValidation';

// Get total days using Julian Day Number algorithm for Gregorian dates
const gregorianToJDN = (year: number, month: number, day: number): number => {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
};

export const getExactDaysBetween = (start: NormalizedDate, end: NormalizedDate): number => {
  // Convert both to Gregorian to easily compare exact days between them
  const startGreg = toGregorian(start);
  const endGreg = toGregorian(end);

  const startJDN = gregorianToJDN(startGreg.year, startGreg.month, startGreg.day);
  const endJDN = gregorianToJDN(endGreg.year, endGreg.month, endGreg.day);

  return endJDN - startJDN;
};

// Returns whether d1 is strictly before d2
export const isBefore = (d1: NormalizedDate, d2: NormalizedDate): boolean => {
  if (d1.year !== d2.year) return d1.year < d2.year;
  if (d1.month !== d2.month) return d1.month < d2.month;
  return d1.day < d2.day;
};

export const getCalendarDifference = (
  start: NormalizedDate,
  end: NormalizedDate
): DateDifference => {
  // Ensure dates are in the same calendar system for true calendar difference
  if (start.calendar !== end.calendar) {
    throw new Error('Dates must use the same calendar system to calculate calendar difference');
  }

  const totalDays = getExactDaysBetween(start, end);
  
  if (totalDays === 0) {
    return { years: 0, months: 0, days: 0, totalDays: 0 };
  }

  // Swap if end is before start, to ensure positive calculation
  let s = start;
  let e = end;
  const isNegative = totalDays < 0;

  if (isNegative) {
    s = end;
    e = start;
  }

  let years = e.year - s.year;
  let months = e.month - s.month;
  let days = e.day - s.day;

  if (days < 0) {
    months -= 1;
    // borrow days from the PREVIOUS month of the end date
    let prevMonth = e.month - 1;
    let prevYear = e.year;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth, s.calendar);
    days += daysInPrevMonth;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return {
    years,
    months,
    days,
    totalDays: Math.abs(totalDays),
  };
};
