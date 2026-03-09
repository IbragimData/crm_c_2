import { Role } from "@/features/auth/types"

export type EmployeesFilter = {
    role?: Role
    createdFrom?: string
    createdTo?: string
}