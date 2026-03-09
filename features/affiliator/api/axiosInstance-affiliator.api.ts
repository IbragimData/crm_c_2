import axios from "axios";
import { API_CONFIG } from "@/config/api";

export const axiosInstanceAffiliator = axios.create({
  baseURL: API_CONFIG.BASE_URL,
});

axiosInstanceAffiliator.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosInstanceAffiliator.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);