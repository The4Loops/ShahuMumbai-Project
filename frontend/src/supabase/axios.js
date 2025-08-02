import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.REACT_Server_API_BASE_URL || 'http://localhost:5000',
  withCredentials: true // If you need cookies/JWT via HttpOnly
});

export default instance;
