export interface Token {
  id: string;
  employeeId: string;
  token: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  revokedAt?: string | null;
}