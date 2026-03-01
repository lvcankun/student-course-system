import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

interface UseFetchOptions {
  enabled?: boolean;
  staleTime?: number;
  retry?: number;
}

export const useFetch = <T>(
  key: string | unknown[],
  url: string,
  params?: Record<string, unknown>,
  options?: UseFetchOptions
) => {
  const queryKey = Array.isArray(key) ? key : [key, params];

  return useQuery<T>({
    queryKey,
    queryFn: () => api.get<T>(url, params),
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
    retry: options?.retry ?? 3,
    enabled: options?.enabled,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useMutate = <T, D>(
  key: string | string[],
  url: string,
  method: 'post' | 'put' | 'delete' = 'post'
) => {
  const queryClient = useQueryClient();
  const queryKey = Array.isArray(key) ? key : [key];

  return useMutation<T, Error, D>({
    mutationFn: (data) => {
      if (method === 'post') {
        return api.post<T>(url, data);
      } else if (method === 'put') {
        return api.put<T>(url, data);
      } else {
        return api.delete<T>(url);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};

export const useInvalidate = (key: string | string[]) => {
  const queryClient = useQueryClient();
  const queryKey = Array.isArray(key) ? key : [key];

  return () => queryClient.invalidateQueries({ queryKey });
};
