import { create } from "zustand";

const STORAGE_KEY_PREFIX = "crm_lead_list_scroll_";

export function getLeadListScrollStored(key: string): number | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const v = sessionStorage.getItem(STORAGE_KEY_PREFIX + key);
    return v != null ? Number(v) : undefined;
  } catch {
    return undefined;
  }
}

export function setLeadListScrollStored(key: string, value: number): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY_PREFIX + key, String(value));
  } catch {}
}

interface LeadListScrollState {
  setScroll: (key: string, value: number) => void;
  getScroll: (key: string) => number | undefined;
}

export const useLeadListScrollStore = create<LeadListScrollState>((set, get) => ({
  setScroll: (key, value) => {
    setLeadListScrollStored(key, value);
  },

  getScroll: (key) => getLeadListScrollStored(key),
}));
