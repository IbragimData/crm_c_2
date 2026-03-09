import { create } from "zustand";
import type { BreakSession, BreakType } from "../types";
import {
  startBreak as apiStartBreak,
  endBreak as apiEndBreak,
  getStoredActiveBreak,
  setStoredActiveBreak,
} from "../api/breaks.api";

interface BreaksState {
  /** Current active break (agent is on break). */
  currentBreak: BreakSession | null;
  /** Set from storage on init. */
  setCurrentBreak: (s: BreakSession | null) => void;
  /** Start a break. */
  startBreak: (employeeId: string, employeeName: string, breakType: BreakType) => Promise<BreakSession>;
  /** End current break. */
  endBreak: () => Promise<BreakSession | null>;
  /** Hydrate from localStorage (call once on app load). */
  hydrate: () => void;
  clearError: () => void;
  error: string | null;
}

export const useBreaksStore = create<BreaksState>((set, get) => ({
  currentBreak: null,
  error: null,

  setCurrentBreak: (currentBreak) => {
    setStoredActiveBreak(currentBreak);
    set({ currentBreak });
  },

  clearError: () => set({ error: null }),

  startBreak: async (employeeId, employeeName, breakType) => {
    set({ error: null });
    try {
      const session = await apiStartBreak(employeeId, employeeName, breakType);
      set({ currentBreak: session });
      return session;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Не удалось начать перерыв на сервере.";
      set({ error: msg });
      throw e;
    }
  },

  endBreak: async () => {
    const { currentBreak } = get();
    if (!currentBreak) return null;
    set({ error: null });
    try {
      const completed = await apiEndBreak(currentBreak.id, currentBreak.employeeId);
      set({ currentBreak: null });
      return completed;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Не удалось сохранить конец перерыва на сервер.";
      set({ error: msg, currentBreak: null });
      setStoredActiveBreak(null);
      throw e;
    }
  },

  hydrate: () => {
    const active = getStoredActiveBreak();
    set({ currentBreak: active });
  },
}));
