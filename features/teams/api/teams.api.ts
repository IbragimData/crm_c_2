import axios from "axios";
import { API_CONFIG } from "@/config/api";
import type {
  TeamApi,
  TeamWithDetailsApi,
  TeamMemberApi,
  LeadAssignmentApi,
  GetTeamLeadsParamsApi,
  GetTeamLeadsResponseApi,
  GetTeamMembersParamsApi,
  GetTeamMembersResponseApi,
  GetLeadAssignmentsParamsApi,
  GetLeadAssignmentsResponseApi,
  PostTeamsCreateBodyApi,
  PutTeamsUpdateBodyApi,
  LeadAssignmentWithRelationsApi,
  PostLeadAssignmentBodyApi,
  PutLeadAssignmentBodyApi,
  PostBulkLeadAssignmentBodyApi,
  BulkLeadAssignmentResponseApi,
  PostTeamMemberBodyApi,
  PutTeamMemberBodyApi,
} from "@/config/api-types";

function leadApiParamsSerializer(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) searchParams.append(key, String(item));
    } else {
      searchParams.append(key, String(value));
    }
  }
  return searchParams.toString();
}

const teamsAxios = axios.create({
  baseURL: API_CONFIG.LEAD_URL,
  paramsSerializer: leadApiParamsSerializer,
});

teamsAxios.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

teamsAxios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

/** GET /teams — list teams */
export async function getTeams(): Promise<TeamApi[]> {
  const { data } = await teamsAxios.get<TeamApi[]>("/teams");
  return Array.isArray(data) ? data : [];
}

/** GET /teams/with-details — teams with members and leads */
export async function getTeamsWithDetails(): Promise<TeamWithDetailsApi[]> {
  const { data } = await teamsAxios.get<TeamWithDetailsApi[]>("/teams/with-details");
  return Array.isArray(data) ? data : [];
}

/** GET /teams/employee/:employeeId — employee's teams */
export async function getTeamsByEmployee(employeeId: string): Promise<TeamApi[]> {
  const { data } = await teamsAxios.get<TeamApi[]>(`/teams/employee/${employeeId}`);
  return Array.isArray(data) ? data : [];
}

/** GET /teams/:teamId/members — team members (paginated: items + total) */
export async function getTeamMembers(
  teamId: string,
  params?: GetTeamMembersParamsApi
): Promise<GetTeamMembersResponseApi> {
  const { data } = await teamsAxios.get<GetTeamMembersResponseApi>(
    `/teams/${teamId}/members`,
    { params: params ?? { skip: 0, take: 20 } }
  );
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    total: typeof data?.total === "number" ? data.total : 0,
  };
}

/** GET /teams/team/:teamId/leads — team leads with pagination and filters.
 * Query (see GET_TEAM_LEADS_QUERY_PARAMS in api-reference): skip, take, status, leadOwnerId (UUID), dateFrom, dateTo, leadOwnerInTeam.
 * leadOwnerId = только лиды одного сотрудника (владельца).
 */
export async function getTeamLeads(
  teamId: string,
  params?: GetTeamLeadsParamsApi
): Promise<GetTeamLeadsResponseApi> {
  const { data } = await teamsAxios.get<GetTeamLeadsResponseApi>(
    `/teams/team/${teamId}/leads`,
    { params: params ?? {} }
  );
  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
  };
}

/** POST /teams — create team */
export async function createTeam(body: PostTeamsCreateBodyApi): Promise<TeamApi> {
  const { data } = await teamsAxios.post<TeamApi>("/teams", body);
  return data;
}

/** PUT /teams/:id — update team */
export async function updateTeam(teamId: string, body: PutTeamsUpdateBodyApi): Promise<TeamApi> {
  const { data } = await teamsAxios.put<TeamApi>(`/teams/${teamId}`, body);
  return data;
}

/** DELETE /teams/:id — delete team */
export async function deleteTeam(teamId: string): Promise<{ message: string }> {
  const { data } = await teamsAxios.delete<{ message: string }>(`/teams/${teamId}`);
  return data;
}

// ==================== Lead Assignments ====================

/** GET /lead-assignments — list assignments (lead → team) */
export async function getLeadAssignments(): Promise<LeadAssignmentWithRelationsApi[]> {
  const { data } = await teamsAxios.get<LeadAssignmentWithRelationsApi[]>("/lead-assignments");
  return Array.isArray(data) ? data : [];
}

