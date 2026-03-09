"use client";

import { useState } from "react";
import { Employee, EmployeeStatus } from "../../auth/types";
import { updateEmployeeStatus } from "../api/employees";

export function useUpdateEmployeeStatus() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateStatus = async (employeeId: string, status: EmployeeStatus): Promise<Employee | null> => {
        setLoading(true);
        setError(null);

        try {
            const updated = await updateEmployeeStatus(employeeId, { status });
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