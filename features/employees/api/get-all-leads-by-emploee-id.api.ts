import { axiosInstance } from "@/features/lead";
import { Lead, GetLeadsParams } from "../../lead/types";

export interface GetLeadsByEmployeeResponse {
  items: Lead[];
  total?: number;
}

export async function getAllLeadsByEmploeeId(
  employeeId: string,
  params: GetLeadsParams = {}
): Promise<GetLeadsByEmployeeResponse> {
  const { data } = await axiosInstance.get(`/leads/emploee/${employeeId}`, {
    params,
  });
  return {
    items: data.items ?? [],
    total: data.total != null ? Number(data.total) : undefined,
  };
}