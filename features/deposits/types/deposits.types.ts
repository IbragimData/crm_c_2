/** Week: Monday–Sunday */
export interface DepositWeekRange {
  weekStart: string;
  weekEnd: string;
}

/** Weekly/monthly stats by team */
export interface DepositStatsByTeam {
  teamId: string;
  teamName: string;
  total: number;
  /** Weekly target (only in week.byTeam) */
  targetAmount?: number;
  /** Remaining to target (only in week.byTeam) */
  remaining?: number;
}

/** Weekly stats by agent (deposit count, total amount, commission 10%) — admin only */
export interface DepositStatsByAgent {
  agentId: string;
  /** Number of deposits made this week */
  depositCount: number;
  total: number;
  commissionAmount: number;
}

export interface DepositStatsResponse {
  week: {
    weekStart: string;
    weekEnd: string;
    weekLabel: string;
    total: number;
    byTeam: DepositStatsByTeam[];
    /** Per-agent deposits and commission (admin stats) */
    byAgent?: DepositStatsByAgent[];
    /** Sums by day of week: Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6 */
    byDay?: number[];
  };
  month: {
    monthStart: string;
    monthEnd: string;
    total: number;
    byTeam: DepositStatsByTeam[];
  };
}

export interface TeamTargetApi {
  id: string;
  teamId: string;
  teamName: string;
  targetAmount: number;
  weekStart: string;
  weekEnd: string;
  weekLabel?: string;
}

export interface MyTeamTargetResponse {
  teamTarget: {
    id: string;
    teamId: string;
    teamName: string;
    targetAmount: number;
    total: number;
    remaining: number;
    weekStart: string;
    weekEnd: string;
  } | null;
  teamId?: string;
  teamName?: string;
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
}

export interface AgentTargetRow {
  agentId: string;
  targetAmount: number;
  total: number;
  remaining: number;
  teamMemberId: string;
}

export interface AgentsTargetsSummaryResponse {
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  teamId: string;
  teamTarget: number;
  teamTotal: number;
  teamRemaining: number;
  agents: AgentTargetRow[];
}

export interface DepositItemApi {
  id: string;
  amount: number;
  teamId: string;
  teamName: string;
  createdAt: string;
}

export interface MyDepositsResponse {
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  items: DepositItemApi[];
  total: number;
}

export interface MyTargetResponse {
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  targetAmount: number;
  total: number;
  remaining: number;
}

export interface DepositHistoryItemApi {
  id: string;
  amount: number;
  teamId: string;
  teamName: string;
  agentId: string;
  leadId?: string;
  leadFirstName?: string;
  leadLastName?: string;
  createdAt: string;
}

export interface DepositHistoryResponse {
  items: DepositHistoryItemApi[];
  total: number;
  /** When history is filtered by agentId (admin), all-time totals for that agent */
  agentSummary?: {
    allTimeDepositCount: number;
    allTimeDepositTotal: number;
  };
  /** When history is filtered by agentId (admin), selected week totals for that agent */
  weekSummary?: {
    weekDepositCount: number;
    weekDepositTotal: number;
  };
}

export interface MonthReportResponse {
  monthStart: string;
  monthEnd: string;
  monthLabel: string;
  total: number;
  byTeam: DepositStatsByTeam[];
}

/** Stats for the week for team leader (own team only) */
export interface DepositStatsForTeamResponse {
  week: {
    weekStart: string;
    weekEnd: string;
    weekLabel: string;
    total: number;
    byDay: number[];
  };
}

/** Agent earnings: 10% of own deposits for the week */
export interface MyEarningsAgentResponse {
  role: "agent";
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  depositsTotal: number;
  commissionPercent: number;
  commissionAmount: number;
  items: DepositItemApi[];
}

/** Team leader earnings: 10% own + 3% from each agent (not own) */
export interface MyEarningsTeamLeaderResponse {
  role: "teamLeader";
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  ownDepositsTotal: number;
  ownCommissionPercent: number;
  ownCommissionAmount: number;
  agentsDepositsTotal: number;
  agentsCommissionPercent: number;
  agentsCommissionAmount: number;
  totalCommissionAmount: number;
  agentsBreakdown: { agentId: string; depositsTotal: number; commissionAmount: number }[];
}

export type MyEarningsResponse = MyEarningsAgentResponse | MyEarningsTeamLeaderResponse;
