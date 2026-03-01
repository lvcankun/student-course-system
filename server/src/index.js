import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;
const JWT_SECRET = 'course-selection-secret-key-2024';

app.use(cors());
app.use(bodyParser.json());

// 速率限制中间件
const rateLimitMiddleware = (req, res, next) => {
  const userId = req.user?.id;
  if (!userId) return next();

  const now = Date.now();
  const userLimit = rateLimits.get(userId);

  if (userLimit) {
    if (now - userLimit.lastRequestTime < RATE_LIMIT_WINDOW) {
      if (userLimit.requestCount >= MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({ code: 429, message: '请求过于频繁，请稍后再试', data: null });
      }
      rateLimits.set(userId, {
        lastRequestTime: userLimit.lastRequestTime,
        requestCount: userLimit.requestCount + 1
      });
    } else {
      rateLimits.set(userId, {
        lastRequestTime: now,
        requestCount: 1
      });
    }
  } else {
    rateLimits.set(userId, {
      lastRequestTime: now,
      requestCount: 1
    });
  }
  next();
};

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// 为选课相关API添加速率限制
app.use('/api/selection', rateLimitMiddleware);
app.use('/api/queue', rateLimitMiddleware);

let users = [
  { id: 'user-student-1', username: 'student1', password: '123456', name: '张三', role: 'student', studentId: '2024001', department: '计算机学院', major: '计算机科学与技术', grade: '2024级', className: '计科1班', phone: '13800138001', email: 'student1@example.com', maxCredits: 30, selectedCredits: 0, status: 'active' },
  { id: 'user-teacher-1', username: 'teacher1', password: '123456', name: '张教授', role: 'teacher', teacherId: 'T001', department: '计算机学院', phone: '13900139001', email: 'teacher1@example.com', maxCredits: 0, selectedCredits: 0, status: 'active' },
  { id: 'user-admin-1', username: 'admin', password: '123456', name: '管理员', role: 'admin', department: '教务处', phone: '13700137001', email: 'admin@example.com', maxCredits: 0, selectedCredits: 0, status: 'active' },
];

let courses = [
  { id: 'course-1', code: 'CS1001', name: '高等数学', credit: 4, hours: 64, capacity: 100, selectedCount: 78, teacherId: 'user-teacher-1', teacherName: '张教授', department: '数学学院', category: 'required', tags: ['公共必修'], timeSlots: [{ dayOfWeek: 1, startPeriod: 1, endPeriod: 2, weekRange: '1-16周', location: '教学楼1-101' }, { dayOfWeek: 3, startPeriod: 1, endPeriod: 2, weekRange: '1-16周', location: '教学楼1-101' }], semester: '2024-1', teachingMethod: 'offline', status: 'published', selectionScope: ['全校学生'] },
  { id: 'course-2', code: 'CS1002', name: '线性代数', credit: 3, hours: 48, capacity: 80, selectedCount: 65, teacherId: 'user-teacher-1', teacherName: '张教授', department: '数学学院', category: 'required', tags: ['公共必修'], timeSlots: [{ dayOfWeek: 2, startPeriod: 3, endPeriod: 4, weekRange: '1-16周', location: '教学楼2-201' }], semester: '2024-1', teachingMethod: 'offline', status: 'published', selectionScope: ['全校学生'] },
  { id: 'course-3', code: 'CS1003', name: '程序设计基础', credit: 3, hours: 48, capacity: 60, selectedCount: 55, teacherId: 'user-teacher-1', teacherName: '张教授', department: '计算机学院', category: 'required', tags: ['专业必修'], timeSlots: [{ dayOfWeek: 1, startPeriod: 5, endPeriod: 6, weekRange: '1-16周', location: '教学楼3-301' }, { dayOfWeek: 4, startPeriod: 5, endPeriod: 6, weekRange: '1-16周', location: '教学楼3-301' }], semester: '2024-1', teachingMethod: 'offline', status: 'published', selectionScope: ['全校学生'] },
  { id: 'course-4', code: 'CS1004', name: '数据结构', credit: 4, hours: 64, capacity: 50, selectedCount: 48, teacherId: 'user-teacher-1', teacherName: '张教授', department: '计算机学院', category: 'required', tags: ['专业必修'], timeSlots: [{ dayOfWeek: 2, startPeriod: 1, endPeriod: 2, weekRange: '1-16周', location: '教学楼3-302' }, { dayOfWeek: 5, startPeriod: 1, endPeriod: 2, weekRange: '1-16周', location: '教学楼3-302' }], semester: '2024-1', teachingMethod: 'offline', status: 'published', selectionScope: ['全校学生'] },
  { id: 'course-5', code: 'CS1005', name: '计算机网络', credit: 3, hours: 48, capacity: 45, selectedCount: 42, teacherId: 'user-teacher-1', teacherName: '张教授', department: '计算机学院', category: 'elective', tags: ['专业选修'], timeSlots: [{ dayOfWeek: 3, startPeriod: 5, endPeriod: 6, weekRange: '1-16周', location: '教学楼3-303' }], semester: '2024-1', teachingMethod: 'offline', status: 'published', selectionScope: ['全校学生'] },
  { id: 'course-6', code: 'CS1006', name: '操作系统', credit: 4, hours: 64, capacity: 50, selectedCount: 38, teacherId: 'user-teacher-1', teacherName: '张教授', department: '计算机学院', category: 'required', tags: ['专业必修'], timeSlots: [{ dayOfWeek: 1, startPeriod: 3, endPeriod: 4, weekRange: '1-16周', location: '教学楼3-304' }], semester: '2024-1', teachingMethod: 'offline', status: 'published', selectionScope: ['全校学生'] },
  { id: 'course-7', code: 'CS1007', name: '数据库原理', credit: 3, hours: 48, capacity: 55, selectedCount: 50, teacherId: 'user-teacher-1', teacherName: '张教授', department: '计算机学院', category: 'required', tags: ['专业必修'], timeSlots: [{ dayOfWeek: 4, startPeriod: 3, endPeriod: 4, weekRange: '1-16周', location: '教学楼3-305' }], semester: '2024-1', teachingMethod: 'offline', status: 'published', selectionScope: ['全校学生'] },
  { id: 'course-8', code: 'CS1008', name: '软件工程', credit: 3, hours: 48, capacity: 40, selectedCount: 35, teacherId: 'user-teacher-1', teacherName: '张教授', department: '计算机学院', category: 'elective', tags: ['专业选修'], timeSlots: [{ dayOfWeek: 5, startPeriod: 3, endPeriod: 4, weekRange: '1-16周', location: '教学楼3-306' }], semester: '2024-1', teachingMethod: 'offline', status: 'published', selectionScope: ['全校学生'] },
  { id: 'course-9', code: 'CS1009', name: '人工智能导论', credit: 2, hours: 32, capacity: 60, selectedCount: 58, teacherId: 'user-teacher-1', teacherName: '张教授', department: '计算机学院', category: 'elective', tags: ['专业选修'], timeSlots: [{ dayOfWeek: 2, startPeriod: 5, endPeriod: 6, weekRange: '1-16周', location: '教学楼3-307' }], semester: '2024-1', teachingMethod: 'offline', status: 'published', selectionScope: ['全校学生'] },
  { id: 'course-10', code: 'CS1010', name: '机器学习', credit: 3, hours: 48, capacity: 35, selectedCount: 35, teacherId: 'user-teacher-1', teacherName: '张教授', department: '计算机学院', category: 'elective', tags: ['专业选修'], timeSlots: [{ dayOfWeek: 3, startPeriod: 3, endPeriod: 4, weekRange: '1-16周', location: '教学楼3-308' }], semester: '2024-1', teachingMethod: 'offline', status: 'published', selectionScope: ['全校学生'] },
];

