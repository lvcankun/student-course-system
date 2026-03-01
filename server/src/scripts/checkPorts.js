import mysql from 'mysql2/promise';

async function checkMySQLPorts() {
  console.log('\n🔍 检查 MySQL 服务器信息...\n');
  
  // 尝试连接 3306 端口 (可能是 MariaDB)
  try {
    const conn3306 = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '123456'
    });
    
    const [info3306] = await conn3306.execute('SELECT @@version as version, @@port as port');
    console.log('📌 端口 3306:');
    console.log(`   版本: ${info3306[0].version}`);
    console.log(`   端口: ${info3306[0].port}`);
    
    const [dbs3306] = await conn3306.execute('SHOW DATABASES');
    console.log(`   数据库: ${dbs3306.map(d => d.Database).join(', ')}`);
    
    await conn3306.end();
  } catch (e) {
    console.log('❌ 端口 3306 连接失败:', e.message);
  }
  
  console.log('');
  
  // 尝试连接 3307 端口 (可能是 MySQL 8.0)
  try {
    const conn3307 = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'root',
      password: '123456'
    });
    
    const [info3307] = await conn3307.execute('SELECT @@version as version, @@port as port');
    console.log('📌 端口 3307:');
    console.log(`   版本: ${info3307[0].version}`);
    console.log(`   端口: ${info3307[0].port}`);
    
    const [dbs3307] = await conn3307.execute('SHOW DATABASES');
    console.log(`   数据库: ${dbs3307.map(d => d.Database).join(', ')}`);
    
    await conn3307.end();
  } catch (e) {
    console.log('❌ 端口 3307 连接失败:', e.message);
  }
}

checkMySQLPorts();
