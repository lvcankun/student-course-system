import { useState, useEffect } from 'react';
import { Card, Table, Rate, Tag, Row, Col, Statistic, Progress, Select, Typography, Button } from 'antd';
import { StarFilled, CommentOutlined, BookOutlined, ReloadOutlined } from '@ant-design/icons';
import { useFetch } from '@/hooks';
import type { Course } from '@/types';

const { Title } = Typography;
const { Option } = Select;

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

interface CourseStat {
  courseId: string;
  courseName: string;
  reviewCount: number;
  avgRating: number;
}

const TeacherReviewsPage = () => {
  const [selectedCourse, setSelectedCourse] = useState<string>('');

  const { data, isLoading, refetch } = useFetch<{
    list: Review[];
    total: number;
    courseStats: CourseStat[];
  }>(['teacher-reviews', selectedCourse], '/teacher/reviews', { courseId: selectedCourse });

  // 页面加载时刷新数据
  useEffect(() => {
    refetch();
  }, []);

  const totalReviews = data?.total || 0;
  const avgRating = data?.courseStats?.length
    ? (data.courseStats.reduce((sum, c) => sum + parseFloat(c.avgRating), 0) / data.courseStats.length).toFixed(1)
    : '0';

  const columns = [
    {
      title: '课程',
      dataIndex: 'courseName',
      key: 'courseName',
    },
    {
      title: '学生',
      dataIndex: 'studentName',
      key: 'studentName',
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
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
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <Title level={4}>课程评价</Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="总评价数"
              value={totalReviews}
              prefix={<CommentOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="平均评分"
              value={avgRating}
              prefix={<StarFilled style={{ color: '#faad14' }} />}
              suffix="/ 5"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="被评价课程"
              value={data?.courseStats?.length || 0}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="课程评价统计" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          {data?.courseStats?.map((stat) => (
            <Col span={8} key={stat.courseId} style={{ marginBottom: 16 }}>
              <Card size="small">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{stat.courseName}</span>
                  <Rate disabled value={Math.round(parseFloat(stat.avgRating))} style={{ fontSize: 14 }} />
                </div>
                <Progress
                  percent={Math.round(parseFloat(stat.avgRating) * 20)}
                  size="small"
                  status={parseFloat(stat.avgRating) >= 4 ? 'success' : 'active'}
                  format={() => `${stat.avgRating}分 (${stat.reviewCount}条)`}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card
        title="评价详情"
        extra={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              刷新
            </Button>
            <Select
              placeholder="筛选课程"
              allowClear
              style={{ width: 200 }}
              value={selectedCourse}
              onChange={setSelectedCourse}
            >
              {data?.courseStats?.map((stat) => (
                <Option key={stat.courseId} value={stat.courseId}>
                  {stat.courseName}
                </Option>
              ))}
            </Select>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={data?.list || []}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default TeacherReviewsPage;
