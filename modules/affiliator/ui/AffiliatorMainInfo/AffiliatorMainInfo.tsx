'use client';

import s from "./AffiliatorMainInfo.module.scss";
import { Employee } from "@/features/auth/types";
import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useUpdateAffiliatorMainInfo } from "@/features/affiliator";
import Image from "next/image";
import iconPencil from "@/modules/lead/assets/pencil.svg";
import iconClose from "@/components/lead/assets/close.svg";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;

type FieldKey = "firstName" | "lastName" | "phone" | "telegramUsername";

const FIELDS: { key: FieldKey; label: string }[] = [
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "phone", label: "Phone" },
    { key: "telegramUsername", label: "Telegram" },
];

interface AffiliatorMainInfoProps {
    employee: Employee;
    setEmployee: (e: Employee) => void;
}

export function AffiliatorMainInfo({ employee, setEmployee }: AffiliatorMainInfoProps) {
    const { updateAffiliatorMainInfo, loading } = useUpdateAffiliatorMainInfo();
    const currentUser = useAuthStore((state) => state.employee);
    const isAdmin = currentUser && ADMIN_ROLES.includes(currentUser.role as any);

    const [formData, setFormData] = useState({
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        phone: employee.phone || "",
        telegramUsername: employee.telegramUsername || "",
    });

    const [editingField, setEditingField] = useState<FieldKey | null>(null);

    const originalData = useMemo(
        () => ({
            firstName: employee.firstName || "",
            lastName: employee.lastName || "",
            phone: employee.phone || "",
            telegramUsername: employee.telegramUsername || "",
        }),
        [employee]
    );

    useEffect(() => {
        setFormData({
            firstName: employee.firstName || "",
            lastName: employee.lastName || "",
            phone: employee.phone || "",
            telegramUsername: employee.telegramUsername || "",
        });
        setEditingField(null);
    }, [employee.id]);

    const handleChange = (field: FieldKey, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleStartEdit = (field: FieldKey) => {
        if (!isAdmin) return;
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
        const payload = { [editingField]: value };
        const updated = await updateAffiliatorMainInfo(employee.id, payload);
        if (updated) {
            setEmployee({ ...employee, ...updated });
            setEditingField(null);
        }
    };

    return (
        <div className={s.EmployeeMainInfo}>
            <div className={s.EmployeeMainInfo__content}>
                <h1 className={s.EmployeeMainInfo__title}>Main info</h1>
                <div className={s.EmployeeMainInfo__block}>
                    <div className={s.EmployeeMainInfo__column}>
                        {FIELDS.slice(0, 2).map(({ key, label }) => {
                            const isEditing = editingField === key;
                            const hasChange = formData[key] !== originalData[key];
                            return (
                                <div key={key} className={s.EmployeeMainInfo__field}>
                                    <label className={s.EmployeeMainInfo__label}>{label}</label>
                                    <div className={s.EmployeeMainInfo__fieldRow}>
                                        {isEditing ? (
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
                                                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M15 4.5L6.75 12.75L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                                                <span className={s.EmployeeMainInfo__value}>{formData[key] || "—"}</span>
                                                {isAdmin && (
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
                        })}
                    </div>
                    <div className={s.EmployeeMainInfo__column}>
                        {FIELDS.slice(2, 4).map(({ key, label }) => {
                            const isEditing = editingField === key;
                            const hasChange = formData[key] !== originalData[key];
                            return (
                                <div key={key} className={s.EmployeeMainInfo__field}>
                                    <label className={s.EmployeeMainInfo__label}>{label}</label>
                                    <div className={s.EmployeeMainInfo__fieldRow}>
                                        {isEditing ? (
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
                                                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M15 4.5L6.75 12.75L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                                                <span className={s.EmployeeMainInfo__value}>{formData[key] || "—"}</span>
                                                {isAdmin && (
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
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
