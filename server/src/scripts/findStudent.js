import mysql from 'mysql2/promise';

async function findStudent() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'course_selection_system'
  });
  
  const [students] = await connection.execute(`
    SELECT id, username, student_id, name, email, major, class_name 
    FROM users 
    WHERE student_id = '20240012'
  `);
  
  console.log('\n📚 学号 20240012 对应的学生:');
  console.table(students);
  
  await connection.end();
}

findStudent();
