import mysql from 'mysql2/promise';

async function checkStatusColumn() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'course_selection_system'
  });
  
  // 查看 courses 表的 status 字段
  const [columns] = await connection.execute(`
    SHOW COLUMNS FROM courses WHERE Field = 'status'
  `);
  
  console.log('\n📊 courses 表的 status 字段:');
  console.table(columns);
  
  await connection.end();
}

checkStatusColumn();
