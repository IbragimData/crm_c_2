"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { HeaderPage } from "@/components";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
  getMyTeamTarget,
  setAgentTarget,
  getAgentsTargetsSummary,
  getDepositsHistory,
  getDepositStatsForTeam,
  getMyEarnings,
} from "@/features/deposits/api";
import { getTeams, getTeamMembers } from "@/features/teams/api/teams.api";
import type {
  MyTeamTargetResponse,
  AgentsTargetsSummaryResponse,
  DepositHistoryResponse,
  DepositStatsForTeamResponse,
  MyEarningsTeamLeaderResponse,
} from "@/features/deposits/types/deposits.types";
import type { GetTeamMembersResponseApi } from "@/config/api-types";
import { formatDateTime } from "@/features/deposits/utils/week";
import { useEmployeesStore } from "@/features/employees/store/useEmployeesStore";
import { Select, type SelectOption } from "@/components";
import s from "./DepositsPage.module.scss";

export function DepositsPageTeamLeader() {
  const { employee } = useAuthStore();
  const employees = useEmployeesStore((s) => s.employees);
  const fetchEmployees = useEmployeesStore((s) => s.fetchEmployees);
  const [teamTargetData, setTeamTargetData] = useState<MyTeamTargetResponse | null>(null);
  const [summary, setSummary] = useState<AgentsTargetsSummaryResponse | null>(null);
  const [teamStats, setTeamStats] = useState<DepositStatsForTeamResponse | null>(null);
  const [history, setHistory] = useState<DepositHistoryResponse | null>(null);
  const [earningsData, setEarningsData] = useState<MyEarningsTeamLeaderResponse | null>(null);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [teamId, setTeamId] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentId, setAgentId] = useState("");
  const [agentTargetAmount, setAgentTargetAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const teamOptions: SelectOption[] = useMemo(
    () => teams.map((t) => ({ value: t.id, label: t.name })),
    [teams]
  );

  const loadTeams = useCallback(async () => {
    try {
      const list = await getTeams();
      setTeams(list.map((t) => ({ id: t.id, name: t.name })));
      if (list.length > 0 && !teamId) setTeamId(list[0].id);
    } catch {
      setTeams([]);
    }
  }, [teamId]);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [targetRes, summaryRes, historyRes, statsRes, earningsRes] = await Promise.all([
        getMyTeamTarget(teamId || undefined, weekOffset),
        getAgentsTargetsSummary({ weekOffset, teamId: teamId || undefined }),
        getDepositsHistory({ weekOffset, teamId: teamId || undefined, take: 100 }),
        getDepositStatsForTeam(weekOffset, teamId || undefined),
        getMyEarnings(weekOffset),
      ]);
      setTeamTargetData(targetRes);
      setSummary(summaryRes);
      setHistory(historyRes);
      setTeamStats(statsRes);
      setEarningsData(earningsRes.role === "teamLeader" ? earningsRes : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load error");
      setTeamTargetData(null);
      setSummary(null);
      setHistory(null);
      setTeamStats(null);
      setEarningsData(null);
    } finally {
      setLoading(false);
    }
  }, [weekOffset, teamId]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    if (employee?.role) load();
  }, [employee?.role, teamId, weekOffset, load]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    return emp ? `${emp.firstName} ${emp.lastName}` : employeeId.slice(0, 8) + "…";
  };

  useEffect(() => {
    if (summary?.teamId && !teamId) setTeamId(summary.teamId);
  }, [summary?.teamId, teamId]);

  const handleSetAgentTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !agentId || !agentTargetAmount) return;
    setSubmitting(true);
    try {
      await setAgentTarget({
        teamId,
        agentId,
        targetAmount: Number(agentTargetAmount),
      });
      setAgentId("");
      setAgentTargetAmount("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save error");
    } finally {
      setSubmitting(false);
    }
  };

  const [members, setMembers] = useState<GetTeamMembersResponseApi["items"]>([]);
  useEffect(() => {
    if (!teamId || !employee?.id) {
      setMembers([]);
      return;
    }
    getTeamMembers(teamId, { take: 100 })
      .then((r) => {
        const agents = r.items.filter((m) => m.role === "AGENT");
        const meAsLeader = r.items.find((m) => m.employeeId === employee.id && m.role === "TEAMLEADER");
        setMembers(meAsLeader ? [meAsLeader, ...agents] : agents);
      })
      .catch(() => setMembers([]));
  }, [teamId, employee?.id]);

  if (loading) {
    return (
      <div className={s.page}>
        <div className={s.page__header}>
          <HeaderPage title="Deposits — Team targets" backgroundColor="#00f5ff" color="#0d0d12" />
        </div>
        <div className={s.page__loading}>Loading…</div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.page__header}>
        <HeaderPage title="Deposits — Team targets" backgroundColor="#00f5ff" color="#0d0d12" />
      </div>

      <div className={s.page__depositsContent}>
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
          {(summary?.weekLabel ?? teamTargetData?.weekLabel) && (
            <span className={s.page__formHint}>
              {summary?.weekLabel ?? teamTargetData?.weekLabel}
            </span>
          )}
          {teams.length > 1 && (
            <div className={s.page__weekSelectWrap} style={{ minWidth: 160 }}>
              <Select
                value={teamId}
                onChange={setTeamId}
                options={teamOptions}
                placeholder="Team"
                aria-label="Team"
                className={s.page__weekSelectCustom}
              />
            </div>
          )}
        </div>

        {error && <div className={s.page__error}>{error}</div>}

        <div className={s.page__depositsMain}>
          {earningsData && (
            <section className={s.page__section}>
              <div className={s.page__earningsCard}>
                <div className={s.page__earningsHeader}>
                  <span className={s.page__earningsIcon} aria-hidden>%</span>
                  <h2 className={s.page__earningsTitle}>
                    Your commission {earningsData.weekLabel ? `(${earningsData.weekLabel})` : ""}
                  </h2>
                </div>
                <div className={s.page__earningsBody}>
                  <div className={s.page__earningsGrid}>
                    <div>
                      <div className={s.page__earningsRow}>
                        <span className={s.page__earningsLabel}>Your deposits</span>
                        <span className={s.page__earningsValue}>{earningsData.ownDepositsTotal.toFixed(2)} $</span>
                      </div>
                      <div className={s.page__earningsRow}>
                        <span className={s.page__earningsLabel}>Your commission ({earningsData.ownCommissionPercent}%)</span>
                        <span className={`${s.page__earningsValue} ${s.page__earningsHighlight}`}>
                          {earningsData.ownCommissionAmount.toFixed(2)} $
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className={s.page__earningsRow}>
                        <span className={s.page__earningsLabel}>Team agents deposits</span>
                        <span className={s.page__earningsValue}>{earningsData.agentsDepositsTotal.toFixed(2)} $</span>
                      </div>
                      <div className={s.page__earningsRow}>
                        <span className={s.page__earningsLabel}>Override ({earningsData.agentsCommissionPercent}% from agents)</span>
                        <span className={`${s.page__earningsValue} ${s.page__earningsHighlight}`}>
                          {earningsData.agentsCommissionAmount.toFixed(2)} $
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={s.page__earningsRow} style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(148,163,184,0.12)" }}>
                    <span className={s.page__earningsLabel}>Total commission</span>
                    <span className={`${s.page__earningsValue} ${s.page__earningsHighlight}`} style={{ fontSize: "1.35rem" }}>
                      {earningsData.totalCommissionAmount.toFixed(2)} $
                    </span>
                  </div>
                  {earningsData.agentsBreakdown.length > 0 && (
                    <div style={{ marginTop: 18 }}>
                      <span className={s.page__earningsLabel} style={{ display: "block", marginBottom: 10 }}>
                        Override by agent (3% of their deposits)
                      </span>
                      <ul className={s.page__monthlyList}>
                        {earningsData.agentsBreakdown.map((a) => (
                          <li key={a.agentId} className={s.page__monthlyRow}>
                            <span className={s.page__monthlyRowName}>{getEmployeeName(a.agentId)}</span>
                            <span className={s.page__monthlyRowAmount}>
                              {a.depositsTotal.toFixed(2)} $ → {a.commissionAmount.toFixed(2)} $
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {teamStats?.week?.byDay && teamStats.week.byDay.length >= 7 && (
            <section className={s.page__chartSection}>
              <h2 className={s.page__chartTitle}>
                Deposits by day of week
                {teamId && teams.find((t) => t.id === teamId)?.name
                  ? ` · ${teams.find((t) => t.id === teamId)?.name}`
                  : ""}
              </h2>
              <div className={s.page__chart}>
                {(() => {
                  const dayLabels = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
                  const maxSum = Math.max(...teamStats.week.byDay, 1);
                  const isCurrentWeek = weekOffset === 0;
                  const todayIndex = isCurrentWeek ? (new Date().getDay() + 1) % 7 : -1;
                  return teamStats.week.byDay.map((sum, i) => {
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

          {(() => {
            const teamTarget = teamTargetData?.teamTarget;
            const hasSummary = Boolean(summary);
            const targetAmount = teamTarget?.targetAmount ?? summary?.teamTarget ?? 0;
            const total = teamTarget?.total ?? summary?.teamTotal ?? 0;
            const remaining = teamTarget?.remaining ?? summary?.teamRemaining ?? 0;
            const teamName = teamTarget?.teamName ?? teams.find((t) => t.id === teamId)?.name ?? (summary?.teamId ? "Team" : "");
            const showTeamTargetBar = teamTarget || (hasSummary && (targetAmount > 0 || total > 0));
            const pct = targetAmount > 0 ? Math.min(100, (total / targetAmount) * 100) : 0;
            const isDone = remaining <= 0;
            const showRow = showTeamTargetBar || summary;
            if (!showRow) return null;
            return (
              <div className={s.page__actionsGrid}>
                {showTeamTargetBar ? (
                  <div className={s.page__monthlyCard}>
                    <div className={s.page__monthlyHeader}>
                      <span className={s.page__monthlyIcon} aria-hidden>◎</span>
                      <h2 className={s.page__monthlyTitle}>Team target</h2>
                    </div>
                    <div className={s.page__monthlyBody}>
                      <ul className={s.page__teamEarningsList}>
                        <li
                          className={`${s.page__teamEarningsItem} ${isDone ? s.page__teamEarningsItem_done : ""}`}
                          style={{ "--progress": pct } as React.CSSProperties}
                        >
                          <div className={s.page__teamEarningsBelt} aria-hidden>
                            <div className={s.page__teamEarningsBeltFill} />
                          </div>
                          <span className={s.page__teamEarningsName}>
                            {teamName ? `${teamName} · ${targetAmount.toFixed(2)} $` : `${targetAmount.toFixed(2)} $`}
                          </span>
                          <span className={s.page__teamEarningsAmount}>{total.toFixed(2)} $</span>
                          {remaining > 0 ? (
                            <span className={s.page__remaining}>{remaining.toFixed(2)} $ left</span>
                          ) : (
                            <span className={s.page__done}>Done</span>
                          )}
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div />
                )}
                {summary ? (
                  <article className={s.page__actionCard}>
                    <div className={s.page__actionCardHeader}>
                      <span className={s.page__actionCardIcon} aria-hidden>◎</span>
                      <h2 className={s.page__actionCardTitle}>Assign target to agents</h2>
                    </div>
                    <div className={s.page__actionCardBody}>
                      <form onSubmit={handleSetAgentTarget} className={s.page__actionForm}>
                        <div className={s.page__actionRow}>
                          <select
                            value={agentId}
                            onChange={(e) => setAgentId(e.target.value)}
                            className={s.page__actionInput}
                            required
                            aria-label="Agent"
                          >
                            <option value="">Agent</option>
                            {members.map((m) => (
                              <option key={m.employeeId} value={m.employeeId}>
                                {getEmployeeName(m.employeeId)}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min={0}
                            step={100}
                            placeholder="Target $"
                            value={agentTargetAmount}
                            onChange={(e) => setAgentTargetAmount(e.target.value)}
                            className={s.page__actionInput}
                            style={{ width: 120 }}
                            required
                            aria-label="Target amount"
                          />
                          <button type="submit" disabled={submitting} className={s.page__actionBtn}>
                            {submitting ? "…" : "Assign"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </article>
                ) : (
                  <div />
                )}
              </div>
            );
          })()}

          {summary && (
            <>
              <section className={s.page__section}>
                <div className={s.page__reportByMonthCard}>
                  <div className={s.page__reportByMonthHeader}>
                    <span className={s.page__reportByMonthIcon} aria-hidden>👤</span>
                    <h2 className={s.page__reportByMonthTitle}>Agents: target and remaining</h2>
                  </div>
                  <div className={s.page__reportByMonthBody}>
                    <div className={`${s.page__historyListWrap} ${s.page__historyListWrap_cols4}`}>
                      <div className={`${s.page__historyRow} ${s.page__historyRow_head}`}>
                        <span className={s.page__historyCell}>Agent</span>
                        <span className={s.page__historyCell}>Target ($)</span>
                        <span className={s.page__historyCell}>Collected ($)</span>
                        <span className={s.page__historyCell}>Remaining ($)</span>
                      </div>
                      <ul className={s.page__historyList}>
                        {summary.agents.map((a) => (
                          <li key={a.agentId} className={s.page__historyRow}>
                            <span className={s.page__historyCell}>{getEmployeeName(a.agentId)}</span>
                            <span className={s.page__historyCell}>{a.targetAmount.toFixed(2)}</span>
                            <span className={s.page__historyCell}>{a.total.toFixed(2)}</span>
                            <span className={`${s.page__historyCell} ${a.remaining > 0 ? s.page__remaining : s.page__done}`}>
                              {a.remaining.toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              <section className={s.page__section}>
                <div className={s.page__historyCard}>
                  <div className={s.page__historyHeader}>
                    <span className={s.page__historyIcon} aria-hidden>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                        <path d="M12 8v4l2 2" />
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    </span>
                    <h2 className={s.page__historyTitle}>
                      Team deposit history {history ? `(${history.total})` : ""}
                    </h2>
                  </div>
                  <div className={s.page__historyBody}>
                    {history && (
                      <>
                        {history.items.length === 0 ? (
                          <p className={s.page__historyEmpty}>No deposits for the selected week.</p>
                        ) : (
                          <div className={`${s.page__historyListWrap} ${s.page__historyListWrap_cols3}`}>
                            <div className={`${s.page__historyRow} ${s.page__historyRow_head}`}>
                              <span className={s.page__historyCell}>Date</span>
                              <span className={s.page__historyCell}>Agent / Team lead</span>
                              <span className={`${s.page__historyCell} ${s.page__historyCell_amount}`}>Amount</span>
                            </div>
                            <ul className={s.page__historyList}>
                              {history.items.map((d) => (
                                <li key={d.id} className={s.page__historyRow}>
                                  <span className={s.page__historyCell}>{formatDateTime(d.createdAt)}</span>
                                  <span className={s.page__historyCell}>{getEmployeeName(d.agentId)}</span>
                                  <span className={`${s.page__historyCell} ${s.page__historyCell_amount}`}>{d.amount.toFixed(2)} $</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
