import { memo } from 'react';
import { Card, Skeleton, Table } from 'antd';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

const TableSkeleton = memo(({ rows = 5, columns = 5 }: TableSkeletonProps) => {
  const dataSource = Array.from({ length: rows }, (_, i) => ({ key: i }));
  const columnsData = Array.from({ length: columns }, (_, i) => ({
    title: <Skeleton.Input active size="small" style={{ width: 80 }} />,
    dataIndex: `col${i}`,
    key: `col${i}`,
    render: () => <Skeleton.Input active size="small" style={{ width: '100%' }} />,
  }));

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Skeleton.Input active style={{ width: 200 }} />
      </div>
      <Table
        dataSource={dataSource}
        columns={columnsData}
        pagination={false}
        size="small"
      />
    </Card>
  );
});

TableSkeleton.displayName = 'TableSkeleton';

export default TableSkeleton;
