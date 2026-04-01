import React, { useState } from 'react';
import { Modal, Upload, Button, Table, message, Alert, Space, Tag, Tabs } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import billService from '../../services/bill';

const { Dragger } = Upload;

const ImportModal = ({ visible, onCancel, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [skippedRecords, setSkippedRecords] = useState([]);
  const [selectedSkippedRows, setSelectedSkippedRows] = useState([]);

  // 解析部分退款金额，返回退款金额，如果不是部分退款返回 null
  const parsePartialRefund = (status) => {
    if (!status) return null;
    // 匹配 "已退款(￥5.00)" 或 "已退款（￥5.00）" 格式
    const match = status.match(/已退款[（(]￥?([\d.]+)[）)]/);
    if (match) {
      return parseFloat(match[1]);
    }
    return null;
  };

  // 检查交易状态是否需要完全跳过
  const shouldSkipTransaction = (status, amount) => {
    const s = (status || '').trim();
    
    // 交易关闭 - 跳过
    if (s.includes('关闭') || s.toLowerCase().includes('closed')) {
      return { skip: true, reason: '交易关闭' };
    }
    
    // 检查是否是部分退款
    const partialRefund = parsePartialRefund(s);
    if (partialRefund !== null) {
      // 部分退款，不跳过，但需要调整金额
      return { skip: false, partialRefund };
    }
    
    // 全额退款 - 跳过
    if (s.includes('已全额退款') || s === '已退款' || s === '退款成功' ||
        s.match(/已退款￥?[\d.]+/) || // "已退款￥5.00" 格式（收入类型的退款记录）
        s.toLowerCase().includes('refund')) {
      return { skip: true, reason: '退款交易' };
    }
    
    return { skip: false };
  };

  const handleUpload = async (file) => {
    setLoading(true);
    try {
      const result = await billService.importBills(file);
      
      // 获取重复记录的原始索引集合
      const duplicateOriginalIndexes = new Set(
        (result.data.duplicates || []).map(d => d.index)
      );
      
      // 分离有效记录和需要跳过的记录
      const validRecords = [];
      const skippedByStatus = [];
      // 新索引到原始索引的映射，用于重复检测
      const newDuplicates = [];
      
      result.data.records.forEach((record, originalIndex) => {
        // 检查是否需要跳过
        const skipCheck = shouldSkipTransaction(record.status, record.amount);
        
        // 金额为0也跳过
        if (record.amount === 0) {
          skippedByStatus.push({
            row: originalIndex + 1,
            sortTime: record.transactionTime ? new Date(record.transactionTime).getTime() : 0,
            rawData: {
              transactionTime: record.transactionTime ? dayjs(record.transactionTime).format('YYYY-MM-DD HH:mm') : '',
              counterparty: record.counterparty || record.description,
              amount: `¥${(record.amount || 0).toFixed(2)}`
            },
            message: '金额为0'
          });
          return;
        }
        
        if (skipCheck.skip) {
          skippedByStatus.push({
            row: originalIndex + 1,
            sortTime: record.transactionTime ? new Date(record.transactionTime).getTime() : 0,
            rawData: {
              transactionTime: record.transactionTime ? dayjs(record.transactionTime).format('YYYY-MM-DD HH:mm') : '',
              counterparty: record.counterparty || record.description,
              amount: `¥${(record.amount || 0).toFixed(2)}`
            },
            message: skipCheck.reason
          });
        } else {
          // 处理部分退款：扣除退款金额
          let adjustedRecord = { ...record };
          // 保存原始金额用于重复检测（数据库中可能存的是原始金额或调整后金额）
          adjustedRecord.originalAmount = record.amount;
          
          if (skipCheck.partialRefund) {
            adjustedRecord.amount = record.amount - skipCheck.partialRefund;
            adjustedRecord.remark = `原金额¥${record.amount.toFixed(2)}，已退款¥${skipCheck.partialRefund.toFixed(2)}`;
            // 如果扣除后金额为0或负数，跳过
            if (adjustedRecord.amount <= 0) {
              skippedByStatus.push({
                row: originalIndex + 1,
                sortTime: record.transactionTime ? new Date(record.transactionTime).getTime() : 0,
                rawData: {
                  transactionTime: record.transactionTime ? dayjs(record.transactionTime).format('YYYY-MM-DD HH:mm') : '',
                  counterparty: record.counterparty || record.description,
                  amount: `¥${(record.amount || 0).toFixed(2)}`
                },
                message: '退款后金额为0'
              });
              return;
            }
          }
          
          // 记录新索引
          const newIndex = validRecords.length;
          // 如果原始索引是重复的，记录新索引
          if (duplicateOriginalIndexes.has(originalIndex)) {
            newDuplicates.push({ index: newIndex });
          }
          validRecords.push(adjustedRecord);
        }
      });
      
      // 更新解析结果，只保留有效记录，并更新重复索引
      const updatedParseResult = {
        ...result.data,
        records: validRecords,
        total: validRecords.length,
        duplicates: newDuplicates
      };
      setParseResult(updatedParseResult);
      
      // 默认选中：非重复的有效记录
      const duplicateNewIndexes = new Set(newDuplicates.map(d => d.index));
      const validIndexes = validRecords
        .map((record, index) => index)
        .filter(index => !duplicateNewIndexes.has(index));
      setSelectedRows(validIndexes);
      
      // 合并跳过的无效记录（解析错误 + 关闭/退款/金额为0），按交易时间降序排序
      const allSkipped = [...(result.data.errors || []), ...skippedByStatus]
        .sort((a, b) => (b.sortTime || 0) - (a.sortTime || 0));
      setSkippedRecords(allSkipped);
      
      setStep(2);
    } catch (error) {
      message.error(error.response?.data?.message || '文件解析失败');
    } finally {
      setLoading(false);
    }
    return false;
  };

  const [importResult, setImportResult] = useState(null);

  const handleSave = async () => {
    if (selectedRows.length === 0) {
      message.warning('请选择要导入的记录');
      return;
    }
    
    setLoading(true);
    try {
      const billsToSave = selectedRows.map(index => parseResult.records[index]);
      const result = await billService.batchSaveBills(billsToSave);
      
      if (result.skippedDetails && result.skippedDetails.length > 0) {
        // 有跳过的记录，显示详情
        setImportResult(result);
        setStep(3);
      } else {
        message.success(`成功导入 ${result.inserted} 条记录`);
        handleClose();
        onSuccess();
      }
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setParseResult(null);
    setSelectedRows([]);
    setSkippedRecords([]);
    setSelectedSkippedRows([]);
    setImportResult(null);
    onCancel();
  };

  const handleFinish = () => {
    handleClose();
    onSuccess();
  };

  const columns = [
    {
      title: '交易时间',
      dataIndex: 'transactionTime',
      key: 'transactionTime',
      width: 140,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
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
        const platformMap = {
          wechat: { text: '微信', color: '#07c160' },
          alipay: { text: '支付宝', color: '#1677ff' }
        };
        const p = platformMap[platform] || { text: platform, color: '#8c8c8c' };
        return <Tag color={p.color}>{p.text}</Tag>;
      }
    },
    {
      title: '交易对方',
      dataIndex: 'counterparty',
      key: 'counterparty',
      ellipsis: true,
      width: 100
    },
    {
      title: '商品说明',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 120
    },
    {
      title: '交易分类',
      dataIndex: 'originalType',
      key: 'originalType',
      width: 80,
      ellipsis: true,
      render: (type) => type || '-'
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      align: 'right',
      render: (amount, record) => {
        const hasPartialRefund = record.remark && record.remark.includes('已退款');
        return (
          <div>
            <span style={{ color: record.transactionType === 'income' ? '#52c41a' : '#f5222d' }}>
              {record.transactionType === 'income' ? '+' : '-'}¥{(amount || 0).toFixed(2)}
            </span>
            {hasPartialRefund && (
              <div style={{ fontSize: 10, color: '#faad14' }}>部分退款</div>
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
      key: 'transactionStatus',
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
      title: '导入状态',
      key: 'importStatus',
      width: 70,
      render: (_, record, index) => {
        const duplicate = parseResult?.duplicates?.find(d => d.index === index);
        if (duplicate) {
          return <Tag color="orange">重复</Tag>;
        }
        return <Tag color="green">新增</Tag>;
      }
    }
  ];

  const skippedColumns = [
    {
      title: '行号',
      dataIndex: 'row',
      key: 'row',
      width: 70
    },
    {
      title: '交易时间',
      dataIndex: ['rawData', 'transactionTime'],
      key: 'transactionTime',
      width: 150,
      render: (time) => time || '-'
    },
    {
      title: '交易对方',
      dataIndex: ['rawData', 'counterparty'],
      key: 'counterparty',
      width: 120,
      ellipsis: true,
      render: (val) => val || '-'
    },
    {
      title: '金额',
      dataIndex: ['rawData', 'amount'],
      key: 'amount',
      width: 100,
      render: (val) => val || '-'
    },
    {
      title: '跳过原因',
      dataIndex: 'message',
      key: 'message',
      render: (msg) => <span style={{ color: '#faad14' }}>{msg}</span>
    }
  ];

  const rowSelection = {
    selectedRowKeys: selectedRows,
    onChange: (keys) => setSelectedRows(keys),
    getCheckboxProps: (record) => {
      const index = parseResult?.records?.indexOf(record);
      const isDuplicate = parseResult?.duplicates?.some(d => d.index === index);
      // 只有重复记录禁用，金额为0的可以手动勾选
      return { disabled: isDuplicate };
    }
  };

  const skippedRowSelection = {
    selectedRowKeys: selectedSkippedRows,
    onChange: (keys) => setSelectedSkippedRows(keys)
  };

  const tabItems = [
    {
      key: 'valid',
      label: `有效记录 (${parseResult?.records?.length || 0})`,
      children: (
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={parseResult?.records?.map((r, i) => ({ ...r, key: i })) || []}
          size="small"
          scroll={{ y: 350 }}
          pagination={false}
        />
      )
    },
    {
      key: 'skipped',
      label: `跳过记录 (${skippedRecords.length})`,
      children: skippedRecords.length > 0 ? (
        <Table
          rowSelection={skippedRowSelection}
          columns={skippedColumns}
          dataSource={skippedRecords.map((r, i) => ({ ...r, key: i }))}
          size="small"
          scroll={{ y: 350 }}
          pagination={false}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          没有跳过的记录
        </div>
      )
    }
  ];

  return (
    <Modal
      title="导入账单"
      open={visible}
      onCancel={handleClose}
      width={1100}
      footer={step === 1 ? null : step === 2 ? [
        <Button key="cancel" onClick={handleClose}>取消</Button>,
        <Button key="back" onClick={() => setStep(1)}>重新上传</Button>,
        <Button key="save" type="primary" loading={loading} onClick={handleSave}>
          导入选中 ({selectedRows.length})
        </Button>
      ] : [
        <Button key="close" type="primary" onClick={handleFinish}>
          完成
        </Button>
      ]}
    >
      {step === 1 && (
        <Dragger
          accept=".xlsx,.xls,.csv"
          beforeUpload={handleUpload}
          showUploadList={false}
          disabled={loading}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持微信账单（.xlsx）和支付宝账单（.csv）
          </p>
        </Dragger>
      )}
      
      {step === 2 && parseResult && (
        <>
          <Alert
            message={
              <Space>
                <span>解析完成：共 {parseResult.total} 条有效记录</span>
                {parseResult.skipped > 0 && <span>，跳过 {parseResult.skipped} 条无效记录</span>}
                {parseResult.duplicates?.length > 0 && (
                  <span>，检测到 {parseResult.duplicates.length} 条重复记录</span>
                )}
                <Tag color={parseResult.platform === 'wechat' ? 'green' : 'blue'}>
                  {parseResult.platform === 'wechat' ? '微信' : '支付宝'}
                </Tag>
              </Space>
            }
            type="info"
            style={{ marginBottom: 16 }}
          />
          <Tabs items={tabItems} />
        </>
      )}

      {step === 3 && importResult && (
        <>
          <Alert
            message={`导入完成：成功 ${importResult.inserted} 条，跳过 ${importResult.skipped} 条`}
            type={importResult.inserted > 0 ? 'success' : 'warning'}
            style={{ marginBottom: 16 }}
          />
          {importResult.skippedDetails && importResult.skippedDetails.length > 0 && (
            <>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>跳过记录详情：</div>
              <Table
                columns={[
                  {
                    title: '交易时间',
                    dataIndex: 'time',
                    key: 'time',
                    width: 150,
                    render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
                  },
                  {
                    title: '金额',
                    dataIndex: 'amount',
                    key: 'amount',
                    width: 100,
                    render: (amount) => `¥${(amount || 0).toFixed(2)}`
                  },
                  {
                    title: '交易对方/说明',
                    dataIndex: 'counterparty',
                    key: 'counterparty',
                    ellipsis: true
                  },
                  {
                    title: '跳过原因',
                    dataIndex: 'reason',
                    key: 'reason',
                    width: 200,
                    render: (reason) => <Tag color="orange">{reason}</Tag>
                  }
                ]}
                dataSource={importResult.skippedDetails.map((r, i) => ({ ...r, key: i }))}
                size="small"
                scroll={{ y: 350 }}
                pagination={false}
              />
            </>
          )}
        </>
      )}
    </Modal>
  );
};

export default ImportModal;
