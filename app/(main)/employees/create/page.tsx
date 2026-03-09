"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createEmployee } from "@/features/employees/api";
import { Role, EmployeeStatus } from "@/features/auth/types";
import { roleLabels } from "@/features/employees/constants";
import { Select, DatePicker } from "@/components";
import s from "./page.module.scss";

const ROLES_ALLOWED_ON_CREATE: Role[] = [Role.AGENT, Role.TEAMLEADER, Role.LEADMANAGER, Role.ADMIN];

const initialForm = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  role: Role.AGENT,
  status: EmployeeStatus.ACTIVE,
  phone: "",
  telegramUsername: "",
  department: "",
  hiredAt: "",
};

export default function CreateEmployeePage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const created = await createEmployee({
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        role: form.role,
        status: form.status,
        phone: form.phone.trim() || undefined,
        telegramUsername: form.telegramUsername.trim() || undefined,
        department: form.department.trim() || undefined,
        hiredAt: form.hiredAt.trim() || undefined,
      });
      router.push(`/employees/${created.id}`);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error ? err.message : "Failed to create employee.";
      setError(String(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.main}>
      <div className={s.main__head}>
        <h1 className={s.main__title}>Create employee</h1>
        <Link href="/employees" className={s.main__back}>
          ← Back to employees
        </Link>
      </div>

      <form onSubmit={handleSubmit} className={s.main__form}>
        <div className={s.main__grid}>
          <div className={s.main__field}>
            <label htmlFor="create-email">Email *</label>
            <input
              id="create-email"
              type="text"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="Email or login"
            />
          </div>
          <div className={s.main__field}>
            <label htmlFor="create-password">Password *</label>
            <input
              id="create-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Min 6 characters"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <div className={s.main__field}>
            <label htmlFor="create-firstName">First name *</label>
            <input
              id="create-firstName"
              type="text"
              value={form.firstName}
              onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
              placeholder="First name"
              required
            />
          </div>
          <div className={s.main__field}>
            <label htmlFor="create-lastName">Last name *</label>
            <input
              id="create-lastName"
              type="text"
              value={form.lastName}
              onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
              placeholder="Last name"
              required
            />
          </div>
          <div className={s.main__field}>
            <label htmlFor="create-role">Role *</label>
            <Select
              id="create-role"
              value={form.role}
              onChange={(v) => setForm((p) => ({ ...p, role: v as Role }))}
              options={ROLES_ALLOWED_ON_CREATE.map((r) => ({ value: r, label: roleLabels[r] ?? r }))}
            />
          </div>
          <div className={s.main__field}>
            <label htmlFor="create-status">Status</label>
            <Select
              id="create-status"
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
          <div className={s.main__field}>
            <label htmlFor="create-hiredAt">Hired date</label>
            <DatePicker
              id="create-hiredAt"
              value={form.hiredAt}
              onChange={(v) => setForm((p) => ({ ...p, hiredAt: v }))}
              placeholder="Select date"
              aria-label="Hired date"
              className={s.main__datePicker}
            />
          </div>
          <div className={s.main__field}>
            <label htmlFor="create-department">Department</label>
            <input
              id="create-department"
              type="text"
              value={form.department}
              onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
              placeholder="Optional"
            />
          </div>
          <div className={s.main__field}>
            <label htmlFor="create-phone">Phone</label>
            <input
              id="create-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="Optional"
            />
          </div>
          <div className={s.main__field}>
            <label htmlFor="create-telegram">Telegram</label>
            <input
              id="create-telegram"
              type="text"
              value={form.telegramUsername}
              onChange={(e) => setForm((p) => ({ ...p, telegramUsername: e.target.value }))}
              placeholder="Optional"
            />
          </div>
        </div>

        {error && <p className={s.main__error}>{error}</p>}

        <div className={s.main__actions}>
          <Link href="/employees" className={s.main__cancel}>
            Cancel
          </Link>
          <button type="submit" className={s.main__submit} disabled={loading}>
            {loading ? "Creating…" : "Create employee"}
          </button>
        </div>
      </form>
    </div>
  );
}
