'use client';

import Image from "next/image";
import s from "./LeadHistoryRow.module.scss";
import { LeadHistory, LEAD_STATUS_UI, LeadStatus, useEmployeesStore } from "@/features";
import { getHistoryVisual } from "@/features/history/constants";
import { formatLeadDate } from "@/features/auth/constants/format-lead-date";

interface LeadHistoryRowProps {
  history: LeadHistory;
}

function formatActionLabel(action: string): string {
  return action.split("_").map(w => w[0] + w.slice(1).toLowerCase()).join(" ");
}

export function LeadHistoryRow({ history }: LeadHistoryRowProps) {
  const { employees } = useEmployeesStore();
  const { icon, blockColor } = getHistoryVisual(history.action);
  const changedBy = history.changedBy ? employees.find(e => e.id === history.changedBy) : null;
  const changedByName = changedBy ? `${changedBy.firstName} ${changedBy.lastName}` : "—";
  const dateStr = formatLeadDate(history.createdAt);
  const title = formatActionLabel(history.action);

  const renderBody = () => {
    switch (history.action) {
      case "STATUS_CHANGED": {
        const oldS = history.oldValue as LeadStatus | undefined;
        const newS = history.newValue as LeadStatus | undefined;
        const oldLabel = oldS && LEAD_STATUS_UI[oldS] ? LEAD_STATUS_UI[oldS].label : String(history.oldValue ?? "—");
        const newLabel = newS && LEAD_STATUS_UI[newS] ? LEAD_STATUS_UI[newS].label : String(history.newValue ?? "—");
        return (
          <div className={s.LeadHistoryRow__body}>
            <span className={s.LeadHistoryRow__meta}>Now</span>
            <span
              className={s.LeadHistoryRow__badge}
              style={newS && LEAD_STATUS_UI[newS] ? { backgroundColor: LEAD_STATUS_UI[newS].bg, color: LEAD_STATUS_UI[newS].text } : undefined}
            >
              {newLabel}
            </span>
            <span className={s.LeadHistoryRow__arrow}>←</span>
            <span className={s.LeadHistoryRow__meta}>Was</span>
            <span
              className={s.LeadHistoryRow__badge}
              style={oldS && LEAD_STATUS_UI[oldS] ? { backgroundColor: LEAD_STATUS_UI[oldS].bg, color: LEAD_STATUS_UI[oldS].text } : undefined}
            >
              {oldLabel}
            </span>
          </div>
        );
      }

      case "OWNER_CHANGED": {
        const oldOwner = history.oldValue ? employees.find(e => e.id === history.oldValue) : null;
        const newOwner = history.newValue ? employees.find(e => e.id === history.newValue) : null;
        const oldName = oldOwner ? `${oldOwner.firstName} ${oldOwner.lastName}` : String(history.oldValue ?? "—");
        const newName = newOwner ? `${newOwner.firstName} ${newOwner.lastName}` : String(history.newValue ?? "—");
        return (
          <div className={s.LeadHistoryRow__body}>
            <span className={s.LeadHistoryRow__meta}>Now</span>
            <span className={s.LeadHistoryRow__value}>{newName}</span>
            <span className={s.LeadHistoryRow__arrow}>←</span>
            <span className={s.LeadHistoryRow__meta}>Was</span>
            <span className={s.LeadHistoryRow__value}>{oldName}</span>
          </div>
        );
      }

      case "FIELD_UPDATED":
        return (
          <div className={s.LeadHistoryRow__bodyField}>
            {history.field && (
              <span className={s.LeadHistoryRow__fieldName}>{history.field}</span>
            )}
            <div className={s.LeadHistoryRow__wasNow}>
              <div className={s.LeadHistoryRow__wasNowBlock}>
                <span className={s.LeadHistoryRow__meta}>Was:</span>
                <div className={s.LeadHistoryRow__valueFull}>{String(history.oldValue ?? "—")}</div>
              </div>
              <div className={s.LeadHistoryRow__wasNowBlock}>
                <span className={s.LeadHistoryRow__meta}>Now:</span>
                <div className={s.LeadHistoryRow__valueFull}>{String(history.newValue ?? "—")}</div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={s.LeadHistoryRow} style={{ borderLeftColor: blockColor }}>
      <div className={s.LeadHistoryRow__icon}>
        <Image src={icon} width={18} height={18} alt="" />
      </div>
      <div className={s.LeadHistoryRow__main}>
        <div className={s.LeadHistoryRow__top}>
          <span className={s.LeadHistoryRow__title}>{title}</span>
          <span className={s.LeadHistoryRow__date}>{dateStr}</span>
        </div>
        {renderBody()}
        <div className={s.LeadHistoryRow__by}>
          Changed by: <span className={s.LeadHistoryRow__byName}>{changedByName}</span>
        </div>
      </div>
    </div>
  );
}
