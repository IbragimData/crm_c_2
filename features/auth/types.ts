import type { Role } from "./types/employee.type";
export { Role, EmployeeStatus } from "./types/employee.type";
export type { Employee } from "./types/employee.type";

export interface AuthEmployee {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
}
