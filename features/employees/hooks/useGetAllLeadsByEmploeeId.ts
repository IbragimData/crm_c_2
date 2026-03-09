"use client";

import { useEffect, useState, useCallback } from "react";
import { getAllLeadsByEmploeeId } from "../api";
import { Lead, LeadStatus } from "../../lead";

export interface EmployeeLeadsFilters {
  status?: LeadStatus | LeadStatus[];
  dateFrom?: string;
  dateTo?: string;
}

const PAGE_SIZE = 100;

export function useGetAllLeadsByEmploeeId(id: string) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [filters, setFilters] = useState<EmployeeLeadsFilters>({});

  const loadPage = useCallback(
    async (pageNum: number) => {
      if (!id) return;
      setLoading(true);
      try {
        const skip = (pageNum - 1) * PAGE_SIZE;
        const res = await getAllLeadsByEmploeeId(id, {
          skip,
          take: PAGE_SIZE,
          ...filters,
        });
        const newLeads = res.items ?? [];
        setHasMore(newLeads.length >= PAGE_SIZE);
        setLeads(newLeads);
        setTotal(
          res.total != null
            ? res.total
            : newLeads.length < PAGE_SIZE
              ? skip + newLeads.length
              : null
        );
      } catch (err) {
        console.error("Error loading leads:", err);
        setLeads([]);
      } finally {
        setLoading(false);
      }
    },
    [id, filters]
  );

  useEffect(() => {
    setPage(1);
    loadPage(1);
  }, [filters]);

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
    loading,
    hasMore,
    page,
    total,
    pageSize: PAGE_SIZE,
    goToPage,
    refresh,
    setFilters,
    setLeads,
    filters,
  };
}
