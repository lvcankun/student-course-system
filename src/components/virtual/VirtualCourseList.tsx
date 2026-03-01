import { memo, useCallback } from 'react';
import { List } from 'react-window';
import { Card, Tag, Button, Progress, Tooltip, Popconfirm } from 'antd';
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  BookOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { Course, SelectionRecord } from '@/types';
import { checkCourseConflict } from '@/utils';

interface VirtualCourseListProps {
  courses: Course[];
  selectedCourses?: SelectionRecord[];
  selectedCourseIds?: Set<string>;
  selectingCourseIds?: Set<string>;
  onSelect?: (courseId: string) => void;
  onCancel?: (courseId: string) => void;
  showActions?: boolean;
}

const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const formatTimeSlot = (slot: { dayOfWeek: number; startPeriod: number; endPeriod: number }): string => {
  return `${dayNames[slot.dayOfWeek]} 第${slot.startPeriod}-${slot.endPeriod}节`;
};

const ITEM_HEIGHT = 220;

interface CourseItemProps {
  course: Course;
  isSelected: boolean;
  isSelecting: boolean;
  conflictResult: { canSelect: boolean; reason?: string };
  onSelect?: (courseId: string) => void;
  onCancel?: (courseId: string) => void;
  showActions: boolean;
}

const CourseItem = memo(({ 
  course, 
  isSelected, 
  isSelecting, 
  conflictResult,
  onSelect, 
  onCancel,
  showActions 
}: CourseItemProps) => {
  const remaining = course.capacity - course.selectedCount;
  const percentage = (course.selectedCount / course.capacity) * 100;
  const isFull = remaining <= 0;

  const handleSelect = () => {
    if (isFull || isSelecting || !conflictResult.canSelect) return;
    onSelect?.(course.id);
  };

  const handleCancel = () => {
    onCancel?.(course.id);
  };

  return (
    <Card
      hoverable
      style={{
        width: '100%',
        border: isSelected ? '2px solid #1890ff' : undefined,
        opacity: isFull && !isSelected ? 0.7 : 1,
        marginBottom: 12,
      }}
      styles={{ body: { padding: 16 } }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <BookOutlined style={{ color: '#1890ff' }} />
              <span style={{ fontSize: 16, fontWeight: 600 }}>{course.name}</span>
            </div>
            <Tag color="blue">{course.code}</Tag>
            <Tag>{course.category}</Tag>
            {isSelected && <Tag color="green">已选</Tag>}
          </div>
          <Tag color={isFull ? 'red' : 'green'}>{course.credit} 学分</Tag>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: '#666', fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserOutlined />
            <span>{course.teacherName}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClockCircleOutlined />
            <span>{course.timeSlots?.map(formatTimeSlot).join('、')}</span>
          </div>
          {course.timeSlots?.[0]?.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <EnvironmentOutlined />
              <span>{course.timeSlots[0].location}</span>
            </div>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: '#999' }}>
              <TeamOutlined /> {course.selectedCount}/{course.capacity}
            </span>
            <span style={{ fontSize: 12, color: isFull ? '#ff4d4f' : '#52c41a' }}>
              {isFull ? '已满' : `余${remaining}个名额`}
            </span>
          </div>
          <Progress
            percent={percentage}
            size="small"
            showInfo={false}
            strokeColor={isFull ? '#ff4d4f' : '#52c41a'}
          />
        </div>

        {showActions && (
          <div style={{ marginTop: 8 }}>
            {isSelected ? (
              <Popconfirm
                title="确定要退选这门课程吗？"
                onConfirm={handleCancel}
                okText="确定"
                cancelText="取消"
              >
                <Button danger block disabled={isSelecting}>
                  退选
                </Button>
              </Popconfirm>
            ) : (
              <Tooltip title={isFull ? '课程已满' : !conflictResult.canSelect ? conflictResult.reason : ''}>
                <Button
                  type="primary"
                  block
                  disabled={isFull || !conflictResult.canSelect}
                  loading={isSelecting}
                  onClick={handleSelect}
                >
                  {isSelecting ? '选课中...' : isFull ? '已满' : !conflictResult.canSelect ? '冲突' : '选课'}
                </Button>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </Card>
  );
});

CourseItem.displayName = 'CourseItem';

interface RowProps {
  courses: Course[];
  selectedCourseIds: Set<string>;
  selectingCourseIds: Set<string>;
  selectedCourses: SelectionRecord[];
  onSelect?: (courseId: string) => void;
  onCancel?: (courseId: string) => void;
  showActions: boolean;
}

const VirtualCourseList = memo(({
  courses,
  selectedCourses = [],
  selectedCourseIds = new Set(),
  selectingCourseIds = new Set(),
  onSelect,
  onCancel,
  showActions = true,
}: VirtualCourseListProps) => {
  const rowComponent = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const course = courses[index];
      const isSelected = selectedCourseIds.has(course.id);
      const isSelecting = selectingCourseIds.has(course.id);
      const conflictResult = isSelected 
        ? { canSelect: true } 
        : checkCourseConflict(course, selectedCourses);

      return (
        <div style={{ ...style, paddingLeft: 8, paddingRight: 8 }}>
          <CourseItem
            course={course}
            isSelected={isSelected}
            isSelecting={isSelecting}
            conflictResult={conflictResult}
            onSelect={onSelect}
            onCancel={onCancel}
            showActions={showActions}
          />
        </div>
      );
    },
    [courses, selectedCourseIds, selectingCourseIds, selectedCourses, onSelect, onCancel, showActions]
  );

  return (
    <List
      style={{ height: 600, width: '100%' }}
      rowCount={courses.length}
      rowHeight={ITEM_HEIGHT}
      overscanCount={5}
      rowComponent={rowComponent}
      rowProps={{}}
    />
  );
});

VirtualCourseList.displayName = 'VirtualCourseList';

export default VirtualCourseList;
