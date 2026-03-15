import api from '../config/api';

export const getTasks = async (projectId, params) => {
  const res = await api.get(`/projects/${projectId}/tasks`, { params });
  return res.data;
};

export const getTaskById = async ({ projectId, taskId }) => {
  const res = await api.get(`/projects/${projectId}/tasks/${taskId}`);
  return res.data;
};

export const createTask = async ({ projectId, ...data }) => {
  const res = await api.post(`/projects/${projectId}/tasks`, data);
  return res.data;
};

export const updateTask = async ({ projectId, taskId, ...data }) => {
  const res = await api.put(`/projects/${projectId}/tasks/${taskId}`, data);
  return res.data;
};

export const updateTaskStatus = async ({ projectId, taskId, status }) => {
  const res = await api.patch(`/projects/${projectId}/tasks/${taskId}/status`, { status });
  return res.data;
};

export const deleteTask = async ({ projectId, taskId }) => {
  const res = await api.delete(`/projects/${projectId}/tasks/${taskId}`);
  return res.data;
};
