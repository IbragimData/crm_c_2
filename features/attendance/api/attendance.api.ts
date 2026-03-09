import { timeApiInstance } from "@/config/timeApi";
import type {
  AttendanceSession,
  AttendanceReportParams,
  AttendanceReportResult,
  AttendanceSummaryByEmployee,
} from "../types";

const STORAGE_KEY_SESSIONS = "crm_attendance_sessions";
const STORAGE_KEY_ACTIVE = "crm_attendance_active";

function getStoredSessions(): AttendanceSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredSessions(sessions: AttendanceSession[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
}

export function getStoredActiveSession(): AttendanceSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE);
    if (!raw) return null;
    const session = JSON.parse(raw) as AttendanceSession;
    // Only treat as valid if session id is from server (UUID), not old client id (att_xxx)
    if (!session?.id || session.id.startsWith("att_")) return null;
    return session;
  } catch {
    return null;
  }
}

export function setStoredActiveSession(session: AttendanceSession | null) {
  if (typeof window === "undefined") return;
  if (session) {
    localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEY_ACTIVE);
  }
}

function formatDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getWeekKey(d: Date): string {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  const y = start.getFullYear();
  const w = Math.ceil((start.getDate() + 6) / 7);
  return `${y}-W${String(w).padStart(2, "0")}`;
}

function formatMonth(d: Date): string {
  return d.toISOString().slice(0, 7);
}

function buildSummaryFromSessions(
  sessions: AttendanceSession[]
): AttendanceReportResult["summary"] {
  const completed = sessions.filter((s) => s.endedAt != null && s.durationMinutes != null);
  const byEmployee: Record<string, AttendanceSummaryByEmployee> = {};
  let totalMinutes = 0;

  for (const s of completed) {
    const mins = s.durationMinutes ?? 0;
    totalMinutes += mins;
    const key = s.employeeId;
    const name = s.employeeName ?? s.employeeId;
    if (!byEmployee[key]) {
      byEmployee[key] = {
        employeeId: key,
        employeeName: name,
        totalMinutes: 0,
        totalHours: 0,
        sessionsCount: 0,
        byDay: {},
        byWeek: {},
        byMonth: {},
      };
    }
    const emp = byEmployee[key];
    emp.totalMinutes += mins;
    emp.totalHours = Math.round((emp.totalMinutes / 60) * 100) / 100;
    emp.sessionsCount += 1;

    const started = new Date(s.startedAt);
    const dayKey = formatDay(started);
    const weekKey = getWeekKey(started);
    const monthKey = formatMonth(started);
    const hours = mins / 60;
    emp.byDay[dayKey] = (emp.byDay[dayKey] ?? 0) + hours;
    emp.byWeek[weekKey] = (emp.byWeek[weekKey] ?? 0) + hours;
    emp.byMonth[monthKey] = (emp.byMonth[monthKey] ?? 0) + hours;
  }

  for (const emp of Object.values(byEmployee)) {
    emp.totalHours = Math.round((emp.totalMinutes / 60) * 100) / 100;
  }

  return {
    byEmployee,
    totalSessions: completed.length,
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 100) / 100,
  };
}

function filterSessions(
  sessions: AttendanceSession[],
  params: AttendanceReportParams
): AttendanceSession[] {
  let list = sessions.filter((s) => s.endedAt != null);
  if (params.employeeId) {
    list = list.filter((s) => s.employeeId === params.employeeId);
  }
  if (params.dateFrom) {
    const from = new Date(params.dateFrom).getTime();
    list = list.filter((s) => new Date(s.startedAt).getTime() >= from);
  }
  if (params.dateTo) {
    const to = new Date(params.dateTo).getTime() + 86400000;
    list = list.filter((s) => new Date(s.startedAt).getTime() < to);
  }
  return list.sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
}

/** Start work shift. Saves to server so admin can see the report. */
export async function startAttendance(
  employeeId: string,
  employeeName: string
): Promise<AttendanceSession> {
  const startedAt = new Date().toISOString();

  const { data } = await timeApiInstance.post<AttendanceSession>("/attendance/start", {
    employeeId,
    startedAt,
  });
  const saved: AttendanceSession = {
    id: data.id,
    employeeId: data.employeeId ?? employeeId,
    employeeName,
    startedAt: data.startedAt ?? startedAt,
    endedAt: null,
    durationMinutes: null,
  };
  setStoredActiveSession(saved);
  return saved;
}

/** End current shift. Sends to server so admin report shows duration. */
export async function endAttendance(
  sessionId: string,
  employeeId: string
): Promise<AttendanceSession | null> {
  const active = getStoredActiveSession();
  if (!active || active.id !== sessionId) return null;

  const endedAt = new Date();
  const started = new Date(active.startedAt).getTime();
  const durationMinutes = Math.round((endedAt.getTime() - started) / 60000);

  await timeApiInstance.post("/attendance/end", {
    sessionId,
    endedAt: endedAt.toISOString(),
    durationMinutes,
  });

  const completed: AttendanceSession = {
    ...active,
    endedAt: endedAt.toISOString(),
    durationMinutes,
  };
  setStoredActiveSession(null);
  const sessions = getStoredSessions();
  sessions.unshift(completed);
  setStoredSessions(sessions);
  return completed;
}

/** Get salaries map (employeeId -> monthlySalary). Admin only. */
export async function getAttendanceSalaries(): Promise<Record<string, number>> {
  const { data } = await timeApiInstance.get<Record<string, number>>("/attendance/salaries");
  return data ?? {};
}

/** Set monthly salary for an employee. Admin only. */
export async function setAttendanceSalary(
  employeeId: string,
  monthlySalary: number
): Promise<{ employeeId: string; monthlySalary: number }> {
  const { data } = await timeApiInstance.put<{ employeeId: string; monthlySalary: number }>(
    "/attendance/salary",
    { employeeId, monthlySalary }
  );
  return data;
}

/** Get attendance report (from API or local). */
export async function getAttendanceReport(
  params: AttendanceReportParams = {}
): Promise<AttendanceReportResult> {
  try {
    const { data } = await timeApiInstance.get<AttendanceReportResult>("/attendance/report", {
      params: {
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        employeeId: params.employeeId,
        _t: Date.now(), // cache-bust so changing dates always gets fresh data
      },
    });
    return data;
  } catch {
    const all = getStoredSessions();
    const sessions = filterSessions(all, params);
    const summary = buildSummaryFromSessions(sessions);
    return { sessions, summary };
  }
}
