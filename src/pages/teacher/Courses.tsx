import { useState } from 'react';
import { Card, Table, Tag, Button, Input, Space, Modal, Form, InputNumber, message, Typography, Select, DatePicker } from 'antd';
import { SearchOutlined, EditOutlined, EyeOutlined, PlusOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useFetch } from '@/hooks';
import { teacherApi } from '@/services';
import { useUserStore } from '@/store';
import type { Course, PaginatedResponse } from '@/types';

const { Title } = Typography;
const { Option } = Select;

const TeacherCoursesPage = () => {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const { user } = useUserStore();

  const { data, isLoading, refetch } = useFetch<PaginatedResponse<Course>>(
    ['teacher-courses', page, pageSize, keyword],
    '/teacher/courses',
    { page, pageSize, keyword }
  );

  console.log('TeacherCoursesPage - Data:', data);
  console.log('TeacherCoursesPage - Loading:', isLoading);

  const handleCreate = () => {
    createForm.resetFields();
    setCreateModalVisible(true);
  };

  const handleSaveCreate = async () => {
    try {
      await createForm.validateFields();
      const values = createForm.getFieldsValue();
      // 添加教师信息
      const courseData = {
        ...values,
        teacherId: user?.id,
        teacherName: user?.name,
        status: 'draft',
        selectedCount: 0,
      };
      await teacherApi.createCourse(courseData);
      message.success('课程创建成功');
      setCreateModalVisible(false);
      refetch();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleEdit = (course: Course) => {
    setCurrentCourse(course);
    form.setFieldsValue({
      code: course.code,
      name: course.name,
      credit: course.credit,
      hours: course.hours,
      capacity: course.capacity,
      department: course.department,
      category: course.category,
      semester: course.semester,
      teachingMethod: course.teachingMethod,
      description: course.description,
      timeSlots: course.timeSlots,
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();
      if (currentCourse?.id) {
        await teacherApi.updateCourse(currentCourse.id, values);
        message.success('课程编辑成功');
        setEditModalVisible(false);
        refetch();
      }
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleSubmitReview = async (course: Course) => {
    try {
      await teacherApi.submitCourse(course.id);
      message.success('课程已提交审核');
      refetch();
    } catch (error) {
      message.error('提交失败');
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      draft: { color: 'default', label: '草稿' },
      pending: { color: 'orange', label: '待审核' },
      published: { color: 'green', label: '已发布' },
      rejected: { color: 'red', label: '审核不通过' },
      closed: { color: 'orange', label: '已结束' },
      cancelled: { color: 'red', label: '已取消' },
    };
    const config = statusMap[status] || { color: 'default', label: status };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const getCategoryTag = (category: string) => {
    const categoryMap: Record<string, { color: string; label: string }> = {
      required: { color: 'red', label: '必修' },
      elective: { color: 'blue', label: '选修' },
      general: { color: 'green', label: '通识' },
    };
    const config = categoryMap[category] || { color: 'default', label: category };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const columns = [
    { title: '课程编号', dataIndex: 'code', key: 'code', width: 120 },
    { title: '课程名称', dataIndex: 'name', key: 'name', width: 200 },
    { title: '类型', dataIndex: 'category', key: 'category', width: 80, render: (category: string) => getCategoryTag(category) },
    { title: '学分', dataIndex: 'credit', key: 'credit', width: 60 },
    { title: '容量', key: 'capacity', width: 100, render: (_: unknown, record: Course) => `${record.selectedCount}/${record.capacity}` },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (status: string) => getStatusTag(status) },
    { title: '学期', dataIndex: 'semester', key: 'semester', width: 100 },
    {
      title: '操作', key: 'action', width: 200,
      render: (_: unknown, record: Course) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => Modal.info({ title: record.name, content: record.description || '暂无描述' })}>查看</Button>
          {(record.status === 'draft' || record.status === 'rejected') && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          )}
          {record.status === 'draft' && (
            <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => handleSubmitReview(record)}>提交审核</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>我的课程</Title>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Input.Search placeholder="搜索课程名称或编号" allowClear style={{ width: 300 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} onSearch={() => refetch()} prefix={<SearchOutlined />} />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>创建课程</Button>
        </div>
        <Table columns={columns} dataSource={data?.list || []} rowKey="id" loading={isLoading} pagination={{ current: page, pageSize, total: data?.total || 0, showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 条`, onChange: (p, ps) => { setPage(p); setPageSize(ps); } }} />
      </Card>
      
      {/* 创建课程模态框 */}
      <Modal title="创建课程" open={createModalVisible} onOk={handleSaveCreate} onCancel={() => setCreateModalVisible(false)} width={900}>
        <Form form={createForm} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="code" label="课程编号" rules={[{ required: true, message: '请输入课程编号' }]}>
              <Input placeholder="请输入课程编号" />
            </Form.Item>
            <Form.Item name="name" label="课程名称" rules={[{ required: true, message: '请输入课程名称' }]}>
              <Input placeholder="请输入课程名称" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Form.Item name="credit" label="学分" rules={[{ required: true, message: '请输入学分' }]}>
              <InputNumber min={1} max={10} style={{ width: '100%' }} placeholder="学分" />
            </Form.Item>
            <Form.Item name="hours" label="学时" rules={[{ required: true, message: '请输入学时' }]}>
              <InputNumber min={1} max={200} style={{ width: '100%' }} placeholder="学时" />
            </Form.Item>
            <Form.Item name="capacity" label="课程容量" rules={[{ required: true, message: '请输入容量' }]}>
              <InputNumber min={1} max={500} style={{ width: '100%' }} placeholder="容量" />
            </Form.Item>
          </div>
          
          <Card title="上课时间安排" size="small" style={{ marginBottom: 16 }}>
            <Form.List name="timeSlots" initialValue={[{ dayOfWeek: 1, startPeriod: 1, endPeriod: 2, weekRange: '1-16周', location: '' }]}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
                      <Form.Item {...restField} name={[name, 'dayOfWeek']} label="星期" rules={[{ required: true }]}>
                        <Select placeholder="星期">
                          <Option value={1}>周一</Option>
                          <Option value={2}>周二</Option>
                          <Option value={3}>周三</Option>
                          <Option value={4}>周四</Option>
                          <Option value={5}>周五</Option>
                          <Option value={6}>周六</Option>
                          <Option value={0}>周日</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'startPeriod']} label="开始节次" rules={[{ required: true }]}>
                        <InputNumber min={1} max={12} style={{ width: '100%' }} placeholder="开始" />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'endPeriod']} label="结束节次" rules={[{ required: true }]}>
                        <InputNumber min={1} max={12} style={{ width: '100%' }} placeholder="结束" />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'location']} label="上课地点" rules={[{ required: true, message: '请输入上课地点' }]}>
                        <Input placeholder="如：教学楼1-101" />
                      </Form.Item>
                      {fields.length > 1 && (
                        <Button type="link" danger onClick={() => remove(name)}>删除</Button>
                      )}
                    </div>
                  ))}
                  <Button type="dashed" onClick={() => add({ dayOfWeek: 1, startPeriod: 1, endPeriod: 2, weekRange: '1-16周', location: '' })} block icon={<PlusOutlined />}>
                    添加上课时间
                  </Button>
                </>
              )}
            </Form.List>
          </Card>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="department" label="所属院系" rules={[{ required: true, message: '请选择所属院系' }]}>
              <Select placeholder="请选择所属院系">
                <Option value="计算机学院">计算机学院</Option>
                <Option value="数学学院">数学学院</Option>
                <Option value="物理学院">物理学院</Option>
                <Option value="外语学院">外语学院</Option>
                <Option value="体育部">体育部</Option>
                <Option value="马克思主义学院">马克思主义学院</Option>
              </Select>
            </Form.Item>
            <Form.Item name="category" label="课程类型" rules={[{ required: true, message: '请选择课程类型' }]}>
              <Select placeholder="请选择课程类型">
                <Option value="required">必修</Option>
                <Option value="elective">选修</Option>
                <Option value="general">通识</Option>
              </Select>
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="semester" label="学期" rules={[{ required: true, message: '请选择学期' }]}>
              <Select placeholder="请选择学期">
                <Option value="2024-1">2024春季学期</Option>
                <Option value="2024-2">2024秋季学期</Option>
              </Select>
            </Form.Item>
            <Form.Item name="teachingMethod" label="教学方式" rules={[{ required: true, message: '请选择教学方式' }]}>
              <Select placeholder="请选择教学方式">
                <Option value="offline">线下</Option>
                <Option value="online">线上</Option>
                <Option value="hybrid">混合</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item name="description" label="课程描述">
            <Input.TextArea rows={4} placeholder="请输入课程描述" />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 编辑课程模态框 */}
      <Modal title={`编辑课程 - ${currentCourse?.name || ''}`} open={editModalVisible} onOk={handleSaveEdit} onCancel={() => setEditModalVisible(false)} width={900}>
        <Form form={form} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="code" label="课程编号" rules={[{ required: true, message: '请输入课程编号' }]}>
              <Input placeholder="请输入课程编号" />
            </Form.Item>
            <Form.Item name="name" label="课程名称" rules={[{ required: true, message: '请输入课程名称' }]}>
              <Input placeholder="请输入课程名称" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Form.Item name="credit" label="学分" rules={[{ required: true, message: '请输入学分' }]}>
              <InputNumber min={1} max={10} style={{ width: '100%' }} placeholder="学分" />
            </Form.Item>
            <Form.Item name="hours" label="学时" rules={[{ required: true, message: '请输入学时' }]}>
              <InputNumber min={1} max={200} style={{ width: '100%' }} placeholder="学时" />
            </Form.Item>
            <Form.Item name="capacity" label="课程容量" rules={[{ required: true, message: '请输入容量' }]}>
              <InputNumber min={1} max={500} style={{ width: '100%' }} placeholder="容量" />
            </Form.Item>
          </div>
          
          <Card title="上课时间安排" size="small" style={{ marginBottom: 16 }}>
            <Form.List name="timeSlots">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
                      <Form.Item {...restField} name={[name, 'dayOfWeek']} label="星期" rules={[{ required: true }]}>
                        <Select placeholder="星期">
                          <Option value={1}>周一</Option>
                          <Option value={2}>周二</Option>
                          <Option value={3}>周三</Option>
                          <Option value={4}>周四</Option>
                          <Option value={5}>周五</Option>
                          <Option value={6}>周六</Option>
                          <Option value={0}>周日</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'startPeriod']} label="开始节次" rules={[{ required: true }]}>
                        <InputNumber min={1} max={12} style={{ width: '100%' }} placeholder="开始" />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'endPeriod']} label="结束节次" rules={[{ required: true }]}>
                        <InputNumber min={1} max={12} style={{ width: '100%' }} placeholder="结束" />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'location']} label="上课地点" rules={[{ required: true, message: '请输入上课地点' }]}>
                        <Input placeholder="如：教学楼1-101" />
                      </Form.Item>
                      {fields.length > 1 && (
                        <Button type="link" danger onClick={() => remove(name)}>删除</Button>
                      )}
                    </div>
                  ))}
                  <Button type="dashed" onClick={() => add({ dayOfWeek: 1, startPeriod: 1, endPeriod: 2, weekRange: '1-16周', location: '' })} block icon={<PlusOutlined />}>
                    添加上课时间
                  </Button>
                </>
              )}
            </Form.List>
          </Card>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="department" label="所属院系" rules={[{ required: true, message: '请选择所属院系' }]}>
              <Select placeholder="请选择所属院系">
                <Option value="计算机学院">计算机学院</Option>
                <Option value="数学学院">数学学院</Option>
                <Option value="物理学院">物理学院</Option>
                <Option value="外语学院">外语学院</Option>
                <Option value="体育部">体育部</Option>
                <Option value="马克思主义学院">马克思主义学院</Option>
              </Select>
            </Form.Item>
            <Form.Item name="category" label="课程类型" rules={[{ required: true, message: '请选择课程类型' }]}>
              <Select placeholder="请选择课程类型">
                <Option value="required">必修</Option>
                <Option value="elective">选修</Option>
                <Option value="general">通识</Option>
              </Select>
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="semester" label="学期" rules={[{ required: true, message: '请选择学期' }]}>
              <Select placeholder="请选择学期">
                <Option value="2024-1">2024春季学期</Option>
                <Option value="2024-2">2024秋季学期</Option>
              </Select>
            </Form.Item>
            <Form.Item name="teachingMethod" label="教学方式" rules={[{ required: true, message: '请选择教学方式' }]}>
              <Select placeholder="请选择教学方式">
                <Option value="offline">线下</Option>
                <Option value="online">线上</Option>
                <Option value="hybrid">混合</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item name="description" label="课程描述">
            <Input.TextArea rows={4} placeholder="请输入课程描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TeacherCoursesPage;
