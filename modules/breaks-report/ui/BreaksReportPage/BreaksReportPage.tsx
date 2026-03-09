"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HeaderPage, Select } from "@/components";
import { getBreaksReport } from "@/features/breaks/api";
import { BREAK_TYPE_LABELS } from "@/features/breaks/types";
import type { BreakSession, BreakType, BreaksReportResult } from "@/features/breaks/types";
import { useEmployeesStore } from "@/features/employees/store/useEmployeesStore";
import { Role } from "@/features/auth/types";
import s from "./BreaksReportPage.module.scss";

function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return d;
  }
}

function formatTotalTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h === 0 && m === 0) return "0M";
  if (h === 0) return `${m}M`;
  return m > 0 ? `${h}H ${m}M` : `${h}H`;
}

function getDateRange(days: number): { dateFrom: string; dateTo: string } {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date(to);
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  return {
    dateFrom: from.toISOString(),
    dateTo: to.toISOString(),
  };
}

const PERIOD_OPTIONS = [
  { value: "1", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

export function BreaksReportPage() {
  const [periodDays, setPeriodDays] = useState(7);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [data, setData] = useState<BreaksReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const employees = useEmployeesStore((s) => s.employees);
  const fetchEmployees = useEmployeesStore((s) => s.fetchEmployees);
  const agents = useMemo(
    () => employees.filter((e) => e.role === Role.AGENT),
    [employees]
  );

  const getEmployeeName = (id: string) => {
    const e = employees.find((emp) => emp.id === id);
    return e ? `${e.firstName} ${e.lastName}` : id;
  };

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    const { dateFrom, dateTo } = getDateRange(periodDays);
    try {
      const result = await getBreaksReport({
        dateFrom,
        dateTo,
        employeeId: employeeId || undefined,
      });
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load report");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [periodDays, employeeId]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = data?.summary;
  const sessions = data?.sessions ?? [];

  const employeeOptions = useMemo(
    () => [
      { value: "", label: "All agents" },
      ...agents.map((a) => ({
        value: a.id,
        label: `${a.firstName} ${a.lastName}`,
      })),
    ],
    [agents]
  );

  const byEmployeeSorted = useMemo(() => {
    if (!summary?.byEmployee) return [];
    return Object.entries(summary.byEmployee).sort(
      ([, a], [, b]) => b.totalMinutes - a.totalMinutes
    );
  }, [summary?.byEmployee]);

  const totalTimeFormatted = summary
    ? formatTotalTime(summary.totalMinutes)
    : "—";
  const avgPerAgent =
    summary && byEmployeeSorted.length > 0
      ? Math.round(summary.totalMinutes / byEmployeeSorted.length)
      : null;

  if (loading && !data) {
    return (
      <div className={s.page}>
        <div className={s.page__header}>
          <HeaderPage
            title="Breaks Report"
            label=""
            color="#0d0d12"
            backgroundColor="#00f5ff"
          />
        </div>
        <div className={s.page__loading}>Loading report…</div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.page__header}>
        <HeaderPage
          title="Breaks Report"
          label=""
          color="#0d0d12"
          backgroundColor="#00f5ff"
        />
      </div>

      <p className={s.page__intro}>
        Break usage for the selected period. Use filters to focus on one agent or
        view all. Data is based on recorded start/end break sessions.
      </p>

      <div className={s.page__toolbar}>
        <div className={s.page__filterGroup}>
          <span className={s.page__filterLabel}>Period</span>
          <div className={s.page__selectWrap}>
            <Select
              value={String(periodDays)}
              onChange={(v) => setPeriodDays(Number(v))}
              options={PERIOD_OPTIONS}
              aria-label="Report period"
            />
          </div>
        </div>
        <div className={s.page__filterGroup}>
          <span className={s.page__filterLabel}>Employee</span>
          <div className={s.page__selectWrap}>
            <Select
              value={employeeId}
              onChange={setEmployeeId}
              options={employeeOptions}
              aria-label="Filter by employee"
            />
          </div>
        </div>
      </div>

      {error && <div className={s.page__error}>{error}</div>}

      {loading && data && (
        <div className={s.page__loading}>Updating…</div>
      )}

      {!loading && summary && (
        <>
          <div className={s.page__kpis}>
            <div className={s.page__kpiCard}>
              <div className={s.page__kpiLabel}>Total sessions</div>
              <div className={s.page__kpiValue}>{summary.totalSessions}</div>
              <div className={s.page__kpiSub}>completed breaks</div>
            </div>
            <div className={s.page__kpiCard}>
              <div className={s.page__kpiLabel}>Total break time</div>
              <div className={s.page__kpiValue}>{totalTimeFormatted}</div>
              <div className={s.page__kpiSub}>
                {summary.totalMinutes} minutes
              </div>
            </div>
            {avgPerAgent != null && byEmployeeSorted.length > 0 && (
              <div className={s.page__kpiCard}>
                <div className={s.page__kpiLabel}>Avg per agent</div>
                <div className={s.page__kpiValue}>
                  {formatTotalTime(avgPerAgent)}
                </div>
                <div className={s.page__kpiSub}>
                  {byEmployeeSorted.length} agent
                  {byEmployeeSorted.length !== 1 ? "s" : ""}
                </div>
              </div>
            )}
          </div>

          <section className={s.page__section}>
            <div className={s.page__sectionCard}>
              <div className={s.page__sectionHead}>
                <h2 className={s.page__sectionTitle}>Overview by break type</h2>
              </div>
              <div className={s.page__sectionBody}>
                <div className={s.page__summaryGrid}>
                  {(Object.keys(BREAK_TYPE_LABELS) as BreakType[]).map(
                    (type) => (
                      <div key={type} className={s.page__summaryCard}>
                        <span className={s.page__summaryCardLabel}>
                          {BREAK_TYPE_LABELS[type]}
                        </span>
                        <span className={s.page__summaryCardCount}>
                          {summary.byType[type]?.count ?? 0} sessions
                        </span>
                        <span className={s.page__summaryCardMin}>
                          {summary.byType[type]?.totalMinutes ?? 0} min total
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </section>

          {byEmployeeSorted.length > 0 && (
            <section className={s.page__section}>
              <div className={s.page__sectionCard}>
                <div className={s.page__sectionHead}>
                  <h2 className={s.page__sectionTitle}>
                    By employee (sorted by total time)
                  </h2>
                </div>
                <div className={s.page__sectionBody}>
                  <div className={s.page__tableWrap}>
                    <table className={s.page__table}>
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Sessions</th>
                          <th>Total time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {byEmployeeSorted.map(([id, row]) => (
                          <tr key={id}>
                            <td>{row.name || getEmployeeName(id)}</td>
                            <td className={s.page__tableNum}>{row.count}</td>
                            <td className={s.page__tableNum}>
                              {formatTotalTime(row.totalMinutes)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className={s.page__section}>
            <div className={s.page__sectionCard}>
              <div className={s.page__sectionHead}>
                <h2 className={s.page__sectionTitle}>Session log</h2>
              </div>
              <div className={s.page__sectionBody}>
                {sessions.length === 0 ? (
                  <div className={s.page__empty}>
                    <div className={s.page__emptyTitle}>
                      No break sessions in this period
                    </div>
                    Sessions appear when agents start and end breaks from their
                    dashboard. Try a longer period or another employee.
                  </div>
                ) : (
                  <div className={s.page__tableWrap}>
                    <table className={s.page__table}>
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Type</th>
                          <th>Started</th>
                          <th>Ended</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((sess: BreakSession) => (
                          <tr key={sess.id}>
                            <td>
                              {sess.employeeName ?? getEmployeeName(sess.employeeId)}
                            </td>
                            <td>
                              {BREAK_TYPE_LABELS[sess.breakType]}
                            </td>
                            <td>{formatDate(sess.startedAt)}</td>
                            <td>
                              {sess.endedAt
                                ? formatDate(sess.endedAt)
                                : "—"}
                            </td>
                            <td className={s.page__tableNum}>
                              {sess.durationMinutes != null
                                ? `${sess.durationMinutes} min`
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {!loading && !data && !error && (
        <div className={s.page__empty}>
          <div className={s.page__emptyTitle}>No data available</div>
          Try changing the period or employee filter. If the problem persists,
          check your connection.
        </div>
      )}
    </div>
  );
}
