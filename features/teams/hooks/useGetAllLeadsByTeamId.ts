"use client";

import { useEffect, useState, useCallback } from "react";
import { getTeamLeads } from "../api/teams.api";
import type { Lead } from "@/features/lead/types";
import type { LeadStatus } from "@/features/lead/types";
import type { GetTeamLeadsParamsApi } from "@/config/api-types";
import type { LeadApi, LeadAffiliateApi } from "@/config/api-types";

export interface TeamLeadsFilters {
  status?: LeadStatus | LeadStatus[];
  dateFrom?: string;
  dateTo?: string;
  leadOwnerId?: string;
  /** true = only leads whose owner is a team member */
  leadOwnerInTeam?: boolean;
}

/** Page size in UI (1–100). Backend accepts any skip/take and returns a slice. */
const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 100;

function mapLeadAffiliateApiToLeadAffiliate(a: LeadAffiliateApi): { id: string; leadId: string; affiliateId: string; createdAt: Date } {
  return {
    id: a.id,
    leadId: a.leadId,
    affiliateId: a.affiliateId,
    createdAt: new Date(a.createdAt),
  };
}

function mapLeadApiToLead(item: LeadApi): Lead {
  const mapped = {
    ...item,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
    firstVisit: item.firstVisit ? new Date(item.firstVisit) : null,
    mostRecentVisit: item.mostRecentVisit ? new Date(item.mostRecentVisit) : null,
    leadAffiliates: (item.leadAffiliates ?? []).map(mapLeadAffiliateApiToLeadAffiliate),
  };
  return mapped as unknown as Lead;
}

export function useGetAllLeadsByTeamId(teamId: string, expectedTotal?: number) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [filters, setFilters] = useState<TeamLeadsFilters>({});

  const loadPage = useCallback(
    async (pageNum: number, take: number) => {
      if (!teamId) return;
      setLoading(true);
      try {
        const skip = (pageNum - 1) * take;
        const takeRes =
          pageNum === 1 && expectedTotal != null
            ? Math.min(take, expectedTotal)
            : take;

        const params: GetTeamLeadsParamsApi = {
          skip,
          take: takeRes,
        };
        if (filters.status != null) params.status = filters.status;
        if (filters.dateFrom) params.dateFrom = filters.dateFrom;
        if (filters.dateTo) params.dateTo = filters.dateTo;
        if (filters.leadOwnerId) params.leadOwnerId = filters.leadOwnerId;
        if (filters.leadOwnerInTeam === true) params.leadOwnerInTeam = true;

        const res = await getTeamLeads(teamId, params);
        const rawItems = res.items ?? [];
        const newLeads = rawItems.map((item) => mapLeadApiToLead(item));

        setLeads(newLeads);
        const totalFromApi = res.total != null ? res.total : null;
        setTotal(expectedTotal ?? totalFromApi ?? (rawItems.length < takeRes ? skip + rawItems.length : null));
        setHasMore(
          rawItems.length >= takeRes ||
            (totalFromApi != null && skip + rawItems.length < totalFromApi)
        );
      } catch (err) {
        console.error("Error loading team leads:", err);
        setLeads([]);
      } finally {
        setLoading(false);
      }
    },
    [teamId, filters, expectedTotal]
  );

  useEffect(() => {
    setPage(1);
    loadPage(1, pageSize);
  }, [filters, expectedTotal, pageSize]);

  const goToPage = useCallback(
    (pageNum: number) => {
      if (pageNum < 1 || pageNum === page) return;
      setPage(pageNum);
      loadPage(pageNum, pageSize);
    },
    [page, loadPage, pageSize]
  );

  const setPageSize = useCallback((size: number) => {
    const n = Math.max(1, Math.min(MAX_PAGE_SIZE, Math.floor(size)));
    setPageSizeState(n);
    setPage(1);
    setLeads([]);
    setTotal(null);
  }, []);

  const refresh = useCallback(() => {
    loadPage(page, pageSize);
  }, [page, loadPage, pageSize]);

  return {
    leads,
    setLeads,
    loading,
    page,
    total,
    pageSize,
    setPageSize,
    hasMore,
    goToPage,
    refresh,
    setFilters,
    filters,
  };
}
