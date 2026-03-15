import api from '../config/api';

export const getIncoming = async (params) => {
  const res = await api.get('/friends/requests/incoming', { params });
  return res.data;
};

export const getOutgoing = async (params) => {
  const res = await api.get('/friends/requests/outgoing', { params });
  return res.data;
};

export const getFriends = async (params) => {
  const res = await api.get('/friends', { params });
  return res.data;
};

export const sendRequest = async (userId) => {
  const res = await api.post(`/friends/request/${userId}`);
  return res.data;
};

export const respondToRequest = async ({ friendshipId, action }) => {
  // action = 'accept' | 'reject'
  const res = await api.patch(`/friends/requests/${friendshipId}/${action}`);
  return res.data;
};

export const removeFriend = async (friendshipId) => {
  const res = await api.delete(`/friends/${friendshipId}`);
  return res.data;
};

export const blockUser = async (userId) => {
  const res = await api.post(`/friends/block/${userId}`);
  return res.data;
};
