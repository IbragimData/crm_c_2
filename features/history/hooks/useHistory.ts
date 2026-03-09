"use client";

import { useEffect, useState, useCallback } from "react";
import { LeadHistory } from "../types";
import { getHistoryByLeadId } from "../api/history-by-lead-id";

interface Filters {
  dateFrom?: string;
  dateTo?: string;
}

export function useLeadHistory(leadId: string) {
  const [history, setHistory] = useState<LeadHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({});
  
  const take = 30;

  const loadHistory = useCallback(
    async (pageToLoad: number, isInitial = false) => {
      if (!hasMore && !isInitial) return;

      if (!isInitial) setLoadingMore(true);

      try {
        const skip = (pageToLoad - 1) * take;

        const newHistory = await getHistoryByLeadId(leadId, {
          skip,
          take,
          ...filters,
        });

        if (newHistory.length < take) {
          setHasMore(false);
        }

        setHistory((prev) => {
          if (isInitial) return newHistory;

          const existingIds = new Set(prev.map((h) => h.id));
          const uniqueNew = newHistory.filter((h) => !existingIds.has(h.id));
          return [...prev, ...uniqueNew];
        });
      } catch (err) {
        console.error("Error loading lead history:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [leadId, filters, hasMore]
  );

  // 🔹 При смене фильтров — полный ресет
  useEffect(() => {
    setHistory([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);

    loadHistory(1, true);
  }, [filters, leadId]);

  // 🔹 Подгрузка страниц
  useEffect(() => {
    if (page > 1) {
      loadHistory(page);
    }
  }, [page]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      setPage((p) => p + 1);
    }
  }, [loadingMore, hasMore]);

  return {
    history,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    setFilters,
    setHistory, // 👈 если нужно обновлять вручную
  };
}