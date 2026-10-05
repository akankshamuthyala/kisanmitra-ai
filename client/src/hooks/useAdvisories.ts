import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient.js';
import type { Advisory, PaginatedResult, ChatMessage, ChatReply, Feedback } from '@shared/types.js';
import type {
  AdvisoryInput,
  ListAdvisoriesQuery,
  RegenerateAdvisoryInput,
  FeedbackInput,
} from '@shared/schemas.js';

export function useAdvisories(query: ListAdvisoriesQuery) {
  const queryParams = new URLSearchParams();
  if (query.q) queryParams.set('q', query.q);
  if (query.crop) queryParams.set('crop', query.crop);
  if (query.risk) queryParams.set('risk', query.risk);
  if (query.farm_id) queryParams.set('farm_id', query.farm_id);
  if (query.saved !== undefined) queryParams.set('saved', String(query.saved));
  if (query.page) queryParams.set('page', String(query.page));
  if (query.limit) queryParams.set('limit', String(query.limit));

  return useQuery<PaginatedResult<Advisory>>({
    queryKey: ['advisories', query],
    queryFn: async () => {
      return apiClient.get<PaginatedResult<Advisory>>(`/advisories?${queryParams.toString()}`);
    },
  });
}

export function useAdvisory(id?: string) {
  return useQuery<Advisory & { feedback?: Feedback | null }>({
    queryKey: ['advisories', id],
    queryFn: async () => {
      return apiClient.get<Advisory & { feedback?: Feedback | null }>(`/advisories/${id}`);
    },
    enabled: Boolean(id),
  });
}

export function useCreateAdvisory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ input, photo }: { input: AdvisoryInput; photo?: File | null }) => {
      const formData = new FormData();
      formData.append('payload', JSON.stringify(input));
      if (photo) {
        formData.append('photo', photo);
      }
      return apiClient.postFormData<{ id: string }>('/advisories', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
  });
}

export function useToggleSaveAdvisory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.patch<{ is_saved: boolean }>(`/advisories/${id}`);
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['advisories'] });
      queryClient.invalidateQueries({ queryKey: ['advisories', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
  });
}

export function useDeleteAdvisory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/advisories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
  });
}

export function useRegenerateAdvisory(advisoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RegenerateAdvisoryInput) => {
      return apiClient.post<Advisory>(`/advisories/${advisoryId}/regenerate`, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisories', advisoryId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
  });
}

export function useAdvisoryChat(advisoryId?: string) {
  return useQuery<ChatMessage[]>({
    queryKey: ['advisories', advisoryId, 'chat'],
    queryFn: async () => {
      return apiClient.get<ChatMessage[]>(`/advisories/${advisoryId}/chat`);
    },
    enabled: Boolean(advisoryId),
  });
}

export function useSendChatMessage(advisoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (message: string) => {
      return apiClient.post<ChatReply>(`/advisories/${advisoryId}/chat`, { message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisories', advisoryId, 'chat'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
  });
}

export function useAdvisoryFeedback(advisoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: FeedbackInput) => {
      return apiClient.post<Feedback>(`/advisories/${advisoryId}/feedback`, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisories', advisoryId] });
    },
  });
}
