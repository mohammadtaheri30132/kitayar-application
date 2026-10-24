import { api } from '../api/axiosConfig';

export interface ClassMessageItem {
  _id: string;
  classId: string;
  senderId: string;
  senderRole: 'teacher' | 'student';
  senderName: string;
  senderPhone?: string;
  recipientScope: 'ALL' | 'STUDENT';
  targetStudentPhone?: string;
  targetStudentName?: string;
  messageType: 'VOICE' | 'IMAGE' | 'TEXT';
  mediaUrl?: string;
  voiceDuration?: number;
  fileSize?: number;
  caption?: string;
  createdAt: string;
}

export const chatService = {
  // آپلود فایل مدیا (ویس یا عکس فشرده WebP)
  uploadMedia: async (fileUri: string, fileName: string, mimeType: string): Promise<string> => {
    const normalizedUri = fileUri.startsWith('file://') ? fileUri : `file://${fileUri}`;
    const formData = new FormData();
    formData.append('file', {
      uri: normalizedUri,
      name: fileName,
      type: mimeType,
    } as any);

    const res = await api.post('/chat/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (res.data?.success && res.data?.data?.url) {
      return res.data.data.url;
    }
    throw new Error(res.data?.message || 'خطا در آپلود فایل');
  },

  // دریافت پیام‌های کلاس
  getMessages: async (classId: string, targetStudentPhone?: string): Promise<ClassMessageItem[]> => {
    const params: any = {};
    if (targetStudentPhone) {
      params.targetStudentPhone = targetStudentPhone;
    }
    const res = await api.get(`/chat/classrooms/${classId}/messages`, { params });
    if (res.data?.success) {
      return res.data.data || [];
    }
    return [];
  },

  // ارسال پیام (صوت، تصویر WebP یا متن)
  sendMessage: async (
    classId: string,
    payload: {
      messageType: 'VOICE' | 'IMAGE' | 'TEXT';
      mediaUrl?: string;
      voiceDuration?: number;
      fileSize?: number;
      caption?: string;
      recipientScope: 'ALL' | 'STUDENT';
      targetStudentPhone?: string;
      targetStudentName?: string;
    }
  ): Promise<ClassMessageItem> => {
    const res = await api.post(`/chat/classrooms/${classId}/messages`, payload);
    if (res.data?.success) {
      return res.data.data;
    }
    throw new Error(res.data?.message || 'خطا در ارسال پیام');
  },

  // حذف پیام
  deleteMessage: async (classId: string, messageId: string): Promise<void> => {
    await api.delete(`/chat/classrooms/${classId}/messages/${messageId}`);
  },
};
