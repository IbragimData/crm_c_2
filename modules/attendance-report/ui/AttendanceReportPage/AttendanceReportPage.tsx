"use client";

import { useCallback, useEffect, useState } from "react";
import { HeaderPage, Select, DatePicker } from "@/components";
import {
  getAttendanceReport,
  getAttendanceSalaries,
  setAttendanceSalary,
} from "@/features/attendance/api";
import type {
  AttendanceSession,
  AttendanceReportResult,
  AttendanceSummaryByEmployee,
} from "@/features/attendance/types";
import { useEmployeesStore } from "@/features/employees/store/useEmployeesStore";
import { Role } from "@/features/auth/types";
import s from "./AttendanceReportPage.module.scss";

const REPORT_ROLES: Role[] = [Role.AGENT, Role.TEAMLEADER, Role.LEADMANAGER];

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

function formatHours(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Format total minutes as "Xh Ym" for display. */
function formatHoursMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h === 0 && m === 0) return "0h 0m";
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Format total minutes for summary: "132h 32m" (letters h and m). */
function formatHoursMinutesLong(totalMinutes: number): string {
  const total = Math.round(totalMinutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0 && m === 0) return "0h 0m";
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Parse YYYY-MM-DD as local date (noon to avoid DST issues). */
function parseLocalDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Count working days (shift days): only Mon–Fri. 5 shifts per week, 8h per shift. Uses local calendar dates. */
function workingDaysBetween(dateFrom: Date, dateTo: Date): number {
  let count = 0;
  const from = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate());
  const to = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate());
  const cur = new Date(from);
  while (cur <= to) {
    const d = cur.getDay();
    if (d >= 1 && d <= 5) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

/** Norm: 5 shifts per week (Mon–Fri), 8h per shift. Month base = 20 days × 8h = 160h. */
const NORM_HOURS_PER_MONTH = 20 * 8; // 160

/** Pay for period: norm = (shift days in range) × 8h. Base = (normHours/160)*monthlySalary; overtime = extra hours × hourly rate; shortfall = proportional base. */
function payForPeriod(
  actualMinutes: number,
  normHours: number,
  monthlySalary: number
): number {
  if (monthlySalary <= 0) return 0;
  const actualHours = actualMinutes / 60;
  const hourlyRate = monthlySalary / NORM_HOURS_PER_MONTH;
  const baseForPeriod = (normHours / NORM_HOURS_PER_MONTH) * monthlySalary;
  if (actualHours >= normHours) {
    return baseForPeriod + (actualHours - normHours) * hourlyRate;
  }
  return (actualHours / normHours) * baseForPeriod;
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

function roleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    [Role.USER]: "User",
    [Role.AGENT]: "Agent",
    [Role.TEAMLEADER]: "Team Leader",
    [Role.LEADMANAGER]: "Lead Manager",
    [Role.ADMIN]: "Admin",
    [Role.SUPER_ADMIN]: "Super Admin",
  };
  return labels[role] ?? role;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfDay(iso: string): string {
  return new Date(iso + "T00:00:00").toISOString();
}

function endOfDay(iso: string): string {
  return new Date(iso + "T23:59:59.999").toISOString();
}

export function AttendanceReportPage() {
  const today = toISODate(new Date());
  const firstDayOfMonth = toISODate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [data, setData] = useState<AttendanceReportResult | null>(null);
  const [salaries, setSalaries] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingSalaryFor, setSavingSalaryFor] = useState<string | null>(null);

  const employees = useEmployeesStore((s) => s.employees);
  const fetchEmployees = useEmployeesStore((s) => s.fetchEmployees);
  const reportEmployees = employees.filter((e) => REPORT_ROLES.includes(e.role));

  const getEmployeeName = (id: string) => {
    const e = employees.find((emp) => emp.id === id);
    return e ? `${e.firstName} ${e.lastName}` : id;
  };

  const load = useCallback(
    async (from: string, to: string, empId: string) => {
      setError(null);
      setLoading(true);
      try {
        const [result, salariesMap] = await Promise.all([
          getAttendanceReport({
            dateFrom: startOfDay(from),
            dateTo: endOfDay(to),
            employeeId: empId || undefined,
          }),
          getAttendanceSalaries(),
        ]);
        setData(result);
        setSalaries(salariesMap ?? {});
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load report");
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Refetch when date range or employee filter changes — pass current values so pay/worked/norm recalculate
  useEffect(() => {
    load(dateFrom, dateTo, employeeId);
  }, [dateFrom, dateTo, employeeId, load]);

  const handleSaveSalary = useCallback(
    async (empId: string, value: number) => {
      setSavingSalaryFor(empId);
      try {
        await setAttendanceSalary(empId, value);
        setSalaries((prev) => ({ ...prev, [empId]: value }));
      } catch {
        // keep local state on error
      } finally {
        setSavingSalaryFor(null);
      }
    },
    []
  );

  const summary = data?.summary;
  const sessions = data?.sessions ?? [];
  const byEmployee = summary?.byEmployee ?? {};
  const byEmployeeList = reportEmployees.map((emp) => {
    const fromReport = byEmployee[emp.id] as AttendanceSummaryByEmployee | undefined;
    const totalMinutes = fromReport ? fromReport.totalMinutes ?? 0 : 0;
    const workingDays = workingDaysBetween(parseLocalDate(dateFrom), parseLocalDate(dateTo));
    const normHours = workingDays * 8;
    const monthlySalary = salaries[emp.id] ?? fromReport?.monthlySalary ?? 0;
    const pay = payForPeriod(totalMinutes, normHours, Number(monthlySalary) || 0);
    const diffMinutes = totalMinutes - normHours * 60;
    return {
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      role: emp.role,
      totalMinutes,
      totalHours: fromReport?.totalHours ?? 0,
      sessionsCount: fromReport?.sessionsCount ?? 0,
      monthlySalary: salaries[emp.id] ?? fromReport?.monthlySalary ?? null,
      normHours,
      diffMinutes,
      pay,
      byDay: fromReport?.byDay ?? {},
      byWeek: fromReport?.byWeek ?? {},
      byMonth: fromReport?.byMonth ?? {},
    };
  });

  const employeeOptions = [
    { value: "", label: "All" },
    ...reportEmployees.map((a) => ({
      value: a.id,
      label: `${a.firstName} ${a.lastName} (${roleLabel(a.role)})`,
    })),
  ];

  return (
    <div className={s.page}>
      <div className={s.page__header}>
        <HeaderPage
          title="Attendance Report"
          label=""
          color="#0d0d12"
          backgroundColor="#00f5ff"
        />
      </div>

      <div className={s.page__toolbar}>
        <div className={s.page__filterGroup}>
          <span className={s.page__filterLabel}>From</span>
          <DatePicker
            value={dateFrom}
            onChange={setDateFrom}
            max={dateTo}
            placeholder="From"
            aria-label="Date from"
            className={s.page__datePicker}
          />
        </div>
        <div className={s.page__filterGroup}>
          <span className={s.page__filterLabel}>To</span>
          <DatePicker
            value={dateTo}
            onChange={setDateTo}
            min={dateFrom}
            placeholder="To"
            aria-label="Date to"
            className={s.page__datePicker}
          />
        </div>
        <div className={s.page__filterGroup}>
          <span className={s.page__filterLabel}>Employee</span>
          <div className={s.page__selectWrap}>
            <Select
              value={employeeId}
              onChange={setEmployeeId}
              options={employeeOptions}
            />
          </div>
        </div>
      </div>

      {error && <div className={s.page__error}>{error}</div>}
      {loading && <div className={s.page__loading}>Loading…</div>}

      {!loading && summary && (
        <>
          <section className={s.page__summary}>
            <h2 className={s.page__summaryTitle}>Summary</h2>
            <p className={s.page__period}>
              Period: <strong>{dateFrom}</strong> — <strong>{dateTo}</strong>
            </p>
            <div className={s.page__summaryGrid}>
              <div className={s.page__summaryCard}>
                <span className={s.page__summaryCardLabel}>Total hours</span>
                <span className={s.page__summaryCardCount}>
                  {formatHoursMinutesLong(summary.totalMinutes)}
                </span>
                {summary.totalMinutes > 0 && (
                  <span className={s.page__summaryCardSub}>
                    {formatHoursMinutes(summary.totalMinutes)}
                  </span>
                )}
              </div>
              <div className={s.page__summaryCard}>
                <span className={s.page__summaryCardLabel}>Total sessions</span>
                <span className={s.page__summaryCardCount}>{summary.totalSessions}</span>
              </div>
            </div>
          </section>

          {byEmployeeList.length > 0 && (
            <section className={s.page__byEmployee} aria-labelledby="by-employee-title">
              <div className={s.page__byEmployeeHeader}>
                <h2 id="by-employee-title" className={s.page__sectionTitle}>
                  Hours and salary by employee
                </h2>
                <div className={s.page__normBox} role="note">
                  <span className={s.page__normBoxIcon} aria-hidden>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                  </span>
                  <div className={s.page__normBoxContent}>
                    <span className={s.page__normBoxLabel}>Norm</span>
                    <p className={s.page__normBoxText}>
                      5 shifts per week (Mon–Fri), 8h per shift. Only weekdays count; weekends are excluded.
                    </p>
                  </div>
                </div>
              </div>
              <div className={s.page__tableWrap}>
                <table className={s.page__table}>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Role</th>
                      <th>Worked</th>
                      <th>Norm</th>
                      <th>Diff</th>
                      <th>Sessions</th>
                      <th>Salary (month)</th>
                      <th>К выплате</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byEmployeeList.map((emp) => {
                      const salaryValue = emp.monthlySalary ?? "";
                      const isSaving = savingSalaryFor === emp.employeeId;
                      const diffStr =
                        emp.diffMinutes >= 0
                          ? `+${formatHoursMinutes(emp.diffMinutes)}`
                          : `−${formatHoursMinutes(-emp.diffMinutes)}`;
                      return (
                        <tr key={emp.employeeId}>
                          <td>{emp.employeeName || getEmployeeName(emp.employeeId)}</td>
                          <td>{roleLabel(emp.role)}</td>
                          <td className={s.page__tableNum}>{formatHoursMinutes(emp.totalMinutes)}</td>
                          <td className={s.page__tableNum}>{formatHoursMinutes(emp.normHours * 60)}</td>
                          <td className={`${s.page__tableNum} ${emp.diffMinutes >= 0 ? s.page__diffPlus : s.page__diffMinus}`}>{diffStr}</td>
                          <td>{emp.sessionsCount}</td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              step={100}
                              className={s.page__salaryInput}
                              value={salaryValue}
                              onChange={(e) => {
                                const v = e.target.value;
                                setSalaries((prev) => ({
                                  ...prev,
                                  [emp.employeeId]: v === "" ? 0 : Number(v),
                                }));
                              }}
                              onBlur={(e) => {
                                const v = e.target.value === "" ? 0 : Number(e.target.value);
                                if (v >= 0) handleSaveSalary(emp.employeeId, v);
                              }}
                              disabled={isSaving}
                              placeholder="0"
                              aria-label="Monthly salary"
                            />
                            {isSaving && <span className={s.page__saving}>…</span>}
                          </td>
                          <td className={`${s.page__tableNum} ${s.page__payCell}`}>
                            {emp.pay > 0 ? emp.pay.toFixed(2) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section className={s.page__detail}>
            <h2 className={s.page__sectionTitle}>Sessions</h2>
            {sessions.length === 0 ? (
              <p className={s.page__empty}>No attendance sessions in this period.</p>
            ) : (
              <div className={s.page__tableWrap}>
                <table className={s.page__table}>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Started</th>
                      <th>Ended</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((sess: AttendanceSession) => (
                      <tr key={sess.id}>
                        <td>{sess.employeeName ?? getEmployeeName(sess.employeeId)}</td>
                        <td>{formatDate(sess.startedAt)}</td>
                        <td>{sess.endedAt ? formatDate(sess.endedAt) : "—"}</td>
                        <td>
                          {sess.durationMinutes != null
                            ? formatHours(sess.durationMinutes)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
