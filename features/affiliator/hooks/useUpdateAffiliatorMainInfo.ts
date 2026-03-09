"use client";
import { Employee } from "@/features/auth/types";
import { useState } from "react";
import { apiUpdateAfiliatorMainInfo } from "../api/update-affiiliator-main-info.api";
import type { UpdateAffiliatorMainInfoPayload } from "../api/update-affiiliator-main-info.api";

export function useUpdateAffiliatorMainInfo() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateAffiliatorMainInfo = async (
        employeeId: string,
        payload: UpdateAffiliatorMainInfoPayload
    ): Promise<Employee | null> => {
        setLoading(true);
        setError(null);

        try {
            const updated = await apiUpdateAfiliatorMainInfo(employeeId, payload);
            if (!updated) throw new Error("Failed to update employee");
            setLoading(false);
            return updated;
        } catch (err: any) {
            setError(err.message || "Something went wrong");
            setLoading(false);
            return null;
        }
    };

    return { updateAffiliatorMainInfo, loading, error };
}