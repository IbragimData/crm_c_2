'use client';

import s from "./Header.module.scss";
import Image from "next/image";
import { useAuthStore } from "@/features/auth/store/authStore";
import { Role } from "@/features/auth/types";
import { useBreaksStore } from "@/features/breaks/store/useBreaksStore";
import { useAttendanceStore } from "@/features/attendance/store/useAttendanceStore";
import { BreakControl } from "@/features/breaks/ui";
import { AttendanceControl } from "@/features/attendance/ui";
import { getMyTarget } from "@/features/deposits/api";
import type { MyTargetResponse } from "@/features/deposits/types/deposits.types";

import iconSearch from "../../assets/search.svg";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function Header() {
  const { employee } = useAuthStore();
  const currentBreak = useBreaksStore((s) => s.currentBreak);
  const currentShift = useAttendanceStore((s) => s.currentShift);
  const attendanceError = useAttendanceStore((s) => s.error);
  const breaksError = useBreaksStore((s) => s.error);
  const clearAttendanceError = useAttendanceStore((s) => s.clearError);
  const clearBreaksError = useBreaksStore((s) => s.clearError);
  const [input, setInput] = useState("")
  const router = useRouter()
  const [depositTarget, setDepositTarget] = useState<MyTargetResponse | null>(null);

  const isAgent = employee?.role === Role.AGENT;
  const isTeamLeader = employee?.role === Role.TEAMLEADER;
  const showDepositTarget = isAgent || isTeamLeader;
  const hasStartedWork = Boolean(currentShift);
  const canStartWorkAndBreaks =
    employee?.role === Role.AGENT ||
    employee?.role === Role.TEAMLEADER ||
    employee?.role === Role.LEADMANAGER;
  const showBreakControl = canStartWorkAndBreaks && hasStartedWork && !currentBreak;

  useEffect(() => {
    if (!showDepositTarget) return;
    getMyTarget(0)
      .then(setDepositTarget)
      .catch(() => setDepositTarget(null));
  }, [showDepositTarget]);

  const handleOnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/search?query=" + encodeURIComponent(input));
  };
  return (
    <div className={s.Header}>
      <form onSubmit={handleOnSubmit} className={s.Header__input}>
        <Image
          src={iconSearch}
          width={24}
          height={24}
          alt="Search"
        />
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search" type="text" />
      </form>

      <div className={s.Header__content}>
        <div className={s.Header__block}></div>

        {canStartWorkAndBreaks && attendanceError && (
          <div className={s.Header__attendanceError} role="alert">
            <span>{attendanceError}</span>
            <button type="button" onClick={clearAttendanceError} aria-label="Закрыть">×</button>
          </div>
        )}
        {canStartWorkAndBreaks && breaksError && (
          <div className={s.Header__attendanceError} role="alert">
            <span>{breaksError}</span>
            <button type="button" onClick={clearBreaksError} aria-label="Закрыть">×</button>
          </div>
        )}
        {canStartWorkAndBreaks && hasStartedWork && employee && (
          <>
            <AttendanceControl
            employeeId={employee.id}
            employeeName={`${employee.firstName} ${employee.lastName}`}
          />
          </>
        )}

        {showBreakControl && employee && (
          <BreakControl
            employeeId={employee.id}
            employeeName={`${employee.firstName} ${employee.lastName}`}
          />
        )}

        {showDepositTarget && depositTarget && (
          <Link href="/deposits" className={s.Header__depositTarget}>
            <span className={s.Header__depositTargetValue}>{depositTarget.targetAmount.toFixed(0)} $</span>
            <span className={s.Header__depositTargetDivider}>·</span>
            <span className={s.Header__depositTargetValue}>{depositTarget.total.toFixed(0)} $</span>
            <span className={s.Header__depositTargetDivider}>·</span>
            <span className={depositTarget.remaining > 0 ? s.Header__depositTargetRemaining : s.Header__depositTargetDone}>
              {depositTarget.remaining.toFixed(0)} $
            </span>
          </Link>
        )}

        <div className={s.Header__info}>
          <span>
            {employee
              ? `${employee?.firstName} ${employee?.lastName}`
              : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}