/**
 * 账单记录验证器
 * 
 * 验证账单记录的必填字段和数据格式
 * 返回验证结果和错误信息
 */

/**
 * 验证单条账单记录
 * @param {Object} record - 账单记录
 * @returns {{valid: boolean, errors: Array<string>}}
 */
function validateBillRecord(record) {
  const errors = [];
  
  if (!record) {
    return { valid: false, errors: ['记录不能为空'] };
  }
  
  // 验证交易时间
  if (!record.transactionTime) {
    errors.push('交易时间不能为空');
  } else if (!isValidDate(record.transactionTime)) {
    errors.push('交易时间格式无效');
  }
  
  // 验证金额
  if (record.amount === null || record.amount === undefined) {
    errors.push('金额不能为空');
  } else if (typeof record.amount !== 'number' || isNaN(record.amount)) {
    errors.push('金额必须是有效数字');
  } else if (record.amount < 0) {
    errors.push('金额不能为负数');
  }
  
  // 验证交易类型
  if (!record.transactionType) {
    errors.push('交易类型不能为空');
  } else if (!['income', 'expense', 'refund'].includes(record.transactionType)) {
    errors.push('交易类型必须是 income、expense 或 refund');
  }
  
  // 验证来源平台
  if (!record.sourcePlatform) {
    errors.push('来源平台不能为空');
  } else if (!['wechat', 'alipay', 'manual'].includes(record.sourcePlatform)) {
    errors.push('来源平台必须是 wechat、alipay 或 manual');
  }
  
  // 验证交易对方（可选但建议有）
  if (record.counterparty !== undefined && record.counterparty !== null) {
    if (typeof record.counterparty !== 'string') {
      errors.push('交易对方必须是字符串');
    } else if (record.counterparty.length > 255) {
      errors.push('交易对方长度不能超过255个字符');
    }
  }
  
  // 验证描述（可选）
  if (record.description !== undefined && record.description !== null) {
    if (typeof record.description !== 'string') {
      errors.push('商品说明必须是字符串');
    }
  }
  
  // 验证订单号（可选）
  if (record.orderNo !== undefined && record.orderNo !== null) {
    if (typeof record.orderNo !== 'string') {
      errors.push('交易单号必须是字符串');
    } else if (record.orderNo.length > 100) {
      errors.push('交易单号长度不能超过100个字符');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 批量验证账单记录
 * @param {Array} records - 账单记录数组
 * @returns {{validRecords: Array, invalidRecords: Array<{record: Object, errors: Array}>}}
 */
function validateBillRecords(records) {
  if (!Array.isArray(records)) {
    return {
      validRecords: [],
      invalidRecords: [{ record: records, errors: ['输入必须是数组'] }]
    };
  }
  
  const validRecords = [];
  const invalidRecords = [];
  
  records.forEach((record, index) => {
    const result = validateBillRecord(record);
    if (result.valid) {
      validRecords.push(record);
    } else {
      invalidRecords.push({
        index,
        record,
        errors: result.errors
      });
    }
  });
  
  return { validRecords, invalidRecords };
}

/**
 * 检查日期是否有效
 * @param {any} date - 日期值
 * @returns {boolean}
 */
function isValidDate(date) {
  if (!date) return false;
  
  if (date instanceof Date) {
    return !isNaN(date.getTime());
  }
  
  if (typeof date === 'string') {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }
  
  return false;
}

/**
 * 规范化账单记录
 * 将记录转换为标准格式，填充默认值
 * @param {Object} record - 原始记录
 * @returns {Object}
 */
function normalizeBillRecord(record) {
  if (!record) return null;
  
  // 规范化交易时间
  let transactionTime = record.transactionTime;
  if (transactionTime && !(transactionTime instanceof Date)) {
    transactionTime = new Date(transactionTime);
  }
  
  return {
    transactionTime,
    amount: typeof record.amount === 'number' ? Math.abs(record.amount) : 0,
    transactionType: record.transactionType || 'expense',
    counterparty: String(record.counterparty || '').trim(),
    description: String(record.description || '').trim(),
    originalType: String(record.originalType || '').trim(),
    paymentMethod: String(record.paymentMethod || '').trim(),
    status: String(record.status || '').trim(),
    orderNo: String(record.orderNo || '').trim(),
    merchantOrderNo: String(record.merchantOrderNo || '').trim(),
    remark: String(record.remark || '').trim(),
    sourcePlatform: record.sourcePlatform || 'manual',
    // 保留退款信息（如有）
    _mergedRefund: record._mergedRefund || null
  };
}

/**
 * 验证并规范化账单记录
 * @param {Object} record - 原始记录
 * @returns {{valid: boolean, record: Object|null, errors: Array}}
 */
function validateAndNormalize(record) {
  const validation = validateBillRecord(record);
  
  if (!validation.valid) {
    return {
      valid: false,
      record: null,
      errors: validation.errors
    };
  }
  
  return {
    valid: true,
    record: normalizeBillRecord(record),
    errors: []
  };
}

module.exports = {
  validateBillRecord,
  validateBillRecords,
  normalizeBillRecord,
  validateAndNormalize,
  isValidDate
};
