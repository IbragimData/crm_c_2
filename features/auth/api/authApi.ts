import { axiosInstance } from "./axiosInstance";
import { Employee } from "../types";

export async function getMe(): Promise<Employee | null> {
  try {
    const res = await axiosInstance.get("/auth/me");
    return res.data;
  } catch (e) {
    return null;
  }
}

