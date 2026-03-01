import { Card, List, Button, Tag, Empty, Badge, Typography, Space } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useUserStore } from '@/store';
import { useFetch } from '@/hooks';
import type { Notification } from '@/types';

const { Title, Text } = Typography;

const NotificationsPage = () => {
  const { markNotificationRead, markAllNotificationsRead } = useUserStore();

  const { data: notifications } = useFetch<Notification[]>('notifications', '/notifications');

  const handleMarkRead = (id: string) => {
    markNotificationRead(id);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
  };

  const getTypeTag = (type: string) => {
    const typeMap: Record<string, { color: string; label: string }> = {
      system: { color: 'blue', label: '系统' },
      selection: { color: 'green', label: '选课' },
      audit: { color: 'orange', label: '审核' },
      reminder: { color: 'purple', label: '提醒' },
    };
    const config = typeMap[type] || { color: 'default', label: type };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}><BellOutlined style={{ marginRight: 8 }} />消息通知</Title>
        <Button onClick={handleMarkAllRead}>全部已读</Button>
      </div>
      <Card>
        {!notifications || notifications.length === 0 ? (
          <Empty description="暂无消息" />
        ) : (
          <List itemLayout="horizontal" dataSource={notifications} renderItem={(item) => (
            <List.Item actions={[!item.isRead && <Button key="read" type="link" onClick={() => handleMarkRead(item.id)}>标记已读</Button>].filter(Boolean)} style={{ backgroundColor: item.isRead ? 'transparent' : '#f6ffed', padding: '12px 16px', borderRadius: 4, marginBottom: 8 }}>
              <List.Item.Meta
                avatar={<Badge dot={!item.isRead}><BellOutlined style={{ fontSize: 20, color: item.isRead ? '#999' : '#1890ff' }} /></Badge>}
                title={<Space><Text strong={!item.isRead}>{item.title}</Text>{getTypeTag(item.type)}</Space>}
                description={<div><Text type="secondary">{item.content}</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{new Date(item.createdAt).toLocaleString()}</Text></div>}
              />
            </List.Item>
          )} />
        )}
      </Card>
    </div>
  );
};

export default NotificationsPage;
