import { timeApiInstance } from "@/config/timeApi";
import type {
  BreakSession,
  BreakType,
  BreaksReportParams,
  BreaksReportResult,
  BreaksStatus,
  BreaksSummary,
} from "../types";

const STORAGE_KEY_SESSIONS = "crm_break_sessions";
const STORAGE_KEY_ACTIVE = "crm_break_active";

function getStoredSessions(): BreakSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredSessions(sessions: BreakSession[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
}

export function getStoredActiveBreak(): BreakSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE);
    if (!raw) return null;
    const session = JSON.parse(raw) as BreakSession;
    // Only treat as valid if session id is from server (UUID), not old client id (break_xxx)
    if (!session?.id || session.id.startsWith("break_")) return null;
    return session;
  } catch {
    return null;
  }
}

export function setStoredActiveBreak(session: BreakSession | null) {
  if (typeof window === "undefined") return;
  if (session) {
    localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEY_ACTIVE);
  }
}

function buildSummary(sessions: BreakSession[]): BreaksSummary {
  const byType = {
    FIRST_BREAK: { count: 0, totalMinutes: 0 },
    SECOND_BREAK: { count: 0, totalMinutes: 0 },
    LUNCH: { count: 0, totalMinutes: 0 },
  } as BreaksSummary["byType"];
  const byEmployee: Record<string, { name: string; count: number; totalMinutes: number }> = {};
  let totalMinutes = 0;

  for (const s of sessions) {
    if (s.endedAt != null && s.durationMinutes != null) {
      byType[s.breakType].count += 1;
      byType[s.breakType].totalMinutes += s.durationMinutes;
      totalMinutes += s.durationMinutes;
      const key = s.employeeId;
      const name = s.employeeName ?? key;
      if (!byEmployee[key]) byEmployee[key] = { name, count: 0, totalMinutes: 0 };
      byEmployee[key].count += 1;
      byEmployee[key].totalMinutes += s.durationMinutes;
    }
  }

  return {
    byType,
    byEmployee,
    totalSessions: sessions.filter((s) => s.endedAt != null).length,
    totalMinutes,
  };
}

function filterSessions(
  sessions: BreakSession[],
  params: BreaksReportParams
): BreakSession[] {
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

/** Start a break. Saves to server so admin can see in report. */
export async function startBreak(
  employeeId: string,
  employeeName: string,
  breakType: BreakType
): Promise<BreakSession> {
  const startedAt = new Date().toISOString();

  const { data } = await timeApiInstance.post<BreakSession>("/breaks/start", {
    employeeId,
    breakType,
    startedAt,
  });
  const saved: BreakSession = {
    id: data.id,
    employeeId: data.employeeId ?? employeeId,
    employeeName,
    breakType: data.breakType ?? breakType,
    startedAt: data.startedAt ?? startedAt,
    endedAt: null,
    durationMinutes: null,
  };
  setStoredActiveBreak(saved);
  return saved;
}

/** End the current break. Sends to server so admin report shows duration. */
export async function endBreak(
  sessionId: string,
  employeeId: string
): Promise<BreakSession | null> {
  const active = getStoredActiveBreak();
  if (!active || active.id !== sessionId) return null;

  const endedAt = new Date();
  const started = new Date(active.startedAt).getTime();
  const durationMinutes = Math.round((endedAt.getTime() - started) / 60000);

  await timeApiInstance.post("/breaks/end", {
    sessionId,
    endedAt: endedAt.toISOString(),
    durationMinutes,
  });

  const completed: BreakSession = {
    ...active,
    endedAt: endedAt.toISOString(),
    durationMinutes,
  };
  setStoredActiveBreak(null);
  const sessions = getStoredSessions();
  sessions.unshift(completed);
  setStoredSessions(sessions);
  return completed;
}

/** Get current user's break status (active shift, active break, break types taken this shift). */
export async function getBreaksStatus(): Promise<BreaksStatus> {
  const { data } = await timeApiInstance.get<BreaksStatus>("/breaks/status");
  return data;
}
export async function getBreaksReport(
  params: BreaksReportParams = {}
): Promise<BreaksReportResult> {
  try {
    const { data } = await timeApiInstance.get<BreaksReportResult>("/breaks/report", {
      params: {
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        employeeId: params.employeeId,
      },
    });
    return data;
  } catch {
    const all = getStoredSessions();
    const sessions = filterSessions(all, params);
    return {
      sessions,
      summary: buildSummary(sessions),
    };
  }
}
