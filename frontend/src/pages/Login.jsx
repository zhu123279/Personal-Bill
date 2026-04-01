import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
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

const Login = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  if (authService.isAuthenticated()) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await authService.login(values.email, values.password);
      message.success('登录成功');
      navigate('/app/dashboard');
    } catch (error) {
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message;
      
      if (errorCode === 'USER_NOT_FOUND') {
        message.error('该邮箱未注册，请先注册账号');
      } else if (errorCode === 'WRONG_PASSWORD') {
        message.error('密码错误，请重新输入');
      } else if (errorMessage === 'Invalid credentials') {
        message.error('邮箱或密码错误');
      } else {
        message.error(errorMessage || '登录失败，请稍后重试');
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
        <h1 className="wellness-auth-title">欢迎回来</h1>
        <p className="wellness-auth-subtitle">登录您的账户，开始管理财务</p>
        
        {/* Form */}
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          className="wellness-form"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="邮箱地址" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="密码" 
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
              登录
            </Button>
          </Form.Item>
        </Form>

        {/* Footer */}
        <div className="wellness-auth-footer">
          还没有账号？ <Link to="/register">立即注册</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
