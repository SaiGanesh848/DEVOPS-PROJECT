import api from './api';

export const uploadFile = async (formData, onProgress) => {
  const response = await api.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
  return response.data;
};

export const getMyFiles = async (params = {}) => {
  const response = await api.get('/files/my-files', { params });
  return response.data;
};

export const getAllFiles = async (params = {}) => {
  const response = await api.get('/files/all', { params });
  return response.data;
};

export const getFileById = async (id) => {
  const response = await api.get(`/files/${id}`);
  return response.data;
};

export const deleteFile = async (id) => {
  const response = await api.delete(`/files/${id}`);
  return response.data;
};

export const downloadFile = async (id, originalName = 'download') => {
  const response = await api.get(`/files/download/${id}`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', originalName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  return response;
};
