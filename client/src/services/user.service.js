import api from '../config/api';

export const searchUsers = async (query) => {
  const res = await api.get('/users/search', { params: { q: query } });
  return res.data;
};

export const getUserById = async (userId) => {
  const res = await api.get(`/users/${userId}`);
  return res.data;
};
