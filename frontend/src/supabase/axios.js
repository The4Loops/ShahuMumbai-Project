import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.REACT_Server_API_BASE_URL || 'http://localhost:5000',
  withCredentials: true // If you need cookies/JWT via HttpOnly
});

// Add JWT token to every request
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Retrieve token from localStorage
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
export default instance;
