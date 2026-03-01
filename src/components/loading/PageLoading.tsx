import { memo } from 'react';
import { Spin } from 'antd';

interface PageLoadingProps {
  tip?: string;
}

const PageLoading = memo(({ tip = '加载中...' }: PageLoadingProps) => {
  return (
    <div 
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: 16
      }}
    >
      <Spin size="large" />
      <span style={{ color: '#666' }}>{tip}</span>
    </div>
  );
});

PageLoading.displayName = 'PageLoading';

export default PageLoading;
