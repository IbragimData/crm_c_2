"use client";

import { useEffect, useState, useCallback } from "react";
import { Lead } from "../types";
import { searchLeads } from "../api/searchLead.api";

export function useSearchLeads(initialQuery = "") {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState(initialQuery);

  const take = 30;

  const loadLeads = useCallback(
    async (pageToLoad: number, isInitial = false) => {
      if (!isInitial && (!hasMore || loadingMore)) return;

      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const skip = (pageToLoad - 1) * take;

        const newLeads = await searchLeads({
          query,
          skip,
          take,
        });

        if(!query){
          setLoading(false)
          setLeads([])
          return
        }
        // если пришло меньше чем take — значит это последняя страница
        if (newLeads.length < take) {
          setHasMore(false);
        }

        setLeads((prev) => {
          if (isInitial) return newLeads;

          const existingIds = new Set(prev.map((l) => l.id));

          return [
            ...prev,
            ...newLeads.filter((l) => !existingIds.has(l.id)),
          ];
        });
      } catch (error) {
        console.error("Error loading leads:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [query, hasMore, loadingMore]
  );

  // 🔹 При изменении query — полный ресет
  useEffect(() => {
    setLeads([]);
    setPage(1);
    setHasMore(true);

    if (query.trim()) {
      loadLeads(1, true);
    }
  }, [query]);

  // 🔹 Подгрузка следующих страниц
  useEffect(() => {
    if (page > 1) {
      loadLeads(page);
    }
  }, [page]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [loadingMore, hasMore]);

  return {
    leads,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    query,
    setQuery,
    setLeads,
  };
}