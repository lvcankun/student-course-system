import { useState } from 'react';
import { Card, Table, Tag, Button, Input, Space, Modal, Form, Select, InputNumber, message, Typography, DatePicker, Popconfirm } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useFetch } from '@/hooks';
import { api } from '@/services/api';
import type { Course, PaginatedResponse } from '@/types';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const AdminCoursesPage = () => {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [form] = Form.useForm();
  const [rejectForm] = Form.useForm();

  const { data, isLoading, refetch } = useFetch<PaginatedResponse<Course>>(
    ['admin-courses', page, pageSize, keyword, category, status],
    '/admin/courses',
    { page, pageSize, keyword, category, status }
  );

  const handleEdit = (course: Course) => {
    setCurrentCourse(course);
    form.setFieldsValue({
      ...course,
      selectionTime: course.selectionStartTime && course.selectionEndTime ? [dayjs(course.selectionStartTime), dayjs(course.selectionEndTime)] : undefined,
    });
    setModalVisible(true);
  };

  const handleAdd = () => {
    setCurrentCourse(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleSave = async () => {
    await form.validateFields();
    message.success(currentCourse ? '课程更新成功' : '课程发布成功');
    setModalVisible(false);
    refetch();
  };

  const handlePublish = async (course: Course) => {
    try {
      await api.put(`/admin/courses/${course.id}/publish`);
      message.success(`课程 ${course.name} 已发布`);
      refetch();
    } catch {
      message.error('发布失败');
    }
  };

  const handleWithdraw = async (course: Course) => {
    try {
      await api.put(`/admin/courses/${course.id}/withdraw`);
      message.success(`课程 ${course.name} 已撤回`);
      refetch();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; data?: { needConfirm?: boolean } } } };
      if (err.response?.data?.data?.needConfirm) {
        Modal.confirm({
          title: '确认撤回',
          content: err.response.data.message,
          okText: '确认撤回',
          okType: 'danger',
          cancelText: '取消',
          onOk: async () => {
            try {
              await api.put(`/admin/courses/${course.id}/withdraw?force=true`);
              message.success(`课程 ${course.name} 已撤回`);
              refetch();
            } catch {
              message.error('撤回失败');
            }
          },
        });
      } else {
        message.error('撤回失败');
      }
    }
  };

  const handleApprove = async (course: Course) => {
    try {
      await api.put(`/admin/courses/${course.id}/approve`);
      message.success(`课程 ${course.name} 审核通过`);
      refetch();
    } catch {
      message.error('审核失败');
    }
  };

  const handleReject = (course: Course) => {
    setCurrentCourse(course);
    rejectForm.resetFields();
    setRejectModalVisible(true);
  };

  const handleSaveReject = async () => {
    try {
      await rejectForm.validateFields();
      const values = rejectForm.getFieldsValue();
      await api.put(`/admin/courses/${currentCourse?.id}/reject`, { reason: values.reason });
      message.success(`课程 ${currentCourse?.name} 审核驳回`);
      setRejectModalVisible(false);
      refetch();
    } catch {
      message.error('驳回失败');
    }
  };

  const handleView = (course: Course) => {
    Modal.info({
      title: course.name,
      width: 600,
      content: (
        <div style={{ marginTop: 16 }}>
          <p><strong>课程编号：</strong>{course.code}</p>
          <p><strong>课程类型：</strong>{getCategoryTag(course.category)}</p>
          <p><strong>授课教师：</strong>{course.teacherName}</p>
          <p><strong>学分：</strong>{course.credit}</p>
          <p><strong>学时：</strong>{course.hours}</p>
          <p><strong>容量：</strong>{course.selectedCount}/{course.capacity}</p>
          <p><strong>状态：</strong>{getStatusTag(course.status)}</p>
          <p><strong>学期：</strong>{course.semester}</p>
          <p><strong>所属院系：</strong>{course.department}</p>
          <p><strong>教学方式：</strong>{course.teachingMethod === 'offline' ? '线下' : course.teachingMethod === 'online' ? '线上' : '混合'}</p>
          {course.timeSlots && course.timeSlots.length > 0 && (
            <div>
              <strong>上课时间：</strong>
              <ul style={{ paddingLeft: 20, marginTop: 8 }}>
                {course.timeSlots.map((slot, index) => (
                  <li key={index}>
                    周{['日', '一', '二', '三', '四', '五', '六'][slot.dayOfWeek]} 第{slot.startPeriod}-{slot.endPeriod}节
                    {slot.location && ` (${slot.location})`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {course.description && <p><strong>课程描述：</strong>{course.description}</p>}
          {course.rejectReason && <p style={{ color: 'red' }}><strong>驳回原因：</strong>{course.rejectReason}</p>}
        </div>
      ),
    });
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
    { title: '课程编号', dataIndex: 'code', key: 'code', width: 100 },
    { title: '课程名称', dataIndex: 'name', key: 'name', width: 180 },
    { title: '类型', dataIndex: 'category', key: 'category', width: 70, render: (category: string) => getCategoryTag(category) },
    { title: '授课教师', dataIndex: 'teacherName', key: 'teacherName', width: 100 },
    { title: '学分', dataIndex: 'credit', key: 'credit', width: 60 },
    { title: '容量', key: 'capacity', width: 90, render: (_: unknown, record: Course) => `${record.selectedCount}/${record.capacity}` },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (status: string) => getStatusTag(status) },
    { title: '学期', dataIndex: 'semester', key: 'semester', width: 100 },
    {
      title: '操作', key: 'action', width: 250,
      render: (_: unknown, record: Course) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>查看</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          {record.status === 'draft' && <Button type="link" size="small" onClick={() => handlePublish(record)}>发布</Button>}
          {record.status === 'published' && <Popconfirm title="确定要撤回该课程吗？" onConfirm={() => handleWithdraw(record)}><Button type="link" size="small" danger>撤回</Button></Popconfirm>}
          {record.status === 'pending' && (
            <>
              <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => handleApprove(record)}>审核通过</Button>
              <Button type="danger" size="small" icon={<CloseCircleOutlined />} onClick={() => handleReject(record)}>审核驳回</Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>课程管理</Title>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Input.Search placeholder="搜索课程名称或编号" allowClear style={{ width: 250 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} prefix={<SearchOutlined />} />
            <Select placeholder="课程类型" allowClear style={{ width: 100 }} value={category || undefined} onChange={setCategory} options={[{ label: '必修', value: 'required' }, { label: '选修', value: 'elective' }, { label: '通识', value: 'general' }]} />
            <Select placeholder="状态" allowClear style={{ width: 120 }} value={status || undefined} onChange={setStatus} options={[
              { label: '草稿', value: 'draft' },
              { label: '待审核', value: 'pending' },
              { label: '已发布', value: 'published' },
              { label: '审核不通过', value: 'rejected' },
              { label: '已结束', value: 'closed' }
            ]} />
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>发布课程</Button>
        </div>
        <Table columns={columns} dataSource={data?.list || []} rowKey="id" loading={isLoading} scroll={{ x: 1200 }} pagination={{ current: page, pageSize, total: data?.total || 0, showSizeChanger: true, showTotal: (total) => `共 ${total} 条`, onChange: (p, ps) => { setPage(p); setPageSize(ps); } }} />
      </Card>
      
      {/* 编辑/发布课程模态框 */}
      <Modal title={currentCourse ? '编辑课程' : '发布课程'} open={modalVisible} onOk={handleSave} onCancel={() => setModalVisible(false)} width={700}>
        <Form form={form} layout="vertical">
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="code" label="课程编号" rules={[{ required: true }]} style={{ width: 300 }}><Input placeholder="课程编号" /></Form.Item>
            <Form.Item name="name" label="课程名称" rules={[{ required: true }]} style={{ width: 300 }}><Input placeholder="课程名称" /></Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="category" label="课程类型" rules={[{ required: true }]} style={{ width: 300 }}><Select placeholder="课程类型" options={[{ label: '必修', value: 'required' }, { label: '选修', value: 'elective' }, { label: '通识', value: 'general' }]} /></Form.Item>
            <Form.Item name="department" label="所属院系" rules={[{ required: true }]} style={{ width: 300 }}><Input placeholder="所属院系" /></Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="credit" label="学分" rules={[{ required: true }]} style={{ width: 145 }}><InputNumber min={1} max={10} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="hours" label="学时" rules={[{ required: true }]} style={{ width: 145 }}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="capacity" label="容量" rules={[{ required: true }]} style={{ width: 145 }}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="teachingMethod" label="授课方式" style={{ width: 145 }}><Select placeholder="授课方式" options={[{ label: '线下', value: 'offline' }, { label: '线上', value: 'online' }, { label: '混合', value: 'hybrid' }]} /></Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="semester" label="学期" rules={[{ required: true }]} style={{ width: 300 }}><Input placeholder="如: 2024-1" /></Form.Item>
            <Form.Item name="teacherId" label="授课教师" rules={[{ required: true }]} style={{ width: 300 }}><Select placeholder="选择授课教师" showSearch options={[{ label: '张教授', value: 'user-teacher-1' }, { label: '李教授', value: 'user-teacher-2' }, { label: '王教授', value: 'user-teacher-3' }]} /></Form.Item>
          </Space>
          <Form.Item name="description" label="课程描述"><Input.TextArea rows={3} placeholder="课程描述" /></Form.Item>
          <Form.Item name="selectionTime" label="选课时间"><RangePicker showTime style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
      
      {/* 审核驳回模态框 */}
      <Modal title={`审核驳回 - ${currentCourse?.name || ''}`} open={rejectModalVisible} onOk={handleSaveReject} onCancel={() => setRejectModalVisible(false)}>
        <Form form={rejectForm} layout="vertical">
          <Form.Item name="reason" label="驳回原因" rules={[{ required: true, message: '请输入驳回原因' }]}>
            <Input.TextArea rows={4} placeholder="请输入驳回原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminCoursesPage;
