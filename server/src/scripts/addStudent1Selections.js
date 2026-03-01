import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

async function addStudent1Selections() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'course_selection_system'
  });
  
  console.log('🔄 为 student1 添加选课记录...\n');
  
  // 为 student1 添加几门课程的选课记录
  const courses = [
    { courseId: 'course-1', courseName: '高等数学' },
    { courseId: 'course-2', courseName: '线性代数' },
    { courseId: 'course-3', courseName: '程序设计基础' },
  ];
  
  for (const course of courses) {
    try {
      await connection.execute(
        `INSERT INTO selections (id, student_id, course_id, status, selected_at) VALUES (?, ?, ?, ?, NOW())`,
        [`selection-${uuidv4()}`, 'user-student-1', course.courseId, 'selected']
      );
      console.log(`✅ 已添加: ${course.courseName}`);
    } catch (e) {
      console.log(`⚠️ 已存在: ${course.courseName}`);
    }
  }
  
  // 更新课程的选课人数
  await connection.execute(`
    UPDATE courses c SET selected_count = (
      SELECT COUNT(*) FROM selections s WHERE s.course_id = c.id AND s.status = 'selected'
    )
  `);
  
  console.log('\n✅ 选课记录添加完成！');
  
  // 验证
  const [selections] = await connection.execute(`
    SELECT s.*, c.name as course_name 
    FROM selections s
    JOIN courses c ON s.course_id = c.id
    WHERE s.student_id = 'user-student-1' AND s.status = 'selected'
  `);
  
  console.log('\n📋 student1 的已选课程:');
  console.table(selections.map(s => ({
    course: s.course_name,
    status: s.status,
    selected_at: s.selected_at
  })));
  
  await connection.end();
}

addStudent1Selections();
