import { axiosInstance } from "@/features/auth/api/axiosInstance"
import { Employee, EmployeeStatus } from "../../auth/types"
import { EmployeesFilter } from "../types"

export async function getEmployees(
    filters?: EmployeesFilter
): Promise<Employee[]> {
    const { data } = await axiosInstance.get<Employee[]>("/employees", {
        params: {
            ...(filters?.role && { role: filters.role }),
            ...(filters?.createdFrom && { createdFrom: filters.createdFrom }),
            ...(filters?.createdTo && { createdTo: filters.createdTo }),
        },
    })
    console.log(data)

    return data
}

export async function getEmployeeById(id: string): Promise<Employee> {
    const { data } = await axiosInstance.get<Employee>(`/employees/${id}`)
    return data
}


interface UpdateStatusPayload {
    status: EmployeeStatus;
}

export async function updateEmployeeStatus(employeeId: string, payload: UpdateStatusPayload): Promise<Employee | null> {
    try {
        const res = await axiosInstance.patch<Employee>(`/employees/${employeeId}`, payload);
        return res.data;
    } catch (error) {
        console.error("Failed to update employee status:", error);
        return null;
    }
}