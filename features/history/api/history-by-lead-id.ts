// путь под свой проектimport { Lead, GetLeadsParams } from "../types";
import { GetHistoryParams, LeadHistory } from "../types";
import { axiosInstance } from "./axiosInstance";

export async function getHistoryByLeadId(
  leadId: string,
  params: GetHistoryParams = {}
): Promise<LeadHistory[]> {
  const { data } = await axiosInstance.get(`/leads/${leadId}/history`, {
    params,
  });

  return data.items;
}