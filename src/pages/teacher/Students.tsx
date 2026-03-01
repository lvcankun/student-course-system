import { useState, useMemo } from 'react';
import { Card, Table, Button, Input, Space, Typography, Modal, Descriptions, Avatar, Collapse, Badge, Empty } from 'antd';
import { SearchOutlined, UserOutlined, EyeOutlined, UserOutlined as UserIcon } from '@ant-design/icons';
import { useFetch } from '@/hooks';
import type { Student, PaginatedResponse, Course } from '@/types';

const { Title } = Typography;
const { Panel } = Collapse;

interface StudentWithCourse extends Student {
  courseName?: string;
  courseId?: string;
  selectedAt?: string;
}

const TeacherStudentsPage = () => {
  const [keyword, setKeyword] = useState('');
  const [courseKeyword, setCourseKeyword] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithCourse | null>(null);
  
  const { data, isLoading } = useFetch<PaginatedResponse<StudentWithCourse>>(
    ['teacher-students', 1, 100, keyword],
    '/teacher/students',
    { page: 1, pageSize: 100, keyword }
  );
  
  const { data: coursesData } = useFetch<PaginatedResponse<Course>>(
    ['teacher-courses', 1, 100, ''],
    '/teacher/courses',
    { page: 1, pageSize: 100, keyword: '' }
  );

  const columns = [
    { title: '学号', dataIndex: 'studentNumber', key: 'studentNumber', width: 120 },
    { 
      title: '姓名', 
      dataIndex: 'name', 
      key: 'name', 
      width: 100, 
      render: (name: string) => <Space><Avatar size="small" icon={<UserOutlined />} />{name}</Space> 
    },
    { title: '专业', dataIndex: 'major', key: 'major', width: 150 },
    { title: '年级', dataIndex: 'grade', key: 'grade', width: 80 },
    { title: '班级', dataIndex: 'className', key: 'className', width: 100 },
    { 
      title: '选课时间', 
      dataIndex: 'selectedAt', 
      key: 'selectedAt', 
      width: 150,
      render: (date: string) => date ? new Date(date).toLocaleString() : '-'
    },
    { 
      title: '操作', 
      key: 'action', 
      width: 80, 
      render: (_: unknown, record: StudentWithCourse) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setSelectedStudent(record)}>详情</Button>
      ) 
    },
  ];

  const studentsByCourse = useMemo(() => {
    if (!data?.list) return {};
    
    const grouped: Record<string, StudentWithCourse[]> = {};
    data.list.forEach(student => {
      const courseName = student.courseName || '未知课程';
      if (!grouped[courseName]) {
        grouped[courseName] = [];
      }
      grouped[courseName].push(student);
    });
    
    return grouped;
  }, [data?.list]);

  const filteredCourses = useMemo(() => {
    if (!courseKeyword) return Object.entries(studentsByCourse);
    
    return Object.entries(studentsByCourse).filter(([courseName]) => 
      courseName.toLowerCase().includes(courseKeyword.toLowerCase())
    );
  }, [studentsByCourse, courseKeyword]);

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>选课学生</Title>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card>
          <Space style={{ marginBottom: 16 }}>
            <Input.Search 
              placeholder="搜索学号或姓名" 
              allowClear 
              style={{ width: 200 }} 
              value={keyword} 
              onChange={(e) => setKeyword(e.target.value)} 
              prefix={<SearchOutlined />} 
            />
            <Input.Search 
              placeholder="搜索课程名称" 
              allowClear 
              style={{ width: 200 }} 
              value={courseKeyword} 
              onChange={(e) => setCourseKeyword(e.target.value)} 
              prefix={<SearchOutlined />} 
            />
          </Space>
        </Card>
        
        {filteredCourses.length === 0 ? (
          <Card>
            <Empty description="暂无选课学生数据" />
          </Card>
        ) : (
          <Collapse defaultActiveKey={filteredCourses.map(([name]) => name)}>
            {filteredCourses.map(([courseName, students]) => (
              <Panel
                key={courseName}
                header={
                  <Space>
                    <span style={{ fontWeight: 'bold' }}>{courseName}</span>
                    <Badge count={students.length} style={{ backgroundColor: '#52c41a' }} />
                  </Space>
                }
              >
                <Table 
                  columns={columns} 
                  dataSource={students} 
                  rowKey="selectionId" 
                  loading={isLoading} 
                  pagination={false}
                  size="small"
                />
              </Panel>
            ))}
          </Collapse>
        )}
        
        <Modal title="学生详情" open={!!selectedStudent} onCancel={() => setSelectedStudent(null)} footer={null}>
          {selectedStudent && (
            <Descriptions column={2}>
              <Descriptions.Item label="学号">{selectedStudent.studentNumber}</Descriptions.Item>
              <Descriptions.Item label="姓名">{selectedStudent.name}</Descriptions.Item>
              <Descriptions.Item label="院系">{selectedStudent.department}</Descriptions.Item>
              <Descriptions.Item label="专业">{selectedStudent.major}</Descriptions.Item>
              <Descriptions.Item label="年级">{selectedStudent.grade}</Descriptions.Item>
              <Descriptions.Item label="班级">{selectedStudent.className}</Descriptions.Item>
              <Descriptions.Item label="选课课程">{selectedStudent.courseName}</Descriptions.Item>
              <Descriptions.Item label="选课时间">{selectedStudent.selectedAt ? new Date(selectedStudent.selectedAt).toLocaleString() : '-'}</Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </Space>
    </div>
  );
};

export default TeacherStudentsPage;
