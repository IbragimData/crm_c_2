import { Lead, LeadStatus } from "../types";
import { axiosInstance } from "./axiosInstance";

export async function updateLeadOwner(
  leadId: string,
  payload: { leadOwnerId: string } // <-- исправлено
): Promise<Lead | null> {
  try {
    const res = await axiosInstance.patch<Lead>(`/leads/${leadId}`, payload);
    return res.data;
  } catch (error) {
    console.error("Failed to update lead owner:", error);
    return null;
  }
}