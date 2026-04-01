import React from 'react';
import { Typography, Card, Collapse, Tabs, Tag, Divider, Alert, Steps } from 'antd';
import {
  QuestionCircleOutlined,
  BookOutlined,
  RocketOutlined,
  SettingOutlined,
  FileTextOutlined,
  WalletOutlined,
  BarChartOutlined,
  TagsOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const Help = () => {
  // 功能模块说明
  const moduleItems = [
    {
      key: '1',
      label: <span><BarChartOutlined /> 报表统计</span>,
      children: (
        <div>
          <Title level={5}>可视化看板</Title>
          <Paragraph>系统首页，展示本月收支概览、收支趋势图、分类占比等核心数据。</Paragraph>
          
          <Title level={5}>月度报表</Title>
          <Paragraph>查看指定月份的详细收支数据，支持按分类查看支出和收入明细，点击卡片可查看详情列表。</Paragraph>
          
          <Title level={5}>月度收支</Title>
          <Paragraph>
            展示每月收入、支出、收支占比和结余情况，并根据收支占比判断财务健康度：
            <ul>
              <li><Tag color="green">🟢 非常健康</Tag> 支出占比 ≤ 50%</li>
              <li><Tag color="gold">🟡 健康</Tag> 支出占比 ≤ 70%</li>
              <li><Tag color="orange">🟠 偏高</Tag> 支出占比 ≤ 90%</li>
              <li><Tag color="red">🔴 不健康</Tag> 支出占比 &lt; 100%</li>
              <li><Tag color="magenta">🚨 危险</Tag> 支出占比 &gt; 100%</li>
            </ul>
          </Paragraph>
          
          <Title level={5}>年度报表</Title>
          <Paragraph>查看全年收支汇总数据，按月展示收支趋势。</Paragraph>
        </div>
      ),
    },
    {
      key: '2',
      label: <span><FileTextOutlined /> 账单中心</span>,
      children: (
        <div>
          <Title level={5}>账单管理</Title>
          <Paragraph>
            管理所有账单记录，支持以下功能：
            <ul>
              <li>新增、编辑、删除账单</li>
              <li>按日期范围、类型、分类筛选</li>
              <li>点击交易时间列头可切换升序/降序排列</li>
              <li>支持20/50/100/500/1000条每页</li>
              <li>勾选账单自动计算选中项的收入、支出、净额</li>
              <li>导出账单数据为CSV文件</li>
              <li>点击详情查看账单完整信息</li>
            </ul>
          </Paragraph>
          
          <Title level={5}>分类管理</Title>
          <Paragraph>
            管理收支分类，每个用户拥有独立的分类数据：
            <ul>
              <li>支持收入和支出两种类型</li>
              <li>可自定义分类名称和图标</li>
              <li>分类数据用于账单记录和统计分析</li>
            </ul>
          </Paragraph>
        </div>
      ),
    },
    {
      key: '3',
      label: <span><WalletOutlined /> 资产中心</span>,
      children: (
        <div>
          <Title level={5}>资产看板</Title>
          <Paragraph>
            资产数据可视化展示：
            <ul>
              <li>当月总资产和环比变化</li>
              <li>月度资产总览柱状图</li>
              <li>各渠道资产明细折线图</li>
              <li>渠道分布占比</li>
              <li>月度趋势列表</li>
            </ul>
          </Paragraph>
          
          <Title level={5}>资产管理</Title>
          <Paragraph>
            记录每月各渠道的资产情况：
            <ul>
              <li>管理资产渠道（如微信、支付宝、银行卡等）</li>
              <li>按年份查看12个月的资产数据</li>
              <li>编辑每月各渠道的资产金额</li>
              <li>自动计算年度总计</li>
            </ul>
          </Paragraph>
        </div>
      ),
    },
  ];

  // 操作教程
  const tutorialSteps = [
    {
      title: '注册登录',
      description: '首次使用需要注册账号，填写邮箱和密码完成注册后登录系统。',
    },
    {
      title: '设置分类',
      description: '进入"分类管理"，添加常用的收入和支出分类，如工资、餐饮、交通等。',
    },
    {
      title: '记录账单',
      description: '进入"账单管理"，点击"新增账单"记录每笔收支，填写金额、分类、日期等信息。',
    },
    {
      title: '查看报表',
      description: '通过"可视化看板"、"月度报表"等页面查看收支统计和分析数据。',
    },
    {
      title: '管理资产',
      description: '进入"资产管理"添加资产渠道，定期记录各渠道的资产余额，在"资产看板"查看资产变化趋势。',
    },
  ];

  // 常见问题
  const faqItems = [
    {
      key: '1',
      label: '如何修改已记录的账单？',
      children: <Paragraph>在"账单管理"页面找到对应账单，点击操作列的"编辑"按钮进行修改。</Paragraph>,
    },
    {
      key: '2',
      label: '如何导出账单数据？',
      children: <Paragraph>在"账单管理"页面，设置好筛选条件后，点击"导出CSV"按钮即可下载账单数据。</Paragraph>,
    },
    {
      key: '3',
      label: '分类可以删除吗？',
      children: <Paragraph>可以删除，但如果该分类下有账单记录，建议先修改相关账单的分类后再删除。</Paragraph>,
    },
    {
      key: '4',
      label: '资产数据如何录入？',
      children: <Paragraph>进入"资产管理"，先点击"管理渠道"添加资产渠道（如微信、支付宝），然后点击对应月份的"编辑"按钮录入各渠道金额。</Paragraph>,
    },
    {
      key: '5',
      label: '月度收支的健康度是如何计算的？',
      children: <Paragraph>健康度根据支出占收入的比例计算：≤50%非常健康，≤70%健康，≤90%偏高，&lt;100%不健康，≥100%危险。</Paragraph>,
    },
    {
      key: '6',
      label: '数据安全吗？',
      children: <Paragraph>每个用户的数据相互隔离，只能查看和管理自己的账单、分类和资产数据。密码采用加密存储。</Paragraph>,
    },
  ];

  const tabItems = [
    {
      key: 'guide',
      label: <span><RocketOutlined /> 快速入门</span>,
      children: (
        <Card>
          <Alert
            message="欢迎使用财务管家"
            description="财务管家是一款个人财务管理系统，帮助您记录日常收支、管理资产、分析财务状况。"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          <Title level={4}>快速开始</Title>
          <Steps
            direction="vertical"
            current={-1}
            items={tutorialSteps}
            style={{ marginTop: 16 }}
          />
        </Card>
      ),
    },
    {
      key: 'modules',
      label: <span><BookOutlined /> 功能说明</span>,
      children: (
        <Card>
          <Collapse items={moduleItems} defaultActiveKey={['1']} />
        </Card>
      ),
    },
    {
      key: 'faq',
      label: <span><QuestionCircleOutlined /> 常见问题</span>,
      children: (
        <Card>
          <Collapse items={faqItems} />
        </Card>
      ),
    },
    {
      key: 'about',
      label: <span><SettingOutlined /> 关于系统</span>,
      children: (
        <Card>
          <Title level={4}>财务管家 v1.0.0</Title>
          <Divider />
          <Paragraph>
            <Text strong>系统简介：</Text>
            <br />
            财务管家是一款功能完善的个人财务管理系统，提供账单记录、分类管理、资产统计、报表分析等功能，帮助用户轻松管理个人财务。
          </Paragraph>
          <Paragraph>
            <Text strong>技术栈：</Text>
            <br />
            前端：React + Ant Design + ECharts
            <br />
            后端：Node.js + Express + MySQL
          </Paragraph>
          <Paragraph>
            <Text strong>主要功能：</Text>
            <ul>
              <li>账单管理：记录日常收支，支持分类、筛选、导出</li>
              <li>分类管理：自定义收支分类</li>
              <li>报表统计：可视化展示收支数据</li>
              <li>资产管理：记录各渠道资产变化</li>
              <li>健康分析：评估财务健康状况</li>
            </ul>
          </Paragraph>
          <Divider />
          <Paragraph type="secondary">
            © 2025 财务管家 All Rights Reserved
          </Paragraph>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>帮助中心</Title>
      <Tabs items={tabItems} />
    </div>
  );
};

export default Help;
