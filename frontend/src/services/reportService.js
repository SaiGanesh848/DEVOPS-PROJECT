import api from './api';

export const getTransferHistory = async (params = {}) => {
  const response = await api.get('/reports/transfer-history', { params });
  return response.data;
};

export const getFileAccessAudit = async (params = {}) => {
  const response = await api.get('/reports/file-access-audit', { params });
  return response.data;
};

export const getExpiredShares = async (params = {}) => {
  const response = await api.get('/reports/expired-shares', { params });
  return response.data;
};

export const getStorageUsage = async (params = {}) => {
  const response = await api.get('/reports/storage-usage', { params });
  return response.data;
};

export const exportReport = async (reportType, params = {}) => {
  const response = await api.get(`/reports/${reportType}/export`, {
    params,
    responseType: 'blob',
  });
  return response;
};
