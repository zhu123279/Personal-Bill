import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, DatePicker, message } from 'antd';
import dayjs from 'dayjs';
import api from '../../services/api';
import billService from '../../services/bill';

const { Option } = Select;
const { TextArea } = Input;

const BillForm = ({ visible, bill, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (visible && bill) {
      form.setFieldsValue({
        ...bill,
        transactionTime: bill.transactionTime ? dayjs(bill.transactionTime) : null
      });
    } else if (visible) {
      form.resetFields();
      form.setFieldsValue({
        transactionType: 'expense',
        sourcePlatform: 'manual',
        transactionTime: dayjs()
      });
    }
  }, [visible, bill, form]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories/all');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('获取分类失败', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const data = {
        ...values,
        transactionTime: values.transactionTime.format('YYYY-MM-DD HH:mm:ss')
      };
      
      if (bill) {
        await billService.updateBill(bill.id, data);
        message.success('更新成功');
      } else {
        await billService.createBill(data);
        message.success('创建成功');
      }
      
      onSuccess();
    } catch (error) {
      if (error.errorFields) {
        return;
      }
      message.error(bill ? '更新失败' : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={bill ? '编辑账单' : '新增账单'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      destroyOnClose
      width={500}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="transactionTime"
          label="交易时间"
          rules={[{ required: true, message: '请选择交易时间' }]}
        >
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>
        
        <Form.Item
          name="transactionType"
          label="交易类型"
          rules={[{ required: true, message: '请选择交易类型' }]}
        >
          <Select>
            <Option value="expense">支出</Option>
            <Option value="income">收入</Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          name="amount"
          label="金额"
          rules={[{ required: true, message: '请输入金额' }]}
        >
          <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
        </Form.Item>
        
        <Form.Item name="counterparty" label="交易对方">
          <Input placeholder="请输入交易对方" />
        </Form.Item>
        
        <Form.Item name="description" label="商品说明">
          <TextArea rows={2} placeholder="请输入商品说明" />
        </Form.Item>
        
        <Form.Item name="categoryId" label="分类">
          <Select placeholder="请选择分类" allowClear>
            {categories.map(cat => (
              <Option key={cat.id} value={cat.id}>{cat.name}</Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item name="sourcePlatform" label="来源平台">
          <Select>
            <Option value="manual">手动录入</Option>
            <Option value="wechat">微信</Option>
            <Option value="alipay">支付宝</Option>
          </Select>
        </Form.Item>
        
        <Form.Item name="remark" label="备注">
          <TextArea rows={2} placeholder="请输入备注" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BillForm;
