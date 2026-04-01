import React, { useState, useEffect } from 'react';
import { Form, DatePicker, Select, InputNumber, Input, Button, Space, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { RangePicker } = DatePicker;
const { Option } = Select;

const BillFilter = ({ onFilter }) => {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories/all');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('获取分类失败', error);
    }
  };

  const handleFinish = (values) => {
    const filters = {};
    
    if (values.dateRange && values.dateRange.length === 2) {
      filters.startDate = values.dateRange[0].format('YYYY-MM-DD 00:00:00');
      filters.endDate = values.dateRange[1].format('YYYY-MM-DD 23:59:59');
    }
    
    if (values.transactionType) {
      filters.transactionType = values.transactionType;
    }
    
    if (values.categoryId) {
      filters.categoryId = values.categoryId;
    }
    
    if (values.minAmount !== undefined && values.minAmount !== null) {
      filters.minAmount = values.minAmount;
    }
    
    if (values.maxAmount !== undefined && values.maxAmount !== null) {
      filters.maxAmount = values.maxAmount;
    }
    
    if (values.keyword) {
      filters.keyword = values.keyword;
    }
    
    if (values.sourcePlatform) {
      filters.sourcePlatform = values.sourcePlatform;
    }
    
    onFilter(filters);
  };

  const handleReset = () => {
    form.resetFields();
    onFilter({});
  };

  return (
    <Form form={form} onFinish={handleFinish} layout="inline">
      <Space wrap size={[8, 8]} style={{ width: '100%' }}>
        <Form.Item name="dateRange" style={{ marginBottom: 0 }}>
          <RangePicker style={{ width: 220 }} placeholder={['开始日期', '结束日期']} size="middle" />
        </Form.Item>
        <Form.Item name="transactionType" style={{ marginBottom: 0 }}>
          <Select placeholder="收/支" allowClear style={{ width: 80 }}>
            <Option value="income">收入</Option>
            <Option value="expense">支出</Option>
          </Select>
        </Form.Item>
        <Form.Item name="categoryId" style={{ marginBottom: 0 }}>
          <Select placeholder="分类" allowClear style={{ width: 100 }}>
            {categories.map(cat => (
              <Option key={cat.id} value={cat.id}>{cat.name}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="sourcePlatform" style={{ marginBottom: 0 }}>
          <Select placeholder="来源" allowClear style={{ width: 90 }}>
            <Option value="wechat">微信</Option>
            <Option value="alipay">支付宝</Option>
            <Option value="manual">手动</Option>
          </Select>
        </Form.Item>
        <Form.Item name="minAmount" style={{ marginBottom: 0 }}>
          <InputNumber placeholder="最小金额" style={{ width: 100 }} min={0} />
        </Form.Item>
        <Form.Item name="maxAmount" style={{ marginBottom: 0 }}>
          <InputNumber placeholder="最大金额" style={{ width: 100 }} min={0} />
        </Form.Item>
        <Form.Item name="keyword" style={{ marginBottom: 0 }}>
          <Input placeholder="搜索关键词" allowClear style={{ width: 130 }} />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>搜索</Button>
            <Button onClick={handleReset} icon={<ReloadOutlined />}>重置</Button>
          </Space>
        </Form.Item>
      </Space>
    </Form>
  );
};

export default BillFilter;
