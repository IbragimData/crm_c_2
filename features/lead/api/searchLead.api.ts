import { axiosInstance } from "./axiosInstance";
import { Lead } from "../types";
import type { LeadStatus } from "../types";

export interface SearchLeadsParams {
  query: string;
  skip?: number;
  take?: number;
  status?: LeadStatus[];
  dateFrom?: string;
  dateTo?: string;
  leadOwnerId?: string;
}

export interface SearchLeadsResponse {
  items: Lead[];
  total: number;
}

export async function searchLeads(params: SearchLeadsParams): Promise<SearchLeadsResponse> {
  const body: Record<string, unknown> = {
    query: params.query,
    ...(params.skip != null && { skip: params.skip }),
    ...(params.take != null && { take: params.take }),
  };
  const statusArr = Array.isArray(params.status) ? params.status : params.status != null ? [params.status] : [];
  if (statusArr.length) body.status = statusArr;
  if (params.dateFrom) body.dateFrom = params.dateFrom;
  if (params.dateTo) body.dateTo = params.dateTo;
  if (params.leadOwnerId) body.leadOwnerId = params.leadOwnerId;

  const { data } = await axiosInstance.post<SearchLeadsResponse>("/leads/search", body);
  return { items: data.items ?? [], total: data.total ?? 0 };
}