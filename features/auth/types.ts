export enum Role {
  AGENT = "AGENT",
  TEAMLEADER = "TEAMLEADER",
  LEADMANAGER = "LEADMANAGER",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
  AFFILIATOR = "AFFILIATOR",
}

export { EmployeeStatus, Employee } from "./types/employee.type";

export interface AuthEmployee {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
}
