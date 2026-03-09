"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
import iconClose from "@/components/lead/assets/close.svg";
import { createEmployee } from "@/features/employees/api";
import { Role } from "@/features/auth/types";
import { EmployeeStatus } from "@/features/auth/types";
import { roleLabels } from "@/features/employees/constants";
import { useAuthStore } from "@/features/auth/store/authStore";
import m from "@/components/Modal/Modal.module.scss";
import { Select } from "@/components";

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ALL_ROLES: Role[] = Object.values(Role);
const ROLES_ADMIN_CAN_CREATE: Role[] = [Role.USER, Role.AGENT, Role.TEAMLEADER, Role.LEADMANAGER];

const initialForm = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  role: Role.AGENT,
  status: EmployeeStatus.ACTIVE,
  phone: "",
  phoneSecondary: "",
  telegramUsername: "",
  department: "",
  hiredAt: "",
};

export function CreateEmployeeModal({ isOpen, onClose, onSuccess }: CreateEmployeeModalProps) {
  const currentUser = useAuthStore((state) => state.employee);
  const allowedRoles = useMemo(() => {
    if (!currentUser) return ROLES_ADMIN_CAN_CREATE;
    if (currentUser.role === Role.SUPER_ADMIN) return ALL_ROLES;
    return ROLES_ADMIN_CAN_CREATE;
  }, [currentUser]);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setForm(initialForm);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.email.trim() || !form.password.trim() || !form.firstName.trim() || !form.lastName.trim()) {
      setError("Email, password, first name and last name are required.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await createEmployee({
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        role: form.role,
        status: form.status,
        phone: form.phone.trim() || undefined,
        phoneSecondary: form.phoneSecondary.trim() || undefined,
        telegramUsername: form.telegramUsername.trim() || undefined,
        department: form.department.trim() || undefined,
        hiredAt: form.hiredAt.trim() || undefined,
      });
      handleClose();
      onSuccess?.();
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : err instanceof Error ? err.message : "Failed to create employee.";
      setError(String(message));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={m.Modal} role="dialog" aria-modal="true" aria-labelledby="create-employee-title">
      <div className={m.Modal__backdrop} onClick={handleClose} aria-hidden />
      <div className={m.Modal__content} onClick={(e) => e.stopPropagation()}>
        <div className={m.Modal__header}>
          <h3 id="create-employee-title" className={m.Modal__title}>Create new employee</h3>
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
              <label htmlFor="create-emp-email">Email *</label>
              <input
                id="create-emp-email"
                type="text"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Email or login"
              />
            </div>
            <div className={m.Modal__field}>
              <label htmlFor="create-emp-password">Password *</label>
              <input
                id="create-emp-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Min 6 characters"
                autoComplete="new-password"
              />
            </div>
            <div className={m.Modal__field}>
              <label htmlFor="create-emp-firstName">First name *</label>
              <input
                id="create-emp-firstName"
                type="text"
                value={form.firstName}
                onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                placeholder="First name"
              />
            </div>
            <div className={m.Modal__field}>
              <label htmlFor="create-emp-lastName">Last name *</label>
              <input
                id="create-emp-lastName"
                type="text"
                value={form.lastName}
                onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                placeholder="Last name"
              />
            </div>
            <div className={m.Modal__field}>
              <label htmlFor="create-emp-role">Role *</label>
              <Select
                id="create-emp-role"
                value={form.role}
                onChange={(v) => setForm((p) => ({ ...p, role: v as Role }))}
                options={allowedRoles.map((r) => ({ value: r, label: roleLabels[r] ?? r }))}
              />
            </div>
            <div className={m.Modal__field}>
              <label htmlFor="create-emp-status">Status</label>
              <Select
                id="create-emp-status"
                value={form.status}
                onChange={(v) => setForm((p) => ({ ...p, status: v as EmployeeStatus }))}
                options={[
                  { value: EmployeeStatus.ACTIVE, label: "Active" },
                  { value: EmployeeStatus.ON_LEAVE, label: "On Leave" },
                  { value: EmployeeStatus.SICK, label: "Sick" },
                  { value: EmployeeStatus.FIRED, label: "Fired" },
                ]}
              />
            </div>
            <div className={m.Modal__field}>
              <label htmlFor="create-emp-hiredAt">Hired date</label>
              <input
                id="create-emp-hiredAt"
                type="date"
                value={form.hiredAt}
                onChange={(e) => setForm((p) => ({ ...p, hiredAt: e.target.value }))}
              />
            </div>
            <div className={m.Modal__field}>
              <label htmlFor="create-emp-department">Department</label>
              <input
                id="create-emp-department"
                type="text"
                value={form.department}
                onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className={m.Modal__field}>
              <label htmlFor="create-emp-phone">Phone</label>
              <input
                id="create-emp-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className={m.Modal__field}>
              <label htmlFor="create-emp-phoneSecondary">Second phone</label>
              <input
                id="create-emp-phoneSecondary"
                type="tel"
                value={form.phoneSecondary}
                onChange={(e) => setForm((p) => ({ ...p, phoneSecondary: e.target.value }))}
                placeholder="Optional — used for second call button"
              />
            </div>
            <div className={m.Modal__field}>
              <label htmlFor="create-emp-telegram">Telegram</label>
              <input
                id="create-emp-telegram"
                type="text"
                value={form.telegramUsername}
                onChange={(e) => setForm((p) => ({ ...p, telegramUsername: e.target.value }))}
                placeholder="Optional"
              />
            </div>

            {error && <p className={m.Modal__error}>{error}</p>}
          </div>

          <div className={m.Modal__actions}>
            <button type="button" className={m.Modal__cancel} onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className={m.Modal__submit} disabled={loading}>
              {loading ? "Creating…" : "Create employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
