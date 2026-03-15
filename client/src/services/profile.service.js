import api from '../config/api';

export const getMyProfile = async () => {
  const res = await api.get('/profiles/me');
  return res.data;
};

export const updateProfile = async (data) => {
  const res = await api.put('/profiles/me', data);
  return res.data;
};

export const updateSkills = async (skills) => {
  const res = await api.patch('/profiles/me/skills', { skills });
  return res.data;
};

export const updateProfilePicture = async (formData) => {
  const res = await api.patch('/profiles/me/picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const updateOfflineProfile = async (data) => {
  const res = await api.patch('/profiles/me/offline', data);
  return res.data;
};
