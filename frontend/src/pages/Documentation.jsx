import { Typography, Card, Table, Tag, Divider } from 'antd';
import { CheckCircleOutlined, BulbOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

// 收入分类表格数据
const incomeTableData = [
  { key: '1', category: '工资收入', examples: '每月固定工资、绩效奖金等' },
  { key: '2', category: '副业收入', examples: '兼职、自由职业、投稿稿费等' },
  { key: '3', category: '其他收入', examples: '红包、退款、意外所得等' },
];

const incomeTableColumns = [
  { title: '分类名称', dataIndex: 'category', key: 'category', width: 120, render: (text) => <Tag color="red">{text}</Tag> },
  { title: '说明示例', dataIndex: 'examples', key: 'examples' },
];

// 支出分类表格数据
const expenseTableData = [
  { key: '1', category: '餐饮美食', subCategory: '日常买菜、水果、零食', examples: '超市采购食材、水果店消费等' },
  { key: '2', category: '餐饮美食', subCategory: '外卖、堂食消费等', examples: '美团外卖、餐厅就餐等' },
  { key: '3', category: '服饰装扮', subCategory: '衣服鞋子等', examples: '购买衣服、鞋子、配饰等' },
  { key: '4', category: '服饰装扮', subCategory: '其他商品', examples: '化妆品、护肤品等' },
  { key: '5', category: '住房', subCategory: '房贷或租金', examples: '每月房贷还款、房租支出' },
  { key: '6', category: '住房', subCategory: '公用事业费用', examples: '水费、电费、燃气费等' },
  { key: '7', category: '住房', subCategory: '房屋维护和修理费用', examples: '家电维修、装修改造等' },
  { key: '8', category: '交通出行', subCategory: '车辆费用', examples: '汽车贷款或租金、油费、保险、维修费用' },
  { key: '9', category: '交通出行', subCategory: '公共交通费用', examples: '地铁、公交、出租车等' },
  { key: '10', category: '交通出行', subCategory: '电动车充电', examples: '电动汽车、电动自行车充电费用' },
  { key: '11', category: '充值缴费', subCategory: '话费', examples: '手机话费充值' },
  { key: '12', category: '充值缴费', subCategory: '家庭电费', examples: '家庭用电缴费' },
  { key: '13', category: '充值缴费', subCategory: '流量费用', examples: '手机流量包、宽带费用' },
  { key: '14', category: '日用百货', subCategory: '个人护理用品', examples: '牙膏、洗发水、沐浴露等' },
  { key: '15', category: '日用百货', subCategory: '家庭清洁用品', examples: '洗衣液、清洁剂等' },
  { key: '16', category: '日用百货', subCategory: '家居用品', examples: '家具、收纳、装饰品等' },
  { key: '17', category: '医疗', subCategory: '医疗保险费用', examples: '医保、商业医疗险等' },
  { key: '18', category: '医疗', subCategory: '药品和医疗用品', examples: '购买药品、医疗器械等' },
  { key: '19', category: '医疗', subCategory: '医疗服务费用', examples: '挂号费、检查费、治疗费等' },
  { key: '20', category: '社交', subCategory: '礼物费用', examples: '生日礼物、节日礼品等' },
  { key: '21', category: '社交', subCategory: '人情往来', examples: '红包、份子钱等' },
  { key: '22', category: '娱乐', subCategory: '订阅费用', examples: '电视、互联网和娱乐订阅费用' },
  { key: '23', category: '娱乐', subCategory: '娱乐活动', examples: '电影、音乐、演出等娱乐活动' },
  { key: '24', category: '娱乐', subCategory: '旅行和度假费用', examples: '机票、酒店、景点门票等' },
  { key: '25', category: '投资', subCategory: '储蓄账户存款', examples: '定期存款、活期存款等' },
  { key: '26', category: '投资', subCategory: '投资账户投资额', examples: '股票、基金、理财产品等' },
  { key: '27', category: '烟酒', subCategory: '烟草产品', examples: '香烟、雪茄等烟草产品的购买' },
  { key: '28', category: '烟酒', subCategory: '酒精饮品', examples: '啤酒、葡萄酒、烈酒等酒精饮品的消费' },
];

const expenseTableColumns = [
  { 
    title: '大类', 
    dataIndex: 'category', 
    key: 'category', 
    width: 100,
    render: (text) => <Tag color="orange">{text}</Tag>,
    onCell: (_, index) => {
      // 根据分类合并单元格
      const categoryRowSpans = {
        '餐饮美食': { start: 0, span: 2 },
        '服饰装扮': { start: 2, span: 2 },
        '住房': { start: 4, span: 3 },
        '交通出行': { start: 7, span: 3 },
        '充值缴费': { start: 10, span: 3 },
        '日用百货': { start: 13, span: 3 },
        '医疗': { start: 16, span: 3 },
        '社交': { start: 19, span: 2 },
        '娱乐': { start: 21, span: 3 },
        '投资': { start: 24, span: 2 },
        '烟酒': { start: 26, span: 2 },
      };
      const current = expenseTableData[index];
      const config = categoryRowSpans[current.category];
      if (index === config.start) {
        return { rowSpan: config.span };
      }
      return { rowSpan: 0 };
    }
  },
  { title: '子类', dataIndex: 'subCategory', key: 'subCategory', width: 180 },
  { title: '说明示例', dataIndex: 'examples', key: 'examples' },
];

// 消费健康度表格数据
const healthTableData = [
  { key: '1', range: '0% - 50%', level: '非常健康', color: '#52c41a', description: '理想型消费者，有较好的储蓄习惯和投资意识' },
  { key: '2', range: '50% - 70%', level: '健康', color: '#52c41a', description: '消费合理，有适度储蓄空间，符合50/30/20原则' },
  { key: '3', range: '70% - 90%', level: '尚可', color: '#faad14', description: '存储能力不足，理财压力较大，需审视不必要开支' },
  { key: '4', range: '90% - 100%', level: '不健康', color: '#ff4d4f', description: '几乎月光，没有储蓄空间，极易受突发支出影响' },
  { key: '5', range: '>100%', level: '危险', color: '#ff4d4f', description: '超支透支，债务风险高，需立刻调整' },
];

const healthTableColumns = [
  { title: '比例区间', dataIndex: 'range', key: 'range', width: 120 },
  { title: '评价', dataIndex: 'level', key: 'level', width: 100, render: (text, record) => <Tag color={record.color}>{text}</Tag> },
  { title: '描述', dataIndex: 'description', key: 'description' },
];

const Documentation = () => {
  return (
    <div style={{ padding: '0 24px' }}>
      <Title level={2}>说明文档</Title>
      <Text type="secondary">最后更新：2025年5月8日</Text>

      <Divider />

      {/* 1. 消费类型说明 */}
      <Title level={3}>1. 消费类型说明</Title>
      
      <Card title="收入分类" style={{ marginBottom: 16 }}>
        <Table 
          columns={incomeTableColumns} 
          dataSource={incomeTableData} 
          pagination={false} 
          bordered 
          size="small" 
        />
      </Card>

      <Card title="支出分类" style={{ marginBottom: 24 }}>
        <Table 
          columns={expenseTableColumns} 
          dataSource={expenseTableData} 
          pagination={false} 
          bordered 
          size="small" 
        />
      </Card>

      <Divider />

      {/* 2. 消费健康度 */}
      <Title level={3}>2. 消费健康度</Title>

      <Card style={{ marginBottom: 24 }}>
        <Title level={4}><span style={{ color: '#ff4d4f' }}>🎯</span> 核心概念</Title>
        <Paragraph>
          <Text strong>消费占收入比例 = 月支出总额 / 月收入总额</Text>
        </Paragraph>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <Title level={4}><CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />合理区间划分</Title>
        <Table columns={healthTableColumns} dataSource={healthTableData} pagination={false} bordered size="small" />
      </Card>

      <Card>
        <Title level={4}><BulbOutlined style={{ color: '#faad14', marginRight: 8 }} />小贴士</Title>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li><Text strong>50/30/20 原则：</Text><Text>50% 必须支出，30% 可自由支出，20% 储蓄/投资</Text></li>
          <li><Text>高房价城市（北上广深），70% 以内都算健康</Text></li>
          <li><Text>还贷/抚养孩子/租房，目标控制在 <Text strong>80%</Text> 以内</Text></li>
        </ul>
      </Card>
    </div>
  );
};

export default Documentation;
