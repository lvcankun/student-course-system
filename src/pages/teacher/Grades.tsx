import { useState, useMemo, useCallback } from 'react';
import { Card, Table, Button, Space, Typography, Select, InputNumber, Input, Tag, Modal, message, Upload, Tooltip, Radio, Row, Col, Statistic } from 'antd';
import { UploadOutlined, DownloadOutlined, SaveOutlined, SendOutlined, EditOutlined, FileExcelOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useFetch } from '@/hooks';
import { api } from '@/services';
import type { Course } from '@/types';

const { Title } = Typography;
const { Option } = Select;

interface GradeStudent {
  studentId: string;
  studentNumber: string;
  studentName: string;
  major: string;
  className: string;
  gradeId?: string;
  score?: number;
  gradeLevel?: 'excellent' | 'good' | 'medium' | 'pass' | 'fail';
  gradeType?: 'score' | 'level';
  gradeStatus?: 'draft' | 'submitted' | 'approved' | 'rejected';
  remark?: string;
}

interface GradeData {
  course: {
    id: string;
    name: string;
    code: string;
    semester: string;
    credit: number;
  };
  students: GradeStudent[];
}

const gradeLevelMap: Record<string, { label: string; color: string; range: [number, number] }> = {
  excellent: { label: '优秀', color: 'green', range: [90, 100] },
  good: { label: '良好', color: 'blue', range: [80, 89] },
  medium: { label: '中等', color: 'orange', range: [70, 79] },
  pass: { label: '及格', color: 'gold', range: [60, 69] },
  fail: { label: '不及格', color: 'red', range: [0, 59] },
};

