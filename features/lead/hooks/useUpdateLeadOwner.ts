"use client";

import { useState } from "react";
import { updateLeadOwner } from "../api/updata-lead-owner.api";
import { Lead } from "../types";
import { useLeadsStore } from "../store/useLeadsStore";

export function useUpdateLeadOwner() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateOwner = async (leadId: string, leadOwnerId: string): Promise<Lead | null> => {
        setLoading(true);
        setError(null);

        try {
            const updated = await updateLeadOwner(leadId, { leadOwnerId });
            if (!updated) throw new Error("Failed to update Owner");
            useLeadsStore.getState().invalidateCache();
            setLoading(false);
            return updated;
        } catch (err: any) {
            setError(err.message || "Something went wrong");
            setLoading(false);
            return null;
        }
    };

    return { updateOwner, loading, error };
}