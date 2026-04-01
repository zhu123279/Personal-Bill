/**
 * 微信支付账单Excel解析器
 * 
 * 解析微信支付导出的.xlsx格式账单文件
 * 提取交易时间、金额、类型、交易对方、商品说明等字段
 */

const xlsx = require('xlsx');

// 微信账单表头字段映射
const WECHAT_HEADERS = {
  '交易时间': 'transactionTime',
  '交易类型': 'originalType',
  '交易对方': 'counterparty',
  '商品': 'description',
  '收/支': 'transactionType',
  '金额(元)': 'amount',
  '支付方式': 'paymentMethod',
  '当前状态': 'status',
  '交易单号': 'orderNo',
  '商户单号': 'merchantOrderNo',
  '备注': 'remark'
};

// 数据行起始标识
const DATA_START_MARKER = '----------------------微信支付账单明细列表--------------------';

/**
 * 解析微信账单Excel文件
 * @param {Buffer|string} fileInput - 文件Buffer或文件路径
 * @returns {{records: Array, skipped: number, errors: Array}}
 */
function parseWechatExcel(fileInput) {
  const workbook = typeof fileInput === 'string' 
    ? xlsx.readFile(fileInput)
    : xlsx.read(fileInput, { type: 'buffer' });
  
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  
  // 找到数据起始行（表头行）
  let headerRowIndex = -1;
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    if (row && row[0] === DATA_START_MARKER) {
      headerRowIndex = i + 1; // 表头在标识行的下一行
      break;
    }
  }
  
  if (headerRowIndex === -1 || headerRowIndex >= rawData.length) {
    throw new Error('无法找到微信账单数据表头');
  }
  
  const headerRow = rawData[headerRowIndex];
  const columnMapping = {};
  
  // 建立列索引映射
  headerRow.forEach((header, index) => {
    const trimmedHeader = String(header).trim();
    if (WECHAT_HEADERS[trimmedHeader]) {
      columnMapping[WECHAT_HEADERS[trimmedHeader]] = index;
    }
  });
  
  const records = [];
  const errors = [];
  let skipped = 0;
  
  // 解析数据行
  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length === 0 || !row[0]) {
      continue;
    }
    
    try {
      const result = parseWechatRowWithReason(row, columnMapping, i + 1);
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
  
  return { records, skipped, errors };
}

/**
 * 解析单行微信账单数据（带跳过原因）
 * @param {Array} row - 行数据
 * @param {Object} columnMapping - 列映射
 * @param {number} rowNumber - 行号（用于错误报告）
 * @returns {{record: Object|null, reason: string|null, rawData: Object}}
 */
function parseWechatRowWithReason(row, columnMapping, rowNumber) {
  const getValue = (field) => {
    const index = columnMapping[field];
    return index !== undefined ? row[index] : null;
  };
  
  const transactionTimeRaw = getValue('transactionTime');
  const amountRaw = getValue('amount');
  const transactionTypeRaw = getValue('transactionType');
  const counterpartyRaw = getValue('counterparty');
  const descriptionRaw = getValue('description');
  
  const rawData = {
    transactionTime: transactionTimeRaw,
    amount: amountRaw,
    transactionType: transactionTypeRaw,
    counterparty: counterpartyRaw,
    description: descriptionRaw
  };
  
  // 跳过空行或无效行
  if (!transactionTimeRaw || !amountRaw) {
    return { record: null, reason: '缺少交易时间或金额', rawData };
  }
  
  // 跳过收支为"/"的记录（如转入零钱通等中性交易）
  const typeStr = transactionTypeRaw ? String(transactionTypeRaw).trim() : '';
  if (typeStr === '/' || typeStr === '') {
    return { record: null, reason: '非收支记录（中性交易），已跳过', rawData };
  }
  
  // 解析交易时间
  const transactionTime = parseWechatDateTime(transactionTimeRaw);
  if (!transactionTime) {
    return { record: null, reason: `无效的交易时间格式: ${transactionTimeRaw}`, rawData };
  }
  
  // 解析金额（去除¥符号和逗号）
  const amount = parseWechatAmount(amountRaw);
  if (amount === null) {
    return { record: null, reason: `无效的金额格式: ${amountRaw}`, rawData };
  }
  
  // 解析交易类型
  const transactionType = parseWechatTransactionType(transactionTypeRaw);
  
  // 获取其他字段
  const counterparty = cleanString(getValue('counterparty'));
  const description = cleanString(getValue('description'));
  const originalType = cleanString(getValue('originalType'));
  const paymentMethod = cleanString(getValue('paymentMethod'));
  const status = cleanString(getValue('status'));
  const orderNo = cleanString(getValue('orderNo'));
  const merchantOrderNo = cleanString(getValue('merchantOrderNo'));
  const remark = cleanString(getValue('remark'));
  
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
      sourcePlatform: 'wechat'
    },
    reason: null,
    rawData
  };
}

