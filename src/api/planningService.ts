import { api } from './axiosConfig';

export interface TeacherEvent {
  _id?: string;
  type: 'general' | 'meeting' | 'exam' | 'workshop' | 'personal' | 'school_event' | 'other';
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  schoolId?: string;
  classId?: string;
  location?: string;
  description?: string;
  color?: string;
}

export interface TeacherTask {
  _id?: string;
  title: string;
  description?: string;
  dueDate?: string;
  time?: string;
  category?: string;
  priority: 'normal' | 'important' | 'urgent';
  status: 'pending' | 'completed';
  forWhere?: string;
  forWhom?: string;
}

export interface DailyNote {
  _id?: string;
  date: string;
  title?: string;
  content: string;
  color?: string;
}

export interface Announcement {
  _id: string;
  title: string;
  shortMessage: string;
  description?: string;
  startDate: string;
  endDate: string;
  priority: 'low' | 'normal' | 'high';
  active: boolean;
}

export interface HomeworkItem {
  _id?: string;
  title: string;
  isDone?: boolean;
}

export interface StudentSubmission {
  studentPhone: string;
  studentName?: string;
  status: 'PENDING' | 'SUBMITTED' | 'DONE' | 'NOT_DONE' | 'APPROVED' | 'REJECTED' | 'GRADED';
  note?: string;
  studentText?: string;
  images?: string[];
  voiceUrl?: string;
  voiceDuration?: number;
  submittedAt?: string;
  teacherFeedback?: string;
  score?: number;
  recordInGradebook?: boolean;
  reviewedAt?: string;
  updatedAt?: string;
}

