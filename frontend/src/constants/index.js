/**
 * 应用常量定义
 * 集中管理所有静态常量
 */

// 账单类型
export const BILL_TYPES = {
  EXPENSE: 'expense',
  INCOME: 'income',
};

export const BILL_TYPE_LABELS = {
  [BILL_TYPES.EXPENSE]: '支出',
  [BILL_TYPES.INCOME]: '收入',
};

// 账单来源
export const BILL_SOURCES = {
  MANUAL: 'manual',
  IMPORT: 'import',
  ALIPAY: 'alipay',
  WECHAT: 'wechat',
};

export const BILL_SOURCE_LABELS = {
  [BILL_SOURCES.MANUAL]: '手动录入',
  [BILL_SOURCES.IMPORT]: '导入',
  [BILL_SOURCES.ALIPAY]: '支付宝',
  [BILL_SOURCES.WECHAT]: '微信',
};

// 资产类型
export const ASSET_TYPES = {
  CASH: 'cash',
  BANK: 'bank',
  INVESTMENT: 'investment',
  CREDIT: 'credit',
  OTHER: 'other',
};

export const ASSET_TYPE_LABELS = {
  [ASSET_TYPES.CASH]: '现金',
  [ASSET_TYPES.BANK]: '银行卡',
  [ASSET_TYPES.INVESTMENT]: '投资',
  [ASSET_TYPES.CREDIT]: '信用卡',
  [ASSET_TYPES.OTHER]: '其他',
};

// 路由路径
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  APP: '/app',
  DASHBOARD: '/app/dashboard',
  BILLS: '/app/bills',
  MONTHLY: '/app/monthly',
  MONTHLY_BALANCE: '/app/monthly-balance',
  YEARLY: '/app/yearly',
  CATEGORIES: '/app/categories',
  ASSETS: '/app/assets',
  ASSET_DASHBOARD: '/app/asset-dashboard',
  DOCUMENTATION: '/app/documentation',
  HELP: '/app/help',
};

// HTTP 状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
};

// 消息提示类型
export const MESSAGE_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};
