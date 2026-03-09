"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import iconClose from "@/components/lead/assets/close.svg";
import { createLeadAssignment } from "@/features/teams/api";
import { getLeads } from "@/features/lead/api/leads";
import type { Lead } from "@/features/lead/types";
import m from "@/components/Modal/Modal.module.scss";
import { Select } from "@/components";

interface AssignLeadToTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamId: string;
  excludeLeadIds: string[];
}

export function AssignLeadToTeamModal({
  isOpen,
  onClose,
  onSuccess,
  teamId,
  excludeLeadIds,
}: AssignLeadToTeamModalProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadId, setLeadId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadLeads, setLoadLeads] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoadLeads(true);
    getLeads({ take: 500 })
      .then((res) => {
        const list = res.items ?? [];
        setLeads(list.filter((l) => !excludeLeadIds.includes(l.id)));
      })
      .catch(() => setLeads([]))
      .finally(() => setLoadLeads(false));
    setLeadId("");
    setError(null);
  }, [isOpen, excludeLeadIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId.trim()) {
      setError("Please select a lead.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await createLeadAssignment({ leadId, teamId });
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error ? err.message : "Assignment failed";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={m.Modal} role="dialog" aria-modal="true">
      <div className={m.Modal__backdrop} onClick={onClose} aria-hidden />
      <div className={m.Modal__content} onClick={(e) => e.stopPropagation()}>
        <div className={m.Modal__header}>
          <h3 className={m.Modal__title}>Assign lead to team</h3>
          <button type="button" className={m.Modal__closeBtn} onClick={onClose} aria-label="Close">
            <Image src={iconClose} width={24} height={24} alt="" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={m.Modal__body}>
            <div className={m.Modal__field}>
              <label htmlFor="assign-lead-select">Lead *</label>
              <Select
                id="assign-lead-select"
                value={leadId}
                onChange={setLeadId}
                placeholder="— Select lead —"
                options={leads.map((lead) => ({
                  value: lead.id,
                  label: `${lead.firstName} ${lead.lastName} — ${lead.phone}`,
                }))}
                disabled={loadLeads}
              />
            </div>
            {error && <p className={m.Modal__error}>{error}</p>}
          </div>
          <div className={m.Modal__actions}>
            <button type="button" className={m.Modal__cancel} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={m.Modal__submit} disabled={loading || loadLeads}>
              {loading ? "Assigning…" : "Assign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
