"use client";

import s from "./LeadItem.module.scss";
import { Lead } from "../../../../../features/lead/types";
import { formatLeadDate } from "@/features/auth/constants/format-lead-date";
import { useAuthStore } from "@/features/auth/store/authStore";
import { LEAD_STATUS_UI, maskEmail, maskPhone, useC2C } from "@/features";
import { ButtonComponentDefault } from "@/components/ButtonComponents";
import icon from "../../../assets/col.svg";
import iconYellow from "../../../assets/col-yellow.svg";
import Image from "next/image";
import classNames from "classnames";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Employee } from "@/features/auth/types";
import {
  AFFILIATOR_NAME_UI,
  AffiliatorName,
} from "@/features/affiliator/constants/affiliator.enum";
import { useRouter } from "next/navigation";
import selectStyles from "@/components/Select/Select.module.scss";

interface OwnerOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface Props {
  lead: Lead;
  activeLeads: string[];
  setActiveLeads: Dispatch<SetStateAction<string[]>>;
  employees: Employee[];
  /** When set, the Lead Owner cell becomes clickable to assign a team member (e.g. on Team Leads tab). */
  canChangeOwner?: boolean;
  ownerOptions?: OwnerOption[];
  onOwnerChange?: (leadId: string, newOwnerId: string) => void | Promise<void>;
  ownerChangeLoading?: boolean;
}

export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;

