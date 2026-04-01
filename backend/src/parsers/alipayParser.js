/**
 * 支付宝账单CSV解析器
 * 
 * 解析支付宝导出的.csv格式账单文件
 * 支付宝导出的CSV文件使用GBK编码
 * 提取交易时间、金额、类型、交易对方、商品说明等字段
 */

const iconv = require('iconv-lite');

// 支付宝账单表头字段映射
const ALIPAY_HEADERS = {
  '交易时间': 'transactionTime',
  '交易分类': 'originalType',
  '交易对方': 'counterparty',
  '对方账号': 'counterpartyAccount',
  '商品说明': 'description',
  '收/支': 'transactionType',
  '金额': 'amount',
  '收/付款方式': 'paymentMethod',
  '交易状态': 'status',
  '交易订单号': 'orderNo',
  '商家订单号': 'merchantOrderNo',
  '备注': 'remark'
};

// 数据行起始标识（支付宝特有）
const DATA_START_MARKER = '------------------------支付宝';

/**
 * 判断是否为退款交易
 * @param {string} description - 商品说明
 * @param {string} originalType - 交易分类
 * @param {string} status - 交易状态
 * @returns {boolean}
 */
function isRefund(description, originalType, status) {
  const desc = String(description || '').toLowerCase();
  const type = String(originalType || '').toLowerCase();
  const stat = String(status || '').toLowerCase();
  
  // 检查关键词
  const refundKeywords = ['退款', '退票', '退货', '退还', '售后'];
  
  for (const keyword of refundKeywords) {
    if (desc.includes(keyword) || type.includes(keyword) || stat.includes(keyword)) {
      return true;
    }
  }
  
  // 检查交易状态是否包含"退款成功"
  if (stat.includes('退款成功')) {
    return true;
  }
  
  return false;
}

/**
 * 解析支付宝账单CSV文件
 * @param {Buffer} fileBuffer - 文件Buffer
 * @returns {{records: Array, skipped: number, errors: Array}}
 */
function parseAlipayCSV(fileBuffer) {
  // 支付宝CSV文件使用GBK编码，需要转换为UTF-8
  let content;
  try {
    content = iconv.decode(fileBuffer, 'gbk');
  } catch (err) {
    // 如果GBK解码失败，尝试UTF-8
    content = fileBuffer.toString('utf-8');
  }
  
  // 按行分割
  const lines = content.split(/\r?\n/);
  
  // 找到数据起始行（表头行）
  let headerRowIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line && line.includes(DATA_START_MARKER)) {
      headerRowIndex = i + 1; // 表头在标识行的下一行
      break;
    }
  }
  
  if (headerRowIndex === -1 || headerRowIndex >= lines.length) {
    throw new Error('无法找到支付宝账单数据表头，请确认文件格式正确');
  }
  
  // 解析表头行
  const headerLine = lines[headerRowIndex];
  const headers = parseCSVLine(headerLine);
  
  // 建立列索引映射
  const columnMapping = {};
  headers.forEach((header, index) => {
    const trimmedHeader = header.trim();
    if (ALIPAY_HEADERS[trimmedHeader]) {
      columnMapping[ALIPAY_HEADERS[trimmedHeader]] = index;
    }
  });
  
  const records = [];
  const errors = [];
  let skipped = 0;
  
  // 解析数据行
  for (let i = headerRowIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim() === '') {
      continue;
    }
    
    try {
      const row = parseCSVLine(line);
      if (row.length === 0) {
        continue;
      }
      
      const result = parseAlipayRowWithReason(row, columnMapping, i + 1);
      if (result.record) {
        records.push(result.record);
      } else {
        errors.push({ row: i + 1, message: result.reason || '无效记录', rawData: result.rawData });
        skipped++;
      }
    } catch (err) {
      errors.push({ row: i + 1, message: err.message });
      skipped++;
    }
  }
  
  // 按商家订单号合并退款记录
  // 场景：购买商品付款500元，后续退款30元，两条记录商家订单号相同
  // 处理逻辑：将同一商家订单号的支出和收入（退款）进行合并，计算净金额
  const mergedRecords = mergeRefundOrders(records);
  
  return { records: mergedRecords, skipped, errors };
}

/**
 * 合并同一商家订单号的退款记录
 * @param {Array} records - 原始记录列表
 * @returns {Array} - 合并后的记录列表
 */
