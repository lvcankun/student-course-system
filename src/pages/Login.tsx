import { useState, useCallback, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography, Divider, Space } from 'antd';
import { UserOutlined, LockOutlined, BookOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '@/store';
import { authApi } from '@/services';
import type { LoginParams } from '@/types';

const { Title, Text } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { login, logout, addLoginAttempt, resetLoginAttempts, isLocked, isAuthenticated, user } = useUserStore();

  // 如果已经登录，先退出
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('Clearing previous login state');
      logout();
      queryClient.clear();
    }
  }, []);

  const handleLogin = useCallback(
    async (values: LoginParams) => {
      if (isLocked()) {
        message.error('账号已被锁定，请30分钟后再试');
        return;
      }

      console.log('Login attempt with:', values);
      setLoading(true);
      
      // 先清除之前的登录状态和缓存
      logout();
      queryClient.clear();
      
      try {
        const result = await authApi.login(values);
        console.log('Login result:', result);
        resetLoginAttempts();
        login(result.user, result.token);
        message.success('登录成功');
        
        const defaultPath = result.user.role === 'student' ? '/student/courses' 
          : result.user.role === 'teacher' ? '/teacher/courses' 
          : '/admin/dashboard';
        console.log('Redirecting to:', defaultPath);
        navigate(defaultPath);
      } catch (error) {
        console.error('Login error:', error);
        addLoginAttempt();
        message.error('登录失败，请检查用户名和密码');
      } finally {
        setLoading(false);
      }
    },
    [login, logout, navigate, addLoginAttempt, resetLoginAttempts, isLocked, queryClient]
  );

  const handleQuickLogin = (username: string, password: string) => {
    handleLogin({ username, password });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        style={{
          width: 420,
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <BookOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          <Title level={3} style={{ marginTop: 16, marginBottom: 0 }}>
            学生选课系统
          </Title>
          <Text type="secondary">Student Course Selection System</Text>
        </div>

        <Form
          name="login"
          onFinish={handleLogin}
          autoComplete="off"
          size="large"
          initialValues={{ username: 'student1', password: '123456' }}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>

          <Form.Item style={{ textAlign: 'center', marginBottom: 0 }}>
            <Button type="link" onClick={() => navigate('/forgot-password')}>
              忘记密码？
            </Button>
          </Form.Item>
        </Form>

        <Divider>快速登录</Divider>
        
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Button block onClick={() => handleQuickLogin('student1', '123456')}>
            学生账号 (student1)
          </Button>
          <Button block onClick={() => handleQuickLogin('teacher1', '123456')}>
            教师账号 (teacher1)
          </Button>
          <Button block onClick={() => handleQuickLogin('admin', '123456')}>
            管理员账号
          </Button>
        </Space>

        <div style={{ textAlign: 'center', color: '#999', fontSize: 12, marginTop: 16 }}>
          <p>所有账号密码均为: 123456</p>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
