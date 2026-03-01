import { Card, Tabs, Form, Input, Button, Switch, Select, message, Divider, Typography } from 'antd';
import { BellOutlined, SafetyOutlined, EyeOutlined, GlobalOutlined } from '@ant-design/icons';
import { useUserStore } from '@/store';
import { useState } from 'react';

const { Title, Text } = Typography;

const SettingsPage = () => {
  const { user } = useUserStore();
  const [notificationForm] = Form.useForm();
  const [displayForm] = Form.useForm();

  const handleSaveNotification = async () => {
    message.success('通知设置已保存');
  };

  const handleSaveDisplay = async () => {
    message.success('显示设置已保存');
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={4}>系统设置</Title>
      <Divider />

      <Tabs
        defaultActiveKey="notification"
        items={[
          {
            key: 'notification',
            label: '通知设置',
            icon: <BellOutlined />,
            children: (
              <Card>
                <Form form={notificationForm} layout="vertical">
                  <Form.Item label="选课提醒" name="courseReminder" valuePropName="checked">
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" defaultChecked />
                  </Form.Item>
                  <Text type="secondary">开启后，选课成功或失败时会收到系统通知</Text>
                  <Divider />

                  <Form.Item label="退课提醒" name="withdrawReminder" valuePropName="checked">
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" defaultChecked />
                  </Form.Item>
                  <Text type="secondary">开启后，退课时会收到系统通知</Text>
                  <Divider />

                  <Form.Item label="审核结果提醒" name="auditReminder" valuePropName="checked">
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" defaultChecked />
                  </Form.Item>
                  <Text type="secondary">开启后，课程审核结果会通过系统通知告知</Text>
                  <Divider />

                  <Form.Item label="邮件通知" name="emailNotification" valuePropName="checked">
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>
                  <Text type="secondary">开启后，重要通知会发送到您的邮箱</Text>
                  <Divider />

                  <Button type="primary" onClick={handleSaveNotification}>
                    保存设置
                  </Button>
                </Form>
              </Card>
            ),
          },
          {
            key: 'display',
            label: '显示设置',
            icon: <EyeOutlined />,
            children: (
              <Card>
                <Form form={displayForm} layout="vertical">
                  <Form.Item label="每页显示数量" name="pageSize">
                    <Select defaultValue={20} style={{ width: 200 }}>
                      <Select.Option value={10}>10条</Select.Option>
                      <Select.Option value={20}>20条</Select.Option>
                      <Select.Option value={50}>50条</Select.Option>
                      <Select.Option value={100}>100条</Select.Option>
                    </Select>
                  </Form.Item>
                  <Text type="secondary">设置列表页面每页显示的数据条数</Text>
                  <Divider />

                  <Form.Item label="主题色" name="theme">
                    <Select defaultValue="default" style={{ width: 200 }}>
                      <Select.Option value="default">默认蓝色</Select.Option>
                      <Select.Option value="green">清新绿色</Select.Option>
                      <Select.Option value="purple">优雅紫色</Select.Option>
                    </Select>
                  </Form.Item>
                  <Text type="secondary">选择您喜欢的主题颜色</Text>
                  <Divider />

                  <Form.Item label="语言" name="language">
                    <Select defaultValue="zh-CN" style={{ width: 200 }}>
                      <Select.Option value="zh-CN">简体中文</Select.Option>
                      <Select.Option value="en-US">English</Select.Option>
                    </Select>
                  </Form.Item>
                  <Text type="secondary">选择系统显示语言</Text>
                  <Divider />

                  <Button type="primary" onClick={handleSaveDisplay}>
                    保存设置
                  </Button>
                </Form>
              </Card>
            ),
          },
          {
            key: 'privacy',
            label: '隐私设置',
            icon: <SafetyOutlined />,
            children: (
              <Card>
                <Form layout="vertical">
                  <Form.Item label="公开个人信息" name="publicProfile" valuePropName="checked">
                    <Switch checkedChildren="公开" unCheckedChildren="隐藏" />
                  </Form.Item>
                  <Text type="secondary">开启后，其他用户可以看到您的基本信息</Text>
                  <Divider />

                  <Form.Item label="公开选课信息" name="publicSelections" valuePropName="checked">
                    <Switch checkedChildren="公开" unCheckedChildren="隐藏" />
                  </Form.Item>
                  <Text type="secondary">开启后，其他用户可以看到您的选课情况</Text>
                  <Divider />

                  <Form.Item label="允许被搜索" name="allowSearch" valuePropName="checked">
                    <Switch checkedChildren="允许" unCheckedChildren="禁止" defaultChecked />
                  </Form.Item>
                  <Text type="secondary">开启后，其他用户可以通过姓名或学号搜索到您</Text>
                  <Divider />

                  <Button type="primary">
                    保存设置
                  </Button>
                </Form>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};

export default SettingsPage;
