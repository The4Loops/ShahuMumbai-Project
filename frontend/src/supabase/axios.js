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


export default api;