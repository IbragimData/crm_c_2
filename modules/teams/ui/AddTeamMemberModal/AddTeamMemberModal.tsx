"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import iconClose from "@/components/lead/assets/close.svg";
import { createTeamMember } from "@/features/teams/api";
import { getEmployees } from "@/features/employees/api";
import type { Employee } from "@/features/auth/types";
import m from "@/components/Modal/Modal.module.scss";
import { Select } from "@/components";

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "AGENT", label: "Agent" },
  { value: "TEAMLEADER", label: "Team Lead" },
  { value: "LEADMANAGER", label: "Lead Manager" },
];

const ROLE_FILTER_ALL = "all";
const ROLE_FILTER_TL_AGENT = "teamleaders_agents";

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamId: string;
  excludeEmployeeIds: string[];
}

export function AddTeamMemberModal({
  isOpen,
  onClose,
  onSuccess,
  teamId,
  excludeEmployeeIds,
}: AddTeamMemberModalProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>(ROLE_FILTER_TL_AGENT);
  const [employeeId, setEmployeeId] = useState("");
  const [role, setRole] = useState("AGENT");
  const [loading, setLoading] = useState(false);
  const [loadEmp, setLoadEmp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoadEmp(true);
    getEmployees()
      .then((list) => setEmployees(list.filter((e) => !excludeEmployeeIds.includes(e.id))))
      .catch(() => setEmployees([]))
      .finally(() => setLoadEmp(false));
    setEmployeeId("");
    setRole("AGENT");
    setError(null);
  }, [isOpen, excludeEmployeeIds]);

  const filteredEmployees =
    roleFilter === ROLE_FILTER_TL_AGENT
      ? employees.filter((e) => e.role === "AGENT" || e.role === "TEAMLEADER")
      : employees;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim()) {
      setError("Please select an employee.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await createTeamMember({ teamId, employeeId, role });
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const res = err && typeof err === "object" && "response" in err ? (err as { response?: { data?: unknown } }).response : undefined;
      const data = res?.data;
      const msg =
        typeof data === "object" && data !== null && "message" in data
          ? String((data as { message: unknown }).message)
          : Array.isArray((data as { errors?: unknown })?.errors)
            ? (data as { errors: unknown[] }).errors.map((e) => String(e)).join(", ")
            : err instanceof Error
              ? err.message
              : "Failed to add member";
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
          <h3 className={m.Modal__title}>Add team member</h3>
          <button type="button" className={m.Modal__closeBtn} onClick={onClose} aria-label="Close">
            <Image src={iconClose} width={24} height={24} alt="" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={m.Modal__body}>
            <div className={m.Modal__field}>
              <label htmlFor="add-member-role-filter">Show</label>
              <Select
                id="add-member-role-filter"
                value={roleFilter}
                onChange={(v) => {
                  setRoleFilter(v);
                  setEmployeeId("");
                }}
                options={[
                  { value: ROLE_FILTER_TL_AGENT, label: "Team leads and agents only" },
                  { value: ROLE_FILTER_ALL, label: "All employees" },
                ]}
                disabled={loadEmp}
              />
            </div>
            <div className={m.Modal__field}>
              <label htmlFor="add-member-employee">Employee *</label>
              <Select
                id="add-member-employee"
                value={employeeId}
                onChange={setEmployeeId}
                placeholder="— Select —"
                options={filteredEmployees.map((emp) => ({
                  value: emp.id,
                  label: `${emp.firstName} ${emp.lastName} (${emp.email})${emp.role === "TEAMLEADER" ? " — Team Lead" : emp.role === "AGENT" ? " — Agent" : ""}`,
                }))}
                disabled={loadEmp}
              />
            </div>
            <div className={m.Modal__field}>
              <label htmlFor="add-member-role">Role in team</label>
              <Select
                id="add-member-role"
                value={role}
                onChange={setRole}
                options={ROLE_OPTIONS}
              />
            </div>
            {error && <p className={m.Modal__error}>{error}</p>}
          </div>
          <div className={m.Modal__actions}>
            <button type="button" className={m.Modal__cancel} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={m.Modal__submit} disabled={loading || loadEmp}>
              {loading ? "Adding…" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