/**
 * 解析单行微信账单数据
 * @param {Array} row - 行数据
 * @param {Object} columnMapping - 列映射
 * @param {number} rowNumber - 行号（用于错误报告）
 * @returns {Object|null}
 */
function parseWechatRow(row, columnMapping, rowNumber) {
  const result = parseWechatRowWithReason(row, columnMapping, rowNumber);
  return result.record;
}

/**
 * 解析微信日期时间格式
 * @param {string|number} dateTimeRaw - 原始日期时间
 * @returns {Date|null}
 */
function parseWechatDateTime(dateTimeRaw) {
  if (!dateTimeRaw) return null;
  
  const dateTimeStr = String(dateTimeRaw).trim();
  
  // 格式: "2025-10-31 19:15:39"
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
 * 解析微信金额格式
 * @param {string|number} amountRaw - 原始金额
 * @returns {number|null}
 */
function parseWechatAmount(amountRaw) {
  if (amountRaw === null || amountRaw === undefined) return null;
  
  let amountStr = String(amountRaw).trim();
  
  // 去除¥符号和逗号
  amountStr = amountStr.replace(/[¥￥,]/g, '');
  
  const amount = parseFloat(amountStr);
  return isNaN(amount) ? null : Math.abs(amount);
}

/**
 * 解析微信交易类型
 * @param {string} typeRaw - 原始类型
 * @returns {string}
 */
function parseWechatTransactionType(typeRaw) {
  if (!typeRaw) return 'expense';
  
  const typeStr = String(typeRaw).trim();
  
  if (typeStr === '收入') {
    return 'income';
  } else if (typeStr === '支出') {
    return 'expense';
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

/**
 * 将账单记录格式化为微信Excel格式（用于往返测试）
 * @param {Array} records - 账单记录数组
 * @returns {Buffer}
 */
function formatToWechatExcel(records) {
  const headers = [
    '交易时间', '交易类型', '交易对方', '商品', '收/支', 
    '金额(元)', '支付方式', '当前状态', '交易单号', '商户单号', '备注'
  ];
  
  // 构建文件头部信息
  const headerRows = [
    ['微信支付账单明细'],
    ['微信昵称：[用户]'],
    ['起始时间：[2025-01-01 00:00:00] 终止时间：[2025-12-31 23:59:59]'],
    ['导出类型：[全部]'],
    ['导出时间：[2025-01-01 00:00:00]'],
    [],
    [`共${records.length}笔记录`],
    ['收入：0笔 0.00元'],
    ['支出：0笔 0.00元'],
    ['中性交易：0笔 0.00元'],
    ['注：'],
    ['1. 充值/提现/理财通购买/零钱通存取/信用卡还款等交易，将计入中性交易'],
    ['2. 若交易记录明细无有效内容，则代表该时间段内此微信号无交易。'],
    ['3. 本明细仅供个人对账使用'],
    [],
    [DATA_START_MARKER],
    headers
  ];
  
  // 构建数据行
  const dataRows = records.map(record => [
    formatDateTime(record.transactionTime),
    record.originalType || '',
    record.counterparty || '',
    record.description || '',
    record.transactionType === 'income' ? '收入' : '支出',
    `¥${record.amount.toFixed(2)}`,
    record.paymentMethod || '',
    record.status || '',
    record.orderNo || '',
    record.merchantOrderNo || '',
    record.remark || '/'
  ]);
  
  const allRows = [...headerRows, ...dataRows];
  
  const worksheet = xlsx.utils.aoa_to_sheet(allRows);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * 格式化日期时间为字符串
 * @param {Date|string} date - 日期
 * @returns {string}
 */
function formatDateTime(date) {
  if (!date) return '';
  
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const pad = (n) => String(n).padStart(2, '0');
  
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

module.exports = {
  parseWechatExcel,
  formatToWechatExcel,
  parseWechatDateTime,
  parseWechatAmount,
  parseWechatTransactionType,
  cleanString,
  formatDateTime
};
