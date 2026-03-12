'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Role } from '@/features/auth/types';
import {
  getDepositStats,
  getTeamTargets,
  getMyTeamTarget,
  getMyTarget,
} from '@/features/deposits/api';
import s from './SideBarDepositProgress.module.scss';

type ProgressData = {
  earned: number;
  target: number;
  remaining: number;
  label: string;
};

export function SidebarDepositProgress() {
  const { employee } = useAuthStore();
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!employee) return;
    const role = employee.role;
    if (![Role.ADMIN, Role.SUPER_ADMIN, Role.TEAMLEADER, Role.AGENT].includes(role)) {
      return;
    }
    setLoading(true);
    try {
      if (role === Role.AGENT) {
        const res = await getMyTarget(0);
        setData({
          earned: res.total,
          target: res.targetAmount,
          remaining: res.remaining,
          label: 'My target',
        });
        return;
      }
      if (role === Role.TEAMLEADER) {
        const res = await getMyTeamTarget(undefined, 0);
        if (res.teamTarget) {
          setData({
            earned: res.teamTarget.total,
            target: res.teamTarget.targetAmount,
            remaining: res.teamTarget.remaining,
            label: res.teamTarget.teamName ? `${res.teamTarget.teamName} · Week` : 'Desk this week',
          });
        } else {
          setData(null);
        }
        return;
      }
      if (role === Role.ADMIN || role === Role.SUPER_ADMIN) {
        const [stats, targets] = await Promise.all([
          getDepositStats(0),
          getTeamTargets(0),
        ]);
        const totalTarget = targets.reduce((s, t) => s + t.targetAmount, 0);
        if (totalTarget > 0 || stats.week.total > 0) {
          setData({
            earned: stats.week.total,
            target: totalTarget,
            remaining: Math.max(0, totalTarget - stats.week.total),
            label: 'All desks · Week',
          });
        } else {
          setData(null);
        }
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [employee?.id, employee?.role]);

  useEffect(() => {
    load();
  }, [load]);

  if (!employee || loading || !data) return null;
  const role = employee.role;
  if (![Role.ADMIN, Role.SUPER_ADMIN, Role.TEAMLEADER, Role.AGENT].includes(role)) {
    return null;
  }

  const pct = data.target > 0 ? Math.min(100, (data.earned / data.target) * 100) : 0;
  const isDone = data.target > 0 && data.remaining <= 0;

  return (
    <div className={s.SideBarDepositProgress}>
      <span className={s.SideBarDepositProgress__label}>{data.label}</span>
      <div className={s.SideBarDepositProgress__row}>
        <span className={s.SideBarDepositProgress__earned}>{data.earned.toFixed(0)} $</span>
        <span className={s.SideBarDepositProgress__sep}>/</span>
        <span className={s.SideBarDepositProgress__target}>{data.target.toFixed(0)} $</span>
      </div>
      <div className={s.SideBarDepositProgress__track} aria-hidden>
        <div
          className={s.SideBarDepositProgress__fill}
          style={{ width: `${pct}%` }}
          data-done={isDone || undefined}
        />
      </div>
      <span className={isDone ? s.SideBarDepositProgress__done : s.SideBarDepositProgress__needed}>
        {isDone ? 'Done' : `${data.remaining.toFixed(0)} $ needed`}
      </span>
    </div>
  );
}
