import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from 'antd';
import authService from '../services/auth';
import './Landing.css';

// Icons
const LeafIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
  </svg>
);

const ChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
    <path d="M18 20V10M12 20V4M6 20v-6"/>
  </svg>
);

const WalletIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
    <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5z"/>
    <path d="M16 12a1 1 0 1 0 2 0 1 1 0 0 0-2 0z"/>
  </svg>
);

const PieChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
    <path d="M22 12A10 10 0 0 0 12 2v10z"/>
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const Landing = () => {
  // 如果已登录，跳转到 dashboard
  if (authService.isAuthenticated()) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const features = [
    {
      icon: <ChartIcon />,
      title: '智能账单分析',
      description: '自动分类收支，生成可视化报表，让您一目了然掌握财务状况'
    },
    {
      icon: <WalletIcon />,
      title: '多账户管理',
      description: '支持银行卡、现金、支付宝、微信等多种账户统一管理'
    },
    {
      icon: <PieChartIcon />,
      title: '预算规划',
      description: '设定月度预算，实时追踪支出，帮助您养成良好的消费习惯'
    },
    {
      icon: <ShieldIcon />,
      title: '数据安全',
      description: '本地部署，数据完全由您掌控，保护您的财务隐私'
    }
  ];

  const testimonials = [
    {
      content: '用了三个月，终于知道钱都花哪儿了。界面清爽，操作简单，强烈推荐！',
      author: '张先生',
      role: '自由职业者'
    },
    {
      content: '作为一个记账小白，这个应用让我养成了记账习惯，现在每月都能存下一笔钱。',
      author: '李女士',
      role: '设计师'
    },
    {
      content: '报表功能太棒了，年度总结一键生成，再也不用手动整理 Excel 了。',
      author: '王先生',
      role: '产品经理'
    }
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-content">
          <div className="landing-logo">
            <LeafIcon />
            <span>记账本</span>
          </div>
          <div className="landing-nav-links">
            <Link to="/login" className="landing-nav-link">登录</Link>
            <Link to="/register">
              <Button className="wellness-btn-primary landing-nav-btn">免费注册</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-bg"></div>
        <div className="landing-container">
          <div className="landing-hero-content">
            <h1 className="landing-hero-title">
              轻松管理财务<br />
              <span className="landing-hero-highlight">开启健康理财生活</span>
            </h1>
            <p className="landing-hero-subtitle">
              简洁优雅的个人记账工具，帮助您追踪收支、分析消费习惯、实现财务目标
            </p>
            <div className="landing-hero-actions">
              <Link to="/register">
                <Button className="wellness-btn-primary landing-hero-btn">
                  立即开始 — 完全免费
                </Button>
              </Link>
              <Link to="/login" className="landing-hero-link">
                已有账号？登录
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features">
        <div className="landing-container">
          <div className="landing-section-header">
            <h2 className="landing-section-title">核心功能</h2>
            <p className="landing-section-subtitle">简单而强大的工具，让记账变得轻松愉快</p>
          </div>
          <div className="landing-features-grid">
            {features.map((feature, index) => (
              <div key={index} className="landing-feature-card">
                <div className="landing-feature-icon">{feature.icon}</div>
                <h3 className="landing-feature-title">{feature.title}</h3>
                <p className="landing-feature-desc">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="landing-testimonials">
        <div className="landing-container">
          <div className="landing-section-header">
            <h2 className="landing-section-title">用户评价</h2>
            <p className="landing-section-subtitle">听听他们怎么说</p>
          </div>
          <div className="landing-testimonials-grid">
            {testimonials.map((item, index) => (
              <div key={index} className="landing-testimonial-card">
                <div className="landing-testimonial-stars">
                  {[...Array(5)].map((_, i) => <StarIcon key={i} />)}
                </div>
                <p className="landing-testimonial-content">"{item.content}"</p>
                <div className="landing-testimonial-author">
                  <div className="landing-testimonial-avatar">
                    {item.author[0]}
                  </div>
                  <div>
                    <div className="landing-testimonial-name">{item.author}</div>
                    <div className="landing-testimonial-role">{item.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta">
        <div className="landing-container">
          <div className="landing-cta-card">
            <h2 className="landing-cta-title">准备好开始了吗？</h2>
            <p className="landing-cta-subtitle">
              加入我们，开启您的智能理财之旅
            </p>
            <div className="landing-cta-features">
              <span><CheckIcon /> 永久免费</span>
              <span><CheckIcon /> 无广告</span>
              <span><CheckIcon /> 数据安全</span>
            </div>
            <Link to="/register">
              <Button className="wellness-btn-cta landing-cta-btn">
                免费创建账户
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-content">
            <div className="landing-logo">
              <LeafIcon />
              <span>记账本</span>
            </div>
            <p className="landing-footer-text">
              简洁优雅的个人财务管理工具
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
