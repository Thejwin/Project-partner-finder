import api from '../config/api';

// Browsing & Search
export const getProjects = async (params) => {
  const res = await api.get('/projects', { params });
  return res.data;
};

export const searchProjects = async (params) => {
  const res = await api.get('/projects/search', { params });
  return res.data;
};

export const getMyProjects = async (params) => {
  const res = await api.get('/projects/me', { params });
  return res.data;
};

export const getCollaboratingProjects = async (params) => {
  const res = await api.get('/projects/collaborating', { params });
  return res.data;
};

// Single project
export const getProjectById = async (id) => {
  const res = await api.get(`/projects/${id}`);
  return res.data;
};

export const createProject = async (data) => {
  const res = await api.post('/projects', data);
  return res.data;
};

export const updateProject = async ({ id, data }) => {
  const res = await api.put(`/projects/${id}`, data);
  return res.data;
};

export const deleteProject = async (id) => {
  const res = await api.delete(`/projects/${id}`);
  return res.data;
};

// Membership
export const applyToProject = async (id) => {
  const res = await api.post(`/projects/${id}/membership/apply`);
  return res.data;
};

export const getProposals = async (id) => {
  const res = await api.get(`/projects/${id}/membership/proposals`);
  return res.data;
};

export const respondToProposal = async ({ projectId, userId, action }) => {
  // action = 'accept' | 'reject'
  const res = await api.patch(`/projects/${projectId}/membership/proposals/${userId}/${action}`);
  return res.data;
};

export const removeCollaborator = async ({ projectId, userId }) => {
  const res = await api.delete(`/projects/${projectId}/membership/collaborators/${userId}`);
  return res.data;
};

export const inviteUser = async ({ projectId, userId }) => {
  const res = await api.post(`/projects/${projectId}/membership/invite/${userId}`);
  return res.data;
};

export const addCollaborator = async ({ projectId, userId }) => {
  const res = await api.post(`/projects/${projectId}/membership/add/${userId}`);
  return res.data;
};
