import { axiosInstance } from "@/features/auth/api/axiosInstance";
import type { Employee } from "@/features/auth/types";

export interface PatchEmployeePasswordPayload {
  newPassword: string;
}

/**
 * PATCH /employees/:id/password — смена пароля.
 * SUPER_ADMIN — у любого; ADMIN — только у AGENT, TEAMLEADER, LEADMANAGER.
 */
export async function patchEmployeePassword(
  employeeId: string,
  payload: PatchEmployeePasswordPayload
): Promise<Employee> {
  const { data } = await axiosInstance.patch<Employee>(`/employees/${employeeId}/password`, payload);
  return data;
}
