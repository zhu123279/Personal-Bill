-- 个人账单管理系统数据库架构
-- Personal Bill Manager Database Schema

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS bill_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE bill_manager;

-- 用户表 (users)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 分类表 (categories)
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    name VARCHAR(50) NOT NULL,
    type ENUM('income', 'expense') NOT NULL DEFAULT 'expense',
    icon VARCHAR(50),
    color VARCHAR(20),
    keywords TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 账单表 (bills) 
CREATE TABLE IF NOT EXISTS bills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    transaction_time DATETIME NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type ENUM('income', 'expense') NOT NULL,
    counterparty VARCHAR(255),
    description TEXT,
    category_id INT,
    source_platform ENUM('wechat', 'manual') NOT NULL,
    original_type VARCHAR(100),
    payment_method VARCHAR(100),
    status VARCHAR(50),
    order_no VARCHAR(100),
    merchant_order_no VARCHAR(100),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_user_time (user_id, transaction_time),
    INDEX idx_user_category (user_id, category_id),
    INDEX idx_user_type (user_id, transaction_type),
    INDEX idx_transaction_time (transaction_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 分类规则表 (category_rules)
CREATE TABLE IF NOT EXISTS category_rules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    keyword VARCHAR(100) NOT NULL,
    category_id INT NOT NULL,
    priority INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_user_keyword (user_id, keyword),
    UNIQUE KEY unique_user_keyword (user_id, keyword)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 资产渠道表 (asset_channels)
CREATE TABLE IF NOT EXISTS asset_channels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(50) DEFAULT 'bank',
    color VARCHAR(20) DEFAULT '#1677ff',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 月度资产记录表 (monthly_assets)
CREATE TABLE IF NOT EXISTS monthly_assets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    channel_id INT NOT NULL,
    `year_month` VARCHAR(7) NOT NULL COMMENT '年月格式: 2025-01',
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (channel_id) REFERENCES asset_channels(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_channel_month (user_id, channel_id, `year_month`),
    INDEX idx_user_month (user_id, `year_month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户配置表 (user_settings)
CREATE TABLE IF NOT EXISTS user_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 系统默认分类 (user_id = NULL)
-- 收入类分类
INSERT IGNORE INTO categories (user_id, name, type, icon, color) VALUES
(NULL, '工资收入', 'income', 'dollar', '#52c41a'),
(NULL, '副业收入', 'income', 'tool', '#13c2c2'),
(NULL, '其他收入', 'income', 'ellipsis', '#8c8c8c');

-- 支出类分类
INSERT IGNORE INTO categories (user_id, name, type, icon, color) VALUES
(NULL, '餐饮美食', 'expense', 'coffee', '#fa541c'),
(NULL, '服饰装扮', 'expense', 'skin', '#eb2f96'),
(NULL, '住房', 'expense', 'home', '#722ed1'),
(NULL, '交通出行', 'expense', 'car', '#1890ff'),
(NULL, '充值缴费', 'expense', 'mobile', '#13c2c2'),
(NULL, '日用百货', 'expense', 'shopping', '#faad14'),
(NULL, '医疗', 'expense', 'medicine-box', '#52c41a'),
(NULL, '社交', 'expense', 'team', '#f5222d'),
(NULL, '娱乐', 'expense', 'smile', '#a0d911'),
(NULL, '投资', 'expense', 'fund', '#2f54eb'),
(NULL, '烟酒', 'expense', 'fire', '#8c8c8c');
