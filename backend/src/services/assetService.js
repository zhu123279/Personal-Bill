const pool = require('../config/database');

// 获取用户的所有渠道
async function getChannels(userId) {
  const [rows] = await pool.execute(
    'SELECT id, user_id, name, icon, color, sort_order, created_at FROM asset_channels WHERE user_id = ? ORDER BY sort_order, id',
    [userId]
  );
  return rows;
}

// 创建渠道
async function createChannel(userId, name, icon, color) {
  const colors = ['#07c160', '#1677ff', '#ff4d4f', '#faad14', '#722ed1', '#13c2c2', '#eb2f96'];
  const finalColor = color || colors[Math.floor(Math.random() * colors.length)];
  const finalIcon = icon || 'bank';
  const [result] = await pool.execute(
    'INSERT INTO asset_channels (user_id, name, icon, color) VALUES (?, ?, ?, ?)',
    [userId, name, finalIcon, finalColor]
  );
  return { id: result.insertId, user_id: userId, name, icon: finalIcon, color: finalColor };
}

// 更新渠道
async function updateChannel(userId, channelId, name, icon, color) {
  const fields = [];
  const values = [];
  if (name) { fields.push('name = ?'); values.push(name); }
  if (icon) { fields.push('icon = ?'); values.push(icon); }
  if (color) { fields.push('color = ?'); values.push(color); }
  if (fields.length === 0) return false;
  values.push(channelId, userId);
  const [result] = await pool.execute(
    'UPDATE asset_channels SET ' + fields.join(', ') + ' WHERE id = ? AND user_id = ?',
    values
  );
  return result.affectedRows > 0;
}

// 删除渠道
async function deleteChannel(userId, channelId) {
  const [result] = await pool.execute(
    'DELETE FROM asset_channels WHERE id = ? AND user_id = ?',
    [channelId, userId]
  );
  return result.affectedRows > 0;
}

// 获取某年的所有资产数据
async function getYearlyAssets(userId, year) {
  const [rows] = await pool.execute(
    'SELECT ma.ym, ma.channel_id, ma.amount, ac.name AS channel_name, ac.icon AS channel_icon, ac.color AS channel_color FROM monthly_assets ma INNER JOIN asset_channels ac ON ma.channel_id = ac.id WHERE ma.user_id = ? AND ma.ym LIKE ? ORDER BY ma.ym, ac.sort_order, ac.id',
    [userId, year + '-%']
  );
  return rows;
}

// 获取某月的资产数据
async function getMonthlyAssets(userId, ym) {
  const [rows] = await pool.execute(
    'SELECT ma.id, ma.channel_id, ma.ym, ma.amount, ac.name AS channel_name, ac.icon AS channel_icon, ac.color AS channel_color FROM monthly_assets ma INNER JOIN asset_channels ac ON ma.channel_id = ac.id WHERE ma.user_id = ? AND ma.ym = ? ORDER BY ac.sort_order, ac.id',
    [userId, ym]
  );
  return rows;
}

// 保存单个月度资产
async function saveMonthlyAsset(userId, channelId, ym, amount) {
  await pool.execute(
    'INSERT INTO monthly_assets (user_id, channel_id, ym, amount) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount = VALUES(amount), updated_at = CURRENT_TIMESTAMP',
    [userId, channelId, ym, amount]
  );
  return true;
}

// 批量保存月度资产
async function batchSaveMonthlyAssets(userId, ym, assets) {
  const [channels] = await pool.execute('SELECT id FROM asset_channels WHERE user_id = ?', [userId]);
  const validIds = channels.map(c => c.id);
  for (const item of assets) {
    if (validIds.includes(item.channelId)) {
      await pool.execute(
        'INSERT INTO monthly_assets (user_id, channel_id, ym, amount) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount = VALUES(amount), updated_at = CURRENT_TIMESTAMP',
        [userId, item.channelId, ym, item.amount]
      );
    }
  }
  return true;
}

module.exports = {
  getChannels,
  createChannel,
  updateChannel,
  deleteChannel,
  getYearlyAssets,
  getMonthlyAssets,
  saveMonthlyAsset,
  batchSaveMonthlyAssets
};
