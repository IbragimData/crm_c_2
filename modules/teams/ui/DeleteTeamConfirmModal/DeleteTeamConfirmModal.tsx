"use client";

import { useState } from "react";
import Image from "next/image";
import iconClose from "@/components/lead/assets/close.svg";
import { deleteTeam } from "@/features/teams/api";
import m from "@/components/Modal/Modal.module.scss";

interface DeleteTeamConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamId: string;
  teamName: string;
}

export function DeleteTeamConfirmModal({
  isOpen,
  onClose,
  onSuccess,
  teamId,
  teamName,
}: DeleteTeamConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);
    try {
      await deleteTeam(teamId);
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data
              ?.message
          : err instanceof Error
            ? err.message
            : "Failed to delete team";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={m.Modal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-team-title"
    >
      <div className={m.Modal__backdrop} onClick={onClose} aria-hidden />
      <div
        className={m.Modal__content}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={m.Modal__header}>
          <h3 id="delete-team-title" className={m.Modal__title}>Delete team?</h3>
          <button
            type="button"
            className={m.Modal__closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <Image src={iconClose} width={24} height={24} alt="" />
          </button>
        </div>
        <p className={m.Modal__text}>
          Team «{teamName}» will be permanently deleted. This action cannot be undone.
        </p>
        {error && <p className={m.Modal__error}>{error}</p>}
        <div className={m.Modal__actions}>
          <button
            type="button"
            className={m.Modal__cancel}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={m.Modal__submitDanger}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
