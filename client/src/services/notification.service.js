import api from '../config/api';

export const getNotifications = async (params) => {
  const res = await api.get('/notifications', { params });
  return res.data;
};

export const markAllRead = async () => {
  const res = await api.patch('/notifications/read-all');
  return res.data;
};

export const markOneRead = async (id) => {
  const res = await api.patch(`/notifications/${id}/read`);
  return res.data;
};

export const deleteNotification = async (id) => {
  const res = await api.delete(`/notifications/${id}`);
  return res.data;
};
