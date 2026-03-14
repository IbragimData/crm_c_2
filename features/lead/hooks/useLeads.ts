"use client";

import { useEffect } from "react";
import { useLeadsStore } from "../store/useLeadsStore";

export function useLeads() {
  const {
    leads,
    loading,
    page,
    total,
    pageSize,
    goToPage,
    setFilters,
    setLeads,
    setPageSize,
    loadLeads,
    filtersKey,
    filters,
  } = useLeadsStore();

  useEffect(() => {
    loadLeads();
  }, [filtersKey]);

  const hasMore =
    total !== null
      ? page * pageSize < total
      : leads.length >= pageSize;

  return {
    leads,
    loading,
    page,
    total,
    pageSize,
    setPageSize,
    hasMore,
    goToPage,
    setFilters,
    setLeads,
    filters,
  };
}
