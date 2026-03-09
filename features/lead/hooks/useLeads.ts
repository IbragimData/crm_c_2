"use client";

import { useEffect } from "react";
import { useLeadsStore, LEADS_PAGE_SIZE } from "../store/useLeadsStore";

export function useLeads() {
  const {
    leads,
    loading,
    page,
    total,
    goToPage,
    setFilters,
    setLeads,
    loadLeads,
    filtersKey,
    filters,
  } = useLeadsStore();

  useEffect(() => {
    loadLeads();
  }, [filtersKey]);

  const hasMore =
    total !== null
      ? page * LEADS_PAGE_SIZE < total
      : leads.length >= LEADS_PAGE_SIZE;

  return {
    leads,
    loading,
    page,
    total,
    pageSize: LEADS_PAGE_SIZE,
    hasMore,
    goToPage,
    setFilters,
    setLeads,
    filters,
  };
}
