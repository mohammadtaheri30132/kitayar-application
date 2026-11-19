import * as jalaali from 'jalaali-js';
import { api } from '../api/axiosConfig';

const VIDEO_EXT_REGEX = /\.(mp4|mov|m4v|webm|mkv|3gp|avi)(\?.*)?$/i;

export const getServerRootUrl = (): string => {
  const base = api.defaults.baseURL || 'https://class.kitayar.ir';
  return base.replace(/\/api\/?$/, '');
};

export const resolveCommunityMediaUrl = (uri?: string | null): string | null => {
  if (!uri || uri.includes('pravatar.cc') || uri.includes('ui-avatars.com')) return null;
  if (
    uri.startsWith('http://') ||
    uri.startsWith('https://') ||
    uri.startsWith('file://') ||
    uri.startsWith('content://')
  ) {
    return uri;
  }
  const root = getServerRootUrl();
  return `${root}${uri.startsWith('/') ? '' : '/'}${uri}`;
};

export const isVideoUrl = (uri?: string | null): boolean => {
  if (!uri) return false;
  return VIDEO_EXT_REGEX.test(uri);
};

export const getVideoThumbUrl = (videoUri?: string | null): string | null => {
  const resolved = resolveCommunityMediaUrl(videoUri);
  if (!resolved || !isVideoUrl(resolved)) return null;
  return resolved.replace(/\.[a-z0-9]+(\?.*)?$/i, '_thumb.jpg$1');
};

export const toPersianDigits = (n: number | string): string => {
  if (n === null || n === undefined) return '';
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
};

export const formatRelativeTime = (dateString?: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return 'همین الان';
    if (diffMin < 60) return `${toPersianDigits(diffMin)} دقیقه پیش`;
    if (diffHours < 24) return `${toPersianDigits(diffHours)} ساعت پیش`;
    if (diffDays < 7) return `${toPersianDigits(diffDays)} روز پیش`;

    const j = jalaali.toJalaali(date);
    return `${toPersianDigits(j.jy)}/${toPersianDigits(j.jm)}/${toPersianDigits(j.jd)}`;
  } catch {
    return '';
  }
};
