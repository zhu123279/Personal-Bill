/**
 * 统一配置入口
 * 集中管理所有环境变量和配置项
 */

// 环境类型
const isDev = process.env.NODE_ENV !== 'production';
const isProd = process.env.NODE_ENV === 'production';

// 服务器配置
const server = {
  port: parseInt(process.env.PORT) || 3001,
  env: process.env.NODE_ENV || 'development',
  isDev,
  isProd
};

// 数据库配置
const database = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bill_manager',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// JWT 配置
const jwt = {
  secret: process.env.JWT_SECRET || 'default_jwt_secret_change_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
};

// CORS 配置
const cors = {
  // 解析允许的域名列表
  origins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
};

// 导出配置（保持向后兼容）
module.exports = {
  server,
  database,
  jwt,
  cors,
  // 便捷访问
  isDev,
  isProd
};
