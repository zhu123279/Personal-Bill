const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const assetService = require('../services/assetService');

router.use(authMiddleware);

// 获取渠道列表
router.get('/channels', async (req, res, next) => {
  try {
    const channels = await assetService.getChannels(req.user.userId);
    res.json({ channels });
  } catch (err) {
    next(err);
  }
});

// 创建渠道
router.post('/channels', async (req, res, next) => {
  try {
    const { name, icon, color } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Bad Request', message: '渠道名称不能为空' });
    }
    const channel = await assetService.createChannel(req.user.userId, name, icon, color);
    res.status(201).json({ message: '创建成功', channel });
  } catch (err) {
    next(err);
  }
});

// 更新渠道
router.put('/channels/:id', async (req, res, next) => {
  try {
    const { name, icon, color } = req.body;
    const ok = await assetService.updateChannel(req.user.userId, parseInt(req.params.id), name, icon, color);
    if (!ok) {
      return res.status(404).json({ error: 'Not Found', message: '渠道不存在' });
    }
    res.json({ message: '更新成功' });
  } catch (err) {
    next(err);
  }
});

// 删除渠道
router.delete('/channels/:id', async (req, res, next) => {
  try {
    const ok = await assetService.deleteChannel(req.user.userId, parseInt(req.params.id));
    if (!ok) {
      return res.status(404).json({ error: 'Not Found', message: '渠道不存在' });
    }
    res.json({ message: '删除成功' });
  } catch (err) {
    next(err);
  }
});

// 获取年度资产
router.get('/yearly/:year', async (req, res, next) => {
  try {
    const assets = await assetService.getYearlyAssets(req.user.userId, req.params.year);
    res.json({ assets });
  } catch (err) {
    next(err);
  }
});

// 获取月度资产
router.get('/monthly/:ym', async (req, res, next) => {
  try {
    const assets = await assetService.getMonthlyAssets(req.user.userId, req.params.ym);
    res.json({ assets });
  } catch (err) {
    next(err);
  }
});

// 保存月度资产(单个)
router.post('/monthly/:ym', async (req, res, next) => {
  try {
    const { channelId, amount } = req.body;
    if (!channelId || amount === undefined) {
      return res.status(400).json({ error: 'Bad Request', message: '参数不完整' });
    }
    await assetService.saveMonthlyAsset(req.user.userId, channelId, req.params.ym, amount);
    res.json({ message: '保存成功' });
  } catch (err) {
    next(err);
  }
});

// 批量保存月度资产
router.post('/monthly/:ym/batch', async (req, res, next) => {
  try {
    const { assets } = req.body;
    if (!Array.isArray(assets)) {
      return res.status(400).json({ error: 'Bad Request', message: '参数格式错误' });
    }
    await assetService.batchSaveMonthlyAssets(req.user.userId, req.params.ym, assets);
    res.json({ message: '保存成功' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
