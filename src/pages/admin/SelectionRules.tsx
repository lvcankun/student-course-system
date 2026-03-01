import { useState } from 'react';
import { Card, Form, Button, DatePicker, InputNumber, Switch, Select, message, Typography, Space, Divider } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { Title } = Typography;

const AdminSelectionRulesPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      await form.validateFields();
      message.success('选课规则配置保存成功');
    } catch {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>选课规则配置</Title>

      <Card>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            semester: '2024-1',
            maxCredits: 30,
            minCredits: 15,
            allowConflict: false,
            allowOverLimit: false,
          }}
        >
          <Form.Item name="semester" label="当前学期" rules={[{ required: true }]}>
            <Select style={{ width: 200 }} options={[
              { label: '2024春季学期', value: '2024-1' },
              { label: '2024秋季学期', value: '2024-2' },
            ]} />
          </Form.Item>

          <Divider>选课时间设置</Divider>

          <Space size="large">
            <Form.Item name="selectionStartTime" label="选课开始时间" rules={[{ required: true }]}>
              <DatePicker showTime style={{ width: 250 }} />
            </Form.Item>
            <Form.Item name="selectionEndTime" label="选课结束时间" rules={[{ required: true }]}>
              <DatePicker showTime style={{ width: 250 }} />
            </Form.Item>
          </Space>

          <Form.Item name="withdrawDeadline" label="退选截止时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: 250 }} />
          </Form.Item>

          <Divider>学分设置</Divider>

          <Space size="large">
            <Form.Item name="minCredits" label="最小选课学分" rules={[{ required: true }]}>
              <InputNumber min={0} max={50} style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="maxCredits" label="最大选课学分" rules={[{ required: true }]}>
              <InputNumber min={0} max={50} style={{ width: 150 }} />
            </Form.Item>
          </Space>

          <Divider>规则设置</Divider>

          <Form.Item name="allowConflict" label="允许时间冲突" valuePropName="checked">
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>

          <Form.Item name="allowOverLimit" label="允许超额选课" valuePropName="checked">
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>

          <Form.Item name="queueEnabled" label="启用排队机制" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>

          <Divider>通知设置</Divider>

          <Form.Item name="notifySelectionStart" label="选课开始提醒" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="开" unCheckedChildren="关" />
          </Form.Item>

          <Form.Item name="notifySelectionEnd" label="选课结束提醒" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="开" unCheckedChildren="关" />
          </Form.Item>

          <Form.Item name="notifyWithdrawDeadline" label="退选截止提醒" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="开" unCheckedChildren="关" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={handleSave}>
              保存配置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AdminSelectionRulesPage;
