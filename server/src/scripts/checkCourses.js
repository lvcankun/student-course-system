import mysql from 'mysql2/promise';

async function checkCourses() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'course_selection_system'
  });
  
  // 查看所有课程
  const [courses] = await connection.execute(`
    SELECT id, code, name, teacher_id, teacher_name, status FROM courses
  `);
  
  console.log('\n📚 所有课程:');
  console.table(courses);
  
  // 查看teacher1的课程
  const [teacher1Courses] = await connection.execute(`
    SELECT id, code, name, status FROM courses WHERE teacher_id = 'user-teacher-1'
  `);
  
  console.log('\n👤 teacher1 的课程:');
  console.table(teacher1Courses);
  
  await connection.end();
}

checkCourses();
