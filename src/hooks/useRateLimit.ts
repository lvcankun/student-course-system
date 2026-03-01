import { useRef, useCallback } from 'react';

export const useRateLimit = (maxConcurrent: number = 3) => {
  const runningCount = useRef(0);
  const queue = useRef<Array<() => void>>([]);

  const execute = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      if (runningCount.current >= maxConcurrent) {
        await new Promise<void>((resolve) => queue.current.push(resolve));
      }

      runningCount.current++;
      try {
        const result = await fn();
        return result;
      } finally {
        runningCount.current--;
        if (queue.current.length > 0) {
          const next = queue.current.shift();
          next?.();
        }
      }
    },
    [maxConcurrent]
  );

  const getQueueLength = useCallback(() => queue.current.length, []);

  const getRunningCount = useCallback(() => runningCount.current, []);

  return { execute, getQueueLength, getRunningCount };
};
