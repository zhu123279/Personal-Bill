/**
 * 账单服务
 * 
 * 提供账单的CRUD操作、筛选、重复检测等功能
 */

const pool = require('../config/database');
const categoryService = require('./categoryService');

/**
 * 获取账单列表（分页、筛选）
 * @param {number} userId - 用户ID
 * @param {Object} options - 查询选项
 * @returns {Promise<{bills: Array, total: number, page: number, pageSize: number}>}
 */
async function getBills(userId, options = {}) {
  const {
    page = 1,
    pageSize = 20,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    transactionType,
    categoryId,
    keyword,
    sourcePlatform,
    sortBy = 'transaction_time',
    sortOrder = 'DESC'
  } = options;
  
  const offset = (page - 1) * pageSize;
  const conditions = ['b.user_id = ?'];
  const params = [userId];
  
  // 日期范围筛选
  if (startDate) {
    conditions.push('b.transaction_time >= ?');
    params.push(startDate);
  }
  if (endDate) {
    conditions.push('b.transaction_time <= ?');
    params.push(endDate);
  }
  
  // 金额范围筛选
  if (minAmount !== undefined && minAmount !== null) {
    conditions.push('b.amount >= ?');
    params.push(minAmount);
  }
  if (maxAmount !== undefined && maxAmount !== null) {
    conditions.push('b.amount <= ?');
    params.push(maxAmount);
  }
  
  // 交易类型筛选
  if (transactionType) {
    conditions.push('b.transaction_type = ?');
    params.push(transactionType);
  }
  
  // 分类筛选
  if (categoryId) {
    conditions.push('b.category_id = ?');
    params.push(categoryId);
  }
  
  // 来源平台筛选
  if (sourcePlatform) {
    conditions.push('b.source_platform = ?');
    params.push(sourcePlatform);
  }
  
  // 关键词搜索
  if (keyword) {
    conditions.push('(b.counterparty LIKE ? OR b.description LIKE ?)');
    const keywordPattern = `%${keyword}%`;
    params.push(keywordPattern, keywordPattern);
  }
  
  const whereClause = conditions.join(' AND ');
  
  // 验证排序字段
  const allowedSortFields = ['transaction_time', 'amount', 'created_at'];
  const safeSortBy = allowedSortFields.includes(sortBy) ? `b.${sortBy}` : 'b.transaction_time';
  const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  
  // 查询总数
  const [countResult] = await pool.execute(
    `SELECT COUNT(*) as total FROM bills b WHERE ${whereClause}`,
    params
  );
  const total = countResult[0].total;
  
  // 查询数据
  const [bills] = await pool.execute(
    `SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM bills b
     LEFT JOIN categories c ON b.category_id = c.id
     WHERE ${whereClause}
     ORDER BY ${safeSortBy} ${safeSortOrder}
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  
  return {
    bills: bills.map(formatBillRecord),
    total,
    page,
    pageSize
  };
}

/**
 * 获取单条账单详情
 * @param {number} userId - 用户ID
 * @param {number} billId - 账单ID
 * @returns {Promise<Object|null>}
 */
async function getBillById(userId, billId) {
  const [bills] = await pool.execute(
    `SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM bills b
     LEFT JOIN categories c ON b.category_id = c.id
     WHERE b.id = ? AND b.user_id = ?`,
    [billId, userId]
  );
  
  if (bills.length === 0) {
    return null;
  }
  
  return formatBillRecord(bills[0]);
}

/**
 * 格式化时间为 MySQL DATETIME 格式
 * @param {string|Date} time - 时间
 * @returns {string}
 */
function formatDateTimeForMySQL(time) {
  if (!time) return null;
  const date = new Date(time);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * 创建账单记录
 * @param {number} userId - 用户ID
 * @param {Object} billData - 账单数据
 * @returns {Promise<Object>}
 */
async function createBill(userId, billData) {
  const {
    transactionTime,
    amount,
    transactionType,
    counterparty,
    description,
    categoryId,
    sourcePlatform,
    originalType,
    paymentMethod,
    status,
    orderNo,
    merchantOrderNo,
    remark
  } = billData;
  
  // 转换时间格式为 MySQL 兼容格式
  const formattedTime = formatDateTimeForMySQL(transactionTime);
  
  // 使用指定的分类，如果有 originalType 则根据其创建/获取分类
  let finalCategoryId = categoryId;
  if (!finalCategoryId && originalType) {
    finalCategoryId = await categoryService.getOrCreateCategory(userId, originalType);
  }
  
  // 清理订单号（去除空格、制表符和不可见字符）
  const cleanOrderNo = orderNo ? orderNo.trim().replace(/[\t\s\u00A0\u200B-\u200D\uFEFF]/g, '') : null;
  const cleanMerchantOrderNo = merchantOrderNo ? merchantOrderNo.trim().replace(/[\t\s\u00A0\u200B-\u200D\uFEFF]/g, '') : null;
  
  const [result] = await pool.execute(
    `INSERT INTO bills (
      user_id, transaction_time, amount, transaction_type, counterparty,
      description, category_id, source_platform, original_type, payment_method,
      status, order_no, merchant_order_no, remark
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      formattedTime,
      amount,
      transactionType,
      counterparty || null,
      description || null,
      finalCategoryId || null,
      sourcePlatform || 'manual',
      originalType || null,
      paymentMethod || null,
      status || null,
      cleanOrderNo,
      cleanMerchantOrderNo,
      remark || null
    ]
  );
  
  return getBillById(userId, result.insertId);
}

