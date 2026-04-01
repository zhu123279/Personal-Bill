import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, WalletOutlined } from '@ant-design/icons';

const SummaryCard = ({ summary, loading }) => {
  const { totalIncome = 0, totalExpense = 0, netBalance = 0 } = summary || {};

  return (
    <Row gutter={16}>
      <Col xs={24} sm={8}>
        <Card loading={loading}>
          <Statistic
            title="总收入"
            value={totalIncome}
            precision={2}
            valueStyle={{ color: '#52c41a' }}
            prefix={<ArrowUpOutlined />}
            suffix="元"
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card loading={loading}>
          <Statistic
            title="总支出"
            value={totalExpense}
            precision={2}
            valueStyle={{ color: '#f5222d' }}
            prefix={<ArrowDownOutlined />}
            suffix="元"
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card loading={loading}>
          <Statistic
            title="净余额"
            value={netBalance}
            precision={2}
            valueStyle={{ color: netBalance >= 0 ? '#52c41a' : '#f5222d' }}
            prefix={<WalletOutlined />}
            suffix="元"
          />
        </Card>
      </Col>
    </Row>
  );
};

export default SummaryCard;
