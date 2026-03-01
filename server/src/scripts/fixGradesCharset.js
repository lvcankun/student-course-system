import mysql from 'mysql2/promise';

async function fixGradesCharset() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'course_selection_system'
  });
  
  console.log('修复 grades 表字符集...');
  
  try {
    // 修改 grades 表的字符集
    await connection.execute(`
      ALTER TABLE grades CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    
    console.log('✅ grades 表字符集已修复');
    
    // 验证
    const [result] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_COLLATION 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'course_selection_system' AND TABLE_NAME = 'grades'
    `);
    
    console.log('\n📊 grades 表字符集:');
    console.table(result);
  } catch (error) {
    console.error('修复失败:', error);
  }
  
  await connection.end();
}

fixGradesCharset();
