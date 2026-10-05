import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient.js';
import type { DiagnosisRecord } from '@shared/types.js';
import type { DiagnoseInput } from '@shared/schemas.js';

export function useDiagnoses() {
  return useQuery<DiagnosisRecord[]>({
    queryKey: ['diagnoses'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: DiagnosisRecord[] }>('/diagnose');
      return res.data;
    },
  });
}

export function useSubmitDiagnosis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ input, image }: { input: DiagnoseInput; image: File }) => {
      const formData = new FormData();
      formData.append('image', image);
      if (input.crop_hint) formData.append('crop_hint', input.crop_hint);
      if (input.notes) formData.append('notes', input.notes);
      if (input.output_language) formData.append('output_language', input.output_language);

      const res = await apiClient.postFormData<{ data: DiagnosisRecord }>('/diagnose', formData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnoses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
  });
}
