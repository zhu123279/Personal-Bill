# 个人账单管理系统 (Personal Bill Manager)

> 一个简洁高效、支持微信与支付宝账单导入分析、资产跟踪与可视化报表的个人财务管理系统。

---

## 📖 项目简介

**个人账单管理系统** 是一个面向个人记账、消费复盘和资产跟踪的 Web 全栈应用。

日常生活中，我们的消费记录往往分散在微信支付、支付宝等不同渠道中。本项目旨在通过**支持批量导入微信（Excel）和支付宝（CSV）流水**，将分散的交易数据聚合整理为统一、可搜索、可分类、多维统计的个人财务数据中心，帮助你清晰掌握收支结构与资产变化趋势。

---

## ✨ 核心特性

- 📥 **智能账单导入**：一键导入微信 Excel 账单与支付宝 CSV 账单，自动识别字段。
- 🔍 **重复记账检测**：在导入预览阶段智能比对，自动标记疑似重复账单，防止重复记账。
- 📊 **多维数据看板**：基于 ECharts 提供收支汇总、分类占比饼图、月度收支对比与消费趋势分析。
- 🏷️ **自定义分类体系**：支持灵活的收入与支出分类设置，支持基于关键词匹配规则。
- 📋 **高效账单管理**：支持多条件筛选（时间、金额、分类、平台、关键词）、排序、分页及批量编辑/删除。
- 💰 **资产趋势跟踪**：支持维护银行卡、现金、理财等资产账户，按月记录资产快照并绘制资产走势。
- 📑 **周期财务报表**：提供月度明细复盘与年度收支结构报表。
- 🔒 **多用户与安全**：基于 JWT 认证与密码哈希加密，用户间数据完全隔离。

---

## 🖼️ 界面预览

| 首页看板 | 账单列表 |
| :---: | :---: |
| ![首页看板](image-1.png) | ![账单列表](image-6.png) |

| 月度报表 | 年度统计 |
| :---: | :---: |
| ![月度报表](image-2.png) | ![年度统计](image-3.png) |

| 资产管理 | 账单导入预览 |
| :---: | :---: |
| ![资产管理](image-4.png) | ![账单导入预览](image-5.png) |

---

## 🛠️ 技术栈

### 前端 (Frontend)
- **框架**：React 18
- **路由**：React Router 6
- **UI 组件库**：Ant Design 5
- **数据可视化**：ECharts (`echarts-for-react`)
- **网络请求**：Axios
- **日期处理**：Day.js

### 后端 (Backend)
- **运行环境**：Node.js
- **Web 框架**：Express 4
- **数据库驱动**：MySQL2
- **鉴权认证**：JSON Web Token (JWT) + bcrypt
- **文件与解析**：Multer + SheetJS (xlsx) + iconv-lite

---

## 📁 项目结构

```text
.
├── backend                 # 后端服务
│   ├── database            # 数据库结构与初始化脚本
│   │   ├── init.js
│   │   └── schema.sql
│   └── src
│       ├── config          # 服务配置
│       ├── middleware      # 鉴权与错误处理中间件
│       ├── parsers         # 微信/支付宝账单解析器
│       ├── routes          # API 路由
│       ├── services        # 业务逻辑服务
│       ├── app.js
│       └── index.js
├── frontend                # 前端工程
│   ├── public
│   └── src
│       ├── components      # 页面组件与通用模块
│       ├── pages           # 各功能路由页面
│       ├── services        # 前端 API 请求
│       └── utils           # 工具库
├── README.md
└── LICENSE
```

---

## 🚀 快速上手

### 环境要求

- **Node.js**：16.x 或更高版本 (推荐 LTS)
- **npm**：8.x 或更高版本
- **MySQL**：5.7+ 或 8.0+

### 1. 克隆项目

```bash
# GitHub
git clone https://github.com/zhu123279/Personal-Bill.git

# Gitee（国内镜像）
git clone https://gitee.com/zhuyanchong/Personal-Bill.git

cd Personal-Bill
```

### 2. 数据库初始化

在 MySQL 中创建数据库并执行建表脚本：

```bash
mysql -u root -p < backend/database/schema.sql
```

> 默认数据库名称为 `bill_manager`。

### 3. 配置后端环境变量

进入 `backend` 目录，创建 `.env` 文件：

```bash
cd backend
cp .env.example .env
```

根据你的实际环境编辑 `.env`：

```env
PORT=3001
NODE_ENV=development

# MySQL 配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=bill_manager

# JWT 密钥（生产环境请设置随机安全字符串）
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# 允许的跨域地址
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 4. 启动后端服务

```bash
# 在 backend 目录下
npm install
npm run dev
```

后端服务将启动于 `http://localhost:3001`。

### 5. 启动前端服务

新建终端窗口并进入 `frontend` 目录：

```bash
cd frontend
npm install
npm start
```

前端开发服务器将运行在 `http://localhost:3000`。浏览器访问即可开始体验。

---

## 📥 账单导入说明

系统支持自动识别导入文件格式：

- **`.xlsx` / `.xls`**：自动识别为微信支付账单。
- **`.csv`**：自动识别为支付宝账单（自动处理 GBK / UTF-8 编码）。

> **隐私安全建议**：开源协同与 Issue 反馈中，请勿上传含有真实银行卡号、个人姓名或商户订单明细的原始账单。

---

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request 来帮助改进该项目！

1. Fork 本仓库
2. 新建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'feat: add some amazing feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 发起 Pull Request

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 开源。
