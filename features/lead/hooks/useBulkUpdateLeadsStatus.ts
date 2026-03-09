import { useState } from "react";
import { BulkUpdateLeadStatusResponse, bulkUpdateLeadStatus } from "../api";
import { LeadStatus } from "../types";

export const useBulkUpdateLeadsStatus = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const assign = async (
        leadIds: string[],
        status: LeadStatus
    ): Promise<BulkUpdateLeadStatusResponse | null> => {
        try {
            setLoading(true);
            setError(null);

            const result = await bulkUpdateLeadStatus({
                leadIds,
                status,
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