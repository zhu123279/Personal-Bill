import React, { useState, useEffect, useRef } from 'react';
import { Typography, Card, Row, Col, Spin, DatePicker, Statistic, Progress, Tag } from 'antd';
import { WalletOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import api from '../services/api';

const { Title } = Typography;

const AssetDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(dayjs());
  const [channels, setChannels] = useState([]);
  const [yearlyData, setYearlyData] = useState([]);
  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const barChartInstance = useRef(null);
  const lineChartInstance = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [chRes, dataRes] = await Promise.all([
        api.get('/assets/channels'),
        api.get('/assets/yearly/' + year.year())
      ]);
      setChannels(chRes.data.channels || []);
      setYearlyData(dataRes.data.assets || []);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year]);

  // 获取最新月份的数据
  const getLatestMonthData = () => {
    const months = [...new Set(yearlyData.map(d => d.ym))].sort().reverse();
    const latestMonth = months[0];
    const prevMonth = months[1];
    const latestData = yearlyData.filter(d => d.ym === latestMonth);
    const prevData = yearlyData.filter(d => d.ym === prevMonth);
    const latestTotal = latestData.reduce((sum, d) => sum + parseFloat(d.amount), 0);
    const prevTotal = prevData.reduce((sum, d) => sum + parseFloat(d.amount), 0);
    return { latestMonth, latestData, latestTotal, prevTotal };
  };

  // 计算各渠道占比
  const getChannelStats = () => {
    const { latestData, latestTotal } = getLatestMonthData();
    return channels.map(ch => {
      const found = latestData.find(d => d.channel_id === ch.id);
      const amount = found ? parseFloat(found.amount) : 0;
      const percent = latestTotal > 0 ? (amount / latestTotal * 100) : 0;
      return { ...ch, amount, percent };
    }).sort((a, b) => b.amount - a.amount);
  };

  // 计算月度趋势
  const getMonthlyTrend = () => {
    const monthMap = {};
    yearlyData.forEach(d => {
      if (!monthMap[d.ym]) monthMap[d.ym] = 0;
      monthMap[d.ym] += parseFloat(d.amount);
    });
    return Object.entries(monthMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([ym, total]) => ({ ym, total }));
  };

  // 渲染柱状图
  useEffect(() => {
    if (!barChartRef.current) return;
    if (!barChartInstance.current) {
      barChartInstance.current = echarts.init(barChartRef.current);
    }
    const trend = getMonthlyTrend();
    const option = {
      title: { text: '月度资产-总览', left: 10, top: 10, textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis', formatter: '{b}<br/>资产: ¥{c}' },
      grid: { left: 50, right: 20, top: 50, bottom: 30 },
      xAxis: { type: 'category', data: trend.map(t => dayjs(t.ym).format('YYYYMM')) },
      yAxis: { type: 'value', axisLabel: { formatter: (v) => v.toLocaleString() } },
      series: [{
        name: '资产',
        type: 'bar',
        data: trend.map(t => t.total),
        itemStyle: { color: '#ff4d4f' },
        label: { show: true, position: 'top', formatter: (p) => p.value.toFixed(2), fontSize: 10 }
      }]
    };
    barChartInstance.current.setOption(option);
  }, [yearlyData]);

  // 渲染折线图
  useEffect(() => {
    if (!lineChartRef.current || channels.length === 0) return;
    if (!lineChartInstance.current) {
      lineChartInstance.current = echarts.init(lineChartRef.current);
    }
    const months = [...new Set(yearlyData.map(d => d.ym))].sort();
    const series = channels.map(ch => ({
      name: ch.name,
      type: 'line',
      data: months.map(ym => {
        const found = yearlyData.find(d => d.ym === ym && d.channel_id === ch.id);
        return found ? parseFloat(found.amount) : 0;
      }),
      label: { show: true, position: 'top', formatter: (p) => p.value.toFixed(2), fontSize: 10 }
    }));
    const option = {
      title: { text: '月度资产-明细', left: 10, top: 10, textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      legend: { data: channels.map(c => c.name), top: 10, right: 10 },
      grid: { left: 50, right: 20, top: 50, bottom: 30 },
      xAxis: { type: 'category', data: months.map(m => dayjs(m).format('YYYYMM')) },
      yAxis: { type: 'value', axisLabel: { formatter: (v) => v.toLocaleString() } },
      series
    };
    lineChartInstance.current.setOption(option);
  }, [yearlyData, channels]);

  // 窗口大小变化时重绘
  useEffect(() => {
    const handleResize = () => {
      barChartInstance.current?.resize();
      lineChartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { latestMonth, latestTotal, prevTotal } = getLatestMonthData();
  const channelStats = getChannelStats();
  const monthlyTrend = getMonthlyTrend();
  const change = latestTotal - prevTotal;
  const changePercent = prevTotal > 0 ? (change / prevTotal * 100) : 0;

  return (
    <Spin spinning={loading}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>资产看板</Title>
        <DatePicker picker="year" value={year} onChange={(d) => d && setYear(d)} allowClear={false} />
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title={latestMonth ? dayjs(latestMonth).format('YYYY年MM月') + ' 总资产' : '总资产'}
              value={latestTotal}
              precision={2}
              prefix={<WalletOutlined style={{ color: '#1890ff' }} />}
              suffix="元"
              valueStyle={{ color: '#1890ff', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="环比上月"
              value={change}
              precision={2}
              prefix={change >= 0 ? <RiseOutlined /> : <FallOutlined />}
              suffix="元"
              valueStyle={{ color: change >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 28 }}
            />
            <div style={{ marginTop: 8, color: '#999' }}>{changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title="资产渠道" value={channels.length} suffix="个" valueStyle={{ fontSize: 28 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card size="small">
            <div ref={barChartRef} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small">
            <div ref={lineChartRef} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="渠道分布" size="small">
            {channelStats.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>暂无数据</div>
            ) : (
              channelStats.map(ch => (
                <div key={ch.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Tag color={ch.color}>{ch.name}</Tag>
                    <span>¥{ch.amount.toFixed(2)}</span>
                  </div>
                  <Progress percent={ch.percent} strokeColor={ch.color} format={(p) => p.toFixed(1) + '%'} size="small" />
                </div>
              ))
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="月度趋势" size="small">
            {monthlyTrend.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>暂无数据</div>
            ) : (
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {monthlyTrend.map((item, idx) => {
                  const prev = monthlyTrend[idx - 1];
                  const diff = prev ? item.total - prev.total : 0;
                  return (
                    <div key={item.ym} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <span>{dayjs(item.ym).format('YYYY年MM月')}</span>
                      <span>
                        <strong>¥{item.total.toFixed(2)}</strong>
                        {prev && (
                          <span style={{ marginLeft: 8, color: diff >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 12 }}>
                            {diff >= 0 ? '+' : ''}{diff.toFixed(2)}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Spin>
  );
};

export default AssetDashboard;
