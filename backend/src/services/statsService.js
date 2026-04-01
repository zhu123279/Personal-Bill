/**
 * 统计服务
 * 
 * 提供收支摘要、分类统计、趋势分析等功能
 */

const pool = require('../config/database');

/**
 * 获取收支摘要
 * @param {number} userId - 用户ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>}
 */
async function getSummary(userId, options = {}) {
  const { startDate, endDate } = options;
  
  let query = `
    SELECT 
      transaction_type,
      COALESCE(SUM(amount), 0) as total,
      COUNT(*) as count
    FROM bills
    WHERE user_id = ?
  `;
  
  const params = [userId];
  
  if (startDate) {
    query += ' AND transaction_time >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    query += ' AND transaction_time <= ?';
    params.push(endDate);
  }
  
  query += ' GROUP BY transaction_type';
  
  const [results] = await pool.execute(query, params);
  
  let totalIncome = 0;
  let totalExpense = 0;
  let incomeCount = 0;
  let expenseCount = 0;
  
  for (const row of results) {
    if (row.transaction_type === 'income') {
      totalIncome = parseFloat(row.total);
      incomeCount = row.count;
    } else if (row.transaction_type === 'expense') {
      totalExpense = parseFloat(row.total);
      expenseCount = row.count;
    }
  }
  
  return {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
    incomeCount,
    expenseCount,
    totalCount: incomeCount + expenseCount
  };
}

/**
 * 获取分类统计
 * @param {number} userId - 用户ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Array>}
 */
