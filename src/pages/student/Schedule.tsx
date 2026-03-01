import { useEffect } from 'react';
import { Card, List, Button, Tag, Empty, Spin, Popconfirm, Space, Statistic, Row, Col } from 'antd';
import { DeleteOutlined, ClockCircleOutlined, BookOutlined } from '@ant-design/icons';
import { ScheduleTable } from '@/components/course';
import { useSelectionStore, useUserStore } from '@/store';
import { useFetch } from '@/hooks';
import type { SelectionRecord } from '@/types';

const MySchedulePage = () => {
  const { user } = useUserStore();
  const { selectedCourses, setSelectedCourses, cancelSelection } = useSelectionStore();

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
              title="已选课程"
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

      <ScheduleTable selections={selectedCourses} />

      <Card title="已选课程列表" style={{ marginTop: 24 }}>
        {selectedCourses.length === 0 ? (
          <Empty description="暂无已选课程" />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={selectedCourses}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Popconfirm
                    key="cancel"
                    title="确定要退选这门课程吗？"
                    onConfirm={() => handleCancel(item.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button type="link" danger icon={<DeleteOutlined />}>
                      退选
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={<BookOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                  title={
                    <Space>
                      <span>{item.courseName}</span>
                      <Tag color="blue">{item.credit} 学分</Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      <span>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {item.teacherName}
                      </span>
                      <span>
                        {item.timeSlots && item.timeSlots.map((slot, idx) => (
                          <Tag key={idx}>
                            周{['日', '一', '二', '三', '四', '五', '六'][slot.dayOfWeek]} 第
                            {slot.startPeriod}-{slot.endPeriod}节
                          </Tag>
                        ))}
                      </span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default MySchedulePage;
