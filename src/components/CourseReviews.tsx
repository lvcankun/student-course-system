import { useState } from 'react';
import { Card, List, Rate, Tag, Button, Modal, Form, Input, message, Progress, Row, Col, Typography, Empty } from 'antd';
import { CommentOutlined, UserOutlined, StarFilled } from '@ant-design/icons';
import { useFetch } from '@/hooks';
import { api } from '@/services';
import { useUserStore } from '@/store';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface Review {
  id: string;
  studentId: string;
  studentName: string;
  rating: number;
  content: string;
  tags: string[];
  createdAt: string;
}

interface CourseReviewsProps {
  courseId: string;
  canReview?: boolean;
}

const REVIEW_TAGS = ['讲课清晰', '内容丰富', '难度适中', '作业合理', '实用性强', '推荐'];

const CourseReviews = ({ courseId, canReview = false }: CourseReviewsProps) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { user } = useUserStore();

  const { data, isLoading, refetch } = useFetch<{
    list: Review[];
    total: number;
    avgRating: number;
    ratingStats: { [key: number]: number };
  }>(['course-reviews', courseId], `/courses/${courseId}/reviews`, { page: 1, pageSize: 10 });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await api.post(`/courses/${courseId}/reviews`, values);
      message.success('评价提交成功');
      setIsModalVisible(false);
      form.resetFields();
      refetch();
    } catch (error: any) {
      message.error(error.response?.data?.message || '提交失败');
    }
  };

  const renderRatingStats = () => {
    const stats = data?.ratingStats || {};
    const total = data?.total || 0;
    
    return (
      <div style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, fontWeight: 'bold', color: '#faad14' }}>
                {data?.avgRating || 0}
              </div>
              <Rate disabled value={Math.round(data?.avgRating || 0)} />
              <div style={{ marginTop: 8, color: '#999' }}>
                共 {total} 条评价
              </div>
            </div>
          </Col>
          <Col span={18}>
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ width: 40 }}>{star}星</span>
                <Progress
                  percent={total > 0 ? Math.round((stats[star] || 0) / total * 100) : 0}
                  size="small"
                  style={{ flex: 1, margin: '0 12px' }}
                  showInfo={false}
                  strokeColor="#faad14"
                />
                <span style={{ width: 40, textAlign: 'right' }}>{stats[star] || 0}</span>
              </div>
            ))}
          </Col>
        </Row>
      </div>
    );
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>课程评价</span>
          {canReview && (
            <Button type="primary" icon={<CommentOutlined />} onClick={() => setIsModalVisible(true)}>
              写评价
            </Button>
          )}
        </div>
      }
    >
      {renderRatingStats()}
      
      <List
        loading={isLoading}
        dataSource={data?.list || []}
        locale={{ emptyText: <Empty description="暂无评价" /> }}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              avatar={<div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserOutlined /></div>}
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{item.studentName}</span>
                  <Rate disabled value={item.rating} style={{ fontSize: 14 }} />
                </div>
              }
              description={
                <div>
                  <p>{item.content}</p>
                  <div>
                    {item.tags?.map((tag) => (
                      <Tag key={tag} size="small">{tag}</Tag>
                    ))}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </div>
              }
            />
          </List.Item>
        )}
      />

      <Modal
        title="评价课程"
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        okText="提交"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="rating"
            label="评分"
            rules={[{ required: true, message: '请选择评分' }]}
          >
            <Rate style={{ fontSize: 24 }} />
          </Form.Item>
          <Form.Item
            name="content"
            label="评价内容"
            rules={[
              { required: true, message: '请输入评价内容' },
              { min: 10, message: '评价内容至少10个字' },
            ]}
          >
            <TextArea rows={4} placeholder="分享您的学习体验..." />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <div>
              {REVIEW_TAGS.map((tag) => (
                <Tag
                  key={tag}
                  style={{ cursor: 'pointer', marginBottom: 8 }}
                  onClick={() => {
                    const currentTags = form.getFieldValue('tags') || [];
                    if (currentTags.includes(tag)) {
                      form.setFieldsValue({ tags: currentTags.filter((t: string) => t !== tag) });
                    } else {
                      form.setFieldsValue({ tags: [...currentTags, tag] });
                    }
                  }}
                >
                  {tag}
                </Tag>
              ))}
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default CourseReviews;
