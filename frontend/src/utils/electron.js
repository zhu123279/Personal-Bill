/**
 * Electron 环境工具函数
 * 提供与 Electron 主进程通信的封装
 */

// 检测是否在 Electron 环境中
export const isElectron = () => {
  return window.electronAPI?.isElectron || false;
};

// 获取平台信息
export const getPlatform = () => {
  return window.electronAPI?.platform || 'web';
};

// 打开文件选择对话框
export const openFileDialog = async (options = {}) => {
  if (!isElectron()) {
    console.warn('openFileDialog is only available in Electron');
    return null;
  }
  return window.electronAPI.openFileDialog(options);
};

// 保存文件对话框
export const saveFileDialog = async (options = {}) => {
  if (!isElectron()) {
    console.warn('saveFileDialog is only available in Electron');
    return null;
  }
  return window.electronAPI.saveFileDialog(options);
};

// 获取应用版本
export const getAppVersion = async () => {
  if (!isElectron()) {
    return null;
  }
  return window.electronAPI.getVersion();
};

// 打开外部链接
export const openExternal = async (url) => {
  if (isElectron()) {
    return window.electronAPI.openExternal(url);
  }
  window.open(url, '_blank');
};

// 显示消息框
export const showMessage = async (options) => {
  if (!isElectron()) {
    // Web 环境使用 alert
    alert(options.message || options.detail);
    return { response: 0 };
  }
  return window.electronAPI.showMessage(options);
};

// 监听菜单导入事件
export const onMenuImport = (callback) => {
  if (!isElectron()) {
    return () => {};
  }
  return window.electronAPI.onMenuImport(callback);
};

export default {
  isElectron,
  getPlatform,
  openFileDialog,
  saveFileDialog,
  getAppVersion,
  openExternal,
  showMessage,
  onMenuImport
};
