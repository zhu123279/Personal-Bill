import { useState } from 'react';
import { Typography, Button, Space, Card, Popconfirm, message } from 'antd';
import { PlusOutlined, UploadOutlined, DeleteOutlined, EditOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import BillList from '../components/Bill/BillList';
import BillFilter from '../components/Bill/BillFilter';
import BillForm from '../components/Bill/BillForm';
import ImportModal from '../components/Bill/ImportModal';
import BatchEditModal from '../components/Bill/BatchEditModal';
import billService from '../services/bill';

const { Title } = Typography;

const Bills = () => {
  const [filters, setFilters] = useState({});
  const [formVisible, setFormVisible] = useState(false);
  const [importVisible, setImportVisible] = useState(false);
  const [batchEditVisible, setBatchEditVisible] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedSummary, setSelectedSummary] = useState({ totalIncome: 0, totalExpense: 0, count: 0 });
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
  };

  const handleAdd = () => {
    setEditingBill(null);
    setFormVisible(true);
  };

  const handleEdit = (bill) => {
    setEditingBill(bill);
    setFormVisible(true);
  };

  const handleFormSuccess = () => {
    setFormVisible(false);
    setEditingBill(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleImportSuccess = () => {
    setImportVisible(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleBatchEditSuccess = () => {
    setBatchEditVisible(false);
    setSelectedIds([]);
    setRefreshKey(prev => prev + 1);
  };

  const handleSelectionChange = (keys, summary) => {
    setSelectedIds(keys);
    if (summary) {
      setSelectedSummary(summary);
    } else {
      setSelectedSummary({ totalIncome: 0, totalExpense: 0, count: 0 });
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    
    setDeleting(true);
    try {
      const result = await billService.batchDeleteBills(selectedIds);
      message.success(`成功删除 ${result.deleted} 条记录`);
      setSelectedIds([]);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      message.error('批量删除失败');
    } finally {
      setDeleting(false);
    }
  };

  // 导出账单
  const handleExport = async () => {
    setExporting(true);
    try {
      // 获取所有符合筛选条件的账单
      const result = await billService.getBills({ ...filters, pageSize: 10000 });
      const bills = result.bills || [];
      
      if (bills.length === 0) {
        message.warning('没有可导出的数据');
        return;
      }

      // CSV 表头
      const headers = ['交易时间', '收支类型', '来源', '交易对方', '商品说明', '金额', '支付方式', '交易状态', '分类', '订单号', '备注'];
      
      // CSV 数据行
      const rows = bills.map(item => [
        dayjs(item.transactionTime).format('YYYY-MM-DD HH:mm:ss'),
        item.transactionType === 'income' ? '收入' : '支出',
        item.sourcePlatform === 'wechat' ? '微信' : item.sourcePlatform === 'alipay' ? '支付宝' : '手动',
        item.counterparty || '',
        item.description || '',
        (item.transactionType === 'income' ? '' : '-') + item.amount.toFixed(2),
        item.paymentMethod || '',
        item.status || '',
        item.categoryName || '未分类',
        item.orderNo || '',
        item.remark || ''
      ]);

      // 组装CSV内容
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // 添加BOM以支持中文
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `账单导出_${dayjs().format('YYYY-MM-DD_HHmmss')}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      
      message.success(`成功导出 ${bills.length} 条记录`);
    } catch (error) {
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
        <Title level={3} style={{ margin: 0 }}>账单管理</Title>
        <Space>
          {selectedIds.length > 0 && (
            <>
              <span style={{ marginRight: 8, color: '#666' }}>
                已选 {selectedIds.length} 条 | 
                <span style={{ color: '#52c41a', marginLeft: 4 }}>收入: ¥{selectedSummary.totalIncome.toFixed(2)}</span>
                <span style={{ color: '#f5222d', marginLeft: 8 }}>支出: ¥{selectedSummary.totalExpense.toFixed(2)}</span>
                <span style={{ marginLeft: 8 }}>净额: ¥{(selectedSummary.totalIncome - selectedSummary.totalExpense).toFixed(2)}</span>
              </span>
              <Button icon={<EditOutlined />} onClick={() => setBatchEditVisible(true)}>
                批量编辑
              </Button>
              <Popconfirm
                title={`确定删除选中的 ${selectedIds.length} 条记录？`}
                onConfirm={handleBatchDelete}
                okText="确定"
                cancelText="取消"
              >
                <Button danger icon={<DeleteOutlined />} loading={deleting}>
                  批量删除
                </Button>
              </Popconfirm>
            </>
          )}
          <Button icon={<DownloadOutlined />} onClick={handleExport} loading={exporting}>
            导出账单
          </Button>
          <Button icon={<UploadOutlined />} onClick={() => setImportVisible(true)}>
            导入账单
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增账单
          </Button>
        </Space>
      </div>
      
      <Card 
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }} 
        styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '16px 24px' } }}
      >
        <div style={{ flexShrink: 0, marginBottom: 16 }}>
          <BillFilter onFilter={handleFilter} />
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <BillList 
            filters={filters} 
            onEdit={handleEdit} 
            refreshKey={refreshKey}
            onSelectionChange={handleSelectionChange}
          />
        </div>
      </Card>
      
      <BillForm
        visible={formVisible}
        bill={editingBill}
        onCancel={() => setFormVisible(false)}
        onSuccess={handleFormSuccess}
      />
      
      <ImportModal
        visible={importVisible}
        onCancel={() => setImportVisible(false)}
        onSuccess={handleImportSuccess}
      />
      
      <BatchEditModal
        visible={batchEditVisible}
        selectedIds={selectedIds}
        onCancel={() => setBatchEditVisible(false)}
        onSuccess={handleBatchEditSuccess}
      />
    </div>
  );
};

export default Bills;
