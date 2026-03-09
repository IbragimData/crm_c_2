'use client'
import { ButtonComponentDefault, ButtonComponentMain } from "@/components/ButtonComponents";
import s from "./EmployeeUpdateStatus.module.scss"
import Image from "next/image";
import iconClose from "../../assets/close.svg"
import { useEffect, useState } from "react";
import { useUpdateEmployeeStatus } from "@/features/employees/hooks/useUpdateEmployeeStatus";
import { EmployeeStatus } from "@/features/auth/types";
import { EMPLOYEE_STATUS_UI } from "@/features/employees/constants/employee-status.enum";
interface Props {
    employeeId: string;
    currentStatus: EmployeeStatus;
    onClose: () => void;
    onStatusUpdated?: (newStatus: EmployeeStatus) => void;
}

export function EmployeeUpdateStatus({ employeeId, currentStatus, onClose, onStatusUpdated }: Props) {
    const [status, setStatus] = useState<EmployeeStatus>(currentStatus);
    const { updateStatus, loading, error } = useUpdateEmployeeStatus();

    // блокировка скролла при открытии
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, []);

    const handleSave = async () => {
        const updated = await updateStatus(employeeId, status as EmployeeStatus);
        if (updated) {
            onStatusUpdated?.(status);
            onClose();
        }
    };
    return (
        <div className={s.EmployeeUpdateStatus}>
            <div className={s.EmployeeUpdateStatus__content}>
                <div className={s.EmployeeUpdateStatus__header}>
                    <h3>Update employee status</h3>
                    <ButtonComponentMain onClick={onClose} icon={<Image src={iconClose} width={24} height={24} alt="ad" />} />
                </div>
                <div className={s.EmployeeUpdateStatus__list}>
                    {Object.values(EmployeeStatus).map((st) => {
                        const ui = EMPLOYEE_STATUS_UI[st];
                        return (
                            <label
                                key={st} className={s.EmployeeUpdateStatus__label} style={{
                                    backgroundColor: ui.bg,
                                    border: status == st ? `3px solid ${ui.text}` : "3px solid transparent"
                                }}>
                                <input
                                    type="radio"
                                    name="status"
                                    value={st}
                                    checked={status === st}
                                    onChange={() => setStatus(st)}
                                />
                                <p style={{ color: ui.text }}>{ui.label}</p>
                            </label>
                        );
                    })}
                    {error && <p className={s.error}>{error}</p>}
                </div>
                <div className={s.EmployeeUpdateStatus__buttons}>
                    <button onClick={onClose} className={s.EmployeeUpdateStatus__button}>
                        Save Unchanged
                    </button>
                    <ButtonComponentDefault
                        label="Save Status"
                        color="#ffffff"
                        backgroundColor="#3f8cff"
                        onClick={handleSave}
                    />
                </div>
            </div>
        </div>
    );
}