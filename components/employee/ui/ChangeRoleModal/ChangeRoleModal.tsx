"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import iconClose from "@/components/lead/assets/close.svg";
import { patchEmployeeRole } from "@/features/employees/api";
import type { Employee, Role } from "@/features/auth/types";
import { roleLabels } from "@/features/employees/constants";
import { Select } from "@/components";
import m from "@/components/Modal/Modal.module.scss";

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  allowedRoles: Role[];
  onSuccess?: (updated: Employee) => void;
}

export function ChangeRoleModal({
  isOpen,
  onClose,
  employee,
  allowedRoles,
  onSuccess,
}: ChangeRoleModalProps) {
  const [role, setRole] = useState<Role>(employee.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setRole(employee.role);
    setError(null);
  }, [employee.role]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setRole(employee.role);
      setError(null);
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen, employee.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (role === employee.role) {
      handleClose();
      return;
    }
    setLoading(true);
    try {
      const updated = await patchEmployeeRole(employee.id, { role });
      handleClose();
      onSuccess?.(updated);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error ? err.message : "Failed to change role.";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const options = allowedRoles.map((r) => ({ value: r, label: roleLabels[r] ?? r }));

  return (
    <div className={m.Modal} role="dialog" aria-modal="true" aria-labelledby="change-role-title">
      <div className={m.Modal__backdrop} onClick={handleClose} aria-hidden />
      <div className={m.Modal__content} onClick={(e) => e.stopPropagation()}>
        <div className={m.Modal__header}>
          <h3 id="change-role-title" className={m.Modal__title}>
            Change role — {employee.firstName} {employee.lastName}
          </h3>
          <button type="button" className={m.Modal__closeBtn} onClick={handleClose} aria-label="Close">
            <Image src={iconClose} width={24} height={24} alt="" />
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className={m.Modal__body}>
            <div className={m.Modal__field}>
              <label htmlFor="role-select">Role</label>
              <Select
                id="role-select"
                value={role}
                onChange={(v) => setRole(v as Role)}
                options={options}
                aria-label="Select role"
              />
            </div>
            {error && <p className={m.Modal__error}>{error}</p>}
          </div>
          <div className={m.Modal__actions}>
            <button type="button" className={m.Modal__cancel} onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className={m.Modal__submit} disabled={loading || role === employee.role}>
              {loading ? "Saving…" : "Change role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
