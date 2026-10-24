import * as jalaali from 'jalaali-js';
import { PERSIAN_WEEKDAYS, PERSIAN_MONTHS, toPersianNumbers } from './jalaliHelper';

export interface NextSessionResult {
  gregorianDate: string; // YYYY-MM-DD
  jalaliDate: string; // YYYY/MM/DD
  jalaliFormattedText: string; // e.g. 'دوشنبه ۲۸ مهر ۱۴۰۵'
  daysRemaining: number;
  remainingText: string; // e.g. '۴ روز مهلت انجام تکالیف'
  isToday: boolean;
  dayOfWeekName: string;
}

/**
 * محاسبه خودکار تاریخ جلسه بعدی درس بر اساس برنامه هفتگی معلم
 */
export const calculateNextSessionDate = (
  scheduleList: any[] = [],
  subject?: string,
  classId?: string,
  baseDate: Date = new Date()
): NextSessionResult => {
  // 1. فیلتر کردن برنامه‌های مرتبط با درس یا کلاس
  let relevantSchedules = scheduleList;

  if (classId) {
    const classFiltered = scheduleList.filter(
      (s) => s.classId === classId || s.classId?._id === classId
    );
    if (classFiltered.length > 0) {
      relevantSchedules = classFiltered;
    }
  }

  if (subject && subject.trim()) {
    const subjectFiltered = relevantSchedules.filter(
      (s) => s.subject && s.subject.trim().toLowerCase() === subject.trim().toLowerCase()
    );
    if (subjectFiltered.length > 0) {
      relevantSchedules = subjectFiltered;
    }
  }

  const todayDayOfWeek = baseDate.getDay(); // 0 (یکشنبه) تا 6 (شنبه)

  let minDiff = 7; // پیش‌فرض: یک هفته بعد

  if (relevantSchedules.length > 0) {
    const days = relevantSchedules
      .map((s) => Number(s.dayOfWeek))
      .filter((d) => !isNaN(d) && d >= 0 && d <= 6);

    const uniqueDays = Array.from(new Set(days));

    if (uniqueDays.length > 0) {
      let candidateDiffs: number[] = [];

      for (const targetDay of uniqueDays) {
        let diff = (targetDay - todayDayOfWeek + 7) % 7;
        if (diff === 0) {
          // اگر امروز روز کلاس باشد، جلسه بعدی هفته آینده همان روز خواهد بود (یا روز بعدی این هفته اگر چند روزه باشد)
          diff = 7;
        }
        candidateDiffs.push(diff);
      }

      minDiff = Math.min(...candidateDiffs);
    }
  }

  // 2. محاسبه تاریخ میلادی هدف
  const targetDate = new Date(baseDate);
  targetDate.setDate(targetDate.getDate() + minDiff);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const gregorianDate = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(
    targetDate.getDate()
  )}`;

  // 3. محاسبه تاریخ شمسی
  const j = jalaali.toJalaali(targetDate);
  const jalaliDate = `${j.jy}/${pad(j.jm)}/${pad(j.jd)}`;

  const dayName = PERSIAN_WEEKDAYS[targetDate.getDay()];
  const monthName = PERSIAN_MONTHS[j.jm - 1];
  const jalaliFormattedText = `${dayName} ${toPersianNumbers(j.jd)} ${monthName} ${toPersianNumbers(j.jy)}`;

  const remainingText =
    minDiff === 1
      ? '۱ روز مهلت (فردا)'
      : `${toPersianNumbers(minDiff)} روز مهلت انجام تکالیف`;

  return {
    gregorianDate,
    jalaliDate,
    jalaliFormattedText,
    daysRemaining: minDiff,
    remainingText,
    isToday: minDiff === 0,
    dayOfWeekName: dayName,
  };
};

/**
 * محاسبه روزهای باقیمانده تا موعد تحویل تکلیف
 */
export const getHomeworkRemainingDays = (dueDateStr: string): {
  days: number;
  isToday: boolean;
  isPast: boolean;
  badgeText: string;
  badgeColor: string;
  badgeBg: string;
} => {
  if (!dueDateStr) {
    return {
      days: 0,
      isToday: false,
      isPast: false,
      badgeText: 'بدون موعد',
      badgeColor: '#64748b',
      badgeBg: '#f1f5f9',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let targetDate: Date;

  if (dueDateStr.includes('-') && dueDateStr.length >= 10 && dueDateStr.startsWith('20')) {
    // Gregorian YYYY-MM-DD
    const [gy, gm, gd] = dueDateStr.split('-').map(Number);
    targetDate = new Date(gy, gm - 1, gd);
  } else if (dueDateStr.includes('/') || (dueDateStr.includes('-') && !dueDateStr.startsWith('20'))) {
    // Jalali YYYY/MM/DD or YYYY-MM-DD
    const parts = dueDateStr.split(/[/-]/).map(Number);
    if (parts.length >= 3) {
      const g = jalaali.toGregorian(parts[0], parts[1], parts[2]);
      targetDate = new Date(g.gy, g.gm - 1, g.gd);
    } else {
      targetDate = today;
    }
  } else {
    targetDate = today;
  }

  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return {
      days: 0,
      isToday: true,
      isPast: false,
      badgeText: 'امروز (موعد تحویل)',
      badgeColor: '#dc2626', // Red
      badgeBg: '#fee2e2',
    };
  } else if (diffDays === 1) {
    return {
      days: 1,
      isToday: false,
      isPast: false,
      badgeText: 'فردا',
      badgeColor: '#ea580c', // Orange
      badgeBg: '#ffedd5',
    };
  } else if (diffDays > 1) {
    return {
      days: diffDays,
      isToday: false,
      isPast: false,
      badgeText: `${toPersianNumbers(diffDays)} روز دیگر`,
      badgeColor: '#0284c7', // Blue
      badgeBg: '#e0f2fe',
    };
  } else {
    return {
      days: Math.abs(diffDays),
      isToday: false,
      isPast: true,
      badgeText: `${toPersianNumbers(Math.abs(diffDays))} روز گذشته`,
      badgeColor: '#64748b', // Gray
      badgeBg: '#f1f5f9',
    };
  }
};
