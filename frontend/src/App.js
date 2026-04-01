import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Bills from './pages/Bills';
import Dashboard from './pages/Dashboard';
import MonthlyReport from './pages/MonthlyReport';
import MonthlyBalance from './pages/MonthlyBalance';
import YearlyReport from './pages/YearlyReport';
import Categories from './pages/Categories';
import Assets from './pages/Assets';
import AssetDashboard from './pages/AssetDashboard';
import Documentation from './pages/Documentation';
import Help from './pages/Help';
import PrivateRoute from './components/Auth/PrivateRoute';
import AppLayout from './components/Layout/AppLayout';

const { Content } = Layout;

function App() {
  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      <Content>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/app"
              element={
                <PrivateRoute>
                  <AppLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="monthly" element={<MonthlyReport />} />
              <Route path="monthly-balance" element={<MonthlyBalance />} />
              <Route path="yearly" element={<YearlyReport />} />
              <Route path="bills" element={<Bills />} />
              <Route path="categories" element={<Categories />} />
              <Route path="assets" element={<Assets />} />
              <Route path="asset-dashboard" element={<AssetDashboard />} />
              <Route path="documentation" element={<Documentation />} />
              <Route path="help" element={<Help />} />
            </Route>
            {/* Redirect old routes to new /app prefix */}
            <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/monthly" element={<Navigate to="/app/monthly" replace />} />
            <Route path="/monthly-balance" element={<Navigate to="/app/monthly-balance" replace />} />
            <Route path="/yearly" element={<Navigate to="/app/yearly" replace />} />
            <Route path="/bills" element={<Navigate to="/app/bills" replace />} />
            <Route path="/categories" element={<Navigate to="/app/categories" replace />} />
            <Route path="/assets" element={<Navigate to="/app/assets" replace />} />
            <Route path="/asset-dashboard" element={<Navigate to="/app/asset-dashboard" replace />} />
            <Route path="/documentation" element={<Navigate to="/app/documentation" replace />} />
            <Route path="/help" element={<Navigate to="/app/help" replace />} />
          </Routes>
      </Content>
    </Layout>
  );
}

export default App;
