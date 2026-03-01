import { useState } from 'react';
import { Card, Row, Col, Statistic, Table, Typography, Select, Tag } from 'antd';
import { BookOutlined, TeamOutlined, UserOutlined, BarChartOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useFetch } from '@/hooks';
import type { Statistics, Course } from '@/types';

const { Title } = Typography;

const AdminDashboardPage = () => {
  const [semester, setSemester] = useState('2024-1');

  const { data: stats, isLoading } = useFetch<Statistics>(['admin-stats', semester], '/admin/statistics', { semester });
  const { data: popularCourses } = useFetch<Course[]>(['popular-courses', semester], '/admin/popular-courses', { semester });

  const popularColumns = [
    { title: '排名', key: 'rank', width: 60, render: (_: unknown, __: unknown, index: number) => <Tag color={index < 3 ? 'gold' : 'default'}>{index + 1}</Tag> },
    { title: '课程名称', dataIndex: 'name', key: 'name' },
    { title: '授课教师', dataIndex: 'teacherName', key: 'teacherName' },
    { title: '已选/容量', key: 'rate', render: (_: unknown, record: Course) => `${record.selectedCount}/${record.capacity}` },
    { title: '满课率', key: 'percentage', render: (_: unknown, record: Course) => { const percent = Math.round((record.selectedCount / record.capacity) * 100); return <Tag color={percent >= 90 ? 'green' : percent >= 50 ? 'blue' : 'default'}>{percent}%</Tag>; } },
  ];

  const departmentChartOption = {
    title: { text: '院系选课分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left', top: 'middle' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: stats?.departmentStats?.map(item => ({ value: item.count, name: item.name })) || [],
    }],
  };

  const categoryChartOption = {
    title: { text: '课程类型分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['必修', '选修', '通识'] },
    yAxis: { type: 'value' },
    series: [{
      data: [
        stats?.totalCourses ? Math.round(stats.totalCourses * 0.4) : 0,
        stats?.totalCourses ? Math.round(stats.totalCourses * 0.35) : 0,
        stats?.totalCourses ? Math.round(stats.totalCourses * 0.25) : 0,
      ],
      type: 'bar',
      itemStyle: {
        color: (params: { dataIndex: number }) => {
          const colors = ['#ff4d4f', '#1890ff', '#52c41a'];
          return colors[params.dataIndex];
        },
      },
    }],
  };

  const selectionTrendOption = {
    title: { text: '选课趋势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['第1天', '第2天', '第3天', '第4天', '第5天', '第6天', '第7天'] },
    yAxis: { type: 'value' },
    series: [{
      data: [120, 432, 301, 534, 390, 230, 150],
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.3 },
    }],
  };

  const creditDistributionOption = {
    title: { text: '学分分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['0-10', '10-15', '15-20', '20-25', '25-30'] },
    yAxis: { type: 'value', name: '学生数' },
    series: [{
      data: [5, 15, 35, 30, 15],
      type: 'bar',
      itemStyle: { color: '#1890ff' },
    }],
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>数据概览</Title>
        <Select value={semester} onChange={setSemester} style={{ width: 150 }} options={[{ label: '2024春季学期', value: '2024-1' }, { label: '2024秋季学期', value: '2024-2' }]} />
      </div>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Statistic title="课程总数" value={stats?.totalCourses || 0} prefix={<BookOutlined style={{ color: '#1890ff' }} />} /></Card></Col>
        <Col span={6}><Card><Statistic title="选课记录" value={stats?.totalSelections || 0} prefix={<BarChartOutlined style={{ color: '#52c41a' }} />} /></Card></Col>
        <Col span={6}><Card><Statistic title="学生人数" value={stats?.totalStudents || 0} prefix={<TeamOutlined style={{ color: '#faad14' }} />} /></Card></Col>
        <Col span={6}><Card><Statistic title="教师人数" value={stats?.totalTeachers || 0} prefix={<UserOutlined style={{ color: '#722ed1' }} />} /></Card></Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="选课完成率">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="当前选课率" value={stats?.selectionRate || 0} suffix="%" valueStyle={{ color: stats?.selectionRate && stats.selectionRate > 80 ? '#52c41a' : '#faad14' }} prefix={stats?.selectionRate && stats.selectionRate > 80 ? <RiseOutlined /> : <FallOutlined />} />
              </Col>
              <Col span={12}>
                <Statistic title="平均已选学分" value={stats?.avgCredits || 0} suffix="学分" />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <ReactECharts option={categoryChartOption} style={{ height: 200 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card>
            <ReactECharts option={departmentChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <ReactECharts option={selectionTrendOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card>
            <ReactECharts option={creditDistributionOption} style={{ height: 250 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="热门课程 TOP10">
            <Table columns={popularColumns} dataSource={popularCourses || []} rowKey="id" pagination={false} loading={isLoading} size="small" />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboardPage;
