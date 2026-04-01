import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import authService from '../services/auth';

// Leaf SVG for decoration
const LeafIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
  </svg>
);

// App Logo
const AppLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <path d="M2 17l10 5 10-5"/>
    <path d="M2 12l10 5 10-5"/>
  </svg>
);

const Register = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  if (authService.isAuthenticated()) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await authService.register(values.username, values.email, values.password);
      message.success('注册成功，请登录');
      navigate('/login');
    } catch (error) {
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message;
      
      if (errorCode === 'EMAIL_EXISTS') {
        message.error('该邮箱已被注册');
      } else if (errorCode === 'USERNAME_EXISTS') {
        message.error('该用户名已被使用');
      } else {
        message.error(errorMessage || '注册失败');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wellness-auth-container">
      <div className="wellness-auth-card">
        {/* Decorative leaves */}
        <LeafIcon className="wellness-decor-leaf wellness-decor-leaf-1" />
        <LeafIcon className="wellness-decor-leaf wellness-decor-leaf-2" />
        
        {/* Logo & Title */}
        <div className="wellness-auth-logo">
          <AppLogo />
        </div>
        <h1 className="wellness-auth-title">创建账户</h1>
        <p className="wellness-auth-subtitle">开启您的智能财务管理之旅</p>
        
        {/* Form */}
        <Form 
          form={form} 
          name="register" 
          onFinish={onFinish} 
          size="large"
          className="wellness-form"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 2, max: 50, message: '用户名长度为2-50个字符' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="邮箱地址" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="密码" 
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="确认密码" 
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block
              className="wellness-btn-primary"
            >
              注册
            </Button>
          </Form.Item>
        </Form>

        {/* Footer */}
        <div className="wellness-auth-footer">
          已有账号？ <Link to="/login">立即登录</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
