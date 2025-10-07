import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_Server_API_BASE_URL || 'http://localhost:5000', // Match server.js PORT
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Authorization header with token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Log responses for debugging
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;