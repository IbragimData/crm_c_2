import { getLeads } from "./leads";
import { GetLeadsParams, Lead } from "../types";

const REPORT_PAGE_SIZE = 500;

/**
 * Fetch all leads for a date range (paginates until no more). Use for reports.
 */
export async function getLeadsReport(params: {
  dateFrom: string;
  dateTo: string;
  status?: GetLeadsParams["status"];
  leadOwnerId?: string;
}): Promise<Lead[]> {
  const all: Lead[] = [];
  let skip = 0;

  while (true) {
    const { items } = await getLeads({
      skip,
      take: REPORT_PAGE_SIZE,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      status: params.status,
      leadOwnerId: params.leadOwnerId,
    });
    all.push(...items);
    if (items.length < REPORT_PAGE_SIZE) break;
    skip += REPORT_PAGE_SIZE;
  }
  return all;
}
