import axios from "axios";
import { API_CONFIG } from "@/config/api";

export const timeApiInstance = axios.create({
  baseURL: API_CONFIG.TIME_URL.replace(/\/$/, ""), // no trailing slash so path joins correctly
});

timeApiInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
