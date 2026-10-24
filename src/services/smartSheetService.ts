import { NativeModules, Platform } from 'react-native';
import { api } from '../api/axiosConfig';
import FilePickerModule from '../native/FilePicker';
import { scannerService } from './scanner/scannerService';

const { SmartSheetModule, FileShareModule } = NativeModules;

export interface SmartExamStudent {
  studentPhone: string;
  studentName: string;
  sheetCode?: string;
  status?: 'PENDING' | 'GRADED';
}

export interface SmartExamConfig {
  examId?: string;
  classId: string;
  className?: string;
  schoolName?: string;
  examTitle: string;
  subject: string;
  examDate?: string;
  totalQuestions: number;
  optionsPerQuestion: number;
  pointsPerQuestion: number;
  negativeMarking: boolean;
  negativeFactor: number;
  maxScore: number;
  templateId?: 'MODEL_1' | 'MODEL_2' | 'MODEL_3';
  optionLabelType?: 'ALPHABETIC' | 'NUMERIC';
  answerKey: number[];
  selectedStudents: SmartExamStudent[];
}

export interface OmrRecognizedAnswer {
  questionNumber: number;
  selectedOption: number; // 0 = blank, 1..optionsCount, -1 = multiple/invalid
  confidence: number;
  isAmbiguous: boolean;
  isMultiple: boolean;
  isBlank: boolean;
  isCorrect?: boolean;
  earnedScore?: number;
}

export interface OmrScanResult {
  qrFound: boolean;
  sheetCode: string | null;
  answers: OmrRecognizedAnswer[];
  annotatedImageUri: string;
  totalQuestions: number;
  markedCount: number;
  blankCount: number;
  ambiguousCount: number;
  templateId?: string;
  optionLabelType?: 'ALPHABETIC' | 'NUMERIC';
}

export interface LookupSheetResult {
  sheetId: string;
  sheetCode: string;
  studentName: string;
  studentPhone: string;
  className: string;
  classId: string;
  examId?: string;
  examTitle: string;
  subject: string;
  examDate?: string;
  totalQuestions: number;
  optionsPerQuestion: number;
  pointsPerQuestion: number;
  negativeMarking: boolean;
  negativeFactor: number;
  maxScore: number;
  templateId?: 'MODEL_1' | 'MODEL_2' | 'MODEL_3';
  optionLabelType?: 'ALPHABETIC' | 'NUMERIC';
  answerKey: number[];
  status: 'PENDING' | 'GRADED';
  gradingMethod?: 'AUTOMATIC' | 'MANUAL';
  existingAnswers?: OmrRecognizedAnswer[];
  existingScore?: number;
}

class SmartSheetService {
  /**
   * تولید آزمون تستی در بک‌اند
   */
  async createSmartExam(data: Partial<SmartExamConfig>) {
    const res = await api.post('/teacher/smart-sheets/exams', data);
    return res.data;
  }

  /**
   * صدور و ثبت کدهای یکتای پاسخ‌برگ برای دانش‌آموزان در بک‌اند
   */
  async generateSheetsInBackend(config: SmartExamConfig) {
    const res = await api.post('/teacher/smart-sheets/generate', config);
    return res.data;
  }

  /**
   * تولید فایل PDF جامع پاسخ‌برگ‌های شخصی‌سازی شده توسط ماژول بومی کاتلین
   */
  async generatePdf(config: {
    examTitle: string;
    subject: string;
    className: string;
    schoolName?: string;
    examDate?: string;
    totalQuestions: number;
    optionsCount: number;
    templateId?: 'MODEL_1' | 'MODEL_2' | 'MODEL_3';
    optionLabelType?: 'ALPHABETIC' | 'NUMERIC';
    students: { studentName: string; sheetCode: string }[];
  }): Promise<{ uri: string; fileName: string; pageCount: number; fileSize: number }> {
    if (Platform.OS !== 'android' || !SmartSheetModule) {
      throw new Error('ماژول تولید پاسخ‌برگ در دسترس نیست');
    }
    return await SmartSheetModule.generateExamSheetsPdf(config);
  }

  /**
   * اشتراک‌گذاری یا چاپ PDF با FileShareModule
   */
  async sharePdf(pdfUri: string) {
    if (FileShareModule && FileShareModule.shareFile) {
      return await FileShareModule.shareFile(pdfUri, 'application/pdf');
    }
  }

