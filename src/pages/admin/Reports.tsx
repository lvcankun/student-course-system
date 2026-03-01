import { useState } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Select, Button, Table, Tabs, Progress, message } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  DownloadOutlined,
  ReloadOutlined,
  TeamOutlined,
  BookOutlined,
  UserOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useFetch } from '@/hooks';
import type { Course, SelectionRecord } from '@/types';

const { RangePicker } = DatePicker;
const { Option } = Select;

// 选课统计报表
const SelectionReport = () => {
  const [semester, setSemester] = useState('2024-1');
  const [department, setDepartment] = useState('');

  const { data: stats, isLoading } = useFetch<{
    totalStudents: number;
    totalCourses: number;
    totalSelections: number;
    completionRate: number;
    byDepartment: { name: string; count: number }[];
    byGrade: { name: string; count: number }[];
    trend: { date: string; count: number }[];
  }>(['selection-report', semester, department], '/admin/reports/selection', { semester, department });

  const columns = [
    { title: '院系', dataIndex: 'name', key: 'name' },
    { title: '选课人数', dataIndex: 'count', key: 'count' },
    { title: '占比', key: 'percent', render: (_: unknown, record: { count: number }) => {
      const total = stats?.totalSelections || 1;
      return <Progress percent={Math.round((record.count / total) * 100)} size="small" />;
    }},
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Select
              value={semester}
              onChange={setSemester}
              style={{ width: '100%' }}
              placeholder="选择学期"
            >
              <Option value="2024-1">2024春季学期</Option>
              <Option value="2024-2">2024秋季学期</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Select
              value={department}
              onChange={setDepartment}
              style={{ width: '100%' }}
              placeholder="选择院系"
              allowClear
            >
              <Option value="计算机学院">计算机学院</Option>
              <Option value="数学学院">数学学院</Option>
              <Option value="物理学院">物理学院</Option>
              <Option value="外语学院">外语学院</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Button type="primary" icon={<ReloadOutlined />}>
              刷新数据
            </Button>
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <Button icon={<DownloadOutlined />}>
              导出报表
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="参与选课学生"
              value={stats?.totalStudents || 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="开设课程数"
              value={stats?.totalCourses || 0}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="选课总人次"
              value={stats?.totalSelections || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="选课完成率"
              value={stats?.completionRate || 0}
              suffix="%"
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="各院系选课分布">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats?.byDepartment || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="name"
                >
                  {(stats?.byDepartment || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="各年级选课分布">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.byGrade || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card title="选课趋势" style={{ marginTop: 16 }}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats?.trend || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#8884d8" name="选课人数" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

// 课程热度分析
const CoursePopularityReport = () => {
  const [semester, setSemester] = useState('2024-1');

  const { data: popularityData } = useFetch<{
    hotCourses: { name: string; selected: number; capacity: number; rate: number }[];
    byCategory: { name: string; count: number }[];
    byTeacher: { name: string; count: number }[];
  }>(['course-popularity', semester], '/admin/reports/course-popularity', { semester });

  const columns = [
    { title: '排名', key: 'index', render: (_: unknown, __: unknown, index: number) => index + 1 },
    { title: '课程名称', dataIndex: 'name', key: 'name' },
    { title: '已选/容量', key: 'count', render: (_: unknown, record: { selected: number; capacity: number }) => 
      `${record.selected}/${record.capacity}` },
    { title: '选课率', dataIndex: 'rate', key: 'rate', render: (rate: number) => 
      <Progress percent={Math.round(rate * 100)} size="small" status={rate >= 1 ? 'success' : 'active'} /> },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Select
          value={semester}
          onChange={setSemester}
          style={{ width: 200 }}
          placeholder="选择学期"
        >
          <Option value="2024-1">2024春季学期</Option>
          <Option value="2024-2">2024秋季学期</Option>
        </Select>
      </Card>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="热门课程TOP10">
            <Table
              dataSource={popularityData?.hotCourses || []}
              columns={columns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="课程类型分布">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={popularityData?.byCategory || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="name"
                  label
                >
                  {(popularityData?.byCategory || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28'][index % 3]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card title="教师授课热度" style={{ marginTop: 16 }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={popularityData?.byTeacher || []} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip />
            <Bar dataKey="count" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

// 教师工作量统计
const TeacherWorkloadReport = () => {
  const [semester, setSemester] = useState('2024-1');

  const { data: workloadData } = useFetch<{
    teachers: { name: string; courseCount: number; studentCount: number; hours: number }[];
    summary: { totalTeachers: number; totalHours: number; avgStudents: number };
  }>(['teacher-workload', semester], '/admin/reports/teacher-workload', { semester });

  const columns = [
    { title: '教师姓名', dataIndex: 'name', key: 'name' },
    { title: '授课门数', dataIndex: 'courseCount', key: 'courseCount' },
    { title: '授课学生', dataIndex: 'studentCount', key: 'studentCount' },
    { title: '总学时', dataIndex: 'hours', key: 'hours' },
    { title: '人均学生', key: 'avg', render: (_: unknown, record: { studentCount: number; courseCount: number }) => 
      record.courseCount > 0 ? Math.round(record.studentCount / record.courseCount) : 0 },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Select
              value={semester}
              onChange={setSemester}
              style={{ width: '100%' }}
              placeholder="选择学期"
            >
              <Option value="2024-1">2024春季学期</Option>
              <Option value="2024-2">2024秋季学期</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Button icon={<DownloadOutlined />}>导出数据</Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="授课教师数" value={workloadData?.summary.totalTeachers || 0} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="总授课学时" value={workloadData?.summary.totalHours || 0} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="平均选课学生" value={workloadData?.summary.avgStudents || 0} />
          </Card>
        </Col>
      </Row>

      <Card title="教师工作量明细">
        <Table
          dataSource={workloadData?.teachers || []}
          columns={columns}
          rowKey="name"
        />
      </Card>
    </div>
  );
};

// 学生学分统计
const StudentCreditReport = () => {
  const [department, setDepartment] = useState('');
  const [grade, setGrade] = useState('');

  const { data: creditData } = useFetch<{
    students: { name: string; studentId: string; completed: number; required: number; progress: number }[];
    summary: { totalStudents: number; completedCount: number; completionRate: number };
    byRange: { range: string; count: number }[];
  }>(['student-credit', department, grade], '/admin/reports/student-credit', { department, grade });

  const columns = [
    { title: '学号', dataIndex: 'studentId', key: 'studentId' },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '已修学分', dataIndex: 'completed', key: 'completed' },
    { title: '要求学分', dataIndex: 'required', key: 'required' },
    { title: '完成进度', dataIndex: 'progress', key: 'progress', render: (progress: number) => 
      <Progress percent={Math.round(progress * 100)} size="small" status={progress >= 1 ? 'success' : 'active'} /> },
    { title: '状态', key: 'status', render: (_: unknown, record: { completed: number; required: number }) => 
      record.completed >= record.required ? 
        <span style={{ color: '#52c41a' }}>已完成</span> : 
        <span style={{ color: '#faad14' }}>进行中</span> },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Select
              value={department}
              onChange={setDepartment}
              style={{ width: '100%' }}
              placeholder="选择院系"
              allowClear
            >
              <Option value="计算机学院">计算机学院</Option>
              <Option value="数学学院">数学学院</Option>
              <Option value="物理学院">物理学院</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Select
              value={grade}
              onChange={setGrade}
              style={{ width: '100%' }}
              placeholder="选择年级"
              allowClear
            >
              <Option value="2021">2021级</Option>
              <Option value="2022">2022级</Option>
              <Option value="2023">2023级</Option>
              <Option value="2024">2024级</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Button icon={<DownloadOutlined />}>导出数据</Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="学生总数" value={creditData?.summary.totalStudents || 0} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="已完成学分" value={creditData?.summary.completedCount || 0} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="完成率" value={creditData?.summary.completionRate || 0} suffix="%" />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="学分完成情况分布">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={creditData?.byRange || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="学生学分明细">
            <Table
              dataSource={creditData?.students || []}
              columns={columns}
              rowKey="studentId"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// 主报表页面
const ReportsPage = () => {
  return (
    <div>
      <Tabs
        defaultActiveKey="selection"
        items={[
          {
            key: 'selection',
            label: '选课统计',
            children: <SelectionReport />,
          },
          {
            key: 'popularity',
            label: '课程热度',
            children: <CoursePopularityReport />,
          },
          {
            key: 'workload',
            label: '教师工作量',
            children: <TeacherWorkloadReport />,
          },
          {
            key: 'credit',
            label: '学分统计',
            children: <StudentCreditReport />,
          },
        ]}
      />
    </div>
  );
};

export default ReportsPage;
