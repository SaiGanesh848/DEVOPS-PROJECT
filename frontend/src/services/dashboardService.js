import api from './api';

export const getAdminDashboard = async () => {
  const response = await api.get('/dashboard/admin');
  return response.data;
};

export const getSenderDashboard = async () => {
  const response = await api.get('/dashboard/sender');
  return response.data;
};

export const getRecipientDashboard = async () => {
  const response = await api.get('/dashboard/recipient');
  return response.data;
};

export const getAuditorDashboard = async () => {
  const response = await api.get('/dashboard/auditor');
  return response.data;
};
