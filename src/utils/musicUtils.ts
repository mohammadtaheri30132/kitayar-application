export const toPersianDigits = (num: number | string): string => {
  if (num === null || num === undefined) return '';
  const id = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/[0-9]/g, w => id[+w]);
};

export const formatDurationMs = (ms: number): string => {
  if (!ms || isNaN(ms) || ms < 0) return '۰۰:۰۰';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return toPersianDigits(`${mm}:${ss}`);
};

export const formatDurationSec = (seconds?: number): string => {
  if (!seconds || isNaN(seconds) || seconds < 0) return '۰۰:۰۰';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const mm = String(minutes).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  return toPersianDigits(`${mm}:${ss}`);
};
