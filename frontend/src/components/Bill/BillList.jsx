import { useState, useEffect, useRef } from 'react';
import { Table, Tag, Space, Button, Popconfirm, message, Modal, Descriptions } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import billService from '../../services/bill';

const BillList = ({ filters, onEdit, refreshKey, onSelectionChange }) => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [sortOrder, setSortOrder] = useState('DESC');
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentBill, setCurrentBill] = useState(null);

  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  const fetchBills = async (page, pageSize, order) => {
    setLoading(true);
    try {
      const result = await billService.getBills({ 
        page, 
        pageSize, 
        sortBy: 'transaction_time',
        sortOrder: order,
        ...filters 
      });
      setBills(result.bills);
      setPagination(prev => ({
        ...prev,
        current: result.page,
        pageSize: pageSize,
        total: result.total
      }));
      setSelectedRowKeys([]);
      if (onSelectionChangeRef.current) {
        onSelectionChangeRef.current([]);
      }
    } catch (error) {
      message.error('获取账单列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills(1, pagination.pageSize, sortOrder);
  }, [filters, refreshKey]);

  const handleDelete = async (id) => {
    try {
      await billService.deleteBill(id);
      message.success('删除成功');
      fetchBills(pagination.current, pagination.pageSize, sortOrder);
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSelectionChange = (keys) => {
    setSelectedRowKeys(keys);
    // 计算选中账单的金额总和
    const selectedBills = bills.filter(bill => keys.includes(bill.id));
    const totalIncome = selectedBills
      .filter(b => b.transactionType === 'income')
      .reduce((sum, b) => sum + b.amount, 0);
    const totalExpense = selectedBills
      .filter(b => b.transactionType === 'expense')
      .reduce((sum, b) => sum + b.amount, 0);
    
    if (onSelectionChangeRef.current) {
      onSelectionChangeRef.current(keys, { totalIncome, totalExpense, count: keys.length });
    }
  };

  const handleTableChange = (pag) => {
    fetchBills(pag.current, pag.pageSize, sortOrder);
  };

  const handleSortChange = () => {
    const newOrder = sortOrder === 'DESC' ? 'ASC' : 'DESC';
    setSortOrder(newOrder);
    fetchBills(pagination.current, pagination.pageSize, newOrder);
  };

  const handleViewDetail = (record) => {
    setCurrentBill(record);
    setDetailVisible(true);
  };

  const columns = [
    {
      title: (
        <span style={{ cursor: 'pointer', userSelect: 'none' }} onClick={handleSortChange}>
          交易时间 {sortOrder === 'DESC' ? '↓' : '↑'}
        </span>
      ),
      dataIndex: 'transactionTime',
      key: 'transactionTime',
      width: 150,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '收/支',
      dataIndex: 'transactionType',
      key: 'transactionType',
      width: 60,
      render: (type) => (
        <Tag color={type === 'income' ? 'green' : 'red'}>
          {type === 'income' ? '收入' : '支出'}
        </Tag>
      )
    },
    {
      title: '来源',
      dataIndex: 'sourcePlatform',
      key: 'sourcePlatform',
      width: 70,
      render: (platform) => {
        const map = {
          wechat: { text: '微信', color: '#07c160' },
          alipay: { text: '支付宝', color: '#1677ff' },
          manual: { text: '手动', color: '#8c8c8c' }
        };
        const p = map[platform] || { text: platform, color: '#8c8c8c' };
        return <Tag color={p.color}>{p.text}</Tag>;
      }
    },
    {
      title: '交易对方',
      dataIndex: 'counterparty',
      key: 'counterparty',
      ellipsis: true,
      width: 120
    },
    {
      title: '商品说明',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 140
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      align: 'right',
      render: (amount, record) => {
        const color = record.transactionType === 'income' ? '#52c41a' : '#f5222d';
        const prefix = record.transactionType === 'income' ? '+' : '-';
        const hasRefund = record.remark && record.remark.includes('[含退款');
        
        return (
          <div>
            <span style={{ color, fontWeight: 500 }}>
              {prefix}¥{amount.toFixed(2)}
            </span>
            {hasRefund && (
              <div style={{ fontSize: 11, color: '#fa8c16', marginTop: 2 }}>
                {record.remark.match(/\[含退款\s*[\d.]+\s*元\]/)?.[0] || '含退款'}
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: '支付方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 90,
      ellipsis: true,
      render: (method) => method || '-'
    },
    {
      title: '交易状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => {
        if (!status) return '-';
        const statusMap = {
          '交易成功': { color: 'green', text: '成功' },
          '已退款': { color: 'orange', text: '已退款' },
          '退款成功': { color: 'orange', text: '已退款' },
          '支付成功': { color: 'green', text: '成功' },
          '已关闭': { color: 'default', text: '已关闭' },
          '等待付款': { color: 'blue', text: '待付款' }
        };
        const s = statusMap[status] || { color: 'default', text: status };
        return <Tag color={s.color}>{s.text}</Tag>;
      }
    },
    {
      title: '分类',
      dataIndex: 'categoryName',
      key: 'categoryName',
      width: 100,
      ellipsis: true,
      render: (name, record) => {
        if (name) {
          return <Tag color={record.categoryColor || '#1890ff'}>{name}</Tag>;
        }
        return record.originalType || '-';
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 110,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          <Popconfirm title="确定删除此账单？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const platformMap = {
    wechat: '微信',
    alipay: '支付宝',
    manual: '手动录入'
  };

  return (
    <>
      <Table
        rowSelection={{ selectedRowKeys, onChange: handleSelectionChange }}
        columns={columns}
        dataSource={bills}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          pageSizeOptions: ['10', '20', '50', '100', '500', '1000']
        }}
        onChange={handleTableChange}
        size="middle"
        scroll={{ x: 1100, y: 'calc(100vh - 400px)' }}
      />

      <Modal
        title="账单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>,
          <Button key="edit" type="primary" onClick={() => { setDetailVisible(false); onEdit(currentBill); }}>编辑</Button>
        ]}
        width={600}
      >
        {currentBill && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="交易时间" span={2}>
              {dayjs(currentBill.transactionTime).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="收支类型">
              <Tag color={currentBill.transactionType === 'income' ? 'green' : 'red'}>
                {currentBill.transactionType === 'income' ? '收入' : '支出'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="金额">
              <div>
                <span style={{ color: currentBill.transactionType === 'income' ? '#52c41a' : '#f5222d', fontWeight: 600, fontSize: 16 }}>
                  {currentBill.transactionType === 'income' ? '+' : '-'}¥{currentBill.amount.toFixed(2)}
                </span>
                {currentBill.remark && currentBill.remark.includes('[含退款') && (
                  <Tag color="orange" style={{ marginLeft: 8 }}>
                    {currentBill.remark.match(/\[含退款\s*[\d.]+\s*元\]/)?.[0] || '含退款'}
                  </Tag>
                )}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="交易对方" span={2}>{currentBill.counterparty || '-'}</Descriptions.Item>
            <Descriptions.Item label="商品说明" span={2}>{currentBill.description || '-'}</Descriptions.Item>
            <Descriptions.Item label="分类">
              {currentBill.categoryName ? <Tag color={currentBill.categoryColor}>{currentBill.categoryName}</Tag> : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="原始分类">{currentBill.originalType || '-'}</Descriptions.Item>
            <Descriptions.Item label="来源平台">{platformMap[currentBill.sourcePlatform] || currentBill.sourcePlatform}</Descriptions.Item>
            <Descriptions.Item label="支付方式">{currentBill.paymentMethod || '-'}</Descriptions.Item>
            <Descriptions.Item label="交易状态">{currentBill.status || '-'}</Descriptions.Item>
            <Descriptions.Item label="订单号" span={2}>{currentBill.orderNo || '-'}</Descriptions.Item>
            <Descriptions.Item label="商户订单号" span={2}>{currentBill.merchantOrderNo || '-'}</Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>{currentBill.remark || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {currentBill.createdAt ? dayjs(currentBill.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {currentBill.updatedAt ? dayjs(currentBill.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
};

export default BillList;
