/**
 * 修复 react-scripts 5.0.1 中的 webpack-dev-server allowedHosts 配置问题
 * 
 * 问题：当 allowedHost 为 undefined 时，[allowedHost] 会变成 [undefined]
 * 导致错误："options.allowedHosts[0] should be a non-empty string"
 * 
 * 此脚本在 npm install 后自动运行，修复该问题
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-scripts',
  'config',
  'webpackDevServer.config.js'
);

if (!fs.existsSync(configPath)) {
  console.log('跳过 webpack-dev-server 配置修复：文件不存在');
  process.exit(0);
}

let content = fs.readFileSync(configPath, 'utf8');

// 检查是否已经修复过
if (content.includes('allowedHost ? [allowedHost] : \'all\'')) {
  console.log('webpack-dev-server 配置已修复，跳过');
  process.exit(0);
}

// 应用修复：处理 allowedHost 为 undefined 的情况
const oldCode = "allowedHosts: disableFirewall ? 'all' : [allowedHost],";
const newCode = "allowedHosts: disableFirewall ? 'all' : (allowedHost ? [allowedHost] : 'all'),";

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(configPath, content, 'utf8');
  console.log('✅ 已修复 webpack-dev-server allowedHosts 配置问题');
} else {
  console.log('⚠️ 未找到需要修复的代码，可能已是新版本或已被修改');
}
