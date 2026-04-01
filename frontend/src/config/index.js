/**
 * 前端统一配置入口
 * 集中管理所有环境变量和配置项
 */

// 环境类型
const isDev = process.env.REACT_APP_ENV === 'development' || process.env.NODE_ENV === 'development';
const isProd = process.env.REACT_APP_ENV === 'production' || process.env.NODE_ENV === 'production';

// API 配置
const api = {
  baseUrl: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000, // 请求超时时间（毫秒）
};

// 应用信息
const app = {
  name: process.env.REACT_APP_NAME || '个人账单管理系统',
  version: process.env.REACT_APP_VERSION || '1.0.0',
  env: process.env.REACT_APP_ENV || process.env.NODE_ENV || 'development',
};

// 存储键名
const storageKeys = {
  token: 'token',
  user: 'user',
  theme: 'theme',
};

// 分页配置
const pagination = {
  defaultPageSize: 10,
  pageSizeOptions: [10, 20, 50, 100],
};

// 日期格式
const dateFormats = {
  display: 'YYYY-MM-DD',
  displayTime: 'YYYY-MM-DD HH:mm:ss',
  month: 'YYYY-MM',
  year: 'YYYY',
};

// 导出配置
const config = {
  api,
  app,
  storageKeys,
  pagination,
  dateFormats,
  isDev,
  isProd,
};

export default config;
export { api, app, storageKeys, pagination, dateFormats, isDev, isProd };
