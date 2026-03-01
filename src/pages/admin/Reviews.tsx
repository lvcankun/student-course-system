import { useState, useEffect } from 'react';
import { Card, Table, Rate, Tag, Row, Col, Statistic, Select, Typography, Input, Button, Space, Modal, message } from 'antd';
import { StarFilled, CommentOutlined, BookOutlined, SearchOutlined, DeleteOutlined, ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useFetch } from '@/hooks';
import { api } from '@/services';

const { Title } = Typography;
const { Option } = Select;
const { Search } = Input;

interface Review {
  id: string;
  courseId: string;
  courseName: string;
  studentId: string;
  studentName: string;
  rating: number;
  content: string;
  tags: string[];
  createdAt: string;
}

const AdminReviewsPage = () => {
  const [keyword, setKeyword] = useState('');
  const [courseId, setCourseId] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, refetch } = useFetch<{
    list: Review[];
    total: number;
  }>(['admin-reviews', keyword, courseId, page, pageSize], '/admin/reviews', { keyword, courseId, page, pageSize });

  // 页面加载时刷新数据
  useEffect(() => {
    refetch();
  }, []);

  const handleDelete = (reviewId: string) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这条评价吗？此操作不可恢复。',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.delete(`/admin/reviews/${reviewId}`);
          message.success('评价已删除');
          refetch();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const totalReviews = data?.total || 0;
  const avgRating = data?.list?.length
    ? (data.list.reduce((sum, r) => sum + r.rating, 0) / data.list.length).toFixed(1)
    : '0';

  const columns = [
    {
      title: '课程名称',
      dataIndex: 'courseName',
      key: 'courseName',
      width: 150,
    },
    {
      title: '学生姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 100,
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 150,
      render: (rating: number) => <Rate disabled value={rating} style={{ fontSize: 14 }} />,
    },
    {
      title: '评价内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[]) => (
        <>
          {tags?.map((tag) => (
            <Tag key={tag} size="small">{tag}</Tag>
          ))}
        </>
      ),
    },
    {
      title: '评价时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: Review) => (
        <Button 
          type="link" 
          danger 
          size="small" 
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.id)}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>评价管理</Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总评价数"
              value={totalReviews}
              prefix={<CommentOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均评分"
              value={avgRating}
              prefix={<StarFilled style={{ color: '#faad14' }} />}
              suffix="/ 5"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="评价课程数"
              value={new Set(data?.list?.map(r => r.courseId)).size || 0}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="评价学生数"
              value={new Set(data?.list?.map(r => r.studentId)).size || 0}
              prefix={<CommentOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Search
            placeholder="搜索评价内容或学生姓名"
            allowClear
            style={{ width: 250 }}
            onSearch={setKeyword}
          />
          <Select
            placeholder="筛选课程"
            allowClear
            style={{ width: 200 }}
            value={courseId}
            onChange={setCourseId}
          >
            {Array.from(new Set(data?.list?.map(r => r.courseId))).map((id) => {
              const review = data?.list?.find(r => r.courseId === id);
              return (
                <Option key={id} value={id}>
                  {review?.courseName}
                </Option>
              );
            })}
          </Select>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            刷新
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data?.list || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条评价`,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize);
            },
          }}
        />
      </Card>
    </div>
  );
};

export default AdminReviewsPage;
