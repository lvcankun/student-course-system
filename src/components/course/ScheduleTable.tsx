import { memo, useMemo } from 'react';
import { Card, Empty, Tag, Tooltip } from 'antd';
import { ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { SelectionRecord, TimeSlot } from '@/types';

interface ScheduleTableProps {
  selections: SelectionRecord[];
  maxPeriod?: number;
}

const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const periodTimes = [
  '08:00-08:45',
  '08:55-09:40',
  '10:00-10:45',
  '10:55-11:40',
  '14:00-14:45',
  '14:55-15:40',
  '16:00-16:45',
  '16:55-17:40',
  '19:00-19:45',
  '19:55-20:40',
];

const COLORS = [
  '#1890ff',
  '#52c41a',
  '#faad14',
  '#eb2f96',
  '#722ed1',
  '#13c2c2',
  '#fa8c16',
  '#2f54eb',
];

const getColorForCourse = (courseId: string): string => {
  if (!courseId) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < courseId.length; i++) {
    hash = courseId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
};

const ScheduleTable = memo(({ selections, maxPeriod = 10 }: ScheduleTableProps) => {
  const scheduleMap = useMemo(() => {
    const map: Map<string, { record: SelectionRecord; slot: TimeSlot; color: string }> = new Map();

    if (!selections || !Array.isArray(selections)) return map;

    selections.forEach((record) => {
      if (!record) return;
      const color = getColorForCourse(record.courseId || record.course_id || '');
      if (record.timeSlots && Array.isArray(record.timeSlots)) {
        record.timeSlots.forEach((slot) => {
          for (let p = slot.startPeriod; p <= Math.min(slot.endPeriod, maxPeriod); p++) {
            const key = `${slot.dayOfWeek}-${p}`;
            if (!map.has(key)) {
              map.set(key, { record, slot, color });
            }
          }
        });
      }
    });

    return map;
  }, [selections, maxPeriod]);

  const renderCell = (day: number, period: number) => {
    const key = `${day}-${period}`;
    const data = scheduleMap.get(key);

    if (!data) {
      return <td key={key} style={{ height: 50, border: '1px solid #f0f0f0' }} />;
    }

    const { record, slot, color } = data;
    const isStart = period === slot.startPeriod;
    const rowSpan = isStart ? slot.endPeriod - slot.startPeriod + 1 : undefined;

    if (!isStart) {
      return null;
    }

    return (
      <td
        key={key}
        rowSpan={rowSpan}
        style={{
          backgroundColor: color,
          color: '#fff',
          padding: 4,
          border: '1px solid #f0f0f0',
          verticalAlign: 'top',
          cursor: 'pointer',
        }}
      >
        <Tooltip
          title={
            <div>
              <div>{record.courseName || record.course_name || record.name || '未知课程'}</div>
              <div>
                <EnvironmentOutlined /> {slot.location}
              </div>
              <div>
                <ClockCircleOutlined /> {record.teacherName || record.teacher_name || ''}
              </div>
            </div>
          }
        >
          <div style={{ fontSize: 12, lineHeight: 1.3 }}>
            <div style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {record.courseName || record.course_name || record.name || '未知课程'}
            </div>
            <div style={{ fontSize: 11, opacity: 0.9 }}>{slot.location}</div>
          </div>
        </Tooltip>
      </td>
    );
  };

  if (!selections || selections.length === 0) {
    return (
      <Card>
        <Empty description="暂无课程安排" />
      </Card>
    );
  }

  return (
    <Card title="课程表" style={{ overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th style={{ width: 60, border: '1px solid #f0f0f0', padding: 8, background: '#fafafa' }}>
              节次
            </th>
            {dayNames.slice(1, 6).map((day) => (
              <th
                key={day}
                style={{ border: '1px solid #f0f0f0', padding: 8, background: '#fafafa' }}
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxPeriod }, (_, i) => i + 1).map((period) => (
            <tr key={period}>
              <td
                style={{
                  width: 60,
                  border: '1px solid #f0f0f0',
                  padding: 4,
                  textAlign: 'center',
                  background: '#fafafa',
                  fontSize: 12,
                }}
              >
                <div>第{period}节</div>
                <div style={{ color: '#999', fontSize: 10 }}>{periodTimes[period - 1]}</div>
              </td>
              {Array.from({ length: 5 }, (_, i) => i + 1).map((day) => renderCell(day, period))}
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {selections.map((s) => (
          <Tag key={s.id} color={getColorForCourse(s.courseId)}>
            {s.courseName}
          </Tag>
        ))}
      </div>
    </Card>
  );
});

ScheduleTable.displayName = 'ScheduleTable';

export default ScheduleTable;
