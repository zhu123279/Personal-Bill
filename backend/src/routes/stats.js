const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const statsService = require('../services/statsService');

// 所有统计路由需要认证
router.use(authMiddleware);

// 获取收支摘要
router.get('/summary', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const summary = await statsService.getSummary(req.user.userId, {
      startDate,
      endDate
    });
    
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

// 获取分类统计
router.get('/category', async (req, res, next) => {
  try {
    const { startDate, endDate, transactionType } = req.query;
    
    const stats = await statsService.getCategoryStats(req.user.userId, {
      startDate,
      endDate,
      transactionType
    });
    
    res.json({ stats });
  } catch (err) {
    next(err);
  }
});

// 获取趋势数据
router.get('/trend', async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy } = req.query;
    
    const trend = await statsService.getTrend(req.user.userId, {
      startDate,
      endDate,
      groupBy
    });
    
    res.json({ trend });
  } catch (err) {
    next(err);
  }
});

// 获取月度对比
router.get('/monthly', async (req, res, next) => {
  try {
    const { year } = req.query;
    
    const monthly = await statsService.getMonthlyComparison(req.user.userId, {
      year: year ? parseInt(year) : undefined
    });
    
    res.json({ monthly });
  } catch (err) {
    next(err);
  }
});

// 获取单笔消费排行榜
router.get('/top-expenses', async (req, res, next) => {
  try {
    const { startDate, endDate, limit } = req.query;
    
    const expenses = await statsService.getTopExpenses(req.user.userId, {
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : 10
    });
    
    res.json({ expenses });
  } catch (err) {
    next(err);
  }
});

// 获取每日支出明细
router.get('/daily-expenses', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const daily = await statsService.getDailyExpenses(req.user.userId, {
      startDate,
      endDate
    });
    
    res.json({ daily });
  } catch (err) {
    next(err);
  }
});

// 获取年度统计
router.get('/yearly', async (req, res, next) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    
    const data = await statsService.getYearlyStats(req.user.userId, targetYear);
    
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
