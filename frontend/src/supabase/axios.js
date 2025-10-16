
import axios from "axios";

const craBase =
  (typeof process !== "undefined" &&
    process.env &&
    typeof process.env.REACT_APP_API_BASE_URL === "string" &&
    process.env.REACT_APP_API_BASE_URL) ||
  "http://localhost:5000";

const baseURL = craBase.replace(/\/$/, "");

const api = axios.create({
  baseURL,
  withCredentials: true, 
  headers: { "Content-Type": "application/json" },
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.log("[axios] baseURL =", api.defaults.baseURL);
}

export default api;
