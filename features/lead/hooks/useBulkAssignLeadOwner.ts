import { useState } from "react";
import { BulkAssignLeadOwnerResponse, bulkAssignLeadOwner } from "../api";

export const useBulkAssignLeadOwner = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const assign = async (
        leadIds: string[],
        leadOwnerId: string
    ): Promise<BulkAssignLeadOwnerResponse | null> => {
        try {
            setLoading(true);
            setError(null);

            const result = await bulkAssignLeadOwner({
                leadIds,
                leadOwnerId,
            });

            return result;
        } catch (err: any) {
            setError(
                err.response?.data?.message || "Failed to assign leads"
            );
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        assign,
        loading,
        error,
    };
};