/** GET /lead-assignments?teamId= — filter by team, optional pagination (skip, take). Returns items + total.
 *  If backend ignores skip/take and returns all items, we slice client-side so only the requested page is returned. */
export async function getLeadAssignmentsByTeam(
  teamId: string,
  params?: GetLeadAssignmentsParamsApi
): Promise<GetLeadAssignmentsResponseApi> {
  const { data } = await teamsAxios.get<GetLeadAssignmentsResponseApi | LeadAssignmentWithRelationsApi[]>(
    "/lead-assignments",
    { params: { teamId, ...params } }
  );
  const skip = params?.skip ?? 0;
  const take = params?.take ?? 30;

  let rawItems: LeadAssignmentWithRelationsApi[];
  let total: number;

  if (Array.isArray(data)) {
    rawItems = data;
    total = data.length;
  } else {
    rawItems = Array.isArray(data?.items) ? data.items : [];
    total = typeof data?.total === "number" ? data.total : rawItems.length;
  }

  const items = take > 0 ? rawItems.slice(skip, skip + take) : rawItems;

  return { items, total };
}

/** GET /lead-assignments/:id */
export async function getLeadAssignmentById(id: string): Promise<LeadAssignmentWithRelationsApi | null> {
  try {
    const { data } = await teamsAxios.get<LeadAssignmentWithRelationsApi>(`/lead-assignments/${id}`);
    return data;
  } catch {
    return null;
  }
}

/** POST /lead-assignments — assign lead to team (single lead; previous assignments removed) */
export async function createLeadAssignment(body: PostLeadAssignmentBodyApi): Promise<LeadAssignmentApi> {
  const { data } = await teamsAxios.post<LeadAssignmentApi>("/lead-assignments", body);
  return data;
}

/** POST /lead-assignments/bulk — bulk assign leads to team (removed from old teams, added to new) */
export async function bulkAssignLeadsToTeam(
  body: PostBulkLeadAssignmentBodyApi
): Promise<BulkLeadAssignmentResponseApi> {
  const { data } = await teamsAxios.post<BulkLeadAssignmentResponseApi>("/lead-assignments/bulk", body);
  return {
    assigned: data?.assigned ?? [],
    removedCount: data?.removedCount ?? 0,
  };
}

/** PUT /lead-assignments/:id */
export async function updateLeadAssignment(id: string, body: PutLeadAssignmentBodyApi): Promise<LeadAssignmentApi> {
  const { data } = await teamsAxios.put<LeadAssignmentApi>(`/lead-assignments/${id}`, body);
  return data;
}

/** DELETE /lead-assignments/:id — unassign lead from team */
export async function deleteLeadAssignment(id: string): Promise<{ id: string }> {
  const { data } = await teamsAxios.delete<{ id: string }>(`/lead-assignments/${id}`);
  return data;
}

// ==================== Team Members ====================

/** GET /team-members — list all members (or with query teamId if supported) */
export async function getAllTeamMembers(params?: { teamId?: string }): Promise<TeamMemberApi[]> {
  const { data } = await teamsAxios.get<TeamMemberApi[]>("/team-members", { params });
  return Array.isArray(data) ? data : [];
}

/** GET /team-members/:id */
export async function getTeamMemberById(id: string): Promise<TeamMemberApi | null> {
  try {
    const { data } = await teamsAxios.get<TeamMemberApi>(`/team-members/${id}`);
    return data;
  } catch {
    return null;
  }
}

/** POST /team-members — add employee to team (body: teamId, employeeId, role — camelCase, UUID). */
export async function createTeamMember(body: PostTeamMemberBodyApi): Promise<TeamMemberApi> {
  const { data } = await teamsAxios.post<TeamMemberApi>("/team-members", body, {
    headers: { "Content-Type": "application/json" },
  });
  return data;
}

/** PUT /team-members/:id — update role */
export async function updateTeamMember(id: string, body: PutTeamMemberBodyApi): Promise<TeamMemberApi> {
  const { data } = await teamsAxios.put<TeamMemberApi>(`/team-members/${id}`, body);
  return data;
}

/** DELETE /team-members/:id — remove member from team */
export async function deleteTeamMember(id: string): Promise<{ id: string }> {
  const { data } = await teamsAxios.delete<{ id: string }>(`/team-members/${id}`);
  return data;
}
