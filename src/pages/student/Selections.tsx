import { useEffect, useState } from 'react';
import { Card, List, Button, Tag, Empty, Spin, Popconfirm, Space, Statistic, Row, Col, Typography, Modal, Form, Input, Rate, message, Switch } from 'antd';
import { DeleteOutlined, ClockCircleOutlined, BookOutlined, EnvironmentOutlined, StarOutlined, CommentOutlined } from '@ant-design/icons';
import { useSelectionStore, useUserStore } from '@/store';
import { useFetch } from '@/hooks';
import { api } from '@/services';
import type { SelectionRecord } from '@/types';

const { Title } = Typography;
const { TextArea } = Input;

const REVIEW_TAGS = ['讲课清晰', '内容丰富', '难度适中', '作业合理', '实用性强', '推荐'];

const MySelectionsPage = () => {
  const { user } = useUserStore();
  const { selectedCourses, setSelectedCourses, cancelSelection } = useSelectionStore();
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<SelectionRecord | null>(null);
  const [reviewForm] = Form.useForm();
  const [reviewingCourseId, setReviewingCourseId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const { data, isLoading, refetch } = useFetch<SelectionRecord[]>(
    'my-selections',
    '/selection/my'
  );

  useEffect(() => {
    if (data) {
      setSelectedCourses(data);
    }
  }, [data, setSelectedCourses]);

  const handleCancel = async (recordId: string) => {
    await cancelSelection(recordId);
    refetch();
  };

  const handleOpenReview = (course: SelectionRecord) => {
    setCurrentCourse(course);
    reviewForm.resetFields();
    setSelectedTags([]);
    setIsAnonymous(false);
    setReviewModalVisible(true);
  };

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
    reviewForm.setFieldsValue({ tags: selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag] });
  };

  const handleSubmitReview = async () => {
    if (!currentCourse) return;
    
    try {
      const values = await reviewForm.validateFields();
      setReviewingCourseId(currentCourse.courseId);
      await api.post(`/courses/${currentCourse.courseId}/reviews`, { 
        ...values, 
        tags: selectedTags,
        isAnonymous: isAnonymous
      });
      message.success('评价提交成功');
      setReviewModalVisible(false);
      reviewForm.resetFields();
      setSelectedTags([]);
      setIsAnonymous(false);
    } catch (error: any) {
      message.error(error.response?.data?.message || '评价提交失败');
    } finally {
      setReviewingCourseId(null);
    }
  };

  const totalCredits = selectedCourses.reduce((sum, r) => sum + r.credit, 0);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        已选课程
      </Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="已选学分"
              value={totalCredits}
              suffix={`/ ${user?.maxCredits || 30}`}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="已选课程数"
              value={selectedCourses.length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="剩余可选学分"
              value={(user?.maxCredits || 30) - totalCredits}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        {selectedCourses.length === 0 ? (
          <Empty description="暂无已选课程" />
        ) : (
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
            dataSource={selectedCourses}
            renderItem={(item) => (
              <List.Item>
                <Card
                  hoverable
                  style={{ height: '100%' }}
                  styles={{ body: { padding: 16 } }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <Space>
                      <BookOutlined style={{ color: '#1890ff', fontSize: 18 }} />
                      <span style={{ fontSize: 16, fontWeight: 600 }}>{item.courseName}</span>
                    </Space>
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <Tag color="blue">{item.credit} 学分</Tag>
                    <Tag>{item.teacherName}</Tag>
                  </div>

                  <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>
                    <Space direction="vertical" size={4}>
                      {item.timeSlots && item.timeSlots.map((slot, idx) => (
                        <span key={idx}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          周{['日', '一', '二', '三', '四', '五', '六'][slot.dayOfWeek]} 第
                          {slot.startPeriod}-{slot.endPeriod}节
                        </span>
                      ))}
                      {item.timeSlots && item.timeSlots[0]?.location && (
                        <span>
                          <EnvironmentOutlined style={{ marginRight: 4 }} />
                          {item.timeSlots[0].location}
                        </span>
                      )}
                    </Space>
                  </div>

                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                    <Button 
                      type="link" 
                      size="small" 
                      icon={<StarOutlined />}
                      onClick={() => handleOpenReview(item)}
                    >
                      评价
                    </Button>
                    <Popconfirm
                      title="确定要退选这门课程吗？"
                      onConfirm={() => handleCancel(item.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button type="link" danger size="small" icon={<DeleteOutlined />}>
                        退选
                      </Button>
                    </Popconfirm>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CommentOutlined style={{ color: '#1890ff' }} />
            <span>评价课程：{currentCourse?.courseName}</span>
          </div>
        }
        open={reviewModalVisible}
        onOk={handleSubmitReview}
        onCancel={() => {
          setReviewModalVisible(false);
          reviewForm.resetFields();
        }}
        okText="提交评价"
        cancelText="取消"
        confirmLoading={reviewingCourseId !== null}
      >
        <Form form={reviewForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="rating"
            label="课程评分"
            rules={[{ required: true, message: '请选择评分' }]}
          >
            <Rate style={{ fontSize: 28 }} />
          </Form.Item>
          <Form.Item
            name="content"
            label="评价内容"
            rules={[
              { required: true, message: '请输入评价内容' },
              { min: 10, message: '评价内容至少10个字' },
            ]}
          >
            <TextArea rows={4} placeholder="分享您的学习体验，帮助其他同学了解这门课程..." />
          </Form.Item>
          <Form.Item label="课程标签">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {REVIEW_TAGS.map((tag) => (
                <Tag
                  key={tag}
                  style={{ 
                    cursor: 'pointer', 
                    padding: '4px 8px',
                    fontSize: 13
                  }}
                  color={selectedTags.includes(tag) ? 'blue' : 'default'}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </Tag>
              ))}
            </div>
          </Form.Item>
          <Form.Item label="匿名评价">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Switch 
                checked={isAnonymous} 
                onChange={setIsAnonymous}
                checkedChildren="匿名"
                unCheckedChildren="实名"
              />
              <span style={{ color: '#999', fontSize: 12 }}>
                {isAnonymous ? '您的姓名将显示为 ****' : '您的姓名将显示在评价中'}
              </span>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MySelectionsPage;
