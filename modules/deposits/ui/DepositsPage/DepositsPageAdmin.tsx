"use client";

import { useCallback, useEffect, useState, useRef, useLayoutEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { HeaderPage } from "@/components";
import { useAuthStore } from "@/features/auth/store/authStore";
import { Role } from "@/features/auth/types";
import {
  getDepositStats,
  setTeamTarget,
  getTeamTargets,
  createDeposit,
  getDepositsHistory,
  getMonthReport,
} from "@/features/deposits/api";
import { getTeams, getTeamMembers, getTeamsWithDetails } from "@/features/teams/api/teams.api";
import { searchLeads } from "@/features/lead/api/searchLead.api";
import type { Lead } from "@/features/lead/types/lead";
import type {
  DepositStatsResponse,
  TeamTargetApi,
  DepositHistoryResponse,
  MonthReportResponse,
} from "@/features/deposits/types/deposits.types";
import type { TeamApi, TeamWithDetailsApi } from "@/config/api-types";
import { getTodayISO, formatDateTime } from "@/features/deposits/utils/week";
import { useEmployeesStore } from "@/features/employees/store/useEmployeesStore";
import { Select, DatePicker, type SelectOption } from "@/components";
import Link from "next/link";
import s from "./DepositsPage.module.scss";

export function DepositsPageAdmin() {
  const { employee } = useAuthStore();
  const employees = useEmployeesStore((s) => s.employees);
  const fetchEmployees = useEmployeesStore((s) => s.fetchEmployees);
  const [stats, setStats] = useState<DepositStatsResponse | null>(null);
  const [prevWeekStats, setPrevWeekStats] = useState<DepositStatsResponse | null>(null);
  const [teamTargets, setTeamTargets] = useState<TeamTargetApi[]>([]);
  const [teams, setTeams] = useState<TeamApi[]>([]);
  const [teamsWithDetails, setTeamsWithDetails] = useState<TeamWithDetailsApi[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setTargetTeamId, setSetTargetTeamId] = useState("");
  const [setTargetAmount, setSetTargetAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [depositTeamId, setDepositTeamId] = useState("");
  const [depositAgentId, setDepositAgentId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [depositDate, setDepositDate] = useState(getTodayISO());
  const [depositLeadId, setDepositLeadId] = useState("");
  const [depositLeadName, setDepositLeadName] = useState("");
  const [leadSearchQuery, setLeadSearchQuery] = useState("");
  const [leadSearchResults, setLeadSearchResults] = useState<Lead[]>([]);
  const [leadSearchOpen, setLeadSearchOpen] = useState(false);
  const leadSearchRef = useRef<HTMLDivElement>(null);
  const leadDropdownRef = useRef<HTMLUListElement | null>(null);
  const [leadDropdownPosition, setLeadDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  const updateLeadDropdownPosition = useCallback(() => {
    if (!leadSearchRef.current || !leadSearchOpen || leadSearchResults.length === 0) {
      setLeadDropdownPosition(null);
      return;
    }
    const rect = leadSearchRef.current.getBoundingClientRect();
    setLeadDropdownPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 200),
    });
  }, [leadSearchOpen, leadSearchResults.length]);

  useLayoutEffect(() => {
    updateLeadDropdownPosition();
  }, [updateLeadDropdownPosition]);

  useEffect(() => {
    if (!leadSearchOpen || leadSearchResults.length === 0) {
      setLeadDropdownPosition(null);
      return;
    }
    const onScrollOrResize = () => updateLeadDropdownPosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [leadSearchOpen, leadSearchResults.length, updateLeadDropdownPosition]);

  const [depositTeamMembers, setDepositTeamMembers] = useState<
    { employeeId: string; role?: string }[]
  >([]);
  const [history, setHistory] = useState<DepositHistoryResponse | null>(null);
  const [historyLoadError, setHistoryLoadError] = useState<string | null>(null);
  const [historyTeamId, setHistoryTeamId] = useState("");
  const [historyLeadId, setHistoryLeadId] = useState("");
  const [historyLeadName, setHistoryLeadName] = useState("");
  const [historyLeadSearchQuery, setHistoryLeadSearchQuery] = useState("");
  const [historyLeadSearchResults, setHistoryLeadSearchResults] = useState<Lead[]>([]);
  const [monthReport, setMonthReport] = useState<MonthReportResponse | null>(null);
  const [monthReportError, setMonthReportError] = useState<string | null>(null);
  const [reportYear, setReportYear] = useState(() => new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(() => new Date().getMonth() + 1);
  const [historyOpen, setHistoryOpen] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const basePromise = Promise.all([
        getDepositStats(weekOffset),
        getTeamTargets(weekOffset),
        getTeams(),
        getTeamsWithDetails(),
      ]);
      const prevPromise = weekOffset === 0 ? getDepositStats(-1) : Promise.resolve(null);
      const [[statsRes, targetsRes, teamsRes, teamsWithDetailsRes], prevRes] = await Promise.all([
        basePromise,
        prevPromise,
      ]);
      setStats(statsRes);
      setPrevWeekStats(prevRes ?? null);
      setTeamTargets(targetsRes);
      setTeams(teamsRes);
      setTeamsWithDetails(Array.isArray(teamsWithDetailsRes) ? teamsWithDetailsRes : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load error");
      setStats(null);
      setPrevWeekStats(null);
      setTeamTargets([]);
      setTeamsWithDetails([]);
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => {
    if (employee?.role === Role.ADMIN || employee?.role === Role.SUPER_ADMIN) {
      load();
    }
  }, [employee?.role, load]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    return emp ? `${emp.firstName} ${emp.lastName}` : employeeId.slice(0, 8) + "…";
  };

  useEffect(() => {
    if (!depositTeamId) {
      setDepositTeamMembers([]);
      setDepositAgentId("");
      return;
    }
    getTeamMembers(depositTeamId, { take: 100 })
      .then((r) =>
        setDepositTeamMembers(
          r.items.filter((m) => m.role === "AGENT" || m.role === "TEAMLEADER")
        )
      )
      .catch(() => setDepositTeamMembers([]));
  }, [depositTeamId]);

  useEffect(() => {
    if (employee?.role !== Role.ADMIN && employee?.role !== Role.SUPER_ADMIN) return;
    setHistoryLoadError(null);
    getDepositsHistory({
      weekOffset,
      teamId: historyTeamId || undefined,
      leadId: historyLeadId || undefined,
      skip: 0,
      take: 1000,
    })
      .then((data) => {
        setHistory(data);
        setHistoryLoadError(null);
      })
      .catch((e) => {
        setHistory(null);
        setHistoryLoadError(e instanceof Error ? e.message : "Failed to load deposit history");
      });
  }, [employee?.role, weekOffset, historyTeamId, historyLeadId]);

  useEffect(() => {
    if (employee?.role !== Role.ADMIN && employee?.role !== Role.SUPER_ADMIN) return;
    setMonthReportError(null);
    getMonthReport(reportYear, reportMonth)
      .then((data) => {
        setMonthReport(data);
        setMonthReportError(null);
      })
      .catch((e) => {
        setMonthReport(null);
        setMonthReportError(e instanceof Error ? e.message : "Failed to load month report");
      });
  }, [employee?.role, reportYear, reportMonth]);

  useEffect(() => {
    if (!leadSearchQuery.trim()) {
      setLeadSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      searchLeads({ query: leadSearchQuery.trim(), take: 15 })
        .then(setLeadSearchResults)
        .catch(() => setLeadSearchResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [leadSearchQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (leadSearchRef.current?.contains(target)) return;
      if (leadDropdownRef.current?.contains(target)) return;
      setLeadSearchOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSetTeamTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setTargetTeamId || !setTargetAmount) return;
    setSubmitting(true);
    try {
      await setTeamTarget({
        teamId: setTargetTeamId,
        targetAmount: Number(setTargetAmount),
      });
      setSetTargetAmount("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositTeamId || !depositAgentId || !depositAmount) return;
    setDepositSubmitting(true);
    try {
      await createDeposit({
        teamId: depositTeamId,
        agentId: depositAgentId,
        amount: Number(depositAmount),
        depositDate: depositDate || getTodayISO(),
        leadId: depositLeadId || undefined,
      });
      setDepositAmount("");
      setDepositAgentId("");
      setDepositDate(getTodayISO());
      setDepositLeadId("");
      setDepositLeadName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add deposit");
    } finally {
      setDepositSubmitting(false);
    }
  };

  const weekOptions: SelectOption[] = useMemo(
    () =>
      Array.from({ length: 105 }, (_, i) => {
        const offset = -i;
        return {
          value: String(offset),
          label: offset === 0 ? "Current week" : `−${-offset} wk`,
        };
      }),
    []
  );

  if (employee?.role !== Role.ADMIN && employee?.role !== Role.SUPER_ADMIN) {
    return null;
  }

  if (loading) {
    return (
      <div className={s.page}>
        <div className={s.page__header}>
          <HeaderPage title="Deposits" backgroundColor="#00f5ff" color="#0d0d12" />
        </div>
        <div className={s.page__loading}>Loading…</div>
      </div>
    );
  }

  const totalTarget = teamTargets.reduce((s, t) => s + t.targetAmount, 0);
  const targetProgress =
    totalTarget > 0 ? Math.min(100, (stats?.week?.total ?? 0) / totalTarget * 100) : 0;
  const prevTotal = prevWeekStats?.week?.total ?? 0;
  const trendPercent =
    weekOffset === 0 && prevWeekStats && prevTotal > 0
      ? ((stats!.week.total - prevTotal) / prevTotal) * 100
      : null;

  return (
    <div className={s.page}>
      <div className={s.page__header}>
        <HeaderPage title="Deposits" backgroundColor="#00f5ff" color="#0d0d12" />
      </div>

      <div className={s.page__depositsContent}>
      {/* Toolbar: период — кастомный выбор недели */}
      <div className={s.page__toolbar}>
        <span className={s.page__weekLabel}>Week</span>
        <div className={s.page__weekSelectWrap}>
          <Select
            value={String(weekOffset)}
            onChange={(v) => setWeekOffset(Number(v))}
            options={weekOptions}
            placeholder="Select week"
              aria-label="Week"
            className={s.page__weekSelectCustom}
          />
        </div>
        {stats?.week?.weekLabel && (
          <span className={s.page__formHint}>{stats.week.weekLabel}</span>
        )}
      </div>

      {error && <div className={s.page__error}>{error}</div>}

      <div className={s.page__depositsMain}>
          {/* Top: диаграмма по дням недели */}
          {stats?.week?.byDay && stats.week.byDay.length >= 7 && (
            <section className={s.page__chartSection}>
              <h2 className={s.page__chartTitle}>Deposits by day of week</h2>
              <div className={s.page__chart}>
                {(() => {
                  const dayLabels = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
                  const maxSum = Math.max(...stats.week.byDay, 1);
                  const isCurrentWeek = weekOffset === 0;
                  const todayIndex = isCurrentWeek ? (new Date().getDay() + 1) % 7 : -1;
                  return stats.week.byDay.map((sum, i) => {
                    const isPast = isCurrentWeek && i < todayIndex;
                    const isToday = isCurrentWeek && i === todayIndex;
                    const heightPercent = maxSum > 0 ? (sum / maxSum) * 100 : 0;
                    return (
                      <div key={i} className={s.page__chartBarWrap}>
                        <div className={s.page__chartBarTrack}>
                          <div
                            className={`${s.page__chartBar} ${isToday ? s.page__chartBar_today : isPast ? s.page__chartBar_past : s.page__chartBar_future}`}
                            style={{ height: `${heightPercent}%` }}
                            title={`${dayLabels[i]}: ${sum.toFixed(0)} $`}
                          />
                        </div>
                        <span className={s.page__chartBarLabel}>{sum.toFixed(0)}</span>
                        <span className={s.page__chartBarWeek}>{dayLabels[i]}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </section>
          )}

          {/* Teams progress: круговые диаграммы, снизу название команды, в центре % таргета */}
          {stats?.week?.byTeam && stats.week.byTeam.length > 0 && (
            <section className={s.page__teamsProgressSection}>
              <h2 className={s.page__teamsProgressTitle}>Progress by team · {stats.week.weekLabel || "Week"}</h2>
              <div className={s.page__teamsProgressGrid}>
                {totalTarget > 0 && (
                  <div
                    className={`${s.page__teamsProgressCard} ${stats.week.total >= totalTarget ? s.page__teamsProgressCard_done : ""}`}
                    style={{ "--progress": Math.min(100, targetProgress) } as React.CSSProperties}
                  >
                    <div className={s.page__teamsProgressRing}>
                      <div className={s.page__teamsProgressRingInner}>
                        <span className={s.page__teamsProgressPercent}>
                          {targetProgress.toFixed(0)}%
                        </span>
                        <span className={s.page__teamsProgressCenterLabel}>target</span>
                      </div>
                    </div>
                    <span className={s.page__teamsProgressName}>All teams</span>
                    <span className={s.page__teamsProgressEarned}>{stats.week.total.toFixed(0)} $</span>
                  </div>
                )}
                {stats.week.byTeam.map((row) => {
                  const target = row.targetAmount ?? 0;
                  const pct = target > 0 ? Math.min(100, (row.total / target) * 100) : 0;
                  const isDone = target > 0 && (row.remaining ?? 0) <= 0;
                  return (
                    <div
                      key={row.teamId}
                      className={`${s.page__teamsProgressCard} ${isDone ? s.page__teamsProgressCard_done : ""}`}
                      style={{ "--progress": pct } as React.CSSProperties}
                    >
                      <div className={s.page__teamsProgressRing}>
                        <div className={s.page__teamsProgressRingInner}>
                          <span className={s.page__teamsProgressPercent}>
                            {target > 0 ? `${pct.toFixed(0)}%` : "—"}
                          </span>
                          <span className={s.page__teamsProgressCenterLabel}>target</span>
                        </div>
                      </div>
                      <span className={s.page__teamsProgressName}>{row.teamName}</span>
                      <span className={s.page__teamsProgressEarned}>{row.total.toFixed(0)} $</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Add deposit & Set team target — два отдельных блока, премиум-дизайн */}
          <div className={s.page__actionsGrid}>
            <article className={s.page__actionCard}>
              <div className={s.page__actionCardHeader}>
                <span className={s.page__actionCardIcon} aria-hidden>+</span>
                <h2 className={s.page__actionCardTitle}>Add deposit</h2>
              </div>
              <div className={s.page__actionCardBody}>
                <form onSubmit={handleCreateDeposit} className={s.page__actionForm}>
                  <div className={s.page__actionRow}>
                    <select
                      value={depositTeamId}
                      onChange={(e) => {
                        setDepositTeamId(e.target.value);
                        setDepositAgentId("");
                      }}
                      className={s.page__actionInput}
                      required
                      aria-label="Team"
                    >
                      <option value="">Team</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <select
                      value={depositAgentId}
                      onChange={(e) => setDepositAgentId(e.target.value)}
                      className={s.page__actionInput}
                      required
                      disabled={!depositTeamId}
                      aria-label="Agent / Team leader"
                    >
                      <option value="">Agent / Team leader</option>
                      {depositTeamMembers.map((m) => (
                        <option key={m.employeeId} value={m.employeeId}>
                          {getEmployeeName(m.employeeId)}
                          {m.role === "TEAMLEADER" ? " (Team leader)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={`${s.page__clientSelect} ${s.page__clientSelect_float}`} ref={leadSearchRef}>
                    {depositLeadId ? (
                      <span className={s.page__clientChosen}>
                        {depositLeadName}
                        <button
                          type="button"
                          className={s.page__clientClear}
                          onClick={() => {
                            setDepositLeadId("");
                            setDepositLeadName("");
                          }}
                          aria-label="Clear"
                        >
                          ×
                        </button>
                      </span>
                    ) : (
                      <>
                        <input
                          type="text"
                          placeholder="Client (optional)"
                          value={leadSearchQuery}
                          onChange={(e) => {
                            setLeadSearchQuery(e.target.value);
                            setLeadSearchOpen(true);
                          }}
                          onFocus={() => leadSearchResults.length > 0 && setLeadSearchOpen(true)}
                          className={s.page__actionInput}
                          style={{ minWidth: 140 }}
                        />
                        {typeof document !== "undefined" &&
                          leadDropdownPosition &&
                          createPortal(
                            <ul
                              ref={leadDropdownRef}
                              className={s.page__clientDropdown}
                              role="listbox"
                              style={{
                                position: "fixed",
                                top: leadDropdownPosition.top,
                                left: leadDropdownPosition.left,
                                width: leadDropdownPosition.width,
                                zIndex: 99999,
                              }}
                            >
                              {leadSearchResults.map((lead) => (
                                <li key={lead.id} role="option">
                                  <button
                                    type="button"
                                    className={s.page__clientOption}
                                    onClick={() => {
                                      setDepositLeadId(lead.id);
                                      setDepositLeadName(`${lead.firstName} ${lead.lastName}`);
                                      setLeadSearchQuery("");
                                      setLeadSearchResults([]);
                                      setLeadSearchOpen(false);
                                    }}
                                  >
                                    {lead.firstName} {lead.lastName}
                                  </button>
                                </li>
                              ))}
                            </ul>,
                            document.body
                          )}
                      </>
                    )}
                  </div>
                  <div className={s.page__actionRow}>
                    <DatePicker
                      value={depositDate}
                      onChange={setDepositDate}
                      placeholder="Date"
                      aria-label="Deposit date"
                      className={s.page__actionDatePicker}
                    />
                    <input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="Amount $"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className={s.page__actionInput}
                      style={{ width: 100 }}
                      required
                      aria-label="Amount"
                    />
                    <button
                      type="submit"
                      disabled={depositSubmitting}
                      className={s.page__actionBtn}
                    >
                      {depositSubmitting ? "…" : "Add"}
                    </button>
                  </div>
                </form>
              </div>
            </article>

            <article className={s.page__actionCard}>
              <div className={s.page__actionCardHeader}>
                <span className={s.page__actionCardIcon} aria-hidden>◎</span>
                <h2 className={s.page__actionCardTitle}>Set team target</h2>
              </div>
              <div className={s.page__actionCardBody}>
                <form onSubmit={handleSetTeamTarget} className={s.page__actionForm}>
                  <div className={s.page__actionRow}>
                    <select
                      value={setTargetTeamId}
                      onChange={(e) => setSetTargetTeamId(e.target.value)}
                      className={s.page__actionInput}
                      required
                      aria-label="Team"
                    >
                      <option value="">Team</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      placeholder="Target $"
                      value={setTargetAmount}
                      onChange={(e) => setSetTargetAmount(e.target.value)}
                      className={s.page__actionInput}
                      style={{ width: 120 }}
                      required
                      aria-label="Target amount"
                    />
                    <button type="submit" disabled={submitting} className={s.page__actionBtn}>
                      {submitting ? "…" : "Save"}
                    </button>
                  </div>
                </form>
              </div>
            </article>
          </div>

          {stats && (
        <>
          {/* Employee deposits & earnings: per employee for selected week */}
          {stats?.week?.byAgent && stats.week.byAgent.length > 0 && (
            <section className={s.page__section}>
              <div className={s.page__sectionCard}>
                <div className={s.page__sectionHead}>
                  <h2 className={s.page__sectionTitle}>Employee deposits & earnings</h2>
                  <p className={s.page__sectionSubtitle}>
                    For selected week: {stats.week.weekLabel || "—"} · Use the week selector above to change period.
                  </p>
                </div>
                <div className={s.page__sectionBody}>
                  <div className={s.page__employeeTableWrap}>
                    <table className={s.page__employeeTable}>
                      <thead>
                        <tr>
                          <th className={s.page__employeeTh}>Employee</th>
                          <th className={s.page__employeeTh + " " + s.page__employeeTh_right}># Deposits</th>
                          <th className={s.page__employeeTh + " " + s.page__employeeTh_right}>Deposits ($)</th>
                          <th className={s.page__employeeTh + " " + s.page__employeeTh_right}>Earned ($)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...stats.week.byAgent]
                          .filter((row) => row.depositCount > 0 || row.total > 0)
                          .sort((a, b) => b.total - a.total)
                          .map((row) => (
                            <tr key={row.agentId} className={s.page__employeeRow}>
                              <td className={s.page__employeeCell + " " + s.page__employeeCell_name}>
                                {getEmployeeName(row.agentId)}
                              </td>
                              <td className={s.page__employeeCell + " " + s.page__employeeCell_right}>
                                {row.depositCount}
                              </td>
                              <td className={s.page__employeeCell + " " + s.page__employeeCell_right}>
                                {row.total.toFixed(2)}
                              </td>
                              <td className={s.page__employeeCell + " " + s.page__employeeCell_right + " " + s.page__employeeCell_earned}>
                                {row.commissionAmount.toFixed(2)}
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

          {/* Agents & Team leaders: collected from the SAME data as history (so numbers match) */}
          {stats?.week && (
            <section className={s.page__section}>
              <div className={s.page__reportByMonthCard}>
                <div className={s.page__reportByMonthHeader}>
                  <span className={s.page__reportByMonthIcon} aria-hidden>👤</span>
                  <h2 className={s.page__reportByMonthTitle}>
                    Agents & Team leaders · Collected this week
                  </h2>
                </div>
                <div className={s.page__reportByMonthBody}>
                  <p className={s.page__sectionSubtitle} style={{ marginTop: 0, marginBottom: 16 }}>
                    {stats.week.weekLabel || "Selected week"} · Agent: 10% of own deposits. Team leader: 10% own + 3% of team total.
                  </p>
                  {(() => {
                    // Derive collected from history.items (same source as the history table)
                    const items = history?.items ?? [];
                    const collectedByAgent = new Map<string, number>();
                    const totalByTeam = new Map<string, number>();
                    for (const d of items) {
                      if (d.agentId) {
                        collectedByAgent.set(d.agentId, (collectedByAgent.get(d.agentId) ?? 0) + d.amount);
                      }
                      if (d.teamId) {
                        totalByTeam.set(d.teamId, (totalByTeam.get(d.teamId) ?? 0) + d.amount);
                      }
                    }
                    // Which teams does each team leader lead? (employeeId -> teamIds[])
                    const roleUpper = (r: string) => String(r || "").toUpperCase();
                    const teamLeaderToTeamIds = new Map<string, string[]>();
                    for (const team of teamsWithDetails) {
                      for (const m of team.members ?? []) {
                        if (roleUpper(String(m.role)) === "TEAMLEADER") {
                          const ids = teamLeaderToTeamIds.get(m.employeeId) ?? [];
                          if (!ids.includes(team.id)) ids.push(team.id);
                          teamLeaderToTeamIds.set(m.employeeId, ids);
                        }
                      }
                    }
                    const agentAndLeaderIds = new Set(
                      employees
                        .filter((e) => roleUpper(e.role) === "AGENT" || roleUpper(e.role) === "TEAMLEADER")
                        .map((e) => e.id)
                    );
                    const combinedIds = new Set([...collectedByAgent.keys(), ...agentAndLeaderIds]);
                    const rows = Array.from(combinedIds).map((agentId) => {
                      const emp = employees.find((e) => e.id === agentId);
                      const collected = collectedByAgent.get(agentId) ?? 0;
                      const isTeamLeader = emp && roleUpper(emp.role) === "TEAMLEADER";
                      let earned: number;
                      if (isTeamLeader) {
                        const teamIds = teamLeaderToTeamIds.get(agentId) ?? [];
                        const teamTotal = teamIds.reduce((sum, tid) => sum + (totalByTeam.get(tid) ?? 0), 0);
                        earned = Math.round((0.1 * collected + 0.03 * teamTotal) * 100) / 100;
                      } else {
                        earned = Math.round(0.1 * collected * 100) / 100;
                      }
                      const name = emp ? `${emp.firstName} ${emp.lastName}` : getEmployeeName(agentId);
                      const roleLabel =
                        emp && roleUpper(emp.role) === "TEAMLEADER" ? "Team leader" : "Agent";
                      return { agentId, name, roleLabel, collected, earned };
                    });
                    rows.sort((a, b) => b.collected - a.collected);
                    if (rows.length === 0) {
                      return <p className={s.page__historyEmpty}>No agents or team leaders. Add employees with role Agent/Team leader.</p>;
                    }
                    return (
                      <div className={`${s.page__historyListWrap} ${s.page__historyListWrap_cols4}`}>
                        <div className={`${s.page__historyRow} ${s.page__historyRow_head}`}>
                          <span className={s.page__historyCell}>Employee</span>
                          <span className={s.page__historyCell}>Role</span>
                          <span className={`${s.page__historyCell} ${s.page__historyCell_amount}`}>Collected ($)</span>
                          <span className={`${s.page__historyCell} ${s.page__historyCell_amount}`}>Earned ($)</span>
                        </div>
                        <ul className={s.page__historyList}>
                          {rows.map((r) => (
                            <li key={r.agentId} className={s.page__historyRow}>
                              <span className={s.page__historyCell}>{r.name}</span>
                              <span className={s.page__historyCell}>{r.roleLabel}</span>
                              <span className={`${s.page__historyCell} ${s.page__historyCell_amount}`}>
                                {r.collected.toFixed(2)}
                              </span>
                              <span className={`${s.page__historyCell} ${s.page__historyCell_amount}`}>
                                {r.earned.toFixed(2)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </section>
          )}

          {/* Team earnings: how much each team earned + target + progress */}
          <section className={s.page__section}>
            <div className={s.page__sectionCard}>
              <div className={s.page__sectionHead}>
                <h2 className={s.page__sectionTitle}>Team earnings this week</h2>
              </div>
              <div className={s.page__sectionBody}>
                <ul className={s.page__teamEarningsList}>
                  {stats.week.byTeam.map((row) => {
                    const target = row.targetAmount ?? 0;
                    const remaining = row.remaining ?? 0;
                    const pct = target > 0 ? Math.min(100, (row.total / target) * 100) : 0;
                    const isDone = target > 0 && remaining <= 0;
                    return (
                      <li
                        key={row.teamId}
                        className={`${s.page__teamEarningsItem} ${isDone ? s.page__teamEarningsItem_done : ""}`}
                        style={{ "--progress": target > 0 ? pct : 0 } as React.CSSProperties}
                      >
                        {target > 0 && (
                          <div className={s.page__teamEarningsBelt} aria-hidden>
                            <div className={s.page__teamEarningsBeltFill} />
                          </div>
                        )}
                        <span className={s.page__teamEarningsName}>{row.teamName}</span>
                        {target > 0 && (
                          <span className={s.page__teamEarningsTarget}>
                            Target: {target.toFixed(0)} $
                          </span>
                        )}
                        <span className={s.page__teamEarningsAmount}>
                          {row.total.toFixed(0)} $
                        </span>
                        {target > 0 && (
                          <span className={remaining > 0 ? s.page__remaining : s.page__done}>
                            {remaining > 0 ? `${remaining.toFixed(0)} $ left` : "Done"}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </section>

          {/* Monthly — в стиле блока Team earnings */}
          <section className={s.page__section}>
            <div className={s.page__monthlyCard}>
              <div className={s.page__monthlyHeader}>
                <span className={s.page__monthlyIcon} aria-hidden>◷</span>
                <h2 className={s.page__monthlyTitle}>Monthly</h2>
              </div>
              <div className={s.page__monthlyBody}>
                <div className={s.page__monthlyTotalWrap}>
                  <span className={s.page__monthlyTotalLabel}>This month</span>
                  <span className={s.page__monthlyTotalValue}>{stats.month.total.toFixed(2)} $</span>
                </div>
                <ul className={s.page__monthlyList}>
                  {stats.month.byTeam.map((row) => (
                    <li key={row.teamId} className={s.page__monthlyRow}>
                      <span className={s.page__monthlyRowName}>{row.teamName}</span>
                      <span className={s.page__monthlyRowAmount}>{row.total.toFixed(2)} $</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Report by month — в стиле Monthly */}
          <section className={s.page__section}>
            <div className={s.page__reportByMonthCard}>
              <div className={s.page__reportByMonthHeader}>
                <span className={s.page__reportByMonthIcon} aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
                <h2 className={s.page__reportByMonthTitle}>Report by month</h2>
              </div>
              <div className={s.page__reportByMonthBody}>
                <div className={s.page__reportByMonthPickers}>
                  <select
                    value={reportYear}
                    onChange={(e) => setReportYear(Number(e.target.value))}
                    className={s.page__reportByMonthSelect}
                    aria-label="Year"
                  >
                    {Array.from({ length: 11 }, (_, i) => 2020 + i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <select
                    value={reportMonth}
                    onChange={(e) => setReportMonth(Number(e.target.value))}
                    className={s.page__reportByMonthSelect}
                    aria-label="Month"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {new Date(2000, m - 1).toLocaleString("en", { month: "short" })}
                      </option>
                    ))}
                  </select>
                </div>
                {monthReportError && (
                  <p className={s.page__historyEmpty} role="alert">
                    {monthReportError}
                  </p>
                )}
                {monthReport && !monthReportError && (
                  <>
                    <div className={s.page__reportByMonthTotalWrap}>
                      <span className={s.page__reportByMonthTotalLabel}>{monthReport.monthLabel}</span>
                      <span className={s.page__reportByMonthTotalValue}>{monthReport.total.toFixed(2)} $</span>
                    </div>
                    <ul className={s.page__reportByMonthList}>
                      {monthReport.byTeam.map((row) => (
                        <li key={row.teamId} className={s.page__reportByMonthRow}>
                          <span className={s.page__reportByMonthRowName}>{row.teamName}</span>
                          <span className={s.page__reportByMonthRowAmount}>{row.total.toFixed(2)} $</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Deposit history — в стиле Monthly / Report by month, раскрывающийся */}
          <section className={s.page__section}>
            <div className={s.page__historyCard}>
              <button
                type="button"
                className={s.page__historyHeader}
                onClick={() => setHistoryOpen(!historyOpen)}
                aria-expanded={historyOpen}
              >
                <span className={s.page__historyIcon} aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                    <path d="M12 8v4l2 2" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </span>
                <h2 className={s.page__historyTitle}>
                  Deposit history {history ? `(${history.total})` : ""}
                  {historyTeamId ? "" : " · All employees"}
                </h2>
                <span className={s.page__historyChevron}>{historyOpen ? "▼" : "▶"}</span>
              </button>
              {historyOpen && (
                <div className={s.page__historyBody}>
                  {historyLoadError && (
                    <p className={s.page__historyEmpty} role="alert">
                      {historyLoadError}
                    </p>
                  )}
                  <div className={s.page__historyFilters}>
                    <select
                      value={historyTeamId}
                      onChange={(e) => setHistoryTeamId(e.target.value)}
                      className={s.page__historySelect}
                      aria-label="Team"
                    >
                      <option value="">All teams</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    {historyLeadId ? (
                      <span className={s.page__historyChosen}>
                        {historyLeadName}
                        <button
                          type="button"
                          className={s.page__historyChosenClear}
                          onClick={() => {
                            setHistoryLeadId("");
                            setHistoryLeadName("");
                          }}
                          aria-label="Clear"
                        >
                          ×
                        </button>
                      </span>
                    ) : (
                      <>
                        <input
                          type="text"
                          placeholder="Filter by client"
                          value={historyLeadSearchQuery}
                          onChange={(e) => setHistoryLeadSearchQuery(e.target.value)}
                          className={s.page__historyInput}
                          onKeyDown={(e) => {
                            if (e.key !== "Enter") return;
                            e.preventDefault();
                            const q = historyLeadSearchQuery.trim();
                            if (!q) return;
                            searchLeads({ query: q, take: 25 }).then((leads) => {
                              setHistoryLeadSearchResults(leads);
                              if (leads.length === 1) {
                                setHistoryLeadId(leads[0].id);
                                setHistoryLeadName(
                                  `${leads[0].firstName} ${leads[0].lastName}`
                                );
                                setHistoryLeadSearchResults([]);
                                setHistoryLeadSearchQuery("");
                              }
                            });
                          }}
                        />
                        {historyLeadSearchResults.length > 1 && (
                          <ul className={s.page__historyClientDropdown}>
                            {historyLeadSearchResults.map((lead) => (
                              <li key={lead.id}>
                                <button
                                  type="button"
                                  className={s.page__historyClientOption}
                                  onClick={() => {
                                    setHistoryLeadId(lead.id);
                                    setHistoryLeadName(
                                      `${lead.firstName} ${lead.lastName}`
                                    );
                                    setHistoryLeadSearchResults([]);
                                    setHistoryLeadSearchQuery("");
                                  }}
                                >
                                  {lead.firstName} {lead.lastName} — {lead.phone}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </div>
                  {history && (
                    <>
                      {history.items.length === 0 ? (
                        <p className={s.page__historyEmpty}>No deposits for the selected period.</p>
                      ) : (
                        <>
                          {history.total > history.items.length && (
                            <p className={s.page__historyShowing}>
                              Showing first {history.items.length} of {history.total} deposits.
                            </p>
                          )}
                        <div className={s.page__historyListWrap}>
                          <div className={s.page__historyRow + " " + s.page__historyRow_head}>
                            <span className={s.page__historyCell}>Date</span>
                            <span className={s.page__historyCell}>Team</span>
                            <span className={s.page__historyCell}>Client</span>
                            <span className={s.page__historyCell}>Agent</span>
                            <span className={s.page__historyCell + " " + s.page__historyCell_amount}>Amount</span>
                          </div>
                          <ul className={s.page__historyList}>
                            {history.items.map((d) => (
                              <li key={d.id} className={s.page__historyRow}>
                                <span className={s.page__historyCell}>{formatDateTime(d.createdAt)}</span>
                                <span className={s.page__historyCell}>{d.teamName}</span>
                                <span className={s.page__historyCell}>
                                  {d.leadId && (d.leadFirstName != null || d.leadLastName != null) ? (
                                    <Link href={`/leads/${d.leadId}`} className={s.page__historyCellLink}>
                                      {[d.leadFirstName, d.leadLastName].filter(Boolean).join(" ") || "Client"}
                                    </Link>
                                  ) : d.leadFirstName != null && d.leadLastName != null ? (
                                    `${d.leadFirstName} ${d.leadLastName}`
                                  ) : (
                                    "—"
                                  )}
                                </span>
                                <span className={s.page__historyCell}>{getEmployeeName(d.agentId)}</span>
                                <span className={s.page__historyCell + " " + s.page__historyCell_amount}>{d.amount.toFixed(2)} $</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </section>
        </>
      )}
      </div>
      </div>
    </div>
  );
}
