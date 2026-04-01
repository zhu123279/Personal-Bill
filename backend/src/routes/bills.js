const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authMiddleware } = require('../middleware/auth');
const { parseFile } = require('../parsers');
const billService = require('../services/billService');

// 配置文件上传
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式，请上传.xlsx或.csv文件'));
    }
  }
});

// 所有账单路由需要认证
router.use(authMiddleware);

// 获取账单列表（分页、筛选）
router.get('/', async (req, res, next) => {
  try {
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
      sortBy,
      sortOrder
    } = req.query;
    
    const result = await billService.getBills(req.user.userId, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      startDate,
      endDate,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      transactionType,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      keyword,
      sourcePlatform,
      sortBy,
      sortOrder
    });
    
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 获取单条账单详情
router.get('/:id', async (req, res, next) => {
  try {
    const bill = await billService.getBillById(req.user.userId, parseInt(req.params.id));
    
    if (!bill) {
      return res.status(404).json({
        error: 'Not Found',
        message: '账单不存在'
      });
    }
    
    res.json({ bill });
  } catch (err) {
    next(err);
  }
});

// 创建账单记录
router.post('/', async (req, res, next) => {
  try {
    const { transactionTime, amount, transactionType } = req.body;
    
    // 验证必填字段
    if (!transactionTime || amount === undefined || !transactionType) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '交易时间、金额和交易类型为必填项'
      });
    }
    
    if (!['income', 'expense'].includes(transactionType)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '交易类型必须是 income 或 expense'
      });
    }
    
    const bill = await billService.createBill(req.user.userId, req.body);
    
    res.status(201).json({
      message: '账单创建成功',
      bill
    });
  } catch (err) {
    next(err);
  }
});

// 更新账单记录
router.put('/:id', async (req, res, next) => {
  try {
    const bill = await billService.updateBill(
      req.user.userId,
      parseInt(req.params.id),
      req.body
    );
    
    if (!bill) {
      return res.status(404).json({
        error: 'Not Found',
        message: '账单不存在'
      });
    }
    
    res.json({
      message: '账单更新成功',
      bill
    });
  } catch (err) {
    next(err);
  }
});

// 删除账单记录
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await billService.deleteBill(req.user.userId, parseInt(req.params.id));
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Not Found',
        message: '账单不存在'
      });
    }
    
    res.json({ message: '账单删除成功' });
  } catch (err) {
    next(err);
  }
});

// 导入账单文件
router.post('/import', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '请上传账单文件'
      });
    }
    
    const { buffer, originalname } = req.file;
    const result = parseFile(buffer, originalname);
    
    // 检测重复
    const duplicates = await billService.detectDuplicates(req.user.userId, result.records);
    
    res.json({
      message: '文件解析成功',
      data: {
        records: result.records,
        total: result.records.length,
        skipped: result.skipped,
        errors: result.errors,
        platform: result.platform,
        duplicates
      }
    });
  } catch (err) {
    if (err.message.includes('不支持的文件格式') || err.message.includes('无法找到')) {
      return res.status(422).json({
        error: 'Unprocessable Entity',
        message: err.message
      });
    }
    next(err);
  }
});

// 批量保存账单
router.post('/batch', async (req, res, next) => {
  try {
    const { bills } = req.body;
    
    if (!Array.isArray(bills) || bills.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '请提供账单数组'
      });
    }
    
    const result = await billService.batchSaveBills(req.user.userId, bills);
    
    res.json({
      message: '批量保存完成',
      ...result
    });
  } catch (err) {
    next(err);
  }
});

// 批量删除账单
router.post('/batch-delete', async (req, res, next) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '请提供要删除的账单ID数组'
      });
    }
    
    const result = await billService.batchDeleteBills(req.user.userId, ids);
    
    res.json({
      message: '批量删除完成',
      deleted: result.deleted
    });
  } catch (err) {
    next(err);
  }
});

// 批量更新账单
router.post('/batch-update', async (req, res, next) => {
  try {
    const { ids, updateData } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '请提供要更新的账单ID数组'
      });
    }
    
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '请提供要更新的数据'
      });
    }
    
    const result = await billService.batchUpdateBills(req.user.userId, ids, updateData);
    
    res.json({
      message: '批量更新完成',
      updated: result.updated
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
