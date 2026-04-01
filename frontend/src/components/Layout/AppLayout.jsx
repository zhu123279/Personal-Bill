import React from 'react';
import { Layout, Menu, Button, Typography } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  LogoutOutlined,
  CalendarOutlined,
  BarChartOutlined,
  TagsOutlined,
  AccountBookOutlined,
  WalletOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/auth';
import TabsNav from './TabsNav';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getUser();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: 'report',
      icon: <BarChartOutlined />,
      label: '报表统计',
      children: [
        { key: '/app/dashboard', icon: <DashboardOutlined />, label: '可视化看板' },
        { key: '/app/monthly', icon: <CalendarOutlined />, label: '月度报表' },
        { key: '/app/monthly-balance', icon: <AccountBookOutlined />, label: '月度收支' },
        { key: '/app/yearly', icon: <BarChartOutlined />, label: '年度报表' },
      ]
    },
    {
      key: 'bill',
      icon: <FileTextOutlined />,
      label: '账单中心',
      children: [
        { key: '/app/bills', icon: <FileTextOutlined />, label: '账单管理' },
        { key: '/app/categories', icon: <TagsOutlined />, label: '分类管理' },
      ]
    },
    {
      key: 'asset',
      icon: <WalletOutlined />,
      label: '资产中心',
      children: [
        { key: '/app/asset-dashboard', icon: <WalletOutlined />, label: '资产看板' },
        { key: '/app/assets', icon: <WalletOutlined />, label: '资产管理' },
      ]
    },
    {
      key: '/app/documentation',
      icon: <BookOutlined />,
      label: '说明文档',
    },
  ];


  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        theme="light" 
        width={200}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100
        }}
      >
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>账单管理</Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout style={{ marginLeft: 200 }}>
        {/* 顶部 Header */}
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          height: 48,
          lineHeight: '48px',
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center',
          position: 'fixed',
          top: 0,
          right: 0,
          left: 200,
          zIndex: 99,
          borderBottom: '1px solid #f0f0f0'
        }}>
          <span style={{ marginRight: 16 }}>欢迎，{user?.username || '用户'}</span>
          <Button icon={<LogoutOutlined />} onClick={handleLogout} size="small">退出</Button>
        </Header>

        {/* 标签页导航 */}
        <div style={{
          position: 'fixed',
          top: 48,
          left: 200,
          right: 0,
          zIndex: 98,
          background: '#fff',
          padding: '0 24px',
          borderBottom: '1px solid #f0f0f0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
        }}>
          <TabsNav />
        </div>

        {/* 内容区域 */}
        <Content style={{ 
          margin: '96px 24px 24px', 
          background: '#fff', 
          padding: 24, 
          borderRadius: 6,
          minHeight: 'calc(100vh - 120px)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