const TeacherGradesPage = () => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [editMode, setEditMode] = useState(false);
  const [editingStudents, setEditingStudents] = useState<GradeStudent[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);

  const { data: coursesData, isLoading: coursesLoading } = useFetch<Course[]>(
    ['teacher-grade-courses'],
    '/teacher/grade-courses'
  );

  const { data: gradeData, isLoading: gradeLoading, refetch } = useFetch<GradeData>(
    ['teacher-grades', selectedCourseId],
    `/teacher/grades/${selectedCourseId}`,
    {},
    { enabled: !!selectedCourseId }
  );

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    setEditMode(false);
    setEditingStudents([]);
  };

  const handleStartEdit = () => {
    if (gradeData?.students) {
      setEditingStudents(gradeData.students.map(s => ({ ...s })));
      setEditMode(true);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditingStudents([]);
  };

  const handleStudentChange = useCallback((studentId: string, field: keyof GradeStudent, value: unknown) => {
    setEditingStudents(prev => 
      prev.map(s => s.studentId === studentId ? { ...s, [field]: value } : s)
    );
  }, []);

  const handleScoreChange = useCallback((studentId: string, score: number | null) => {
    setEditingStudents(prev => 
      prev.map(s => {
        if (s.studentId !== studentId) return s;
        const newScore = score ?? 0;
        let gradeLevel: 'excellent' | 'good' | 'medium' | 'pass' | 'fail' = 'fail';
        if (newScore >= 90) gradeLevel = 'excellent';
        else if (newScore >= 80) gradeLevel = 'good';
        else if (newScore >= 70) gradeLevel = 'medium';
        else if (newScore >= 60) gradeLevel = 'pass';
        return { ...s, score: newScore, gradeLevel, gradeType: 'score' };
      })
    );
  }, []);

  const handleGradeLevelChange = useCallback((studentId: string, level: 'excellent' | 'good' | 'medium' | 'pass' | 'fail') => {
    setEditingStudents(prev => 
      prev.map(s => {
        if (s.studentId !== studentId) return s;
        const range = gradeLevelMap[level].range;
        return { ...s, score: range[0], gradeLevel: level, gradeType: 'level' };
      })
    );
  }, []);

  const handleSaveAll = async () => {
    if (!selectedCourseId) return;
    
    const grades = editingStudents.map(s => ({
      studentId: s.studentId,
      score: s.score,
      gradeLevel: s.gradeLevel,
      gradeType: s.gradeType,
      remark: s.remark
    }));
    
    setSaving(true);
    try {
      await api.post('/teacher/grades/batch', { courseId: selectedCourseId, grades });
      message.success('成绩保存成功');
      setEditMode(false);
      refetch();
    } catch {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCourseId) return;
    
    setSubmitting(true);
    try {
      await api.post(`/teacher/grades/submit/${selectedCourseId}`);
      message.success('成绩已提交审核');
      setSubmitModalVisible(false);
      refetch();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      message.error(error.response?.data?.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportTemplate = () => {
    if (!gradeData?.students) return;
    
    const headers = ['学号', '姓名', '班级', '分数', '等级(优秀/良好/中等/及格/不及格)', '备注'];
    const rows = gradeData.students.map(s => [
      s.studentNumber,
      s.studentName,
      s.className,
      s.score ?? '',
      s.gradeLevel ? gradeLevelMap[s.gradeLevel].label : '',
      s.remark ?? ''
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${gradeData.course.name}_成绩模板.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uploadProps: UploadProps = {
    accept: '.csv',
    showUploadList: false,
    beforeUpload: (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').slice(1);
          const grades: GradeStudent[] = [];
          
          lines.forEach(line => {
            if (!line.trim()) return;
            const [studentNumber, , , scoreStr, levelStr, remark] = line.split(',');
            const student = gradeData?.students.find(s => s.studentNumber === studentNumber.trim());
            if (student) {
              const score = parseFloat(scoreStr) || 0;
              let gradeLevel: 'excellent' | 'good' | 'medium' | 'pass' | 'fail' = 'fail';
              const levelText = levelStr?.trim();
              if (levelText === '优秀') gradeLevel = 'excellent';
              else if (levelText === '良好') gradeLevel = 'good';
              else if (levelText === '中等') gradeLevel = 'medium';
              else if (levelText === '及格') gradeLevel = 'pass';
              
              grades.push({
                ...student,
                score,
                gradeLevel,
                gradeType: 'score',
                remark: remark?.trim()
              });
            }
          });
          
          setEditingStudents(grades);
          setEditMode(true);
          message.success(`成功导入 ${grades.length} 条成绩`);
        } catch {
          message.error('文件解析失败');
        }
      };
      reader.readAsText(file);
      return false;
    }
  };

  const columns = [
    { title: '学号', dataIndex: 'studentNumber', key: 'studentNumber', width: 120 },
    { title: '姓名', dataIndex: 'studentName', key: 'studentName', width: 80 },
    { title: '班级', dataIndex: 'className', key: 'className', width: 120 },
    {
      title: '成绩类型',
      key: 'gradeType',
      width: 100,
      render: (_: unknown, record: GradeStudent) => (
        editMode ? (
          <Radio.Group 
            key={`type-${record.studentId}`}
            value={record.gradeType || 'score'} 
            onChange={(e) => handleStudentChange(record.studentId, 'gradeType', e.target.value)}
            size="small"
          >
            <Radio.Button value="score">分数</Radio.Button>
            <Radio.Button value="level">等级</Radio.Button>
          </Radio.Group>
        ) : (
          <Tag>{record.gradeType === 'level' ? '等级制' : '百分制'}</Tag>
        )
      )
    },
    {
      title: '分数',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (score: number, record: GradeStudent) => (
        editMode && record.gradeType !== 'level' ? (
          <InputNumber
            key={`score-${record.studentId}`}
            min={0}
            max={100}
            value={score}
            onChange={(v) => handleScoreChange(record.studentId, v)}
            size="small"
          />
        ) : (
          <span style={{ fontWeight: 'bold', color: (score ?? 0) >= 60 ? '#52c41a' : '#ff4d4f' }}>
            {score ?? '-'}
          </span>
        )
      )
    },
    {
      title: '等级',
      dataIndex: 'gradeLevel',
      key: 'gradeLevel',
      width: 100,
      render: (level: string, record: GradeStudent) => (
        editMode && record.gradeType === 'level' ? (
          <Select
            key={`level-${record.studentId}`}
            value={level}
            onChange={(v) => handleGradeLevelChange(record.studentId, v)}
            size="small"
            style={{ width: 80 }}
          >
            {Object.entries(gradeLevelMap).map(([key, { label }]) => (
              <Option key={key} value={key}>{label}</Option>
            ))}
          </Select>
        ) : (
          level && <Tag color={gradeLevelMap[level]?.color}>{gradeLevelMap[level]?.label}</Tag>
        )
      )
    },
    {
      title: '状态',
      dataIndex: 'gradeStatus',
      key: 'gradeStatus',
      width: 80,
      render: (status: string) => {
        const statusMap: Record<string, { label: string; color: string }> = {
          draft: { label: '草稿', color: 'default' },
          submitted: { label: '已提交', color: 'processing' },
          approved: { label: '已通过', color: 'success' },
          rejected: { label: '已驳回', color: 'error' },
        };
        const s = statusMap[status] || statusMap.draft;
        return <Tag color={s.color}>{s.label}</Tag>;
      }
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      render: (remark: string, record: GradeStudent) => (
        editMode ? (
          <Input
            key={`remark-${record.studentId}`}
            value={remark}
            onChange={(e) => handleStudentChange(record.studentId, 'remark', e.target.value)}
            size="small"
            placeholder="备注"
          />
        ) : (
          remark || '-'
        )
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: GradeStudent) => (
        editMode && (
          <Button 
            type="link" 
            size="small" 
            onClick={() => handleSaveSingle(record)}
            disabled={record.score === undefined || record.score === null}
          >
            保存
          </Button>
        )
      )
    },
  ];

  const handleSaveSingle = async (student: GradeStudent) => {
    if (!selectedCourseId) return;
    
    try {
      await api.post('/teacher/grades', {
        courseId: selectedCourseId,
        studentId: student.studentId,
        score: student.score,
        gradeLevel: student.gradeLevel,
        gradeType: student.gradeType,
        remark: student.remark
      });
      message.success(`${student.studentName} 成绩保存成功`);
      refetch();
    } catch {
      message.error('保存失败');
    }
  };

  const statistics = useMemo(() => {
    const students = editMode ? editingStudents : gradeData?.students || [];
    const total = students.length;
    const graded = students.filter(s => s.score !== undefined && s.score !== null).length;
    const excellent = students.filter(s => (s.score ?? 0) >= 90).length;
    const good = students.filter(s => (s.score ?? 0) >= 80 && (s.score ?? 0) < 90).length;
    const fail = students.filter(s => (s.score ?? 0) < 60).length;
    const avgScore = graded > 0 
      ? (students.reduce((sum, s) => sum + (s.score ?? 0), 0) / graded).toFixed(1)
      : '-';
    
    return { total, graded, excellent, good, fail, avgScore };
  }, [editMode, editingStudents, gradeData?.students]);

  const canSubmit = useMemo(() => {
    if (!gradeData?.students) return false;
    return gradeData.students.every(s => s.score !== undefined && s.score !== null);
  }, [gradeData?.students]);

  const hasSubmitted = useMemo(() => {
    return gradeData?.students?.some(s => s.gradeStatus === 'submitted' || s.gradeStatus === 'approved');
  }, [gradeData?.students]);

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>成绩录入</Title>
      
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card>
          <Space wrap>
            <span>选择课程：</span>
            <Select
              style={{ width: 300 }}
              placeholder="请选择课程"
              value={selectedCourseId}
              onChange={handleCourseChange}
              loading={coursesLoading}
            >
              {coursesData?.map(course => (
                <Option key={course.id} value={course.id}>
                  {course.name} ({course.code}) - {course.semester}
                </Option>
              ))}
            </Select>
            
            {selectedCourseId && !editMode && !hasSubmitted && (
              <Button type="primary" icon={<EditOutlined />} onClick={handleStartEdit}>
                开始录入
              </Button>
            )}
            
            {editMode && (
              <>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveAll} loading={saving}>
                  保存全部
                </Button>
                <Button onClick={handleCancelEdit}>取消</Button>
              </>
            )}
            
            {selectedCourseId && !editMode && canSubmit && !hasSubmitted && (
              <Button type="primary" icon={<SendOutlined />} onClick={() => setSubmitModalVisible(true)}>
                提交审核
              </Button>
            )}
          </Space>
        </Card>

        {selectedCourseId && gradeData && (
          <>
            <Card size="small">
              <Row gutter={24}>
                <Col span={4}>
                  <Statistic title="学生总数" value={statistics.total} />
                </Col>
                <Col span={4}>
                  <Statistic title="已录入" value={statistics.graded} />
                </Col>
                <Col span={4}>
                  <Statistic title="优秀人数" value={statistics.excellent} valueStyle={{ color: '#52c41a' }} />
                </Col>
                <Col span={4}>
                  <Statistic title="良好人数" value={statistics.good} valueStyle={{ color: '#1890ff' }} />
                </Col>
                <Col span={4}>
                  <Statistic title="不及格人数" value={statistics.fail} valueStyle={{ color: '#ff4d4f' }} />
                </Col>
                <Col span={4}>
                  <Statistic title="平均分" value={statistics.avgScore} />
                </Col>
              </Row>
            </Card>

            <Card 
              title={gradeData.course.name}
              extra={
                editMode && (
                  <Space>
                    <Button icon={<DownloadOutlined />} onClick={handleExportTemplate}>
                      下载模板
                    </Button>
                    <Upload {...uploadProps}>
                      <Button icon={<UploadOutlined />}>批量导入</Button>
                    </Upload>
                  </Space>
                )
              }
            >
              <Table
                columns={columns}
                dataSource={editMode ? editingStudents : gradeData.students}
                rowKey="studentId"
                loading={gradeLoading}
                pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 人` }}
                size="small"
              />
            </Card>
          </>
        )}
      </Space>

      <Modal
        title="提交成绩审核"
        open={submitModalVisible}
        onOk={handleSubmit}
        onCancel={() => setSubmitModalVisible(false)}
        confirmLoading={submitting}
      >
        <p>确定要提交成绩审核吗？</p>
        <p>提交后将无法修改成绩。</p>
      </Modal>
    </div>
  );
};

export default TeacherGradesPage;
