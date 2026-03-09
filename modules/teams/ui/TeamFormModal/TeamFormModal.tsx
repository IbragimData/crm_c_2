"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import iconClose from "@/components/lead/assets/close.svg";
import { createTeam, updateTeam } from "@/features/teams/api";
import type { TeamApi } from "@/config/api-types";
import m from "@/components/Modal/Modal.module.scss";

export interface TeamFormValues {
  name: string;
  isActive: boolean;
}

interface TeamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "create" | "edit";
  team?: TeamApi | null;
}

const initialForm: TeamFormValues = { name: "", isActive: true };

export function TeamFormModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  team = null,
}: TeamFormModalProps) {
  const [form, setForm] = useState<TeamFormValues>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setForm(
      mode === "edit" && team
        ? { name: team.name, isActive: team.isActive }
        : initialForm
    );
    setError(null);
  }, [mode, team]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (mode === "edit" && team) {
        setForm({ name: team.name, isActive: team.isActive });
      } else {
        setForm(initialForm);
      }
      setError(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, mode, team]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const name = form.name.trim();
    if (!name) {
      setError("Please enter team name.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "create") {
        await createTeam({ name, isActive: form.isActive });
      } else if (team?.id) {
        await updateTeam(team.id, { name, isActive: form.isActive });
      }
      handleClose();
      onSuccess();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data
              ?.message
          : err instanceof Error
            ? err.message
            : "Save failed";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const title = mode === "create" ? "Create team" : "Edit team";

  return (
    <div
      className={m.Modal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-form-title"
    >
      <div className={m.Modal__backdrop} onClick={handleClose} aria-hidden />
      <div className={m.Modal__content} onClick={(e) => e.stopPropagation()}>
        <div className={m.Modal__header}>
          <h3 id="team-form-title" className={m.Modal__title}>{title}</h3>
          <button
            type="button"
            className={m.Modal__closeBtn}
            onClick={handleClose}
            aria-label="Close"
          >
            <Image src={iconClose} width={24} height={24} alt="" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className={m.Modal__body}>
            <div className={m.Modal__field}>
              <label htmlFor="team-form-name">Name *</label>
              <input
                id="team-form-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Sales Team A"
                autoComplete="off"
              />
            </div>
            <div className={m.Modal__field}>
              <label className={m.Modal__checkboxWrap}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                />
                <span>Active</span>
              </label>
            </div>

            {error && <p className={m.Modal__error}>{error}</p>}
          </div>

          <div className={m.Modal__actions}>
            <button
              type="button"
              className={m.Modal__cancel}
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={m.Modal__submit}
              disabled={loading}
            >
              {loading ? "Saving…" : mode === "create" ? "Create" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
