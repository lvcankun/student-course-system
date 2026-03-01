import { memo } from 'react';
import { Spin } from 'antd';

interface ContentLoadingProps {
  tip?: string;
}

const ContentLoading = memo(({ tip = '加载中...' }: ContentLoadingProps) => {
  return (
    <div 
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: 400,
        flexDirection: 'column',
        gap: 16
      }}
    >
      <Spin size="large" />
      <span style={{ color: '#666' }}>{tip}</span>
    </div>
  );
});

ContentLoading.displayName = 'ContentLoading';

export default ContentLoading;
