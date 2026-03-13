"use client";

import { useState } from "react";
import { Lead } from "../types";
import { updateLead as apiUpdateLead } from "../api/update-lead.api";
import type { UpdateLeadPayload } from "../api/update-lead.api";
import { useLeadsStore } from "../store/useLeadsStore";

export function useUpdateLead() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateLead = async (leadId: string, payload: UpdateLeadPayload): Promise<Lead | null> => {
        setLoading(true);
        setError(null);

        try {
            const updated = await apiUpdateLead(leadId, payload);
            if (!updated) throw new Error("Failed to update Lead");
            useLeadsStore.getState().invalidateCache();
            setLoading(false);
            return updated;
        } catch (err: any) {
            setError(err.message || "Something went wrong");
            setLoading(false);
            return null;
        }
    };

    return { updateLead, loading, error };
}