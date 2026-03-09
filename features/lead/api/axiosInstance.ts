import axios from "axios";
import { API_CONFIG } from "@/config/api";

/**
 * Сериализует params для GET-запросов: массивы уходят как повторяющиеся ключи
 * (status=NEW&status=IN_PROGRESS), а не status[]=NEW&status[]=IN_PROGRESS,
 * чтобы бэкенд не возвращал 400.
 */
function paramsSerializer(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null) searchParams.append(key, String(item));
      }
    } else {
      searchParams.append(key, String(value));
    }
  }
  return searchParams.toString();
}

export const axiosInstance = axios.create({
  baseURL: API_CONFIG.LEAD_URL,
  paramsSerializer,
});

axiosInstance.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);