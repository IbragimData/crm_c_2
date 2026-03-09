"use client";

import { useEffect, useState, useCallback } from "react";
import { LeadNote } from "../types";
import { getNotesByLeadId } from "../api/notes-by-lead-id";
import { createNote } from "../api";

interface Filters {
  dateFrom?: string;
  dateTo?: string;
}

export function useLeadNotes(leadId: string) {
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({});

  const take = 30;

  const addNote = useCallback(async (data: string) => {
    try {
      const createdNote = await createNote
        (leadId, {content: data});

      // Добавляем в начало списка
      setNotes((prev) => [createdNote, ...prev]);

      return createdNote;
    } catch (err) {
      console.error("Error creating note:", err);
      throw err;
    }
  }, [leadId]);

  const loadNotes = useCallback(
    async (pageToLoad: number, isInitial = false) => {
      if (!hasMore && !isInitial) return;

      if (!isInitial) setLoadingMore(true);

      try {
        const skip = (pageToLoad - 1) * take;

        const newNotes = await getNotesByLeadId(leadId, {
          skip,
          take,
          ...filters,
        });

        if (newNotes.length < take) {
          setHasMore(false);
        }

        setNotes((prev) => {
          if (isInitial) return newNotes;

          const existingIds = new Set(prev.map((h) => h.id));
          const uniqueNew = newNotes.filter((h) => !existingIds.has(h.id));
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
    setNotes([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);

    loadNotes(1, true);
  }, [filters, leadId]);

  // 🔹 Подгрузка страниц
  useEffect(() => {
    if (page > 1) {
      loadNotes(page);
    }
  }, [page]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      setPage((p) => p + 1);
    }
  }, [loadingMore, hasMore]);

  return {
    notes,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    setFilters,
    setNotes, // 👈 если нужно обновлять вручную
    addNote
  };
}