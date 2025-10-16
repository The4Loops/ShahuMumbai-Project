import axios from "axios";

/**
 * Resolve API base URL safely across CRA and Vite and avoid calling .replace on undefined.
 * - CRA exposes env vars only if they start with REACT_APP_
 * - Vite exposes env as import.meta.env.VITE_*
 */
const fromCRA = typeof process !== "undefined" ? process.env?.REACT_APP_API_BASE_URL : "";

const rawBase =
  (typeof fromCRA === "string" && fromCRA);

const baseURL = (typeof rawBase === "string" ? rawBase : "http://localhost:5000").replace(/\/$/, "");

const api = axios.create({
  baseURL,
  withCredentials: true, // send your signed "sid" cookie for guest carts
  headers: { "Content-Type": "application/json" },
});

// Attach Bearer if logged in
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
