import React, { useEffect, useRef } from 'react';
import { Card, Empty } from 'antd';
import * as echarts from 'echarts';

const MonthlyBar = ({ data, loading }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current || loading) return;
    
    // 如果没有数据，销毁图表实例
    if (!data || data.length === 0) {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
      return;
    }
    
    // 初始化或获取图表实例
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }
    
    const chart = chartInstance.current;
    
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['收入', '支出', '净余额'],
        top: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.map(item => item.month)
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '¥{value}'
        }
      },
      series: [
        {
          name: '收入',
          type: 'bar',
          data: data.map(item => item.income),
          itemStyle: { color: '#52c41a' }
        },
        {
          name: '支出',
          type: 'bar',
          data: data.map(item => item.expense),
          itemStyle: { color: '#f5222d' }
        },
        {
          name: '净余额',
          type: 'line',
          data: data.map(item => item.netBalance),
          itemStyle: { color: '#1890ff' },
          lineStyle: { width: 2 }
        }
      ]
    };
    
    chart.setOption(option, true);
    
    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, loading]);

  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  const showEmpty = !loading && (!data || data.length === 0);

  return (
    <Card title="月度对比" loading={loading}>
      {showEmpty ? (
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty description="暂无数据" />
        </div>
      ) : (
        <div ref={chartRef} style={{ height: 300 }} />
      )}
    </Card>
  );
};

export default MonthlyBar;
