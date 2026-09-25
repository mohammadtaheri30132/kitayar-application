export type CalendarType = 'jalali' | 'gregorian' | 'hijri';

export interface NormalizedDate {
  year: number;
  month: number;
  day: number;
  calendar: CalendarType;
}

export interface DateDifference {
  years: number;
  months: number;
  days: number;
  totalDays: number;
}
