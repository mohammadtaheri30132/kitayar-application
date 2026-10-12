import { Platform } from 'react-native';
import { api } from '../../api/axiosConfig';

export interface CommunityAuthor {
  _id: string;
  name: string;
  avatar?: string;
  role?: string;
}

export interface CommunityCategoryItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  order: number;
  questionCount: number;
  isActive: boolean;
}

export interface CommunityQuestionItem {
  _id: string;
  author: CommunityAuthor;
  title: string;
  body: string;
  category?: {
    _id: string;
    name: string;
    slug: string;
    color?: string;
  } | null;
  tags?: string[];
  attachments?: string[];
  answerCount: number;
  viewCount: number;
  likeCount: number;
  isLiked?: boolean;
  isResolved: boolean;
  acceptedAnswer?: string | null;
  isPinned: boolean;
  status: 'active' | 'pending_review' | 'hidden' | 'deleted';
  moderationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityAnswerItem {
  _id: string;
  question: string;
  author: CommunityAuthor;
  body: string;
  attachments?: string[];
  isAccepted: boolean;
  likeCount: number;
  isLiked?: boolean;
  status: 'active' | 'pending_review' | 'hidden' | 'deleted';
  moderationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityPostItem {
  _id: string;
  author: CommunityAuthor;
  content: string;
  images?: string[];
  attachments?: string[];
  tags?: string[];
  likeCount: number;
  isLiked?: boolean;
  commentCount: number;
  isSaved?: boolean;
  isPinned: boolean;
  status: 'active' | 'hidden' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

export interface CommunityCommentItem {
  _id: string;
  post: string;
  author: CommunityAuthor;
  content: string;
  replyTo?: {
    _id: string;
    name: string;
  } | null;
  status: 'active' | 'hidden' | 'deleted';
  createdAt: string;
}

export interface QuestionFilterParams {
  category?: string;
  status?: string;
  sort?: 'latest' | 'most_answered';
  search?: string;
  page?: number;
  limit?: number;
}

export interface PostFilterParams {
  sort?: 'latest' | 'most_liked' | 'most_commented';
  search?: string;
  page?: number;
  limit?: number;
}

export const communityService = {
  // Categories
  getCategories: async (): Promise<CommunityCategoryItem[]> => {
    const res = await api.get('/teacher/community/categories');
    return res.data?.data || [];
  },

  // Questions
  getQuestions: async (params?: QuestionFilterParams): Promise<{ questions: CommunityQuestionItem[]; pagination: any }> => {
    const res = await api.get('/teacher/community/questions', { params });
    return {
      questions: res.data?.data || [],
      pagination: res.data?.pagination || {},
    };
  },

  getMyQuestions: async (params?: { page?: number; limit?: number }): Promise<{ questions: CommunityQuestionItem[]; pagination: any }> => {
    const res = await api.get('/teacher/community/my-questions', { params });
    return {
      questions: res.data?.data || [],
      pagination: res.data?.pagination || {},
    };
  },

  getQuestionById: async (id: string): Promise<{ question: CommunityQuestionItem; answers: CommunityAnswerItem[] }> => {
    const res = await api.get(`/teacher/community/questions/${id}`);
    const raw = res.data?.data;
    const question = raw?.question || raw;
    const answers = raw?.answers || [];
    return {
      question,
      answers,
    };
  },

  createQuestion: async (data: {
    title: string;
    body: string;
    category: string;
    tags?: string[];
    attachments?: string[];
    isAnonymous?: boolean;
  }): Promise<{ question: CommunityQuestionItem; message: string; isPending: boolean }> => {
    const res = await api.post('/teacher/community/questions', data);
    return {
      question: res.data?.data,
      message: res.data?.message || 'پرسش شما با موفقیت ثبت شد',
      isPending: res.data?.data?.status === 'pending_review',
    };
  },

  deleteQuestion: async (id: string): Promise<void> => {
    await api.delete(`/teacher/community/questions/${id}`);
  },

  toggleLikeQuestion: async (id: string): Promise<{ liked: boolean; likeCount: number }> => {
    const res = await api.post(`/teacher/community/questions/${id}/like`);
    return res.data?.data;
  },

  // Answers
  createAnswer: async (questionId: string, data: { body: string; attachments?: string[] }): Promise<{ answer: CommunityAnswerItem; message: string; isPending: boolean }> => {
    const res = await api.post(`/teacher/community/questions/${questionId}/answers`, data);
    return {
      answer: res.data?.data,
      message: res.data?.message || 'پاسخ شما با موفقیت ثبت شد',
      isPending: res.data?.data?.status === 'pending_review',
    };
  },

  deleteAnswer: async (answerId: string): Promise<void> => {
    await api.delete(`/teacher/community/answers/${answerId}`);
  },

  toggleLikeAnswer: async (answerId: string): Promise<{ liked: boolean; likeCount: number }> => {
    const res = await api.post(`/teacher/community/answers/${answerId}/like`);
    return res.data?.data;
  },

  acceptAnswer: async (questionId: string, answerId: string): Promise<{ isAccepted: boolean; isResolved: boolean }> => {
    const res = await api.post(`/teacher/community/questions/${questionId}/answers/${answerId}/accept`);
    return res.data?.data;
  },

  // Posts
  getPosts: async (params?: PostFilterParams): Promise<{ posts: CommunityPostItem[]; pagination: any }> => {
    const res = await api.get('/teacher/community/posts', { params });
    return {
      posts: res.data?.data || [],
      pagination: res.data?.pagination || {},
    };
  },

  getPostById: async (id: string): Promise<{ post: CommunityPostItem; comments: CommunityCommentItem[] }> => {
    const res = await api.get(`/teacher/community/posts/${id}`);
    return {
      post: res.data?.data?.post,
      comments: res.data?.data?.comments || [],
    };
  },

  createPost: async (data: {
    content: string;
    images?: string[];
    attachments?: string[];
    tags?: string[];
  }): Promise<CommunityPostItem> => {
    const res = await api.post('/teacher/community/posts', data);
    return res.data?.data;
  },

  deletePost: async (id: string): Promise<void> => {
    await api.delete(`/teacher/community/posts/${id}`);
  },

  toggleLikePost: async (id: string): Promise<{ liked: boolean; likeCount: number }> => {
    const res = await api.post(`/teacher/community/posts/${id}/like`);
    return res.data?.data;
  },

  toggleBookmarkPost: async (id: string): Promise<{ saved: boolean }> => {
    const res = await api.post(`/teacher/community/posts/${id}/bookmark`);
    return res.data?.data;
  },

  // Comments
  createComment: async (postId: string, data: { content: string; replyTo?: string }): Promise<CommunityCommentItem> => {
    const res = await api.post(`/teacher/community/posts/${postId}/comments`, data);
    return res.data?.data;
  },

  deleteComment: async (commentId: string): Promise<void> => {
    await api.delete(`/teacher/community/comments/${commentId}`);
  },

  // Reporting
  reportContent: async (data: {
    targetType: 'question' | 'answer' | 'post' | 'comment';
    targetId: string;
    reason: string;
    description?: string;
  }): Promise<void> => {
    await api.post('/teacher/community/report', data);
  },

  // Upload attachment (image or document)
  uploadAttachment: async (fileUri: string, fileName: string, mimeType: string = 'image/jpeg'): Promise<string> => {
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

    const res = await api.post('/teacher/community/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return res.data?.url;
  },
};
