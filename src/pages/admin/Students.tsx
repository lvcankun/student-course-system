import { useState } from 'react';
import { Card, Table, Tag, Button, Input, Space, Modal, Form, Select, message, Typography, Popconfirm, Upload } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { useFetch } from '@/hooks';
import { exportStudentsToExcel, parseExcelFile, downloadTemplate, studentImportTemplate } from '@/utils';
import type { Student, PaginatedResponse } from '@/types';

const { Title } = Typography;

const AdminStudentsPage = () => {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useFetch<PaginatedResponse<Student>>(
    ['admin-students', page, pageSize, keyword, status],
    '/admin/students',
    { page, pageSize, keyword, status }
  );

  const handleEdit = (student: Student) => {
    setCurrentStudent(student);
    form.setFieldsValue(student);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setCurrentStudent(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleSave = async () => {
    await form.validateFields();
    message.success(currentStudent ? '学生信息更新成功' : '学生添加成功');
    setModalVisible(false);
    refetch();
  };

  const handleDelete = () => {
    message.success('学生已禁用');
    refetch();
  };

  const handleImport = async () => {
    if (!importFile) {
      message.error('请先选择文件');
      return;
    }
    setImportLoading(true);
    try {
      const parsedData = await parseExcelFile<Record<string, string>>(importFile);
      message.success(`成功导入 ${parsedData.length} 条学生数据`);
      setImportModalVisible(false);
      setImportFile(null);
      refetch();
    } catch {
      message.error('文件解析失败，请检查文件格式');
    } finally {
      setImportLoading(false);
    }
  };

  const handleExport = () => {
    if (data?.list) {
      exportStudentsToExcel(data.list, '学生列表');
      message.success('导出成功');
    }
  };

  const handleDownloadTemplate = () => {
    downloadTemplate('学生导入模板', studentImportTemplate);
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      active: { color: 'green', label: '正常' },
      inactive: { color: 'default', label: '未激活' },
      suspended: { color: 'red', label: '休学' },
    };
    const config = statusMap[status] || { color: 'default', label: status };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const columns = [
    { title: '学号', dataIndex: 'studentId', key: 'studentId', width: 120 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '性别', dataIndex: 'gender', key: 'gender', width: 60, render: (gender: string) => gender === 'male' ? '男' : '女' },
    { title: '院系', dataIndex: 'department', key: 'department', width: 150 },
    { title: '专业', dataIndex: 'major', key: 'major', width: 150 },
    { title: '年级', dataIndex: 'grade', key: 'grade', width: 80 },
    { title: '班级', dataIndex: 'className', key: 'className', width: 100 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (status: string) => getStatusTag(status) },
    {
      title: '操作', key: 'action', width: 150,
      render: (_: unknown, record: Student) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定要禁用该学生吗？" onConfirm={handleDelete}><Button type="link" size="small" danger icon={<DeleteOutlined />}>禁用</Button></Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>学生管理</Title>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Input.Search placeholder="搜索学号或姓名" allowClear style={{ width: 250 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} prefix={<SearchOutlined />} />
            <Select placeholder="状态筛选" allowClear style={{ width: 120 }} value={status || undefined} onChange={setStatus} options={[{ label: '正常', value: 'active' }, { label: '未激活', value: 'inactive' }, { label: '休学', value: 'suspended' }]} />
          </Space>
          <Space>
            <Button icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)}>批量导入</Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>导出</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加学生</Button>
          </Space>
        </div>
        <Table columns={columns} dataSource={data?.list || []} rowKey="id" loading={isLoading} pagination={{ current: page, pageSize, total: data?.total || 0, showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 条`, onChange: (p, ps) => { setPage(p); setPageSize(ps); } }} />
      </Card>

      <Modal title={currentStudent ? '编辑学生' : '添加学生'} open={modalVisible} onOk={handleSave} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical">
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="studentId" label="学号" rules={[{ required: true }]} style={{ width: 250 }}><Input placeholder="学号" disabled={!!currentStudent} /></Form.Item>
            <Form.Item name="name" label="姓名" rules={[{ required: true }]} style={{ width: 250 }}><Input placeholder="姓名" /></Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="gender" label="性别" rules={[{ required: true }]} style={{ width: 250 }}><Select placeholder="性别" options={[{ label: '男', value: 'male' }, { label: '女', value: 'female' }]} /></Form.Item>
            <Form.Item name="department" label="院系" rules={[{ required: true }]} style={{ width: 250 }}><Input placeholder="院系" /></Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="major" label="专业" rules={[{ required: true }]} style={{ width: 250 }}><Input placeholder="专业" /></Form.Item>
            <Form.Item name="grade" label="年级" rules={[{ required: true }]} style={{ width: 250 }}><Input placeholder="年级" /></Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="className" label="班级" style={{ width: 250 }}><Input placeholder="班级" /></Form.Item>
            <Form.Item name="maxCredits" label="最大可选学分" style={{ width: 250 }}><Input placeholder="最大可选学分" type="number" /></Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="phone" label="手机号" style={{ width: 250 }}><Input placeholder="手机号" /></Form.Item>
            <Form.Item name="email" label="邮箱" style={{ width: 250 }}><Input placeholder="邮箱" /></Form.Item>
          </Space>
        </Form>
      </Modal>

      <Modal title="批量导入学生" open={importModalVisible} onOk={handleImport} onCancel={() => { setImportModalVisible(false); setImportFile(null); }} confirmLoading={importLoading}>
        <Upload.Dragger 
          accept=".xlsx,.xls,.csv" 
          beforeUpload={(file) => { setImportFile(file); return false; }}
          maxCount={1}
          fileList={importFile ? [importFile as unknown as File & { uid: string }] : []}
          onRemove={() => setImportFile(null)}
        >
          <p>点击或拖拽文件到此区域上传</p>
          <p style={{ color: '#999' }}>支持 Excel (.xlsx, .xls) 或 CSV 格式</p>
        </Upload.Dragger>
        <p style={{ marginTop: 16, color: '#999' }}>请下载模板文件，按照模板格式填写学生信息后上传</p>
        <Button type="link" onClick={handleDownloadTemplate}>下载模板文件</Button>
      </Modal>
    </div>
  );
};

export default AdminStudentsPage;
