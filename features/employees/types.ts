export * from "./types/type";

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  email?: string;
  status?: string;
}
