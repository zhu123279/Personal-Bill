import React, { useState, useEffect } from 'react';
import { Typography, DatePicker, Row, Col, Space, message } from 'antd';
import dayjs from 'dayjs';
import SummaryCard from '../components/Dashboard/SummaryCard';
import CategoryPie from '../components/Dashboard/CategoryPie';
import TrendLine from '../components/Dashboard/TrendLine';
import MonthlyBar from '../components/Dashboard/MonthlyBar';
import api from '../services/api';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const Dashboard = () => {
  // 默认显示最近3个月的数据
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(3, 'month').startOf('month'),
    dayjs().endOf('month')
  ]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [categoryStats, setCategoryStats] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: dateRange[0].format('YYYY-MM-DD 00:00:00'),
        endDate: dateRange[1].format('YYYY-MM-DD 23:59:59')
      };

      const [summaryRes, categoryRes, trendRes, monthlyRes] = await Promise.all([
        api.get('/stats/summary', { params }),
        api.get('/stats/category', { params }),
        api.get('/stats/trend', { params: { ...params, groupBy: 'day' } }),
        api.get('/stats/monthly')
      ]);

      setSummary(summaryRes.data);
      setCategoryStats(categoryRes.data.stats || []);
      setTrendData(trendRes.data.trend || []);
      setMonthlyData(monthlyRes.data.monthly || []);
      
      console.log('Stats data:', {
        summary: summaryRes.data,
        category: categoryRes.data.stats,
        trend: trendRes.data.trend,
        monthly: monthlyRes.data.monthly
      });
    } catch (error) {
      console.error('Stats error:', error);
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const handleDateChange = (dates) => {
    if (dates && dates.length === 2) {
      setDateRange(dates);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>可视化看板</Title>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={handleDateChange}
            allowClear={false}
          />
        </Space>
      </div>

      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        <SummaryCard summary={summary} loading={loading} />
        
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <CategoryPie data={categoryStats} loading={loading} />
          </Col>
          <Col xs={24} lg={12}>
            <TrendLine data={trendData} loading={loading} />
          </Col>
        </Row>
        
        <MonthlyBar data={monthlyData} loading={loading} />
      </Space>
    </div>
  );
};

export default Dashboard;
