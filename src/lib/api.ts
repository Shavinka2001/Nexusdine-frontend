import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3001/api";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const path =
        typeof window !== "undefined" ? window.location.pathname : "";
      const isAuthRoute =
        path.startsWith("/login") ||
        path.startsWith("/register") ||
        path.startsWith("/forgot-password") ||
        path.startsWith("/order");

      if (!isAuthRoute && useAuthStore.getState().isAuthenticated) {
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") {
          window.location.href = `/login?session=expired`;
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