export function LeadItem({
  lead,
  activeLeads,
  setActiveLeads,
  employees,
  canChangeOwner,
  ownerOptions,
  onOwnerChange,
  ownerChangeLoading,
}: Props) {
  const { employee } = useAuthStore();
  const router = useRouter();
  const { call } = useC2C();
  const currentUser = useAuthStore((state) => state.employee);
  const isAdmin = currentUser && ADMIN_ROLES.includes(currentUser.role as any);
  const [ownerDropdownOpen, setOwnerDropdownOpen] = useState(false);
  const ownerCellRef = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    if (!ownerDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ownerCellRef.current && !ownerCellRef.current.contains(e.target as Node)) {
        setOwnerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ownerDropdownOpen]);

  const handleCall = async () => {
    if (!employee?.phone) return;
    try {
      await call(employee.phone, lead.phone);
    } catch (err: any) {
      console.error("Error calling:", err?.message || err);
    }
  };

  const handleCallSecondary = async () => {
    if (!employee?.phoneSecondary) return;
    try {
      await call(employee.phoneSecondary, lead.phone);
    } catch (err: any) {
      console.error("Error calling:", err?.message || err);
    }
  };

  const handleAddLeads = (id: string) => {
    setActiveLeads((prev) =>
      prev.includes(id) ? prev.filter((leadId) => leadId !== id) : [...prev, id]
    );
  };

  const handleOwnerSelect = async (newOwnerId: string) => {
    if (lead.leadOwnerId === newOwnerId) {
      setOwnerDropdownOpen(false);
      return;
    }
    await onOwnerChange?.(lead.id, newOwnerId);
    setOwnerDropdownOpen(false);
  };

  const leadOwner = lead.leadOwnerId
    ? employees.find((e) => e.id === lead.leadOwnerId)
    : null;
  const leadOwnerName = leadOwner
    ? `${leadOwner.firstName} ${leadOwner.lastName}`
    : "—";

  const leadAffiliatorsDisplay = lead.createdBy
    ? [employees.find((e) => e.id === lead.createdBy)]
    : (lead.leadAffiliates ?? []).map((la) =>
        employees.find((e) => e.id === la.affiliateId)
      );

  const affiliatorKeys: AffiliatorName[] = leadAffiliatorsDisplay.map((a) => {
    if (!a) return AffiliatorName.no;
    const fullName = `${a.firstName}${a.lastName}`;
    switch (fullName) {
      case AffiliatorName.LexoraCA_EN:
        return AffiliatorName.LexoraCA_EN;
      case AffiliatorName.LexoraCA_FR:
        return AffiliatorName.LexoraCA_FR;
      case AffiliatorName.LexoraFrench:
        return AffiliatorName.LexoraFrench;
      case AffiliatorName.BacaCA_EN:
        return AffiliatorName.BacaCA_EN;
      default:
        return AffiliatorName.no;
    }
  });

  const statusUi = LEAD_STATUS_UI[lead.status];

  const statusGlowRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  return (
    <tr className={s.LeadItem}>
      <td className={s.LeadItem__cell}>
        <span className={s.LeadItem__name}>
          {lead.firstName} {lead.lastName}
        </span>
      </td>
      <td className={s.LeadItem__cell}>
        <div className={s.LeadItem__phone}>
          <span>{isAdmin ? lead.phone : maskPhone(lead.phone)}</span>
          <span className={s.LeadItem__phoneHover}>
            {employee?.phone && (
              <button
                type="button"
                onClick={() => handleCall()}
                className={s.LeadItem__phoneBut}
                disabled={!lead.phone}
                aria-label="Call lead"
              >
                <Image src={icon} width={15} height={15} alt="" />
              </button>
            )}
            {employee?.phoneSecondary && (
              <button
                type="button"
                onClick={() => handleCallSecondary()}
                className={`${s.LeadItem__phoneBut} ${s.LeadItem__phoneBut_secondary}`}
                disabled={!lead.phone}
                aria-label="Call lead (second number)"
                title="Call using second number"
              >
                <Image src={iconYellow} width={15} height={15} alt="" />
              </button>
            )}
          </span>
        </div>
      </td>
      <td className={s.LeadItem__cell}>
        <span className={s.LeadItem__email}>{lead.email}</span>
      </td>
      <td className={s.LeadItem__cell}>
        <span className={s.LeadItem__txt}>
          {formatLeadDate(lead.createdAt)}
        </span>
      </td>
      <td className={s.LeadItem__cell} ref={ownerCellRef}>
        {canChangeOwner && ownerOptions && ownerOptions.length > 0 && onOwnerChange ? (
          <div className={s.LeadItem__ownerWrap}>
            <button
              type="button"
              className={classNames(s.LeadItem__ownerBtn, { [s.LeadItem__ownerBtn_open]: ownerDropdownOpen })}
              onClick={() => setOwnerDropdownOpen((v) => !v)}
              disabled={ownerChangeLoading}
              aria-expanded={ownerDropdownOpen}
              aria-haspopup="listbox"
              aria-label="Change lead owner"
            >
              <span className={s.LeadItem__owner}>{leadOwnerName}</span>
              <svg
                className={classNames(selectStyles.Select__chevron, { [selectStyles.Select__chevron_open]: ownerDropdownOpen })}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {ownerDropdownOpen && (
              <div className={s.LeadItem__ownerDropdown}>
                <div className={selectStyles.Select__dropdown}>
                  {ownerOptions.map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    className={selectStyles.Select__option}
                    disabled={ownerChangeLoading}
                    onClick={() => handleOwnerSelect(emp.id)}
                  >
                    {emp.firstName} {emp.lastName}
                  </button>
                ))}
              </div>
            </div>
            )}
          </div>
        ) : (
          <span className={s.LeadItem__owner}>{leadOwnerName}</span>
        )}
      </td>
      <td className={s.LeadItem__cell}>
        <span
          className={s.LeadItem__status}
          style={{
            backgroundColor: statusUi.bg,
            color: statusUi.text,
            ['--status-glow' as string]: statusGlowRgba(statusUi.bg, 0.4),
          }}
        >
          {statusUi.label}
        </span>
      </td>
      <td className={s.LeadItem__cell}>
        <div className={s.LeadItem__affiliator}>
          {affiliatorKeys.length === 0 && (
            <span className={s.LeadItem__blockMuted}>No</span>
          )}
          {affiliatorKeys.map((key, index) => {
            const ui = AFFILIATOR_NAME_UI[key];
            return (
              <span
                key={index}
                className={s.LeadItem__block}
                style={{
                  borderColor: ui.bg,
                  color: ui.bg,
                  ['--block-border' as string]: statusGlowRgba(ui.bg, 0.6),
                  ['--block-glow' as string]: statusGlowRgba(ui.bg, 0.45),
                }}
              >
                {key === AffiliatorName.no ? "No" : key}
              </span>
            );
          })}
        </div>
      </td>
      <td className={`${s.LeadItem__cell} ${s.LeadItem__cell_check}`}>
        <button
          type="button"
          onClick={() => handleAddLeads(String(lead.id))}
          className={classNames(s.LeadItem__click, {
            [s.LeadItem__click_active]: activeLeads.includes(lead.id),
          })}
          aria-label={activeLeads.includes(lead.id) ? "Deselect lead" : "Select lead"}
        >
          <span
            className={classNames(s.LeadItem__point, {
              [s.LeadItem__point_active]: activeLeads.includes(lead.id),
            })}
          />
        </button>
      </td>
      <td className={`${s.LeadItem__cell} ${s.LeadItem__cell_details}`}>
        <div className={s.LeadItem__detailsWrap}>
          <ButtonComponentDefault
            onClick={() => router.push(`/leads/${lead.id}`)}
            type="button"
            label="Details"
            backgroundColor="var(--color-btn-primary-bg)"
            color="var(--color-btn-primary-text)"
            iconPosition="left"
          />
        </div>
      </td>
    </tr>
  );
}
