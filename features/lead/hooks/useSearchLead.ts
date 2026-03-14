"use client";

import { useEffect, useState, useCallback } from "react";
import { Lead } from "../types";
import type { LeadStatus } from "../types";
import { searchLeads } from "../api/searchLead.api";

export interface SearchFilters {
  /** One or more statuses; stored as single value when one chip selected, array when multiple */
  status?: LeadStatus | LeadStatus[];
  dateFrom?: string;
  dateTo?: string;
  leadOwnerId?: string;
}

export function useSearchLeads(initialQuery = "") {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>({});

  const take = 30;

  const loadLeads = useCallback(
    async (pageToLoad: number, isInitial = false) => {
      if (!isInitial && (!hasMore || loadingMore)) return;
      if (!query.trim()) {
        setLeads([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const skip = (pageToLoad - 1) * take;
        const statusArr = Array.isArray(filters.status) ? filters.status : filters.status != null ? [filters.status] : [];
        const res = await searchLeads({
          query,
          skip,
          take,
          status: statusArr.length ? statusArr : undefined,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          leadOwnerId: filters.leadOwnerId,
        });

        const newLeads = res.items ?? [];
        if (newLeads.length < take) setHasMore(false);

        setTotal(res.total ?? 0);
        setLeads((prev) => {
          if (isInitial) return newLeads;
          const existingIds = new Set(prev.map((l) => l.id));
          return [...prev, ...newLeads.filter((l) => !existingIds.has(l.id))];
        });
      } catch (error: unknown) {
        console.error("Error loading leads:", error);
        const err = error as { response?: { status?: number; data?: unknown } };
        if (err.response?.status === 400 && err.response?.data) {
          const d = err.response.data as { message?: string[] };
          console.error("Validation/400 details:", d.message ?? err.response.data);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [query, filters, hasMore, loadingMore]
  );

  // Reset and initial fetch only when query or filters change (not when hasMore/loadLeads changes),
  // to avoid a request loop when the search returns 0 results
  useEffect(() => {
    setLeads([]);
    setPage(1);
    setHasMore(true);
    if (query.trim()) {
      loadLeads(1, true);
    } else {
      setTotal(0);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only query + filters; loadLeads omitted to avoid refetch loop on empty result
  }, [query, filters]);

  useEffect(() => {
    if (page > 1) loadLeads(page);
  }, [page]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) setPage((prev) => prev + 1);
  }, [loadingMore, hasMore]);

  const applyFilters = useCallback((next: SearchFilters) => {
    setFilters(next);
  }, []);

  return {
    leads,
    total,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    query,
    setQuery,
    setLeads,
    filters,
    setFilters: applyFilters,
  };
}