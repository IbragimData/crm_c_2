import { Lead, LeadStatus } from "../types";
import { axiosInstance } from "./axiosInstance";

export async function updateLeadStatus(
  leadId: string,
  payload: { status: LeadStatus } // <-- исправлено
): Promise<Lead | null> {
  try {
    const res = await axiosInstance.patch<Lead>(`/leads/${leadId}/status`, payload);
    return res.data;
  } catch (error) {
    console.error("Failed to update lead status:", error);
    return null;
  }
}