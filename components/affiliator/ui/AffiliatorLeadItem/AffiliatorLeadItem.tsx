'use client'
import Link from "next/link";
import s from "./AffiliatorLeadItem.module.scss"
import { Lead, LEAD_STATUS_UI, maskEmail } from "@/features";
import { Dispatch, SetStateAction } from "react";
import classNames from "classnames";
import { formatLeadDate } from "@/features/auth/constants/format-lead-date";
import { useAuthStore } from "@/features/auth/store/authStore";

export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;
interface Props {
    lead: Lead;
    activeLeads: string[];
    setActiveLeads: Dispatch<SetStateAction<string[]>>;
}
export function AffiliatorLeadItem({ lead, activeLeads, setActiveLeads }: Props) {
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
        <div className={s.ProjectLeadItem}>
            <div className={s.ProjectLeadItem__content}>
                <p className={s.ProjectLeadItem__text}>Lead Name</p>
                <p className={s.ProjectLeadItem__name}>{lead.firstName} {lead.lastName}</p>
            </div>

            <div className={s.ProjectLeadItem__content}>
                <p className={s.ProjectLeadItem__text}>email</p>
                <p className={s.ProjectLeadItem__email}>
                    {isAdmin ? lead.email : maskEmail(lead.email)}
                </p>
            </div>
            <div className={s.ProjectLeadItem__content}>
                <p className={s.ProjectLeadItem__text}>Create Date</p>
                <p className={s.ProjectLeadItem__txt}>
                    {formatLeadDate(lead.createdAt.toLocaleString())}
                </p>
            </div>

            <div className={s.ProjectLeadItem__content}>
                <p className={s.ProjectLeadItem__text}>Status</p>
                <span
                    className={s.ProjectLeadItem__status}
                    style={{
                        backgroundColor: LEAD_STATUS_UI[lead.status].bg,
                        color: LEAD_STATUS_UI[lead.status].text,
                    }}
                >
                    {LEAD_STATUS_UI[lead.status].label}
                </span>

            </div>
            <div onClick={() => handleAddLeads(String(lead.id))} className={classNames(s.ProjectLeadItem__click, {
                [s.ProjectLeadItem__click_active]: activeLeads.includes(lead.id)
            })}>
                <div className={classNames(s.ProjectLeadItem__point, {
                    [s.ProjectLeadItem__point_active]: activeLeads.includes(lead.id)
                })}>

                </div>
            </div>
        </div>
    );
}