// путь под свой проектimport { Lead, GetLeadsParams } from "../types";
import { GetNoteParams, LeadNote } from "../types";
import { axiosInstance } from "./axiosInstance";

export async function createNote(
    leadId: string,
    params: { content: string }
): Promise<LeadNote> {
    const { data } = await axiosInstance.post(`/leads/${leadId}/notes`,
        params,
    );
    console.log(data)
    return data;
}