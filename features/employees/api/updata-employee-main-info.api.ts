import { Employee, Role } from "@/features/auth/types";
import { axiosInstance } from "./axiosInsstance";

export type UpdateEmployeeMainInfoPayload = Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    phoneSecondary: string;
    telegramUsername: string;
    email: string;
}>;

export async function apiUpdateEmployeeMainInfo(
    employeeId: string,
    payload: UpdateEmployeeMainInfoPayload
): Promise<Employee | null> {
    try {
        const res = await axiosInstance.patch<Employee>(`/employees/${employeeId}`, payload);
        return res.data;
    } catch (error) {
        console.error("Failed to update employees", error);
        return null;
    }
}