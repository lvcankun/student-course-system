import type { Course, User, SelectionRecord, Student, Teacher, Notification, OperationLog, Statistics, AuditRecord } from '@/types';

const categories = ['公共必修', '专业必修', '专业选修', '通识选修', '体育', '外语'];
const departments = ['计算机学院', '数学学院', '物理学院', '外语学院', '体育部', '马克思主义学院'];
const teachers = ['张教授', '李教授', '王教授', '刘教授', '陈教授', '赵教授'];

const generateTimeSlots = () => {
  const days = [1, 2, 3, 4, 5];
  const startPeriods = [1, 3, 5, 7, 9];
  const day = days[Math.floor(Math.random() * days.length)];
  const start = startPeriods[Math.floor(Math.random() * startPeriods.length)];
  const length = Math.floor(Math.random() * 2) + 2;
  return [{
    dayOfWeek: day,
    startPeriod: start,
    endPeriod: start + length - 1,
    weekRange: '1-16周',
    location: `教学楼${Math.floor(Math.random() * 5) + 1}-${Math.floor(Math.random() * 200) + 100}`,
  }];
};

export const mockCourses: Course[] = Array.from({ length: 50 }, (_, i) => ({
  id: `course-${i + 1}`,
  code: `CS${String(1000 + i).padStart(4, '0')}`,
  name: [
    '高等数学', '线性代数', '概率论与数理统计', '程序设计基础', '数据结构',
    '计算机网络', '操作系统', '数据库原理', '软件工程', '人工智能导论',
    '机器学习', '深度学习', '计算机视觉', '自然语言处理', '大数据技术',
    '云计算', '网络安全', '算法设计与分析', '编译原理', '计算机组成原理',
    '离散数学', '数值分析', '数学建模', '大学物理', '大学物理实验',
    '大学英语', '英语口语', '英语写作', '体育', '篮球',
    '足球', '羽毛球', '游泳', '瑜伽', '马克思主义基本原理',
    '中国近现代史纲要', '思想道德与法治', '形势与政策', '创新创业基础', '职业规划',
    '心理学导论', '经济学原理', '管理学基础', '公共演讲', '学术论文写作',
    '科研方法论', '专业英语', '项目管理', '人机交互', '软件测试',
  ][i] || `课程${i + 1}`,
  credit: Math.floor(Math.random() * 3) + 1,
  hours: Math.floor(Math.random() * 16) + 16,
  capacity: Math.floor(Math.random() * 50) + 30,
  selectedCount: Math.floor(Math.random() * 60),
  teacherId: `teacher-${(i % 6) + 1}`,
  teacherName: teachers[i % 6],
  department: departments[Math.floor(Math.random() * departments.length)],
  category: ['required', 'elective', 'general'][Math.floor(Math.random() * 3)] as 'required' | 'elective' | 'general',
  tags: [categories[Math.floor(Math.random() * categories.length)]],
  timeSlots: generateTimeSlots(),
  semester: '2024-1',
  teachingMethod: ['offline', 'online', 'hybrid'][Math.floor(Math.random() * 3)] as 'offline' | 'online' | 'hybrid',
  status: 'published',
  selectionScope: ['全校学生'],
}));

export const mockStudentUser: User = {
  id: 'user-student-1',
  username: 'student1',
  name: '张三',
  role: 'student',
  studentId: '2024001',
  department: '计算机学院',
  major: '计算机科学与技术',
  grade: '2024级',
  className: '计科1班',
  phone: '13800138001',
  email: 'student1@example.com',
  maxCredits: 30,
  selectedCredits: 0,
  status: 'active',
};

export const mockTeacherUser: User = {
  id: 'user-teacher-1',
  username: 'teacher1',
  name: '张教授',
  role: 'teacher',
  teacherId: 'T001',
  department: '计算机学院',
  phone: '13900139001',
  email: 'teacher1@example.com',
  maxCredits: 0,
  selectedCredits: 0,
  status: 'active',
};

