import { useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ReactNode } from 'react';

export const useVirtualList = <T,>(items: T[], itemHeight: number) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  const renderVirtualItems = useCallback(
    (renderItem: (item: T, index: number) => ReactNode) => {
      return virtualItems.map((virtualItem) => {
        const item = items[virtualItem.index];
        return (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(item, virtualItem.index)}
          </div>
        );
      });
    },
    [virtualItems, items]
  );

  return {
    parentRef,
    totalHeight: virtualizer.getTotalSize(),
    renderVirtualItems,
    virtualItems,
  };
};
