import { axiosInstance } from "./axiosInstance";

export interface BulkAssignLeadOwnerPayload {
    leadIds: string[];
    leadOwnerId: string;
}

export interface BulkAssignLeadOwnerResponse {
    requested: number;
    updated: number;
    skipped: number;
    skippedIds: string[];
}

export const bulkAssignLeadOwner = async (
    payload: BulkAssignLeadOwnerPayload
): Promise<BulkAssignLeadOwnerResponse> => {
    const { data } = await axiosInstance.post(
        "/leads/bulk-assign",
        payload
    );

    return data;
};