import mysql from 'mysql2/promise';

async function checkTeacherCourses() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'course_selection_system'
  });
  
  // 查看所有教师
  const [teachers] = await connection.execute(`
    SELECT id, username, name FROM users WHERE role = 'teacher'
  `);
  console.log('\n👨‍🏫 所有教师:');
  console.table(teachers);
  
  // 查看所有课程及其教师
  const [courses] = await connection.execute(`
    SELECT id, code, name, teacher_id, teacher_name, status FROM courses LIMIT 20
  `);
  console.log('\n📚 课程列表:');
  console.table(courses);
  
  // 查看teacher1的课程
  const [teacher1Courses] = await connection.execute(`
    SELECT id, code, name, teacher_id, teacher_name, status 
    FROM courses 
    WHERE teacher_id = 'user-teacher-1'
  `);
  console.log('\n📚 teacher1 的课程:');
  console.table(teacher1Courses);
  
  await connection.end();
}

checkTeacherCourses();
