'use client'
import Link from "next/link";
import s from "./EmployeeLeadItem.module.scss"
import { ButtonComponentDefault } from "@/components/ButtonComponents";
import { Lead, LEAD_STATUS_UI, maskEmail } from "@/features";
import { Dispatch, SetStateAction } from "react";
import classNames from "classnames";
import { useRouter } from "next/navigation";
import { formatLeadDate } from "@/features/auth/constants/format-lead-date";
import { useAuthStore } from "@/features/auth/store/authStore";

export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;
interface Props {
    lead: Lead;
    activeLeads: string[];
    setActiveLeads: Dispatch<SetStateAction<string[]>>;
}
export function EmployeeLeadItem({ lead, activeLeads, setActiveLeads }: Props) {
    const router = useRouter()
    const handleAddLeads = (id: string) => {
        setActiveLeads(prev =>
            prev.includes(id)
                ? prev.filter(leadId => leadId !== id)
                : [...prev, id]
        );
    };

    const currentUser = useAuthStore((state) => state.employee);
    const isAdmin =
        currentUser && ADMIN_ROLES.includes(currentUser.role as any);

    return (
        <div className={s.EmployeeLeadItem}>
            <div className={s.EmployeeLeadItem__content}>
                <p className={s.EmployeeLeadItem__text}>Lead Name</p>
                <p className={s.EmployeeLeadItem__name}>{lead.firstName} {lead.lastName}</p>
            </div>

            <div className={s.EmployeeLeadItem__content}>
                <p className={s.EmployeeLeadItem__text}>email</p>
                <p className={s.EmployeeLeadItem__email}>
                    {isAdmin ? lead.email : maskEmail(lead.email)}
                </p>
            </div>
            <div className={s.EmployeeLeadItem__content}>
                <p className={s.EmployeeLeadItem__text}>Сreate Data</p>
                <p className={s.EmployeeLeadItem__txt}>
                    {formatLeadDate(lead.createdAt.toLocaleString())}
                </p>
            </div>

            <div className={s.EmployeeLeadItem__content}>
                <p className={s.EmployeeLeadItem__text}>Status</p>
                <span
                    className={s.EmployeeLeadItem__status}
                    style={{
                        backgroundColor: LEAD_STATUS_UI[lead.status].bg,
                        color: LEAD_STATUS_UI[lead.status].text,
                    }}
                >
                    {LEAD_STATUS_UI[lead.status].label}
                </span>
            </div>
            <ButtonComponentDefault
                onClick={() => router.push(`/leads/${lead.id}`)}
                type="submit"
                label={"Details"}
                backgroundColor="#00f5ff"
                color="#FFFFFF"
                iconPosition="left"
            />
        </div>
    );
}