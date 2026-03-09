"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/authStore";
import { Role } from "@/features/auth/types";
import { useAttendanceStore } from "../../store/useAttendanceStore";
import s from "./AttendanceOverlay.module.scss";

export function AttendanceOverlay() {
  const router = useRouter();
  const employee = useAuthStore((s) => s.employee);
  const logout = useAuthStore((s) => s.logout);
  const currentShift = useAttendanceStore((s) => s.currentShift);
  const startWork = useAttendanceStore((s) => s.startWork);
  const [confirmStart, setConfirmStart] = useState(false);

  const canStartWork =
    employee?.role === Role.AGENT ||
    employee?.role === Role.TEAMLEADER ||
    employee?.role === Role.LEADMANAGER;
  if (!canStartWork || !employee || currentShift) return null;

  const handleStartWorkClick = () => {
    setConfirmStart(true);
  };

  const handleConfirmStart = async () => {
    try {
      await startWork(employee.id, `${employee.firstName} ${employee.lastName}`);
      setConfirmStart(false);
    } catch {
      // Error is shown in header via store.error
    }
  };

  const handleCancelStart = () => {
    setConfirmStart(false);
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div
      className={s.attendanceOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="attendance-overlay-title"
    >
      <div className={s.attendanceOverlay__card}>
        <h2 id="attendance-overlay-title" className={s.attendanceOverlay__title}>
          Start your shift
        </h2>
        <p className={s.attendanceOverlay__hint}>
          You must start work to use the app. Click below to begin your shift.
        </p>
        {confirmStart ? (
          <div className={s.attendanceOverlay__confirm}>
            <p className={s.attendanceOverlay__confirmLabel}>Start shift?</p>
            <div className={s.attendanceOverlay__confirmActions}>
              <button
                type="button"
                className={s.attendanceOverlay__btnCancel}
                onClick={handleCancelStart}
                aria-label="Cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                className={s.attendanceOverlay__btnConfirm}
                onClick={handleConfirmStart}
                aria-label="Start shift"
              >
                Start shift
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className={s.attendanceOverlay__btn}
            onClick={handleStartWorkClick}
            aria-label="Start work"
          >
            Start work
          </button>
        )}
        <button
          type="button"
          className={s.attendanceOverlay__btnLogout}
          onClick={handleLogout}
          aria-label="Log out"
        >
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}
