import { memo, useCallback } from 'react';
import { List } from 'react-window';

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  width?: number | string;
}

function VirtualListInner<T>({
  items,
  height,
  itemHeight,
  renderItem,
  width = '100%',
}: VirtualListProps<T>) {
  const rowComponent = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => (
      <div style={style}>{renderItem(items[index], index)}</div>
    ),
    [items, renderItem]
  );

  return (
    <List
      style={{ height, width }}
      rowCount={items.length}
      rowHeight={itemHeight}
      overscanCount={5}
      rowComponent={rowComponent}
      rowProps={{}}
    />
  );
}

const VirtualList = memo(VirtualListInner) as <T>(props: VirtualListProps<T>) => React.ReactElement;

export default VirtualList;