async function getCategoryStats(userId, options = {}) {
  const { startDate, endDate, transactionType = 'expense' } = options;
  
  // 使用子查询方式，处理category_id为NULL的情况
  let query = `
    SELECT 
      COALESCE(c.id, 8) as id,
      COALESCE(c.name, '其他') as name,
      COALESCE(c.icon, 'question') as icon,
      COALESCE(c.color, '#8c8c8c') as color,
      COALESCE(SUM(b.amount), 0) as total,
      COUNT(b.id) as count
    FROM bills b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE b.user_id = ? AND b.transaction_type = ?
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
  
  query += ' GROUP BY COALESCE(c.id, 8), COALESCE(c.name, \'其他\'), COALESCE(c.icon, \'question\'), COALESCE(c.color, \'#8c8c8c\') HAVING total > 0 ORDER BY total DESC';
  
  const [stats] = await pool.execute(query, params);
  
  const totalAmount = stats.reduce((sum, s) => sum + parseFloat(s.total), 0);
  
  return stats.map(stat => ({
    id: stat.id,
    name: stat.name,
    icon: stat.icon,
    color: stat.color,
    total: parseFloat(stat.total),
    count: stat.count,
    percentage: totalAmount > 0 ? (parseFloat(stat.total) / totalAmount * 100).toFixed(2) : 0
  }));
}

/**
 * 获取趋势数据
 * @param {number} userId - 用户ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Array>}
 */
async function getTrend(userId, options = {}) {
  const { startDate, endDate, groupBy = 'day' } = options;
  
  let dateFormat;
  if (groupBy === 'month') {
    dateFormat = '%Y-%m';
  } else if (groupBy === 'week') {
    dateFormat = '%Y-%u';
  } else {
    dateFormat = '%Y-%m-%d';
  }
  
  let query = `
    SELECT 
      DATE_FORMAT(transaction_time, '${dateFormat}') as period,
      transaction_type,
      COALESCE(SUM(amount), 0) as total,
      COUNT(*) as count
    FROM bills
    WHERE user_id = ?
  `;
  
  const params = [userId];
  
  if (startDate) {
    query += ' AND transaction_time >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    query += ' AND transaction_time <= ?';
    params.push(endDate);
  }
  
  query += ` GROUP BY period, transaction_type ORDER BY period ASC`;
  
  const [results] = await pool.execute(query, params);
  
  // 按日期聚合
  const trendMap = new Map();
  
  for (const row of results) {
    if (!trendMap.has(row.period)) {
      trendMap.set(row.period, {
        period: row.period,
        income: 0,
        expense: 0,
        incomeCount: 0,
        expenseCount: 0
      });
    }
    
    const item = trendMap.get(row.period);
    if (row.transaction_type === 'income') {
      item.income = parseFloat(row.total);
      item.incomeCount = row.count;
    } else {
      item.expense = parseFloat(row.total);
      item.expenseCount = row.count;
    }
  }
  
  return Array.from(trendMap.values());
}

/**
 * 获取月度对比数据
 * @param {number} userId - 用户ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Array>}
 */
async function getMonthlyComparison(userId, options = {}) {
  const { year } = options;
  
  let query = `
    SELECT 
      DATE_FORMAT(transaction_time, '%Y-%m') as month,
      transaction_type,
      COALESCE(SUM(amount), 0) as total,
      COUNT(*) as count
    FROM bills
    WHERE user_id = ?
  `;
  
  const params = [userId];
  
  if (year) {
    query += ' AND YEAR(transaction_time) = ?';
    params.push(year);
  }
  
  query += ' GROUP BY month, transaction_type ORDER BY month ASC';
  
  const [results] = await pool.execute(query, params);
  
  // 按月份聚合
  const monthlyMap = new Map();
  
  for (const row of results) {
    if (!monthlyMap.has(row.month)) {
      monthlyMap.set(row.month, {
        month: row.month,
        income: 0,
        expense: 0,
        netBalance: 0
      });
    }
    
    const item = monthlyMap.get(row.month);
    if (row.transaction_type === 'income') {
      item.income = parseFloat(row.total);
    } else {
      item.expense = parseFloat(row.total);
    }
    item.netBalance = item.income - item.expense;
  }
  
  return Array.from(monthlyMap.values());
}

/**
 * 获取单笔消费排行榜
 * @param {number} userId - 用户ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Array>}
 */
async function getTopExpenses(userId, options = {}) {
  const { startDate, endDate, limit = 10 } = options;
  
  let query = `
    SELECT 
      b.id,
      b.transaction_time,
      b.amount,
      b.counterparty,
      b.description,
      b.original_type,
      b.payment_method
    FROM bills b
    WHERE b.user_id = ? AND b.transaction_type = 'expense'
  `;
  
  const params = [userId];
  
  if (startDate) {
    query += ' AND b.transaction_time >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    query += ' AND b.transaction_time <= ?';
    params.push(endDate);
  }
  
  query += ` ORDER BY b.amount DESC LIMIT ${parseInt(limit)}`;
  
  const [results] = await pool.execute(query, params);
  
  return results.map(row => ({
    id: row.id,
    transactionTime: row.transaction_time,
    amount: parseFloat(row.amount),
    counterparty: row.counterparty,
    description: row.description,
    originalType: row.original_type,
    paymentMethod: row.payment_method
  }));
}

/**
 * 获取月度支出明细（按日期分组）
 * @param {number} userId - 用户ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Array>}
 */
async function getDailyExpenses(userId, options = {}) {
  const { startDate, endDate } = options;
  
  let query = `
    SELECT 
      DATE(transaction_time) as date,
      COALESCE(SUM(amount), 0) as total,
      COUNT(*) as count
    FROM bills
    WHERE user_id = ? AND transaction_type = 'expense'
  `;
  
  const params = [userId];
  
  if (startDate) {
    query += ' AND transaction_time >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    query += ' AND transaction_time <= ?';
    params.push(endDate);
  }
  
  query += ' GROUP BY DATE(transaction_time) ORDER BY date ASC';
  
  const [results] = await pool.execute(query, params);
  
  return results.map(row => ({
    date: row.date,
    total: parseFloat(row.total),
    count: row.count
  }));
}

/**
 * 获取年度统计数据
 * @param {number} userId - 用户ID
 * @param {number} year - 年份
 * @returns {Promise<Object>}
 */
async function getYearlyStats(userId, year) {
  const startDate = `${year}-01-01 00:00:00`;
  const endDate = `${year}-12-31 23:59:59`;
  
  // 获取年度汇总
  const summary = await getSummary(userId, { startDate, endDate });
  
  // 获取支出分类统计
  const expenseByCategory = await getCategoryStats(userId, { 
    startDate, endDate, transactionType: 'expense' 
  });
  
  // 获取收入分类统计
  const incomeByCategory = await getCategoryStats(userId, { 
    startDate, endDate, transactionType: 'income' 
  });
  
  // 获取月度数据
  const [monthlyResults] = await pool.execute(`
    SELECT 
      MONTH(transaction_time) as month,
      transaction_type,
      COALESCE(SUM(amount), 0) as total
    FROM bills
    WHERE user_id = ? AND YEAR(transaction_time) = ?
    GROUP BY MONTH(transaction_time), transaction_type
    ORDER BY month ASC
  `, [userId, year]);
  
  // 构建12个月的数据
  const monthlyData = [];
  for (let m = 1; m <= 12; m++) {
    const incomeRow = monthlyResults.find(r => r.month === m && r.transaction_type === 'income');
    const expenseRow = monthlyResults.find(r => r.month === m && r.transaction_type === 'expense');
    const income = incomeRow ? parseFloat(incomeRow.total) : 0;
    const expense = expenseRow ? parseFloat(expenseRow.total) : 0;
    monthlyData.push({
      month: m,
      monthName: `${m}月`,
      income,
      expense,
      balance: income - expense
    });
  }
  
  // 计算累计数据
  let cumulativeIncome = 0;
  let cumulativeExpense = 0;
  const cumulativeData = monthlyData.map(item => {
    cumulativeIncome += item.income;
    cumulativeExpense += item.expense;
    return {
      month: item.month,
      monthName: item.monthName,
      cumulativeIncome,
      cumulativeExpense,
      cumulativeBalance: cumulativeIncome - cumulativeExpense
    };
  });
  
  // 月份排行榜（支出）
  const expenseRanking = [...monthlyData]
    .filter(m => m.expense > 0)
    .sort((a, b) => b.expense - a.expense);
  
  // 月份排行榜（结余）
  const balanceRanking = [...monthlyData]
    .filter(m => m.income > 0 || m.expense > 0)
    .sort((a, b) => b.balance - a.balance);
  
  return {
    year,
    summary,
    expenseByCategory,
    incomeByCategory,
    monthlyData,
    cumulativeData,
    expenseRanking,
    balanceRanking
  };
}

module.exports = {
  getSummary,
  getCategoryStats,
  getTrend,
  getMonthlyComparison,
  getTopExpenses,
  getDailyExpenses,
  getYearlyStats
};
