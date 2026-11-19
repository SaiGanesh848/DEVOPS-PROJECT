import api from './api';

export const getAuditLogs = async (params = {}) => {
  const response = await api.get('/audit', { params });
  return response.data;
};

export const getAuditStats = async () => {
  const response = await api.get('/audit/stats');
  return response.data;
};

export const getFailedAccesses = async (params = {}) => {
  const response = await api.get('/audit/failed-accesses', { params });
  return response.data;
};

export const getLinkRevocations = async (params = {}) => {
  const response = await api.get('/audit/link-revocations', { params });
  return response.data;
};
