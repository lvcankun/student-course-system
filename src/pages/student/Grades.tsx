import { useState, useMemo } from 'react';
import { Card, Table, Typography, Select, Space, Tag, Row, Col, Statistic, Empty } from 'antd';
import { TrophyOutlined, BookOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useFetch } from '@/hooks';

const { Title } = Typography;
const { Option } = Select;

interface Grade {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  credit: number;
  semester: string;
  teacherName: string;
  score: number;
  gradeLevel: string;
  gradeType: string;
  status: string;
  remark: string;
  createdAt: string;
}

interface GradeData {
  grades: Grade[];
  stats: {
    totalCourses: number;
    totalCredits: number;
    avgScore: string;
    excellentCount: number;
    failCount: number;
  };
}

const gradeLevelMap: Record<string, { label: string; color: string }> = {
  excellent: { label: '优秀', color: 'green' },
  good: { label: '良好', color: 'blue' },
  medium: { label: '中等', color: 'orange' },
  pass: { label: '及格', color: 'gold' },
  fail: { label: '不及格', color: 'red' },
};

const semesterOptions = ['2024-1', '2024-2', '2023-1', '2023-2'];

const StudentGradesPage = () => {
  const [semester, setSemester] = useState<string>('');
  
  const { data, isLoading } = useFetch<GradeData>(
    ['student-grades', semester],
    '/student/grades',
    { semester },
    { enabled: true }
  );

  const columns = [
    { 
      title: '课程代码', 
      dataIndex: 'courseCode', 
      key: 'courseCode', 
      width: 120 
    },
    { 
      title: '课程名称', 
      dataIndex: 'courseName', 
      key: 'courseName', 
      width: 200 
    },
    { 
      title: '学分', 
      dataIndex: 'credit', 
      key: 'credit', 
      width: 60,
      align: 'center' as const
    },
    { 
      title: '授课教师', 
      dataIndex: 'teacherName', 
      key: 'teacherName', 
      width: 100 
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
      width: 80,
      align: 'center' as const,
      render: (score: number) => (
        <span style={{ fontWeight: 'bold', fontSize: 16, color: score >= 60 ? '#52c41a' : '#ff4d4f' }}>
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
      title: '学期', 
      dataIndex: 'semester', 
      key: 'semester', 
      width: 100 
    },
    { 
      title: '备注', 
      dataIndex: 'remark', 
      key: 'remark', 
      width: 150,
      render: (remark: string) => remark || '-'
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>我的成绩</Title>
      
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card>
          <Space>
            <span>筛选学期：</span>
            <Select
              style={{ width: 150 }}
              placeholder="全部学期"
              value={semester || undefined}
              onChange={setSemester}
              allowClear
            >
              {semesterOptions.map(s => (
                <Option key={s} value={s}>{s}</Option>
              ))}
            </Select>
          </Space>
        </Card>

        {data?.stats && (
          <Row gutter={16}>
            <Col span={4}>
              <Card>
                <Statistic 
                  title="已修课程" 
                  value={data.stats.totalCourses} 
                  prefix={<BookOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic 
                  title="已修学分" 
                  value={data.stats.totalCredits} 
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic 
                  title="平均分" 
                  value={data.stats.avgScore} 
                  precision={1}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic 
                  title="优秀门数" 
                  value={data.stats.excellentCount} 
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic 
                  title="及格门数" 
                  value={data.stats.totalCourses - data.stats.failCount} 
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic 
                  title="不及格门数" 
                  value={data.stats.failCount} 
                  prefix={<CloseCircleOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        <Card title="成绩明细">
          {data?.grades?.length === 0 ? (
            <Empty description="暂无成绩记录" />
          ) : (
            <Table
              columns={columns}
              dataSource={data?.grades || []}
              rowKey="id"
              loading={isLoading}
              pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 门课程` }}
              size="middle"
            />
          )}
        </Card>
      </Space>
    </div>
  );
};

export default StudentGradesPage;
