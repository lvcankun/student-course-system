import { useCallback } from 'react';
import { message } from 'antd';

export const useOptimisticUpdate = <T>(
  updateFn: (data: T) => Promise<void>,
  onSuccess?: () => void,
  onError?: (error: Error) => void
) => {
  const execute = useCallback(async (data: T, optimisticUpdate?: () => void) => {
    try {
      // 乐观更新
      optimisticUpdate?.();
      
      await updateFn(data);
      onSuccess?.();
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('操作失败'));
      message.error('操作失败，请重试');
    }
  }, [updateFn, onSuccess, onError]);

  return execute;
};