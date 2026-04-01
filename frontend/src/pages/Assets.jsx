import React, { useState, useEffect } from 'react';
import { Typography, DatePicker, Table, Card, Spin, Button, Modal, Form, Input, InputNumber, message, Space, Popconfirm, Tag, ColorPicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';

const { Title } = Typography;

const Assets = () => {
  const [year, setYear] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState([]);
  const [yearlyData, setYearlyData] = useState([]);
  const [channelModalVisible, setChannelModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMonth, setEditingMonth] = useState(null);
  const [channelForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const [editingChannel, setEditingChannel] = useState(null);

  const fetchChannels = async () => {
    try {
      const res = await api.get('/assets/channels');
      setChannels(res.data.channels || []);
    } catch (error) {
      console.error('获取渠道失败:', error);
    }
  };

  const fetchYearlyData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/assets/yearly/' + year.year());
      setYearlyData(res.data.assets || []);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    if (channels.length > 0) {
      fetchYearlyData();
    }
  }, [year, channels]);

  const buildTableData = () => {
    const months = [];
    for (let i = 1; i <= 12; i++) {
      const ym = year.year() + '-' + String(i).padStart(2, '0');
      const row = { key: ym, ym: ym };
      let total = 0;
      channels.forEach(ch => {
        const found = yearlyData.find(a => a.ym === ym && a.channel_id === ch.id);
        const amt = found ? parseFloat(found.amount) : 0;
        row['ch_' + ch.id] = amt;
        total += amt;
      });
      row.total = total;
      months.push(row);
    }
    return months;
  };

  const handleChannelSubmit = async () => {
    try {
      const values = await channelForm.validateFields();
      if (editingChannel) {
        await api.put('/assets/channels/' + editingChannel.id, values);
        message.success('更新成功');
        setEditingChannel(null);
      } else {
        await api.post('/assets/channels', values);
        message.success('添加成功');
      }
      channelForm.resetFields();
      fetchChannels();
    } catch (error) {
      if (error.errorFields) return;
      message.error(editingChannel ? '更新失败' : '添加失败');
    }
  };

  const handleEditChannel = (record) => {
    setEditingChannel(record);
    channelForm.setFieldsValue({
      name: record.name,
      color: record.color
    });
  };

  const handleCancelEditChannel = () => {
    setEditingChannel(null);
    channelForm.resetFields();
  };

  const handleDeleteChannel = async (id) => {
    try {
      await api.delete('/assets/channels/' + id);
      message.success('删除成功');
      fetchChannels();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleEditMonth = (ym) => {
    setEditingMonth(ym);
    const formValues = {};
    channels.forEach(ch => {
      const found = yearlyData.find(a => a.ym === ym && a.channel_id === ch.id);
      formValues['ch_' + ch.id] = found ? parseFloat(found.amount) : 0;
    });
    editForm.setFieldsValue(formValues);
    setEditModalVisible(true);
  };

  const handleSaveMonth = async () => {
    try {
      const values = await editForm.validateFields();
      const assets = channels.map(ch => ({
        channelId: ch.id,
        amount: values['ch_' + ch.id] || 0
      }));
      await api.post('/assets/monthly/' + editingMonth + '/batch', { assets });
      message.success('保存成功');
      setEditModalVisible(false);
      fetchYearlyData();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const columns = [
    {
      title: '月份',
      dataIndex: 'ym',
      width: 100,
      fixed: 'left',
      render: (v) => dayjs(v).format('YYYY年MM月')
    },
    ...channels.map(ch => ({
      title: <Tag color={ch.color}>{ch.name}</Tag>,
      dataIndex: 'ch_' + ch.id,
      width: 120,
      align: 'right',
      render: (v) => v > 0 ? '¥' + v.toFixed(2) : '-'
    })),
    {
      title: '合计',
      dataIndex: 'total',
      width: 120,
      align: 'right',
      render: (v) => <span style={{ fontWeight: 600, color: '#1890ff' }}>¥{v.toFixed(2)}</span>
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditMonth(record.ym)}>
          编辑
        </Button>
      )
    }
  ];

  const tableData = buildTableData();

  return (
    <Spin spinning={loading}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>资产管理</Title>
        <Space>
          <DatePicker picker="year" value={year} onChange={(d) => d && setYear(d)} allowClear={false} />
          <Button icon={<SettingOutlined />} onClick={() => setChannelModalVisible(true)}>管理渠道</Button>
        </Space>
      </div>

      {channels.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: '#999' }}>暂无资产渠道，请先添加</p>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setChannelModalVisible(true)}>
              添加渠道
            </Button>
          </div>
        </Card>
      ) : (
        <Card size="small">
          <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            scroll={{ x: 'max-content' }}
            size="middle"
            summary={() => {
              const totals = { total: 0 };
              channels.forEach(ch => { totals['ch_' + ch.id] = 0; });
              tableData.forEach(row => {
                channels.forEach(ch => { totals['ch_' + ch.id] += row['ch_' + ch.id] || 0; });
                totals.total += row.total;
              });
              return (
                <Table.Summary fixed>
                  <Table.Summary.Row style={{ background: '#fafafa' }}>
                    <Table.Summary.Cell index={0}><strong>年度总计</strong></Table.Summary.Cell>
                    {channels.map((ch, idx) => (
                      <Table.Summary.Cell key={ch.id} index={idx + 1} align="right">
                        ¥{totals['ch_' + ch.id].toFixed(2)}
                      </Table.Summary.Cell>
                    ))}
                    <Table.Summary.Cell index={channels.length + 1} align="right">
                      <strong style={{ color: '#1890ff' }}>¥{totals.total.toFixed(2)}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={channels.length + 2} />
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          />
        </Card>
      )}

      <Modal
        title="管理资产渠道"
        open={channelModalVisible}
        onCancel={() => { 
          setChannelModalVisible(false); 
          setEditingChannel(null);
          channelForm.resetFields(); 
        }}
        footer={null}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <Form form={channelForm} layout="inline" onFinish={handleChannelSubmit}>
            <Form.Item name="name" rules={[{ required: true, message: '请输入名称' }]}>
              <Input placeholder="渠道名称" style={{ width: 140 }} />
            </Form.Item>
            <Form.Item 
              name="color" 
              getValueFromEvent={(color) => color.toHexString()}
            >
              <ColorPicker />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingChannel ? '更新' : '添加'}
                </Button>
                {editingChannel && (
                  <Button onClick={handleCancelEditChannel}>取消</Button>
                )}
              </Space>
            </Form.Item>
          </Form>
        </div>
        <Table
          dataSource={channels}
          rowKey="id"
          size="small"
          pagination={false}
          columns={[
            { title: '名称', dataIndex: 'name', render: (n, r) => <Tag color={r.color}>{n}</Tag> },
            { title: '颜色', dataIndex: 'color', width: 100 },
            {
              title: '操作', width: 110,
              render: (_, r) => (
                <Space>
                  <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditChannel(r)} />
                  <Popconfirm title="确定删除？" onConfirm={() => handleDeleteChannel(r.id)}>
                    <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              )
            }
          ]}
        />
      </Modal>

      <Modal
        title={'编辑 ' + (editingMonth ? dayjs(editingMonth).format('YYYY年MM月') : '') + ' 资产'}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleSaveMonth}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical">
          {channels.map(ch => (
            <Form.Item key={ch.id} name={'ch_' + ch.id} label={<Tag color={ch.color}>{ch.name}</Tag>}>
              <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入金额" prefix="¥" />
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </Spin>
  );
};

export default Assets;
