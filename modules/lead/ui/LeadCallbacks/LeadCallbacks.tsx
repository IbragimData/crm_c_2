"use client";

import s from "./LeadCallbacks.module.scss";
import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useEmployeesStore } from "@/features/employees/store/useEmployeesStore";
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "@/features/schedule/api/schedules.api";
import { useCallbackDueStore } from "@/features/schedule/store/useCallbackDueStore";
import type { CallbackSchedule } from "@/features/schedule/types/schedule.types";
import { DateTimePicker } from "@/components";

interface LeadCallbacksProps {
  leadId: string;
  /** Владелец лида — ему автоматически приходят уведомления о коллбэках. */
  leadOwnerId: string | null;
}

function formatScheduledAt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function LeadCallbacks({ leadId, leadOwnerId }: LeadCallbacksProps) {
  const { employee } = useAuthStore();
  const [callbacks, setCallbacks] = useState<CallbackSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduledAt, setScheduledAt] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { employees, fetchEmployees } = useEmployeesStore();

  useEffect(() => {
    fetchEmployees(undefined, true);
  }, [fetchEmployees]);

  const loadCallbacks = useCallback(async () => {
    setLoading(true);
    try {
      const from = new Date();
      from.setFullYear(from.getFullYear() - 1);
      const to = new Date();
      to.setFullYear(to.getFullYear() + 1);
      const res = await getSchedules({
        leadId,
        dateFrom: from.toISOString(),
        dateTo: to.toISOString(),
        take: 100,
      });
      setCallbacks(res.items);
    } catch {
      setCallbacks([]);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    loadCallbacks();
  }, [loadCallbacks]);

  const handleSubmit = async () => {
    if (!leadOwnerId) {
      return;
    }
    if (!scheduledAt) return;
    const at = new Date(scheduledAt);
    if (Number.isNaN(at.getTime()) || at.getTime() <= Date.now()) return;
    setSubmitting(true);
    try {
      await createSchedule({
        leadId,
        scheduledAt: at.toISOString(),
        assignedTo: leadOwnerId,
        note: note.trim() || undefined,
      });
      setScheduledAt("");
      setNote("");
      loadCallbacks();
      useCallbackDueStore.getState().fetchDue();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await updateSchedule(id, { status: "COMPLETED" });
      loadCallbacks();
      useCallbackDueStore.getState().fetchDue();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this reminder?")) return;
    try {
      await deleteSchedule(id);
      loadCallbacks();
      useCallbackDueStore.getState().fetchDue();
    } catch (e) {
      console.error(e);
    }
  };

  const minDatetime = (() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 1);
    return d.toISOString();
  })();

  const pending = callbacks.filter((c) => c.status === "PENDING");
  const completed = callbacks.filter((c) => c.status === "COMPLETED");

  return (
    <div className={s.LeadCallbacks}>
      <div className={s.LeadCallbacks__scrollWrap}>
        <div className={s.LeadCallbacks__scroll}>
          <h2 className={s.LeadCallbacks__title}>Reminders</h2>

          {!leadOwnerId && (
            <div className={s.LeadCallbacks__warning} role="alert">
              <strong>Cannot add reminders:</strong> this lead has no Lead Owner. Assign a Lead Owner in the Main Info tab — only then you can create reminders (notifications go to the lead owner automatically).
            </div>
          )}

          <div className={s.LeadCallbacks__form}>
            <span className={s.LeadCallbacks__formLabel}>New reminder</span>
            <div className={s.LeadCallbacks__formRow}>
              <label className={s.LeadCallbacks__label}>Date & time</label>
              <DateTimePicker
                value={scheduledAt}
                onChange={setScheduledAt}
                placeholder="Select date & time"
                aria-label="Reminder date and time"
                disabled={!leadOwnerId}
                min={minDatetime}
                className={s.LeadCallbacks__dateTimePicker}
              />
            </div>
            <div className={s.LeadCallbacks__formRow}>
              <label className={s.LeadCallbacks__label}>Note (optional)</label>
              <input
                type="text"
                className={s.LeadCallbacks__input}
                placeholder="e.g. Call back client"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={!leadOwnerId}
              />
            </div>
            <button
              type="button"
              className={s.LeadCallbacks__saveBtn}
              onClick={handleSubmit}
              disabled={!scheduledAt || !leadOwnerId || submitting}
            >
              {submitting ? "Adding…" : "Add reminder"}
            </button>
          </div>

          <div className={s.LeadCallbacks__list}>
            {loading ? (
              <p className={s.LeadCallbacks__loading}>Loading reminders…</p>
            ) : callbacks.length > 0 ? (
              <>
                <span className={s.LeadCallbacks__listTitle}>All reminders</span>
                {[...pending, ...completed].map((c) => (
                  <div
                    key={c.id}
                    className={`${s.LeadCallbacks__card} ${
                      c.status === "COMPLETED" ? s.LeadCallbacks__card_completed : ""
                    }`}
                  >
                    <div className={s.LeadCallbacks__cardMain}>
                      <p className={s.LeadCallbacks__cardTime}>
                        {formatScheduledAt(c.scheduledAt)}
                        {c.note ? ` · ${c.note}` : ""}
                      </p>
                      <p className={s.LeadCallbacks__cardMeta}>
                        Assigned to:{" "}
                        {employees.find((e) => e.id === c.assignedTo)?.firstName}{" "}
                        {employees.find((e) => e.id === c.assignedTo)?.lastName ?? c.assignedTo}
                      </p>
                    </div>
                    <div className={s.LeadCallbacks__cardActions}>
                      {c.status === "PENDING" && (
                        <button
                          type="button"
                          className={s.LeadCallbacks__completeBtn}
                          onClick={() => handleComplete(c.id)}
                        >
                          Mark done
                        </button>
                      )}
                      <button
                        type="button"
                        className={s.LeadCallbacks__deleteBtn}
                        onClick={() => handleDelete(c.id)}
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p className={s.LeadCallbacks__empty}>No reminders yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
