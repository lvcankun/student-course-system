import { api } from './api';
import type {
  User,
  Course,
  SelectionRecord,
  PaginatedResponse,
  LoginParams,
  CourseFilterParams,
  ValidationResult,
  QueueStatus,
} from '@/types';

export { api };

export const authApi = {
  login: (params: LoginParams) =>
    api.post<{ token: string; user: User }>('/auth/login', params),

  logout: () => api.post<void>('/auth/logout'),

  getCurrentUser: () => api.get<User>('/auth/me'),

  refreshToken: () => api.post<{ token: string }>('/auth/refresh'),
};

export const courseApi = {
  getCourseList: (params: CourseFilterParams) =>
    api.get<PaginatedResponse<Course>>('/courses', params as unknown as Record<string, unknown>),

  getCourseDetail: (id: string) =>
    api.get<Course>(`/courses/${id}`),

  getCategories: () =>
    api.get<string[]>('/courses/categories'),

  getDepartments: () =>
    api.get<string[]>('/courses/departments'),
};

export const selectionApi = {
  getMySelections: () =>
    api.get<SelectionRecord[]>('/selection/my'),

  selectCourse: (courseId: string) =>
    api.post<{ recordId: string; status: string }>('/selection', { courseId }),

  cancelSelection: (recordId: string) =>
    api.delete<void>(`/selection/${recordId}`),

  validateSelection: (courseId: string) =>
    api.get<ValidationResult>('/selection/validate', { courseId }),

  getQueueStatus: (courseId: string) =>
    api.get<QueueStatus>('/queue/status', { courseId }),
};

export const statisticsApi = {
  getSelectionStats: () =>
    api.get<{
      totalCourses: number;
      selectedCourses: number;
      totalCredits: number;
      remainingCredits: number;
    }>('/statistics/selection'),
};

export const teacherApi = {
  getCourses: (params: { page: number; pageSize: number; keyword: string; status?: string }) =>
    api.get<PaginatedResponse<Course>>('/teacher/courses', params as unknown as Record<string, unknown>),

  createCourse: (data: Partial<Course>) =>
    api.post<Course>('/teacher/courses', data),

  updateCourse: (id: string, data: Partial<Course>) =>
    api.put<Course>(`/teacher/courses/${id}`, data),

  deleteCourse: (id: string) =>
    api.delete<void>(`/teacher/courses/${id}`),

  submitCourse: (id: string) =>
    api.put<Course>(`/teacher/courses/${id}/submit`),

  getStudents: (params: { page: number; pageSize: number; keyword: string }) =>
    api.get<PaginatedResponse<any>>('/teacher/students', params as unknown as Record<string, unknown>),

  getSchedule: () =>
    api.get<any[]>('/teacher/schedule'),
};
