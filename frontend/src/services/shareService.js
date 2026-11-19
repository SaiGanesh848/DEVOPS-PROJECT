import api from './api';

export const getRecipients = async () => {
  const response = await api.get('/shares/recipients');
  return response.data;
};

export const createShare = async (data) => {
  const response = await api.post('/shares', data);
  return response.data;
};

export const getMyShares = async (params = {}) => {
  const response = await api.get('/shares/my-shares', { params });
  return response.data;
};

export const getSharedWithMe = async (params = {}) => {
  const response = await api.get('/shares/shared-with-me', { params });
  return response.data;
};

export const accessShareByToken = async (token) => {
  const response = await api.get(`/shares/access/${token}`);
  return response.data;
};

export const revokeShare = async (id) => {
  const response = await api.put(`/shares/${id}/revoke`);
  return response.data;
};

export const getShareDetails = async (id) => {
  const response = await api.get(`/shares/${id}`);
  return response.data;
};
