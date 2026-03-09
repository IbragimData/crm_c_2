"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import s from "./BulkUpdateLeadsStatus.module.scss";
import m from "@/components/Modal/Modal.module.scss";
import iconClose from "../../assets/close.svg";

import { LeadStatus, LEAD_STATUS_UI, Lead } from "@/features";
import { useBulkUpdateLeadsStatus } from "@/features/lead/hooks/useBulkUpdateLeadsStatus";

interface Props {
  leadIds: string[];
  setActiveLeads: (e: string[]) => void
  isOpen: boolean;
  onClose: () => void;
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>
}

export function BulkUpdateLeadsStatus({
  leadIds,
  isOpen,
  onClose,
  setActiveLeads,
  setLeads
}: Props) {
  const [status, setStatus] = useState<LeadStatus>(LeadStatus.NEW);

  const { assign, loading, error } = useBulkUpdateLeadsStatus();
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const result = await assign(leadIds, status);

    if (result) {
      setLeads((prev) =>
        prev.map((lead) =>
          leadIds.includes(lead.id) ? { ...lead, status } : lead
        )
      );
      setStatus(LeadStatus.NEW)
      setActiveLeads([])
      onClose();
    }
  };


  return (
    <div className={m.Modal} role="dialog" aria-modal="true">
      <div className={m.Modal__backdrop} onClick={onClose} aria-hidden />
      <div className={m.Modal__content} onClick={(e) => e.stopPropagation()}>
        <div className={m.Modal__header}>
          <h3 className={m.Modal__title}>Update lead status</h3>
          <button
            type="button"
            className={m.Modal__closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <Image src={iconClose} width={24} height={24} alt="" />
          </button>
        </div>

        <div className={m.Modal__body}>
          <div className={s.BulkUpdateLeadsStatus__list}>
            {Object.values(LeadStatus).map((st) => {
              const ui = LEAD_STATUS_UI[st];
              return (
                <label
                  key={st}
                  className={s.BulkUpdateLeadsStatus__label}
                  style={{
                    backgroundColor: ui.bg,
                    border:
                      status === st
                        ? `3px solid ${ui.text}`
                        : "3px solid transparent",
                  }}
                >
                  <input
                    type="radio"
                    name="status"
                    value={st}
                    checked={status === st}
                    onChange={() => setStatus(st)}
                  />
                  <span style={{ color: ui.text }}>{ui.label}</span>
                </label>
              );
            })}
          </div>
          {error && <p className={m.Modal__error}>{error}</p>}
        </div>

        <div className={m.Modal__actions}>
          <button type="button" className={m.Modal__cancel} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={m.Modal__submit}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving…" : "Save status"}
          </button>
        </div>
      </div>
    </div>
  );
}