"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import iconClose from "@/components/lead/assets/close.svg";
import { patchEmployeePassword } from "@/features/employees/api";
import type { Employee } from "@/features/auth/types";
import m from "@/components/Modal/Modal.module.scss";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  onSuccess?: (updated: Employee) => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  employee,
  onSuccess,
}: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      reset();
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen, reset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newPassword.trim()) {
      setError("Enter new password.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const updated = await patchEmployeePassword(employee.id, { newPassword: newPassword.trim() });
      handleClose();
      onSuccess?.(updated);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error ? err.message : "Failed to change password.";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={m.Modal} role="dialog" aria-modal="true" aria-labelledby="change-password-title">
      <div className={m.Modal__backdrop} onClick={handleClose} aria-hidden />
      <div className={m.Modal__content} onClick={(e) => e.stopPropagation()}>
        <div className={m.Modal__header}>
          <h3 id="change-password-title" className={m.Modal__title}>
            Change password — {employee.firstName} {employee.lastName}
          </h3>
          <button type="button" className={m.Modal__closeBtn} onClick={handleClose} aria-label="Close">
            <Image src={iconClose} width={24} height={24} alt="" />
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className={m.Modal__body}>
            <div className={m.Modal__field}>
              <label htmlFor="new-password">New password *</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                autoComplete="new-password"
              />
            </div>
            <div className={m.Modal__field}>
              <label htmlFor="confirm-password">Confirm password *</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
              />
            </div>
            {error && <p className={m.Modal__error}>{error}</p>}
          </div>
          <div className={m.Modal__actions}>
            <button type="button" className={m.Modal__cancel} onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className={m.Modal__submit} disabled={loading}>
              {loading ? "Saving…" : "Change password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
