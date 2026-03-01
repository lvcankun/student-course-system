import { useState } from 'react';
import { Card, Table, Tag, Button, Input, Select, Typography } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import { useFetch } from '@/hooks';
import type { OperationLog, PaginatedResponse } from '@/types';

const { Title } = Typography;

const AdminLogsPage = () => {
  const [keyword, setKeyword] = useState('');
  const [module, setModule] = useState<string>('');
  const [action, setAction] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useFetch<PaginatedResponse<OperationLog>>(
    ['admin-logs', page, pageSize, keyword, module, action],
    '/admin/logs',
    { page, pageSize, keyword, module, action }
  );

  const getActionTag = (action: string) => {
    const actionMap: Record<string, { color: string; label: string }> = {
      login: { color: 'blue', label: '登录' },
      logout: { color: 'default', label: '登出' },
      select: { color: 'green', label: '选课' },
      withdraw: { color: 'orange', label: '退选' },
      create: { color: 'cyan', label: '创建' },
      update: { color: 'purple', label: '更新' },
      delete: { color: 'red', label: '删除' },
      audit: { color: 'gold', label: '审核' },
    };
    const config = actionMap[action] || { color: 'default', label: action };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const columns = [
    { title: '时间', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: (date: string) => new Date(date).toLocaleString() },
    { title: '操作人', dataIndex: 'userName', key: 'userName', width: 100 },
    { title: '模块', dataIndex: 'module', key: 'module', width: 100 },
    { title: '操作', dataIndex: 'action', key: 'action', width: 80, render: (action: string) => getActionTag(action) },
    { title: '详情', dataIndex: 'detail', key: 'detail', ellipsis: true },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 130 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>操作日志</Title>
        <Button icon={<DownloadOutlined />}>导出日志</Button>
      </div>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
          <Input.Search placeholder="搜索操作人或详情" allowClear style={{ width: 250 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} prefix={<SearchOutlined />} />
          <Select placeholder="模块" allowClear style={{ width: 120 }} value={module || undefined} onChange={setModule} options={[{ label: '用户', value: 'user' }, { label: '课程', value: 'course' }, { label: '选课', value: 'selection' }, { label: '审核', value: 'audit' }, { label: '系统', value: 'system' }]} />
          <Select placeholder="操作类型" allowClear style={{ width: 120 }} value={action || undefined} onChange={setAction} options={[{ label: '登录', value: 'login' }, { label: '登出', value: 'logout' }, { label: '选课', value: 'select' }, { label: '退选', value: 'withdraw' }, { label: '创建', value: 'create' }, { label: '更新', value: 'update' }, { label: '删除', value: 'delete' }, { label: '审核', value: 'audit' }]} />
        </div>
        <Table columns={columns} dataSource={data?.list || []} rowKey="id" loading={isLoading} pagination={{ current: page, pageSize, total: data?.total || 0, showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 条`, onChange: (p, ps) => { setPage(p); setPageSize(ps); } }} />
      </Card>
    </div>
  );
};

export default AdminLogsPage;
