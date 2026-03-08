import { useState, useMemo, useCallback } from 'react';
import { Card, Table, Button, Space, Typography, Select, InputNumber, Input, Tag, Modal, message, Upload, Radio, Row, Col, Statistic } from 'antd';
import { UploadOutlined, DownloadOutlined, SaveOutlined, SendOutlined, EditOutlined } from '@ant-design/icons';
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
  const [editingStudents, setEditingStudents] = useState<Map<string, GradeStudent>>(new Map());
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
    setEditingStudents(new Map());
  };

  // 判断学生是否可编辑（只有草稿和已驳回状态可编辑）
  const isStudentEditable = (student: GradeStudent) => {
    return student.gradeStatus === 'draft' || student.gradeStatus === 'rejected' || !student.gradeStatus;
  };

  const handleStartEdit = () => {
    if (gradeData?.students) {
      const map = new Map<string, GradeStudent>();
      // 只添加可编辑的学生
      gradeData.students
        .filter(s => isStudentEditable(s))
        .forEach(s => {
          map.set(s.studentId, { ...s });
        });
      setEditingStudents(map);
      setEditMode(true);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditingStudents(new Map());
  };

  const updateStudent = useCallback((studentId: string, updates: Partial<GradeStudent>) => {
    setEditingStudents(prev => {
      const newMap = new Map(prev);
      const student = newMap.get(studentId);
      if (student) {
        newMap.set(studentId, { ...student, ...updates });
      }
      return newMap;
    });
  }, []);

  const handleScoreChange = useCallback((studentId: string, score: number | null) => {
    const newScore = score ?? 0;
    let gradeLevel: 'excellent' | 'good' | 'medium' | 'pass' | 'fail' = 'fail';
    if (newScore >= 90) gradeLevel = 'excellent';
    else if (newScore >= 80) gradeLevel = 'good';
    else if (newScore >= 70) gradeLevel = 'medium';
    else if (newScore >= 60) gradeLevel = 'pass';
    
    updateStudent(studentId, { score: newScore, gradeLevel, gradeType: 'score' });
  }, [updateStudent]);

  const handleGradeLevelChange = useCallback((studentId: string, level: 'excellent' | 'good' | 'medium' | 'pass' | 'fail') => {
    const range = gradeLevelMap[level].range;
    updateStudent(studentId, { score: range[0], gradeLevel: level, gradeType: 'level' });
  }, [updateStudent]);

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

  const handleSaveAll = async () => {
    if (!selectedCourseId) return;
    
    const grades = Array.from(editingStudents.values())
      .filter(s => s.score !== undefined && s.score !== null)
      .map(s => ({
        studentId: s.studentId,
        score: s.score,
        gradeLevel: s.gradeLevel,
        gradeType: s.gradeType,
        remark: s.remark
      }));
    
    if (grades.length === 0) {
      message.warning('没有可保存的成绩');
      return;
    }
    
    setSaving(true);
    try {
      await api.post('/teacher/grades/batch', { courseId: selectedCourseId, grades });
      message.success(`成功保存 ${grades.length} 条成绩`);
      setEditMode(false);
      refetch();
    } catch {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (force = false) => {
    if (!selectedCourseId) return;
    
    setSubmitting(true);
    try {
      const url = force 
        ? `/teacher/grades/submit/${selectedCourseId}?force=true`
        : `/teacher/grades/submit/${selectedCourseId}`;
      await api.post(url);
      message.success('成绩已提交审核');
      setSubmitModalVisible(false);
      refetch();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; data?: { needConfirm?: boolean } } } };
      if (error.response?.data?.data?.needConfirm) {
        Modal.confirm({
          title: '确认提交',
          content: error.response.data.message,
          okText: '确认提交',
          cancelText: '取消',
          onOk: () => handleSubmit(true),
        });
      } else {
        message.error(error.response?.data?.message || '提交失败');
      }
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
          const newMap = new Map<string, GradeStudent>();
          
          lines.forEach(line => {
            if (!line.trim()) return;
            const [studentNumber, , , scoreStr, levelStr, remark] = line.split(',');
            const student = gradeData?.students.find(s => s.studentNumber === studentNumber.trim());
            // 只导入可编辑的学生
            if (student && isStudentEditable(student)) {
              const score = parseFloat(scoreStr) || 0;
              let gradeLevel: 'excellent' | 'good' | 'medium' | 'pass' | 'fail' = 'fail';
              const levelText = levelStr?.trim();
              if (levelText === '优秀') gradeLevel = 'excellent';
              else if (levelText === '良好') gradeLevel = 'good';
              else if (levelText === '中等') gradeLevel = 'medium';
              else if (levelText === '及格') gradeLevel = 'pass';
              
              newMap.set(student.studentId, {
                ...student,
                score,
                gradeLevel,
                gradeType: 'score',
                remark: remark?.trim()
              });
            }
          });
          
          setEditingStudents(newMap);
          setEditMode(true);
          message.success(`成功导入 ${newMap.size} 条成绩`);
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
      width: 120,
      render: (_: unknown, record: GradeStudent) => {
        const editable = isStudentEditable(record);
        const student = editMode && editable ? editingStudents.get(record.studentId) : record;
        const gradeType = student?.gradeType || 'score';
        
        if (editMode && !editable) {
          return <Tag>{gradeType === 'level' ? '等级制' : '百分制'}</Tag>;
        }
        
        if (!editMode) {
          return <Tag>{gradeType === 'level' ? '等级制' : '百分制'}</Tag>;
        }
        
        return (
          <Radio.Group 
            value={gradeType}
            onChange={(e) => updateStudent(record.studentId, { gradeType: e.target.value })}
            size="small"
          >
            <Radio.Button value="score">分数</Radio.Button>
            <Radio.Button value="level">等级</Radio.Button>
          </Radio.Group>
        );
      }
    },
    {
      title: '分数',
      key: 'score',
      width: 100,
      render: (_: unknown, record: GradeStudent) => {
        const editable = isStudentEditable(record);
        const student = editMode && editable ? editingStudents.get(record.studentId) : record;
        const score = student?.score;
        const gradeType = student?.gradeType || 'score';
        
        if (editMode && !editable) {
          return (
            <span style={{ fontWeight: 'bold', color: (score ?? 0) >= 60 ? '#52c41a' : '#ff4d4f' }}>
              {score ?? '-'}
            </span>
          );
        }
        
        if (editMode && editable && gradeType !== 'level') {
          return (
            <InputNumber
              min={0}
              max={100}
              value={score}
              onChange={(v) => handleScoreChange(record.studentId, v)}
              size="small"
            />
          );
        }
        
        return (
          <span style={{ fontWeight: 'bold', color: (score ?? 0) >= 60 ? '#52c41a' : '#ff4d4f' }}>
            {score ?? '-'}
          </span>
        );
      }
    },
    {
      title: '等级',
      key: 'gradeLevel',
      width: 100,
      render: (_: unknown, record: GradeStudent) => {
        const editable = isStudentEditable(record);
        const student = editMode && editable ? editingStudents.get(record.studentId) : record;
        const level = student?.gradeLevel;
        const gradeType = student?.gradeType || 'score';
        
        if (editMode && !editable) {
          return level ? <Tag color={gradeLevelMap[level]?.color}>{gradeLevelMap[level]?.label}</Tag> : '-';
        }
        
        if (editMode && editable && gradeType === 'level') {
          return (
            <Select
              value={level}
              onChange={(v) => handleGradeLevelChange(record.studentId, v)}
              size="small"
              style={{ width: 80 }}
            >
              {Object.entries(gradeLevelMap).map(([key, { label }]) => (
                <Option key={key} value={key}>{label}</Option>
              ))}
            </Select>
          );
        }
        
        return level ? <Tag color={gradeLevelMap[level]?.color}>{gradeLevelMap[level]?.label}</Tag> : '-';
      }
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
      key: 'remark',
      width: 150,
      render: (_: unknown, record: GradeStudent) => {
        const editable = isStudentEditable(record);
        const student = editMode && editable ? editingStudents.get(record.studentId) : record;
        const remark = student?.remark;
        
        if (editMode && !editable) {
          return remark || '-';
        }
        
        if (editMode && editable) {
          return (
            <Input
              value={remark}
              onChange={(e) => updateStudent(record.studentId, { remark: e.target.value })}
              size="small"
              placeholder="备注"
            />
          );
        }
        
        return remark || '-';
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: GradeStudent) => {
        if (!editMode) return null;
        const editable = isStudentEditable(record);
        if (!editable) {
          return <span style={{ color: '#999', fontSize: 12 }}>不可编辑</span>;
        }
        const student = editingStudents.get(record.studentId);
        return (
          <Button 
            type="link" 
            size="small" 
            onClick={() => student && handleSaveSingle(student)}
            disabled={!student?.score}
          >
            保存
          </Button>
        );
      }
    },
  ];

  const statistics = useMemo(() => {
    const students = gradeData?.students || [];
    const total = students.length;
    const gradedStudents = students.filter(s => s.score !== undefined && s.score !== null);
    const graded = gradedStudents.length;
    const excellent = gradedStudents.filter(s => Number(s.score) >= 90).length;
    const good = gradedStudents.filter(s => Number(s.score) >= 80 && Number(s.score) < 90).length;
    const fail = gradedStudents.filter(s => Number(s.score) < 60).length;
    const avgScore = graded > 0 
      ? (gradedStudents.reduce((sum, s) => sum + Number(s.score), 0) / graded).toFixed(1)
      : '-';
    
    return { total, graded, excellent, good, fail, avgScore };
  }, [gradeData?.students]);

  const canSubmit = useMemo(() => {
    if (!gradeData?.students) return false;
    return gradeData.students.some(s => s.gradeStatus === 'draft' || s.gradeStatus === 'rejected');
  }, [gradeData?.students]);

  const hasAllSubmitted = useMemo(() => {
    if (!gradeData?.students) return false;
    return gradeData.students.every(s => 
      s.gradeStatus === 'submitted' || s.gradeStatus === 'approved'
    );
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
            
            {selectedCourseId && !editMode && !hasAllSubmitted && (
              <Button type="primary" icon={<EditOutlined />} onClick={handleStartEdit}>
                {gradeData?.students?.some(s => s.gradeStatus === 'draft' || s.gradeStatus === 'rejected') ? '继续录入' : '开始录入'}
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
            
            {selectedCourseId && !editMode && canSubmit && !hasAllSubmitted && (
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
                dataSource={gradeData?.students || []}
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
