"use client";

import { useState } from "react";
import { updateLeadStatus } from "../api/update-lead-status";
import { Lead, LeadStatus } from "../types";

export function useUpdateLeadStatus() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateStatus = async (leadId: string, status: LeadStatus): Promise<Lead | null> => {
        setLoading(true);
        setError(null);

        try {
            const updated = await updateLeadStatus(leadId, { status }); // <-- теперь тип совпадает
            if (!updated) throw new Error("Failed to update status");
            setLoading(false);
            return updated;
        } catch (err: any) {
            setError(err.message || "Something went wrong");
            setLoading(false);
            return null;
        }
    };

    return { updateStatus, loading, error };
}