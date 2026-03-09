export const BREAK_TYPE = {
  FIRST_BREAK: "FIRST_BREAK",
  SECOND_BREAK: "SECOND_BREAK",
  LUNCH: "LUNCH",
} as const;

export type BreakType = keyof typeof BREAK_TYPE;

export const BREAK_TYPE_LABELS: Record<BreakType, string> = {
  FIRST_BREAK: "First break",
  SECOND_BREAK: "Second break",
  LUNCH: "Lunch break",
};

export interface BreakSession {
  id: string;
  employeeId: string;
  employeeName?: string;
  breakType: BreakType;
  startedAt: string; // ISO
  endedAt: string | null;
  durationMinutes: number | null;
}

export interface BreaksReportSummary {
  byType: Record<BreakType, { count: number; totalMinutes: number }>;
  byEmployee: Record<string, { name: string; count: number; totalMinutes: number }>;
  totalSessions: number;
  totalMinutes: number;
}

export interface BreaksSummary {
  byType: Record<BreakType, { count: number; totalMinutes: number }>;
  byEmployee: Record<string, { name: string; count: number; totalMinutes: number }>;
  totalSessions: number;
  totalMinutes: number;
}

export interface BreaksReportParams {
  dateFrom?: string;
  dateTo?: string;
  employeeId?: string;
}

export interface BreaksReportResult {
  sessions: BreakSession[];
  summary: BreaksSummary;
}

export interface BreaksStatus {
  hasActiveShift: boolean;
  hasActiveBreak: boolean;
  activeBreakSession: {
    id: string;
    employeeId: string;
    breakType: BreakType;
    startedAt: string;
  } | null;
  breaksTakenThisShift: BreakType[];
}
