import { useQuery } from '@tanstack/react-query';
import { projectService } from '../services';

export const useActivities = (projectId) => {
  return useQuery({
    queryKey: ['projects', projectId, 'activities'],
    queryFn: () => projectService.getActivities(projectId),
    enabled: !!projectId,
    refetchInterval: 30000, // Refresh activity log every 30 seconds
  });
};
