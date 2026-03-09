"use client"
import { useState } from "react";
import { createC2CCall, C2CResponse } from "../api/call.api";

export const useC2C = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const call = async (
        agentNumber: string,
        customerNumber: string
    ): Promise<C2CResponse | null> => {
        try {
            setLoading(true);
            setError(null);

            const result = await createC2CCall({
                agentNumber,
                customerNumber,
            });

            return result;
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to create call"
            );
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        call,
        loading,
        error,
    };
};