let students = Array.from({ length: 50 }, (_, i) => ({
  id: `user-student-${i + 1}`,
  studentId: `2024${String(i + 1).padStart(4, '0')}`,
  name: `学生${i + 1}`,
  gender: i % 2 === 0 ? 'male' : 'female',
  department: ['计算机学院', '数学学院', '物理学院'][i % 3],
  major: ['计算机科学与技术', '软件工程', '人工智能', '数据科学'][i % 4],
  grade: '2024级',
  className: `${['计科', '软工', '人工智能', '数据'][i % 4]}${Math.floor(i / 20) + 1}班`,
  phone: `1380013${String(i).padStart(4, '0')}`,
  email: `student${i + 1}@example.com`,
  status: 'active',
  maxCredits: 30,
  selectedCredits: Math.floor(Math.random() * 20),
  createdAt: new Date().toISOString(),
}));

// 为所有学生生成登录用户
students.forEach((student, index) => {
  const existingUser = users.find(u => u.id === student.id);
  if (!existingUser) {
    users.push({
      id: student.id,
      username: `student${index + 1}`,
      password: '123456',
      name: student.name,
      role: 'student',
      studentId: student.studentId,
      department: student.department,
      major: student.major,
      grade: student.grade,
      className: student.className,
      phone: student.phone,
      email: student.email,
      maxCredits: student.maxCredits,
      selectedCredits: student.selectedCredits,
      status: student.status
    });
  }
});

let teachers = [
  { id: 'user-teacher-1', teacherId: 'T001', name: '张教授', gender: 'male', department: '计算机学院', title: '教授', teachingDirection: ['计算机'], phone: '13900130001', email: 'teacher1@example.com', status: 'active', courseCount: 5, createdAt: new Date().toISOString() },
  { id: 'user-teacher-2', teacherId: 'T002', name: '李教授', gender: 'female', department: '数学学院', title: '教授', teachingDirection: ['数学'], phone: '13900130002', email: 'teacher2@example.com', status: 'active', courseCount: 3, createdAt: new Date().toISOString() },
  { id: 'user-teacher-3', teacherId: 'T003', name: '王教授', gender: 'male', department: '物理学院', title: '副教授', teachingDirection: ['物理'], phone: '13900130003', email: 'teacher3@example.com', status: 'active', courseCount: 2, createdAt: new Date().toISOString() },
  { id: 'user-teacher-4', teacherId: 'T004', name: '刘教授', gender: 'female', department: '外语学院', title: '讲师', teachingDirection: ['英语'], phone: '13900130004', email: 'teacher4@example.com', status: 'active', courseCount: 4, createdAt: new Date().toISOString() },
  { id: 'user-teacher-5', teacherId: 'T005', name: '陈教授', gender: 'male', department: '体育部', title: '副教授', teachingDirection: ['体育'], phone: '13900130005', email: 'teacher5@example.com', status: 'active', courseCount: 6, createdAt: new Date().toISOString() },
  { id: 'user-teacher-6', teacherId: 'T006', name: '赵教授', gender: 'female', department: '马克思主义学院', title: '教授', teachingDirection: ['思政'], phone: '13900130006', email: 'teacher6@example.com', status: 'active', courseCount: 3, createdAt: new Date().toISOString() },
];

// 为所有教师生成登录用户
teachers.forEach((teacher, index) => {
  const existingUser = users.find(u => u.id === teacher.id);
  if (!existingUser) {
    users.push({
      id: teacher.id,
      username: `teacher${index + 1}`,
      password: '123456',
      name: teacher.name,
      role: 'teacher',
      teacherId: teacher.teacherId,
      department: teacher.department,
      phone: teacher.phone,
      email: teacher.email,
      maxCredits: 0,
      selectedCredits: 0,
      status: teacher.status
    });
  }
});

let selections = [];
let auditRecords = [
  { id: 'audit-1', type: 'selection', applicantId: 'user-student-1', applicantName: '学生1', courseId: 'course-1', courseName: '高等数学', reason: '重修申请', status: 'pending', createdAt: new Date().toISOString() },
  { id: 'audit-2', type: 'withdraw', applicantId: 'user-student-2', applicantName: '学生2', courseId: 'course-2', courseName: '线性代数', reason: '时间冲突，需退选必修课', status: 'pending', createdAt: new Date().toISOString() },
];

