import { useState } from 'react';
import { Card, Table, Tag, Button, Input, Space, Modal, Form, Select, message, Typography } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useFetch } from '@/hooks';
import type { AuditRecord, PaginatedResponse } from '@/types';

const { Title } = Typography;

const AdminAuditsPage = () => {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [currentAudit, setCurrentAudit] = useState<AuditRecord | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useFetch<PaginatedResponse<AuditRecord>>(
    ['admin-audits', page, pageSize, keyword, status, type],
    '/admin/audits',
    { page, pageSize, keyword, status, type }
  );

  const handleReview = (audit: AuditRecord) => {
    setCurrentAudit(audit);
    form.resetFields();
    setReviewModalVisible(true);
  };

  const handleApprove = async () => {
    await form.validateFields();
    message.success('审核通过');
    setReviewModalVisible(false);
    refetch();
  };

  const handleReject = async () => {
    const values = await form.validateFields();
    if (!values.reviewComment) {
      message.error('驳回时必须填写原因');
      return;
    }
    message.success('已驳回');
    setReviewModalVisible(false);
    refetch();
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      pending: { color: 'orange', label: '待审核' },
      approved: { color: 'green', label: '已通过' },
      rejected: { color: 'red', label: '已驳回' },
    };
    const config = statusMap[status] || { color: 'default', label: status };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const getTypeTag = (type: string) => {
    const typeMap: Record<string, { color: string; label: string }> = {
      selection: { color: 'blue', label: '特殊选课' },
      withdraw: { color: 'orange', label: '退选申请' },
      capacity: { color: 'green', label: '容量调整' },
      course: { color: 'purple', label: '课程修改' },
    };
    const config = typeMap[type] || { color: 'default', label: type };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const columns = [
    { title: '申请人', dataIndex: 'applicantName', key: 'applicantName', width: 100 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100, render: (type: string) => getTypeTag(type) },
    { title: '课程', dataIndex: 'courseName', key: 'courseName', width: 180 },
    { title: '申请原因', dataIndex: 'reason', key: 'reason', width: 200, ellipsis: true },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (status: string) => getStatusTag(status) },
    { title: '申请时间', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: (date: string) => new Date(date).toLocaleString() },
    { title: '操作', key: 'action', width: 120, render: (_: unknown, record: AuditRecord) => record.status === 'pending' ? <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleReview(record)}>审核</Button> : <Button type="link" size="small" onClick={() => handleReview(record)}>查看</Button> },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>审核管理</Title>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Input.Search placeholder="搜索申请人" allowClear style={{ width: 200 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} prefix={<SearchOutlined />} />
            <Select placeholder="类型" allowClear style={{ width: 120 }} value={type || undefined} onChange={setType} options={[{ label: '特殊选课', value: 'selection' }, { label: '退选申请', value: 'withdraw' }, { label: '容量调整', value: 'capacity' }, { label: '课程修改', value: 'course' }]} />
            <Select placeholder="状态" allowClear style={{ width: 100 }} value={status || undefined} onChange={setStatus} options={[{ label: '待审核', value: 'pending' }, { label: '已通过', value: 'approved' }, { label: '已驳回', value: 'rejected' }]} />
          </Space>
        </div>
        <Table columns={columns} dataSource={data?.list || []} rowKey="id" loading={isLoading} pagination={{ current: page, pageSize, total: data?.total || 0, showSizeChanger: true, showTotal: (total) => `共 ${total} 条`, onChange: (p, ps) => { setPage(p); setPageSize(ps); } }} />
      </Card>
      <Modal title="审核详情" open={reviewModalVisible} onCancel={() => setReviewModalVisible(false)} footer={currentAudit?.status === 'pending' ? <Space><Button onClick={() => setReviewModalVisible(false)}>取消</Button><Button danger onClick={handleReject}>驳回</Button><Button type="primary" onClick={handleApprove}>通过</Button></Space> : null}>
        {currentAudit && (
          <div>
            <p><strong>申请人：</strong>{currentAudit.applicantName}</p>
            <p><strong>申请类型：</strong>{getTypeTag(currentAudit.type)}</p>
            <p><strong>相关课程：</strong>{currentAudit.courseName}</p>
            <p><strong>申请原因：</strong>{currentAudit.reason}</p>
            <p><strong>当前状态：</strong>{getStatusTag(currentAudit.status)}</p>
            {currentAudit.status !== 'pending' && <><p><strong>审核人：</strong>{currentAudit.reviewerName}</p><p><strong>审核意见：</strong>{currentAudit.reviewComment || '无'}</p></>}
            {currentAudit.status === 'pending' && <Form form={form} layout="vertical"><Form.Item name="reviewComment" label="审核意见"><Input.TextArea rows={3} placeholder="请输入审核意见（驳回时必填）" /></Form.Item></Form>}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminAuditsPage;
