import React, { useState, useEffect } from 'react';
import { Typography, DatePicker, Row, Col, Card, Statistic, Table, Progress, Spin, Empty, Modal } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, WalletOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import api from '../services/api';

const { Title } = Typography;

const MonthlyReport = () => {
  const [month, setMonth] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [categoryStats, setCategoryStats] = useState([]);
  const [topExpenses, setTopExpenses] = useState([]);
  const [dailyExpenses, setDailyExpenses] = useState([]);
  const [expenseList, setExpenseList] = useState([]);
  const [incomeList, setIncomeList] = useState([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailType, setDetailType] = useState('expense'); // 'expense' | 'income'

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = month.startOf('month').format('YYYY-MM-DD 00:00:00');
      const endDate = month.endOf('month').format('YYYY-MM-DD 23:59:59');
      const params = { startDate, endDate };

      const [summaryRes, categoryRes, topRes, dailyRes, expenseListRes, incomeListRes] = await Promise.all([
        api.get('/stats/summary', { params }),
        api.get('/stats/category', { params: { ...params, transactionType: 'expense' } }),
        api.get('/stats/top-expenses', { params: { ...params, limit: 10 } }),
        api.get('/stats/daily-expenses', { params }),
        api.get('/bills', { params: { ...params, transactionType: 'expense', pageSize: 500, sortBy: 'transaction_time', sortOrder: 'DESC' } }),
        api.get('/bills', { params: { ...params, transactionType: 'income', pageSize: 500, sortBy: 'transaction_time', sortOrder: 'DESC' } })
      ]);

      setSummary(summaryRes.data);
      setCategoryStats(categoryRes.data.stats || []);
      setTopExpenses(topRes.data.expenses || []);
      setDailyExpenses(dailyRes.data.daily || []);
      setExpenseList(expenseListRes.data.bills || []);
      setIncomeList(incomeListRes.data.bills || []);
    } catch (error) {
      console.error('获取月度数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month]);

  // 支出分布饼图配置
  const pieOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      type: 'scroll'
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 4,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' }
      },
      data: categoryStats.map(item => ({
        value: item.total,
        name: item.name,
        itemStyle: { color: item.color }
      }))
    }]
  };

  // 每日支出柱状图配置
  const barOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const data = params[0];
        return `${data.name}<br/>支出: ¥${data.value.toFixed(2)}`;
      }
    },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: dailyExpenses.map(d => dayjs(d.date).format('MM-DD')),
      axisLabel: { rotate: 45, fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '¥{value}' }
    },
    series: [{
      type: 'bar',
      data: dailyExpenses.map(d => d.total),
      itemStyle: { color: '#f5222d', borderRadius: [4, 4, 0, 0] }
    }]
  };

  // 单笔消费排行表格列
  const expenseColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 50,
      render: (_, __, index) => (
        <span style={{ 
          color: index < 3 ? '#f5222d' : '#666',
          fontWeight: index < 3 ? 'bold' : 'normal'
        }}>
          {index + 1}
        </span>
      )
    },
    {
      title: '日期',
      dataIndex: 'transactionTime',
      width: 90,
      render: (time) => dayjs(time).format('MM-DD HH:mm')
    },
    {
      title: '交易对方',
      dataIndex: 'counterparty',
      ellipsis: true
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 100,
      align: 'right',
      render: (amount) => (
        <span style={{ color: '#f5222d', fontWeight: 500 }}>
          ¥{amount.toFixed(2)}
        </span>
      )
    }
  ];

  // 支出明细表格列
  const expenseListColumns = [
    {
      title: '日期',
      dataIndex: 'transactionTime',
      width: 130,
      render: (time) => dayjs(time).format('MM-DD HH:mm')
    },
    {
      title: '交易对方',
      dataIndex: 'counterparty',
      ellipsis: true,
      width: 120
    },
    {
      title: '商品说明',
      dataIndex: 'description',
      ellipsis: true
    },
    {
      title: '分类',
      dataIndex: 'categoryName',
      width: 80,
      render: (name, record) => (
        <span style={{ color: record.categoryColor || '#666' }}>{name || '未分类'}</span>
      )
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 90,
      align: 'right',
      render: (amount) => (
        <span style={{ color: '#f5222d', fontWeight: 500 }}>
          -¥{amount.toFixed(2)}
        </span>
      )
    }
  ];

  // 收入明细表格列
  const incomeListColumns = [
    {
      title: '日期',
      dataIndex: 'transactionTime',
      width: 130,
      render: (time) => dayjs(time).format('MM-DD HH:mm')
    },
    {
      title: '交易对方',
      dataIndex: 'counterparty',
      ellipsis: true,
      width: 120
    },
    {
      title: '商品说明',
      dataIndex: 'description',
      ellipsis: true
    },
    {
      title: '分类',
      dataIndex: 'categoryName',
      width: 80,
      render: (name, record) => (
        <span style={{ color: record.categoryColor || '#666' }}>{name || '未分类'}</span>
      )
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 90,
      align: 'right',
      render: (amount) => (
        <span style={{ color: '#52c41a', fontWeight: 500 }}>
          +¥{amount.toFixed(2)}
        </span>
      )
    }
  ];

  // 点击查看明细
  const handleShowDetail = (type) => {
    setDetailType(type);
    setDetailModalVisible(true);
  };

  // 分类排行表格列
  const categoryColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 50,
      render: (_, __, index) => (
        <span style={{ 
          color: index < 3 ? '#f5222d' : '#666',
          fontWeight: index < 3 ? 'bold' : 'normal'
        }}>
          {index + 1}
        </span>
      )
    },
    {
      title: '分类',
      dataIndex: 'name',
      render: (name, record) => (
        <span style={{ color: record.color }}>{name}</span>
      )
    },
    {
      title: '金额',
      dataIndex: 'total',
      width: 100,
      align: 'right',
      render: (total) => `¥${total.toFixed(2)}`
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      width: 120,
      render: (percentage) => (
        <Progress 
          percent={parseFloat(percentage)} 
          size="small" 
          strokeColor="#f5222d"
          format={(p) => `${p.toFixed(1)}%`}
        />
      )
    }
  ];

  return (
    <Spin spinning={loading}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>月度报表</Title>
        <DatePicker
          picker="month"
          value={month}
          onChange={(date) => date && setMonth(date)}
          allowClear={false}
        />
      </div>

      {/* 顶部汇总卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ cursor: 'pointer' }} onClick={() => handleShowDetail('expense')}>
            <Statistic
              title="本月支出"
              value={summary?.totalExpense || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#f5222d' }}
              suffix={<ArrowDownOutlined />}
            />
            <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
              共 {summary?.expenseCount || 0} 笔支出，点击查看明细
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable style={{ cursor: 'pointer' }} onClick={() => handleShowDetail('income')}>
            <Statistic
              title="本月收入"
              value={summary?.totalIncome || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
              suffix={<ArrowUpOutlined />}
            />
            <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
              共 {summary?.incomeCount || 0} 笔收入，点击查看明细
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="本月结余"
              value={summary?.netBalance || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: (summary?.netBalance || 0) >= 0 ? '#52c41a' : '#f5222d' }}
              suffix={<WalletOutlined />}
            />
            <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
              收入 - 支出 = 结余
            </div>
          </Card>
        </Col>
      </Row>

      {/* 排行榜 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="消费排行榜（分类）" size="small">
            {categoryStats.length > 0 ? (
              <Table
                dataSource={categoryStats}
                columns={categoryColumns}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ y: 240 }}
              />
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="消费排行榜（单笔）" size="small">
            {topExpenses.length > 0 ? (
              <Table
                dataSource={topExpenses}
                columns={expenseColumns}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ y: 240 }}
              />
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
      </Row>

      {/* 图表 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="本月支出分布" size="small">
            {categoryStats.length > 0 ? (
              <ReactECharts option={pieOption} style={{ height: 300 }} />
            ) : (
              <Empty description="暂无数据" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="每日支出趋势" size="small">
            {dailyExpenses.length > 0 ? (
              <ReactECharts option={barOption} style={{ height: 300 }} />
            ) : (
              <Empty description="暂无数据" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
            )}
          </Card>
        </Col>
      </Row>

      {/* 本月支出明细 */}
      <Card title={`本月支出明细（共 ${expenseList.length} 笔）`} size="small">
        {expenseList.length > 0 ? (
          <Table
            dataSource={expenseList}
            columns={expenseListColumns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
            scroll={{ x: 600 }}
          />
        ) : (
          <Empty description="暂无支出记录" />
        )}
      </Card>

      {/* 明细弹窗 */}
      <Modal
        title={detailType === 'expense' ? `本月支出明细（${month.format('YYYY年MM月')}）` : `本月收入明细（${month.format('YYYY年MM月')}）`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
        styles={{ body: { maxHeight: '70vh', overflow: 'auto' } }}
      >
        <Table
          dataSource={detailType === 'expense' 
            ? [...expenseList].sort((a, b) => b.amount - a.amount) 
            : [...incomeList].sort((a, b) => b.amount - a.amount)
          }
          columns={detailType === 'expense' ? expenseListColumns : incomeListColumns}
          rowKey="id"
          size="small"
          pagination={false}
          scroll={{ x: 600 }}
        />
      </Modal>
    </Spin>
  );
};

export default MonthlyReport;
