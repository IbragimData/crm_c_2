"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createLead } from "@/features/lead/api";
import { Select } from "@/components";
import { useEmployeesStore } from "@/features/employees/store/useEmployeesStore";
import s from "./page.module.scss";

const AFFILIATE_FILTER_ROLES = ["AFFILIATOR"] as const;

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  affiliateId: "",
  externalLeadId: "",
  leadSource: "",
  description: "",
};

export default function CreateLeadPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useEmployeesStore((s) => s.fetchEmployees);
  const employees = useEmployeesStore((s) => s.employees);
  const affiliateOptions = useMemo(
    () => employees.filter((emp) => AFFILIATE_FILTER_ROLES.includes(emp.role as (typeof AFFILIATE_FILTER_ROLES)[number])),
    [employees]
  );

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("First name, last name, email and phone are required.");
      return;
    }
    setLoading(true);
    try {
      const affiliateIds = form.affiliateId.trim() ? [form.affiliateId.trim()] : [];
      const created = await createLead({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        ...(form.externalLeadId.trim() && { externalLeadId: form.externalLeadId.trim() }),
        ...(form.leadSource.trim() && { leadSource: form.leadSource.trim() }),
        ...(affiliateIds.length > 0 && { affiliateIds }),
      });
      router.push(`/leads/${created.id}`);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error ? err.message : "Failed to create lead.";
      setError(String(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.main}>
      <div className={s.main__head}>
        <h1 className={s.main__title}>Create lead</h1>
        <Link href="/leads" className={s.main__back}>
          ← Back to leads
        </Link>
      </div>

      <form onSubmit={handleSubmit} className={s.main__form}>
        <div className={s.main__grid}>
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
            <label htmlFor="create-email">Email *</label>
            <input
              id="create-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="Email"
              required
            />
          </div>
          <div className={s.main__field}>
            <label htmlFor="create-phone">Phone *</label>
            <input
              id="create-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+1234567890"
              required
            />
          </div>
          <div className={s.main__field}>
            <label htmlFor="create-affiliateId">Affiliate</label>
            <Select
              id="create-affiliateId"
              value={form.affiliateId}
              onChange={(v) => setForm((p) => ({ ...p, affiliateId: v ?? "" }))}
              options={[
                { value: "", label: "No affiliate" },
                ...affiliateOptions.map((emp) => ({
                  value: emp.id,
                  label: `${emp.firstName} ${emp.lastName}`,
                })),
              ]}
              aria-label="Affiliate"
            />
          </div>
          <div className={s.main__field}>
            <label htmlFor="create-externalLeadId">External lead ID</label>
            <input
              id="create-externalLeadId"
              type="text"
              value={form.externalLeadId}
              onChange={(e) => setForm((p) => ({ ...p, externalLeadId: e.target.value }))}
              placeholder="Optional"
            />
          </div>
          <div className={s.main__field}>
            <label htmlFor="create-leadSource">Lead source</label>
            <input
              id="create-leadSource"
              type="text"
              value={form.leadSource}
              onChange={(e) => setForm((p) => ({ ...p, leadSource: e.target.value }))}
              placeholder="e.g. Website"
            />
          </div>
          <div className={`${s.main__field}`} style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="create-description">Description</label>
            <textarea
              id="create-description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Optional"
            />
          </div>
        </div>

        {error && <p className={s.main__error}>{error}</p>}

        <div className={s.main__actions}>
          <Link href="/leads" className={s.main__cancel}>
            Cancel
          </Link>
          <button type="submit" className={s.main__submit} disabled={loading}>
            {loading ? "Creating…" : "Create lead"}
          </button>
        </div>
      </form>
    </div>
  );
}