function mergeRefundOrders(records) {
  // 按商家订单号分组
  const orderGroups = new Map();
  const noMerchantOrderRecords = []; // 没有商家订单号的记录不参与合并
  
  for (const record of records) {
    const merchantOrderNo = record.merchantOrderNo?.trim();
    
    // 没有商家订单号的记录直接保留
    if (!merchantOrderNo) {
      noMerchantOrderRecords.push(record);
      continue;
    }
    
    if (!orderGroups.has(merchantOrderNo)) {
      orderGroups.set(merchantOrderNo, []);
    }
    orderGroups.get(merchantOrderNo).push(record);
  }
  
  const mergedRecords = [];
  
  for (const [merchantOrderNo, groupRecords] of orderGroups) {
    // 单条记录直接保留
    if (groupRecords.length === 1) {
      mergedRecords.push(groupRecords[0]);
      continue;
    }
    
    // 多条记录需要合并：计算净金额
    // 支出为正，收入为负（退款）
    let netAmount = 0;
    let primaryRecord = null;
    let hasRefund = false;
    const refundDetails = [];
    
    for (const record of groupRecords) {
      if (record.transactionType === 'expense') {
        netAmount += record.amount;
        // 优先使用支出记录作为主记录
        if (!primaryRecord) {
          primaryRecord = record;
        }
      } else if (record.transactionType === 'income' || record.transactionType === 'refund') {
        // income: 收入类型的退款（如火车票退票）
        // refund: 不计收支类型的退款（商品说明包含"退款"）
        netAmount -= record.amount;
        hasRefund = true;
        refundDetails.push({
          time: record.transactionTime,
          amount: record.amount,
          description: record.description
        });
      }
    }
    
    // 如果没有找到主记录，使用第一条
    if (!primaryRecord) {
      primaryRecord = groupRecords[0];
    }
    
    // 净金额为0或负数，说明全额退款或多退款，跳过此订单
    if (netAmount <= 0) {
      continue;
    }
    
    // 创建合并后的记录
    const mergedRecord = {
      ...primaryRecord,
      amount: Math.round(netAmount * 100) / 100, // 保留两位小数
      // 标记已合并退款信息
      _mergedRefund: hasRefund ? {
        originalAmount: primaryRecord.amount,
        refundAmount: Math.round((primaryRecord.amount - netAmount) * 100) / 100,
        refundCount: refundDetails.length,
        refundDetails
      } : null
    };
    
    // 如果有退款，在备注中添加说明
    if (hasRefund && refundDetails.length > 0) {
      const refundTotal = refundDetails.reduce((sum, r) => sum + r.amount, 0);
      const refundNote = `[含退款 ${refundTotal.toFixed(2)} 元]`;
      mergedRecord.remark = mergedRecord.remark 
        ? `${mergedRecord.remark} ${refundNote}` 
        : refundNote;
    }
    
    mergedRecords.push(mergedRecord);
  }
  
  // 合并无商家订单号的记录
  return [...mergedRecords, ...noMerchantOrderRecords];
}

/**
 * 解析CSV行（处理逗号和引号）
 * @param {string} line - CSV行
 * @returns {Array<string>}
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // 转义的引号
        current += '"';
        i++;
      } else {
        // 切换引号状态
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // 添加最后一个字段
  result.push(current.trim());
  
  return result;
}

/**
 * 解析单行支付宝账单数据（带跳过原因）
 * @param {Array} row - 行数据
 * @param {Object} columnMapping - 列映射
 * @param {number} rowNumber - 行号（用于错误报告）
 * @returns {{record: Object|null, reason: string|null, rawData: Object}}
 */
