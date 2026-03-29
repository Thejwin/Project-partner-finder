import api from '../config/api';

export const searchUsers = async (params) => {
  const res = await api.get('/users/search', { params });
  return res.data;
};

export const getUserById = async (userId) => {
  const res = await api.get(`/users/${userId}`);
  return res.data;
};
