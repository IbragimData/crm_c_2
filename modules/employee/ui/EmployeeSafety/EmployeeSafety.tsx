"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ButtonComponentDefault, InputComponentTextDefault } from "@/components";
import { patchEmployeePassword, deleteEmployee } from "@/features/employees/api";
import type { Employee } from "@/features/auth/types";
import s from "./EmployeeSafety.module.scss";

interface EmployeeSafetyProps {
  employee: Employee;
  setEmployee: (e: Employee) => void;
  canChangePassword: boolean;
  /** Only SUPER_ADMIN can delete employees. */
  canDelete?: boolean;
}

export function EmployeeSafety({ employee, setEmployee, canChangePassword, canDelete }: EmployeeSafetyProps) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!canChangePassword) return;
    if (!newPassword.trim()) {
      setError("Enter new password.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== repeatPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const updated = await patchEmployeePassword(employee.id, { newPassword: newPassword.trim() });
      setEmployee({ ...employee, ...updated });
      setNewPassword("");
      setRepeatPassword("");
      setSuccess(true);
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

  const handleDelete = async () => {
    if (!canDelete) return;
    const fullName = [employee.firstName, employee.lastName].filter(Boolean).join(" ") || "this employee";
    if (!confirm(`Delete ${fullName}? This will soft-delete the employee (isDeleted: true). This action is only for SUPER_ADMIN.`)) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteEmployee(employee.id);
      router.push("/employees");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error ? err.message : "Failed to delete employee.";
      setDeleteError(String(msg));
    } finally {
      setDeleting(false);
    }
  };

  if (!canChangePassword) {
    return (
      <div className={s.EmployeeSafety}>
        <div className={s.EmployeeSafety__content}>
          <h2 className={s.EmployeeSafety__title}>Password</h2>
          <p className={s.EmployeeSafety__text}>You do not have permission to change this employee&apos;s password.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={s.EmployeeSafety}>
      <div className={s.EmployeeSafety__content}>
        <h2 className={s.EmployeeSafety__title}>Password</h2>
        <form onSubmit={handleSubmit} className={s.EmployeeSafety__block}>
          <div className={s.EmployeeSafety__inputs}>
            <div style={{ width: "100%" }}>
              <InputComponentTextDefault
                label="New password"
                placeholder="Min 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
              />
            </div>
            <div style={{ width: "100%" }}>
              <InputComponentTextDefault
                label="Repeat password"
                placeholder="Repeat password"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
              />
            </div>
          </div>
          {error && <p className={s.EmployeeSafety__error}>{error}</p>}
          {success && <p className={s.EmployeeSafety__success}>Password updated.</p>}
          <div className={s.EmployeeSafety__buttons}>
            <ButtonComponentDefault
              type="submit"
              label={loading ? "Saving…" : "Save changes"}
              color="var(--color-btn-primary-text)"
              backgroundColor="var(--color-btn-primary-bg)"
              disabled={loading || !newPassword || newPassword !== repeatPassword || newPassword.length < 6}
            />
          </div>
        </form>
      </div>

      {canDelete && (
        <div className={s.EmployeeSafety__content} style={{ marginTop: 32 }}>
          <h2 className={s.EmployeeSafety__title}>Delete employee</h2>
          <p className={s.EmployeeSafety__text}>
            Only SUPER_ADMIN can delete employees. This will soft-delete the account (isDeleted: true).
          </p>
          {deleteError && <p className={s.EmployeeSafety__error}>{deleteError}</p>}
          <div className={s.EmployeeSafety__buttons} style={{ marginTop: 16 }}>
            <button
              type="button"
              className={s.EmployeeSafety__deleteBtn}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete employee"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
