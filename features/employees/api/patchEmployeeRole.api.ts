import { axiosInstance } from "@/features/auth/api/axiosInstance";
import type { Employee, Role } from "@/features/auth/types";

export interface PatchEmployeeRolePayload {
  role: Role;
}

/**
 * PATCH /employees/:id/role — смена роли.
 * SUPER_ADMIN — любую; ADMIN — только USER/AGENT/TEAMLEADER/LEADMANAGER и только у не-админов.
 */
export async function patchEmployeeRole(
  employeeId: string,
  payload: PatchEmployeeRolePayload
): Promise<Employee> {
  const { data } = await axiosInstance.patch<Employee>(`/employees/${employeeId}/role`, payload);
  return data;
}
