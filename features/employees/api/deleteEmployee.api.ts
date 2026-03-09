import { Employee } from "@/features/auth/types";
import { axiosInstance } from "./axiosInsstance";

/**
 * DELETE /employees/:id — soft delete (isDeleted: true).
 * Only SUPER_ADMIN. ADMIN gets 403.
 */
export async function deleteEmployee(employeeId: string): Promise<Employee> {
  const { data } = await axiosInstance.delete<Employee>(`/employees/${employeeId}`);
  return data;
}
