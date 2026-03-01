import { Card, Descriptions, Button, Avatar, Typography, Divider, Form, Input, message, Modal } from 'antd';
import { UserOutlined, MailOutlined, SafetyOutlined, EditOutlined } from '@ant-design/icons';
import { useUserStore } from '@/store';
import { useState } from 'react';

const { Title, Text } = Typography;

const ProfilePage = () => {
  const { user } = useUserStore();
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordForm] = Form.useForm();

  if (!user) {
    return <div style={{ padding: 24, textAlign: 'center' }}>请先登录</div>;
  }

  const getRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      student: '学生',
      teacher: '教师',
      admin: '管理员',
      superAdmin: '超级管理员',
    };
    return roleMap[role] || role;
  };

  const handlePasswordChange = async () => {
    try {
      await passwordForm.validateFields();
      const values = passwordForm.getFieldsValue();
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的密码不一致');
        return;
      }
      message.success('密码修改成功');
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      message.error('请填写完整信息');
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: user.role === 'student' ? '#1890ff' : user.role === 'teacher' ? '#52c41a' : '#722ed1' }} />
          <Title level={3} style={{ marginTop: 16, marginBottom: 4 }}>{user.name}</Title>
          <Text type="secondary">{getRoleName(user.role)}</Text>
        </div>
      </Card>

      <Divider />

      <Card title="基本信息" extra={<Button type="link" icon={<EditOutlined />}>编辑</Button>}>
        <Descriptions column={2}>
          <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
          <Descriptions.Item label="姓名">{user.name}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{user.email || '未设置'}</Descriptions.Item>
          <Descriptions.Item label="手机">{user.phone || '未设置'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Divider />

      {user.role === 'student' && (
        <>
          <Card title="学籍信息">
            <Descriptions column={2}>
              <Descriptions.Item label="学号">{user.studentId || '-'}</Descriptions.Item>
              <Descriptions.Item label="院系">{user.department || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="专业">{user.major || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="班级">{user.className || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="年级">{user.grade || '未设置'}</Descriptions.Item>
            </Descriptions>
          </Card>
          <Divider />
        </>
      )}

      {user.role === 'teacher' && (
        <>
          <Card title="教师信息">
            <Descriptions column={2}>
              <Descriptions.Item label="工号">{user.teacherId || '-'}</Descriptions.Item>
              <Descriptions.Item label="院系">{user.department || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="职称">{user.title || '未设置'}</Descriptions.Item>
            </Descriptions>
          </Card>
          <Divider />
        </>
      )}

      <Card title="账户信息">
        <Descriptions column={2}>
          <Descriptions.Item label="角色">{getRoleName(user.role)}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <span style={{ color: user.status === 'active' ? '#52c41a' : '#ff4d4f' }}>
              {user.status === 'active' ? '正常' : '禁用'}
            </span>
          </Descriptions.Item>
          {user.role === 'student' && (
            <Descriptions.Item label="最大选课学分">{user.maxCredits || 30}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Divider />

      <Card title="安全设置">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
          <div>
            <Text strong>账户密码</Text>
            <br />
            <Text type="secondary">定期更换密码可以保护账户安全</Text>
          </div>
          <Button type="primary" icon={<SafetyOutlined />} onClick={() => setPasswordModalVisible(true)}>
            修改密码
          </Button>
        </div>
        <Divider style={{ margin: '12px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
          <div>
            <Text strong>绑定邮箱</Text>
            <br />
            <Text type="secondary">{user.email || '未绑定邮箱'}</Text>
          </div>
          <Button icon={<MailOutlined />}>
            {user.email ? '更换邮箱' : '绑定邮箱'}
          </Button>
        </div>
      </Card>

      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onOk={handlePasswordChange}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="oldPassword"
            label="原密码"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password placeholder="请输入原密码" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            rules={[
              { required: true, message: '请确认新密码' },
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
