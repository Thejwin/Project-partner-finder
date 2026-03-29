import api from '../config/api';

export const getStats = async () => {
  const res = await api.get('/admin/stats');
  return res.data;
};

export const getReports = async () => {
  const res = await api.get('/admin/reports');
  return res.data;
};

export const getAllUsers = async () => {
  const res = await api.get('/admin/users');
  return res.data;
};

export const getAllProjects = async () => {
  const res = await api.get('/admin/projects');
  return res.data;
};

export const updateReportStatus = async (id, status) => {
  const res = await api.patch(`/admin/reports/${id}`, { status });
  return res.data;
};

export const toggleUserBan = async (id, action, reason) => {
  const res = await api.patch(`/admin/users/${id}/ban`, { action, reason });
  return res.data;
};

export const deleteProject = async (id) => {
  const res = await api.delete(`/admin/projects/${id}`);
  return res.data;
};

export const promoteToAdmin = async () => {
  const res = await api.patch('/admin/make-me-admin');
  return res.data;
};
