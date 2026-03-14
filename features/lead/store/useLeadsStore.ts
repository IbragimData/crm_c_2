import { create } from "zustand";
import { getLeads } from "../api";
import { Lead, LeadStatus } from "../types";

const CACHE_TTL_MS = 2 * 60 * 1000;
export const DEFAULT_LEADS_PAGE_SIZE = 100;

export interface LeadsFilters {
  status?: LeadStatus | LeadStatus[];
  dateFrom?: string;
  dateTo?: string;
  leadOwnerId?: string;
}

function getFiltersKey(f: LeadsFilters): string {
  return JSON.stringify(f ?? {});
}

interface LeadsState {
  leads: Lead[];
  loading: boolean;
  page: number;
  total: number | null;
  pageSize: number;
  filters: LeadsFilters;
  lastFetchedAt: number | null;
  filtersKey: string;

  setLeads: (leads: Lead[] | ((prev: Lead[]) => Lead[])) => void;
  setFilters: (filters: LeadsFilters) => void;
  setPageSize: (pageSize: number) => void;
  loadLeads: (forceRefresh?: boolean) => Promise<void>;
  goToPage: (page: number) => void;
  invalidateCache: () => void;
}

export const useLeadsStore = create<LeadsState>((set, get) => ({
  leads: [],
  loading: false,
  page: 1,
  total: null,
  pageSize: DEFAULT_LEADS_PAGE_SIZE,
  filters: {},
  lastFetchedAt: null,
  filtersKey: getFiltersKey({}),

  setLeads: (leadsOrUpdater) => {
    set((state) => ({
      leads:
        typeof leadsOrUpdater === "function"
          ? leadsOrUpdater(state.leads)
          : leadsOrUpdater,
    }));
  },

  setFilters: (filters) => {
    const filtersKey = getFiltersKey(filters);
    const prevKey = get().filtersKey;
    if (prevKey === filtersKey) return;
    set({
      filters,
      filtersKey,
      leads: [],
      page: 1,
      total: null,
      lastFetchedAt: null,
    });
  },

  setPageSize: (pageSize) => {
    const size = Math.max(1, Math.min(100, Math.floor(pageSize)));
    set({
      pageSize: size,
      page: 1,
      leads: [],
      total: null,
      lastFetchedAt: null,
    });
    get().loadLeads();
  },

  invalidateCache: () => {
    set({ lastFetchedAt: null, leads: [], page: 1, total: null });
  },

  loadLeads: async (forceRefresh = false) => {
    const state = get();
    const take = state.pageSize;
    const now = Date.now();
    const cacheValid =
      state.lastFetchedAt != null &&
      now - state.lastFetchedAt < CACHE_TTL_MS &&
      state.filtersKey === getFiltersKey(state.filters) &&
      state.page === 1;

    if (!forceRefresh && cacheValid && state.leads.length > 0) {
      set({ loading: false });
      return;
    }

    set({ loading: true, page: 1 });

    try {
      const { filters } = get();
      const res = await getLeads({
        skip: 0,
        take,
        ...filters,
      });

      const newLeads = res.items;
      const serverTotal = res.total != null ? res.total : null;
      const hasMore = newLeads.length >= take;
      set({
        leads: newLeads,
        total: serverTotal ?? (hasMore ? null : newLeads.length),
        lastFetchedAt: Date.now(),
        loading: false,
        page: 1,
      });
    } catch (err) {
      console.error("Error loading leads:", err);
      set({ loading: false, page: 1 });
    }
  },

  goToPage: (pageNum: number) => {
    const state = get();
    const { page, filters, pageSize: take } = state;
    if (pageNum < 1 || pageNum === page) return;
    set({ loading: true });
    const skip = (pageNum - 1) * take;
    getLeads({ skip, take, ...filters })
      .then((res) => {
        const items = res.items;
        const serverTotal = res.total != null ? res.total : null;
        const hasMore = items.length >= take;
        set((s) => ({
          leads: items,
          total: serverTotal ?? (hasMore ? s.total : skip + items.length),
          loading: false,
          page: pageNum,
        }));
      })
      .catch((err) => {
        console.error("Error loading page:", err);
        set({ loading: false });
      });
  },
}));
