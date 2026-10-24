import { api } from '../api/axiosConfig';
import {
  FIELDS,
  REGIONS,
  RankEstimatePayload,
  RankEstimateResult,
} from '../data/rankEstimateConfig';

const resultCache = new Map<string, RankEstimateResult>();

// In-memory cookie jar for direct Biomaze fallback
let directCookies: Record<string, string> = {};

function parseCookies(cookieHeaders: string | null) {
  if (!cookieHeaders) return;
  const parts = cookieHeaders.split(';');
  for (const p of parts) {
    const [k, v] = p.split('=');
    if (k && v) {
      directCookies[k.trim()] = v.trim();
    }
  }
}

function getCookieStr(): string {
  return Object.entries(directCookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

export const rankEstimateService = {
  /**
   * Fetch available fields (تجربی, ریاضی, انسانی)
   */
  async getFields() {
    try {
      const response = await api.get('/public/rank-estimate/fields', { timeout: 4000 });
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    } catch (e) {
      // Fallback
    }

    return Object.values(FIELDS).map((f) => ({
      id: f.fieldId,
      title: f.title,
      key: f.key,
    }));
  },

  /**
   * Fetch available regions (منطقه ۱, منطقه ۲, منطقه ۳)
   */
  async getRegions() {
    try {
      const response = await api.get('/public/rank-estimate/regions', { timeout: 4000 });
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    } catch (e) {
      // Fallback
    }

    return Object.entries(REGIONS).map(([value, trans]) => ({
      value,
      trans,
    }));
  },

  /**
   * Fetch entrance exams for a given field
   */
  async getEntranceExams(fieldId: string, fieldKey?: 'tajrobi' | 'riazi' | 'ensani') {
    try {
      const response = await api.get(`/public/rank-estimate/fields/${fieldId}/entrance-exams`, {
        timeout: 4000,
      });
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    } catch (e) {
      // Fallback
    }

    // Fallback from static config
    const targetField = fieldKey
      ? FIELDS[fieldKey]
      : Object.values(FIELDS).find((f) => f.fieldId === fieldId) || FIELDS.tajrobi;

    return Object.entries(targetField.exams).map(([year, id]) => ({
      id,
      entrance_exam_title: `کنکور ${year}`,
      year,
    }));
  },

  /**
   * Fetch lessons and grade score item for a specific exam
   */
  async getGradeLessons(
    entranceExamId: string,
    fieldKey?: 'tajrobi' | 'riazi' | 'ensani'
  ) {
    try {
      const response = await api.get(
        `/public/rank-estimate/entrance-exams/${entranceExamId}/grade-lessons`,
        { timeout: 4000 }
      );
      if (response.data?.data) {
        return response.data.data;
      }
    } catch (e) {
      // Fallback
    }

    // Fallback from static config
    const targetField = fieldKey
      ? FIELDS[fieldKey]
      : Object.values(FIELDS).find((f) =>
          Object.values(f.exams).includes(entranceExamId)
        ) || FIELDS.tajrobi;

    return {
      entrance_exam_grades: [
        {
          id: targetField.gradeId,
          grade_id: targetField.gradeId,
          grade_title: 'معدل امتحانات نهایی',
        },
      ],
      entrance_exam_lessons: targetField.lessons.map((l) => ({
        id: l.id,
        lesson_id: l.id,
        lesson_title: l.title,
      })),
    };
  },

  /**
   * Calculate rank estimate
   */
  async calculateRank(payload: RankEstimatePayload): Promise<RankEstimateResult> {
    const cacheKey = JSON.stringify(payload);
    if (resultCache.has(cacheKey)) {
      return resultCache.get(cacheKey)!;
    }

    console.log('🚀 [RankEstimate] Sending payload:', JSON.stringify(payload, null, 2));

    // 1. Try Backend Proxy
    try {
      const res = await api.post('/public/rank-estimate/result', payload, {
        timeout: 12000,
      });
      console.log('✅ [RankEstimate] Backend proxy success:', JSON.stringify(res.data, null, 2));
      if (res.data?.data) {
        resultCache.set(cacheKey, res.data.data);
        return res.data.data;
      }
    } catch (proxyError: any) {
      console.log('❌ [RankEstimate] Backend proxy failed:', {
        status: proxyError?.response?.status,
        data: proxyError?.response?.data,
        message: proxyError?.message,
      });

      // Handle specific HTTP errors from proxy
      if (proxyError?.response?.status === 429) {
        throw new Error('تعداد درخواست‌ها بیش از حد مجاز است. لطفاً چند ثانیه صبر کنید.');
      }
      if (proxyError?.response?.status >= 400 && proxyError?.response?.status < 500) {
        const serverMsg = proxyError?.response?.data?.message || JSON.stringify(proxyError?.response?.data);
        console.log('❌ [RankEstimate] 4xx server message:', serverMsg);
        throw new Error(`اطلاعات واردشده معتبر نیست (${serverMsg})`);
      }
    }

    // 2. Direct Fallback to Biomaze
    try {
      // Ensure CSRF token
      const csrfRes = await fetch('https://biomaze.ir/sanctum/csrf-cookie', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          'Referer': 'https://biomaze.ir/rank-estimate',
          'Cookie': getCookieStr(),
        },
      });

      const setCookie = csrfRes.headers.get('set-cookie');
      parseCookies(setCookie);

      const xsrf = decodeURIComponent(directCookies['XSRF-TOKEN'] || '');

      const postRes = await fetch('https://biomaze.ir/api/guest/rank_estimate/result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
          'Origin': 'https://biomaze.ir',
          'Referer': 'https://biomaze.ir/rank-estimate',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          'Cookie': getCookieStr(),
          'X-XSRF-TOKEN': xsrf,
        },
        body: JSON.stringify(payload),
      });

      console.log('📡 [RankEstimate] Direct Biomaze status:', postRes.status);
      const postData = await postRes.json();
      console.log('📡 [RankEstimate] Direct Biomaze response:', JSON.stringify(postData, null, 2));

      if (postRes.status === 429) {
        throw new Error('تعداد درخواست‌ها بیش از حد مجاز است. لطفاً چند ثانیه صبر کنید.');
      }

      if (postRes.ok && postData?.data) {
        resultCache.set(cacheKey, postData.data);
        return postData.data;
      }

      if (postRes.status >= 400 && postRes.status < 500) {
        const directMsg = postData?.message || JSON.stringify(postData);
        throw new Error(`اطلاعات واردشده معتبر نیست (${directMsg})`);
      }
    } catch (directError: any) {
      console.log('❌ [RankEstimate] Direct fallback error:', directError);
      if (directError?.message?.includes('تعداد درخواست') || directError?.message?.includes('معتبر نیست')) {
        throw directError;
      }
    }

    throw new Error('ارتباط با سرور برقرار نشد، لطفاً اینترنت خود را بررسی و دوباره تلاش کنید.');
  },
};
