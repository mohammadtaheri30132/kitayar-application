import { Platform } from 'react-native';
import { api } from '../../api/axiosConfig';

export interface QuestionOption {
  id: string;
  label: string;
  isCorrect?: boolean;
  points?: number;
  nextQuestionId?: string; // target questionId, or 'END_FORM', or undefined/'NEXT'
}

export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'email'
  | 'phone'
  | 'url'
  | 'date'
  | 'time'
  | 'single_choice'
  | 'multiple_choice'
  | 'dropdown'
  | 'yes_no'
  | 'true_false'
  | 'rating_stars'
  | 'rating_number'
  | 'likert'
  | 'ranking'
  | 'quiz_single'
  | 'quiz_multiple'
  | 'quiz_short_answer'
  | 'matching'
  | 'file_upload'
  | 'image_upload'
  | 'audio_record'
  | 'audio_upload';

export interface QuestionItem {
  id: string;
  sectionId?: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  order: number;
  options?: QuestionOption[];
  allowOther?: boolean;
  minSelections?: number;
  maxSelections?: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
  allowedMediaTypes?: string[];
  maxFileSizeMb?: number;
  maxFilesCount?: number;
  points?: number;
  explanation?: string;
  correctAnswerText?: string;
  promptImageUrl?: string;
  promptAudioUrl?: string;
  allowImageAttachment?: boolean;
  allowAudioAttachment?: boolean;
}

export interface LogicRuleItem {
  id: string;
  sourceQuestionId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: any;
  action: 'show_question' | 'hide_question' | 'skip_to_section' | 'end_form';
  targetId?: string;
}

export interface FormThemeConfig {
  primaryColor: string;
  backgroundColor: string;
  mode: 'conversational' | 'traditional';
  welcomeTitle?: string;
  welcomeDescription?: string;
  completionTitle?: string;
  completionMessage?: string;
  showProgressBar?: boolean;
}

export interface FormSettingsConfig {
  accessType: 'public' | 'authenticated' | 'class_members';
  classId?: string;
  limitOnePerDevice: boolean;
  limitOnePerAccount: boolean;
  maxResponses?: number;
  password?: string;
  startDate?: string;
  endDate?: string;
  isQuiz: boolean;
  passingScore?: number;
  showScoreToRespondent: boolean;
  showCorrectAnswers: 'never' | 'after_submission' | 'after_close';
  allowPartialSave: boolean;
  allowMultipleSubmissions: boolean;
}

export interface FormDataModel {
  _id: string;
  teacher: string;
  title: string;
  description?: string;
  category: string;
  formType: string;
  status: 'draft' | 'published' | 'closed' | 'archived' | 'scheduled';
  publicSlug: string;
  coverImage?: string;
  theme: FormThemeConfig;
  settings: FormSettingsConfig;
  sections: any[];
  questions: QuestionItem[];
  logicRules: LogicRuleItem[];
  responseCount: number;
  publishedAt?: string;
  lastSubmittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormTemplateItem {
  id: string;
  title: string;
  description: string;
  category: string;
  formType: string;
  theme: FormThemeConfig;
  settings: FormSettingsConfig;
  questions: QuestionItem[];
}

export interface FormAnalyticsResult {
  totalSubmissions: number;
  completedCount: number;
  completionRate: number;
  avgDurationSeconds: number;
  averageQuizScore: number;
  questionAnalytics: {
    questionId: string;
    title: string;
    type: string;
    answeredCount: number;
    skippedCount: number;
    optionBreakdown: { label: string; count: number; percentage: number }[];
    numericStats: { min: number; max: number; avg: number };
    textSamples: string[];
    quizCorrectRate: number;
  }[];
}

export const formService = {
  // Get teacher's forms list
  getForms: async (params?: { status?: string; formType?: string; search?: string; sort?: string }): Promise<FormDataModel[]> => {
    const res = await api.get('/teacher/forms', { params });
    return res.data?.data || [];
  },

  // Get templates
  getTemplates: async (): Promise<FormTemplateItem[]> => {
    const res = await api.get('/teacher/forms/templates');
    return res.data?.data || [];
  },

  // Create new form
  createForm: async (data: Partial<FormDataModel> & { templateId?: string }): Promise<FormDataModel> => {
    const res = await api.post('/teacher/forms', data);
    return res.data?.data;
  },

  // Get single form by ID
  getFormById: async (formId: string): Promise<FormDataModel> => {
    const res = await api.get(`/teacher/forms/${formId}`);
    return res.data?.data;
  },

  // Update form
  updateForm: async (formId: string, data: Partial<FormDataModel>): Promise<FormDataModel> => {
    const res = await api.put(`/teacher/forms/${formId}`, data);
    return res.data?.data;
  },

  // Duplicate form
  duplicateForm: async (formId: string): Promise<FormDataModel> => {
    const res = await api.post(`/teacher/forms/${formId}/duplicate`);
    return res.data?.data;
  },

  // Update status (publish, draft, close)
  updateStatus: async (formId: string, status: 'draft' | 'published' | 'closed' | 'archived'): Promise<FormDataModel> => {
    const res = await api.post(`/teacher/forms/${formId}/status`, { status });
    return res.data?.data;
  },

  // Delete form
  deleteForm: async (formId: string): Promise<void> => {
    await api.delete(`/teacher/forms/${formId}`);
  },

  // Get responses
  getResponses: async (formId: string, params?: { status?: string; search?: string; page?: number; limit?: number }) => {
    const res = await api.get(`/teacher/forms/${formId}/responses`, { params });
    return res.data;
  },

  // Get response details
  getResponseById: async (formId: string, responseId: string) => {
    const res = await api.get(`/teacher/forms/${formId}/responses/${responseId}`);
    return res.data;
  },

  // Grade response
  gradeResponse: async (formId: string, responseId: string, grades: any[], teacherNotes?: string) => {
    const res = await api.put(`/teacher/forms/${formId}/responses/${responseId}/grade`, { grades, teacherNotes });
    return res.data?.data;
  },

  // Get analytics
  getAnalytics: async (formId: string): Promise<FormAnalyticsResult> => {
    const res = await api.get(`/teacher/forms/${formId}/analytics`);
    return res.data?.data;
  },

  // Upload media (cover image, audio, etc.)
  uploadMedia: async (fileUri: string, fileName: string, mimeType: string = 'image/jpeg'): Promise<string> => {
    const normalizedUri =
      Platform.OS === 'android' && !fileUri.startsWith('file://') && !fileUri.startsWith('content://')
        ? `file://${fileUri}`
        : fileUri;

    const formData = new FormData();
    formData.append('file', {
      uri: normalizedUri,
      name: fileName,
      type: mimeType,
    } as any);

    const res = await api.post('/teacher/forms/upload-media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return res.data?.url;
  },

  // Generate public form URL
  getPublicFormUrl: (publicSlug: string): string => {
    const baseURL = api.defaults.baseURL || 'http://192.168.1.128:5001/api';
    const webBase = baseURL.replace('/api', '');
    return `${webBase}/forms/${publicSlug}`;
  },
};
