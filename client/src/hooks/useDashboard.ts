import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient.js';
import type { DashboardStats } from '@shared/types.js';

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      return apiClient.get<DashboardStats>('/dashboard/stats');
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}
