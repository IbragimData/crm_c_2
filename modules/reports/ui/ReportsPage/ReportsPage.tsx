"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HeaderPage, Select } from "@/components";
import { getLeadsReport } from "@/features/lead/api";
import { LEAD_STATUS_UI } from "@/features/lead/constants";
import type { Lead } from "@/features/lead/types";
import { LeadStatus } from "@/features/lead/types";
import { exportLeadsToCsv, downloadCsv } from "@/features/lead/utils/exportLeadsToCsv";
import { getLeadsReportByAffiliatorId } from "@/features/affiliator/api";
import { useEmployeesStore } from "@/features/employees/store/useEmployeesStore";
import { Role } from "@/features/auth/types";
import s from "./ReportsPage.module.scss";

type ReportPeriod = "daily" | "weekly" | "monthly";

function getDateRange(period: ReportPeriod): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const dateTo = new Date(now);
  dateTo.setHours(23, 59, 59, 999);
  let dateFrom: Date;

  if (period === "daily") {
    dateFrom = new Date(now);
    dateFrom.setHours(0, 0, 0, 0);
  } else if (period === "weekly") {
    dateFrom = new Date(now);
    dateFrom.setDate(dateFrom.getDate() - 7);
    dateFrom.setHours(0, 0, 0, 0);
  } else {
    dateFrom = new Date(now);
    dateFrom.setMonth(dateFrom.getMonth() - 1);
    dateFrom.setHours(0, 0, 0, 0);
  }

  return {
    dateFrom: dateFrom.toISOString(),
    dateTo: dateTo.toISOString(),
  };
}

function formatDateCell(d: Date | string): string {
  try {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toISOString().slice(0, 19).replace("T", " ");
  } catch {
    return "";
  }
}

/** Group leads by status; each group has status, count, and list of leads (for emails). */
function groupLeadsByStatus(leads: Lead[]): { status: LeadStatus; label: string; count: number; leads: Lead[] }[] {
  const byStatus = new Map<LeadStatus, Lead[]>();
  for (const lead of leads) {
    const list = byStatus.get(lead.status) ?? [];
    list.push(lead);
    byStatus.set(lead.status, list);
  }
  return Array.from(byStatus.entries())
    .map(([status, list]) => ({
      status,
      label: LEAD_STATUS_UI[status]?.label ?? status,
      count: list.length,
      leads: list,
    }))
    .sort((a, b) => b.count - a.count);
}

