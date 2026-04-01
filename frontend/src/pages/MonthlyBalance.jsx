import React, { useState, useEffect } from 'react';
import { Typography, DatePicker, Table, Card, Spin, Tag } from 'antd';
import dayjs from 'dayjs';
import api from '../services/api';

const { Title } = Typography;

const MonthlyBalance = () => {
  const [year, setYear] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // 计算健康度
  const getHealthStatus = (ratio) => {
    if (ratio > 100) return { text: '🚨 危险', color: '#ff4d4f' };
    if (ratio <= 50) return { text: '🟢 非常健康', color: '#52c41a' };
    if (ratio <= 70) return { text: '🟡 健康', color: '#fadb14' };
    if (ratio <= 90) return { text: '🟠 偏高', color: '#fa8c16' };
    return { text: '🔴 不健康', color: '#f5222d' };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = year.startOf('year').format('YYYY-MM-DD 00:00:00');
      const endDate = year.endOf('year').format('YYYY-MM-DD 23:59:59');
      
      // 获取全年账单数据
      const res = await api.get('/bills', { 
        params: { startDate, endDate, pageSize: 10000 } 
      });
      const bills = res.data.bills || [];
      
      // 按月份分组统计
      const monthlyData = {};
      for (let i = 0; i < 12; i++) {
        const monthKey = `${year.year()}-${String(i + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }
      
      bills.forEach(bill => {
        const monthKey = dayjs(bill.transactionTime).format('YYYY-MM');
        if (monthlyData[monthKey]) {
          if (bill.transactionType === 'income') {
            monthlyData[monthKey].income += bill.amount;
          } else {
            monthlyData[monthKey].expense += bill.amount;
          }
        }
      });
      
      // 转换为表格数据
      const tableData = Object.entries(monthlyData).map(([month, stats]) => {
        const ratio = stats.income > 0 ? (stats.expense / stats.income) * 100 : (stats.expense > 0 ? 999 : 0);
        const balance = stats.income - stats.expense;
        return {
          key: month,
          month,
          income: stats.income,
          expense: stats.expense,
          ratio,
          balance,
          health: getHealthStatus(ratio)
        };
      });
      
      setData(tableData);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year]);

  // 计算年度汇总
  const yearSummary = data.reduce((acc, item) => ({
    income: acc.income + item.income,
    expense: acc.expense + item.expense
  }), { income: 0, expense: 0 });
  
  const yearRatio = yearSummary.income > 0 ? (yearSummary.expense / yearSummary.income) * 100 : 0;
  const yearBalance = yearSummary.income - yearSummary.expense;
  const yearHealth = getHealthStatus(yearRatio);

  const columns = [
    {
      title: '月份',
      dataIndex: 'month',
      width: 100,
      render: (month) => dayjs(month).format('YYYY年MM月')
    },
    {
      title: '收入',
      dataIndex: 'income',
      width: 120,
      align: 'right',
      render: (val) => <span style={{ color: '#52c41a', fontWeight: 500 }}>¥{val.toFixed(2)}</span>
    },
    {
      title: '支出',
      dataIndex: 'expense',
      width: 120,
      align: 'right',
      render: (val) => <span style={{ color: '#f5222d', fontWeight: 500 }}>¥{val.toFixed(2)}</span>
    },
    {
      title: '收支占比',
      dataIndex: 'ratio',
      width: 100,
      align: 'center',
      render: (val) => `${val.toFixed(1)}%`
    },
    {
      title: '结余',
      dataIndex: 'balance',
      width: 120,
      align: 'right',
      render: (val) => (
        <span style={{ color: val >= 0 ? '#52c41a' : '#f5222d', fontWeight: 500 }}>
          {val >= 0 ? '+' : ''}¥{val.toFixed(2)}
        </span>
      )
    },
    {
      title: '健康度',
      dataIndex: 'health',
      width: 120,
      align: 'center',
      render: (health) => (
        <Tag color={health.color} style={{ margin: 0 }}>{health.text}</Tag>
      )
    }
  ];

  return (
    <Spin spinning={loading}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>月度收支</Title>
        <DatePicker
          picker="year"
          value={year}
          onChange={(date) => date && setYear(date)}
          allowClear={false}
        />
      </div>

      {/* 年度汇总 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <div style={{ color: '#999', fontSize: 12 }}>年度收入</div>
            <div style={{ color: '#52c41a', fontSize: 20, fontWeight: 600 }}>¥{yearSummary.income.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ color: '#999', fontSize: 12 }}>年度支出</div>
            <div style={{ color: '#f5222d', fontSize: 20, fontWeight: 600 }}>¥{yearSummary.expense.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ color: '#999', fontSize: 12 }}>收支占比</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{yearRatio.toFixed(1)}%</div>
          </div>
          <div>
            <div style={{ color: '#999', fontSize: 12 }}>年度结余</div>
            <div style={{ color: yearBalance >= 0 ? '#52c41a' : '#f5222d', fontSize: 20, fontWeight: 600 }}>
              {yearBalance >= 0 ? '+' : ''}¥{yearBalance.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ color: '#999', fontSize: 12 }}>健康度</div>
            <div style={{ fontSize: 20 }}>{yearHealth.text}</div>
          </div>
        </div>
      </Card>

      <Card size="small">
        <Table
          columns={columns}
          dataSource={data}
          pagination={false}
          size="middle"
        />
      </Card>
    </Spin>
  );
};

export default MonthlyBalance;
