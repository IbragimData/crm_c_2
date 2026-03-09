// EmployeesList.tsx

import { EmployeeItem } from "@/components";
import s from "./EmployeesList.module.scss";
import { Employee } from "../../../../features/auth/types"
interface EmployeesListProps {
    employees: Employee[];
}


export function EmployeesList({ employees }: EmployeesListProps) {
    return (
        <div className={s.EmployeesList}>
            {employees.map((emp) => (
                <EmployeeItem key={emp.id} employee={emp} />
            ))}
        </div>
    );
}