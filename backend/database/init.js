/**
 * 数据库初始化脚本
 * 创建数据库表结构并可选创建管理员账号
 * 
 * 用法:
 *   node database/init.js          # 仅初始化表结构
 *   node database/init.js --admin  # 初始化表结构并创建管理员
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 数据库配置 - 从环境变量读取
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bill_manager'
};

async function initDatabase(createAdmin = false) {
  // 连接配置（不指定数据库，用于创建数据库）
  const connectionConfig = {
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
    multipleStatements: true
  };

  console.log('数据库配置:');
  console.log(`  主机: ${DB_CONFIG.host}`);
  console.log(`  端口: ${DB_CONFIG.port}`);
  console.log(`  用户: ${DB_CONFIG.user}`);
  console.log(`  数据库: ${DB_CONFIG.database}\n`);

  let connection;
  
  try {
    console.log('连接 MySQL 服务器...');
    connection = await mysql.createConnection(connectionConfig);
    console.log('✓ 连接成功\n');
    
    // 读取并执行 schema SQL
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('创建数据库和表结构...');
    await connection.query(schemaSql);
    console.log('✓ 数据库初始化完成！');
    console.log('✓ 已创建表: users, categories, bills, category_rules, asset_channels, monthly_assets, user_settings\n');
    
    // 创建管理员账号
    if (createAdmin) {
      await connection.query(`USE ${DB_CONFIG.database}`);
      
      const [existing] = await connection.execute(
        'SELECT id FROM users WHERE username = ?',
        ['admin']
      );

      if (existing.length > 0) {
        console.log('管理员账号已存在，跳过创建');
      } else {
        const password = 'admin123';
        const passwordHash = await bcrypt.hash(password, 10);

        await connection.execute(
          'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
          ['admin', 'admin@example.com', passwordHash]
        );

        console.log('✓ 管理员账号创建成功！');
        console.log('  用户名: admin');
        console.log('  邮箱: admin@example.com');
        console.log('  密码: admin123');
        console.log('  ⚠️  请登录后立即修改密码！');
      }
    }
    
    console.log('\n初始化完成！');
    
  } catch (error) {
    console.error('\n✗ 数据库初始化失败:', error.message);
    if (error.code) {
      console.error('错误代码:', error.code);
    }
    if (error.sqlMessage) {
      console.error('SQL 错误:', error.sqlMessage);
    }
    console.error('\n请检查:');
    console.error('1. MySQL 服务是否运行');
    console.error('2. 数据库配置是否正确');
    console.error('3. 数据库用户是否有足够的权限');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 直接运行时执行
if (require.main === module) {
  const createAdmin = process.argv.includes('--admin');
  initDatabase(createAdmin);
}

module.exports = { initDatabase };
