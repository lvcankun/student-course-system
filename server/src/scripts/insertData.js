import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'course_selection_system',
  multipleStatements: true
};

async function insertData() {
  const connection = await mysql.createConnection(DB_CONFIG);
  
  console.log('🔄 开始插入基础数据...\n');
  
  // 1. 插入更多学生
  console.log('📝 插入学生数据...');
  const students = [];
  const studentNames = ['李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二', '冯十三'];
  const majors = ['计算机科学与技术', '软件工程', '网络工程', '信息安全', '数据科学'];
  const grades = ['2021级', '2022级', '2023级', '2024级'];
  
  for (let i = 0; i < 50; i++) {
    const id = `user-student-${i + 2}`;
    const name = studentNames[i % studentNames.length] + (Math.floor(i / 10) > 0 ? Math.floor(i / 10) : '');
    const studentId = `2024${String(i + 2).padStart(4, '0')}`;
    const major = majors[i % majors.length];
    const grade = grades[i % grades.length];
    
    students.push(
      connection.execute(
        `INSERT IGNORE INTO users (id, username, password, name, role, student_id, department, major, grade, class_name, phone, email, max_credits) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, `student${i + 2}`, '123456', name, 'student', studentId, '计算机学院', major, grade, `${major.substring(0, 2)}${Math.floor(i / 10) + 1}班`, `1380013${String(i + 2).padStart(4, '0')}`, `student${i + 2}@example.com`, 30]
      )
    );
  }
  await Promise.all(students);
  console.log('✅ 已插入 50 名学生\n');
  
  // 2. 插入更多教师
  console.log('📝 插入教师数据...');
  const teachers = [
    { name: '李教授', department: '计算机学院', teacherId: 'T002' },
    { name: '王教授', department: '数学学院', teacherId: 'T003' },
    { name: '赵教授', department: '计算机学院', teacherId: 'T004' },
    { name: '钱教授', department: '外国语学院', teacherId: 'T005' },
    { name: '孙教授', department: '物理学院', teacherId: 'T006' },
  ];
  
  for (const teacher of teachers) {
    const id = `user-teacher-${teachers.indexOf(teacher) + 2}`;
    await connection.execute(
      `INSERT IGNORE INTO users (id, username, password, name, role, teacher_id, department, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, `teacher${teachers.indexOf(teacher) + 2}`, '123456', teacher.name, 'teacher', teacher.teacherId, teacher.department, `1390013${String(teachers.indexOf(teacher) + 2).padStart(4, '0')}`, `teacher${teachers.indexOf(teacher) + 2}@example.com`]
    );
  }
  console.log('✅ 已插入 5 名教师\n');
  
  // 3. 插入更多课程
  console.log('📝 插入课程数据...');
  const courses = [
    { code: 'CS1006', name: '操作系统', credit: 4, hours: 64, capacity: 60, teacherId: 'user-teacher-2', teacherName: '李教授', department: '计算机学院', category: 'required' },
    { code: 'CS1007', name: '数据库原理', credit: 3, hours: 48, capacity: 55, teacherId: 'user-teacher-2', teacherName: '李教授', department: '计算机学院', category: 'required' },
    { code: 'CS1008', name: '编译原理', credit: 3, hours: 48, capacity: 40, teacherId: 'user-teacher-3', teacherName: '王教授', department: '计算机学院', category: 'elective' },
    { code: 'CS1009', name: '人工智能', credit: 3, hours: 48, capacity: 50, teacherId: 'user-teacher-3', teacherName: '王教授', department: '计算机学院', category: 'elective' },
    { code: 'CS1010', name: '机器学习', credit: 3, hours: 48, capacity: 45, teacherId: 'user-teacher-4', teacherName: '赵教授', department: '计算机学院', category: 'elective' },
    { code: 'MA1001', name: '概率论与数理统计', credit: 3, hours: 48, capacity: 80, teacherId: 'user-teacher-1', teacherName: '张教授', department: '数学学院', category: 'required' },
    { code: 'MA1002', name: '离散数学', credit: 3, hours: 48, capacity: 70, teacherId: 'user-teacher-1', teacherName: '张教授', department: '数学学院', category: 'required' },
    { code: 'EN1001', name: '大学英语', credit: 2, hours: 32, capacity: 100, teacherId: 'user-teacher-5', teacherName: '钱教授', department: '外国语学院', category: 'required' },
    { code: 'PH1001', name: '大学物理', credit: 3, hours: 48, capacity: 90, teacherId: 'user-teacher-6', teacherName: '孙教授', department: '物理学院', category: 'required' },
    { code: 'CS1011', name: '软件工程', credit: 3, hours: 48, capacity: 50, teacherId: 'user-teacher-2', teacherName: '李教授', department: '计算机学院', category: 'required' },
  ];
  
  for (const course of courses) {
    const id = `course-${courses.indexOf(course) + 6}`;
    await connection.execute(
      `INSERT IGNORE INTO courses (id, code, name, credit, hours, capacity, selected_count, teacher_id, teacher_name, department, category, semester, teaching_method, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, course.code, course.name, course.credit, course.hours, course.capacity, Math.floor(Math.random() * course.capacity * 0.8), course.teacherId, course.teacherName, course.department, course.category, '2024-1', 'offline', 'published']
    );
    
    // 添加课程时间
    const dayOfWeek = (courses.indexOf(course) % 5) + 1;
    const startPeriod = (courses.indexOf(course) % 4) + 1;
    await connection.execute(
      `INSERT IGNORE INTO course_time_slots (course_id, day_of_week, start_period, end_period, week_range, location) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, dayOfWeek, startPeriod, startPeriod + 1, '1-16周', `教学楼${Math.floor(courses.indexOf(course) / 3) + 1}-${100 + courses.indexOf(course)}`]
    );
  }
  console.log('✅ 已插入 10 门课程\n');
  
  // 4. 插入选课记录
  console.log('📝 插入选课记录...');
  const selectionCount = 100;
  for (let i = 0; i < selectionCount; i++) {
    const studentIndex = Math.floor(Math.random() * 50) + 2;
    const courseIndex = Math.floor(Math.random() * 15) + 1;
    const studentId = `user-student-${studentIndex}`;
    const courseId = `course-${courseIndex}`;
    
    try {
      await connection.execute(
        `INSERT IGNORE INTO selections (id, student_id, course_id, status) VALUES (?, ?, ?, ?)`,
        [`selection-${uuidv4()}`, studentId, courseId, 'selected']
      );
    } catch (e) {
      // 忽略重复记录
    }
  }
  console.log('✅ 已插入选课记录\n');
  
  // 5. 插入课程评价
  console.log('📝 插入课程评价...');
  const reviewTags = ['讲课清晰', '内容丰富', '难度适中', '作业合理', '实用性强', '推荐'];
  const reviewContents = [
    '老师讲课很认真，内容充实，收获很大！',
    '课程难度适中，适合入门学习。',
    '老师很有耐心，解答问题很详细。',
    '课程内容很实用，对以后工作有帮助。',
    '作业量适中，能够巩固所学知识。',
    '强烈推荐这门课，老师讲得很好！',
    '课程安排合理，学习效果不错。',
    '老师教学经验丰富，课堂氛围好。',
  ];
  
  for (let i = 0; i < 30; i++) {
    const studentIndex = Math.floor(Math.random() * 50) + 2;
    const courseIndex = Math.floor(Math.random() * 15) + 1;
    const studentId = `user-student-${studentIndex}`;
    const courseId = `course-${courseIndex}`;
    
    // 获取学生姓名
    const [students] = await connection.execute('SELECT name FROM users WHERE id = ?', [studentId]);
    const [courses] = await connection.execute('SELECT name FROM courses WHERE id = ?', [courseId]);
    
    if (students.length > 0 && courses.length > 0) {
      const isAnonymous = Math.random() > 0.7;
      const rating = Math.floor(Math.random() * 2) + 4; // 4-5星
      const tags = JSON.stringify([reviewTags[Math.floor(Math.random() * reviewTags.length)], reviewTags[Math.floor(Math.random() * reviewTags.length)]]);
      
      try {
        await connection.execute(
          `INSERT IGNORE INTO course_reviews (id, course_id, course_name, student_id, student_name, is_anonymous, rating, content, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `review-${uuidv4()}`,
            courseId,
            courses[0].name,
            studentId,
            isAnonymous ? '****' : students[0].name,
            isAnonymous,
            rating,
            reviewContents[Math.floor(Math.random() * reviewContents.length)],
            tags
          ]
        );
      } catch (e) {
        // 忽略重复记录
      }
    }
  }
  console.log('✅ 已插入课程评价\n');
  
  // 6. 插入通知
  console.log('📝 插入通知数据...');
  const notifications = [
    { title: '选课系统开放通知', content: '2024春季学期选课系统已开放，请同学们在规定时间内完成选课。选课时间：2024年1月1日 - 2024年2月28日。', type: 'system' },
    { title: '退课截止日期提醒', content: '请同学们注意，退课截止日期为2024年3月15日，请在此之前完成退课操作。', type: 'system' },
    { title: '新课程上线通知', content: '本学期新增《人工智能》、《机器学习》等热门课程，欢迎同学们选修。', type: 'course' },
    { title: '选课容量调整通知', content: '部分课程容量已调整，请同学们关注课程信息变化。', type: 'course' },
  ];
  
  for (const notification of notifications) {
    await connection.execute(
      `INSERT IGNORE INTO notifications (id, title, content, type, is_read) VALUES (?, ?, ?, ?, ?)`,
      [`n${notifications.indexOf(notification) + 3}`, notification.title, notification.content, notification.type, false]
    );
  }
  console.log('✅ 已插入通知\n');
  
  // 7. 插入审核记录
  console.log('📝 插入审核记录...');
  for (let i = 0; i < 10; i++) {
    const studentIndex = Math.floor(Math.random() * 50) + 2;
    const studentId = `user-student-${studentIndex}`;
    
    const [students] = await connection.execute('SELECT name FROM users WHERE id = ?', [studentId]);
    if (students.length > 0) {
      await connection.execute(
        `INSERT IGNORE INTO audit_records (id, type, applicant_id, applicant_name, course_name, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          `audit-${uuidv4()}`,
          ['selection', 'withdraw', 'special'][Math.floor(Math.random() * 3)],
          studentId,
          students[0].name,
          ['高等数学', '线性代数', '程序设计基础', '数据结构'][Math.floor(Math.random() * 4)],
          ['时间冲突需要特殊审批', '个人原因申请退课', '跨专业选课申请'][Math.floor(Math.random() * 3)],
          ['pending', 'approved', 'rejected'][Math.floor(Math.random() * 3)]
        ]
      );
    }
  }
  console.log('✅ 已插入审核记录\n');
  
  // 8. 更新课程选课人数
  console.log('📝 更新课程选课人数...');
  await connection.execute(`
    UPDATE courses c SET selected_count = (
      SELECT COUNT(*) FROM selections s WHERE s.course_id = c.id AND s.status = 'selected'
    )
  `);
  console.log('✅ 已更新选课人数\n');
  
  // 统计数据
  const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
  const [courseCount] = await connection.execute('SELECT COUNT(*) as count FROM courses');
  const [selectionCount2] = await connection.execute('SELECT COUNT(*) as count FROM selections');
  const [reviewCount] = await connection.execute('SELECT COUNT(*) as count FROM course_reviews');
  const [notificationCount] = await connection.execute('SELECT COUNT(*) as count FROM notifications');
  const [auditCount] = await connection.execute('SELECT COUNT(*) as count FROM audit_records');
  
  console.log('🎉 基础数据插入完成！\n');
  console.log('📊 数据统计:');
  console.log(`   用户总数: ${userCount[0].count}`);
  console.log(`   课程总数: ${courseCount[0].count}`);
  console.log(`   选课记录: ${selectionCount2[0].count}`);
  console.log(`   课程评价: ${reviewCount[0].count}`);
  console.log(`   通知数量: ${notificationCount[0].count}`);
  console.log(`   审核记录: ${auditCount[0].count}`);
  
  await connection.end();
}

insertData().catch(console.error);
