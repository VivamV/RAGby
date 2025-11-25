import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
    
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  signup: async (email, password, name) => {
    const response = await api.post('/auth/signup', { email, password, name });
    return response.data;
  },
};

// Projects API
export const projectsAPI = {
  getPublic: async () => {
    const response = await api.get('/projects/public');
    return response.data;
  },
  
  getMy: async () => {
    const response = await api.get('/projects/my');
    return response.data;
  },
  
  create: async (projectData) => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },
  
  uploadDocument: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/projects/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },
};

// Chat API
export const chatAPI = {
  createSession: async (projectId, title) => {
    const response = await api.post(`/chat/${projectId}/sessions`, { title });
    return response.data;
  },
  //not used anywhere till now
  getSessions: async (projectId) => {
    const response = await api.get(`/chat/${projectId}/sessions`);
    return response.data;
  },
  //most imp
  sendMessage: async (projectId, sessionId, message) => {
    const response = await api.post(`/chat/${projectId}/sessions/${sessionId}/messages`, {
      message,
    });
    return response.data;
  },
  //not used anywhere till now
  getMessages: async (projectId, sessionId) => {
    const response = await api.get(`/chat/${projectId}/sessions/${sessionId}/messages`);
    return response.data;
  },
  
  deleteSession: async (projectId, sessionId) => {
    const response = await api.delete(`/chat/${projectId}/sessions/${sessionId}`);
    return response.data;
  },
  
  updateChatTitle: async (projectId, sessionId, title) => {
    const response = await api.put(`/chat/${projectId}/sessions/${sessionId}/title`, {
      title,
    });
    return response.data;
  },
};

export default api;
