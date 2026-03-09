"use client";
import { Employee } from "@/features/auth/types";
import { useState } from "react";
import { apiUpdateEmployeeMainInfo } from "../api/updata-employee-main-info.api";
import type { UpdateEmployeeMainInfoPayload } from "../api/updata-employee-main-info.api";

export function useUpdateEmployeeMainInfo() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateEmployeeMainInfo = async (
        employeeId: string,
        payload: UpdateEmployeeMainInfoPayload
    ): Promise<Employee | null> => {
        setLoading(true);
        setError(null);

        try {
            const updated = await apiUpdateEmployeeMainInfo(employeeId, payload);
            if (!updated) throw new Error("Failed to update employee");
            setLoading(false);
            return updated;
        } catch (err: any) {
            setError(err.message || "Something went wrong");
            setLoading(false);
            return null;
        }
    };

    return { updateEmployeeMainInfo, loading, error };
}