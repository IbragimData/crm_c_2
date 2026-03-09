import { Employee, Role, EmployeeStatus } from "@/features/auth/types";
import { axiosInstance } from "./axiosInsstance";

export interface CreateEmployeePayload {
  /** Email или логин — любая строка */
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  status?: EmployeeStatus;
  phone?: string;
  phoneSecondary?: string;
  telegramUsername?: string;
  middleName?: string | null;
  department?: string | null;
  hiredAt?: string;
}

export async function createEmployee(payload: CreateEmployeePayload): Promise<Employee> {
  const body: Record<string, unknown> = {
    email: payload.email.trim(),
    password: payload.password,
    firstName: payload.firstName,
    lastName: payload.lastName,
    role: payload.role,
    ...(payload.status != null && { status: payload.status }),
    ...(payload.phone != null && { phone: payload.phone }),
    ...(payload.phoneSecondary != null && { phoneSecondary: payload.phoneSecondary }),
    ...(payload.telegramUsername != null && { telegramUsername: payload.telegramUsername }),
    ...(payload.middleName != null && { middleName: payload.middleName }),
    ...(payload.department != null && { department: payload.department }),
    ...(payload.hiredAt != null && { hiredAt: payload.hiredAt }),
  };
  const { data } = await axiosInstance.post<Employee>("/employees", body);
  return data;
}