// 课程评价数据
let courseReviews = [
  { id: 'review-1', courseId: 'course-1', studentId: 'user-student-1', studentName: '张三', rating: 5, content: '老师讲课很清晰，课程内容丰富', tags: ['讲课清晰', '内容丰富'], createdAt: '2024-01-15T10:00:00Z' },
  { id: 'review-2', courseId: 'course-1', studentId: 'user-student-2', studentName: '李四', rating: 4, content: '课程难度适中，作业量合理', tags: ['难度适中'], createdAt: '2024-01-16T14:00:00Z' },
  { id: 'review-3', courseId: 'course-2', studentId: 'user-student-1', studentName: '张三', rating: 5, content: '非常实用的课程，推荐！', tags: ['实用性强'], createdAt: '2024-01-17T09:00:00Z' },
];

// 队列管理
let selectionQueue = new Map(); // 课程ID -> 排队用户列表
let processingQueue = new Map(); // 正在处理的请求
let rateLimits = new Map(); // 用户ID -> { lastRequestTime, requestCount }

// 速率限制配置
const RATE_LIMIT_WINDOW = 1000; // 1秒窗口
const MAX_REQUESTS_PER_WINDOW = 5; // 每秒最多5个请求
const QUEUE_TIMEOUT = 60000; // 队列超时时间（1分钟）

let notifications = [
  { id: 'n1', title: '选课开始通知', content: '2024春季学期选课已开始，请在规定时间内完成选课', type: 'system', isRead: false, createdAt: new Date().toISOString() },
  { id: 'n2', title: '选课成功', content: '您已成功选择《高等数学》课程', type: 'selection', isRead: true, createdAt: new Date().toISOString() },
];

let operationLogs = [
  { id: 'log-1', userId: 'user-student-1', userName: '张三', action: 'login', module: 'user', detail: '用户登录', ip: '192.168.1.1', createdAt: new Date().toISOString() },
];

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ code: 401, message: '未登录', data: null });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ code: 403, message: 'token无效', data: null });
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superAdmin') {
    return res.status(403).json({ code: 403, message: '需要管理员权限', data: null });
  }
  next();
};

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ code: 401, message: '用户名或密码错误', data: null });
  }
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
  const { password: _, ...userWithoutPassword } = user;
  res.json({ code: 0, message: 'success', data: { token, user: userWithoutPassword } });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ code: 404, message: '用户不存在', data: null });
  const { password: _, ...userWithoutPassword } = user;
  res.json({ code: 0, message: 'success', data: userWithoutPassword });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ code: 0, message: 'success', data: null });
});

app.post('/api/auth/refresh', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ code: 404, message: '用户不存在', data: null });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ code: 0, message: 'success', data: { token } });
});

