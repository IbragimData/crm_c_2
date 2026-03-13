import { axiosInstance } from "./axiosInstance";

export interface BulkAssignLeadOwnerRandomPayload {
    leadIds: string[];
    ownerIds: string[];
}

export interface BulkAssignLeadOwnerRandomResponse {
    requested: number;
    updated: number;
    skipped: number;
    skippedIds: string[];
    distribution: Record<string, string>;
}

export const bulkAssignLeadOwnerRandom = async (
    payload: BulkAssignLeadOwnerRandomPayload
): Promise<BulkAssignLeadOwnerRandomResponse> => {
    const { data } = await axiosInstance.post(
        "/leads/bulk-assign-random",
        payload
    );
    return data;
};
