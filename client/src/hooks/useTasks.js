import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services';

export const useTasks = (projectId, params) => {
  return useQuery({
    queryKey: ['tasks', projectId, params],
    queryFn: () => taskService.getTasks(projectId, params),
    enabled: !!projectId,
  });
};

export const useCreateTask = (projectId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => taskService.createTask({ projectId, ...data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });
};

export const useUpdateTaskStatus = (projectId) => {
  // We don't invalidate here by default because we rely on optimistic updates 
  // or Socket.io events to patch the cache instantly, preventing drag-and-drop flicker.
  return useMutation({
    mutationFn: ({ taskId, status }) => taskService.updateTaskStatus({ projectId, taskId, status }),
  });
};