function parseAlipayRowWithReason(row, columnMapping, rowNumber) {
  const getValue = (field) => {
    const index = columnMapping[field];
    return index !== undefined ? row[index] : null;
  };
  
  const transactionTimeRaw = getValue('transactionTime');
  const amountRaw = getValue('amount');
  const transactionTypeRaw = getValue('transactionType');
  const counterpartyRaw = getValue('counterparty');
  const descriptionRaw = getValue('description');
  const statusRaw = getValue('status');
  
  const rawData = {
    transactionTime: transactionTimeRaw,
    amount: amountRaw,
    transactionType: transactionTypeRaw,
    counterparty: counterpartyRaw,
    description: descriptionRaw,
    status: statusRaw
  };
  
  // 跳过空行或无效行
  if (!transactionTimeRaw || !amountRaw) {
    return { record: null, reason: '缺少交易时间或金额', rawData };
  }
  
  // 解析交易时间
  const transactionTime = parseAlipayDateTime(transactionTimeRaw);
  if (!transactionTime) {
    return { record: null, reason: `无效的交易时间格式: ${transactionTimeRaw}`, rawData };
  }
  
  // 解析金额
  const amount = parseAlipayAmount(amountRaw);
  if (amount === null) {
    return { record: null, reason: `无效的金额格式: ${amountRaw}`, rawData };
  }
  
  // 解析交易类型
  let transactionType = parseAlipayTransactionType(transactionTypeRaw);
  
  // 获取原始分类和商品说明用于判断是否为退款
  const originalTypeRaw = getValue('originalType');
  const isRefundTransaction = isRefund(descriptionRaw, originalTypeRaw, statusRaw);
  
  // 对于"不计收支"类型的交易
  if (transactionType === 'neutral') {
    // 如果是退款类交易，标记为refund类型，参与订单合并
    if (isRefundTransaction) {
      transactionType = 'refund';
    } else {
      // 其他不计收支交易（如信用卡还款、转账等）跳过
      return { record: null, reason: '不计收支类交易', rawData };
    }
  }
  
  // 获取其他字段
  const counterparty = cleanString(getValue('counterparty'));
  const description = cleanString(getValue('description'));
  const originalType = cleanString(getValue('originalType'));
  const paymentMethod = cleanString(getValue('paymentMethod'));
  const status = cleanString(getValue('status'));
  const orderNo = cleanString(getValue('orderNo'));
  const merchantOrderNo = cleanString(getValue('merchantOrderNo'));
  const remark = cleanString(getValue('remark'));
  const counterpartyAccount = cleanString(getValue('counterpartyAccount'));
  
  return {
    record: {
      transactionTime,
      amount,
      transactionType,
      counterparty,
      description,
      originalType,
      paymentMethod,
      status,
      orderNo,
      merchantOrderNo,
      remark,
      counterpartyAccount,
      sourcePlatform: 'alipay'
    },
    reason: null,
    rawData
  };
}

/**
 * 解析支付宝日期时间格式
 * @param {string} dateTimeRaw - 原始日期时间
 * @returns {Date|null}
 */
function parseAlipayDateTime(dateTimeRaw) {
  if (!dateTimeRaw) return null;
  
  const dateTimeStr = String(dateTimeRaw).trim();
  
  // 格式: "2025-12-31 23:58:31"
  const match = dateTimeStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (match) {
    const [, year, month, day, hour, minute, second] = match;
    return new Date(year, month - 1, day, hour, minute, second);
  }
  
  // 尝试直接解析
  const date = new Date(dateTimeStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * 解析支付宝金额格式
 * @param {string|number} amountRaw - 原始金额
 * @returns {number|null}
 */
function parseAlipayAmount(amountRaw) {
  if (amountRaw === null || amountRaw === undefined) return null;
  
  let amountStr = String(amountRaw).trim();
  
  // 去除¥符号、逗号和空格
  amountStr = amountStr.replace(/[¥￥,\s]/g, '');
  
  const amount = parseFloat(amountStr);
  return isNaN(amount) ? null : Math.abs(amount);
}

/**
 * 解析支付宝交易类型
 * @param {string} typeRaw - 原始类型
 * @returns {string} - 'income' | 'expense' | 'neutral'
 */
function parseAlipayTransactionType(typeRaw) {
  if (!typeRaw) return 'expense';
  
  const typeStr = String(typeRaw).trim();
  
  if (typeStr === '收入') {
    return 'income';
  } else if (typeStr === '支出') {
    return 'expense';
  } else if (typeStr === '不计收支') {
    return 'neutral';
  }
  
  // 默认为支出
  return 'expense';
}

/**
 * 清理字符串
 * @param {any} value - 原始值
 * @returns {string}
 */
function cleanString(value) {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  return str === '/' ? '' : str;
}

module.exports = {
  parseAlipayCSV,
  parseCSVLine,
  parseAlipayDateTime,
  parseAlipayAmount,
  parseAlipayTransactionType,
  cleanString,
  mergeRefundOrders
};
