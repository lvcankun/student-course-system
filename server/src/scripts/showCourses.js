import mysql from 'mysql2/promise';

async function showCourses() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'course_selection_system'
  });
  
  const [courses] = await connection.execute('SELECT * FROM courses');
  console.log('\n📚 课程列表:\n');
  console.table(courses);
  
  const [timeSlots] = await connection.execute('SELECT * FROM course_time_slots');
  console.log('\n⏰ 课程时间安排:\n');
  console.table(timeSlots);
  
  await connection.end();
}

showCourses();
