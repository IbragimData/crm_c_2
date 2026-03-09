import { LeadStatus } from "../types";
import { axiosInstance } from "./axiosInstance";

export interface BulkUpdateLeadsStatusPayload {
    leadIds: string[];
    status: LeadStatus;
}

export interface BulkUpdateLeadStatusResponse {
    requested: number;
    updated: number;
    skipped: number;
    skippedIds: string[];
}

export const bulkUpdateLeadStatus = async (
    payload: BulkUpdateLeadsStatusPayload
): Promise<BulkUpdateLeadStatusResponse> => {
    const { data } = await axiosInstance.post(
        "/leads/bulk-status",
        payload
    );

    return data;
};