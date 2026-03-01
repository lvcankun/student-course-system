import mysql from 'mysql2/promise';

async function checkStudent2() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'course_selection_system'
  });
  
  // 查看 student2 的用户信息
  const [users] = await connection.execute(`
    SELECT * FROM users WHERE username = 'student2'
  `);
  
  console.log('\n👤 student2 用户信息:');
  console.table(users);
  
  if (users.length > 0) {
    const userId = users[0].id;
    
    // 查看 student2 的选课记录
    const [selections] = await connection.execute(`
      SELECT s.*, c.name as course_name 
      FROM selections s
      JOIN courses c ON s.course_id = c.id
      WHERE s.student_id = ? AND s.status = 'selected'
    `, [userId]);
    
    console.log(`\n📋 student2 (ID: ${userId}) 的已选课程:`);
    console.table(selections.map(s => ({
      course: s.course_name,
      status: s.status,
      selected_at: s.selected_at
    })));
  }
  
  await connection.end();
}

checkStudent2();
