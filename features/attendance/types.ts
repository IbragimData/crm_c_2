export interface AttendanceSession {
  id: string;
  employeeId: string;
  employeeName?: string;
  startedAt: string; // ISO
  endedAt: string | null;
  durationMinutes: number | null;
}

export interface AttendanceReportParams {
  dateFrom?: string;
  dateTo?: string;
  employeeId?: string;
}

export interface AttendanceSummaryByEmployee {
  employeeId: string;
  employeeName: string;
  totalMinutes: number;
  totalHours: number;
  sessionsCount: number;
  /** Salary per month (from backend) */
  monthlySalary?: number | null;
  /** Hours per day (date string YYYY-MM-DD -> hours) */
  byDay: Record<string, number>;
  /** Week key "YYYY-Www" -> hours */
  byWeek: Record<string, number>;
  /** Month key "YYYY-MM" -> hours */
  byMonth: Record<string, number>;
}

export interface AttendanceReportResult {
  sessions: AttendanceSession[];
  summary: {
    byEmployee: Record<string, AttendanceSummaryByEmployee>;
    totalSessions: number;
    totalMinutes: number;
    totalHours: number;
  };
}