// Course routes
app.get('/api/courses', authenticateToken, (req, res) => {
  let filtered = [...courses];
  const { keyword, category, department, semester, onlyAvailable, page = 1, pageSize = 20 } = req.query;
  
  console.log('=== 课程列表请求 ===');
  console.log('用户角色:', req.user.role);
  console.log('用户ID:', req.user.id);
  console.log('总课程数:', courses.length);
  console.log('所有课程状态:', courses.map(c => ({ id: c.id, name: c.name, status: c.status, teacherId: c.teacherId })));
  
  // 根据用户角色过滤课程
  if (req.user.role === 'student') {
    // 学生端只显示已发布的课程
    filtered = filtered.filter(c => c.status === 'published');
    console.log('学生端过滤后课程数:', filtered.length);
  } else if (req.user.role === 'teacher') {
    // 老师端显示自己的所有课程（包括待审核、审核不通过的）
    filtered = filtered.filter(c => c.teacherId === req.user.id);
    console.log('教师端过滤后课程数:', filtered.length);
  }
  // 管理员端显示所有课程
  if (req.user.role === 'admin') {
    console.log('管理员端课程数:', filtered.length);
  }
  
  if (keyword) {
    const kw = keyword.toLowerCase();
    filtered = filtered.filter(c => c.name.toLowerCase().includes(kw) || c.code.toLowerCase().includes(kw) || c.teacherName.toLowerCase().includes(kw));
  }
  if (category) filtered = filtered.filter(c => c.category === category);
  if (department) filtered = filtered.filter(c => c.department === department);
  if (semester) filtered = filtered.filter(c => c.semester === semester);
  if (onlyAvailable === 'true') filtered = filtered.filter(c => c.selectedCount < c.capacity);
  const start = (parseInt(page) - 1) * parseInt(pageSize);
  const list = filtered.slice(start, start + parseInt(pageSize));
  res.json({ code: 0, message: 'success', data: { list, total: filtered.length, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

app.get('/api/courses/categories', (req, res) => {
  res.json({ code: 0, message: 'success', data: ['公共必修', '专业必修', '专业选修', '通识选修', '体育', '外语'] });
});

app.get('/api/courses/departments', (req, res) => {
  res.json({ code: 0, message: 'success', data: ['计算机学院', '数学学院', '物理学院', '外语学院', '体育部', '马克思主义学院'] });
});

app.get('/api/courses/:id', (req, res) => {
  const course = courses.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ code: 404, message: '课程不存在', data: null });
  res.json({ code: 0, message: 'success', data: course });
});

// Selection routes
app.get('/api/selection/my', authenticateToken, (req, res) => {
  console.log('获取选课记录, 用户ID:', req.user.id);
  console.log('所有选课记录:', selections.map(s => ({ studentId: s.studentId, courseId: s.courseId, courseName: s.courseName })));
  const userSelections = selections.filter(s => s.studentId === req.user.id);
  console.log('用户选课记录:', userSelections);
  res.json({ code: 0, message: 'success', data: userSelections });
});

app.get('/api/selection/validate', authenticateToken, (req, res) => {
  const { courseId } = req.query;
  console.log('验证选课 courseId:', courseId);
  const course = courses.find(c => c.id === courseId);
  if (!course) {
    console.log('课程不存在');
    return res.json({ code: 0, message: 'success', data: { passed: false, reason: '课程不存在' } });
  }
  const userSelections = selections.filter(s => s.studentId === req.user.id);
  const alreadySelected = userSelections.find(s => s.courseId === courseId);
  if (alreadySelected) {
    console.log('已经选过该课程');
    return res.json({ code: 0, message: 'success', data: { passed: false, reason: '已经选过该课程' } });
  }
  if (course.selectedCount >= course.capacity) {
    console.log('课程已满');
    return res.json({ code: 0, message: 'success', data: { passed: false, reason: '课程已满' } });
  }
  const totalCredits = userSelections.reduce((sum, s) => sum + s.credit, 0);
  if (totalCredits + course.credit > 30) {
    console.log('超出学分上限');
    return res.json({ code: 0, message: 'success', data: { passed: false, reason: '超出学分上限' } });
  }
  
  // 时间冲突检测
  for (const selection of userSelections) {
    const selectedCourse = courses.find(c => c.id === selection.courseId);
    if (!selectedCourse) continue;
    for (const newSlot of course.timeSlots) {
      for (const existingSlot of selectedCourse.timeSlots) {
        if (newSlot.dayOfWeek === existingSlot.dayOfWeek) {
          if (newSlot.startPeriod <= existingSlot.endPeriod && newSlot.endPeriod >= existingSlot.startPeriod) {
            console.log('时间冲突');
            return res.json({ code: 0, message: 'success', data: { passed: false, reason: `时间冲突：与已选课程"${selectedCourse.name}"冲突` } });
          }
        }
      }
    }
  }
  
  console.log('验证通过');
  res.json({ code: 0, message: 'success', data: { passed: true } });
});

app.post('/api/selection', authenticateToken, (req, res) => {
  const { courseId } = req.body;
  console.log('选课请求 courseId:', courseId);
  const course = courses.find(c => c.id === courseId);
  if (!course) return res.status(400).json({ code: 400, message: '课程不存在', data: null });
  const alreadySelected = selections.find(s => s.studentId === req.user.id && s.courseId === courseId);
  if (alreadySelected) return res.status(400).json({ code: 400, message: '已经选过该课程', data: null });
  
  // 检查是否已经在队列中
  const courseQueue = selectionQueue.get(courseId) || [];
  if (courseQueue.some(item => item.userId === req.user.id)) {
    const position = courseQueue.findIndex(item => item.userId === req.user.id) + 1;
    return res.json({ code: 0, message: 'success', data: { status: 'queued', position, recordId: null } });
  }
  
  // 检查课程容量
  if (course.selectedCount < course.capacity) {
    // 直接选课
    const record = { id: `selection-${uuidv4()}`, studentId: req.user.id, courseId, courseName: course.name, credit: course.credit, teacherName: course.teacherName, timeSlots: course.timeSlots, selectedAt: new Date().toISOString(), status: 'selected' };
    selections.push(record);
    course.selectedCount++;
    res.json({ code: 0, message: 'success', data: { recordId: record.id, status: 'success' } });
  } else {
    // 加入队列
    const queueItem = {
      userId: req.user.id,
      userName: req.user.name,
      courseId,
      courseName: course.name,
      queuedAt: Date.now(),
      status: 'queuing'
    };
    
    if (!selectionQueue.has(courseId)) {
      selectionQueue.set(courseId, []);
    }
    selectionQueue.get(courseId).push(queueItem);
    
    const position = selectionQueue.get(courseId).length;
    console.log(`用户 ${req.user.name} 加入课程 ${course.name} 的排队队列，位置：${position}`);
    
    res.json({ code: 0, message: 'success', data: { status: 'queued', position, recordId: null } });
  }
});

app.delete('/api/selection/:id', authenticateToken, (req, res) => {
  const index = selections.findIndex(s => s.id === req.params.id && s.studentId === req.user.id);
  if (index === -1) return res.status(404).json({ code: 404, message: '选课记录不存在', data: null });
  const record = selections[index];
  const course = courses.find(c => c.id === record.courseId);
  if (course) {
    course.selectedCount--;
    
    // 检查是否有排队的用户
    const courseQueue = selectionQueue.get(record.courseId) || [];
    if (courseQueue.length > 0 && course.selectedCount < course.capacity) {
      // 取出队列中的第一个用户
      const nextUser = courseQueue.shift();
      selectionQueue.set(record.courseId, courseQueue);
      
      // 为下一个用户选课
      const nextRecord = { id: `selection-${uuidv4()}`, studentId: nextUser.userId, courseId: record.courseId, courseName: course.name, credit: course.credit, teacherName: course.teacherName, timeSlots: course.timeSlots, selectedAt: new Date().toISOString(), status: 'selected' };
      selections.push(nextRecord);
      course.selectedCount++;
      
      console.log(`用户 ${nextUser.userName} 从队列中取出，已选上课程 ${course.name}`);
    }
  }
  selections.splice(index, 1);
  res.json({ code: 0, message: 'success', data: null });
});

// Queue status
app.get('/api/queue/status', authenticateToken, (req, res) => {
  const { courseId } = req.query;
  const course = courses.find(c => c.id === courseId);
  if (!course) return res.json({ code: 0, message: 'success', data: { position: 0, status: 'error', recordId: null } });
  
  // 检查用户是否在队列中
  const courseQueue = selectionQueue.get(courseId) || [];
  const userQueueItem = courseQueue.find(item => item.userId === req.user.id);
  
  if (userQueueItem) {
    const position = courseQueue.findIndex(item => item.userId === req.user.id) + 1;
    
    // 检查是否可以选课（有人退选）
    if (course.selectedCount < course.capacity) {
      // 从队列中移除用户
      const updatedQueue = courseQueue.filter(item => item.userId !== req.user.id);
      selectionQueue.set(courseId, updatedQueue);
      
      // 为用户选课
      const record = { id: `selection-${uuidv4()}`, studentId: req.user.id, courseId, courseName: course.name, credit: course.credit, teacherName: course.teacherName, timeSlots: course.timeSlots, selectedAt: new Date().toISOString(), status: 'selected' };
      selections.push(record);
      course.selectedCount++;
      
      console.log(`用户 ${req.user.name} 排队成功，已选上课程 ${course.name}`);
      return res.json({ code: 0, message: 'success', data: { position: 0, status: 'success', recordId: record.id } });
    }
    
    return res.json({ code: 0, message: 'success', data: { position, status: 'queuing', recordId: null } });
  }
  
  // 检查用户是否已经选上
  const existingSelection = selections.find(s => s.studentId === req.user.id && s.courseId === courseId);
  if (existingSelection) {
    return res.json({ code: 0, message: 'success', data: { position: 0, status: 'success', recordId: existingSelection.id } });
  }
  
  return res.json({ code: 0, message: 'success', data: { position: 0, status: 'not_in_queue', recordId: null } });
});

// Statistics
app.get('/api/statistics/selection', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  const userSelections = selections.filter(s => s.studentId === req.user.id);
  const totalCredits = userSelections.reduce((sum, s) => sum + s.credit, 0);
  res.json({
    code: 0,
    message: 'success',
    data: {
      totalCourses: userSelections.length,
      selectedCourses: userSelections.length,
      totalCredits,
      remainingCredits: (user?.maxCredits || 30) - totalCredits,
    },
  });
});

// Student routes (Admin)
app.get('/api/admin/students', authenticateToken, requireAdmin, (req, res) => {
  let filtered = [...students];
  const { keyword, status, page = 1, pageSize = 10 } = req.query;
  if (keyword) filtered = filtered.filter(s => s.name.includes(keyword) || s.studentId.includes(keyword));
  if (status) filtered = filtered.filter(s => s.status === status);
  const start = (parseInt(page) - 1) * parseInt(pageSize);
  res.json({ code: 0, message: 'success', data: { list: filtered.slice(start, start + parseInt(pageSize)), total: filtered.length, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

app.post('/api/admin/students', authenticateToken, requireAdmin, (req, res) => {
  const student = { id: `student-${uuidv4()}`, ...req.body, status: 'active', selectedCredits: 0, createdAt: new Date().toISOString() };
  students.push(student);
  res.json({ code: 0, message: 'success', data: student });
});

app.put('/api/admin/students/:id', authenticateToken, requireAdmin, (req, res) => {
  const index = students.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ code: 404, message: '学生不存在', data: null });
  students[index] = { ...students[index], ...req.body };
  res.json({ code: 0, message: 'success', data: students[index] });
});

app.delete('/api/admin/students/:id', authenticateToken, requireAdmin, (req, res) => {
  const index = students.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ code: 404, message: '学生不存在', data: null });
  students[index].status = 'inactive';
  res.json({ code: 0, message: 'success', data: null });
});

// Teacher routes (Admin)
app.get('/api/admin/teachers', authenticateToken, (req, res) => {
  let filtered = [...teachers];
  const { keyword, department, page = 1, pageSize = 10 } = req.query;
  if (keyword) filtered = filtered.filter(t => t.name.includes(keyword) || t.teacherId.includes(keyword));
  if (department) filtered = filtered.filter(t => t.department === department);
  const start = (parseInt(page) - 1) * parseInt(pageSize);
  res.json({ code: 0, message: 'success', data: { list: filtered.slice(start, start + parseInt(pageSize)), total: filtered.length, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

app.post('/api/admin/teachers', authenticateToken, requireAdmin, (req, res) => {
  const teacher = { id: `teacher-${uuidv4()}`, ...req.body, status: 'active', courseCount: 0, createdAt: new Date().toISOString() };
  teachers.push(teacher);
  res.json({ code: 0, message: 'success', data: teacher });
});

app.put('/api/admin/teachers/:id', authenticateToken, (req, res) => {
  const index = teachers.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ code: 404, message: '教师不存在', data: null });
  teachers[index] = { ...teachers[index], ...req.body };
  res.json({ code: 0, message: 'success', data: teachers[index] });
});

// Course routes (Admin)
app.get('/api/admin/courses', authenticateToken, (req, res) => {
  let filtered = [...courses];
  const { keyword, category, status, page = 1, pageSize = 10 } = req.query;
  
  console.log('=== 管理员课程列表请求 ===');
  console.log('总课程数:', courses.length);
  console.log('所有课程:', courses.map(c => ({ id: c.id, name: c.name, status: c.status, teacherId: c.teacherId })));
  
  if (keyword) {
    const kw = keyword.toLowerCase();
    filtered = filtered.filter(c => c.name.toLowerCase().includes(kw) || c.code.toLowerCase().includes(kw));
  }
  if (category) filtered = filtered.filter(c => c.category === category);
  if (status) filtered = filtered.filter(c => c.status === status);
  const start = (parseInt(page) - 1) * parseInt(pageSize);
  console.log('过滤后课程数:', filtered.length);
  res.json({ code: 0, message: 'success', data: { list: filtered.slice(start, start + parseInt(pageSize)), total: filtered.length, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

app.post('/api/admin/courses', authenticateToken, requireAdmin, (req, res) => {
  const teacher = teachers.find(t => t.id === req.body.teacherId || t.id === req.body.teacherId?.replace('user-', ''));
  const course = { 
    id: `course-${uuidv4()}`, 
    ...req.body, 
    teacherName: teacher?.name || '未知教师',
    selectedCount: 0, 
    status: 'draft',
    timeSlots: req.body.timeSlots || [{ dayOfWeek: 1, startPeriod: 1, endPeriod: 2, weekRange: '1-16周', location: '待安排' }],
    tags: req.body.tags || [],
    selectionScope: req.body.selectionScope || ['全校学生'],
    createdAt: new Date().toISOString() 
  };
  courses.push(course);
  res.json({ code: 0, message: 'success', data: course });
});

app.put('/api/admin/courses/:id', authenticateToken, requireAdmin, (req, res) => {
  const index = courses.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ code: 404, message: '课程不存在', data: null });
  courses[index] = { ...courses[index], ...req.body };
  res.json({ code: 0, message: 'success', data: courses[index] });
});

// 老师提交课程审核
app.put('/api/teacher/courses/:id/submit', authenticateToken, (req, res) => {
  const course = courses.find(c => c.id === req.params.id && c.teacherId === req.user.id);
  if (!course) return res.status(404).json({ code: 404, message: '课程不存在或无权限', data: null });
  course.status = 'pending';
  res.json({ code: 0, message: 'success', data: course });
});

// 管理员审核通过
app.put('/api/admin/courses/:id/approve', authenticateToken, requireAdmin, (req, res) => {
  const course = courses.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ code: 404, message: '课程不存在', data: null });
  course.status = 'published';
  res.json({ code: 0, message: 'success', data: course });
});

// 管理员审核驳回
app.put('/api/admin/courses/:id/reject', authenticateToken, requireAdmin, (req, res) => {
  const course = courses.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ code: 404, message: '课程不存在', data: null });
  course.status = 'rejected';
  course.rejectReason = req.body.reason || '审核不通过';
  res.json({ code: 0, message: 'success', data: course });
});

// 发布课程（直接发布，跳过审核）
app.put('/api/admin/courses/:id/publish', authenticateToken, requireAdmin, (req, res) => {
  const course = courses.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ code: 404, message: '课程不存在', data: null });
  course.status = 'published';
  res.json({ code: 0, message: 'success', data: course });
});

// 撤回课程
app.put('/api/admin/courses/:id/withdraw', authenticateToken, requireAdmin, (req, res) => {
  const course = courses.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ code: 404, message: '课程不存在', data: null });
  course.status = 'draft';
  res.json({ code: 0, message: 'success', data: course });
});

// Statistics
app.get('/api/admin/statistics', authenticateToken, (req, res) => {
  res.json({
    code: 0,
    message: 'success',
    data: {
      totalCourses: courses.length,
      totalSelections: selections.length,
      totalStudents: students.length,
      totalTeachers: teachers.length,
      selectionRate: 78.5,
      avgCredits: 18.5,
      popularCourses: courses.slice(0, 10),
      departmentStats: [
        { name: '计算机学院', count: 450 },
        { name: '数学学院', count: 320 },
        { name: '物理学院', count: 280 },
        { name: '外语学院', count: 200 },
        { name: '体育部', count: 150 },
      ],
    },
  });
});

app.get('/api/admin/popular-courses', authenticateToken, (req, res) => {
  res.json({ code: 0, message: 'success', data: courses.slice(0, 10) });
});

// Audit routes
app.get('/api/admin/audits', authenticateToken, (req, res) => {
  let filtered = [...auditRecords];
  const { status, type, page = 1, pageSize = 10 } = req.query;
  if (status) filtered = filtered.filter(a => a.status === status);
  if (type) filtered = filtered.filter(a => a.type === type);
  const start = (parseInt(page) - 1) * parseInt(pageSize);
  res.json({ code: 0, message: 'success', data: { list: filtered.slice(start, start + parseInt(pageSize)), total: filtered.length, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

app.put('/api/admin/audits/:id/approve', authenticateToken, requireAdmin, (req, res) => {
  const audit = auditRecords.find(a => a.id === req.params.id);
  if (!audit) return res.status(404).json({ code: 404, message: '审核记录不存在', data: null });
  audit.status = 'approved';
  audit.reviewerId = req.user.id;
  audit.reviewerName = req.user.username;
  audit.reviewedAt = new Date().toISOString();
  res.json({ code: 0, message: 'success', data: audit });
});

app.put('/api/admin/audits/:id/reject', authenticateToken, (req, res) => {
  const audit = auditRecords.find(a => a.id === req.params.id);
  if (!audit) return res.status(404).json({ code: 404, message: '审核记录不存在', data: null });
  audit.status = 'rejected';
  audit.reviewerId = req.user.id;
  audit.reviewerName = req.user.username;
  audit.reviewComment = req.body.comment;
  audit.reviewedAt = new Date().toISOString();
  res.json({ code: 0, message: 'success', data: audit });
});

// Logs
app.get('/api/admin/logs', authenticateToken, requireAdmin, (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const start = (parseInt(page) - 1) * parseInt(pageSize);
  res.json({ code: 0, message: 'success', data: { list: operationLogs.slice(start, start + parseInt(pageSize)), total: operationLogs.length, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

// Notifications
app.get('/api/notifications', authenticateToken, (req, res) => {
  res.json({ code: 0, message: 'success', data: notifications });
});

// Teacher routes - 课程管理
app.get('/api/teacher/courses', authenticateToken, (req, res) => {
  const teacherCourses = courses.filter(c => c.teacherId === req.user.id);
  const { keyword, status, page = 1, pageSize = 10 } = req.query;
  let filtered = [...teacherCourses];
  if (keyword) filtered = filtered.filter(c => c.name.includes(keyword) || c.code.includes(keyword));
  if (status) filtered = filtered.filter(c => c.status === status);
  const start = (parseInt(page) - 1) * parseInt(pageSize);
  res.json({ code: 0, message: 'success', data: { list: filtered.slice(start, start + parseInt(pageSize)), total: filtered.length, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

// 教师创建课程
app.post('/api/teacher/courses', authenticateToken, (req, res) => {
  const course = { 
    id: `course-${uuidv4()}`, 
    ...req.body, 
    teacherId: req.user.id,
    teacherName: req.user.name,
    selectedCount: 0, 
    status: 'draft',
    timeSlots: req.body.timeSlots || [{ dayOfWeek: 1, startPeriod: 1, endPeriod: 2, weekRange: '1-16周', location: '待安排' }],
    tags: req.body.tags || [],
    selectionScope: req.body.selectionScope || ['全校学生'],
    createdAt: new Date().toISOString() 
  };
  courses.push(course);
  res.json({ code: 0, message: 'success', data: course });
});

// 教师编辑课程
app.put('/api/teacher/courses/:id', authenticateToken, (req, res) => {
  const course = courses.find(c => c.id === req.params.id && c.teacherId === req.user.id);
  if (!course) return res.status(404).json({ code: 404, message: '课程不存在或无权限', data: null });
  // 只能编辑草稿状态的课程
  if (course.status !== 'draft' && course.status !== 'rejected') {
    return res.status(400).json({ code: 400, message: '只能编辑草稿或审核不通过的课程', data: null });
  }
  courses[courses.findIndex(c => c.id === req.params.id)] = { ...course, ...req.body };
  res.json({ code: 0, message: 'success', data: courses[courses.findIndex(c => c.id === req.params.id)] });
});

// 教师删除课程
app.delete('/api/teacher/courses/:id', authenticateToken, (req, res) => {
  const course = courses.find(c => c.id === req.params.id && c.teacherId === req.user.id);
  if (!course) return res.status(404).json({ code: 404, message: '课程不存在或无权限', data: null });
  // 只能删除草稿状态的课程
  if (course.status !== 'draft') {
    return res.status(400).json({ code: 400, message: '只能删除草稿状态的课程', data: null });
  }
  courses = courses.filter(c => c.id !== req.params.id);
  res.json({ code: 0, message: 'success', data: null });
});

app.get('/api/teacher/students', authenticateToken, (req, res) => {
  const { keyword, page = 1, pageSize = 10 } = req.query;
  let filtered = [...students];
  if (keyword) filtered = filtered.filter(s => s.name.includes(keyword) || s.studentId.includes(keyword));
  const start = (parseInt(page) - 1) * parseInt(pageSize);
  res.json({ code: 0, message: 'success', data: { list: filtered.slice(start, start + parseInt(pageSize)), total: filtered.length, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

app.get('/api/teacher/schedule', authenticateToken, (req, res) => {
  const teacherCourses = courses.filter(c => c.teacherId === req.user.id);
  const schedule = teacherCourses.map(c => ({
    id: `schedule-${c.id}`,
    courseId: c.id,
    courseName: c.name,
    credit: c.credit,
    teacherName: c.teacherName,
    timeSlots: c.timeSlots,
    selectedAt: new Date().toISOString(),
    status: 'selected',
  }));
  res.json({ code: 0, message: 'success', data: schedule });
});

// 课程评价API
// 获取课程评价列表
app.get('/api/courses/:id/reviews', authenticateToken, (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  let filtered = courseReviews.filter(r => r.courseId === req.params.id);
  
  // 计算平均评分
  const avgRating = filtered.length > 0 
    ? (filtered.reduce((sum, r) => sum + r.rating, 0) / filtered.length).toFixed(1)
    : 0;
  
  // 统计各星级评价数量
  const ratingStats = {
    5: filtered.filter(r => r.rating === 5).length,
    4: filtered.filter(r => r.rating === 4).length,
    3: filtered.filter(r => r.rating === 3).length,
    2: filtered.filter(r => r.rating === 2).length,
    1: filtered.filter(r => r.rating === 1).length,
  };
  
  const start = (parseInt(page) - 1) * parseInt(pageSize);
  const paginated = filtered.slice(start, start + parseInt(pageSize));
  
  res.json({ 
    code: 0, 
    message: 'success', 
    data: { 
      list: paginated, 
      total: filtered.length, 
      page: parseInt(page), 
      pageSize: parseInt(pageSize),
      avgRating,
      ratingStats
    } 
  });
});

// 学生提交评价
app.post('/api/courses/:id/reviews', authenticateToken, (req, res) => {
  console.log('收到评价请求:', {
    courseId: req.params.id,
    userId: req.user.id,
    userRole: req.user.role,
    body: req.body
  });
  
  if (req.user.role !== 'student') {
    return res.status(403).json({ code: 403, message: '只有学生可以评价课程', data: null });
  }
  
  // 检查学生是否选了这门课
  console.log('选课记录:', selections.filter(s => s.studentId === req.user.id));
  const hasSelected = selections.some(s => s.studentId === req.user.id && s.courseId === req.params.id);
  console.log('是否选了这门课:', hasSelected);
  
  if (!hasSelected) {
    return res.status(400).json({ code: 400, message: '只有选了这门课的学生才能评价', data: null });
  }
  
  // 检查是否已经评价过
  const existingReview = courseReviews.find(r => r.courseId === req.params.id && r.studentId === req.user.id);
  if (existingReview) {
    return res.status(400).json({ code: 400, message: '您已经评价过这门课程', data: null });
  }
  
  const { rating, content, tags, isAnonymous } = req.body;
  
  // 获取课程信息
  const course = courses.find(c => c.id === req.params.id);
  
  const newReview = {
    id: `review-${uuidv4()}`,
    courseId: req.params.id,
    courseName: course ? course.name : '未知课程',
    studentId: req.user.id,
    studentName: isAnonymous ? '****' : req.user.name,
    isAnonymous: isAnonymous || false,
    rating,
    content,
    tags: tags || [],
    createdAt: new Date().toISOString()
  };
  
  courseReviews.push(newReview);
  console.log('评价提交成功:', newReview);
  res.json({ code: 0, message: '评价提交成功', data: newReview });
});

// 教师查看自己课程的评价
app.get('/api/teacher/reviews', authenticateToken, (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ code: 403, message: '只有教师可以查看', data: null });
  }
  
  const teacherCourses = courses.filter(c => c.teacherId === req.user.id);
  const courseIds = teacherCourses.map(c => c.id);
  
  let filtered = courseReviews.filter(r => courseIds.includes(r.courseId));
  
  // 如果指定了课程ID，筛选该课程的评价
  if (req.query.courseId) {
    filtered = filtered.filter(r => r.courseId === req.query.courseId);
  }
  
  // 为每个评价添加课程名称
  const reviewsWithCourseName = filtered.map(review => {
    const course = teacherCourses.find(c => c.id === review.courseId);
    return {
      ...review,
      courseName: course ? course.name : '未知课程'
    };
  });
  
  // 按课程分组统计
  const courseStats = teacherCourses.map(course => {
    const courseReviewsList = courseReviews.filter(r => r.courseId === course.id && courseIds.includes(r.courseId));
    const avgRating = courseReviewsList.length > 0
      ? (courseReviewsList.reduce((sum, r) => sum + r.rating, 0) / courseReviewsList.length).toFixed(1)
      : 0;
    return {
      courseId: course.id,
      courseName: course.name,
      reviewCount: courseReviewsList.length,
      avgRating
    };
  });
  
  const { page = 1, pageSize = 10 } = req.query;
  const start = (parseInt(page) - 1) * parseInt(pageSize);
  
  res.json({
    code: 0,
    message: 'success',
    data: {
      list: reviewsWithCourseName.slice(start, start + parseInt(pageSize)),
      total: filtered.length,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      courseStats
    }
  });
});

// 管理员查看所有评价
app.get('/api/admin/reviews', authenticateToken, (req, res) => {
  const { keyword, courseId, page = 1, pageSize = 10 } = req.query;
  let filtered = [...courseReviews];
  
  if (keyword) {
    filtered = filtered.filter(r => 
      r.content.includes(keyword) || 
      r.studentName.includes(keyword)
    );
  }
  if (courseId) {
    filtered = filtered.filter(r => r.courseId === courseId);
  }
  
  // 为每个评价添加课程名称（如果没有的话）
  const reviewsWithCourseName = filtered.map(review => {
    if (!review.courseName) {
      const course = courses.find(c => c.id === review.courseId);
      return {
        ...review,
        courseName: course ? course.name : '未知课程'
      };
    }
    return review;
  });
  
  const start = (parseInt(page) - 1) * parseInt(pageSize);
  
  res.json({
    code: 0,
    message: 'success',
    data: {
      list: reviewsWithCourseName.slice(start, start + parseInt(pageSize)),
      total: filtered.length,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  });
});

// 管理员删除评价
app.delete('/api/admin/reviews/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superAdmin') {
    return res.status(403).json({ code: 403, message: '只有管理员可以删除评价', data: null });
  }
  
  const reviewIndex = courseReviews.findIndex(r => r.id === req.params.id);
  if (reviewIndex === -1) {
    return res.status(404).json({ code: 404, message: '评价不存在', data: null });
  }
  
  courseReviews.splice(reviewIndex, 1);
  res.json({ code: 0, message: '评价已删除', data: null });
});

// 报表统计API
app.get('/api/admin/reports/selection', authenticateToken, (req, res) => {
  const { semester, department } = req.query;
  
  // 模拟统计数据
  const stats = {
    totalStudents: students.length,
    totalCourses: courses.length,
    totalSelections: selections.length,
    completionRate: 85.5,
    byDepartment: [
      { name: '计算机学院', count: 156 },
      { name: '数学学院', count: 89 },
      { name: '物理学院', count: 67 },
      { name: '外语学院', count: 45 },
    ],
    byGrade: [
      { name: '2021级', count: 89 },
      { name: '2022级', count: 112 },
      { name: '2023级', count: 98 },
      { name: '2024级', count: 58 },
    ],
    trend: [
      { date: '2024-01-01', count: 12 },
      { date: '2024-01-02', count: 25 },
      { date: '2024-01-03', count: 45 },
      { date: '2024-01-04', count: 67 },
      { date: '2024-01-05', count: 89 },
    ]
  };
  
  res.json({ code: 0, message: 'success', data: stats });
});

app.get('/api/admin/reports/course-popularity', authenticateToken, (req, res) => {
  const data = {
    hotCourses: courses.slice(0, 10).map(c => ({
      name: c.name,
      selected: c.selectedCount,
      capacity: c.capacity,
      rate: c.selectedCount / c.capacity
    })),
    byCategory: [
      { name: '必修', count: 156 },
      { name: '选修', count: 89 },
      { name: '通识', count: 45 },
    ],
    byTeacher: [
      { name: '张教授', count: 156 },
      { name: '李教授', count: 89 },
      { name: '王教授', count: 67 },
    ]
  };
  
  res.json({ code: 0, message: 'success', data });
});

app.get('/api/admin/reports/teacher-workload', authenticateToken, (req, res) => {
  const data = {
    teachers: [
      { name: '张教授', courseCount: 3, studentCount: 156, hours: 96 },
      { name: '李教授', courseCount: 2, studentCount: 89, hours: 64 },
      { name: '王教授', courseCount: 2, studentCount: 67, hours: 64 },
    ],
    summary: {
      totalTeachers: 15,
      totalHours: 480,
      avgStudents: 42
    }
  };
  
  res.json({ code: 0, message: 'success', data });
});

app.get('/api/admin/reports/student-credit', authenticateToken, (req, res) => {
  const data = {
    students: students.slice(0, 10).map(s => ({
      name: s.name,
      studentId: s.studentId,
      completed: s.selectedCredits,
      required: s.maxCredits,
      progress: s.selectedCredits / s.maxCredits
    })),
    summary: {
      totalStudents: students.length,
      completedCount: 89,
      completionRate: 78.5
    },
    byRange: [
      { range: '0-20学分', count: 12 },
      { range: '21-40学分', count: 45 },
      { range: '41-60学分', count: 89 },
      { range: '60学分以上', count: 23 },
    ]
  };
  
  res.json({ code: 0, message: 'success', data });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 后端服务已启动: http://localhost:${PORT}`);
  console.log(`📚 API 文档: http://localhost:${PORT}/api`);
});
