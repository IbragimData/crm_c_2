import Link from "next/link";
import s from "./EmployeeItem.module.scss";
import { Employee } from "../../../../features/auth/types"
import { EMPLOYEE_STATUS_UI } from "@/features/employees/constants";

interface EmployeeItemProps {
    employee: Employee;
}

export function EmployeeItem({ employee }: EmployeeItemProps) {
    return (
        <Link href={`/employees/${employee.id}`} className={s.EmployeeItem}>
            {/* Container with logo/avatar and name */}
            <div className={s.EmployeeItem__contener}>
                <div className={s.EmployeeItem__logo}>
                    {/* Avatar can be added here */}
                    {employee.avatarUrl ? (
                        <img src={employee.avatarUrl} alt={employee.firstName} />
                    ) : (
                        <div className={s.EmployeeItem__placeholder}></div>
                    )}
                </div>
                <div className={s.EmployeeItem__content}>
                    <h3>{employee.firstName} {employee.lastName}</h3>
                    <p className={s.EmployeeItem__text}>
                        {employee.detailsMasked ? "••••••" : employee.email}
                    </p>
                </div>
            </div>

            {/* Additional info */}
            <div className={s.EmployeeItem__content}>
                <p className={s.EmployeeItem__text}>Team</p>
                <p className={s.EmployeeItem__txt}>{employee.department || "—"}</p>
            </div>

            <div className={s.EmployeeItem__content}>
                <p className={s.EmployeeItem__text}>Last Login</p>
                <p className={s.EmployeeItem__txt}>
                    {employee.lastLoginAt ? new Date(employee.lastLoginAt).toLocaleDateString() : "—"}
                </p>
            </div>

            <div className={s.EmployeeItem__content}>
                <p className={s.EmployeeItem__text}>Number of Calls</p>
                <p className={s.EmployeeItem__txt}>24</p> {/* Replace with real field when available */}
            </div>
            <div className={s.EmployeeItem__content}>
                <p className={s.EmployeeItem__text}>Status</p>
                <span
                    className={s.EmployeeItem__status}
                    style={{
                        backgroundColor: EMPLOYEE_STATUS_UI[employee.status].bg,
                        color: EMPLOYEE_STATUS_UI[employee.status].text,
                    }}
                >
                    {EMPLOYEE_STATUS_UI[employee.status].label}
                </span>

            </div>

            <div className={s.EmployeeItem__content}>
                <p className={s.EmployeeItem__text}>Role</p>
                <p className={s.EmployeeItem__txt}> {employee.role}</p>
            </div>
        </Link>
    );
}