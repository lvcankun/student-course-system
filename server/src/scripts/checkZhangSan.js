import mysql from 'mysql2/promise';

async function checkZhangSan() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'course_selection_system'
  });
  
  // 查看张三（student1）的所有选课记录
  const [zhangsanSelections] = await connection.execute(`
    SELECT s.id, s.student_id, s.course_id, s.status, s.selected_at,
      c.name as course_name, c.teacher_id, c.teacher_name
    FROM selections s
    JOIN courses c ON s.course_id = c.id
    WHERE s.student_id = 'user-student-1'
    ORDER BY s.selected_at DESC
  `);
  
  console.log('\n👤 张三（student1）的选课记录:');
  console.table(zhangsanSelections.map(s => ({
    course: s.course_name,
    teacher: s.teacher_name,
    status: s.status,
    selected_at: s.selected_at
  })));
  
  // 检查高等数学的选课记录
  const [gdsxSelections] = await connection.execute(`
    SELECT s.id, s.student_id, s.status, u.name as student_name
    FROM selections s
    JOIN users u ON s.student_id = u.id
    WHERE s.course_id = 'course-1' AND s.status = 'selected'
  `);
  
  console.log('\n📚 高等数学的已选学生:');
  console.table(gdsxSelections);
  
  await connection.end();
}

checkZhangSan();
