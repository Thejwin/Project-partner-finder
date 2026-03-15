import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../services';

export const useProjects = (params) => {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => projectService.getProjects(params),
  });
};

export const useMyProjects = (params) => {
  return useQuery({
    queryKey: ['projects', 'me', params],
    queryFn: () => projectService.getMyProjects(params),
  });
};

export const useCollaboratingProjects = (params) => {
  return useQuery({
    queryKey: ['projects', 'collaborating', params],
    queryFn: () => projectService.getCollaboratingProjects(params),
  });
};

export const useProjectDetails = (id) => {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectService.getProjectById(id),
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectService.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useProposals = (projectId) => {
  return useQuery({
    queryKey: ['projects', projectId, 'proposals'],
    queryFn: () => projectService.getProposals(projectId),
    enabled: !!projectId,
  });
};

export const useRespondToProposal = (projectId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => projectService.respondToProposal({ projectId, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'proposals'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
};

export const useAddCollaborator = (projectId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId) => projectService.addCollaborator({ projectId, userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'proposals'] });
    },
  });
};