  /**
   * انتخاب عکس برگه از گالری (استفاده مجدد از کتابخانه اسکنر)
   */
  async pickImageFromGallery(): Promise<string | null> {
    try {
      const picked = await FilePickerModule.pickImage();
      if (!picked) return null;
      if (Array.isArray(picked)) {
        return picked.length > 0 ? String(picked[0]) : null;
      }
      if (typeof picked === 'string') {
        return picked;
      }
      if (typeof picked === 'object') {
        return picked.uri || picked.path || (Array.isArray(picked.uris) ? picked.uris[0] : null);
      }
      return null;
    } catch (e: any) {
      if (e?.code === 'CANCELLED' || e?.message?.includes('لغو')) {
        return null; // کاربر انتخاب را لغو کرده است
      }
      throw e;
    }
  }

  /**
   * ثبت عکس با دوربین (استفاده مجدد از ماژول اسکنر)
   */
  async capturePhotoWithCamera(): Promise<string> {
    const result = await scannerService.captureCameraPhoto();
    return result.uri;
  }

  /**
   * پردازش OMR بومی کاتلین با OpenCV و خواندن بارکد/QR
   */
  async recognizeSheet(options: {
    imageUri: string;
    totalQuestions: number;
    optionsCount: number;
    expectedSheetCode?: string;
    templateId?: 'MODEL_1' | 'MODEL_2' | 'MODEL_3';
    optionLabelType?: 'ALPHABETIC' | 'NUMERIC';
  }): Promise<OmrScanResult> {
    if (Platform.OS !== 'android' || !SmartSheetModule) {
      throw new Error('ماژول تصحیح هوشمند پاسخ‌برگ فقط در اندروید در دسترس است');
    }
    return await SmartSheetModule.scanAndRecognizeSheet(options);
  }

  /**
   * استعلام مشخصات برگه و دانش‌آموز با کد برگه
   */
  async lookupSheetByCode(code: string): Promise<LookupSheetResult> {
    const res = await api.get('/teacher/smart-sheets/lookup', {
      params: { code: code.trim().toUpperCase() },
    });
    return res.data.data;
  }

  /**
   * ثبت و محاسبه نهایی نمره در بک‌اند
   */
  async gradeSheet(payload: {
    sheetCode: string;
    answers: OmrRecognizedAnswer[];
    gradingMethod: 'AUTOMATIC' | 'MANUAL';
    recordInGradebook?: boolean;
    customScore?: number;
  }) {
    const res = await api.post('/teacher/smart-sheets/grade', payload);
    return res.data;
  }

  /**
   * دریافت پاسخ‌برگ‌های یک آزمون
   */
  async getExamSheets(examId: string, classId?: string) {
    const res = await api.get(`/teacher/smart-sheets/exams/${examId}/sheets`, {
      params: { classId },
    });
    return res.data.data;
  }

  /**
   * محاسبه محلی نمره بر اساس کلید و فرمول نمره‌دهی
   */
  calculateScoreLocally(
    answers: OmrRecognizedAnswer[],
    answerKey: number[],
    totalQuestions: number,
    pointsPerQuestion: number,
    negativeMarking: boolean,
    negativeFactor: number,
    maxScore: number
  ) {
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let ambiguousCount = 0;

    const evaluated = answers.map((ans) => {
      const q = ans.questionNumber;
      const correctOpt = answerKey[q - 1];
      const isBlank = ans.selectedOption === 0 || ans.isBlank;
      const isMultiple = ans.selectedOption === -1 || ans.isMultiple;

      let isCorrect = false;
      let earnedScore = 0;

      if (isBlank) {
        unansweredCount++;
        earnedScore = 0;
      } else if (isMultiple) {
        incorrectCount++;
        isCorrect = false;
        earnedScore = negativeMarking ? -(pointsPerQuestion * negativeFactor) : 0;
      } else if (correctOpt && ans.selectedOption === correctOpt) {
        correctCount++;
        isCorrect = true;
        earnedScore = pointsPerQuestion;
      } else {
        incorrectCount++;
        isCorrect = false;
        earnedScore = negativeMarking ? -(pointsPerQuestion * negativeFactor) : 0;
      }

      if (ans.isAmbiguous) {
        ambiguousCount++;
      }

      return {
        ...ans,
        isCorrect,
        earnedScore,
      };
    });

    const rawScore = evaluated.reduce((sum, a) => sum + (a.earnedScore || 0), 0);
    const finalScore = Number(Math.max(0, Math.min(maxScore, rawScore)).toFixed(2));

    return {
      evaluated,
      correctCount,
      incorrectCount,
      unansweredCount,
      ambiguousCount,
      rawScore: Number(rawScore.toFixed(2)),
      finalScore,
      maxScore,
    };
  }
}

export const smartSheetService = new SmartSheetService();
