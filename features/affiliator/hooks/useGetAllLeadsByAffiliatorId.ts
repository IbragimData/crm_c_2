"use client";

import { useEffect, useState, useCallback } from "react";
import { getAllLeadsByAffiliatorId } from "../api";
import { Lead, LeadStatus } from "../../lead";

export interface AffiliatorLeadsFilters {
  status?: LeadStatus | LeadStatus[];
  dateFrom?: string;
  dateTo?: string;
}

const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 100;

export function useGetAllLeadsByAffiliatorId(id: string) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [filters, setFilters] = useState<AffiliatorLeadsFilters>({});

  const loadPage = useCallback(
    async (pageNum: number, take: number) => {
      if (!id) return;
      setLoading(true);
      try {
        const skip = (pageNum - 1) * take;
        const res = await getAllLeadsByAffiliatorId(id, {
          skip,
          take,
          ...filters,
        });
        const newLeads = res.items ?? [];
        setHasMore(newLeads.length >= take);
        setLeads(newLeads);
        setTotal(
          res.total != null
            ? res.total
            : newLeads.length < take
              ? skip + newLeads.length
              : null
        );
      } catch (err) {
        console.error("Error loading affiliate leads:", err);
        setLeads([]);
      } finally {
        setLoading(false);
      }
    },
    [id, filters]
  );

  useEffect(() => {
    setPage(1);
    loadPage(1, pageSize);
  }, [filters, pageSize]);

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
