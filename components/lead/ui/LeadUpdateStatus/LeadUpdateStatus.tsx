"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { ButtonComponentDefault, ButtonComponentMain } from "@/components/ButtonComponents";
import s from "./LeadUpdateStatus.module.scss";
import iconClose from "../../assets/close.svg";

import { LeadStatus, LEAD_STATUS_UI, useUpdateLeadStatus } from "@/features";

interface Props {
  leadId: string;
  currentStatus: LeadStatus;
  onClose: () => void;
  onStatusUpdated?: (newStatus: LeadStatus) => void;
}

export function LeadUpdateStatus({ leadId, currentStatus, onClose, onStatusUpdated }: Props) {
  const [status, setStatus] = useState<LeadStatus>(currentStatus);
  const { updateStatus, loading, error } = useUpdateLeadStatus();

  // блокировка скролла при открытии модалки
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleSave = async () => {
    const updated = await updateStatus(leadId, status);
    if (updated) {
      onStatusUpdated?.(status);
      onClose();
    }
  };

  return (
    <div className={s.LeadUpdateStatus}>
      <div className={s.LeadUpdateStatus__content}>
        <div className={s.LeadUpdateStatus__header}>
          <h3>Update lead status</h3>
          <ButtonComponentMain
            onClick={onClose}
            icon={<Image src={iconClose} width={24} height={24} alt="close" />}
          />
        </div>

        <div className={s.LeadUpdateStatus__list}>
          {Object.values(LeadStatus).map((st) => {
            const ui = LEAD_STATUS_UI[st];
            return (
              <label 
              key={st} className={s.LeadUpdateStatus__label} style={{
                 backgroundColor: ui.bg ,
                  border: status == st ? `3px solid ${ui.text}`  : "3px solid transparent"
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

        <div className={s.LeadUpdateStatus__buttons}>
          <button onClick={onClose} className={s.LeadUpdateStatus__button}>
            Save Unchanged
          </button>
          <ButtonComponentDefault
            label="Save Status"
            color="#ffffff"
            backgroundColor="#3f8cff"
            onClick={handleSave}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
}