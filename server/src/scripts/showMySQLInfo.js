import mysql from 'mysql2/promise';

async function showMySQLInfo() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456'
  });
  
  // 查询数据目录
  const [rows] = await connection.execute('SHOW VARIABLES LIKE "datadir"');
  console.log('\n📂 MySQL 数据存储目录:');
  console.log(rows[0]);
  
  // 显示所有数据库
  const [dbs] = await connection.execute('SHOW DATABASES');
  console.log('\n📊 所有数据库:');
  dbs.forEach(db => console.log(`  - ${db.Database}`));
  
  // 确认 course_selection_system 存在
  const [tables] = await connection.execute(
    "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'course_selection_system'"
  );
  console.log(`\n✅ course_selection_system 数据库表数量: ${tables[0].count}`);
  
  await connection.end();
}

showMySQLInfo();
