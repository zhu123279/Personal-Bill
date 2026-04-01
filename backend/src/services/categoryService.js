/**
 * 分类服务
 * 
 * 提供分类管理功能（CRUD）
 */

const pool = require('../config/database');

// 分类颜色列表（用于新建分类时随机分配）
const CATEGORY_COLORS = [
  '#f5222d', '#fa541c', '#fa8c16', '#faad14', '#fadb14',
  '#a0d911', '#52c41a', '#13c2c2', '#1890ff', '#2f54eb',
  '#722ed1', '#eb2f96', '#8c8c8c'
];

/**
 * 获取用户的分类列表（带分页）
 * @param {number} userId - 用户ID
 * @param {Object} options - 分页选项
 * @returns {Promise<{categories: Array, total: number, page: number, pageSize: number}>}
 */
async function getCategories(userId, options = {}) {
  const { page = 1, pageSize = 10 } = options;
  const offset = (page - 1) * pageSize;
  
  // 获取总数（用户分类 + 系统分类）
  const [countResult] = await pool.execute(
    'SELECT COUNT(*) as total FROM categories WHERE user_id = ? OR user_id IS NULL',
    [userId]
  );
  const total = countResult[0].total;
  
  // 获取分页数据（用户分类 + 系统分类）
  const [categories] = await pool.execute(
    `SELECT c.id, c.name, c.type, c.icon, c.color, c.user_id,
            COUNT(b.id) as bill_count
     FROM categories c
     LEFT JOIN bills b ON c.id = b.category_id AND b.user_id = ?
     WHERE c.user_id = ? OR c.user_id IS NULL
     GROUP BY c.id, c.name, c.type, c.icon, c.color, c.user_id
     ORDER BY c.user_id IS NULL DESC, c.type, c.name
     LIMIT ? OFFSET ?`,
    [userId, userId, pageSize, offset]
  );
  
  return {
    categories: categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color,
      billCount: parseInt(cat.bill_count) || 0,
      isSystem: cat.user_id === null  // 标记是否为系统分类
    })),
    total,
    page,
    pageSize
  };
}

/**
 * 获取用户所有分类（不分页，用于下拉选择）
 * @param {number} userId - 用户ID
 * @returns {Promise<Array>}
 */
async function getAllCategories(userId) {
  // 返回用户分类 + 系统分类
  const [categories] = await pool.execute(
    `SELECT c.id, c.name, c.type, c.icon, c.color, c.user_id
     FROM categories c
     WHERE c.user_id = ? OR c.user_id IS NULL
     ORDER BY c.user_id IS NULL DESC, c.type, c.name`,
    [userId]
  );
  
  return categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    type: cat.type,
    icon: cat.icon,
    color: cat.color,
    isSystem: cat.user_id === null
  }));
}

/**
 * 根据名称获取或创建分类（用户级别）
 * @param {number} userId - 用户ID
 * @param {string} name - 分类名称
 * @returns {Promise<number>} 分类ID
 */
async function getOrCreateCategory(userId, name) {
  if (!name || name.trim() === '') {
    return null;
  }
  
  const trimmedName = name.trim();
  
  // 先查找用户自己的分类（忽略大小写）
  const [userCategory] = await pool.execute(
    'SELECT id FROM categories WHERE user_id = ? AND LOWER(name) = LOWER(?)',
    [userId, trimmedName]
  );
  
  if (userCategory.length > 0) {
    return userCategory[0].id;
  }
  
  // 再查找系统默认分类（user_id IS NULL），避免创建重复分类
  const [systemCategory] = await pool.execute(
    'SELECT id FROM categories WHERE user_id IS NULL AND LOWER(name) = LOWER(?)',
    [trimmedName]
  );
  
  if (systemCategory.length > 0) {
    // 系统默认分类存在，直接使用系统分类
    console.log(`使用系统默认分类: ${trimmedName}, ID: ${systemCategory[0].id}`);
    return systemCategory[0].id;
  }
  
  // 用户分类和系统分类都不存在，则创建用户自定义分类
  const color = CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)];
  const [result] = await pool.execute(
    'INSERT INTO categories (user_id, name, icon, color) VALUES (?, ?, ?, ?)',
    [userId, trimmedName, 'tag', color]
  );
  
  console.log(`自动创建分类: ${trimmedName}, ID: ${result.insertId}, 用户: ${userId}`);
  
  return result.insertId;
}

/**
 * 获取分类统计
 * @param {number} userId - 用户ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Array>}
 */