export interface Homework {
  _id: string;
  teacherId: string;
  classId: any;
  subject: string;
  title: string;
  description?: string;
  items: HomeworkItem[];
  assignedDate: string;
  dueDate: string;
  dueDateJalali: string;
  isForAllStudents: boolean;
  targetStudentPhones: string[];
  studentSubmissions: StudentSubmission[];
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export const PlanningService = {
  getEvents: async (startDate?: string, endDate?: string): Promise<{ success: boolean, data: TeacherEvent[] }> => {
    try {
      const response = await api.get('/teacher/events', { params: { startDate, endDate } });
      return response.data;
    } catch (error) {
      console.warn('API getEvents failed');
      throw error;
    }
  },

  createEvent: async (eventData: Partial<TeacherEvent>): Promise<{ success: boolean, data: TeacherEvent }> => {
    try {
      const response = await api.post('/teacher/events', eventData);
      return response.data;
    } catch (error) {
      console.warn('API createEvent failed');
      throw error;
    }
  },

  getSystemEvents: async (startDate?: string, endDate?: string): Promise<{ success: boolean, data: any[] }> => {
    try {
      const response = await api.get('/teacher/system-events', { params: { startDate, endDate } });
      return response.data;
    } catch (error) {
      console.warn('API getSystemEvents failed');
      throw error;
    }
  },

  getAnnouncements: async (date: string): Promise<{ success: boolean, data: Announcement[] }> => {
    try {
      const response = await api.get('/teacher/announcements/active', { params: { date } });
      return response.data;
    } catch (error) {
      console.warn('API getAnnouncements failed');
      throw error;
    }
  },

  dismissAnnouncement: async (id: string): Promise<{ success: boolean }> => {
    try {
      const response = await api.post(`/teacher/announcements/${id}/dismiss`);
      return response.data;
    } catch (error) {
      console.warn('API dismissAnnouncement failed');
      throw error;
    }
  },

  getTasks: async (status?: string, dueDate?: string): Promise<{ success: boolean, data: TeacherTask[] }> => {
    try {
      const response = await api.get('/teacher/tasks', { params: { status, dueDate } });
      return response.data;
    } catch (error) {
      console.warn('API getTasks failed');
      throw error;
    }
  },

  createTask: async (taskData: Partial<TeacherTask>): Promise<{ success: boolean, data: TeacherTask }> => {
    try {
      const response = await api.post('/teacher/tasks', taskData);
      return response.data;
    } catch (error) {
      console.warn('API createTask failed');
      throw error;
    }
  },

  updateTask: async (id: string, taskData: Partial<TeacherTask>): Promise<{ success: boolean, data: TeacherTask }> => {
    try {
      const response = await api.put(`/teacher/tasks/${id}`, taskData);
      return response.data;
    } catch (error) {
      console.warn('API updateTask failed');
      throw error;
    }
  },

  getNotes: async (date?: string, classId?: string): Promise<{ success: boolean, data: DailyNote[] }> => {
    try {
      const response = await api.get('/teacher/notes', { params: { date, classId } });
      return response.data;
    } catch (error) {
      console.warn('API getNotes failed');
      throw error;
    }
  },

  createNote: async (noteData: Partial<DailyNote>): Promise<{ success: boolean, data: DailyNote }> => {
    try {
      const response = await api.post('/teacher/notes', noteData);
      return response.data;
    } catch (error) {
      console.warn('API createNote failed');
      throw error;
    }
  },

  updateNote: async (id: string, noteData: Partial<DailyNote>): Promise<{ success: boolean, data: DailyNote }> => {
    try {
      const response = await api.put(`/teacher/notes/${id}`, noteData);
      return response.data;
    } catch (error) {
      console.warn('API updateNote failed');
      throw error;
    }
  },

  deleteNote: async (id: string): Promise<{ success: boolean }> => {
    try {
      const response = await api.delete(`/teacher/notes/${id}`);
      return response.data;
    } catch (error) {
      console.warn('API deleteNote failed');
      throw error;
    }
  },



  getSchedule: async (): Promise<{ success: boolean, data: any[] }> => {
    try {
      const response = await api.get('/teacher/schedule');
      return response.data;
    } catch (error) {
      console.warn('API getSchedule failed');
      throw error;
    }
  },

  createSchedule: async (scheduleData: any): Promise<{ success: boolean, data: any }> => {
    try {
      const response = await api.post('/teacher/schedule', scheduleData);
      return response.data;
    } catch (error) {
      console.warn('API createSchedule failed');
      throw error;
    }
  },

  getSchools: async (): Promise<{ success: boolean, data: any[] }> => {
    try {
      const response = await api.get('/teacher/schools');
      return response.data;
    } catch (error) {
      console.warn('API getSchools failed');
      throw error;
    }
  },

  getClasses: async (): Promise<{ success: boolean, data: any[] }> => {
    try {
      const response = await api.get('/teacher/classrooms');
      return response.data;
    } catch (error) {
      console.warn('API getClasses failed');
      throw error;
    }
  },



  // --- Homework Management API ---
  getHomeworks: async (params?: { classId?: string; dueDate?: string; dueDateJalali?: string; studentPhone?: string }): Promise<{ success: boolean; data: Homework[] }> => {
    try {
      const response = await api.get('/teacher/homeworks', { params });
      return response.data;
    } catch (error) {
      console.warn('API getHomeworks failed');
      throw error;
    }
  },

  getHomeworkById: async (id: string): Promise<{ success: boolean; data: Homework }> => {
    try {
      const response = await api.get(`/teacher/homeworks/${id}`);
      return response.data;
    } catch (error) {
      console.warn('API getHomeworkById failed');
      throw error;
    }
  },

  createHomework: async (data: any): Promise<{ success: boolean; data: Homework }> => {
    try {
      const response = await api.post('/teacher/homeworks', data);
      return response.data;
    } catch (error) {
      console.warn('API createHomework failed');
      throw error;
    }
  },

  updateHomework: async (id: string, data: any): Promise<{ success: boolean; data: Homework }> => {
    try {
      const response = await api.put(`/teacher/homeworks/${id}`, data);
      return response.data;
    } catch (error) {
      console.warn('API updateHomework failed');
      throw error;
    }
  },

  deleteHomework: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.delete(`/teacher/homeworks/${id}`);
      return response.data;
    } catch (error) {
      console.warn('API deleteHomework failed');
      throw error;
    }
  },

  updateStudentHomeworkStatus: async (
    id: string,
    phone: string,
    status: 'DONE' | 'NOT_DONE' | 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'GRADED',
    note?: string
  ): Promise<{ success: boolean; data: Homework }> => {
    try {
      const response = await api.patch(`/teacher/homeworks/${id}/students/${phone}/status`, { status, note });
      return response.data;
    } catch (error) {
      console.warn('API updateStudentHomeworkStatus failed');
      throw error;
    }
  },

  reviewStudentHomework: async (
    id: string,
    phone: string,
    payload: {
      status: 'APPROVED' | 'GRADED' | 'REJECTED' | 'DONE' | 'NOT_DONE';
      teacherFeedback?: string;
      score?: number;
      recordInGradebook?: boolean;
    }
  ): Promise<{ success: boolean; data: Homework; message?: string }> => {
    try {
      const response = await api.post(`/teacher/homeworks/${id}/students/${phone}/review`, payload);
      return response.data;
    } catch (error) {
      console.warn('API reviewStudentHomework failed');
      throw error;
    }
  }
};
