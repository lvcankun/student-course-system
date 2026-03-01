import { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Steps, Space } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const ForgotPasswordPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleSendCode = async (values: { username: string; email: string }) => {
    setLoading(true);
    try {
      setEmail(values.email);
      message.success('验证码已发送到您的邮箱');
      setCurrentStep(1);
    } catch {
      message.error('发送验证码失败');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    try {
      message.success('验证成功');
      setCurrentStep(2);
    } catch {
      message.error('验证码错误');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (values: { newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }
    setLoading(true);
    try {
      message.success('密码重置成功，请重新登录');
      navigate('/login');
    } catch {
      message.error('密码重置失败');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: '验证身份', icon: <SafetyOutlined /> },
    { title: '输入验证码', icon: <MailOutlined /> },
    { title: '重置密码', icon: <LockOutlined /> },
  ];

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
      <Card style={{ width: 450, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <SafetyOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          <Title level={3} style={{ marginTop: 16, marginBottom: 0 }}>
            找回密码
          </Title>
          <Text type="secondary">Password Recovery</Text>
        </div>

        <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />

        {currentStep === 0 && (
          <Form form={form} onFinish={handleSendCode} layout="vertical">
            <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input prefix={<UserOutlined />} placeholder="请输入用户名" size="large" />
            </Form.Item>
            <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email', message: '请输入正确的邮箱' }]}>
              <Input prefix={<MailOutlined />} placeholder="请输入绑定的邮箱" size="large" />
            </Form.Item>
            <Form.Item>
              <Space style={{ width: '100%' }} direction="vertical">
                <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                  发送验证码
                </Button>
                <Button type="link" block onClick={() => navigate('/login')}>
                  返回登录
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}

        {currentStep === 1 && (
          <Form onFinish={handleVerifyCode} layout="vertical">
            <Form.Item label="验证码已发送至">
              <Text strong>{email}</Text>
            </Form.Item>
            <Form.Item name="code" label="验证码" rules={[{ required: true, message: '请输入验证码' }]}>
              <Input.OTP length={6} size="large" />
            </Form.Item>
            <Form.Item>
              <Space style={{ width: '100%' }} direction="vertical">
                <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                  验证
                </Button>
                <Button block onClick={() => setCurrentStep(0)}>
                  重新发送
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}

        {currentStep === 2 && (
          <Form onFinish={handleResetPassword} layout="vertical">
            <Form.Item name="newPassword" label="新密码" rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' },
            ]}>
              <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码" size="large" />
            </Form.Item>
            <Form.Item name="confirmPassword" label="确认密码" rules={[{ required: true, message: '请确认密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="请再次输入密码" size="large" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                重置密码
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
