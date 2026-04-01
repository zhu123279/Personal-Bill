/**
 * 账单解析器统一入口
 * 支持微信账单（Excel）和支付宝账单（CSV）解析
 */

const { parseWechatExcel, formatToWechatExcel } = require('./wechatParser');
const { parseAlipayCSV } = require('./alipayParser');
const { validateBillRecords, validateAndNormalize } = require('./billValidator');

/**
 * 根据文件类型自动选择解析器
 * @param {Buffer} fileBuffer - 文件Buffer
 * @param {string} filename - 文件名
 * @returns {{records: Array, skipped: number, errors: Array, platform: string}}
 */
function parseFile(fileBuffer, filename) {
  const lowerFilename = filename.toLowerCase();
  
  let result;
  let platform;
  
  if (lowerFilename.endsWith('.xlsx') || lowerFilename.endsWith('.xls')) {
    // 微信Excel格式
    result = parseWechatExcel(fileBuffer);
    platform = 'wechat';
  } else if (lowerFilename.endsWith('.csv')) {
    // 支付宝CSV格式
    result = parseAlipayCSV(fileBuffer);
    platform = 'alipay';
  } else {
    throw new Error('不支持的文件格式，请上传.xlsx、.xls或.csv文件');
  }
  
  // 验证解析结果
  const { validRecords, invalidRecords } = validateBillRecords(result.records);
  
  return {
    records: validRecords,
    skipped: result.skipped + invalidRecords.length,
    errors: [
      ...result.errors,
      ...invalidRecords.map(item => ({
        row: item.index,
        message: item.errors.join('; ')
      }))
    ],
    platform
  };
}

/**
 * 检测文件平台类型
 * @param {string} filename - 文件名
 * @returns {string}
 */
function detectPlatform(filename) {
  const lowerFilename = filename.toLowerCase();
  
  if (lowerFilename.includes('微信') || lowerFilename.includes('wechat')) {
    return 'wechat';
  }
  if (lowerFilename.endsWith('.xlsx') || lowerFilename.endsWith('.xls')) {
    return 'wechat';
  }
  
  return 'unknown';
}

module.exports = {
  parseFile,
  detectPlatform,
  parseWechatExcel,
  formatToWechatExcel,
  validateBillRecords,
  validateAndNormalize
};
