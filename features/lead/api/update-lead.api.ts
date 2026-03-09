import { Lead, LeadStatus } from "../types";
import { axiosInstance } from "./axiosInstance";

export type UpdateLeadPayload = Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    seedPhrases: string;
    description: string;
    connectedTo: string;
}>;

export async function updateLead(
    leadId: string,
    payload: UpdateLeadPayload
): Promise<Lead | null> {
    try {
        const res = await axiosInstance.patch<Lead>(`/leads/${leadId}`, payload);
        return res.data;
    } catch (error) {
        console.error("Failed to update lead:", error);
        return null;
    }
}