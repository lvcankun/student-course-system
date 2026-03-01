import { useState } from 'react';
import { Card, Table, Tag, Button, Input, Space, Modal, Form, Select, message, Typography, Popconfirm } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { useFetch } from '@/hooks';
import type { Teacher, PaginatedResponse } from '@/types';

const { Title } = Typography;

const AdminTeachersPage = () => {
  const [keyword, setKeyword] = useState('');
  const [department, setDepartment] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useFetch<PaginatedResponse<Teacher>>(
    ['admin-teachers', page, pageSize, keyword, department],
    '/admin/teachers',
    { page, pageSize, keyword, department }
  );

  const handleEdit = (teacher: Teacher) => {
    setCurrentTeacher(teacher);
    form.setFieldsValue(teacher);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setCurrentTeacher(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleSave = async () => {
    await form.validateFields();
    message.success(currentTeacher ? '教师信息更新成功' : '教师添加成功');
    setModalVisible(false);
    refetch();
  };

  const getStatusTag = (status: string) => status === 'active' ? <Tag color="green">在职</Tag> : <Tag color="default">离职</Tag>;

  const columns = [
    { title: '工号', dataIndex: 'teacherId', key: 'teacherId', width: 100 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '性别', dataIndex: 'gender', key: 'gender', width: 60, render: (gender: string) => gender === 'male' ? '男' : '女' },
    { title: '院系', dataIndex: 'department', key: 'department', width: 150 },
    { title: '职称', dataIndex: 'title', key: 'title', width: 100 },
    { title: '授课数', dataIndex: 'courseCount', key: 'courseCount', width: 80 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (status: string) => getStatusTag(status) },
    {
      title: '操作', key: 'action', width: 150,
      render: (_: unknown, record: Teacher) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定要禁用该教师吗？"><Button type="link" size="small" danger>禁用</Button></Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>教师管理</Title>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Input.Search placeholder="搜索工号或姓名" allowClear style={{ width: 250 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} prefix={<SearchOutlined />} />
            <Select placeholder="院系筛选" allowClear style={{ width: 150 }} value={department || undefined} onChange={setDepartment} options={[{ label: '计算机学院', value: '计算机学院' }, { label: '数学学院', value: '数学学院' }, { label: '物理学院', value: '物理学院' }]} />
          </Space>
          <Space>
            <Button icon={<UploadOutlined />}>批量导入</Button>
            <Button icon={<DownloadOutlined />}>导出</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加教师</Button>
          </Space>
        </div>
        <Table columns={columns} dataSource={data?.list || []} rowKey="id" loading={isLoading} pagination={{ current: page, pageSize, total: data?.total || 0, showSizeChanger: true, showTotal: (total) => `共 ${total} 条`, onChange: (p, ps) => { setPage(p); setPageSize(ps); } }} />
      </Card>
      <Modal title={currentTeacher ? '编辑教师' : '添加教师'} open={modalVisible} onOk={handleSave} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical">
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="teacherId" label="工号" rules={[{ required: true }]} style={{ width: 250 }}><Input placeholder="工号" disabled={!!currentTeacher} /></Form.Item>
            <Form.Item name="name" label="姓名" rules={[{ required: true }]} style={{ width: 250 }}><Input placeholder="姓名" /></Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="gender" label="性别" rules={[{ required: true }]} style={{ width: 250 }}><Select placeholder="性别" options={[{ label: '男', value: 'male' }, { label: '女', value: 'female' }]} /></Form.Item>
            <Form.Item name="department" label="院系" rules={[{ required: true }]} style={{ width: 250 }}><Input placeholder="院系" /></Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="title" label="职称" rules={[{ required: true }]} style={{ width: 250 }}><Select placeholder="职称" options={[{ label: '教授', value: '教授' }, { label: '副教授', value: '副教授' }, { label: '讲师', value: '讲师' }, { label: '助教', value: '助教' }]} /></Form.Item>
            <Form.Item name="phone" label="手机号" style={{ width: 250 }}><Input placeholder="手机号" /></Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminTeachersPage;
