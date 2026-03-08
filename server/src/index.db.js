import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query, getConnection } from './config/database.js';

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your-secret-key';

// 中间件
app.use(cors());
app.use(express.json());

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// JWT认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录', data: null });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ code: 403, message: 'Token无效', data: null });
    }
    req.user = user;
    next();
  });
};

// ==================== 认证API ====================

// 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = await query(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误', data: null });
    }
    
    const user = users[0];
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ code: 0, message: 'success', data: { token, user: userWithoutPassword } });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 获取当前用户信息
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const users = await query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在', data: null });
    }
    const { password: _, ...userWithoutPassword } = users[0];
    res.json({ code: 0, message: 'success', data: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 登出
app.post('/api/auth/logout', (req, res) => {
  res.json({ code: 0, message: 'success', data: null });
});

// ==================== 课程API ====================

// 获取课程分类
app.get('/api/courses/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await query(
      'SELECT DISTINCT category FROM courses WHERE status = ?',
      ['published']
    );
    res.json({
      code: 0,
      message: 'success',
      data: categories.map(c => c.category).filter(Boolean)
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 获取课程列表
app.get('/api/courses', authenticateToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword = '', category, department, semester, onlyAvailable } = req.query;
    
    let sql = 'SELECT * FROM courses WHERE 1=1';
    const params = [];
    
    if (keyword) {
      sql += ' AND (name LIKE ? OR code LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (department) {
      sql += ' AND department = ?';
      params.push(department);
    }
    if (semester) {
      sql += ' AND semester = ?';
      params.push(semester);
    }
    if (req.user.role === 'student') {
      sql += ' AND status = ?';
      params.push('published');
    }
    
    const courses = await query(sql, params);
    
    // 获取每门课程的时间
    for (const course of courses) {
      const timeSlots = await query(
        'SELECT day_of_week as dayOfWeek, start_period as startPeriod, end_period as endPeriod, week_range as weekRange, location FROM course_time_slots WHERE course_id = ?',
        [course.id]
      );
      course.timeSlots = timeSlots;
      // 转换字段名为驼峰命名
      course.selectedCount = course.selected_count;
      course.teacherName = course.teacher_name;
      course.teachingMethod = course.teaching_method;
    }
    
    // 过滤可选课程
    let filteredCourses = courses;
    if (onlyAvailable === 'true') {
      filteredCourses = courses.filter(c => c.selected_count < c.capacity);
    }
    
    // 分页
    const start = (parseInt(page) - 1) * parseInt(pageSize);
    const paginatedCourses = filteredCourses.slice(start, start + parseInt(pageSize));
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        list: paginatedCourses,
        total: filteredCourses.length,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('课程列表错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 获取课程详情
app.get('/api/courses/:id', authenticateToken, async (req, res) => {
  try {
    const courses = await query('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    
    if (courses.length === 0) {
      return res.status(404).json({ code: 404, message: '课程不存在', data: null });
    }
    
    const course = courses[0];
    
    // 获取课程时间
    const timeSlots = await query(
      'SELECT day_of_week as dayOfWeek, start_period as startPeriod, end_period as endPeriod, week_range as weekRange, location FROM course_time_slots WHERE course_id = ?',
      [req.params.id]
    );
    course.timeSlots = timeSlots;
    // 转换字段名为驼峰命名
    course.selectedCount = course.selected_count;
    course.teacherName = course.teacher_name;
    course.teachingMethod = course.teaching_method;
    
    res.json({ code: 0, message: 'success', data: course });
  } catch (error) {
    console.error('课程详情错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// ==================== 选课API ====================

// 获取我的选课记录
app.get('/api/selection/my', authenticateToken, async (req, res) => {
  try {
    const selections = await query(
      `SELECT s.id, s.student_id, s.course_id, s.status, s.selected_at,
        c.name as courseName, c.credit, c.teacher_name as teacherName
      FROM selections s
      JOIN courses c ON s.course_id = c.id
      WHERE s.student_id = ? AND s.status = ?`,
      [req.user.id, 'selected']
    );
    
    // 获取每门课程的时间并转换字段名
    for (const selection of selections) {
      const timeSlots = await query(
        'SELECT day_of_week as dayOfWeek, start_period as startPeriod, end_period as endPeriod, week_range as weekRange, location FROM course_time_slots WHERE course_id = ?',
        [selection.course_id]
      );
      selection.timeSlots = timeSlots;
      // 转换字段名为驼峰命名
      selection.courseId = selection.course_id;
      selection.studentId = selection.student_id;
      selection.selectedAt = selection.selected_at;
    }
    
    res.json({ code: 0, message: 'success', data: selections });
  } catch (error) {
    console.error('选课记录错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 验证选课
app.get('/api/selection/validate', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.query;
    
    // 检查是否已选
    const existing = await query(
      'SELECT * FROM selections WHERE student_id = ? AND course_id = ? AND status = ?',
      [req.user.id, courseId, 'selected']
    );
    
    if (existing.length > 0) {
      return res.json({ code: 0, message: '已选该课程', data: { passed: false, reason: 'already_selected' } });
    }
    
    // 检查课程容量
    const courses = await query('SELECT * FROM courses WHERE id = ?', [courseId]);
    if (courses.length === 0) {
      return res.json({ code: 0, message: '课程不存在', data: { passed: false, reason: 'course_not_found' } });
    }
    
    const course = courses[0];
    if (course.selected_count >= course.capacity) {
      return res.json({ code: 0, message: '课程已满', data: { passed: false, reason: 'course_full' } });
    }
    
    res.json({ code: 0, message: '可以选课', data: { passed: true } });
  } catch (error) {
    console.error('选课验证错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 选课
app.post('/api/selection', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.body;
    
    // 检查是否已有选课记录（包括已退选的）
    const existing = await query(
      'SELECT * FROM selections WHERE student_id = ? AND course_id = ?',
      [req.user.id, courseId]
    );
    
    if (existing.length > 0) {
      const record = existing[0];
      if (record.status === 'selected') {
        return res.status(400).json({ code: 400, message: '已经选过这门课了', data: null });
      }
      // 如果是退选状态，更新为已选
      if (record.status === 'withdrawn') {
        await query(
          'UPDATE selections SET status = ?, selected_at = NOW() WHERE id = ?',
          ['selected', record.id]
        );
        // 更新课程选课人数
        await query(
          'UPDATE courses SET selected_count = selected_count + 1 WHERE id = ?',
          [courseId]
        );
        return res.json({ code: 0, message: '选课成功', data: { id: record.id } });
      }
    }
    
    // 获取课程信息
    const courses = await query('SELECT * FROM courses WHERE id = ?', [courseId]);
    if (courses.length === 0) {
      return res.status(404).json({ code: 404, message: '课程不存在', data: null });
    }
    
    const course = courses[0];
    if (course.selected_count >= course.capacity) {
      return res.status(400).json({ code: 400, message: '课程已满', data: null });
    }
    
    // 创建选课记录
    const selectionId = `selection-${uuidv4()}`;
    await query(
      'INSERT INTO selections (id, student_id, course_id, status) VALUES (?, ?, ?, ?)',
      [selectionId, req.user.id, courseId, 'selected']
    );
    
    // 更新课程选课人数
    await query(
      'UPDATE courses SET selected_count = selected_count + 1 WHERE id = ?',
      [courseId]
    );
    
    res.json({ code: 0, message: '选课成功', data: { id: selectionId } });
  } catch (error) {
    console.error('选课错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 退课
app.delete('/api/selection/:id', authenticateToken, async (req, res) => {
  try {
    const selections = await query(
      'SELECT * FROM selections WHERE id = ? AND student_id = ?',
      [req.params.id, req.user.id]
    );
    
    if (selections.length === 0) {
      return res.status(404).json({ code: 404, message: '选课记录不存在', data: null });
    }
    
    const selection = selections[0];
    
    // 更新选课记录状态
    await query(
      'UPDATE selections SET status = ?, withdrawn_at = NOW() WHERE id = ?',
      ['withdrawn', req.params.id]
    );
    
    // 更新课程选课人数
    await query(
      'UPDATE courses SET selected_count = selected_count - 1 WHERE id = ?',
      [selection.course_id]
    );
    
    res.json({ code: 0, message: '退课成功', data: null });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// ==================== 课程评价API ====================

// 获取课程评价
app.get('/api/courses/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    
    const reviews = await query(
      'SELECT * FROM course_reviews WHERE course_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );
    
    // 计算统计数据
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;
    
    const ratingStats = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };
    
    const start = (parseInt(page) - 1) * parseInt(pageSize);
    const paginatedReviews = reviews.slice(start, start + parseInt(pageSize));
    
    // 解析tags
    const processedReviews = paginatedReviews.map(r => ({
      ...r,
      tags: r.tags ? JSON.parse(r.tags) : []
    }));
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        list: processedReviews,
        total: reviews.length,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        avgRating,
        ratingStats
      }
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 提交评价
app.post('/api/courses/:id/reviews', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ code: 403, message: '只有学生可以评价课程', data: null });
    }
    
    // 检查是否选了这门课
    const selections = await query(
      'SELECT * FROM selections WHERE student_id = ? AND course_id = ? AND status = ?',
      [req.user.id, req.params.id, 'selected']
    );
    
    if (selections.length === 0) {
      return res.status(400).json({ code: 400, message: '只有选了这门课的学生才能评价', data: null });
    }
    
    // 检查是否已评价
    const existing = await query(
      'SELECT * FROM course_reviews WHERE course_id = ? AND student_id = ?',
      [req.params.id, req.user.id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ code: 400, message: '您已经评价过这门课程', data: null });
    }
    
    const { rating, content, tags, isAnonymous } = req.body;
    
    // 获取课程名称
    const courses = await query('SELECT name FROM courses WHERE id = ?', [req.params.id]);
    const courseName = courses.length > 0 ? courses[0].name : '未知课程';
    
    const reviewId = `review-${uuidv4()}`;
    await query(
      `INSERT INTO course_reviews (id, course_id, course_name, student_id, student_name, is_anonymous, rating, content, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reviewId,
        req.params.id,
        courseName,
        req.user.id,
        isAnonymous ? '****' : req.user.name,
        isAnonymous || false,
        rating,
        content,
        JSON.stringify(tags || [])
      ]
    );
    
    res.json({ code: 0, message: '评价提交成功', data: { id: reviewId } });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// ==================== 教师API ====================

// 获取教师的课程
app.get('/api/teacher/courses', authenticateToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '' } = req.query;
    
    let sql = 'SELECT * FROM courses WHERE teacher_id = ?';
    const params = [req.user.id];
    
    if (keyword) {
      sql += ' AND (name LIKE ? OR code LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    const courses = await query(sql, params);
    
    // 获取每门课程的时间
    for (const course of courses) {
      const timeSlots = await query(
        'SELECT day_of_week as dayOfWeek, start_period as startPeriod, end_period as endPeriod, week_range as weekRange, location FROM course_time_slots WHERE course_id = ?',
        [course.id]
      );
      course.timeSlots = timeSlots;
      // 转换字段名为驼峰命名
      course.selectedCount = course.selected_count;
      course.teacherName = course.teacher_name;
      course.teachingMethod = course.teaching_method;
    }
    
    const start = (parseInt(page) - 1) * parseInt(pageSize);
    const paginatedCourses = courses.slice(start, start + parseInt(pageSize));
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        list: paginatedCourses,
        total: courses.length,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('教师课程错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 创建课程（教师）
app.post('/api/teacher/courses', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ code: 403, message: '只有教师可以创建课程', data: null });
    }
    
    const { code, name, credit, hours, capacity, department, category, semester, teachingMethod, timeSlots, tags } = req.body;
    
    // 检查课程代码是否已存在
    const existing = await query('SELECT * FROM courses WHERE code = ?', [code]);
    if (existing.length > 0) {
      return res.status(400).json({ code: 400, message: '课程代码已存在', data: null });
    }
    
    const courseId = `course-${uuidv4()}`;
    
    // 创建课程
    await query(
      `INSERT INTO courses (id, code, name, credit, hours, capacity, selected_count, teacher_id, teacher_name, department, category, semester, teaching_method, status, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [courseId, code, name, credit, hours, capacity, 0, req.user.id, req.user.name, department, category || 'elective', semester || '2024-1', teachingMethod || 'offline', 'draft', JSON.stringify(tags || [])]
    );
    
    // 添加课程时间
    if (timeSlots && Array.isArray(timeSlots)) {
      for (const slot of timeSlots) {
        await query(
          `INSERT INTO course_time_slots (course_id, day_of_week, start_period, end_period, week_range, location) VALUES (?, ?, ?, ?, ?, ?)`,
          [courseId, slot.dayOfWeek, slot.startPeriod, slot.endPeriod, slot.weekRange || '1-16周', slot.location || '']
        );
      }
    }
    
    res.json({ code: 0, message: '课程创建成功', data: { id: courseId } });
  } catch (error) {
    console.error('创建课程错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 更新课程（教师）
app.put('/api/teacher/courses/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ code: 403, message: '只有教师可以更新课程', data: null });
    }
    
    const { name, credit, hours, capacity, department, category, semester, teachingMethod, timeSlots, tags, status } = req.body;
    
    // 检查课程是否存在且属于该教师
    const courses = await query('SELECT * FROM courses WHERE id = ? AND teacher_id = ?', [req.params.id, req.user.id]);
    if (courses.length === 0) {
      return res.status(404).json({ code: 404, message: '课程不存在或无权修改', data: null });
    }
    
    // 更新课程
    await query(
      `UPDATE courses SET name = ?, credit = ?, hours = ?, capacity = ?, department = ?, category = ?, semester = ?, teaching_method = ?, status = ?, tags = ? WHERE id = ?`,
      [name, credit, hours, capacity, department, category, semester, teachingMethod, status || 'draft', JSON.stringify(tags || []), req.params.id]
    );
    
    // 删除原有时间并重新添加
    await query('DELETE FROM course_time_slots WHERE course_id = ?', [req.params.id]);
    
    if (timeSlots && Array.isArray(timeSlots)) {
      for (const slot of timeSlots) {
        await query(
          `INSERT INTO course_time_slots (course_id, day_of_week, start_period, end_period, week_range, location) VALUES (?, ?, ?, ?, ?, ?)`,
          [req.params.id, slot.dayOfWeek, slot.startPeriod, slot.endPeriod, slot.weekRange || '1-16周', slot.location || '']
        );
      }
    }
    
    res.json({ code: 0, message: '课程更新成功', data: null });
  } catch (error) {
    console.error('更新课程错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 发布课程（教师）
app.post('/api/teacher/courses/:id/publish', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ code: 403, message: '只有教师可以发布课程', data: null });
    }
    
    // 检查课程是否存在且属于该教师
    const courses = await query('SELECT * FROM courses WHERE id = ? AND teacher_id = ?', [req.params.id, req.user.id]);
    if (courses.length === 0) {
      return res.status(404).json({ code: 404, message: '课程不存在或无权操作', data: null });
    }
    
    await query('UPDATE courses SET status = ? WHERE id = ?', ['published', req.params.id]);
    
    res.json({ code: 0, message: '课程发布成功', data: null });
  } catch (error) {
    console.error('发布课程错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 提交课程审核（教师）
app.put('/api/teacher/courses/:id/submit', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ code: 403, message: '只有教师可以提交课程审核', data: null });
    }
    
    // 检查课程是否存在且属于该教师
    const courses = await query('SELECT * FROM courses WHERE id = ? AND teacher_id = ?', [req.params.id, req.user.id]);
    if (courses.length === 0) {
      return res.status(404).json({ code: 404, message: '课程不存在或无权操作', data: null });
    }
    
    await query('UPDATE courses SET status = ? WHERE id = ?', ['pending', req.params.id]);
    
    res.json({ code: 0, message: '课程已提交审核', data: null });
  } catch (error) {
    console.error('提交审核错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 获取教师课程的学生
app.get('/api/teacher/students', authenticateToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '' } = req.query;
    
    let sql = `
      SELECT s.id as selectionId, s.selected_at as selectedAt, u.id as studentId, u.name as name, 
        u.student_id as studentNumber, u.department, u.major, u.grade, u.class_name as className,
        c.name as courseName, c.credit
      FROM selections s
      JOIN users u ON s.student_id = u.id
      JOIN courses c ON s.course_id = c.id
      WHERE c.teacher_id = ? AND s.status = ?
    `;
    const params = [req.user.id, 'selected'];
    
    if (keyword) {
      sql += ' AND (u.name LIKE ? OR u.student_id LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    sql += ' ORDER BY s.selected_at DESC';
    
    const students = await query(sql, params);
    
    const start = (parseInt(page) - 1) * parseInt(pageSize);
    const paginatedStudents = students.slice(start, start + parseInt(pageSize));
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        list: paginatedStudents,
        total: students.length,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('教师学生列表错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 教师查看评价
app.get('/api/teacher/reviews', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.query;
    
    let sql = `
      SELECT cr.id, cr.course_id as courseId, cr.course_name as courseName, 
        cr.student_id as studentId, cr.student_name as studentName, 
        cr.is_anonymous as isAnonymous, cr.rating, cr.content, cr.tags, 
        cr.created_at as createdAt
      FROM course_reviews cr
      JOIN courses c ON cr.course_id = c.id
      WHERE c.teacher_id = ?
    `;
    const params = [req.user.id];
    
    if (courseId) {
      sql += ' AND cr.course_id = ?';
      params.push(courseId);
    }
    
    sql += ' ORDER BY cr.created_at DESC';
    
    const reviews = await query(sql, params);
    
    // 获取课程统计
    const courseStats = await query(
      `SELECT c.id as courseId, c.name as courseName, 
        COUNT(cr.id) as reviewCount,
        COALESCE(AVG(cr.rating), 0) as avgRating
      FROM courses c
      LEFT JOIN course_reviews cr ON c.id = cr.course_id
      WHERE c.teacher_id = ?
      GROUP BY c.id`,
      [req.user.id]
    );
    
    const processedReviews = reviews.map(r => {
      let tags = [];
      try {
        if (r.tags) {
          if (typeof r.tags === 'string') {
            tags = r.tags.startsWith('[') ? JSON.parse(r.tags) : r.tags.split(',');
          } else if (Array.isArray(r.tags)) {
            tags = r.tags;
          }
        }
      } catch (e) {
        tags = [];
      }
      return {
        ...r,
        tags
      };
    });
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        list: processedReviews,
        total: reviews.length,
        courseStats
      }
    });
  } catch (error) {
    console.error('教师评价列表错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 获取教师课表
app.get('/api/teacher/schedule', authenticateToken, async (req, res) => {
  try {
    const courses = await query(
      'SELECT * FROM courses WHERE teacher_id = ? AND status = ?',
      [req.user.id, 'published']
    );
    
    for (const course of courses) {
      const timeSlots = await query(
        'SELECT day_of_week as dayOfWeek, start_period as startPeriod, end_period as endPeriod, week_range as weekRange, location FROM course_time_slots WHERE course_id = ?',
        [course.id]
      );
      course.timeSlots = timeSlots;
      course.selectedCount = course.selected_count;
      course.teacherName = course.teacher_name;
      course.teachingMethod = course.teaching_method;
    }
    
    res.json({
      code: 0,
      message: 'success',
      data: courses
    });
  } catch (error) {
    console.error('教师课表错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// ==================== 管理员API ====================

// 获取学生列表
app.get('/api/admin/students', authenticateToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '', status } = req.query;
    
    let sql = 'SELECT * FROM users WHERE role = ?';
    const params = ['student'];
    
    if (keyword) {
      sql += ' AND (name LIKE ? OR student_id LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    const students = await query(sql, params);
    
    // 转换字段名为驼峰命名
    const processedStudents = students.map(s => ({
      ...s,
      studentId: s.student_id,
      studentNumber: s.student_id,
      className: s.class_name,
      maxCredits: s.max_credits,
      selectedCredits: s.selected_credits,
      createdAt: s.created_at
    }));
    
    const start = (parseInt(page) - 1) * parseInt(pageSize);
    const paginatedStudents = processedStudents.slice(start, start + parseInt(pageSize));
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        list: paginatedStudents,
        total: students.length,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('学生列表错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 获取教师列表
app.get('/api/admin/teachers', authenticateToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '', department } = req.query;
    
    let sql = 'SELECT * FROM users WHERE role = ?';
    const params = ['teacher'];
    
    if (keyword) {
      sql += ' AND (name LIKE ? OR teacher_id LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (department) {
      sql += ' AND department = ?';
      params.push(department);
    }
    
    const teachers = await query(sql, params);
    
    // 转换字段名为驼峰命名
    const processedTeachers = teachers.map(t => ({
      ...t,
      teacherId: t.teacher_id || t.id,
      teacherNumber: t.teacher_id,
      createdAt: t.created_at
    }));
    
    const start = (parseInt(page) - 1) * parseInt(pageSize);
    const paginatedTeachers = processedTeachers.slice(start, start + parseInt(pageSize));
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        list: paginatedTeachers,
        total: teachers.length,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('教师列表错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 获取课程列表（管理员）
app.get('/api/admin/courses', authenticateToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '', category, status } = req.query;
    
    let sql = 'SELECT * FROM courses WHERE 1=1';
    const params = [];
    
    if (keyword) {
      sql += ' AND (name LIKE ? OR code LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    const courses = await query(sql, params);
    
    // 获取每门课程的时间
    for (const course of courses) {
      const timeSlots = await query(
        'SELECT day_of_week as dayOfWeek, start_period as startPeriod, end_period as endPeriod, week_range as weekRange, location FROM course_time_slots WHERE course_id = ?',
        [course.id]
      );
      course.timeSlots = timeSlots;
      // 转换字段名为驼峰命名
      course.selectedCount = course.selected_count;
      course.teacherName = course.teacher_name;
      course.teachingMethod = course.teaching_method;
    }
    
    const start = (parseInt(page) - 1) * parseInt(pageSize);
    const paginatedCourses = courses.slice(start, start + parseInt(pageSize));
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        list: paginatedCourses,
        total: courses.length,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('管理员课程列表错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 审核通过课程（管理员）
app.put('/api/admin/courses/:id/approve', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ code: 403, message: '只有管理员可以审核课程', data: null });
    }
    
    const courses = await query('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    if (courses.length === 0) {
      return res.status(404).json({ code: 404, message: '课程不存在', data: null });
    }
    
    await query('UPDATE courses SET status = ? WHERE id = ?', ['published', req.params.id]);
    
    res.json({ code: 0, message: '课程审核通过', data: null });
  } catch (error) {
    console.error('审核通过错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 审核驳回课程（管理员）
app.put('/api/admin/courses/:id/reject', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ code: 403, message: '只有管理员可以审核课程', data: null });
    }
    
    const courses = await query('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    if (courses.length === 0) {
      return res.status(404).json({ code: 404, message: '课程不存在', data: null });
    }
    
    await query('UPDATE courses SET status = ? WHERE id = ?', ['draft', req.params.id]);
    
    res.json({ code: 0, message: '课程已驳回', data: null });
  } catch (error) {
    console.error('审核驳回错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 撤回课程（管理员）
app.put('/api/admin/courses/:id/withdraw', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ code: 403, message: '只有管理员可以撤回课程', data: null });
    }
    
    const courses = await query('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    if (courses.length === 0) {
      return res.status(404).json({ code: 404, message: '课程不存在', data: null });
    }
    
    const course = courses[0];
    
    // 检查是否有学生已选课
    const selections = await query(
      'SELECT COUNT(*) as count FROM selections WHERE course_id = ? AND status = ?',
      [req.params.id, 'selected']
    );
    
    const selectedCount = selections[0].count;
    
    if (selectedCount > 0) {
      // 有学生已选课，需要确认是否强制撤回
      const { force } = req.query;
      
      if (force !== 'true') {
        return res.status(400).json({ 
          code: 400, 
          message: `该课程已有 ${selectedCount} 名学生选课，确定要撤回吗？撤回后将自动退选所有学生。`, 
          data: { selectedCount, needConfirm: true }
        });
      }
      
      // 强制撤回：先退选所有学生
      await query(
        'UPDATE selections SET status = ? WHERE course_id = ? AND status = ?',
        ['withdrawn', req.params.id, 'selected']
      );
      
      // 重置选课人数
      await query('UPDATE courses SET selected_count = 0 WHERE id = ?', [req.params.id]);
    }
    
    // 更新课程状态为草稿
    await query('UPDATE courses SET status = ? WHERE id = ?', ['draft', req.params.id]);
    
    res.json({ 
      code: 0, 
      message: selectedCount > 0 ? `课程已撤回，已退选 ${selectedCount} 名学生` : '课程已撤回', 
      data: null 
    });
  } catch (error) {
    console.error('撤回课程错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 获取评价列表（管理员）
app.get('/api/admin/reviews', authenticateToken, async (req, res) => {
  try {
    const { keyword, courseId, page = 1, pageSize = 10 } = req.query;
    
    let sql = 'SELECT * FROM course_reviews WHERE 1=1';
    const params = [];
    
    if (keyword) {
      sql += ' AND (content LIKE ? OR student_name LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (courseId) {
      sql += ' AND course_id = ?';
      params.push(courseId);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const reviews = await query(sql, params);
    
    const processedReviews = reviews.map(r => {
      let tags = [];
      try {
        if (r.tags) {
          // 尝试解析 JSON
          if (typeof r.tags === 'string' && r.tags.startsWith('[')) {
            tags = JSON.parse(r.tags);
          } else if (typeof r.tags === 'string') {
            // 如果不是 JSON 数组格式，按逗号分割
            tags = r.tags.split(',').filter(Boolean);
          }
        }
      } catch (e) {
        tags = [];
      }
      return {
        id: r.id,
        courseId: r.course_id,
        courseName: r.course_name,
        studentId: r.student_id,
        studentName: r.student_name,
        rating: r.rating,
        content: r.content,
        tags,
        isAnonymous: r.is_anonymous,
        createdAt: r.created_at
      };
    });
    
    const start = (parseInt(page) - 1) * parseInt(pageSize);
    const paginatedReviews = processedReviews.slice(start, start + parseInt(pageSize));
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        list: paginatedReviews,
        total: reviews.length,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取评价列表错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 删除评价（管理员）
app.delete('/api/admin/reviews/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superAdmin') {
      return res.status(403).json({ code: 403, message: '只有管理员可以删除评价', data: null });
    }
    
    await query('DELETE FROM course_reviews WHERE id = ?', [req.params.id]);
    
    res.json({ code: 0, message: '评价已删除', data: null });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 获取统计数据
app.get('/api/admin/statistics', authenticateToken, async (req, res) => {
  try {
    const studentCount = await query('SELECT COUNT(*) as count FROM users WHERE role = ?', ['student']);
    const teacherCount = await query('SELECT COUNT(*) as count FROM users WHERE role = ?', ['teacher']);
    const courseCount = await query('SELECT COUNT(*) as count FROM courses WHERE status = ?', ['published']);
    const selectionCount = await query('SELECT COUNT(*) as count FROM selections WHERE status = ?', ['selected']);
    
    // 获取院系统计
    const departmentStats = await query(`
      SELECT u.department as name, COUNT(s.id) as count
      FROM selections s
      JOIN users u ON s.student_id = u.id
      WHERE s.status = 'selected'
      GROUP BY u.department
      ORDER BY count DESC
      LIMIT 5
    `);
    
    // 计算选课率（已选课学生数 / 总学生数）
    const studentsWithSelections = await query(`
      SELECT COUNT(DISTINCT student_id) as count FROM selections WHERE status = 'selected'
    `);
    const selectionRate = studentCount[0].count > 0 
      ? Math.round((studentsWithSelections[0].count / studentCount[0].count) * 100) 
      : 0;
    
    // 计算平均已选学分
    const avgCreditsResult = await query(`
      SELECT COALESCE(AVG(total_credits), 0) as avgCredits
      FROM (
        SELECT u.id, SUM(c.credit) as total_credits
        FROM users u
        LEFT JOIN selections s ON u.id = s.student_id AND s.status = 'selected'
        LEFT JOIN courses c ON s.course_id = c.id
        WHERE u.role = 'student'
        GROUP BY u.id
      ) as student_credits
    `);
    const avgCredits = Math.round(avgCreditsResult[0].avgCredits * 10) / 10;
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        totalStudents: studentCount[0].count,
        totalTeachers: teacherCount[0].count,
        totalCourses: courseCount[0].count,
        totalSelections: selectionCount[0].count,
        departmentStats,
        selectionRate,
        avgCredits
      }
    });
  } catch (error) {
    console.error('统计数据错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 获取热门课程
app.get('/api/admin/popular-courses', authenticateToken, async (req, res) => {
  try {
    const courses = await query(
      `SELECT id, name, teacher_name, selected_count, capacity, 
        ROUND(selected_count / capacity * 100, 1) as fill_rate
      FROM courses 
      WHERE status = ?
      ORDER BY selected_count DESC 
      LIMIT 10`,
      ['published']
    );
    
    // 转换字段名
    const processedCourses = courses.map(c => ({
      ...c,
      teacherName: c.teacher_name,
      selectedCount: c.selected_count
    }));
    
    res.json({ code: 0, message: 'success', data: processedCourses });
  } catch (error) {
    console.error('热门课程错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// ==================== 报表API ====================

app.get('/api/admin/reports/selection', authenticateToken, async (req, res) => {
  try {
    const stats = {
      totalStudents: (await query('SELECT COUNT(*) as count FROM users WHERE role = ?', ['student']))[0].count,
      totalCourses: (await query('SELECT COUNT(*) as count FROM courses WHERE status = ?', ['published']))[0].count,
      totalSelections: (await query('SELECT COUNT(*) as count FROM selections WHERE status = ?', ['selected']))[0].count,
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
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

app.get('/api/admin/reports/course-popularity', authenticateToken, async (req, res) => {
  try {
    const courses = await query(
      `SELECT id, name, selected_count, capacity FROM courses WHERE status = ? ORDER BY selected_count DESC LIMIT 10`,
      ['published']
    );
    
    const data = {
      hotCourses: courses.map(c => ({
        name: c.name,
        selected: c.selected_count,
        capacity: c.capacity,
        rate: c.selected_count / c.capacity
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
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

app.get('/api/admin/reports/teacher-workload', authenticateToken, async (req, res) => {
  try {
    const teachers = await query(
      `SELECT u.name, COUNT(c.id) as courseCount, SUM(c.selected_count) as studentCount, SUM(c.hours) as hours
      FROM users u
      LEFT JOIN courses c ON u.id = c.teacher_id
      WHERE u.role = ?
      GROUP BY u.id`,
      ['teacher']
    );
    
    const data = {
      teachers,
      summary: {
        totalTeachers: teachers.length,
        totalHours: teachers.reduce((sum, t) => sum + (t.hours || 0), 0),
        avgStudents: teachers.length > 0 
          ? Math.round(teachers.reduce((sum, t) => sum + (t.studentCount || 0), 0) / teachers.length)
          : 0
      }
    };
    
    res.json({ code: 0, message: 'success', data });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

app.get('/api/admin/reports/student-credit', authenticateToken, async (req, res) => {
  try {
    const students = await query(
      `SELECT u.name, u.student_id, u.selected_credits as completed, u.max_credits as required
      FROM users u
      WHERE u.role = ?
      LIMIT 10`,
      ['student']
    );
    
    const data = {
      students: students.map(s => ({
        ...s,
        progress: s.completed / s.required
      })),
      summary: {
        totalStudents: (await query('SELECT COUNT(*) as count FROM users WHERE role = ?', ['student']))[0].count,
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
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// ==================== 审核API ====================

app.get('/api/admin/audits', authenticateToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '', status, type } = req.query;
    
    let sql = 'SELECT * FROM audit_records WHERE 1=1';
    const params = [];
    
    if (keyword) {
      sql += ' AND (applicant_name LIKE ? OR course_name LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const audits = await query(sql, params);
    
    const start = (parseInt(page) - 1) * parseInt(pageSize);
    const paginatedAudits = audits.slice(start, start + parseInt(pageSize));
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        list: paginatedAudits,
        total: audits.length,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 审核操作
app.post('/api/admin/audits/:id/approve', authenticateToken, async (req, res) => {
  try {
    await query(
      'UPDATE audit_records SET status = ?, reviewer_id = ?, reviewer_name = ?, reviewed_at = NOW() WHERE id = ?',
      ['approved', req.user.id, req.user.name, req.params.id]
    );
    
    res.json({ code: 0, message: '审核通过', data: null });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

app.post('/api/admin/audits/:id/reject', authenticateToken, async (req, res) => {
  try {
    const { comment } = req.body;
    
    await query(
      'UPDATE audit_records SET status = ?, reviewer_id = ?, reviewer_name = ?, review_comment = ?, reviewed_at = NOW() WHERE id = ?',
      ['rejected', req.user.id, req.user.name, comment, req.params.id]
    );
    
    res.json({ code: 0, message: '审核拒绝', data: null });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// ==================== 日志API ====================

app.get('/api/admin/logs', authenticateToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword = '', module, action } = req.query;
    
    let sql = 'SELECT * FROM operation_logs WHERE 1=1';
    const params = [];
    
    if (keyword) {
      sql += ' AND (user_name LIKE ? OR details LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (module) {
      sql += ' AND module = ?';
      params.push(module);
    }
    if (action) {
      sql += ' AND action = ?';
      params.push(action);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const logs = await query(sql, params);
    
    const start = (parseInt(page) - 1) * parseInt(pageSize);
    const paginatedLogs = logs.slice(start, start + parseInt(pageSize));
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        list: paginatedLogs,
        total: logs.length,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// ==================== 选课规则API ====================

app.get('/api/admin/selection-rules', authenticateToken, async (req, res) => {
  try {
    const rules = await query('SELECT * FROM selection_rules ORDER BY created_at DESC');
    
    res.json({ code: 0, message: 'success', data: { list: rules, total: rules.length } });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// ==================== 成绩管理API ====================

// 获取教师的课程列表（用于成绩录入）
app.get('/api/teacher/grade-courses', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ code: 403, message: '只有教师可以访问', data: null });
    }
    
    const courses = await query(`
      SELECT c.id, c.name, c.code, c.semester, c.credit,
        COUNT(DISTINCT s.student_id) as student_count
      FROM courses c
      LEFT JOIN selections s ON c.id = s.course_id AND s.status = 'selected'
      WHERE c.teacher_id = ? AND c.status = 'published'
      GROUP BY c.id
      ORDER BY c.semester DESC, c.name
    `, [req.user.id]);
    
    res.json({ code: 0, message: 'success', data: courses });
  } catch (error) {
    console.error('获取课程列表错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 获取课程学生成绩列表
app.get('/api/teacher/grades/:courseId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ code: 403, message: '只有教师可以访问', data: null });
    }
    
    const { courseId } = req.params;
    const { semester } = req.query;
    
    // 验证课程归属
    const courses = await query('SELECT * FROM courses WHERE id = ? AND teacher_id = ?', [courseId, req.user.id]);
    if (courses.length === 0) {
      return res.status(404).json({ code: 404, message: '课程不存在或无权访问', data: null });
    }
    
    const course = courses[0];
    const currentSemester = semester || course.semester;
    
    // 获取选课学生及成绩
    const students = await query(`
      SELECT s.id as selection_id, s.student_id, u.name as student_name, u.student_id as student_number,
        u.major, u.class_name, g.id as grade_id, g.score, g.grade_level, g.grade_type, g.status as grade_status,
        g.remark, g.created_at, g.updated_at
      FROM selections s
      JOIN users u ON s.student_id = u.id
      LEFT JOIN grades g ON s.student_id = g.student_id AND s.course_id = g.course_id AND g.semester = ?
      WHERE s.course_id = ? AND s.status = 'selected'
      ORDER BY u.student_id
    `, [currentSemester, courseId]);
    
    res.json({ 
      code: 0, 
      message: 'success', 
      data: {
        course: {
          id: course.id,
          name: course.name,
          code: course.code,
          semester: currentSemester,
          credit: course.credit
        },
        students: students.map(s => ({
          studentId: s.student_id,
          studentNumber: s.student_number,
          studentName: s.student_name,
          major: s.major,
          className: s.class_name,
          gradeId: s.grade_id,
          score: s.score,
          gradeLevel: s.grade_level,
          gradeType: s.grade_type,
          gradeStatus: s.grade_status,
          remark: s.remark,
          createdAt: s.created_at,
          updatedAt: s.updated_at
        }))
      }
    });
  } catch (error) {
    console.error('获取成绩列表错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 录入/修改单个成绩
app.post('/api/teacher/grades', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ code: 403, message: '只有教师可以录入成绩', data: null });
    }
    
    const { courseId, studentId, score, gradeLevel, gradeType, remark } = req.body;
    
    // 验证课程归属
    const courses = await query('SELECT * FROM courses WHERE id = ? AND teacher_id = ?', [courseId, req.user.id]);
    if (courses.length === 0) {
      return res.status(404).json({ code: 404, message: '课程不存在或无权访问', data: null });
    }
    
    const course = courses[0];
    
    // 检查是否已有成绩
    const existingGrades = await query(
      'SELECT * FROM grades WHERE student_id = ? AND course_id = ? AND semester = ?',
      [studentId, courseId, course.semester]
    );
    
    if (existingGrades.length > 0) {
      const existing = existingGrades[0];
      
      // 检查是否已提交或已通过（已驳回可以重新修改）
      if (existing.status === 'submitted' || existing.status === 'approved') {
        return res.status(400).json({ code: 400, message: '成绩已提交，无法修改', data: null });
      }
      
      // 更新成绩（rejected状态重置为draft）
      const newStatus = existing.status === 'rejected' ? 'draft' : existing.status;
      await query(
        'UPDATE grades SET score = ?, grade_level = ?, grade_type = ?, remark = ?, status = ?, updated_at = NOW() WHERE id = ?',
        [score, gradeLevel, gradeType, remark, newStatus, existing.id]
      );
      
      res.json({ code: 0, message: '成绩更新成功', data: { id: existing.id } });
    } else {
      // 创建新成绩
      const gradeId = `grade-${uuidv4()}`;
      await query(
        'INSERT INTO grades (id, student_id, course_id, teacher_id, semester, score, grade_level, grade_type, remark, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [gradeId, studentId, courseId, req.user.id, course.semester, score, gradeLevel, gradeType, remark, 'draft']
      );
      
      res.json({ code: 0, message: '成绩录入成功', data: { id: gradeId } });
    }
  } catch (error) {
    console.error('录入成绩错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 批量录入成绩
app.post('/api/teacher/grades/batch', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ code: 403, message: '只有教师可以录入成绩', data: null });
    }
    
    const { courseId, grades } = req.body;
    
    if (!Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({ code: 400, message: '成绩数据无效', data: null });
    }
    
    // 验证课程归属
    const courses = await query('SELECT * FROM courses WHERE id = ? AND teacher_id = ?', [courseId, req.user.id]);
    if (courses.length === 0) {
      return res.status(404).json({ code: 404, message: '课程不存在或无权访问', data: null });
    }
    
    const course = courses[0];
    let successCount = 0;
    let failCount = 0;
    
    for (const grade of grades) {
      try {
        const { studentId, score, gradeLevel, gradeType, remark } = grade;
        
        // 检查是否已有成绩
        const existingGrades = await query(
          'SELECT * FROM grades WHERE student_id = ? AND course_id = ? AND semester = ?',
          [studentId, courseId, course.semester]
        );
        
        if (existingGrades.length > 0) {
          const existing = existingGrades[0];
          if (existing.status === 'draft' || existing.status === 'rejected') {
            await query(
              'UPDATE grades SET score = ?, grade_level = ?, grade_type = ?, remark = ?, status = ?, updated_at = NOW() WHERE id = ?',
              [score, gradeLevel, gradeType, remark, 'draft', existing.id]
            );
            successCount++;
          } else {
            failCount++;
          }
        } else {
          const gradeId = `grade-${uuidv4()}`;
          await query(
            'INSERT INTO grades (id, student_id, course_id, teacher_id, semester, score, grade_level, grade_type, remark, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [gradeId, studentId, courseId, req.user.id, course.semester, score, gradeLevel, gradeType, remark, 'draft']
          );
          successCount++;
        }
      } catch {
        failCount++;
      }
    }
    
    res.json({ 
      code: 0, 
      message: `批量录入完成：成功 ${successCount} 条，失败 ${failCount} 条`, 
      data: { successCount, failCount }
    });
  } catch (error) {
    console.error('批量录入成绩错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 提交成绩
app.post('/api/teacher/grades/submit/:courseId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ code: 403, message: '只有教师可以提交成绩', data: null });
    }
    
    const { courseId } = req.params;
    const { force } = req.query;
    
    // 验证课程归属
    const courses = await query('SELECT * FROM courses WHERE id = ? AND teacher_id = ?', [courseId, req.user.id]);
    if (courses.length === 0) {
      return res.status(404).json({ code: 404, message: '课程不存在或无权访问', data: null });
    }
    
    // 检查是否有待提交的成绩（draft或rejected状态）
    const gradedCount = await query(`
      SELECT COUNT(*) as count FROM grades 
      WHERE course_id = ? AND status IN ('draft', 'rejected')
    `, [courseId]);
    
    if (gradedCount[0].count === 0) {
      return res.status(400).json({ 
        code: 400, 
        message: '没有待提交的成绩', 
        data: null 
      });
    }
    
    // 检查是否有学生未录入成绩
    const ungradedCount = await query(`
      SELECT COUNT(*) as count FROM selections s
      LEFT JOIN grades g ON s.student_id = g.student_id AND s.course_id = g.course_id
      WHERE s.course_id = ? AND s.status = 'selected' AND g.id IS NULL
    `, [courseId]);
    
    if (ungradedCount[0].count > 0 && force !== 'true') {
      return res.status(400).json({ 
        code: 400, 
        message: `还有 ${ungradedCount[0].count} 名学生未录入成绩，确定要提交已录入的成绩吗？`, 
        data: { ungradedCount: ungradedCount[0].count, needConfirm: true }
      });
    }
    
    // 更新成绩状态为已提交（draft和rejected状态都可以提交）
    await query(
      'UPDATE grades SET status = ?, submitted_at = NOW() WHERE course_id = ? AND status IN (?, ?)',
      ['submitted', courseId, 'draft', 'rejected']
    );
    
    res.json({ code: 0, message: '成绩已提交审核', data: null });
  } catch (error) {
    console.error('提交成绩错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// ==================== 学生成绩查询API ====================

// 学生查询自己的成绩
app.get('/api/student/grades', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ code: 403, message: '只有学生可以查询成绩', data: null });
    }
    
    const { semester } = req.query;
    
    let sql = `
      SELECT g.id, g.score, g.grade_level, g.grade_type, g.status, g.remark, g.created_at,
        c.id as course_id, c.name as course_name, c.code as course_code, c.credit, c.semester,
        u.name as teacher_name
      FROM grades g
      JOIN courses c ON g.course_id = c.id
      JOIN users u ON c.teacher_id = u.id
      WHERE g.student_id = ? AND g.status = 'approved'
    `;
    const params = [req.user.id];
    
    if (semester) {
      sql += ' AND c.semester = ?';
      params.push(semester);
    }
    
    sql += ' ORDER BY g.created_at DESC';
    
    const grades = await query(sql, params);
    
    // 计算统计信息
    const stats = {
      totalCourses: grades.length,
      totalCredits: grades.reduce((sum, g) => sum + (g.credit || 0), 0),
      avgScore: grades.length > 0 
        ? (grades.reduce((sum, g) => sum + (g.score || 0), 0) / grades.length).toFixed(1)
        : 0,
      excellentCount: grades.filter(g => (g.score || 0) >= 90).length,
      failCount: grades.filter(g => (g.score || 0) < 60).length
    };
    
    res.json({ 
      code: 0, 
      message: 'success', 
      data: {
        grades: grades.map(g => ({
          id: g.id,
          courseId: g.course_id,
          courseName: g.course_name,
          courseCode: g.course_code,
          credit: g.credit,
          semester: g.semester,
          teacherName: g.teacher_name,
          score: g.score,
          gradeLevel: g.grade_level,
          gradeType: g.grade_type,
          status: g.status,
          remark: g.remark,
          createdAt: g.created_at
        })),
        stats
      }
    });
  } catch (error) {
    console.error('查询成绩错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// ==================== 管理员成绩管理API ====================

// 管理员获取成绩列表
app.get('/api/admin/grades', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ code: 403, message: '只有管理员可以访问', data: null });
    }
    
    const { page = 1, pageSize = 10, courseId, studentId, status, semester } = req.query;
    
    let sql = `
      SELECT g.id, g.score, g.grade_level, g.grade_type, g.status, g.remark, g.created_at, g.submitted_at,
        c.id as course_id, c.name as course_name, c.code as course_code, c.credit, c.semester,
        u.id as student_id, u.name as student_name, u.student_id as student_number, u.class_name
      FROM grades g
      JOIN courses c ON g.course_id = c.id
      JOIN users u ON g.student_id = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (courseId) {
      sql += ' AND g.course_id = ?';
      params.push(courseId);
    }
    if (studentId) {
      sql += ' AND g.student_id = ?';
      params.push(studentId);
    }
    if (status) {
      sql += ' AND g.status = ?';
      params.push(status);
    }
    if (semester) {
      sql += ' AND c.semester = ?';
      params.push(semester);
    }
    
    const grades = await query(sql, params);
    
    // 获取全局统计数据（不受筛选条件影响）
    const totalStats = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft
      FROM grades
    `);
    
    const start = (parseInt(page) - 1) * parseInt(pageSize);
    const paginatedGrades = grades.slice(start, start + parseInt(pageSize));
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        list: paginatedGrades.map(g => ({
          id: g.id,
          courseId: g.course_id,
          courseName: g.course_name,
          courseCode: g.course_code,
          credit: g.credit,
          semester: g.semester,
          studentId: g.student_id,
          studentName: g.student_name,
          studentNumber: g.student_number,
          className: g.class_name,
          score: g.score,
          gradeLevel: g.grade_level,
          gradeType: g.grade_type,
          status: g.status,
          remark: g.remark,
          createdAt: g.created_at,
          submittedAt: g.submitted_at
        })),
        total: grades.length,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        statistics: {
          total: totalStats[0].total || 0,
          pending: totalStats[0].pending || 0,
          approved: totalStats[0].approved || 0,
          rejected: totalStats[0].rejected || 0,
          draft: totalStats[0].draft || 0
        }
      }
    });
  } catch (error) {
    console.error('获取成绩列表错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 管理员审核成绩
app.put('/api/admin/grades/:id/approve', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ code: 403, message: '只有管理员可以审核成绩', data: null });
    }
    
    await query(
      'UPDATE grades SET status = ?, approved_at = NOW(), approved_by = ? WHERE id = ?',
      ['approved', req.user.id, req.params.id]
    );
    
    res.json({ code: 0, message: '成绩审核通过', data: null });
  } catch (error) {
    console.error('审核成绩错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 管理员驳回成绩
app.put('/api/admin/grades/:id/reject', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ code: 403, message: '只有管理员可以审核成绩', data: null });
    }
    
    await query(
      'UPDATE grades SET status = ? WHERE id = ?',
      ['rejected', req.params.id]
    );
    
    res.json({ code: 0, message: '成绩已驳回', data: null });
  } catch (error) {
    console.error('驳回成绩错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 管理员批量审核成绩
app.put('/api/admin/grades/batch-approve', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ code: 403, message: '只有管理员可以审核成绩', data: null });
    }
    
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ code: 400, message: '请选择要审核的成绩', data: null });
    }
    
    const placeholders = ids.map(() => '?').join(',');
    await query(
      `UPDATE grades SET status = ?, approved_at = NOW(), approved_by = ? WHERE id IN (${placeholders})`,
      ['approved', req.user.id, ...ids]
    );
    
    res.json({ code: 0, message: `已审核 ${ids.length} 条成绩`, data: null });
  } catch (error) {
    console.error('批量审核成绩错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 管理员批量驳回成绩
app.put('/api/admin/grades/batch-reject', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ code: 403, message: '只有管理员可以审核成绩', data: null });
    }
    
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ code: 400, message: '请选择要驳回的成绩', data: null });
    }
    
    const placeholders = ids.map(() => '?').join(',');
    await query(
      `UPDATE grades SET status = ? WHERE id IN (${placeholders})`,
      ['rejected', ...ids]
    );
    
    res.json({ code: 0, message: `已驳回 ${ids.length} 条成绩`, data: null });
  } catch (error) {
    console.error('批量驳回成绩错误:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// ==================== 启动服务器 ====================

async function startServer() {
  try {
    // 测试数据库连接
    await getConnection();
    
    // 创建 course_reviews 表（如果不存在）
    await query(`
      CREATE TABLE IF NOT EXISTS course_reviews (
        id VARCHAR(36) PRIMARY KEY,
        course_id VARCHAR(36) NOT NULL,
        student_id VARCHAR(36) NOT NULL,
        student_name VARCHAR(50),
        content TEXT,
        rating INT,
        tags TEXT,
        is_anonymous TINYINT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_course_id (course_id),
        INDEX idx_student_id (student_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ course_reviews 表检查完成');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 后端服务已启动: http://localhost:${PORT}`);
      console.log(`📚 API 文档: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('启动失败:', error.message);
    process.exit(1);
  }
}

startServer();
