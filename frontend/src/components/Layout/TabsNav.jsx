import React, { useState, useEffect, useCallback } from 'react';
import { Tabs } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';

// 路由配置映射
const routeConfig = {
  '/app/dashboard': { title: '可视化看板', closable: false },
  '/app/monthly': { title: '月度报表', closable: true },
  '/app/monthly-balance': { title: '月度收支', closable: true },
  '/app/yearly': { title: '年度报表', closable: true },
  '/app/bills': { title: '账单管理', closable: true },
  '/app/categories': { title: '分类管理', closable: true },
  '/app/asset-dashboard': { title: '资产看板', closable: true },
  '/app/assets': { title: '资产管理', closable: true },
  '/app/help': { title: '帮助', closable: true },
};

const TabsNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tabs, setTabs] = useState([
    { key: '/app/dashboard', label: '可视化看板', closable: false }
  ]);

  // 当路由变化时，添加新标签页
  useEffect(() => {
    const path = location.pathname;
    const config = routeConfig[path];
    
    if (config && !tabs.find(tab => tab.key === path)) {
      setTabs(prev => [...prev, {
        key: path,
        label: config.title,
        closable: config.closable
      }]);
    }
  }, [location.pathname, tabs]);

  // 切换标签页
  const handleChange = useCallback((key) => {
    navigate(key);
  }, [navigate]);

  // 关闭标签页
  const handleEdit = useCallback((targetKey, action) => {
    if (action === 'remove') {
      const targetIndex = tabs.findIndex(tab => tab.key === targetKey);
      const newTabs = tabs.filter(tab => tab.key !== targetKey);
      
      // 如果关闭的是当前标签，跳转到相邻标签
      if (targetKey === location.pathname && newTabs.length > 0) {
        const newActiveKey = newTabs[Math.min(targetIndex, newTabs.length - 1)].key;
        navigate(newActiveKey);
      }
      
      setTabs(newTabs);
    }
  }, [tabs, location.pathname, navigate]);

  return (
    <Tabs
      type="editable-card"
      hideAdd
      activeKey={location.pathname}
      onChange={handleChange}
      onEdit={handleEdit}
      items={tabs}
      size="small"
      style={{ 
        marginBottom: 0,
      }}
      tabBarStyle={{
        margin: 0,
        borderBottom: 'none'
      }}
    />
  );
};

export default TabsNav;
