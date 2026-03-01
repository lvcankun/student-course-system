import mysql from 'mysql2/promise';

async function checkStudentSelections() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'course_selection_system'
  });
  
  // student1 的选课
  const [student1] = await connection.execute(`
    SELECT s.id, s.student_id, s.course_id, s.status, c.name as course_name
    FROM selections s
    JOIN courses c ON s.course_id = c.id
    WHERE s.student_id = 'user-student-1' AND s.status = 'selected'
  `);
  
  console.log('\n👤 student1 (张三) 的选课:');
  console.table(student1.map(s => ({ course: s.course_name, status: s.status })));
  
  // student2 的选课
  const [student2] = await connection.execute(`
    SELECT s.id, s.student_id, s.course_id, s.status, c.name as course_name
    FROM selections s
    JOIN courses c ON s.course_id = c.id
    WHERE s.student_id = 'user-student-2' AND s.status = 'selected'
  `);
  
  console.log('\n👤 student2 (李四) 的选课:');
  console.table(student2.map(s => ({ course: s.course_name, status: s.status })));
  
  await connection.end();
}

checkStudentSelections();
