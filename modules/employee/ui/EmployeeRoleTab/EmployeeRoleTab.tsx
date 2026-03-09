"use client";

import { useState } from "react";
import { patchEmployeeRole } from "@/features/employees/api";
import type { Employee, Role } from "@/features/auth/types";
import { roleLabels } from "@/features/employees/constants";
import { Select } from "@/components";
import s from "./EmployeeRoleTab.module.scss";

interface EmployeeRoleTabProps {
  employee: Employee;
  setEmployee: (e: Employee) => void;
  allowedRoles: Role[];
}

export function EmployeeRoleTab({ employee, setEmployee, allowedRoles }: EmployeeRoleTabProps) {
  const [role, setRole] = useState<Role>(employee.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const options = allowedRoles.map((r) => ({ value: r, label: roleLabels[r] ?? r }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (role === employee.role) return;
    setLoading(true);
    try {
      const updated = await patchEmployeeRole(employee.id, { role });
      setEmployee({ ...employee, ...updated });
      setSuccess(true);
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

  return (
    <div className={s.EmployeeRoleTab}>
      <div className={s.EmployeeRoleTab__content}>
        <h2 className={s.EmployeeRoleTab__title}>Role</h2>
        <form onSubmit={handleSubmit} className={s.EmployeeRoleTab__block}>
          <div className={s.EmployeeRoleTab__field}>
            <label htmlFor="role-select">Role</label>
            <Select
              id="role-select"
              value={role}
              onChange={(v) => setRole(v as Role)}
              options={options}
              aria-label="Select role"
            />
          </div>
          {error && <p className={s.EmployeeRoleTab__error}>{error}</p>}
          {success && <p className={s.EmployeeRoleTab__success}>Role updated.</p>}
          <div className={s.EmployeeRoleTab__actions}>
            <button
              type="submit"
              className={s.EmployeeRoleTab__submit}
              disabled={loading || role === employee.role}
            >
              {loading ? "Saving…" : "Save role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
