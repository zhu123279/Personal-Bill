import React, { useState, useEffect } from 'react';
import { Typography, DatePicker, Row, Col, Card, Statistic, Table, Progress, Spin, Empty } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, WalletOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import api from '../services/api';

const { Title } = Typography;

const YearlyReport = () => {
  const [year, setYear] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/stats/yearly', { params: { year: year.year() } });
      setData(res.data);
    } catch (error) {
      console.error('获取年度数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [year]);

  // 排行榜表格列
  const categoryRankColumns = (type) => [
    { title: '排名', key: 'rank', width: 50, render: (_, __, i) => <span style={{ color: i < 3 ? (type === 'expense' ? '#f5222d' : '#52c41a') : '#666', fontWeight: i < 3 ? 'bold' : 'normal' }}>{i + 1}</span> },
    { title: '分类', dataIndex: 'name', render: (name, r) => <span style={{ color: r.color }}>{name}</span> },
    { title: '金额', dataIndex: 'total', width: 100, align: 'right', render: (v) => `¥${v.toFixed(2)}` },
    { title: '占比', dataIndex: 'percentage', width: 100, render: (p) => <Progress percent={parseFloat(p)} size="small" strokeColor={type === 'expense' ? '#f5222d' : '#52c41a'} format={(v) => `${v.toFixed(1)}%`} /> }
  ];

  const monthRankColumns = (valueKey, color) => [
    { title: '排名', key: 'rank', width: 50, render: (_, __, i) => <span style={{ color: i < 3 ? color : '#666', fontWeight: i < 3 ? 'bold' : 'normal' }}>{i + 1}</span> },
    { title: '月份', dataIndex: 'monthName', width: 60 },
    { title: '金额', dataIndex: valueKey, align: 'right', render: (v) => <span style={{ color: v >= 0 ? (valueKey === 'balance' ? '#52c41a' : color) : '#f5222d' }}>¥{v.toFixed(2)}</span> }
  ];

  // 收支占比饼图
  const incomeExpensePieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['45%', '70%'], center: ['50%', '45%'],
      data: [
        { value: data?.summary?.totalIncome || 0, name: '收入', itemStyle: { color: '#52c41a' } },
        { value: data?.summary?.totalExpense || 0, name: '支出', itemStyle: { color: '#f5222d' } }
      ],
      label: { show: true, formatter: '{b}\n{d}%' }
    }]
  };

  // 支出类型饼图
  const expensePieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { type: 'scroll', orient: 'vertical', right: 10, top: 20, bottom: 20 },
    series: [{
      type: 'pie', radius: ['40%', '65%'], center: ['35%', '50%'],
      label: { show: false },
      data: (data?.expenseByCategory || []).map(item => ({
        value: item.total, name: item.name, itemStyle: { color: item.color }
      }))
    }]
  };

  // 收入类型饼图
  const incomePieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { type: 'scroll', orient: 'vertical', right: 10, top: 20, bottom: 20 },
    series: [{
      type: 'pie', radius: ['40%', '65%'], center: ['35%', '50%'],
      label: { show: false },
      data: (data?.incomeByCategory || []).map(item => ({
        value: item.total, name: item.name, itemStyle: { color: item.color }
      }))
    }]
  };

  // 柱状图配置
  const createBarOption = (title, dataKey, color) => ({
    title: { text: title, left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis', formatter: (p) => `${p[0].name}<br/>¥${p[0].value.toLocaleString()}` },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: (data?.monthlyData || []).map(d => d.monthName), axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { formatter: (v) => v >= 10000 ? (v/10000).toFixed(1) + '万' : v } },
    series: [{
      type: 'bar', data: (data?.monthlyData || []).map(d => d[dataKey]),
      itemStyle: { color, borderRadius: [4, 4, 0, 0] },
      label: { show: true, position: 'top', fontSize: 10, formatter: (p) => `¥${p.value.toLocaleString()}` }
    }]
  });

  // 结余柱状图
  const balanceBarOption = {
    title: { text: '年度结余趋势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: (data?.monthlyData || []).map(d => d.monthName), axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: (data?.monthlyData || []).map(d => ({
        value: d.balance,
        itemStyle: { color: d.balance >= 0 ? '#52c41a' : '#f5222d', borderRadius: d.balance >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4] }
      })),
      label: { show: true, position: (p) => p.value >= 0 ? 'top' : 'bottom', fontSize: 10, formatter: (p) => `¥${p.value.toLocaleString()}` }
    }]
  };

  return (
    <Spin spinning={loading}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>年度报表</Title>
        <DatePicker picker="year" value={year} onChange={(d) => d && setYear(d)} allowClear={false} />
      </div>

      {/* 汇总卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="年度支出" value={data?.summary?.totalExpense || 0} precision={2} prefix="¥" valueStyle={{ color: '#f5222d' }} suffix={<ArrowDownOutlined />} />
            <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>共 {data?.summary?.expenseCount || 0} 笔</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="年度收入" value={data?.summary?.totalIncome || 0} precision={2} prefix="¥" valueStyle={{ color: '#52c41a' }} suffix={<ArrowUpOutlined />} />
            <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>共 {data?.summary?.incomeCount || 0} 笔</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="年度结余" value={data?.summary?.netBalance || 0} precision={2} prefix="¥" valueStyle={{ color: (data?.summary?.netBalance || 0) >= 0 ? '#52c41a' : '#f5222d' }} suffix={<WalletOutlined />} />
            <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>收入 - 支出</div>
          </Card>
        </Col>
      </Row>

      {/* 排行榜 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={6}>
          <Card title="消费类型排行榜" size="small">
            {data?.expenseByCategory?.length > 0 ? (
              <Table dataSource={data.expenseByCategory} columns={categoryRankColumns('expense')} rowKey="id" size="small" pagination={false} scroll={{ y: 200 }} />
            ) : <Empty description="暂无数据" />}
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card title="收入类型排行榜" size="small">
            {data?.incomeByCategory?.length > 0 ? (
              <Table dataSource={data.incomeByCategory} columns={categoryRankColumns('income')} rowKey="id" size="small" pagination={false} scroll={{ y: 200 }} />
            ) : <Empty description="暂无数据" />}
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card title="支出月份排行榜" size="small">
            {data?.expenseRanking?.length > 0 ? (
              <Table dataSource={data.expenseRanking} columns={monthRankColumns('expense', '#f5222d')} rowKey="month" size="small" pagination={false} scroll={{ y: 200 }} />
            ) : <Empty description="暂无数据" />}
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card title="结余月份排行榜" size="small">
            {data?.balanceRanking?.length > 0 ? (
              <Table dataSource={data.balanceRanking} columns={monthRankColumns('balance', '#52c41a')} rowKey="month" size="small" pagination={false} scroll={{ y: 200 }} />
            ) : <Empty description="暂无数据" />}
          </Card>
        </Col>
      </Row>

      {/* 占比图表 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={8}>
          <Card title="收支占比" size="small">
            {(data?.summary?.totalIncome > 0 || data?.summary?.totalExpense > 0) ? (
              <ReactECharts option={incomeExpensePieOption} style={{ height: 250 }} />
            ) : <Empty description="暂无数据" style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="支出类型占比" size="small">
            {data?.expenseByCategory?.length > 0 ? (
              <ReactECharts option={expensePieOption} style={{ height: 250 }} />
            ) : <Empty description="暂无数据" style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="收入类型占比" size="small">
            {data?.incomeByCategory?.length > 0 ? (
              <ReactECharts option={incomePieOption} style={{ height: 250 }} />
            ) : <Empty description="暂无数据" style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />}
          </Card>
        </Col>
      </Row>

      {/* 年度支出趋势 */}
      <Card title="年度支出趋势" size="small" style={{ marginBottom: 16 }}>
        {data?.monthlyData?.some(d => d.expense > 0) ? (
          <ReactECharts option={createBarOption('', 'expense', '#f5222d')} style={{ height: 250 }} />
        ) : <Empty description="暂无数据" style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />}
      </Card>

      {/* 年度收入趋势 */}
      <Card title="年度收入趋势" size="small" style={{ marginBottom: 16 }}>
        {data?.monthlyData?.some(d => d.income > 0) ? (
          <ReactECharts option={createBarOption('', 'income', '#52c41a')} style={{ height: 250 }} />
        ) : <Empty description="暂无数据" style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />}
      </Card>

      {/* 年度结余趋势 */}
      <Card title="年度结余趋势" size="small">
        {data?.monthlyData?.some(d => d.income > 0 || d.expense > 0) ? (
          <ReactECharts option={balanceBarOption} style={{ height: 250 }} />
        ) : <Empty description="暂无数据" style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />}
      </Card>
    </Spin>
  );
};

export default YearlyReport;
