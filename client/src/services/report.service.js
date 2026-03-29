import api from '../config/api';

export const submitReport = async (data) => {
  const res = await api.post('/reports', data);
  return res.data;
};
