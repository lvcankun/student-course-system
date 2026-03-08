import mysql from 'mysql2/promise';

async function checkGrades() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'course_selection_system'
  });
  
  // 查看所有成绩
  const [grades] = await connection.execute(`
    SELECT g.id, g.student_id, u.name as student_name, u.student_id as student_number,
      c.name as course_name, g.score, g.grade_level, g.status, g.semester
    FROM grades g
    JOIN users u ON g.student_id = u.id
    JOIN courses c ON g.course_id = c.id
    ORDER BY g.created_at DESC
    LIMIT 20
  `);
  
  console.log('\n📚 成绩列表:');
  console.table(grades);
  
  // 统计各状态数量
  const [stats] = await connection.execute(`
    SELECT status, COUNT(*) as count FROM grades GROUP BY status
  `);
  
  console.log('\n📊 成绩状态统计:');
  console.table(stats);
  
  await connection.end();
}

checkGrades();
