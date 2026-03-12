'use client';

import s from "./EmployeeMainInfo.module.scss";
import { useState, useMemo, useEffect } from "react";
import { Employee, Role } from "@/features/auth/types";
import { EMPLOYEE_STATUS_UI } from "@/features/employees/constants/employee-status.enum";
import { roleLabels } from "@/features/employees/constants";
import { EmployeeUpdateStatus, Select } from "@/components";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useUpdateEmployeeMainInfo } from "@/features/employees/hooks/useUpdateEmployeeMainInfo";
import { patchEmployeeRole } from "@/features/employees/api";
import Image from "next/image";
import iconPencil from "@/modules/lead/assets/pencil.svg";
import iconClose from "@/components/lead/assets/close.svg";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;

/** Тимлидер и агент могут редактировать только отдел (department). */
const ROLES_CAN_EDIT_DEPARTMENT = [Role.TEAMLEADER, Role.AGENT] as const;

type FieldKey = "firstName" | "lastName" | "phone" | "phoneSecondary" | "telegramUsername" | "email" | "department";

const FIELDS_COL1: { key: FieldKey; label: string }[] = [
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "telegramUsername", label: "Telegram" },
];

const FIELDS_COL2: { key: FieldKey; label: string }[] = [
    { key: "phone", label: "Phone" },
    { key: "phoneSecondary", label: "Second phone" },
    { key: "email", label: "Email" },
];

interface Props {
    employee: Employee;
    setEmployee: (e: Employee) => void;
    /** Can change role (ADMIN/SUPER_ADMIN). */
    canChangeRole?: boolean;
    /** Allowed roles for dropdown: max ADMIN, min AGENT (no USER, no SUPER_ADMIN). */
    allowedRolesForRole?: Role[];
}

