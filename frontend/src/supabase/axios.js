// src/supabase/axios.js
import axios from "axios";

const fromCRA = typeof process !== "undefined" ? process.env?.REACT_APP_API_BASE_URL : "";
const rawBase = typeof fromCRA === "string" && fromCRA;
const baseURL = (typeof rawBase === "string" ? rawBase : "http://localhost:5000").replace(/\/$/, "");

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const withCurrency = (config, currency) => {
  if (currency) {
    config.params = { ...config.params, currency };
  }
  return config;
};

export const apiWithCurrency = (currency) => ({
  get: (url, config = {}) => {
    return api.get(url, withCurrency(config, currency));
  },
  post: (url, data, config = {}) => api.post(url, data, config),
  put: (url, data, config = {}) => api.put(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/account") {
        window.location.href = "/account";
      }
    }
    return Promise.reject(error);
  }
);

export default api;