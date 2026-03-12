"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { Role } from "@/features/auth/types";
import { useCallbackDueStore } from "../../store/useCallbackDueStore";
import Link from "next/link";
import s from "./CallbackDueToast.module.scss";

function formatScheduledAt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function CallbackDueToast() {
  const employee = useAuthStore((s) => s.employee);
  const isAdmin = employee?.role === Role.ADMIN || employee?.role === Role.SUPER_ADMIN;
  const canSeeCallbacks =
    employee &&
    !isAdmin &&
    employee.role !== Role.AFFILIATOR;

  const dueCallbacks = useCallbackDueStore((s) => s.dueCallbacks);
  const fetchDue = useCallbackDueStore((s) => s.fetchDue);
  const startPolling = useCallbackDueStore((s) => s.startPolling);

  useEffect(() => {
    if (canSeeCallbacks) {
      startPolling();
      fetchDue();
    }
  }, [canSeeCallbacks, startPolling, fetchDue]);

  useEffect(() => {
    if (!canSeeCallbacks) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchDue();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [canSeeCallbacks, fetchDue]);

  const [dismissedCount, setDismissedCount] = useState<number | null>(null);
  const visible =
    dismissedCount === null || dueCallbacks.length > dismissedCount;

  if (!canSeeCallbacks || dueCallbacks.length === 0 || !visible) return null;

  const handleClose = () => setDismissedCount(dueCallbacks.length);

  return (
    <div className={s.CallbackDueToast} role="status" aria-live="polite">
      <div className={s.CallbackDueToast__head}>
        <span className={s.CallbackDueToast__title}>
          {dueCallbacks.length === 1 ? "Callback due" : `${dueCallbacks.length} callbacks due`}
        </span>
        <div className={s.CallbackDueToast__headRight}>
          <span className={s.CallbackDueToast__badge}>{dueCallbacks.length}</span>
          <button
            type="button"
            className={s.CallbackDueToast__close}
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>
      <ul className={s.CallbackDueToast__list}>
        {dueCallbacks.slice(0, 5).map((c) => (
          <li key={c.id} className={s.CallbackDueToast__item}>
            <Link
              href={c.leadId ? `/leads/${c.leadId}?tab=4` : "/schedules"}
              className={s.CallbackDueToast__link}
            >
              <span className={s.CallbackDueToast__lead}>
                {c.lead?.firstName} {c.lead?.lastName}
                {c.lead?.shortId ? ` (${c.lead.shortId})` : ""}
              </span>
              <span className={s.CallbackDueToast__time}>
                {formatScheduledAt(c.scheduledAt)}
                {c.note ? ` · ${c.note}` : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {dueCallbacks.length > 5 && (
        <Link href="/schedules" className={s.CallbackDueToast__more}>
          View all ({dueCallbacks.length})
        </Link>
      )}
    </div>
  );
}
