import { useState } from "react";
import {
    BulkAssignLeadOwnerRandomResponse,
    bulkAssignLeadOwnerRandom,
} from "../api";

export const useBulkAssignLeadOwnerRandom = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const distribute = async (
        leadIds: string[],
        ownerIds: string[]
    ): Promise<BulkAssignLeadOwnerRandomResponse | null> => {
        try {
            setLoading(true);
            setError(null);
            const result = await bulkAssignLeadOwnerRandom({ leadIds, ownerIds });
            return result;
        } catch (err: any) {
            setError(
                err.response?.data?.message || "Failed to distribute leads"
            );
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        distribute,
        loading,
        error,
    };
};
