import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL;

// Instancia de axios
export const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para enviar token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
