import { useEffect } from 'react';
import { Card, Empty, Spin, Typography } from 'antd';
import { ScheduleTable } from '@/components/course';
import { useSelectionStore } from '@/store';
import { useFetch } from '@/hooks';
import type { SelectionRecord } from '@/types';

const { Title } = Typography;

const TeacherSchedulePage = () => {
  const { selectedCourses, setSelectedCourses } = useSelectionStore();

  const { data, isLoading } = useFetch<SelectionRecord[]>(
    'teacher-schedule',
    '/teacher/schedule'
  );

  useEffect(() => {
    if (data) {
      setSelectedCourses(data);
    }
  }, [data, setSelectedCourses]);

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}><Spin size="large" tip="加载中..." /></div>;
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>授课课表</Title>
      {selectedCourses.length === 0 ? <Card><Empty description="暂无授课安排" /></Card> : <ScheduleTable selections={selectedCourses} />}
    </div>
  );
};

export default TeacherSchedulePage;
