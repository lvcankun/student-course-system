import mysql from 'mysql2/promise';

async function fixStatusColumn() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'course_selection_system'
  });
  
  console.log('修改 status 字段...');
  
  // 修改 status 字段，添加 'pending' 值
  await connection.execute(`
    ALTER TABLE courses MODIFY COLUMN status ENUM('draft', 'pending', 'published', 'closed') DEFAULT 'draft'
  `);
  
  console.log('✅ status 字段已修改');
  
  // 验证
  const [columns] = await connection.execute(`
    SHOW COLUMNS FROM courses WHERE Field = 'status'
  `);
  
  console.log('\n📊 修改后的 status 字段:');
  console.table(columns);
  
  await connection.end();
}

fixStatusColumn();
