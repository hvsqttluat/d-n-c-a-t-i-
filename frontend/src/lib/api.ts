import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Thêm token vào header nếu có
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  register: (data: any) => api.post('/auth/register', data),
  syncFirebase: (data: any) => api.post('/auth/sync', data),
};

export const procedureApi = {
  getAll: () => api.get('/procedures'),
  create: (data: any) => api.post('/procedures', data),
  update: (id: number, data: any) => api.put(`/procedures/${id}`, data),
  delete: (id: number) => api.delete(`/procedures/${id}`),
};

export const reportApi = {
  exportExcel: () => api.get('/reports/excel', { responseType: 'blob' }),
  exportWord: () => api.get('/reports/word', { responseType: 'blob' }),
  exportPPT: () => api.get('/reports/ppt', { responseType: 'blob' }),
  exportPDF: () => api.get('/reports/pdf', { responseType: 'blob' }),
};

export const systemApi = {
  getHealth: () => api.get('/health'),
  sendCommand: (command: string, parameters: any) => api.post('/command', { command, parameters }),
};

export default api;
