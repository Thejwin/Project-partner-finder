import api from '../config/api';

export const register = async (data) => {
  const res = await api.post('/auth/register', data);
  return res.data;
};

export const login = async (data) => {
  const res = await api.post('/auth/login', data);
  return res.data;
};

export const logout = async (refreshToken) => {
  const res = await api.post('/auth/logout', { refreshToken });
  return res.data;
};

export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};