export function EmployeeMainInfo({ employee, setEmployee, canChangeRole, allowedRolesForRole }: Props) {
    const { updateEmployeeMainInfo, loading } = useUpdateEmployeeMainInfo();
    const currentUser = useAuthStore((state) => state.employee);
    const isAdmin = currentUser && ADMIN_ROLES.includes(currentUser.role as any);
    const canEditDepartment =
        isAdmin ||
        (currentUser && ROLES_CAN_EDIT_DEPARTMENT.includes(currentUser.role as (typeof ROLES_CAN_EDIT_DEPARTMENT)[number]));
    const [roleLoading, setRoleLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [employeeStatus, setEmployeeStatus] = useState(employee.status);
    const [editingField, setEditingField] = useState<FieldKey | null>(null);

    useEffect(() => {
        setEmployeeStatus(employee.status);
    }, [employee.status]);

    const [formData, setFormData] = useState({
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        phone: employee.phone || "",
        phoneSecondary: employee.phoneSecondary || "",
        telegramUsername: employee.telegramUsername || "",
        email: employee.email || "",
        department: employee.department ?? "",
    });

    const originalData = useMemo(
        () => ({
            firstName: employee.firstName || "",
            lastName: employee.lastName || "",
            phone: employee.phone || "",
            phoneSecondary: employee.phoneSecondary || "",
            telegramUsername: employee.telegramUsername || "",
            email: employee.email || "",
            department: employee.department ?? "",
        }),
        [employee]
    );

    useEffect(() => {
        setFormData({
            firstName: employee.firstName || "",
            lastName: employee.lastName || "",
            phone: employee.phone || "",
            phoneSecondary: employee.phoneSecondary || "",
            telegramUsername: employee.telegramUsername || "",
            email: employee.email || "",
            department: employee.department ?? "",
        });
        setEditingField(null);
    }, [employee.id]);

    const handleChange = (field: FieldKey, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleStartEdit = (field: FieldKey) => {
        const canEdit = field === "department" ? canEditDepartment : isAdmin;
        if (!canEdit) return;
        setEditingField(field);
    };

    const handleCancelEdit = () => {
        if (editingField === null) return;
        setFormData((prev) => ({ ...prev, [editingField]: originalData[editingField] }));
        setEditingField(null);
    };

    const handleSaveField = async () => {
        if (editingField === null) return;
        const value = formData[editingField];
        if (value === originalData[editingField]) {
            setEditingField(null);
            return;
        }
        const payload =
            editingField === "department"
                ? { department: value.trim() || null }
                : { [editingField]: value };
        const updated = await updateEmployeeMainInfo(employee.id, payload);
        if (updated) {
            setEmployee({ ...employee, ...updated });
            setEditingField(null);
        }
    };

    const handleRoleChange = async (newRole: string) => {
        if (!canChangeRole || !allowedRolesForRole?.length || newRole === employee.role) return;
        setRoleLoading(true);
        try {
            const updated = await patchEmployeeRole(employee.id, { role: newRole as Role });
            setEmployee({ ...employee, ...updated });
        } finally {
            setRoleLoading(false);
        }
    };

    const renderField = ({ key, label }: { key: FieldKey; label: string }) => {
        const isEditing = editingField === key;
        const hasChange = formData[key] !== originalData[key];
        const isMasked = Boolean(employee.detailsMasked) && (key === "phone" || key === "phoneSecondary" || key === "email" || key === "telegramUsername");
        const displayValue = isMasked ? "••••••" : (formData[key] || "—");
        const canEditThis = key === "department" ? canEditDepartment : isAdmin;
        return (
            <div key={key} className={s.EmployeeMainInfo__field}>
                <label className={s.EmployeeMainInfo__label}>{label}</label>
                <div className={s.EmployeeMainInfo__fieldRow}>
                    {isEditing && !isMasked ? (
                        <>
                            <input
                                type="text"
                                className={s.EmployeeMainInfo__input}
                                value={formData[key]}
                                onChange={(e) => handleChange(key, e.target.value)}
                                autoFocus
                            />
                            <div className={s.EmployeeMainInfo__fieldActions}>
                                <button
                                    type="button"
                                    className={`${s.EmployeeMainInfo__iconBtn} ${hasChange ? s.EmployeeMainInfo__iconBtn_save : ""}`}
                                    onClick={handleSaveField}
                                    disabled={loading || !hasChange}
                                    title="Save"
                                >
                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                        <path d="M15 4.5L6.75 12.75L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    className={s.EmployeeMainInfo__iconBtn}
                                    onClick={handleCancelEdit}
                                    disabled={loading}
                                    title="Cancel"
                                >
                                    <Image src={iconClose} width={16} height={16} alt="Cancel" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <span className={s.EmployeeMainInfo__value}>{displayValue}</span>
                            {canEditThis && !isMasked && (
                                <button
                                    type="button"
                                    className={s.EmployeeMainInfo__iconBtn}
                                    onClick={() => handleStartEdit(key)}
                                    title="Edit"
                                >
                                    <Image src={iconPencil} width={18} height={18} alt="Edit" />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={s.EmployeeMainInfo}>
            <div className={s.EmployeeMainInfo__content}>
                <h1 className={s.EmployeeMainInfo__title}>Main info</h1>

                <div className={s.EmployeeMainInfo__block}>
                    <div className={s.EmployeeMainInfo__column}>
                        {FIELDS_COL1.map(renderField)}
                        {isModalOpen && isAdmin && (
                            <EmployeeUpdateStatus
                                employeeId={employee.id}
                                currentStatus={employeeStatus}
                                onClose={() => setIsModalOpen(false)}
                                onStatusUpdated={(newStatus) => {
                                    setEmployeeStatus(newStatus);
                                    setEmployee({ ...employee, status: newStatus });
                                }}
                            />
                        )}
                        <div className={s.EmployeeMainInfo__box}>
                            <label className={s.EmployeeMainInfo__label}>Status</label>
                            <button
                                className={s.EmployeeMainInfo__status}
                                style={{
                                    backgroundColor: EMPLOYEE_STATUS_UI[employeeStatus].bg,
                                    color: EMPLOYEE_STATUS_UI[employeeStatus].text,
                                }}
                                onClick={() => isAdmin && setIsModalOpen(true)}
                            >
                                {EMPLOYEE_STATUS_UI[employeeStatus].label}
                            </button>
                        </div>
                    </div>

                    <div className={s.EmployeeMainInfo__column}>
                        {FIELDS_COL2.map(renderField)}
                        <div className={s.EmployeeMainInfo__field}>
                            <label className={s.EmployeeMainInfo__label}>Role</label>
                            <div className={s.EmployeeMainInfo__fieldRow}>
                                {canChangeRole && allowedRolesForRole && allowedRolesForRole.length > 0 ? (
                                    <Select
                                        value={employee.role}
                                        onChange={(v) => handleRoleChange(v)}
                                        options={allowedRolesForRole.map((r) => ({ value: r, label: roleLabels[r] ?? r }))}
                                        aria-label="Role"
                                        disabled={roleLoading}
                                    />
                                ) : (
                                    <span className={s.EmployeeMainInfo__value}>{employee.role}</span>
                                )}
                            </div>
                        </div>
                        {renderField({ key: "department", label: "Department" })}
                        <div className={s.EmployeeMainInfo__field}>
                            <label className={s.EmployeeMainInfo__label}>Last Login</label>
                            <div className={s.EmployeeMainInfo__fieldRow}>
                                <span className={s.EmployeeMainInfo__value}>
                                    {employee.lastLoginAt ? new Date(employee.lastLoginAt).toLocaleString() : "Never"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
