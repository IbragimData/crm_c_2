"use client";

import { Lead } from "@/features/lead/types";
import { LEAD_STATUS_UI, maskEmail, maskPhone } from "@/features";
import { ButtonComponentDefault } from "@/components/ButtonComponents";
import { formatLeadDate } from "@/features/auth/constants/format-lead-date";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useRouter } from "next/navigation";
import s from "./EmployeeLeadTableRow.module.scss";

export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;

interface Props {
  lead: Lead;
  activeLeads: string[];
  setActiveLeads: React.Dispatch<React.SetStateAction<string[]>>;
}

export function EmployeeLeadTableRow({ lead, activeLeads, setActiveLeads }: Props) {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.employee);
  const isAdmin = currentUser && ADMIN_ROLES.includes(currentUser.role as any);
  const statusUi = LEAD_STATUS_UI[lead.status];

  const handleToggle = () => {
    setActiveLeads((prev) =>
      prev.includes(lead.id) ? prev.filter((id) => id !== lead.id) : [...prev, lead.id]
    );
  };

  return (
    <tr className={s.row}>
      <td className={`${s.cell} ${s.cell_check}`}>
        <button
          type="button"
          onClick={handleToggle}
          className={s.check}
          aria-label={activeLeads.includes(lead.id) ? "Deselect lead" : "Select lead"}
        >
          <span className={activeLeads.includes(lead.id) ? s.check_active : ""} />
        </button>
      </td>
      <td className={s.cell}>
        <span className={s.name}>
          {lead.firstName} {lead.lastName}
        </span>
      </td>
      <td className={s.cell}>
        <span className={s.phone}>
          {isAdmin ? lead.phone : maskPhone(lead.phone)}
        </span>
      </td>
      <td className={s.cell}>
        <span className={s.email}>
          {isAdmin ? lead.email : maskEmail(lead.email)}
        </span>
      </td>
      <td className={s.cell}>
        <span className={s.txt}>
          {formatLeadDate(lead.createdAt.toLocaleString())}
        </span>
      </td>
      <td className={s.cell}>
        <span
          className={s.status}
          style={{
            backgroundColor: statusUi.bg,
            color: statusUi.text,
          }}
        >
          {statusUi.label}
        </span>
      </td>
      <td className={`${s.cell} ${s.cell_details}`}>
        <ButtonComponentDefault
          onClick={() => router.push(`/leads/${lead.id}`)}
          type="button"
          label="Details"
          backgroundColor="var(--color-btn-primary-bg)"
          color="var(--color-btn-primary-text)"
          iconPosition="left"
        />
      </td>
    </tr>
  );
}
