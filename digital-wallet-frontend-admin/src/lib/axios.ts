import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getCookie, clearAdminSession } from "./cookies";

const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 3000;

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getCookie("admin_access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      clearAdminSession();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    const config = error.config as RetryableConfig | undefined;
    const isNetworkError = !error.response;

    if (config && isNetworkError) {
      config._retryCount = (config._retryCount ?? 0) + 1;
      if (config._retryCount <= MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        return api(config);
      }
    }

    return Promise.reject(error);
  }
);

export default api;