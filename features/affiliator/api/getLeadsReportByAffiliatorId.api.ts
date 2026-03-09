import { getAllLeadsByAffiliatorId } from "./get-all-leads-by-affiliator-id.api";
import type { Lead } from "../../lead/types";

const REPORT_PAGE_SIZE = 500;

/**
 * Fetch all leads for one affiliator in a date range (paginated). Use for affiliation reports.
 */
export async function getLeadsReportByAffiliatorId(params: {
  affiliateId: string;
  dateFrom: string;
  dateTo: string;
}): Promise<Lead[]> {
  const all: Lead[] = [];
  let skip = 0;

  while (true) {
    const res = await getAllLeadsByAffiliatorId(params.affiliateId, {
      skip,
      take: REPORT_PAGE_SIZE,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    });
    const chunk = res.items ?? [];
    all.push(...chunk);
    if (chunk.length < REPORT_PAGE_SIZE) break;
    skip += REPORT_PAGE_SIZE;
  }
  return all;
}