/**
 * 更新账单记录
 * @param {number} userId - 用户ID
 * @param {number} billId - 账单ID
 * @param {Object} billData - 更新数据
 * @returns {Promise<Object|null>}
 */
async function updateBill(userId, billId, billData) {
  // 先检查账单是否存在且属于该用户
  const existingBill = await getBillById(userId, billId);
  if (!existingBill) {
    return null;
  }
  
  const updateFields = [];
  const params = [];
  
  const allowedFields = [
    'transactionTime', 'amount', 'transactionType', 'counterparty',
    'description', 'categoryId', 'originalType', 'paymentMethod',
    'status', 'orderNo', 'merchantOrderNo', 'remark'
  ];
  
  const fieldMapping = {
    transactionTime: 'transaction_time',
    transactionType: 'transaction_type',
    categoryId: 'category_id',
    originalType: 'original_type',
    paymentMethod: 'payment_method',
    orderNo: 'order_no',
    merchantOrderNo: 'merchant_order_no'
  };
  
  for (const field of allowedFields) {
    if (billData[field] !== undefined) {
      const dbField = fieldMapping[field] || field;
      updateFields.push(`${dbField} = ?`);
      params.push(billData[field]);
    }
  }
  
  if (updateFields.length === 0) {
    return existingBill;
  }
  
  params.push(billId, userId);
  
  await pool.execute(
    `UPDATE bills SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
    params
  );
  

  
  return getBillById(userId, billId);
}

/**
 * 删除账单记录
 * @param {number} userId - 用户ID
 * @param {number} billId - 账单ID
 * @returns {Promise<boolean>}
 */
async function deleteBill(userId, billId) {
  const [result] = await pool.execute(
    'DELETE FROM bills WHERE id = ? AND user_id = ?',
    [billId, userId]
  );
  
  return result.affectedRows > 0;
}

/**
 * 批量保存账单
 * @param {number} userId - 用户ID
 * @param {Array} bills - 账单数组
 * @returns {Promise<{inserted: number, skipped: number, skippedDetails: Array}>}
 */
async function batchSaveBills(userId, bills) {
  if (!Array.isArray(bills) || bills.length === 0) {
    return { inserted: 0, skipped: 0, skippedDetails: [] };
  }

  let inserted = 0;
  let skipped = 0;
  const skippedDetails = [];

  for (const bill of bills) {
    try {
      // 检查交易状态，跳过已关闭/全额退款的交易
      // 注意：部分退款（如"已退款(￥5.00)"）由前端处理，不在此跳过
      const status = (bill.status || '').trim();
      const statusLower = status.toLowerCase();
      
      // 检查是否是部分退款（格式如：已退款(￥5.00)）
      const isPartialRefund = /已退款[（(]￥?[\d.]+[）)]/.test(status);
      
      // 只跳过交易关闭和全额退款，不跳过部分退款
      if (!isPartialRefund && (
        status.includes('关闭') ||
        status === '已退款' ||
        status === '退款成功' ||
        status === '交易关闭' ||
        status === '已关闭' ||
        status === '已全额退款' ||
        statusLower === 'closed' ||
        statusLower === 'refunded'
      )) {
        skipped++;
        skippedDetails.push({
          time: bill.transactionTime,
          amount: bill.amount,
          counterparty: bill.counterparty || bill.description,
          reason: `交易状态: ${bill.status}`,
        });
        continue;
      }

      // 检查是否重复
      const isDuplicate = await checkDuplicate(userId, bill);
      if (isDuplicate) {
        skipped++;
        skippedDetails.push({
          time: bill.transactionTime,
          amount: bill.amount,
          counterparty: bill.counterparty || bill.description,
          reason: '重复账单',
        });
        continue;
      }

      await createBill(userId, bill);
      inserted++;
    } catch (err) {
      console.error('批量保存账单错误:', err.message, bill);
      skipped++;
      skippedDetails.push({
        time: bill.transactionTime,
        amount: bill.amount,
        counterparty: bill.counterparty || bill.description,
        reason: `保存失败: ${err.message}`,
      });
    }
  }

  return { inserted, skipped, skippedDetails };
}

/**
 * 检测重复账单
 * @param {number} userId - 用户ID
 * @param {Object} bill - 账单数据
 * @returns {Promise<boolean>}
 */
async function checkDuplicate(userId, bill) {
  const { transactionTime, amount, orderNo, originalAmount, status } = bill;
  
  // 优先使用订单号检测重复（最准确）
  if (orderNo) {
    // 清理订单号（去除空格、制表符和不可见字符）
    const cleanOrderNo = orderNo.trim().replace(/[\t\s\u00A0\u200B-\u200D\uFEFF]/g, '');
    const [duplicates] = await pool.execute(
      `SELECT id FROM bills WHERE user_id = ? AND order_no = ? LIMIT 1`,
      [userId, cleanOrderNo]
    );
    return duplicates.length > 0;
  }
  
  // 转换时间格式
  const formattedTime = formatDateTimeForMySQL(transactionTime);
  
  // 没有订单号时，使用时间+金额检测（允许1分钟误差）
  // 同时检查当前金额、原始金额和调整后金额（处理部分退款的情况）
  const amountsToCheck = [amount];
  
  // 检查是否是部分退款
  const partialRefund = parsePartialRefund(status);
  if (partialRefund !== null && amount > partialRefund) {
    const adjustedAmount = amount - partialRefund;
    amountsToCheck.push(adjustedAmount);
  }
  
  if (originalAmount && originalAmount !== amount) {
    amountsToCheck.push(originalAmount);
  }
  
  const placeholders = amountsToCheck.map(() => '?').join(',');
  const [duplicates] = await pool.execute(
    `SELECT id FROM bills 
     WHERE user_id = ? 
     AND ABS(TIMESTAMPDIFF(SECOND, transaction_time, ?)) < 60
     AND amount IN (${placeholders})
     LIMIT 1`,
    [userId, formattedTime, ...amountsToCheck]
  );
  
  return duplicates.length > 0;
}

/**
 * 解析部分退款金额
 * @param {string} status - 交易状态
 * @returns {number|null} 退款金额，如果不是部分退款返回 null
 */
function parsePartialRefund(status) {
  if (!status) return null;
  // 匹配 "已退款(￥5.00)" 或 "已退款（￥5.00）" 格式
  const match = status.match(/已退款[（(]￥?([\d.]+)[）)]/);
  if (match) {
    return parseFloat(match[1]);
  }
  return null;
}

/**
 * 检测批量账单中的重复项
 * @param {number} userId - 用户ID
 * @param {Array} bills - 账单数组
 * @returns {Promise<Array<{index: number, existingId: number}>>}
 */
async function detectDuplicates(userId, bills) {
  const duplicates = [];
  
  for (let i = 0; i < bills.length; i++) {
    const bill = bills[i];
    
    // 优先使用订单号检测重复
    if (bill.orderNo) {
      // 清理订单号（去除空格、制表符和不可见字符）
      const cleanOrderNo = bill.orderNo.trim().replace(/[\t\s\u00A0\u200B-\u200D\uFEFF]/g, '');
      const [existing] = await pool.execute(
        `SELECT id FROM bills WHERE user_id = ? AND order_no = ? LIMIT 1`,
        [userId, cleanOrderNo]
      );
      
      if (existing.length > 0) {
        duplicates.push({ index: i, existingId: existing[0].id });
        continue;
      }
    }
    
    // 没有订单号或订单号未匹配时，使用时间+金额检测（允许1分钟误差）
    const formattedTime = formatDateTimeForMySQL(bill.transactionTime);
    const amountsToCheck = [bill.amount];
    
    // 检查是否是部分退款，如果是，也检查调整后的金额
    const partialRefund = parsePartialRefund(bill.status);
    if (partialRefund !== null && bill.amount > partialRefund) {
      amountsToCheck.push(bill.amount - partialRefund);
    }
    
    // 如果前端传了 originalAmount，也加入检查
    if (bill.originalAmount && bill.originalAmount !== bill.amount) {
      amountsToCheck.push(bill.originalAmount);
    }
    
    const placeholders = amountsToCheck.map(() => '?').join(',');
    const [existing] = await pool.execute(
      `SELECT id FROM bills 
       WHERE user_id = ? 
       AND ABS(TIMESTAMPDIFF(SECOND, transaction_time, ?)) < 60
       AND amount IN (${placeholders})
       LIMIT 1`,
      [userId, formattedTime, ...amountsToCheck]
    );
    
    if (existing.length > 0) {
      duplicates.push({ index: i, existingId: existing[0].id });
    }
  }
  
  return duplicates;
}

/**
 * 格式化账单记录
 * @param {Object} record - 数据库记录
 * @returns {Object}
 */
function formatBillRecord(record) {
  return {
    id: record.id,
    userId: record.user_id,
    transactionTime: record.transaction_time,
    amount: parseFloat(record.amount),
    transactionType: record.transaction_type,
    counterparty: record.counterparty,
    description: record.description,
    categoryId: record.category_id,
    categoryName: record.category_name,
    categoryIcon: record.category_icon,
    categoryColor: record.category_color,
    sourcePlatform: record.source_platform,
    originalType: record.original_type,
    paymentMethod: record.payment_method,
    status: record.status,
    orderNo: record.order_no,
    merchantOrderNo: record.merchant_order_no,
    remark: record.remark,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

/**
 * 批量删除账单
 * @param {number} userId - 用户ID
 * @param {Array<number>} ids - 账单ID数组
 * @returns {Promise<{deleted: number}>}
 */
async function batchDeleteBills(userId, ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { deleted: 0 };
  }
  
  // 使用 IN 子句批量删除
  const placeholders = ids.map(() => '?').join(',');
  const [result] = await pool.execute(
    `DELETE FROM bills WHERE user_id = ? AND id IN (${placeholders})`,
    [userId, ...ids]
  );
  
  return { deleted: result.affectedRows };
}

/**
 * 批量更新账单
 * @param {number} userId - 用户ID
 * @param {Array<number>} ids - 账单ID数组
 * @param {Object} updateData - 更新数据
 * @returns {Promise<{updated: number}>}
 */
async function batchUpdateBills(userId, ids, updateData) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { updated: 0 };
  }

  const updateFields = [];
  const params = [];

  // 支持更新的字段
  if (updateData.categoryId !== undefined && updateData.categoryId !== null) {
    updateFields.push('category_id = ?');
    params.push(updateData.categoryId);
  }

  if (updateData.transactionType) {
    updateFields.push('transaction_type = ?');
    params.push(updateData.transactionType);
  }

  if (updateFields.length === 0) {
    return { updated: 0 };
  }

  const placeholders = ids.map(() => '?').join(',');
  params.push(userId, ...ids);

  const [result] = await pool.execute(
    `UPDATE bills SET ${updateFields.join(', ')} WHERE user_id = ? AND id IN (${placeholders})`,
    params
  );

  return { updated: result.affectedRows };
}

module.exports = {
  getBills,
  getBillById,
  createBill,
  updateBill,
  deleteBill,
  batchSaveBills,
  batchDeleteBills,
  batchUpdateBills,
  checkDuplicate,
  detectDuplicates,
  formatBillRecord
};
