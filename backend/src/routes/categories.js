const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const categoryService = require('../services/categoryService');

// 以下接口需要认证
router.use(authMiddleware);

// 获取分类列表（分页）
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const result = await categoryService.getCategories(req.user.userId, {
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 获取所有分类（不分页，用于下拉选择）
router.get('/all', async (req, res, next) => {
  try {
    const categories = await categoryService.getAllCategories(req.user.userId);
    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

// 获取分类统计
router.get('/stats', async (req, res, next) => {
  try {
    const { startDate, endDate, transactionType } = req.query;
    
    const stats = await categoryService.getCategoryStats(req.user.userId, {
      startDate,
      endDate,
      transactionType
    });
    
    res.json({ stats });
  } catch (err) {
    next(err);
  }
});

// 创建分类
router.post('/', async (req, res, next) => {
  try {
    const { name, color } = req.body;
    
    if (!name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '分类名称不能为空'
      });
    }
    
    const category = await categoryService.createCategory(req.user.userId, { name, color });
    res.status(201).json({ message: '创建成功', category });
  } catch (err) {
    next(err);
  }
});

// 批量删除分类
router.post('/batch-delete', async (req, res, next) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '请提供要删除的分类ID数组'
      });
    }
    
    const result = await categoryService.batchDeleteCategories(req.user.userId, ids);
    res.json({ message: `成功删除 ${result.deleted} 个分类`, ...result });
  } catch (err) {
    next(err);
  }
});

// 更新分类
router.put('/:id', async (req, res, next) => {
  try {
    const { name, color } = req.body;
    const id = parseInt(req.params.id);
    
    const category = await categoryService.updateCategory(req.user.userId, id, { name, color });
    
    if (!category) {
      return res.status(404).json({
        error: 'Not Found',
        message: '分类不存在'
      });
    }
    
    res.json({ message: '更新成功', category });
  } catch (err) {
    next(err);
  }
});

// 删除分类
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await categoryService.deleteCategory(req.user.userId, id);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Not Found',
        message: '分类不存在'
      });
    }
    
    res.json({ message: '删除成功' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
