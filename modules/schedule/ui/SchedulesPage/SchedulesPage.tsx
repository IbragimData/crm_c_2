"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useAuthStore } from "@/features/auth/store/authStore";
import { Role } from "@/features/auth/types";
import { useEmployeesStore } from "@/features/employees/store/useEmployeesStore";
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "@/features/schedule/api/schedules.api";
import { useCallbackDueStore } from "@/features/schedule/store/useCallbackDueStore";
import type {
  CallbackSchedule,
  CreateCallbackSchedulePayload,
  UpdateCallbackSchedulePayload,
} from "@/features/schedule/types/schedule.types";
import { searchLeads } from "@/features/lead/api/searchLead.api";
import type { Lead } from "@/features/lead/types";
import { getTeamsWithDetails } from "@/features/teams/api";
import { DateTimePicker } from "@/components";
import s from "./SchedulesPage.module.scss";

const HOURS_START = 0;
const HOURS_END = 24;
const DAYS_IN_WEEK = 5; // Mon–Fri

function getWeekRange(date: Date): { monday: Date; friday: Date } {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);
  return { monday, friday };
}

function formatDayLabel(d: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[d.getDay()]} ${d.getDate()}`;
}

function getDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function SchedulesPage() {
  const { employee } = useAuthStore();
  const isAdmin =
    employee?.role === Role.ADMIN || employee?.role === Role.SUPER_ADMIN || employee?.role === Role.LEADMANAGER;
  const isTeamLeader = employee?.role === Role.TEAMLEADER;

  const [weekStart, setWeekStart] = useState(() => {
    const { monday } = getWeekRange(new Date());
    return monday;
  });
  const [assignedToFilter, setAssignedToFilter] = useState<string>("");
  const [showUnscheduled, setShowUnscheduled] = useState(true);
  const [schedules, setSchedules] = useState<CallbackSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [leadSearchQuery, setLeadSearchQuery] = useState("");
  const [leadSearchResults, setLeadSearchResults] = useState<Lead[]>([]);
  const [leadSearchOpen, setLeadSearchOpen] = useState(false);
  const [leadSearchLoading, setLeadSearchLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const leadSearchRef = useRef<HTMLDivElement>(null);
  const [createForm, setCreateForm] = useState<CreateCallbackSchedulePayload>({
    leadId: "",
    scheduledAt: "",
    assignedTo: "",
    note: "",
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  /** Для тимлида — id участников своих команд (только их показываем в фильтре и сетке). */
  const [teamMemberIds, setTeamMemberIds] = useState<Set<string> | null>(null);

  const { employees, fetchEmployees } = useEmployeesStore();

  const { monday, friday } = useMemo(
    () => getWeekRange(weekStart),
    [weekStart]
  );
  const dateFrom = useMemo(() => monday.toISOString(), [monday]);
  const dateTo = useMemo(() => friday.toISOString(), [friday]);

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getSchedules({
        dateFrom,
        dateTo,
        ...(assignedToFilter && { assignedTo: assignedToFilter }),
        take: 500,
      });
      setSchedules(res.items);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load reminders";
      setLoadError(message);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, assignedToFilter]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  useEffect(() => {
    if (isAdmin || isTeamLeader) {
      fetchEmployees(undefined, true);
    } else {
      fetchEmployees(undefined, true);
    }
  }, [fetchEmployees, isAdmin, isTeamLeader]);

  /** Тимлидер: загружаем свои команды и собираем id участников. */
  useEffect(() => {
    if (!isTeamLeader || !employee?.id) {
      setTeamMemberIds(null);
      return;
    }
    getTeamsWithDetails()
      .then((teams) => {
        const ids = new Set<string>();
        for (const team of teams) {
          for (const m of team.members ?? []) {
            ids.add(m.employeeId);
          }
        }
        setTeamMemberIds(ids);
      })
      .catch(() => setTeamMemberIds(new Set()));
  }, [isTeamLeader, employee?.id]);

  const goPrevWeek = () => {
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    setWeekStart(prev);
  };
  const goNextWeek = () => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + 7);
    setWeekStart(next);
  };
  const goToday = () => {
    const { monday } = getWeekRange(new Date());
    setWeekStart(monday);
  };

  const weekDays = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < DAYS_IN_WEEK; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [monday]);

  const assigneeOptions = useMemo(() => {
    const roleFilter = (e: { role: string }) =>
      e.role === Role.AGENT || e.role === Role.TEAMLEADER;
    if (isTeamLeader && teamMemberIds) {
      return employees.filter(
        (e) => roleFilter(e) && teamMemberIds.has(e.id)
      );
    }
    return employees.filter(roleFilter);
  }, [employees, isTeamLeader, teamMemberIds]);

  const employeesToShow = useMemo(() => {
    if (showUnscheduled) return assigneeOptions;
    const hasScheduleInWeek = new Set(
      schedules.map((s) => s.assignedTo)
    );
    return assigneeOptions.filter((e) => hasScheduleInWeek.has(e.id));
  }, [assigneeOptions, showUnscheduled, schedules]);

  const schedulesByEmployeeAndDay = useMemo(() => {
    const map: Record<string, Record<string, CallbackSchedule[]>> = {};
    for (const s of schedules) {
      if (s.status === "CANCELLED") continue;
      const dayKey = getDayKey(new Date(s.scheduledAt));
      if (!map[s.assignedTo]) map[s.assignedTo] = {};
      if (!map[s.assignedTo][dayKey]) map[s.assignedTo][dayKey] = [];
      map[s.assignedTo][dayKey].push(s);
    }
    return map;
  }, [schedules]);

  function getCardStatus(sch: CallbackSchedule): "missed" | "late" | "pending" | "completed" {
    if (sch.status === "COMPLETED") return "completed";
    const scheduled = new Date(sch.scheduledAt);
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    if (scheduled.getTime() < now.getTime()) return "missed";
    if (scheduled.getTime() >= todayStart.getTime() && scheduled.getTime() < todayEnd.getTime()) return "late";
    return "pending";
  }

  const schedulesBySlot = useMemo(() => {
    const map: Record<string, CallbackSchedule[]> = {};
    for (const s of schedules) {
      if (s.status === "CANCELLED") continue;
      const d = new Date(s.scheduledAt);
      const dayKey = getDayKey(d);
      const hour = d.getHours();
      const key = `${dayKey}-${hour}`;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  }, [schedules]);

  const openCreate = () => {
    setEditingId(null);
    setCreateForm({
      leadId: "",
      scheduledAt: "",
      assignedTo: "",
      note: "",
    });
    setLeadSearchQuery("");
    setLeadSearchResults([]);
    setLeadSearchOpen(false);
    setSelectedLead(null);
    setModalOpen(true);
    setCreateError(null);
  };

  useEffect(() => {
    if (!leadSearchQuery.trim()) {
      setLeadSearchResults([]);
      return;
    }
    setLeadSearchLoading(true);
    const t = setTimeout(() => {
      searchLeads({ query: leadSearchQuery.trim(), take: 15 })
        .then((items) => {
          setLeadSearchResults(items);
          setLeadSearchOpen(true);
        })
        .catch(() => setLeadSearchResults([]))
        .finally(() => setLeadSearchLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [leadSearchQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (leadSearchRef.current?.contains(target)) return;
      setLeadSearchOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!createForm.leadId || !createForm.scheduledAt) {
      return;
    }
    if (!createForm.assignedTo) {
      setCreateError("This lead has no Lead Owner. Assign a Lead Owner in the lead profile — only then you can create a reminder.");
      return;
    }
    setSubmitLoading(true);
    try {
      await createSchedule(createForm);
      setModalOpen(false);
      loadSchedules();
      useCallbackDueStore.getState().fetchDue();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create reminder";
      setCreateError(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleStatusChange = async (
    id: string,
    status: UpdateCallbackSchedulePayload["status"]
  ) => {
    if (!status) return;
    try {
      await updateSchedule(id, { status });
      loadSchedules();
      useCallbackDueStore.getState().fetchDue();
    } catch (_) {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this reminder?")) return;
    try {
      await deleteSchedule(id);
      loadSchedules();
      useCallbackDueStore.getState().fetchDue();
    } catch (_) {}
  };

  const getAssigneeName = (assignedToId: string) => {
    const emp = employees.find((e) => e.id === assignedToId);
    return emp ? `${emp.firstName} ${emp.lastName}` : assignedToId;
  };

  return (
    <div className={s.SchedulesPage}>
      <div className={s.SchedulesPage__header}>
        <h1 className={s.SchedulesPage__title}>Reminders</h1>
        <div className={s.SchedulesPage__nav}>
          <button
            type="button"
            className={s.SchedulesPage__navBtn}
            onClick={goPrevWeek}
            aria-label="Previous week"
          >
            ‹
          </button>
          <button
            type="button"
            className={s.SchedulesPage__navBtn}
            onClick={goNextWeek}
            aria-label="Next week"
          >
            ›
          </button>
          <button
            type="button"
            className={s.SchedulesPage__todayBtn}
            onClick={goToday}
          >
            Today
          </button>
        </div>
      </div>

      {(isAdmin || isTeamLeader) && assigneeOptions.length > 0 && (
        <div className={s.SchedulesPage__filters}>
          <label className={s.SchedulesPage__filterLabel}>
            Employee
            <select
              className={s.SchedulesPage__select}
              value={assignedToFilter}
              onChange={(e) => setAssignedToFilter(e.target.value)}
            >
              <option value="">All</option>
              {assigneeOptions.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className={s.SchedulesPage__toolbar}>
        {(isAdmin || isTeamLeader) && (
          <label className={s.SchedulesPage__toggle}>
            <input
              type="checkbox"
              checked={showUnscheduled}
              onChange={(e) => setShowUnscheduled(e.target.checked)}
            />
            <span>Show unscheduled</span>
          </label>
        )}
        <button
          type="button"
          className={s.SchedulesPage__addBtn}
          onClick={openCreate}
        >
          + Add reminder
        </button>
      </div>

      {loading ? (
        <p className={s.SchedulesPage__loading}>Loading…</p>
      ) : loadError ? (
        <div className={s.SchedulesPage__error}>
          <p>{loadError}</p>
          <button
            type="button"
            className={s.SchedulesPage__addBtn}
            onClick={() => loadSchedules()}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className={s.SchedulesPage__gridWrap}>
          {isAdmin || isTeamLeader ? (
            <div className={s.SchedulesPage__staffGrid}>
              <div className={s.SchedulesPage__staffHead}>
                <div className={s.SchedulesPage__staffCorner} />
                {weekDays.map((day) => (
                  <div
                    key={getDayKey(day)}
                    className={s.SchedulesPage__staffDayHead}
                  >
                    {formatDayLabel(day)}
                  </div>
                ))}
              </div>
              {(assignedToFilter
                ? employeesToShow.filter((e) => e.id === assignedToFilter)
                : employeesToShow
              ).map((emp) => (
                <div
                  key={emp.id}
                  className={s.SchedulesPage__staffRow}
                >
                  <div className={s.SchedulesPage__staffEmployee}>
                    <span className={s.SchedulesPage__staffAvatar} />
                    <span>
                      {emp.firstName} {emp.lastName}
                    </span>
                  </div>
                  {weekDays.map((day) => {
                    const dayKey = getDayKey(day);
                    const items =
                      schedulesByEmployeeAndDay[emp.id]?.[dayKey] ?? [];
                    return (
                      <div
                        key={dayKey}
                        className={s.SchedulesPage__staffCell}
                      >
                        {items.map((sch) => {
                          const status = getCardStatus(sch);
                          return (
                            <div
                              key={sch.id}
                              className={s.SchedulesPage__card}
                              data-status={sch.status}
                              data-card-status={status}
                            >
                              {status !== "pending" && status !== "completed" && (
                                <span
                                  className={
                                    status === "missed"
                                      ? s.SchedulesPage__cardBadgeMissed
                                      : s.SchedulesPage__cardBadgeLate
                                  }
                                >
                                  {status === "missed" ? "Missed" : "Late"}
                                </span>
                              )}
                              <span
                                className={s.SchedulesPage__cardDot}
                                data-status={sch.status}
                                data-card-status={status}
                              />
                              <div className={s.SchedulesPage__cardBody}>
                                <Link
                                  href={`/leads/${sch.leadId}?tab=0`}
                                  className={s.SchedulesPage__cardLead}
                                >
                                  {sch.lead.firstName} {sch.lead.lastName}
                                  {sch.lead.shortId
                                    ? ` (${sch.lead.shortId})`
                                    : ""}
                                </Link>
                                <div className={s.SchedulesPage__cardTime}>
                                  {new Date(sch.scheduledAt).toLocaleTimeString(
                                    "en-GB",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </div>
                              </div>
                              <div className={s.SchedulesPage__cardActions}>
                                {sch.status === "PENDING" && (
                                  <button
                                    type="button"
                                    className={s.SchedulesPage__cardBtn}
                                    onClick={() =>
                                      handleStatusChange(sch.id, "COMPLETED")
                                    }
                                    title="Mark done"
                                  >
                                    ✓
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className={s.SchedulesPage__cardBtn}
                                  onClick={() => handleDelete(sch.id)}
                                  title="Delete"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className={`${s.SchedulesPage__grid} ${s.SchedulesPage__grid_time}`}>
              {/* Row 1: headers */}
              <div className={s.SchedulesPage__timeHead} />
              {weekDays.map((day) => (
                <div key={getDayKey(day)} className={s.SchedulesPage__dayHead}>
                  {formatDayLabel(day)}
                </div>
              ))}
              {/* Rows 2–25: one row per hour — 6 cells per row (time + 5 days) */}
              {Array.from({ length: HOURS_END - HOURS_START }, (_, hour) => [
                <div key={`t-${hour}`} className={s.SchedulesPage__timeCell}>
                  {hour}:00
                </div>,
                ...weekDays.map((day) => {
                  const dayKey = getDayKey(day);
                  const slotKey = `${dayKey}-${hour}`;
                  const items = schedulesBySlot[slotKey] ?? [];
                  return (
                    <div key={slotKey} className={s.SchedulesPage__slot}>
                      {items.map((sch) => {
                        const status = getCardStatus(sch);
                        return (
                          <div
                            key={sch.id}
                            className={s.SchedulesPage__card}
                            data-status={sch.status}
                            data-card-status={status}
                          >
                            {status !== "pending" &&
                              status !== "completed" && (
                                <span
                                  className={
                                    status === "missed"
                                      ? s.SchedulesPage__cardBadgeMissed
                                      : s.SchedulesPage__cardBadgeLate
                                  }
                                >
                                  {status === "missed"
                                    ? "Missed"
                                    : "Late"}
                                </span>
                              )}
                            <span
                              className={s.SchedulesPage__cardDot}
                              data-status={sch.status}
                              data-card-status={status}
                            />
                            <div className={s.SchedulesPage__cardBody}>
                              <Link
                                href={`/leads/${sch.leadId}?tab=0`}
                                className={s.SchedulesPage__cardLead}
                              >
                                {sch.lead.firstName} {sch.lead.lastName}
                                {sch.lead.shortId
                                  ? ` (${sch.lead.shortId})`
                                  : ""}
                              </Link>
                              <div className={s.SchedulesPage__cardTime}>
                                {new Date(
                                  sch.scheduledAt
                                ).toLocaleTimeString("en-GB", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                            <div className={s.SchedulesPage__cardActions}>
                              {sch.status === "PENDING" && (
                                <button
                                  type="button"
                                  className={s.SchedulesPage__cardBtn}
                                  onClick={() =>
                                    handleStatusChange(sch.id, "COMPLETED")
                                  }
                                  title="Mark done"
                                >
                                  ✓
                                </button>
                              )}
                              <button
                                type="button"
                                className={s.SchedulesPage__cardBtn}
                                onClick={() => handleDelete(sch.id)}
                                title="Delete"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }),
              ]).flat()}
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <div
          className={s.SchedulesPage__overlay}
          onClick={() => setModalOpen(false)}
          role="presentation"
        />
      )}
      {modalOpen && (
        <div className={s.SchedulesPage__modal}>
          <h2 className={s.SchedulesPage__modalTitle}>Add reminder</h2>
          <form onSubmit={handleCreateSubmit}>
            <div className={s.SchedulesPage__field}>
              <label>Lead</label>
              <div
                ref={leadSearchRef}
                className={s.SchedulesPage__leadSearchWrap}
              >
                {selectedLead ? (
                  <div className={s.SchedulesPage__selectedLead}>
                    <span>
                      {selectedLead.firstName} {selectedLead.lastName}
                      {selectedLead.shortId
                        ? ` (${selectedLead.shortId})`
                        : ""}
                    </span>
                    <button
                      type="button"
                      className={s.SchedulesPage__changeLeadBtn}
                      onClick={() => {
                        setSelectedLead(null);
                        setCreateForm((f) => ({ ...f, leadId: "", assignedTo: "" }));
                        setLeadSearchQuery("");
                        setLeadSearchResults([]);
                      }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      className={s.SchedulesPage__input}
                      placeholder="Search by name or ID..."
                      value={leadSearchQuery}
                      onChange={(e) => {
                        setLeadSearchQuery(e.target.value);
                        setLeadSearchOpen(true);
                      }}
                      onFocus={() =>
                        leadSearchResults.length > 0 && setLeadSearchOpen(true)
                      }
                      autoComplete="off"
                      aria-autocomplete="list"
                      aria-expanded={leadSearchOpen}
                    />
                    {leadSearchLoading && (
                      <span className={s.SchedulesPage__leadSearchLoading}>
                        Searching…
                      </span>
                    )}
                    {leadSearchOpen && leadSearchResults.length > 0 && (
                      <ul
                        className={s.SchedulesPage__leadDropdown}
                        role="listbox"
                      >
                        {leadSearchResults.map((lead) => (
                          <li key={lead.id} role="option">
                            <button
                              type="button"
                              className={s.SchedulesPage__leadOption}
                              onClick={() => {
                                setCreateForm((f) => ({
                                  ...f,
                                  leadId: lead.id,
                                  assignedTo: lead.leadOwnerId ?? "",
                                }));
                                setSelectedLead(lead);
                                setLeadSearchQuery("");
                                setLeadSearchResults([]);
                                setLeadSearchOpen(false);
                              }}
                            >
                              {lead.firstName} {lead.lastName}
                              {lead.shortId ? ` (${lead.shortId})` : ""}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {leadSearchQuery.trim() &&
                      !leadSearchLoading &&
                      leadSearchResults.length === 0 && (
                        <div className={s.SchedulesPage__leadNoResults}>
                          No leads found
                        </div>
                      )}
                  </>
                )}
              </div>
            </div>
            <div className={s.SchedulesPage__field}>
              <label>Date & time</label>
              <DateTimePicker
                value={createForm.scheduledAt}
                onChange={(iso) =>
                  setCreateForm((f) => ({ ...f, scheduledAt: iso }))
                }
                placeholder="Select date & time"
                aria-label="Reminder date and time"
                min={new Date(Date.now() + 60000).toISOString()}
                className={s.SchedulesPage__dateTimePicker}
              />
            </div>
            {selectedLead && (
              <div className={s.SchedulesPage__field}>
                {createForm.assignedTo ? (
                  <span className={s.SchedulesPage__hint}>
                    Notifications go to lead owner: {getAssigneeName(createForm.assignedTo)}
                  </span>
                ) : (
                  <div className={s.SchedulesPage__warning} role="alert">
                    <strong>Cannot create reminder:</strong> this lead has no Lead Owner. Assign a Lead Owner in the lead profile — only then you can add a reminder.
                  </div>
                )}
              </div>
            )}
            {createError && (
              <div className={s.SchedulesPage__createError} role="alert">
                {createError}
              </div>
            )}
            <div className={s.SchedulesPage__field}>
              <label>Note (optional)</label>
              <input
                type="text"
                className={s.SchedulesPage__input}
                value={createForm.note ?? ""}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, note: e.target.value }))
                }
              />
            </div>
            <div className={s.SchedulesPage__modalActions}>
              <button
                type="button"
                className={s.SchedulesPage__cancelBtn}
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={s.SchedulesPage__submitBtn}
                disabled={submitLoading || !createForm.leadId || !createForm.scheduledAt || !createForm.assignedTo}
              >
                {submitLoading ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
