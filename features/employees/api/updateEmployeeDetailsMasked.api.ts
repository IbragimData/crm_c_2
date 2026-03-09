import { Employee } from "@/features/auth/types";
import { axiosInstance } from "./axiosInsstance";

export async function updateEmployeeDetailsMasked(
  employeeId: string,
  detailsMasked: boolean
): Promise<Employee | null> {
  try {
    const { data } = await axiosInstance.patch<Employee>(`/employees/${employeeId}`, {
      detailsMasked,
    });
    return data;
  } catch (err) {
    console.error("Failed to update details masked", err);
    return null;
  }
}
