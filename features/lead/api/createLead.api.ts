import { axiosInstance } from "./axiosInstance";
import type { Lead } from "../types";

export interface CreateLeadPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** UUID сотрудника — владелец лида (как в фильтре Owner) */
  leadOwnerId?: string;
  externalLeadId?: string;
  leadSource?: string;
  description?: string;
  /** Массив UUID аффилиаторов — для каждого создаётся LeadAffiliate */
  affiliateIds?: string[];
}

export async function createLead(payload: CreateLeadPayload): Promise<Lead> {
  const { data } = await axiosInstance.post<Lead>("/leads", {
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    email: payload.email.trim(),
    phone: payload.phone.trim(),
    ...(payload.leadOwnerId?.trim() && { leadOwnerId: payload.leadOwnerId.trim() }),
    ...(payload.externalLeadId?.trim() && { externalLeadId: payload.externalLeadId.trim() }),
    ...(payload.leadSource?.trim() && { leadSource: payload.leadSource.trim() }),
    ...(payload.description?.trim() && { description: payload.description.trim() }),
    ...(payload.affiliateIds?.length && { affiliateIds: payload.affiliateIds }),
  });
  return {
    ...data,
    createdAt: new Date((data as unknown as { createdAt: string }).createdAt),
    updatedAt: new Date((data as unknown as { updatedAt: string }).updatedAt),
  } as Lead;
}