export const mockAdminUser: User = {
  id: 'user-admin-1',
  username: 'admin',
  name: '管理员',
  role: 'admin',
  department: '教务处',
  phone: '13700137001',
  email: 'admin@example.com',
  maxCredits: 0,
  selectedCredits: 0,
  status: 'active',
};

export const mockSelections: SelectionRecord[] = [];

export const mockStudents: Student[] = Array.from({ length: 100 }, (_, i) => ({
  id: `student-${i + 1}`,
  studentId: `2024${String(i + 1).padStart(4, '0')}`,
  name: `学生${i + 1}`,
  gender: i % 2 === 0 ? 'male' : 'female',
  department: departments[i % departments.length],
  major: ['计算机科学与技术', '软件工程', '人工智能', '数据科学'][i % 4],
  grade: '2024级',
  className: `${['计科', '软工', '人工智能', '数据'][i % 4]}${Math.floor(i / 30) + 1}班`,
  phone: `1380013${String(i).padStart(4, '0')}`,
  email: `student${i + 1}@example.com`,
  status: 'active',
  maxCredits: 30,
  selectedCredits: Math.floor(Math.random() * 20),
  createdAt: new Date().toISOString(),
}));

export const mockTeachers: Teacher[] = teachers.map((name, i) => ({
  id: `teacher-${i + 1}`,
  teacherId: `T00${i + 1}`,
  name,
  gender: i % 2 === 0 ? 'male' : 'female' as 'male' | 'female',
  department: departments[i % departments.length],
  title: ['教授', '副教授', '讲师'][i % 3],
  teachingDirection: [['计算机'], ['数学'], ['物理']][i % 3],
  phone: `1390013${String(i).padStart(4, '0')}`,
  email: `teacher${i + 1}@example.com`,
  status: 'active',
  courseCount: Math.floor(Math.random() * 5) + 1,
  createdAt: new Date().toISOString(),
}));

export const mockNotifications: Notification[] = [
  { id: 'n1', title: '选课开始通知', content: '2024春季学期选课已开始，请在规定时间内完成选课', type: 'system', isRead: false, createdAt: new Date().toISOString() },
  { id: 'n2', title: '选课成功', content: '您已成功选择《高等数学》课程', type: 'selection', isRead: true, createdAt: new Date().toISOString() },
  { id: 'n3', title: '退选截止提醒', content: '退选截止时间为2024年3月15日，请及时处理', type: 'reminder', isRead: false, createdAt: new Date().toISOString() },
];

export const mockOperationLogs: OperationLog[] = [
  { id: 'log1', userId: 'user-student-1', userName: '张三', action: 'login', module: 'user', detail: '用户登录', ip: '192.168.1.1', createdAt: new Date().toISOString() },
  { id: 'log2', userId: 'user-student-1', userName: '张三', action: 'select', module: 'selection', detail: '选择课程：高等数学', ip: '192.168.1.1', createdAt: new Date().toISOString() },
  { id: 'log3', userId: 'user-admin-1', userName: '管理员', action: 'create', module: 'course', detail: '创建课程：机器学习', ip: '192.168.1.100', createdAt: new Date().toISOString() },
];

export const mockStatistics: Statistics = {
  totalCourses: 50,
  totalSelections: 1250,
  totalStudents: 100,
  totalTeachers: 6,
  selectionRate: 78.5,
  avgCredits: 18.5,
  popularCourses: mockCourses.slice(0, 10),
  departmentStats: departments.map(name => ({ name, count: Math.floor(Math.random() * 200) + 50 })),
};

export const mockAuditRecords: AuditRecord[] = [
  { id: 'audit1', type: 'selection', applicantId: 'student-1', applicantName: '李四', courseId: 'course-1', courseName: '高等数学', reason: '重修申请', status: 'pending', createdAt: new Date().toISOString() },
  { id: 'audit2', type: 'withdraw', applicantId: 'student-2', applicantName: '王五', courseId: 'course-2', courseName: '线性代数', reason: '时间冲突，需退选必修课', status: 'pending', createdAt: new Date().toISOString() },
];

export const mockCategories = categories;
export const mockDepartments = departments;
