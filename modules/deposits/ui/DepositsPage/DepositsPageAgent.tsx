"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { HeaderPage } from "@/components";
import { getMyDeposits, getMyTarget, getMyEarnings } from "@/features/deposits/api";
import type { MyDepositsResponse, MyTargetResponse, MyEarningsAgentResponse } from "@/features/deposits/types/deposits.types";
import { formatDateTime } from "@/features/deposits/utils/week";
import { Select, type SelectOption } from "@/components";
import s from "./DepositsPage.module.scss";

export function DepositsPageAgent() {
  const [targetData, setTargetData] = useState<MyTargetResponse | null>(null);
  const [depositsData, setDepositsData] = useState<MyDepositsResponse | null>(null);
  const [earningsData, setEarningsData] = useState<MyEarningsAgentResponse | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [targetRes, depositsRes, earningsRes] = await Promise.all([
        getMyTarget(weekOffset),
        getMyDeposits(weekOffset),
        getMyEarnings(weekOffset),
      ]);
      setTargetData(targetRes);
      setDepositsData(depositsRes);
      setEarningsData(earningsRes.role === "agent" ? earningsRes : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load error");
      setTargetData(null);
      setDepositsData(null);
      setEarningsData(null);
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className={s.page}>
        <div className={s.page__header}>
          <HeaderPage title="My deposits" backgroundColor="#00f5ff" color="#0d0d12" />
        </div>
        <div className={s.page__loading}>Loading…</div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.page__header}>
        <HeaderPage title="My deposits" backgroundColor="#00f5ff" color="#0d0d12" />
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
          {(targetData?.weekLabel ?? depositsData?.weekLabel) && (
            <span className={s.page__formHint}>
              {targetData?.weekLabel ?? depositsData?.weekLabel}
            </span>
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
                  <div className={s.page__earningsRow}>
                    <span className={s.page__earningsLabel}>Your deposits this week</span>
                    <span className={s.page__earningsValue}>{earningsData.depositsTotal.toFixed(2)} $</span>
                  </div>
                  <div className={s.page__earningsRow}>
                    <span className={s.page__earningsLabel}>Commission ({earningsData.commissionPercent}%)</span>
                    <span className={`${s.page__earningsValue} ${s.page__earningsHighlight}`}>
                      {earningsData.commissionAmount.toFixed(2)} $
                    </span>
                  </div>
                  <p className={s.page__earningsHint}>
                    You receive {earningsData.commissionPercent}% of your deposits every week.
                  </p>
                </div>
              </div>
            </section>
          )}

          {targetData && (
            <section className={s.page__section}>
              <div className={s.page__monthlyCard}>
                <div className={s.page__monthlyHeader}>
                  <span className={s.page__monthlyIcon} aria-hidden>◎</span>
                  <h2 className={s.page__monthlyTitle}>
                    My weekly target {targetData.weekLabel ? `(${targetData.weekLabel})` : ""}
                  </h2>
                </div>
                <div className={s.page__monthlyBody}>
                  <div className={s.page__monthlyTotalWrap}>
                    <span className={s.page__monthlyTotalLabel}>Target (set by team lead)</span>
                    <span className={s.page__monthlyTotalValue}>{targetData.targetAmount.toFixed(2)} $</span>
                  </div>
                  <ul className={s.page__monthlyList}>
                    <li className={s.page__monthlyRow}>
                      <span className={s.page__monthlyRowName}>Collected</span>
                      <span className={s.page__monthlyRowAmount}>{targetData.total.toFixed(2)} $</span>
                    </li>
                    <li className={s.page__monthlyRow}>
                      <span className={s.page__monthlyRowName}>Remaining</span>
                      <span className={`${s.page__monthlyRowAmount} ${targetData.remaining > 0 ? s.page__remaining : s.page__done}`}>
                        {targetData.remaining.toFixed(2)} $
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          )}

          {depositsData && (
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
                    Deposit history {depositsData.weekLabel ? `(${depositsData.weekLabel})` : ""}
                  </h2>
                </div>
                <div className={s.page__historyBody}>
                  <div className={s.page__monthlyTotalWrap} style={{ marginBottom: 16 }}>
                    <span className={s.page__monthlyTotalLabel}>Weekly total</span>
                    <span className={s.page__monthlyTotalValue}>{depositsData.total.toFixed(2)} $</span>
                  </div>
                  {depositsData.items.length === 0 ? (
                    <p className={s.page__historyEmpty}>No deposits for the selected week.</p>
                  ) : (
                    <div className={`${s.page__historyListWrap} ${s.page__historyListWrap_cols3}`}>
                      <div className={`${s.page__historyRow} ${s.page__historyRow_head}`}>
                        <span className={s.page__historyCell}>Date</span>
                        <span className={s.page__historyCell}>Team</span>
                        <span className={`${s.page__historyCell} ${s.page__historyCell_amount}`}>Amount</span>
                      </div>
                      <ul className={s.page__historyList}>
                        {depositsData.items.map((d) => (
                          <li key={d.id} className={s.page__historyRow}>
                            <span className={s.page__historyCell}>{formatDateTime(d.createdAt)}</span>
                            <span className={s.page__historyCell}>{d.teamName}</span>
                            <span className={`${s.page__historyCell} ${s.page__historyCell_amount}`}>{d.amount.toFixed(2)} $</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