async function getCategoryStats(userId, options = {}) {
  const { startDate, endDate, transactionType = 'expense' } = options;
  
  let query = `
    SELECT c.id, c.name, c.icon, c.color, 
           COALESCE(SUM(b.amount), 0) as total,
           COUNT(b.id) as count
    FROM categories c
    LEFT JOIN bills b ON c.id = b.category_id 
      AND b.user_id = ? 
      AND b.transaction_type = ?
  `;
  
  const params = [userId, transactionType];
  
  if (startDate) {
    query += ' AND b.transaction_time >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    query += ' AND b.transaction_time <= ?';
    params.push(endDate);
  }
  
  query += ' GROUP BY c.id, c.name, c.icon, c.color ORDER BY total DESC';
  
  const [stats] = await pool.execute(query, params);
  
  return stats.map(stat => ({
    id: stat.id,
    name: stat.name,
    icon: stat.icon,
    color: stat.color,
    total: parseFloat(stat.total),
    count: stat.count
  }));
}

/**
 * 创建分类（用户级别）
 * @param {number} userId - 用户ID
 * @param {Object} data - 分类数据
 * @returns {Promise<Object>}
 */
async function createCategory(userId, categoryData) {
  const { name, type = 'expense', icon = 'tag', color } = categoryData;
  
  if (!name) {
    throw new Error('分类名称不能为空');
  }
  
  const finalColor = color || CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)];
  
  const [result] = await pool.execute(
    'INSERT INTO categories (user_id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)',
    [userId, name, type, icon, finalColor]
  );
  
  return {
    id: result.insertId,
    name,
    type,
    icon,
    color: finalColor
  };
}

/**
 * 更新分类（用户级别）
 * @param {number} userId - 用户ID
 * @param {number} id - 分类ID
 * @param {Object} data - 更新数据
 * @returns {Promise<Object|null>}
 */
async function updateCategory(userId, categoryId, categoryData) {
  const { name, type, icon, color } = categoryData;
  
  // 只能修改自己的分类，不能修改系统分类
  const [check] = await pool.execute(
    'SELECT id FROM categories WHERE id = ? AND user_id = ?',
    [categoryId, userId]
  );
  
  if (check.length === 0) {
    throw new Error('分类不存在或无权修改（系统分类不可修改）');
  }
  
  const updateFields = [];
  const params = [];
  
  if (name) {
    updateFields.push('name = ?');
    params.push(name);
  }
  
  if (type) {
    updateFields.push('type = ?');
    params.push(type);
  }
  
  if (icon) {
    updateFields.push('icon = ?');
    params.push(icon);
  }
  
  if (color) {
    updateFields.push('color = ?');
    params.push(color);
  }
  
  if (updateFields.length === 0) {
    // 没有需要更新的字段
    // 可以选择返回当前分类信息或抛出错误
    const [categories] = await pool.execute(
      'SELECT id, name, type, icon, color FROM categories WHERE id = ? AND user_id = ?',
      [categoryId, userId]
    );
    return categories.length > 0 ? categories[0] : null;
  }
  
  params.push(categoryId, userId);
  
  const [result] = await pool.execute(
    `UPDATE categories SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
    params
  );
  
  if (result.affectedRows === 0) {
    return null; // 理论上不会发生，因为前面已经检查过
  }
  
  // 返回更新后的分类
  const [categories] = await pool.execute(
    'SELECT id, name, type, icon, color FROM categories WHERE id = ? AND user_id = ?',
    [categoryId, userId]
  );
  
  if (categories.length === 0) {
    return null;
  }
  
  const cat = categories[0];
  return {
    id: cat.id,
    name: cat.name,
    type: cat.type,
    icon: cat.icon,
    color: cat.color
  };
}

/**
 * 删除分类（用户级别）
 * @param {number} userId - 用户ID
 * @param {number} id - 分类ID
 * @returns {Promise<boolean>}
 */
async function deleteCategory(userId, id) {
  // 先检查分类是否属于该用户
  const [check] = await pool.execute(
    'SELECT id FROM categories WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  
  if (check.length === 0) {
    return false;
  }
  
  // 将使用此分类的账单设为未分类
  await pool.execute(
    'UPDATE bills SET category_id = NULL WHERE category_id = ? AND user_id = ?',
    [id, userId]
  );
  
  // 删除分类
  const [result] = await pool.execute(
    'DELETE FROM categories WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  
  return result.affectedRows > 0;
}

/**
 * 批量删除分类（用户级别）
 * @param {number} userId - 用户ID
 * @param {Array<number>} ids - 分类ID数组
 * @returns {Promise<{deleted: number}>}
 */
async function batchDeleteCategories(userId, ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { deleted: 0 };
  }
  
  // 将使用这些分类的账单设为未分类
  const placeholders = ids.map(() => '?').join(',');
  await pool.execute(
    `UPDATE bills SET category_id = NULL WHERE user_id = ? AND category_id IN (${placeholders})`,
    [userId, ...ids]
  );
  
  // 批量删除分类
  const [result] = await pool.execute(
    `DELETE FROM categories WHERE user_id = ? AND id IN (${placeholders})`,
    [userId, ...ids]
  );
  
  return { deleted: result.affectedRows };
}

module.exports = {
  getCategories,
  getAllCategories,
  getOrCreateCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  batchDeleteCategories,
  getCategoryStats
};
