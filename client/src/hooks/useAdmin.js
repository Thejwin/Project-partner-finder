import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as adminService from '../services/admin.service';

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: adminService.getStats,
  });
};

export const useAdminReports = () => {
  return useQuery({
    queryKey: ['adminReports'],
    queryFn: adminService.getReports,
  });
};

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['adminUsers'],
    queryFn: adminService.getAllUsers,
  });
};

export const useAdminProjects = () => {
  return useQuery({
    queryKey: ['adminProjects'],
    queryFn: adminService.getAllProjects,
  });
};

export const useUpdateReportStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => adminService.updateReportStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminReports']);
      queryClient.invalidateQueries(['adminStats']);
    },
  });
};

export const useToggleUserBan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, reason }) => adminService.toggleUserBan(id, action, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminReports']); // User info in reports might need updating
    },
  });
};

export const useAdminDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminReports']);
      queryClient.invalidateQueries(['adminStats']);
      queryClient.invalidateQueries(['projects']);
    },
  });
};

export const usePromoteToAdmin = () => {
  return useMutation({
    mutationFn: adminService.promoteToAdmin,
  });
};
