import type { Course, User, SelectionRecord, ApiResponse, PaginatedResponse, ValidationResult, QueueStatus, Student, Teacher, Notification, OperationLog, Statistics, AuditRecord } from '@/types';
import { mockCourses, mockStudentUser, mockTeacherUser, mockAdminUser, mockSelections, mockCategories, mockDepartments, mockStudents, mockTeachers, mockNotifications, mockOperationLogs, mockStatistics, mockAuditRecords } from './data';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let selections = [...mockSelections];
let courses = [...mockCourses];

export const mockApi = {
  async login(username: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    await delay(500);

    if (username === 'student1' && password === '123456') {
      return {
        code: 0,
        data: {
          token: 'mock-jwt-token-student-' + Date.now(),
          user: { ...mockStudentUser, selectedCredits: selections.reduce((sum, s) => sum + s.credit, 0) },
        },
        message: 'success',
      };
    }

    if (username === 'teacher1' && password === '123456') {
      return {
        code: 0,
        data: {
          token: 'mock-jwt-token-teacher-' + Date.now(),
          user: mockTeacherUser,
        },
        message: 'success',
      };
    }

    if (username === 'admin' && password === '123456') {
      return {
        code: 0,
        data: {
          token: 'mock-jwt-token-admin-' + Date.now(),
          user: mockAdminUser,
        },
        message: 'success',
      };
    }

    return {
      code: 401,
      data: null as unknown as { token: string; user: User },
      message: '用户名或密码错误',
    };
  },

  async getCourses(params: {
    page: number;
    pageSize: number;
    keyword?: string;
    category?: string;
    onlyAvailable?: boolean;
  }): Promise<ApiResponse<PaginatedResponse<Course>>> {
    await delay(300);
    let filtered = [...courses];
    if (params.keyword) {
      const kw = params.keyword.toLowerCase();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(kw) || c.code.toLowerCase().includes(kw) || c.teacherName.toLowerCase().includes(kw));
    }
    if (params.category) {
      filtered = filtered.filter(c => c.category === params.category);
    }
    if (params.onlyAvailable) {
      filtered = filtered.filter(c => c.selectedCount < c.capacity);
    }
    const start = (params.page - 1) * params.pageSize;
    return { code: 0, data: { list: filtered.slice(start, start + params.pageSize), total: filtered.length, page: params.page, pageSize: params.pageSize }, message: 'success' };
  },

  async getCategories(): Promise<ApiResponse<string[]>> {
    await delay(100);
    return { code: 0, data: mockCategories, message: 'success' };
  },

  async getDepartments(): Promise<ApiResponse<string[]>> {
    await delay(100);
    return { code: 0, data: mockDepartments, message: 'success' };
  },

  async getMySelections(): Promise<ApiResponse<SelectionRecord[]>> {
    await delay(200);
    return { code: 0, data: selections, message: 'success' };
  },

  async validateSelection(courseId: string): Promise<ApiResponse<ValidationResult>> {
    await delay(200);
    const course = courses.find(c => c.id === courseId);
    if (!course) return { code: 0, data: { passed: false, reason: '课程不存在' }, message: 'success' };
    if (course.selectedCount >= course.capacity) return { code: 0, data: { passed: false, reason: '课程已满' }, message: 'success' };
    const totalCredits = selections.reduce((sum, s) => sum + s.credit, 0);
    if (totalCredits + course.credit > 30) return { code: 0, data: { passed: false, reason: '超出学分上限' }, message: 'success' };
    return { code: 0, data: { passed: true }, message: 'success' };
  },

  async selectCourse(courseId: string): Promise<ApiResponse<{ recordId: string; status: string }>> {
    await delay(500);
    const course = courses.find(c => c.id === courseId);
    if (!course) return { code: 400, data: null as unknown as { recordId: string; status: string }, message: '课程不存在' };
    const record: SelectionRecord = { id: `selection-${Date.now()}`, courseId, courseName: course.name, credit: course.credit, teacherName: course.teacherName, timeSlots: course.timeSlots, selectedAt: new Date().toISOString(), status: 'selected' };
    selections.push(record);
    course.selectedCount++;
    return { code: 0, data: { recordId: record.id, status: 'success' }, message: 'success' };
  },

  async cancelSelection(recordId: string): Promise<ApiResponse<void>> {
    await delay(300);
    const index = selections.findIndex(s => s.id === recordId);
    if (index === -1) return { code: 400, data: undefined, message: '选课记录不存在' };
    const record = selections[index];
    const course = courses.find(c => c.id === record.courseId);
    if (course) course.selectedCount--;
    selections.splice(index, 1);
    return { code: 0, data: undefined, message: 'success' };
  },

  async getQueueStatus(_courseId: string): Promise<ApiResponse<QueueStatus>> {
    await delay(100);
    return { code: 0, data: { position: 0, status: 'success', recordId: `record-${Date.now()}` }, message: 'success' };
  },

  async getStudents(params: { page: number; pageSize: number; keyword?: string; status?: string }): Promise<ApiResponse<PaginatedResponse<Student>>> {
    await delay(300);
    let filtered = [...mockStudents];
    if (params.keyword) {
      filtered = filtered.filter(s => s.name.includes(params.keyword!) || s.studentId.includes(params.keyword!));
    }
    if (params.status) {
      filtered = filtered.filter(s => s.status === params.status);
    }
    const start = (params.page - 1) * params.pageSize;
    return { code: 0, data: { list: filtered.slice(start, start + params.pageSize), total: filtered.length, page: params.page, pageSize: params.pageSize }, message: 'success' };
  },

  async getTeachers(params: { page: number; pageSize: number; keyword?: string; department?: string }): Promise<ApiResponse<PaginatedResponse<Teacher>>> {
    await delay(300);
    let filtered = [...mockTeachers];
    if (params.keyword) {
      filtered = filtered.filter(t => t.name.includes(params.keyword!) || t.teacherId.includes(params.keyword!));
    }
    if (params.department) {
      filtered = filtered.filter(t => t.department === params.department);
    }
    const start = (params.page - 1) * params.pageSize;
    return { code: 0, data: { list: filtered.slice(start, start + params.pageSize), total: filtered.length, page: params.page, pageSize: params.pageSize }, message: 'success' };
  },

  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    await delay(200);
    return { code: 0, data: mockNotifications, message: 'success' };
  },

  async getOperationLogs(params: { page: number; pageSize: number }): Promise<ApiResponse<PaginatedResponse<OperationLog>>> {
    await delay(200);
    const start = (params.page - 1) * params.pageSize;
    return { code: 0, data: { list: mockOperationLogs.slice(start, start + params.pageSize), total: mockOperationLogs.length, page: params.page, pageSize: params.pageSize }, message: 'success' };
  },

  async getStatistics(): Promise<ApiResponse<Statistics>> {
    await delay(200);
    return { code: 0, data: mockStatistics, message: 'success' };
  },

  async getAuditRecords(params: { page: number; pageSize: number; status?: string; type?: string }): Promise<ApiResponse<PaginatedResponse<AuditRecord>>> {
    await delay(300);
    let filtered = [...mockAuditRecords];
    if (params.status) filtered = filtered.filter(a => a.status === params.status);
    if (params.type) filtered = filtered.filter(a => a.type === params.type);
    const start = (params.page - 1) * params.pageSize;
    return { code: 0, data: { list: filtered.slice(start, start + params.pageSize), total: filtered.length, page: params.page, pageSize: params.pageSize }, message: 'success' };
  },

  async getTeacherCourses(params: { page: number; pageSize: number; keyword?: string }): Promise<ApiResponse<PaginatedResponse<Course>>> {
    await delay(300);
    let filtered = courses.filter(c => c.teacherId === 'teacher-1');
    if (params.keyword) {
      filtered = filtered.filter(c => c.name.includes(params.keyword!) || c.code.includes(params.keyword!));
    }
    const start = (params.page - 1) * params.pageSize;
    return { code: 0, data: { list: filtered.slice(start, start + params.pageSize), total: filtered.length, page: params.page, pageSize: params.pageSize }, message: 'success' };
  },

  async getTeacherStudents(params: { page: number; pageSize: number; keyword?: string }): Promise<ApiResponse<PaginatedResponse<Student>>> {
    return this.getStudents(params);
  },

  async getTeacherSchedule(): Promise<ApiResponse<SelectionRecord[]>> {
    await delay(200);
    const teacherCourses = courses.filter(c => c.teacherId === 'teacher-1');
    return { code: 0, data: teacherCourses.map(c => ({ id: `schedule-${c.id}`, courseId: c.id, courseName: c.name, credit: c.credit, teacherName: c.teacherName, timeSlots: c.timeSlots, selectedAt: new Date().toISOString(), status: 'selected' as const })), message: 'success' };
  },

  async getAdminCourses(params: { page: number; pageSize: number; keyword?: string; category?: string; status?: string }): Promise<ApiResponse<PaginatedResponse<Course>>> {
    return this.getCourses(params);
  },

  async getPopularCourses(): Promise<ApiResponse<Course[]>> {
    await delay(200);
    return { code: 0, data: courses.slice(0, 10), message: 'success' };
  },
};
