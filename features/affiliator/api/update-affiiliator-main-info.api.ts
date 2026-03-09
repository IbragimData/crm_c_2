import { Employee } from "@/features/auth/types";
import { axiosInstanceAffiliator } from "./axiosInstance-affiliator.api";

export type UpdateAffiliatorMainInfoPayload = Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    telegramUsername: string;
}>;

export async function apiUpdateAfiliatorMainInfo(
    employeeId: string,
    payload: UpdateAffiliatorMainInfoPayload
): Promise<Employee | null> {
    try {
        const res = await axiosInstanceAffiliator.patch<Employee>(`/employees/${employeeId}`, payload);
        return res.data;
    } catch (error) {
        console.error("Failed to update employees", error);
        return null;
    }
}