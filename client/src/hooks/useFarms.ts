import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient.js';
import type { Farm } from '@shared/types.js';
import type { FarmInput } from '@shared/schemas.js';

export function useFarms() {
  return useQuery<Farm[]>({
    queryKey: ['farms'],
    queryFn: async () => {
      return apiClient.get<Farm[]>('/farms');
    },
  });
}

export function useFarm(id?: string) {
  return useQuery<Farm>({
    queryKey: ['farms', id],
    queryFn: async () => {
      return apiClient.get<Farm>(`/farms/${id}`);
    },
    enabled: Boolean(id),
  });
}

export function useCreateFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: FarmInput) => {
      return apiClient.post<Farm>('/farms', input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
  });
}

export function useUpdateFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<FarmInput> }) => {
      return apiClient.patch<Farm>(`/farms/${id}`, input);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      queryClient.invalidateQueries({ queryKey: ['farms', variables.id] });
    },
  });
}

export function useDeleteFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/farms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      queryClient.invalidateQueries({ queryKey: ['advisories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
  });
}
