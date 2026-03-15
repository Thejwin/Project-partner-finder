import api from '../config/api';

export const getConversations = async (params) => {
  // Returns list of friendships with recent message snippet & unread count
  const res = await api.get('/messages/conversations', { params });
  return res.data;
};

export const getMessages = async (friendshipId, params) => {
  // Returns paginated message history for a specific conversation
  const res = await api.get(`/messages/conversations/${friendshipId}`, { params });
  return res.data;
};

export const sendMessage = async (friendshipId, data) => {
  // Fallback REST endpoint if socket is not available
  const res = await api.post(`/messages/conversations/${friendshipId}`, data);
  return res.data;
};

export const markAsRead = async (friendshipId) => {
  const res = await api.patch(`/messages/conversations/${friendshipId}/read`);
  return res.data;
};
