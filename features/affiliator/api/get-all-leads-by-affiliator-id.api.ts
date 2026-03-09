import { axiosInstance } from "./axiosInstance";
import { Lead, GetLeadsParams } from "../../lead/types";

export interface GetLeadsByAffiliatorResponse {
  items: Lead[];
  total?: number;
}

export async function getAllLeadsByAffiliatorId(
  employeeId: string,
  params: GetLeadsParams = {}
): Promise<GetLeadsByAffiliatorResponse> {
  const { data } = await axiosInstance.get(`/leads/affiliate/${employeeId}`, {
    params,
  });
  return {
    items: data.items ?? [],
    total: data.total != null ? Number(data.total) : undefined,
  };
}