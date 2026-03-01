export interface User {
  id: string;
  username: string;
  name: string;
  role: 'student' | 'teacher' | 'admin' | 'superAdmin';
  studentId?: string;
  teacherId?: string;
  department?: string;
  major?: string;
  grade?: string;
  className?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  maxCredits: number;
  selectedCredits: number;
  status: 'active' | 'inactive' | 'locked';
  createdAt?: string;
  lastLoginAt?: string;
}

export interface TimeSlot {
  dayOfWeek: number;
  startPeriod: number;
  endPeriod: number;
  weekRange: string;
  location: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  credit: number;
  hours: number;
  capacity: number;
  selectedCount: number;
  teacherId: string;
  teacherName: string;
  department: string;
  category: 'required' | 'elective' | 'general';
  tags: string[];
  timeSlots: TimeSlot[];
  description?: string;
  semester: string;
  teachingMethod: 'offline' | 'online' | 'hybrid';
  status: 'draft' | 'published' | 'closed' | 'cancelled';
  selectionStartTime?: string;
  selectionEndTime?: string;
  withdrawDeadline?: string;
  selectionScope: string[];
  prerequisites?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SelectionRecord {
  id: string;
  courseId: string;
  courseName: string;
  credit: number;
  teacherName: string;
  timeSlots: TimeSlot[];
  selectedAt: string;
  status: 'pending' | 'selected' | 'queued' | 'completed' | 'withdrawn' | 'rejected';
  queuePosition?: number;
  withdrawReason?: string;
}

export type SelectionState =
  | { status: 'idle' }
  | { status: 'validating'; courseId: string }
  | { status: 'queuing'; courseId: string; position: number }
  | { status: 'success'; courseId: string; recordId: string }
  | { status: 'failed'; courseId: string; reason: string };

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: User;
}

export interface CourseFilterParams extends PaginationParams {
  keyword?: string;
  category?: string;
  department?: string;
  semester?: string;
  onlyAvailable?: boolean;
  teacherId?: string;
  status?: string;
}

export interface ValidationResult {
  passed: boolean;
  reason?: string;
}

export interface QueueStatus {
  position: number;
  status: 'waiting' | 'processing' | 'success' | 'failed';
  recordId?: string;
}

export interface Student {
  id: string;
  studentId: string;
  name: string;
  gender: 'male' | 'female';
  department: string;
  major: string;
  grade: string;
  className: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive' | 'suspended';
  maxCredits: number;
  selectedCredits: number;
  createdAt: string;
}

export interface Teacher {
  id: string;
  teacherId: string;
  name: string;
  gender: 'male' | 'female';
  department: string;
  title: string;
  teachingDirection: string[];
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
  courseCount: number;
  createdAt: string;
}

export interface Classroom {
  id: string;
  code: string;
  name: string;
  capacity: number;
  building: string;
  floor: number;
  facilities: ('multimedia' | 'computer' | 'projector' | 'airConditioner')[];
  status: 'available' | 'occupied' | 'maintenance';
}

export interface SelectionRule {
  id: string;
  name: string;
  semester: string;
  selectionStartTime: string;
  selectionEndTime: string;
  withdrawDeadline: string;
  maxCredits: number;
  minCredits: number;
  allowConflict: boolean;
  allowOverLimit: boolean;
  status: 'active' | 'inactive';
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'selection' | 'audit' | 'reminder';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface OperationLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  detail: string;
  ip: string;
  createdAt: string;
}

export interface Statistics {
  totalCourses: number;
  totalSelections: number;
  totalStudents: number;
  totalTeachers: number;
  selectionRate: number;
  avgCredits: number;
  popularCourses: Course[];
  departmentStats: { name: string; count: number }[];
}

export interface AuditRecord {
  id: string;
  type: 'selection' | 'withdraw' | 'capacity' | 'course';
  applicantId: string;
  applicantName: string;
  courseId?: string;
  courseName?: string;
  reason: string;
  attachments?: string[];
  status: 'pending' | 'approved' | 'rejected';
  reviewerId?: string;
  reviewerName?: string;
  reviewComment?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface ChangePasswordParams {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileParams {
  name?: string;
  phone?: string;
  email?: string;
}
