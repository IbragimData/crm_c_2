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
  /** true = только лиды, у которых владелец — участник команды */
  leadOwnerInTeam?: boolean;
}

/** Размер одной страницы в UI (0–100, 100–200, …). Бэкенд принимает любые skip/take и возвращает срез. */
const PAGE_SIZE = 100;

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
  const [filters, setFilters] = useState<TeamLeadsFilters>({});

  const loadPage = useCallback(
    async (pageNum: number) => {
      if (!teamId) return;
      setLoading(true);
      try {
        const skip = (pageNum - 1) * PAGE_SIZE;
        const take =
          pageNum === 1 && expectedTotal != null
            ? Math.min(PAGE_SIZE, expectedTotal)
            : PAGE_SIZE;

        const params: GetTeamLeadsParamsApi = {
          skip,
          take,
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
        setTotal(expectedTotal ?? totalFromApi ?? (rawItems.length < take ? skip + rawItems.length : null));
        setHasMore(
          rawItems.length >= take ||
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
    loadPage(1);
  }, [filters, expectedTotal, loadPage]);

  const goToPage = useCallback(
    (pageNum: number) => {
      if (pageNum < 1 || pageNum === page) return;
      setPage(pageNum);
      loadPage(pageNum);
    },
    [page, loadPage]
  );

  const refresh = useCallback(() => {
    loadPage(page);
  }, [page, loadPage]);

  return {
    leads,
    setLeads,
    loading,
    page,
    total,
    pageSize: PAGE_SIZE,
    hasMore,
    goToPage,
    refresh,
    setFilters,
    filters,
  };
}
