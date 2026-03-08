import { useState } from 'react';
import { Card, Table, Button, Space, Typography, Select, Tag, message, Modal, Row, Col, Statistic } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useFetch } from '@/hooks';
import { api } from '@/services';

const { Title } = Typography;
const { Option } = Select;

interface Grade {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  credit: number;
  semester: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  className: string;
  score: number;
  gradeLevel: string;
  gradeType: string;
  status: string;
  remark: string;
  createdAt: string;
  submittedAt: string;
}

interface GradeListData {
  list: Grade[];
  total: number;
  page: number;
  pageSize: number;
  statistics: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    draft: number;
  };
}

const gradeLevelMap: Record<string, { label: string; color: string }> = {
  excellent: { label: '优秀', color: 'green' },
  good: { label: '良好', color: 'blue' },
  medium: { label: '中等', color: 'orange' },
  pass: { label: '及格', color: 'gold' },
  fail: { label: '不及格', color: 'red' },
};

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  submitted: { label: '待审核', color: 'processing' },
  approved: { label: '已通过', color: 'success' },
  rejected: { label: '已驳回', color: 'error' },
};

const AdminGradesPage = () => {
  const [status, setStatus] = useState<string>('');
  const [semester, setSemester] = useState<string>('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const { data, isLoading, refetch } = useFetch<GradeListData>(
    ['admin-grades', status, semester, page, pageSize],
    '/admin/grades',
    { status, semester, page, pageSize }
  );

  const handleApprove = async (id: string) => {
    try {
      await api.put(`/admin/grades/${id}/approve`);
      message.success('审核通过');
      refetch();
    } catch {
      message.error('审核失败');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.put(`/admin/grades/${id}/reject`);
      message.success('已驳回');
      refetch();
    } catch {
      message.error('操作失败');
    }
  };

  const handleBatchApprove = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要审核的成绩');
      return;
    }
    
    Modal.confirm({
      title: '批量审核',
      content: `确定要审核通过选中的 ${selectedRowKeys.length} 条成绩吗？`,
      onOk: async () => {
        try {
          await api.put('/admin/grades/batch-approve', { ids: selectedRowKeys });
          message.success('批量审核成功');
          setSelectedRowKeys([]);
          refetch();
        } catch {
          message.error('批量审核失败');
        }
      }
    });
  };

  const handleBatchReject = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要驳回的成绩');
      return;
    }
    
    Modal.confirm({
      title: '批量驳回',
      content: `确定要驳回选中的 ${selectedRowKeys.length} 条成绩吗？驳回后教师可重新修改提交。`,
      okText: '确认驳回',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api.put('/admin/grades/batch-reject', { ids: selectedRowKeys });
          message.success('批量驳回成功');
          setSelectedRowKeys([]);
          refetch();
        } catch {
          message.error('批量驳回失败');
        }
      }
    });
  };

  const columns = [
    { 
      title: '学号', 
      dataIndex: 'studentNumber', 
      key: 'studentNumber', 
      width: 100 
    },
    { 
      title: '姓名', 
      dataIndex: 'studentName', 
      key: 'studentName', 
      width: 80 
    },
    { 
      title: '班级', 
      dataIndex: 'className', 
      key: 'className', 
      width: 100 
    },
    { 
      title: '课程代码', 
      dataIndex: 'courseCode', 
      key: 'courseCode', 
      width: 100 
    },
    { 
      title: '课程名称', 
      dataIndex: 'courseName', 
      key: 'courseName', 
      width: 150 
    },
    { 
      title: '学分', 
      dataIndex: 'credit', 
      key: 'credit', 
      width: 60,
      align: 'center' as const
    },
    { 
      title: '成绩类型', 
      dataIndex: 'gradeType', 
      key: 'gradeType', 
      width: 80,
      render: (type: string) => <Tag>{type === 'level' ? '等级制' : '百分制'}</Tag>
    },
    { 
      title: '分数', 
      dataIndex: 'score', 
      key: 'score', 
      width: 70,
      align: 'center' as const,
      render: (score: number) => (
        <span style={{ fontWeight: 'bold', color: score >= 60 ? '#52c41a' : '#ff4d4f' }}>
          {score}
        </span>
      )
    },
    { 
      title: '等级', 
      dataIndex: 'gradeLevel', 
      key: 'gradeLevel', 
      width: 80,
      render: (level: string) => level ? (
        <Tag color={gradeLevelMap[level]?.color}>{gradeLevelMap[level]?.label}</Tag>
      ) : '-'
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 80,
      render: (status: string) => {
        const s = statusMap[status] || statusMap.draft;
        return <Tag color={s.color}>{s.label}</Tag>;
      }
    },
    { 
      title: '学期', 
      dataIndex: 'semester', 
      key: 'semester', 
      width: 80 
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: Grade) => (
        record.status === 'submitted' ? (
          <Space size="small">
            <Button 
              type="link" 
              size="small" 
              icon={<CheckOutlined />}
              onClick={() => handleApprove(record.id)}
            >
              通过
            </Button>
            <Button 
              type="link" 
              size="small" 
              danger
              icon={<CloseOutlined />}
              onClick={() => handleReject(record.id)}
            >
              驳回
            </Button>
          </Space>
        ) : '-'
      )
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys as string[]),
    getCheckboxProps: (record: Grade) => ({
      disabled: record.status !== 'submitted',
    }),
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
    setSelectedRowKeys([]);
  };

  const handleSemesterChange = (value: string) => {
    setSemester(value);
    setPage(1);
    setSelectedRowKeys([]);
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>成绩管理</Title>
      
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card>
          <Space wrap>
            <span>筛选条件：</span>
            <Select
              style={{ width: 120 }}
              placeholder="审核状态"
              value={status || undefined}
              onChange={handleStatusChange}
              allowClear
            >
              <Option value="submitted">待审核</Option>
              <Option value="approved">已通过</Option>
              <Option value="rejected">已驳回</Option>
              <Option value="draft">草稿</Option>
            </Select>
            <Select
              style={{ width: 120 }}
              placeholder="学期"
              value={semester || undefined}
              onChange={handleSemesterChange}
              allowClear
            >
              <Option value="2024-1">2024-1</Option>
              <Option value="2024-2">2024-2</Option>
              <Option value="2023-1">2023-1</Option>
              <Option value="2023-2">2023-2</Option>
            </Select>
            {selectedRowKeys.length > 0 && (
              <>
                <Button type="primary" icon={<CheckOutlined />} onClick={handleBatchApprove}>
                  批量通过 ({selectedRowKeys.length})
                </Button>
                <Button danger icon={<CloseOutlined />} onClick={handleBatchReject}>
                  批量驳回 ({selectedRowKeys.length})
                </Button>
              </>
            )}
          </Space>
        </Card>

        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic title="总成绩记录" value={data?.statistics?.total || 0} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="待审核" 
                value={data?.statistics?.pending || 0} 
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="已通过" 
                value={data?.statistics?.approved || 0} 
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="已驳回" 
                value={data?.statistics?.rejected || 0} 
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        <Card>
          <Table
            columns={columns}
            dataSource={data?.list || []}
            rowKey="id"
            loading={isLoading}
            rowSelection={rowSelection}
            pagination={{ 
              current: page, 
              pageSize: pageSize, 
              total: data?.total || 0,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
                setSelectedRowKeys([]);
              }
            }}
            size="small"
          />
        </Card>
      </Space>
    </div>
  );
};

export default AdminGradesPage;
