import axios from "axios";
import { API_CONFIG } from "@/config/api";
import type {
  DepositStatsResponse,
  DepositStatsForTeamResponse,
  TeamTargetApi,
  MyTeamTargetResponse,
  AgentsTargetsSummaryResponse,
  MyDepositsResponse,
  MyTargetResponse,
  MyEarningsResponse,
  DepositHistoryResponse,
  MonthReportResponse,
} from "../types/deposits.types";

const paramsSerializer = (params: Record<string, unknown>) => {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null) continue;
    searchParams.append(key, String(value));
  }
  return searchParams.toString();
};

const depositsAxios = axios.create({
  baseURL: API_CONFIG.LEAD_URL,
  paramsSerializer,
});

depositsAxios.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

depositsAxios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ——— Admin ———
export async function getDepositStats(weekOffset: number = 0): Promise<DepositStatsResponse> {
  const { data } = await depositsAxios.get<DepositStatsResponse>("/deposits/stats", {
    params: { weekOffset },
  });
  return data;
}

export async function setTeamTarget(body: {
  teamId: string;
  targetAmount: number;
}): Promise<{ id: string }> {
  const { data } = await depositsAxios.post<{ id: string }>("/deposits/targets/team", body);
  return data;
}

export async function getTeamTargets(weekOffset: number = 0): Promise<TeamTargetApi[]> {
  const { data } = await depositsAxios.get<TeamTargetApi[]>("/deposits/targets/team", {
    params: { weekOffset },
  });
  return Array.isArray(data) ? data : [];
}

/** Team leader: weekly stats for own team (total + byDay) */
export async function getDepositStatsForTeam(
  weekOffset: number = 0,
  teamId?: string
): Promise<DepositStatsForTeamResponse> {
  const { data } = await depositsAxios.get<DepositStatsForTeamResponse>("/deposits/stats/team", {
    params: { weekOffset, ...(teamId ? { teamId } : {}) },
  });
  return data;
}

// ——— Team Leader ———
export async function getMyTeamTarget(teamId?: string, weekOffset: number = 0): Promise<MyTeamTargetResponse> {
  const { data } = await depositsAxios.get<MyTeamTargetResponse>("/deposits/targets/my-team", {
    params: { ...(teamId ? { teamId } : {}), weekOffset },
  });
  return data;
}

export async function setAgentTarget(body: {
  teamId: string;
  agentId: string;
  targetAmount: number;
}): Promise<{ id: string }> {
  const { data } = await depositsAxios.post<{ id: string }>("/deposits/targets/agent", body);
  return data;
}

export async function getAgentsTargetsSummary(
  params?: { weekOffset?: number; teamId?: string }
): Promise<AgentsTargetsSummaryResponse> {
  const { data } = await depositsAxios.get<AgentsTargetsSummaryResponse>("/deposits/targets/agents", {
    params: { weekOffset: params?.weekOffset ?? 0, ...(params?.teamId ? { teamId: params.teamId } : {}) },
  });
  return data;
}

// ——— Agent / shared ———
export async function getMyDeposits(weekOffset: number = 0): Promise<MyDepositsResponse> {
  const { data } = await depositsAxios.get<MyDepositsResponse>("/deposits/my", {
    params: { weekOffset },
  });
  return data;
}

export async function getMyTarget(weekOffset: number = 0): Promise<MyTargetResponse> {
  const { data } = await depositsAxios.get<MyTargetResponse>("/deposits/my-target", {
    params: { weekOffset },
  });
  return data;
}

export async function getMyEarnings(weekOffset: number = 0): Promise<MyEarningsResponse> {
  const { data } = await depositsAxios.get<MyEarningsResponse>("/deposits/my-earnings", {
    params: { weekOffset },
  });
  return data;
}

export async function createDeposit(body: {
  amount: number;
  teamId: string;
  agentId: string;
  depositDate?: string;
  leadId?: string;
}): Promise<{ id: string }> {
  const { data } = await depositsAxios.post<{ id: string }>("/deposits", body);
  return data;
}

/** Delete deposit (super-admin only). Returns { id }. */
export async function deleteDeposit(id: string): Promise<{ id: string }> {
  const { data } = await depositsAxios.delete<{ id: string }>(`/deposits/${id}`);
  return data;
}

export async function getDepositsHistory(params?: {
  weekOffset?: number;
  teamId?: string;
  leadId?: string;
  agentId?: string;
  skip?: number;
  take?: number;
}): Promise<DepositHistoryResponse> {
  const { data } = await depositsAxios.get<DepositHistoryResponse>("/deposits/history", {
    params: { weekOffset: params?.weekOffset ?? 0, ...params },
  });
  return data;
}

export async function getMonthReport(year: number, month: number): Promise<MonthReportResponse> {
  const { data } = await depositsAxios.get<MonthReportResponse>("/deposits/report/month", {
    params: { year, month },
  });
  return data;
}
