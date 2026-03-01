import mysql from 'mysql2/promise';

async function checkSelections() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'course_selection_system'
  });
  
  // 查看所有选课记录
  const [selections] = await connection.execute(`
    SELECT s.*, u.name as student_name, c.name as course_name 
    FROM selections s
    JOIN users u ON s.student_id = u.id
    JOIN courses c ON s.course_id = c.id
    ORDER BY s.student_id, s.status
  `);
  
  console.log('\n📋 所有选课记录:\n');
  console.table(selections.map(s => ({
    student: s.student_name,
    course: s.course_name,
    status: s.status,
    selected_at: s.selected_at
  })));
  
  // 查看student1的选课
  const [student1Selections] = await connection.execute(`
    SELECT s.*, c.name as course_name 
    FROM selections s
    JOIN courses c ON s.course_id = c.id
    WHERE s.student_id = 'user-student-1' AND s.status = 'selected'
  `);
  
  console.log('\n👤 student1 的已选课程:\n');
  console.table(student1Selections.map(s => ({
    course: s.course_name,
    status: s.status,
    selected_at: s.selected_at
  })));
  
  await connection.end();
}

checkSelections();
