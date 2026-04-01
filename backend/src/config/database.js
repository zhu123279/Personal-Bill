const mysql = require('mysql2/promise');
const config = require('./index');

// 使用统一配置创建连接池
const pool = mysql.createPool(config.database);

module.exports = pool;
