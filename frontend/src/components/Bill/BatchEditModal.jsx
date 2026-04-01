import { useState, useEffect } from 'react';
import { Modal, Form, Select, message, Alert } from 'antd';
import billService from '../../services/bill';

const BatchEditModal = ({ visible, selectedIds, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  // 获取分类列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await billService.getCategories();
        setCategories(res.categories || []);
      } catch (error) {
        console.error('获取分类失败:', error);
      }
    };
    if (visible) {
      fetchCategories();
    }
  }, [visible]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 检查是否有选择要修改的字段
      if (!values.categoryId && !values.transactionType) {
        message.warning('请至少选择一个要修改的字段');
        return;
      }

      setLoading(true);
      
      const result = await billService.batchUpdateBills(selectedIds, values);
      message.success(`成功更新 ${result.updated} 条记录`);
      form.resetFields();
      onSuccess();
    } catch (error) {
      message.error('批量更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="批量编辑"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="确定"
      cancelText="取消"
    >
      <Alert
        message={`已选择 ${selectedIds.length} 条记录`}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      
      <Form form={form} layout="vertical">
        <Form.Item
          name="categoryId"
          label="修改分类"
          extra="留空表示不修改此字段"
        >
          <Select
            placeholder="选择分类"
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {categories.map(cat => (
              <Select.Option key={cat.id} value={cat.id}>
                {cat.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="transactionType"
          label="修改收支类型"
          extra="留空表示不修改此字段"
        >
          <Select placeholder="选择收支类型" allowClear>
            <Select.Option value="expense">支出</Select.Option>
            <Select.Option value="income">收入</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BatchEditModal;
