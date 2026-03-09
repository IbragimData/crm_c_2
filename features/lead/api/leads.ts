import { axiosInstance } from "./axiosInstance"; // путь под свой проект
import { Lead, GetLeadsParams } from "../types";

export interface GetLeadsResponse {
  items: Lead[];
  total?: number;
}

export async function getLeads(
  params: GetLeadsParams = {}
): Promise<GetLeadsResponse> {
  const { data } = await axiosInstance.get("/leads", {
    params,
  });

  return {
    items: data.items ?? [],
    total: data.total != null ? Number(data.total) : undefined,
  };
}