import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { message, notification } from 'antd';
import type { ApiResponse } from '@/types';
import { mockApi } from '@/mock';

const USE_MOCK = false;

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求重试配置
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    // 添加请求时间戳，防止缓存
    config.params = {
      ...config.params,
      _t: Date.now(),
    };
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// 响应拦截器，添加重试机制
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    const { data } = response;
    if (data.code === 0 || data.code === 200) return response;
    message.error(data.message || '请求失败');
    return Promise.reject(new Error(data.message || '请求失败'));
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: number };
    
    // 检查是否应该重试
    if (error.code === 'ECONNABORTED' || error.response?.status === 500 || error.response?.status === 502 || error.response?.status === 503 || error.response?.status === 504) {
      if (!originalRequest._retry) {
        originalRequest._retry = 0;
      }
      if (originalRequest._retry < MAX_RETRIES) {
        originalRequest._retry += 1;
        // 指数退避策略
        const delay = RETRY_DELAY * Math.pow(2, originalRequest._retry - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return request(originalRequest);
      }
    }

    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          message.error('登录已过期，请重新登录');
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403: message.error('没有权限访问'); break;
        case 429: 
          message.error('系统繁忙，请稍后再试');
          notification.warning({
            message: '操作过于频繁',
            description: '请稍后再试，系统正在处理您的请求',
            duration: 5,
          });
          break;
        case 500: 
          message.error('服务器错误，请稍后再试');
          notification.warning({
            message: '服务器繁忙',
            description: '系统正在处理大量请求，请稍后再试',
            duration: 3,
          });
          break;
        default: message.error(data?.message || '请求失败');
      }
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请检查网络');
      notification.warning({
        message: '网络不稳定',
        description: '请检查网络连接后重试',
        duration: 3,
      });
    } else {
      message.error('网络错误，请检查网络连接');
    }
    return Promise.reject(error);
  }
);

const mockRequest = async <T>(mockFn: () => Promise<ApiResponse<T>>): Promise<T> => {
  const response = await mockFn();
  if (response.code !== 0 && response.code !== 200) throw new Error(response.message);
  return response.data;
};

// 带重试的请求方法
const requestWithRetry = async <T>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  let retries = 0;
  const maxRetries = 2;
  const retryDelay = 1000;

  while (retries <= maxRetries) {
    try {
      let response;
      switch (method) {
        case 'get':
          response = await request.get(url, { params: data, ...config });
          break;
        case 'post':
          response = await request.post(url, data, config);
          break;
        case 'put':
          response = await request.put(url, data, config);
          break;
        case 'delete':
          response = await request.delete(url, config);
          break;
        default:
          throw new Error('Invalid method');
      }
      return response.data.data;
    } catch (error) {
      if (retries === maxRetries) {
        throw error;
      }
      retries++;
      await new Promise(resolve => setTimeout(resolve, retryDelay * retries));
    }
  }
  throw new Error('Request failed after maximum retries');
};

export const api = {
  async get<T>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<T> {
    if (USE_MOCK) {
      if (url === '/auth/me') return mockRequest(() => mockApi.login('student1', '123456').then(r => ({ ...r, data: r.data!.user as T })));
      if (url === '/courses') return mockRequest(() => mockApi.getCourses(params as Parameters<typeof mockApi.getCourses>[0])) as Promise<T>;
      if (url === '/courses/categories') return mockRequest(() => mockApi.getCategories()) as Promise<T>;
      if (url === '/courses/departments') return mockRequest(() => mockApi.getDepartments()) as Promise<T>;
      if (url === '/selection/my') return mockRequest(() => mockApi.getMySelections()) as Promise<T>;
      if (url === '/selection/validate') return mockRequest(() => mockApi.validateSelection(params?.courseId as string)) as Promise<T>;
      if (url === '/queue/status') return mockRequest(() => mockApi.getQueueStatus(params?.courseId as string)) as Promise<T>;
      if (url === '/notifications') return mockRequest(() => mockApi.getNotifications()) as Promise<T>;
      if (url === '/admin/students') return mockRequest(() => mockApi.getStudents(params as Parameters<typeof mockApi.getStudents>[0])) as Promise<T>;
      if (url === '/admin/teachers') return mockRequest(() => mockApi.getTeachers(params as Parameters<typeof mockApi.getTeachers>[0])) as Promise<T>;
      if (url === '/admin/logs') return mockRequest(() => mockApi.getOperationLogs(params as Parameters<typeof mockApi.getOperationLogs>[0])) as Promise<T>;
      if (url === '/admin/statistics') return mockRequest(() => mockApi.getStatistics()) as Promise<T>;
      if (url === '/admin/audits') return mockRequest(() => mockApi.getAuditRecords(params as Parameters<typeof mockApi.getAuditRecords>[0])) as Promise<T>;
      if (url === '/admin/courses') return mockRequest(() => mockApi.getAdminCourses(params as Parameters<typeof mockApi.getAdminCourses>[0])) as Promise<T>;
      if (url === '/admin/popular-courses') return mockRequest(() => mockApi.getPopularCourses()) as Promise<T>;
      if (url === '/teacher/courses') return mockRequest(() => mockApi.getTeacherCourses(params as Parameters<typeof mockApi.getTeacherCourses>[0])) as Promise<T>;
      if (url === '/teacher/students') return mockRequest(() => mockApi.getTeacherStudents(params as Parameters<typeof mockApi.getTeacherStudents>[0])) as Promise<T>;
      if (url === '/teacher/schedule') return mockRequest(() => mockApi.getTeacherSchedule()) as Promise<T>;
    }
    return requestWithRetry('get', url, params, config);
  },

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    if (USE_MOCK) {
      if (url === '/auth/login') {
        const { username, password } = data as { username: string; password: string };
        return mockRequest(() => mockApi.login(username, password)) as Promise<T>;
      }
      if (url === '/selection') {
        const { courseId } = data as { courseId: string };
        return mockRequest(() => mockApi.selectCourse(courseId)) as Promise<T>;
      }
    }
    return requestWithRetry('post', url, data, config);
  },

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return requestWithRetry('put', url, data, config);
  },

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    if (USE_MOCK && url.startsWith('/selection/')) {
      const recordId = url.replace('/selection/', '');
      return mockRequest(() => mockApi.cancelSelection(recordId)) as Promise<T>;
    }
    return requestWithRetry('delete', url, undefined, config);
  },
};

export default request;
