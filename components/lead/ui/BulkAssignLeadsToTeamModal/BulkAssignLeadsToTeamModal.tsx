"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import iconClose from "../../assets/close.svg";
import m from "@/components/Modal/Modal.module.scss";
import { getTeams, bulkAssignLeadsToTeam } from "@/features/teams/api";
import { Select } from "@/components";

interface BulkAssignLeadsToTeamModalProps {
  leadIds: string[];
  setActiveLeads: (ids: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BulkAssignLeadsToTeamModal({
  leadIds,
  setActiveLeads,
  isOpen,
  onClose,
  onSuccess,
}: BulkAssignLeadsToTeamModalProps) {
  const [teams, setTeams] = useState<{ id: string; name: string; isActive: boolean }[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadTeams, setLoadTeams] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoadTeams(true);
    setError(null);
    setSelectedTeamId("");
    getTeams()
      .then((list) => setTeams(list.filter((t) => t.isActive)))
      .catch(() => setTeams([]))
      .finally(() => setLoadTeams(false));
  }, [isOpen]);

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
    if (!selectedTeamId || leadIds.length === 0) {
      setError("Please select a team.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await bulkAssignLeadsToTeam({ teamId: selectedTeamId, leadIds });
      setActiveLeads([]);
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      const res = err && typeof err === "object" && "response" in err ? (err as { response?: { data?: unknown } }).response : undefined;
      const data = res?.data;
      const msg =
        typeof data === "object" && data !== null && "message" in data
          ? String((data as { message: unknown }).message)
          : err instanceof Error
            ? err.message
            : "Assignment failed";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={m.Modal} role="dialog" aria-modal="true">
      <div className={m.Modal__backdrop} onClick={onClose} aria-hidden />
      <div className={m.Modal__content} onClick={(e) => e.stopPropagation()}>
        <div className={m.Modal__header}>
          <h3 className={m.Modal__title}>Assign {leadIds.length} lead{leadIds.length !== 1 ? "s" : ""} to team</h3>
          <button type="button" className={m.Modal__closeBtn} onClick={onClose} aria-label="Close">
            <Image src={iconClose} width={24} height={24} alt="close" />
          </button>
        </div>

        <div className={m.Modal__body}>
          <div className={m.Modal__field}>
            <label htmlFor="bulk-assign-team">Team</label>
            <Select
              id="bulk-assign-team"
              value={selectedTeamId}
              onChange={setSelectedTeamId}
              placeholder="— Select team —"
              options={teams.map((t) => ({ value: t.id, label: t.name }))}
              disabled={loadTeams}
              aria-label="Select team"
            />
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
            disabled={loading || !selectedTeamId || leadIds.length === 0}
          >
            {loading ? "Saving…" : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}