export function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("daily");
  const [affiliationId, setAffiliationId] = useState<string>("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const employees = useEmployeesStore((s) => s.employees);
  const affiliators = useMemo(
    () => employees.filter((e) => e.role === Role.AFFILIATOR),
    [employees]
  );

  const loadReport = useCallback(async () => {
    setError(null);
    setLoading(true);
    const { dateFrom, dateTo } = getDateRange(period);
    try {
      if (affiliationId) {
        const data = await getLeadsReportByAffiliatorId({ affiliateId: affiliationId, dateFrom, dateTo });
        setLeads(data);
      } else {
        const data = await getLeadsReport({ dateFrom, dateTo });
        setLeads(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load report");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [period, affiliationId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const summaryByStatus = useMemo(() => groupLeadsByStatus(leads), [leads]);

  const handleDownload = useCallback(() => {
    const csv = exportLeadsToCsv(leads);
    const periodLabel = period === "daily" ? "daily" : period === "weekly" ? "weekly" : "monthly";
    const dateStr = new Date().toISOString().slice(0, 10);
    const affLabel = affiliationId ? `-affiliation-${affiliationId.slice(0, 8)}` : "";
    downloadCsv(csv, `leads-report-${periodLabel}${affLabel}-${dateStr}.csv`);
  }, [leads, period, affiliationId]);

  const periodLabel =
    period === "daily"
      ? "Today (every day)"
      : period === "weekly"
        ? "Last 7 days (weekly)"
        : "Last 30 days (monthly)";

  const affiliationLabel = useMemo(() => {
    if (!affiliationId) return "All affiliations";
    const a = affiliators.find((x) => x.id === affiliationId);
    return a ? `${a.firstName} ${a.lastName}` : "Selected affiliation";
  }, [affiliationId, affiliators]);

  return (
    <div className={s.reportsPage}>
      <div className={s.reportsPage__header}>
        <HeaderPage title="Reports" label="" color="#0d0d12" backgroundColor="transparent" />
      </div>

      <div className={s.reportsPage__filters}>
        <p className={s.reportsPage__periodLabel}>
          Period: <strong>{periodLabel}</strong>
        </p>
        <div className={s.reportsPage__tabs}>
          {(["daily", "weekly", "monthly"] as const).map((p) => (
            <button
              key={p}
              type="button"
              className={`${s.reportsPage__tab} ${period === p ? s.reportsPage__tabActive : ""}`}
              onClick={() => setPeriod(p)}
            >
              {p === "daily" ? "Every day" : p === "weekly" ? "Weekly" : "Monthly"}
            </button>
          ))}
        </div>

        <div className={s.reportsPage__affiliationRow}>
          <label className={s.reportsPage__affiliationLabel}>Affiliation</label>
          <Select
            value={affiliationId}
            onChange={setAffiliationId}
            options={[
              { value: "", label: "All affiliations" },
              ...affiliators.map((a) => ({
                value: a.id,
                label: `${a.firstName} ${a.lastName}`,
              })),
            ]}
            aria-label="Select affiliation"
          />
        </div>
      </div>

      {error && <div className={s.reportsPage__error}>{error}</div>}

      {/* Short summary: by status with count + client emails */}
      {!loading && leads.length > 0 && (
        <section className={s.reportsPage__summary}>
          <h2 className={s.reportsPage__summaryTitle}>
            Summary for {affiliationLabel} — {periodLabel}
          </h2>
          <p className={s.reportsPage__summaryMeta}>
            Total leads: <strong>{leads.length}</strong>
          </p>
          <div className={s.reportsPage__summaryGrid}>
            {summaryByStatus.map(({ status, label, count, leads: statusLeads }) => (
              <div key={status} className={s.reportsPage__summaryCard}>
                <div
                  className={s.reportsPage__summaryCardHeader}
                  style={{
                    backgroundColor: LEAD_STATUS_UI[status]?.bg ?? "#333",
                    color: LEAD_STATUS_UI[status]?.text ?? "#fff",
                  }}
                >
                  <span className={s.reportsPage__summaryCardLabel}>{label}</span>
                  <span className={s.reportsPage__summaryCardCount}>{count}</span>
                </div>
                <div className={s.reportsPage__summaryCardEmails}>
                  {statusLeads.length === 0 ? (
                    "—"
                  ) : (
                    <ul className={s.reportsPage__emailList}>
                      {statusLeads.map((lead) => (
                        <li key={lead.id} className={s.reportsPage__emailItem}>
                          {lead.email || "—"}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className={s.reportsPage__actions}>
        <button
          type="button"
          className={s.reportsPage__downloadBtn}
          onClick={handleDownload}
          disabled={loading || leads.length === 0}
        >
          Download as Excel (CSV)
        </button>
        <span className={s.reportsPage__meta}>
          {loading ? "Loading…" : `${leads.length} lead(s) in period`}
        </span>
      </div>

      {loading && <div className={s.reportsPage__loading}>Loading report…</div>}

      {!loading && leads.length === 0 && !error && (
        <div className={s.reportsPage__empty}>No leads in this period.</div>
      )}

      {!loading && leads.length > 0 && (
        <div className={s.reportsPage__tableWrap}>
          <table className={s.reportsPage__table}>
            <thead>
              <tr>
                <th>Short ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Created</th>
                <th>Description</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.shortId ?? "—"}</td>
                  <td>{lead.firstName}</td>
                  <td>{lead.lastName}</td>
                  <td>{lead.email}</td>
                  <td>{lead.phone}</td>
                  <td>{LEAD_STATUS_UI[lead.status]?.label ?? lead.status}</td>
                  <td>{formatDateCell(lead.createdAt)}</td>
                  <td>{(lead.description ?? "").slice(0, 80)}{(lead.description?.length ?? 0) > 80 ? "…" : ""}</td>
                  <td>{lead.leadSource ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
