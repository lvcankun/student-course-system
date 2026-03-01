import { memo } from 'react';
import { Card, Skeleton } from 'antd';

const CourseCardSkeleton = memo(() => {
  return (
    <Card
      style={{ width: '100%' }}
      styles={{ body: { padding: 16 } }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <Skeleton.Input active size="small" style={{ width: 200, marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Skeleton.Button active size="small" style={{ width: 60 }} />
              <Skeleton.Button active size="small" style={{ width: 60 }} />
            </div>
          </div>
          <Skeleton.Button active size="small" style={{ width: 50 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton.Input active size="small" style={{ width: 120 }} />
          <Skeleton.Input active size="small" style={{ width: 180 }} />
          <Skeleton.Input active size="small" style={{ width: 100 }} />
        </div>
        <Skeleton.Input active size="small" style={{ width: '100%' }} />
        <Skeleton.Button active style={{ width: '100%' }} />
      </div>
    </Card>
  );
});

CourseCardSkeleton.displayName = 'CourseCardSkeleton';

export default CourseCardSkeleton;
