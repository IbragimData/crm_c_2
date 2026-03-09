/**
 * API types for https://crm-call.pro/api/
 * (Lead: BASE_URL + "lead", Teams, etc. — per your backend)
 */

import type { LeadStatus, TeamRole } from "@/features/lead/types";

// ==================== TEAMS ====================

export interface TeamApi {
  id: string;
  name: string;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberApi {
  id: string;
  teamId: string;
  employeeId: string;
  role: TeamRole;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  team?: Pick<TeamApi, "id" | "name" | "isActive" | "createdBy" | "createdAt" | "updatedAt">;
}

export interface LeadAssignmentApi {
  id: string;
  leadId: string;
  teamId: string;
  createdBy: string | null;
  assignedAt: string;
  lead?: LeadApi;
}

export interface TeamWithDetailsApi extends TeamApi {
  members: TeamMemberApi[];
  leadAssignments: LeadAssignmentWithRelationsApi[];
}

// ==================== LEADS ====================

export interface LeadApi {
  id: string;
  shortId?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  leadOwnerId?: string | null;
  createdBy?: string | null;
  description?: string | null;
  leadSource?: string | null;
  externalLeadId?: string | null;
  modifiedBy?: string | null;
  connectedTo?: string | null;
  seedPhrases?: string | null;
  firstVisit?: string | null;
  mostRecentVisit?: string | null;
  firstPageVisited?: string | null;
  referrer?: string | null;
  averageTimeSpent?: number | null;
  numberOfChats?: number | null;
  visitorScore?: number | string | null;
  daysVisited?: number | null;
  leadAffiliates?: LeadAffiliateApi[];
}

export interface LeadAffiliateApi {
  id: string;
  leadId: string;
  affiliateId: string;
  createdAt: string;
}

// ==================== Request params & bodies ====================

export interface GetLeadsParamsApi {
  skip?: number;
  take?: number;
  status?: LeadStatus | LeadStatus[];
  dateFrom?: string;
  dateTo?: string;
  leadOwnerId?: string;
}

export interface GetTeamLeadsParamsApi {
  skip?: number;
  take?: number;
  status?: LeadStatus | LeadStatus[];
  dateFrom?: string;
  dateTo?: string;
  leadOwnerId?: string;
  /** true = только лиды, у которых lead owner — участник команды */
  leadOwnerInTeam?: boolean;
}

/** GET /teams/:teamId/members — response (paginated) */
export interface GetTeamMembersParamsApi {
  skip?: number;
  take?: number;
}

export interface GetTeamMembersResponseApi {
  items: TeamMemberApi[];
  total: number;
}

export interface GetLeadsResponseApi {
  items: LeadApi[];
  total: number;
}

export interface GetTeamLeadsResponseApi {
  items: LeadApi[];
  total: number;
}

export interface PostLeadsCreateBodyApi {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  externalLeadId?: string;
  leadSource?: string;
  description?: string;
}

export interface PostLeadsSearchBodyApi {
  query: string;
  skip?: number;
  take?: number;
}

export interface PostLeadsSearchResponseApi {
  items: LeadApi[];
  total: number;
}

export interface PostTeamsCreateBodyApi {
  name: string;
  isActive: boolean;
}

export interface PutTeamsUpdateBodyApi {
  name: string;
  isActive: boolean;
}

// ==================== Lead Assignments ====================

export interface LeadAssignmentWithRelationsApi extends LeadAssignmentApi {
  lead?: LeadApi;
  team?: Pick<TeamApi, "id" | "name" | "isActive">;
}

/** GET /lead-assignments?teamId= — params (paginated) */
export interface GetLeadAssignmentsParamsApi {
  skip?: number;
  take?: number;
}

/** GET /lead-assignments?teamId= — response (paginated) */
export interface GetLeadAssignmentsResponseApi {
  items: LeadAssignmentWithRelationsApi[];
  total: number;
}

export interface PostLeadAssignmentBodyApi {
  leadId: string;
  teamId: string;
}

export interface PutLeadAssignmentBodyApi {
  leadId?: string;
  teamId?: string;
}

/** POST /lead-assignments/bulk — request body */
export interface PostBulkLeadAssignmentBodyApi {
  teamId: string;
  leadIds: string[];
}

/** POST /lead-assignments/bulk — response */
export interface BulkLeadAssignmentResponseApi {
  assigned: Array<{
    id: string;
    leadId: string;
    teamId: string;
    createdBy: string | null;
    assignedAt: string;
  }>;
  removedCount: number;
}

// ==================== Team Members ====================

export interface PostTeamMemberBodyApi {
  teamId: string;
  employeeId: string;
  role: string;
}

export interface PutTeamMemberBodyApi {
  role?: string;
}
