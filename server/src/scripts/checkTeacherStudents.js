import mysql from 'mysql2/promise';

async function checkData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'course_selection_system'
  });
  
  // 查看高等数学的教师
  const [courses] = await connection.execute(`
    SELECT id, code, name, teacher_id, teacher_name FROM courses WHERE name = '高等数学'
  `);
  console.log('\n📚 高等数学课程信息:');
  console.table(courses);
  
  // 查看所有教师
  const [teachers] = await connection.execute(`
    SELECT id, username, name FROM users WHERE role = 'teacher'
  `);
  console.log('\n👨‍🏫 所有教师:');
  console.table(teachers);
  
  // 查看最近的选课记录
  const [selections] = await connection.execute(`
    SELECT s.id, s.student_id, s.course_id, s.status, s.selected_at,
      u.name as student_name, c.name as course_name, c.teacher_id, c.teacher_name
    FROM selections s
    JOIN users u ON s.student_id = u.id
    JOIN courses c ON s.course_id = c.id
    ORDER BY s.selected_at DESC
    LIMIT 20
  `);
  console.log('\n📋 最近选课记录:');
  console.table(selections.map(s => ({
    student: s.student_name,
    course: s.course_name,
    teacher_id: s.teacher_id,
    teacher_name: s.teacher_name,
    status: s.status,
    selected_at: s.selected_at
  })));
  
  // 查看teacher1能看到的学生
  const [teacher1Students] = await connection.execute(`
    SELECT s.id, u.name as student_name, c.name as course_name, c.teacher_id
    FROM selections s
    JOIN users u ON s.student_id = u.id
    JOIN courses c ON s.course_id = c.id
    WHERE c.teacher_id = 'user-teacher-1' AND s.status = 'selected'
  `);
  console.log('\n👨‍🏫 teacher1 (user-teacher-1) 能看到的学生:');
  console.table(teacher1Students);
  
  await connection.end();
}

checkData();
