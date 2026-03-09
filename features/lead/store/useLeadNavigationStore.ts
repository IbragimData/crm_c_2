import { create } from "zustand";

export type LeadNavigationSource = "leads" | "affiliator" | "employee" | "team";

interface LeadNavigationState {
  leadIds: string[];
  source: LeadNavigationSource;
  sourceId: string | null;

  setLeadNavigation: (
    leadIds: string[],
    source: LeadNavigationSource,
    sourceId?: string | null
  ) => void;
}

export const useLeadNavigationStore = create<LeadNavigationState>((set) => ({
  leadIds: [],
  source: "leads",
  sourceId: null,

  setLeadNavigation: (leadIds, source, sourceId = null) => {
    set({ leadIds, source, sourceId });
  },
}));
