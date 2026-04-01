import { useState, useEffect } from 'react';
import { Typography, Card, Table, Button, Space, Modal, Form, Input, message, Popconfirm, ColorPicker, Tag, Radio } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Title } = Typography;

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const fetchCategories = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await api.get('/categories', { params: { page, pageSize } });
      setCategories(res.data.categories || []);
      setPagination({
        current: res.data.page,
        pageSize: res.data.pageSize,
        total: res.data.total
      });
      // 清空选择
      setSelectedRowKeys([]);
    } catch (error) {
      message.error('获取分类列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = () => {
    setEditingCategory(null);
    form.resetFields();
    form.setFieldsValue({ 
      color: '#1890ff',
      type: 'expense' // 默认支出
    });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCategory(record);
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      color: record.color || '#1890ff'
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      message.success('删除成功');
      fetchCategories(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的分类');
      return;
    }
    
    try {
      await api.post('/categories/batch-delete', { ids: selectedRowKeys });
      message.success(`成功删除 ${selectedRowKeys.length} 个分类`);
      setSelectedRowKeys([]);
      fetchCategories(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('批量删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        name: values.name,
        type: values.type,
        color: typeof values.color === 'string' ? values.color : values.color.toHexString()
      };

      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, data);
        message.success('更新成功');
      } else {
        await api.post('/categories', data);
        message.success('创建成功');
      }
      
      setModalVisible(false);
      fetchCategories(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(editingCategory ? '更新失败' : '创建失败');
    }
  };

  // 表格行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
    getCheckboxProps: (record) => ({
      disabled: record.isSystem, // 系统分类不可删除
    }),
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60
    },
    {
      title: '分类名称',
      dataIndex: 'name',
      width: 150,
      render: (name, record) => (
        <Tag color={record.color}>{name}</Tag>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 80,
      render: (type) => (
        type === 'income' ? <Tag color="success">收入</Tag> : <Tag color="error">支出</Tag>
      )
    },
    {
      title: '颜色',
      dataIndex: 'color',
      width: 120,
      render: (color) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 20, backgroundColor: color, borderRadius: 4 }} />
          <span>{color}</span>
        </div>
      )
    },
    {
      title: '账单数',
      dataIndex: 'billCount',
      width: 100,
      align: 'center',
      render: (count) => (
        <span style={{ fontWeight: 500 }}>{count || 0}</span>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => {
        if (record.isSystem) {
          return <span style={{ color: '#999' }}>系统内置</span>;
        }
        return (
          <Space size="small">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
            <Popconfirm
              title="确定删除此分类？"
              description="删除后，使用此分类的账单将变为未分类"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>分类管理</Title>
        <Space>
          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`确定删除选中的 ${selectedRowKeys.length} 个分类？`}
              description="删除后，使用这些分类的账单将变为未分类"
              onConfirm={handleBatchDelete}
              okText="确定"
              cancelText="取消"
            >
              <Button danger icon={<DeleteOutlined />}>
                批量删除 ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增分类
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={categories}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => fetchCategories(page, pageSize)
          }}
        />
      </Card>

      <Modal
        title={editingCategory ? '编辑分类' : '新增分类'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>

          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Radio.Group>
              <Radio value="expense">支出</Radio>
              <Radio value="income">收入</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item
            name="color"
            label="颜色"
          >
            <ColorPicker />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Categories;
