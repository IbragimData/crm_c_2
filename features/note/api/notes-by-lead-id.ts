// путь под свой проектimport { Lead, GetLeadsParams } from "../types";
import { GetNoteParams, LeadNote } from "../types";
import { axiosInstance } from "./axiosInstance";

export async function getNotesByLeadId(
  leadId: string,
  params: GetNoteParams = {}
): Promise<LeadNote[]> {
  const { data } = await axiosInstance.get(`/leads/${leadId}/notes`, {
    params,
  });

  return data.items;
}